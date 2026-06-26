// user.service.ts

import { getDb, withTransaction } from '@src/config/db.config'
import {
   badRequest,
   conflict,
   forbidden,
   notFound,
   validationError,
} from '@src/errors/error-factory'
import { OtpPurpose, UserRole, UserStatus } from '@src/types/enums.types'
import { Hash } from '@src/utils/hash.utils'
import { generateOtpDb, sendOtpEmail } from '../otp/otp.service'
import type {
   UserInput,
   UserProfileInput,
   UserProfilePublic,
   UserPublic,
} from './user.types'
import { userProfilePublicSelect, userPublicSelect } from './user.types'

/*───────────────── Module-level DB client ─────────────────*/
const db = getDb()

/*───────────────── Constants ─────────────────*/
const DELETION_GRACE_DAYS = 30

/*───────────────── Read Services ─────────────────*/
export const getCurrentUser = async (userId: string) => {
   const user = await db.user.findUnique({
      where: { id: userId },
      select: {
         ...userPublicSelect,
         emailVerified: true,
         lastLoginAt: true,
         createdAt: true,
         updatedAt: true,
         userProfile: {
            select: userProfilePublicSelect,
         },
      },
   })

   if (!user) {
      throw notFound(
         'User not found',
         { entity: 'user', entityId: userId },
         { userId },
         'Login again to continue.'
      )
   }

   return user
}

export const getUserById = async (
   userId: string
): Promise<UserPublic & { deletedAt: Date | null }> => {
   if (!userId)
      throw badRequest(
         'userId is required',
         { entity: 'user', meta: { field: 'userId', provided: userId } },
         { field: 'userId' },
         'Provide a valid userId parameter.'
      )

   const user = await db.user.findUnique({
      where: { id: userId },
      select: { ...userPublicSelect, deletedAt: true },
   })

   if (!user)
      throw notFound(
         'User not found',
         { entity: 'user', entityId: userId },
         { userId },
         'Verify the userId or create a new account.'
      )

   return user
}

export const getUserByEmail = async (
   email: string
): Promise<UserPublic & { deletedAt: Date | null }> => {
   if (!email)
      throw badRequest(
         'Email is required',
         { entity: 'user', meta: { field: 'email', provided: email } },
         { field: 'email' },
         'Provide a valid email address.'
      )

   const user = await db.user.findUnique({
      where: { email },
      select: { ...userPublicSelect, deletedAt: true },
   })

   if (!user)
      throw notFound(
         'User not found',
         { entity: 'user', meta: { email } },
         { email },
         'Verify the email or register a new account.'
      )

   return user
}

export const getUserIfExists = async (params: {
   userId?: string
   email?: string
}): Promise<UserPublic & { deletedAt: Date | null }> => {
   const { userId, email } = params

   if (userId) return getUserById(userId)
   if (email) return getUserByEmail(email)

   throw badRequest(
      'userId or email is required',
      { entity: 'user', meta: params },
      { required: ['userId', 'email'] },
      'Provide either userId or email.'
   )
}

/*───────────────── Domain Guards ─────────────────*/
export const assertUserActive = (user: {
   id: string
   deletedAt: Date | null
}) => {
   if (user.deletedAt) {
      const deletedAt = new Date(user.deletedAt)
      const now = new Date()
      const daysPassed = Math.floor(
         (now.getTime() - deletedAt.getTime()) / (1000 * 60 * 60 * 24)
      )
      const remainingDays = Math.max(DELETION_GRACE_DAYS - daysPassed, 0)

      const details = {
         deletedAt,
         remainingDays,
         canReactivate: remainingDays > 0,
      }

      const suggestion = remainingDays
         ? 'You can reactivate your account within the grace period by contacting support.'
         : 'Your account deletion period has expired. Please contact support for further assistance.'

      throw forbidden(
         'User account is scheduled for deletion',
         { entity: 'user', entityId: user.id, meta: details },
         details,
         suggestion
      )
   }
}

/*───────────────── Create User ─────────────────*/
export const createUser = async (userInput: UserInput): Promise<UserPublic> => {
   const result = await withTransaction(async (tx) => {
      // ───────────────Check for existing user──────────────
      const existingUser = await tx.user.findUnique({
         where: { email: userInput.email },
         select: { id: true, deletedAt: true },
      })

      if (existingUser) {
         assertUserActive(existingUser)

         throw conflict(
            'Email already in use',
            { entity: 'user', meta: { email: userInput.email } },
            { email: userInput.email },
            'Use a different email or recover the existing account.'
         )
      }

      // ───────────────Hash password──────────────
      const hashedPassword = await Hash({ value: userInput.password })

      // ───────────────Create user──────────────
      const newUser = await tx.user.create({
         data: {
            email: userInput.email,
            password: hashedPassword,
            status: UserStatus.INACTIVE,
         },
         select: userPublicSelect,
      })

      // ───────────────Initiate User Profile──────────────
      await tx.userProfile.create({
         data: {
            userId: newUser.id,
         },
      })
      // ───────────────Generate OTP (DB only)──────────────
      const otpPayload = await generateOtpDb(
         tx,
         newUser.id,
         OtpPurpose.VERIFY_EMAIL
      )

      return { newUser, otpPayload }
   })

   // ✅ Runs ONLY after successful commit
   await sendOtpEmail(
      userInput.email,
      result.otpPayload.otp,
      result.otpPayload.expiredAt
   )

   return result.newUser
}

/*───────────────UPDATE LAST LOGIN───────────────*/
export const updateLastLogin = async (userId: string): Promise<void> => {
   await db.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
   })
}

/*───────────────REQUEST USER DELETION───────────────*/
export const deleteUserPermanently = async (userId: string): Promise<void> => {
   const currentUser = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, deletedAt: true, role: true },
   })

   if (!currentUser) {
      throw notFound(
         'User not found',
         { entity: 'user', entityId: userId },
         { userId },
         'Verify the userId and try again.'
      )
   }

   assertUserActive({
      id: currentUser.id,
      deletedAt: currentUser.deletedAt,
   })

   await db.user.delete({
      where: { id: userId },
   })
}
/*───────────────REQUEST USER DELETION───────────────*/
export const requestUserDeletion = async (
   userId: string,
   deletionReason?: string
): Promise<void> => {
   const currentUser = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, deletedAt: true, role: true },
   })

   if (!currentUser) {
      throw notFound(
         'User not found',
         { entity: 'user', entityId: userId },
         { userId },
         'Verify the userId and try again.'
      )
   }

   if (currentUser.role === UserRole.ADMIN) {
      throw badRequest(
         'Admin accounts cannot be deleted',
         {
            entity: 'user',
            entityId: currentUser.id,
            meta: { role: currentUser.role },
         },
         { role: currentUser.role },
         'Transfer admin privileges before attempting deletion.'
      )
   }

   assertUserActive({
      id: currentUser.id,
      deletedAt: currentUser.deletedAt,
   })

   await db.user.update({
      where: { id: userId },
      data: {
         deletedAt: new Date(),
         deletionReason,
         status: UserStatus.DELETED,
      },
   })
}

/*───────────────CANCEL USER DELETION (REACTIVATE)───────────────*/
export const cancelUserDeletion = async (userId: string): Promise<void> => {
   const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, deletedAt: true, status: true },
   })

   if (!user) {
      throw notFound(
         'User not found',
         { entity: 'user', entityId: userId },
         { userId },
         'Verify the userId and try again.'
      )
   }

   if (!user.deletedAt) {
      throw badRequest(
         'User account is not scheduled for deletion',
         { entity: 'user', entityId: userId },
         { status: user.status },
         'No action needed.'
      )
   }

   // Check if within grace period
   const deletedAt = new Date(user.deletedAt)
   const now = new Date()
   const daysPassed = Math.floor(
      (now.getTime() - deletedAt.getTime()) / (1000 * 60 * 60 * 24)
   )

   if (daysPassed >= DELETION_GRACE_DAYS) {
      throw forbidden(
         'Deletion grace period has expired',
         { entity: 'user', entityId: userId, meta: { daysPassed } },
         { daysPassed },
         'Contact support for assistance.'
      )
   }

   // Reactivate account
   await db.user.update({
      where: { id: userId },
      data: {
         deletedAt: null,
         deletionReason: null,
         status: UserStatus.ACTIVE,
      },
   })
}

/*───────────────ADMIN: LIST USERS───────────────*/
export const listUsers = async (params: {
   page?: number
   limit?: number
   role?: UserRole
   status?: UserStatus
   search?: string
}) => {
   const page = params.page || 1
   const limit = params.limit || 20
   const skip = (page - 1) * limit

   const where: any = {}

   if (params.role) {
      where.role = params.role
   }

   if (params.status) {
      where.status = params.status
   }

   if (params.search) {
      where.OR = [
         { email: { contains: params.search, mode: 'insensitive' } },
         {
            userProfile: {
               OR: [
                  {
                     firstName: {
                        contains: params.search,
                        mode: 'insensitive',
                     },
                  },
                  {
                     lastName: { contains: params.search, mode: 'insensitive' },
                  },
                  {
                     displayName: {
                        contains: params.search,
                        mode: 'insensitive',
                     },
                  },
               ],
            },
         },
      ]
   }

   const [users, total] = await Promise.all([
      db.user.findMany({
         where,
         select: {
            ...userPublicSelect,
            emailVerified: true,
            lastLoginAt: true,
            createdAt: true,
            deletedAt: true,
         },
         skip,
         take: limit,
         orderBy: { createdAt: 'desc' },
      }),
      db.user.count({ where }),
   ])

   return {
      users,
      pagination: {
         page,
         limit,
         total,
         totalPages: Math.ceil(total / limit),
      },
   }
}

/*───────────────ADMIN: UPDATE USER ROLE───────────────*/
export const updateUserRole = async (
   adminId: string,
   targetUserId: string,
   newRole: UserRole
): Promise<UserPublic> => {
   // Prevent self-demotion
   if (adminId === targetUserId && newRole !== UserRole.ADMIN) {
      throw badRequest(
         'Cannot change your own role',
         { entity: 'user', entityId: adminId },
         { action: 'updateRole' },
         'Ask another admin to change your role.'
      )
   }

   const user = await db.user.findUnique({
      where: { id: targetUserId },
      select: { ...userPublicSelect, deletedAt: true },
   })

   if (!user) {
      throw notFound(
         'User not found',
         { entity: 'user', entityId: targetUserId },
         { userId: targetUserId },
         'Verify the user ID.'
      )
   }

   assertUserActive({ id: user.id, deletedAt: user.deletedAt })

   const updatedUser = await db.user.update({
      where: { id: targetUserId },
      data: { role: newRole },
      select: userPublicSelect,
   })

   return updatedUser
}

/*───────────────ADMIN: UPDATE USER STATUS───────────────*/
export const updateUserStatus = async (
   targetUserId: string,
   newStatus: UserStatus,
   _reason?: string
): Promise<UserPublic> => {
   const user = await db.user.findUnique({
      where: { id: targetUserId },
      select: { ...userPublicSelect, role: true },
   })

   if (!user) {
      throw notFound(
         'User not found',
         { entity: 'user', entityId: targetUserId },
         { userId: targetUserId },
         'Verify the user ID.'
      )
   }

   // Prevent status change on admin accounts
   if (user.role === UserRole.ADMIN && newStatus !== UserStatus.ACTIVE) {
      throw badRequest(
         'Cannot change status of admin accounts',
         { entity: 'user', entityId: targetUserId },
         { role: user.role },
         'Remove admin role first.'
      )
   }

   const updatedUser = await db.user.update({
      where: { id: targetUserId },
      data: { status: newStatus },
      select: userPublicSelect,
   })

   return updatedUser
}

/*───────────────ADMIN: GET USER DETAILS───────────────*/
export const getUserDetails = async (userId: string) => {
   const user = await db.user.findUnique({
      where: { id: userId },
      select: {
         ...userPublicSelect,
         emailVerified: true,
         emailVerifiedAt: true,
         lastLoginAt: true,
         failedLoginAttempts: true,
         lockedUntil: true,
         deletedAt: true,
         deletionReason: true,
         createdAt: true,
         updatedAt: true,
         userProfile: {
            select: userProfilePublicSelect,
         },
      },
   })

   if (!user) {
      throw notFound(
         'User not found',
         { entity: 'user', entityId: userId },
         { userId },
         'Verify the user ID.'
      )
   }

   return user
}

/*───────────────ADMIN: GET USER LOGIN HISTORY───────────────*/
export const getUserLoginHistory = async (userId: string, limit = 20) => {
   const loginAttempts = await db.loginAttempt.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
         id: true,
         ipAddress: true,
         deviceId: true,
         successful: true,
         failureReason: true,
         createdAt: true,
      },
   })

   return loginAttempts
}

/*───────────────Update User Profile───────────────*/
export const updateUserProfile = async (
   params: UserProfileInput
): Promise<UserProfilePublic> => {
   // ───────────────get user profile──────────────
   const userProfile = await db.userProfile.findUnique({
      where: { userId: params.userId },
      select: {
         ...userProfilePublicSelect,
      },
   })

   if (!userProfile) {
      throw notFound('User profile not found')
   }

   // ───────────────Check for conflicts with OTHER users──────────────
   if (params.displayName && params.displayName !== userProfile.displayName) {
      const existingDisplayName = await db.userProfile.findUnique({
         where: { displayName: params.displayName },
      })
      if (existingDisplayName && existingDisplayName.userId !== params.userId) {
         throw validationError('Display name is already taken by another user')
      }
   }

   if (params.phone && params.phone !== userProfile.phone) {
      const existingPhone = await db.userProfile.findUnique({
         where: { phone: params.phone },
      })
      if (existingPhone && existingPhone.userId !== params.userId) {
         throw validationError('Phone number is already used by another user')
      }
   }

   if (params.whatsApp && params.whatsApp !== userProfile.whatsApp) {
      const existingWhatsApp = await db.userProfile.findUnique({
         where: { whatsApp: params.whatsApp },
      })
      if (existingWhatsApp && existingWhatsApp.userId !== params.userId) {
         throw validationError(
            'WhatsApp number is already used by another user'
         )
      }
   }

   // ───────────────Calculate profile completion──────────────
   const isProfileCompleted = !!(
      params.firstName &&
      params.lastName &&
      params.displayName &&
      params.phone
   )

   const updatedProfile = await db.userProfile.update({
      where: { userId: params.userId },
      data: {
         ...params,
         isProfileCompleted,
      },
   })
   return updatedProfile
}
