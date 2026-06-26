import { getDb } from '@src/config/db.config'
import {
   badRequest,
   forbidden,
   internal,
   notFound,
   unauthorized,
} from '@src/errors/error-factory'
import { OtpPurpose, UserStatus } from '@src/types/enums.types'
import { extractDeviceInfo } from '@src/utils/device.utils'
import { compareHash, Hash } from '@src/utils/hash.utils'
import type { Request } from 'express'
import {
   isDeviceTrusted,
   registerDevice,
   sendDeviceVerificationOtp,
   trustDevice,
} from '../device/device.service'
import { generateAndSendOtp, resendOtp, verifyOtp } from '../otp/otp.service'
import { assertUserActive, updateLastLogin } from '../user/user.service'
import {
   type UserInput,
   type UserPublic,
   userPublicSelect,
} from '../user/user.types'
import type {
   ChangeEmailInput,
   ResendVerificationInput,
   SignInResult,
} from './auth.types'

/*───────────────── Module-level DB client ─────────────────*/
const db = getDb()

/*───────────────── Constants ─────────────────*/
const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_DURATION_MINUTES = 30
const PASSWORD_HISTORY_LIMIT = 5

/*───────────────VERIFY USER EMAIL───────────────*/
const verifyUserEmail = async (params: { userId: string; otpCode: string }) => {
   try {
      await verifyOtp({
         userId: params.userId,
         purpose: OtpPurpose.VERIFY_EMAIL,
         otpCode: params.otpCode,
      })

      /*───────────────Update User Email Verification Status───────────────*/
      await db.user.update({
         where: { id: params.userId },
         data: {
            emailVerified: true,
            emailVerifiedAt: new Date(),
            status: UserStatus.ACTIVE,
         },
      })
      return true
   } catch (error: any) {
      throw internal(
         error.message || 'Email verification failed',
         {
            entity: 'otp',
            meta: { userId: params.userId, purpose: OtpPurpose.VERIFY_EMAIL },
         },
         undefined,
         'Request a new verification code and try again.'
      )
   }
}

/*───────────────RECORD LOGIN ATTEMPT───────────────*/
const recordLoginAttempt = async (
   userId: string,
   successful: boolean,
   req: Request,
   failureReason?: string
): Promise<void> => {
   const deviceInfo = extractDeviceInfo(req)

   await db.loginAttempt.create({
      data: {
         userId,
         ipAddress: deviceInfo.ipAddress,
         userAgent: deviceInfo.userAgent,
         deviceId: deviceInfo.deviceId,
         successful,
         failureReason,
      },
   })
}

/*───────────────CHECK ACCOUNT LOCKOUT───────────────*/
const checkAccountLockout = async (userId: string): Promise<void> => {
   const user = await db.user.findUnique({
      where: { id: userId },
      select: {
         lockedUntil: true,
         failedLoginAttempts: true,
      },
   })

   if (!user) return

   // Check if account is currently locked
   if (user.lockedUntil && new Date() < user.lockedUntil) {
      const minutesRemaining = Math.ceil(
         (user.lockedUntil.getTime() - Date.now()) / (1000 * 60)
      )
      throw forbidden(
         'Account is temporarily locked due to multiple failed login attempts',
         {
            entity: 'user',
            entityId: userId,
            meta: { lockedUntil: user.lockedUntil },
         },
         { minutesRemaining },
         `Try again in ${minutesRemaining} minutes or reset your password.`
      )
   }

   // Reset lockout if expired
   if (user.lockedUntil && new Date() >= user.lockedUntil) {
      await db.user.update({
         where: { id: userId },
         data: {
            lockedUntil: null,
            failedLoginAttempts: 0,
         },
      })
   }
}

/*───────────────HANDLE FAILED LOGIN───────────────*/
const handleFailedLogin = async (
   userId: string,
   req: Request,
   reason: string
): Promise<void> => {
   await recordLoginAttempt(userId, false, req, reason)

   const user = await db.user.findUnique({
      where: { id: userId },
      select: { failedLoginAttempts: true },
   })

   if (!user) return

   const newFailedAttempts = user.failedLoginAttempts + 1

   // Lock account if max attempts reached
   if (newFailedAttempts >= MAX_LOGIN_ATTEMPTS) {
      const lockedUntil = new Date()
      lockedUntil.setMinutes(
         lockedUntil.getMinutes() + LOCKOUT_DURATION_MINUTES
      )

      await db.user.update({
         where: { id: userId },
         data: {
            failedLoginAttempts: newFailedAttempts,
            lockedUntil,
         },
      })

      throw forbidden(
         'Account locked due to multiple failed login attempts',
         { entity: 'user', entityId: userId, meta: { lockedUntil } },
         { minutesLocked: LOCKOUT_DURATION_MINUTES },
         `Account will be unlocked in ${LOCKOUT_DURATION_MINUTES} minutes or you can reset your password.`
      )
   }

   // Increment failed attempts
   await db.user.update({
      where: { id: userId },
      data: { failedLoginAttempts: newFailedAttempts },
   })

   const attemptsRemaining = MAX_LOGIN_ATTEMPTS - newFailedAttempts
   throw unauthorized(
      'Invalid email or password',
      { entity: 'auth', meta: { attemptsRemaining } },
      { field: 'password', attemptsRemaining },
      `${attemptsRemaining} attempts remaining before account lockout.`
   )
}

/*───────────────SIGNIN USER WITH EMAIL PASSWORD───────────────*/
const signIn = async (
   credentials: UserInput,
   req: Request
): Promise<SignInResult> => {
   const deviceInfo = extractDeviceInfo(req)

   const user = await db.user.findUnique({
      where: { email: credentials.email },
      select: {
         id: true,
         email: true,
         password: true,
         role: true,
         status: true,
         emailVerified: true,
         deletedAt: true,
      },
   })

   if (!user) {
      throw notFound(
         'User not found',
         { entity: 'user', meta: { email: credentials.email } },
         { email: credentials.email },
         'Verify your email address or create a new account.'
      )
   }

   // Run parallel validations and checks
   const [, deviceTrusted] = await Promise.all([
      checkAccountLockout(user.id), // This throws if locked, returns void if not
      isDeviceTrusted(user.id, deviceInfo.deviceId),
   ])

   // Check if user is scheduled for deletion
   assertUserActive({ id: user.id, deletedAt: user.deletedAt })

   // Check if email is verified
   if (!user.emailVerified) {
      throw unauthorized(
         'Please verify your email before signing in',
         { entity: 'user', entityId: user.id, meta: { emailVerified: false } },
         { emailVerified: false },
         'Check your inbox or request a new verification email.'
      )
   }

   // Verify password
   const isValidPassword = await compareHash({
      value: credentials.password,
      hashedValue: user.password,
   })

   if (!isValidPassword) {
      await handleFailedLogin(user.id, req, 'Invalid password')
      // handleFailedLogin throws, this line won't execute
      throw new Error('Unreachable')
   }

   // Register device (not trusted yet if new)
   registerDevice(user.id, req, deviceTrusted)

   // Run post-login operations in parallel
   await Promise.all([
      // Reset failed login attempts
      db.user.update({
         where: { id: user.id },
         data: {
            failedLoginAttempts: 0,
            lockedUntil: null,
         },
      }),

      // Record successful login attempt (async, don't wait)
      recordLoginAttempt(user.id, true, req).catch(console.error),
      // Update last login
      updateLastLogin(user.id),
   ])
   const userPublic: UserPublic = {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
   }
   // If device is not trusted, require 2FA
   if (!deviceTrusted) {
      await sendDeviceVerificationOtp(user.id, user.email)
      return {
         user: userPublic,
         isTrustedDevice: false,
         deviceId: deviceInfo.deviceId,
      }
   }

   return {
      user: userPublic,
      isTrustedDevice: deviceTrusted,
      deviceId: deviceInfo.deviceId,
   }
}

/*───────────────SIGN OUT───────────────*/
const signOut = async (userId: string): Promise<void> => {
   // Stateless logout – client handles token disposal
   console.log('User signed out', { userId })
}

/*───────────────REFRESH TOKEN───────────────*/
const refreshAccessToken = async (userId: string): Promise<string> => {
   const user = await db.user.findUnique({
      where: { id: userId },
      select: {
         id: true,
         deletedAt: true,
      },
   })

   if (!user) {
      throw notFound(
         'User not found',
         { entity: 'user', entityId: userId },
         { userId },
         'Login again to obtain a new session.'
      )
   }

   assertUserActive(user)

   return user.id
}

/*───────────────RESEND VERIFICATION───────────────*/
const resendVerification = async (
   params: ResendVerificationInput
): Promise<UserPublic> => {
   const user = await db.user.findUnique({
      where: { email: params.email },
      select: {
         ...userPublicSelect,
         emailVerified: true,
         deletedAt: true,
      },
   })

   if (!user) {
      throw notFound(
         'User not found',
         { entity: 'user', meta: { email: params.email } },
         { email: params.email },
         'Verify the email address or register a new account.'
      )
   }

   assertUserActive({ id: user.id, deletedAt: user.deletedAt })

   if (user.status !== UserStatus.INACTIVE) {
      throw badRequest(
         'Account is already active',
         { entity: 'user', entityId: user.id, meta: { status: user.status } },
         { status: user.status },
         'You can sign in directly.'
      )
   }

   if (user.emailVerified) {
      throw badRequest(
         'Email is already verified',
         { entity: 'user', entityId: user.id },
         { emailVerified: true },
         'Proceed to sign in.'
      )
   }

   // Resend verification OTP
   await resendOtp({
      userId: user.id,
      email: user.email,
      purpose: OtpPurpose.VERIFY_EMAIL,
   })

   return user
}

/*───────────────FORGOT PASSWORD───────────────*/
const forgotPassword = async (email: string): Promise<UserPublic> => {
   const user = await db.user.findUnique({
      where: { email },
      select: {
         ...userPublicSelect,
         deletedAt: true,
      },
   })

   if (!user) {
      throw notFound(
         'User not found',
         { entity: 'user', meta: { email } },
         { email },
         'Verify the email address or create an account.'
      )
   }

   assertUserActive({ id: user.id, deletedAt: user.deletedAt })

   await generateAndSendOtp({
      email: user.email,
      purpose: OtpPurpose.RESET_PASSWORD,
      userId: user.id,
   })

   return user
}

/*───────────────RESET PASSWORD───────────────*/
const resetPassword = async (params: {
   userId: string
   newPassword: string
   otpCode: string
}): Promise<void> => {
   await verifyOtp({
      otpCode: params.otpCode,
      purpose: OtpPurpose.RESET_PASSWORD,
      userId: params.userId,
   })

   const user = await db.user.findUnique({
      where: { id: params.userId },
      select: {
         ...userPublicSelect,
         deletedAt: true,
      },
   })

   if (!user) {
      throw notFound(
         'User not found',
         { entity: 'user', entityId: params.userId },
         { userId: params.userId },
         'Restart the password reset process.'
      )
   }

   assertUserActive(user)

   const newPasswordHash = await Hash({ value: params.newPassword })

   await db.user.update({
      where: { id: params.userId },
      data: { password: newPasswordHash },
   })
}

/*───────────────CHECK PASSWORD HISTORY───────────────*/
const checkPasswordHistory = async (
   userId: string,
   newPassword: string
): Promise<void> => {
   const passwordHistory = await db.passwordHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: PASSWORD_HISTORY_LIMIT,
   })

   for (const record of passwordHistory) {
      const isReused = await compareHash({
         value: newPassword,
         hashedValue: record.passwordHash,
      })

      if (isReused) {
         throw badRequest(
            'Cannot reuse recent passwords',
            { entity: 'auth', entityId: userId },
            { field: 'newPassword' },
            `Please choose a password you haven't used in your last ${PASSWORD_HISTORY_LIMIT} passwords.`
         )
      }
   }
}

/*───────────────ADD TO PASSWORD HISTORY───────────────*/
const addToPasswordHistory = async (
   userId: string,
   passwordHash: string
): Promise<void> => {
   // Add new password to history
   await db.passwordHistory.create({
      data: {
         userId,
         passwordHash,
      },
   })

   // Keep only recent passwords
   const allHistory = await db.passwordHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
   })

   if (allHistory.length > PASSWORD_HISTORY_LIMIT) {
      const toDelete = allHistory.slice(PASSWORD_HISTORY_LIMIT)
      await db.passwordHistory.deleteMany({
         where: {
            id: {
               in: toDelete.map((h) => h.id),
            },
         },
      })
   }
}

/*───────────────CHANGE PASSWORD (AUTHENTICATED)───────────────*/
const changePassword = async (
   userId: string,
   currentPassword: string,
   newPassword: string
): Promise<void> => {
   const user = await db.user.findUnique({
      where: { id: userId },
      select: { password: true },
   })

   if (!user) {
      throw notFound(
         'User not found',
         { entity: 'user', entityId: userId },
         { userId },
         'Login again and retry the operation.'
      )
   }

   const isValidPassword = await compareHash({
      value: currentPassword,
      hashedValue: user.password,
   })

   if (!isValidPassword) {
      throw badRequest(
         'Current password is incorrect',
         { entity: 'auth', entityId: userId },
         { field: 'currentPassword' },
         'Enter the correct current password.'
      )
   }

   // Check if new password is same as current
   const isSameAsCurrent = await compareHash({
      value: newPassword,
      hashedValue: user.password,
   })

   if (isSameAsCurrent) {
      throw badRequest(
         'New password must be different from current password',
         { entity: 'auth', entityId: userId },
         { field: 'newPassword' },
         'Please choose a different password.'
      )
   }

   // Check password history
   await checkPasswordHistory(userId, newPassword)

   const newPasswordHash = await Hash({ value: newPassword })

   // Update password
   await db.user.update({
      where: { id: userId },
      data: { password: newPasswordHash },
   })

   // Add current password to history
   await addToPasswordHistory(userId, user.password)
}

/*───────────────VERIFY DEVICE (2FA)───────────────*/
const verifyDevice = async (params: {
   userId: string
   deviceId: string
   otpCode: string
}): Promise<{ deviceId: string; isTrusted: boolean }> => {
   await verifyOtp({
      userId: params.userId,
      purpose: OtpPurpose.VERIFY_DEVICE,
      otpCode: params.otpCode,
   })

   // Trust the device after successful verification
   const updatedDevice = await trustDevice(params.userId, params.deviceId)
   return {
      deviceId: updatedDevice.deviceId,
      isTrusted: updatedDevice.isTrusted,
   }
}

/*───────────────REQUEST EMAIL CHANGE───────────────*/
const requestEmailChange = async (params: ChangeEmailInput): Promise<void> => {
   const { userId, newEmail } = params

   // Check if new email is already in use
   const existingUser = await db.user.findUnique({
      where: { email: newEmail },
   })

   if (existingUser) {
      throw badRequest(
         'Email is already in use',
         { entity: 'user', meta: { email: newEmail } },
         { field: 'newEmail' },
         'Use a different email address.'
      )
   }

   // Get current user
   const user = await db.user.findUnique({
      where: { id: userId },
      select: { email: true, deletedAt: true },
   })

   if (!user) {
      throw notFound(
         'User not found',
         { entity: 'user', entityId: userId },
         { userId },
         'Login again and retry.'
      )
   }

   assertUserActive({ id: userId, deletedAt: user.deletedAt })

   // Send OTP to new email
   await generateAndSendOtp({
      userId,
      email: newEmail,
      purpose: OtpPurpose.CHANGE_EMAIL,
   })
}

/*───────────────VERIFY EMAIL CHANGE───────────────*/
const verifyEmailChange = async (params: {
   userId: string
   newEmail: string
   otpCode: string
}): Promise<void> => {
   // Verify OTP
   await verifyOtp({
      userId: params.userId,
      purpose: OtpPurpose.CHANGE_EMAIL,
      otpCode: params.otpCode,
   })

   // Update email
   await db.user.update({
      where: { id: params.userId },
      data: {
         email: params.newEmail,
      },
   })
}

export {
   changePassword,
   forgotPassword,
   refreshAccessToken,
   requestEmailChange,
   resendVerification,
   resetPassword,
   signIn,
   signOut,
   verifyDevice,
   verifyEmailChange,
   verifyUserEmail,
}
