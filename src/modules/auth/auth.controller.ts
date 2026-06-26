import { env } from '@src/config/env/env.config'
import { badRequest, unauthenticated } from '@src/errors/error-factory'
import { TokenType } from '@src/types/enums.types'
import { success } from '@src/utils/api.utils'
import { clearTokenCookie, createTokenCookie } from '@src/utils/cookies.utils'
import { JWT } from '@src/utils/jwt.utils'
import type { NextFunction, Request, Response } from 'express'
import {
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
} from './auth.service'

/*───────────────VERIFY USER EMAIL CONTROLLER───────────────*/
const verifyUserEmailController = async (
   req: Request,
   res: Response,
   next: NextFunction
): Promise<void> => {
   try {
      const token = req.cookies[env.cookies.KEYS.VERIFY_EMAIL]

      if (!token) {
         throw unauthenticated(
            'You are not authenticated to verify email',
            { entity: 'auth', meta: { tokenType: TokenType.VERIFY } },
            { cookie: env.cookies.KEYS.VERIFY_EMAIL },
            'Request a new verification email. Use this endpoint /auth/resend-verification to get new otp code'
         )
      }

      let userId: string
      try {
         userId = JWT.verify(token, TokenType.VERIFY)
      } catch {
         throw unauthenticated(
            'Invalid or expired verification token',
            { entity: 'auth', meta: { tokenType: TokenType.VERIFY } },
            { tokenType: TokenType.VERIFY },
            'Request a new verification email.'
         )
      }

      const { otpCode } = req.body
      await verifyUserEmail({ userId, otpCode })

      /*───────────────Clear Verification Cookie───────────────*/
      const clearCookie = clearTokenCookie(TokenType.VERIFY)
      res.clearCookie(clearCookie.key, clearCookie.options)

      res.status(200).json(success({}, 'Email verified successfully'))
   } catch (error) {
      next(error)
   }
}

/*───────────────SIGN IN CONTROLLER───────────────*/
const signInController = async (
   req: Request,
   res: Response,
   next: NextFunction
) => {
   try {
      const { email, password } = req.body
      const result = await signIn({ email, password }, req)
      // If device verification is required, send OTP and don't set auth cookies yet
      if (!result.isTrustedDevice) {
         // Create temporary token for device verification
         const verifyDeviceToken = JWT.create(result.user.id, TokenType.VERIFY)
         const verifyCookie = createTokenCookie(
            TokenType.VERIFY,
            verifyDeviceToken
         )
         res.cookie(verifyCookie.key, verifyCookie.value, verifyCookie.options)

         res.status(200).json(
            success(
               {
                  isTrustedDevice: false,
                  deviceId: result.deviceId,
               },
               'Device verification required. Check your email for OTP.'
            )
         )
         return
      }

      /*───────────────Create JWT Token───────────────*/
      const accessToken = JWT.create(result.user.id, TokenType.ACCESS)
      const refreshToken = JWT.create(result.user.id, TokenType.REFRESH)

      /*───────────────Set Token Cookies───────────────*/
      const accessCookie = createTokenCookie(TokenType.ACCESS, accessToken)
      const refreshCookie = createTokenCookie(TokenType.REFRESH, refreshToken)

      res.cookie(accessCookie.key, accessCookie.value, accessCookie.options)
      res.cookie(refreshCookie.key, refreshCookie.value, refreshCookie.options)

      res.status(200).json(success(result.user, 'Signin successfully'))
   } catch (error) {
      next(error)
   }
}

/*───────────────SIGN OUT CONTROLLER───────────────*/
const signOutController = async (
   req: Request,
   res: Response,
   next: NextFunction
) => {
   try {
      await signOut(req.userId)

      /*───────────────Clear Token Cookies───────────────*/
      const clearAccessCookie = clearTokenCookie(TokenType.ACCESS)
      const clearRefreshCookie = clearTokenCookie(TokenType.REFRESH)

      res.clearCookie(clearAccessCookie.key, clearAccessCookie.options)
      res.clearCookie(clearRefreshCookie.key, clearRefreshCookie.options)

      res.status(200).json(success({}, 'Signed out successfully'))
   } catch (error) {
      next(error)
   }
}

/*───────────────REFRESH TOKEN CONTROLLER───────────────*/
const refreshTokenController = async (
   req: Request,
   res: Response,
   next: NextFunction
) => {
   try {
      const token = req.cookies[env.cookies.KEYS.REFRESH]

      if (!token) {
         throw unauthenticated(
            'Refresh token is missing',
            { entity: 'auth', meta: { tokenType: TokenType.REFRESH } },
            { cookie: env.cookies.KEYS.REFRESH },
            'Sign in again to continue.'
         )
      }

      let userId: string
      try {
         userId = JWT.verify(token, TokenType.REFRESH)
      } catch {
         throw unauthenticated(
            'Invalid or expired refresh token',
            { entity: 'auth', meta: { tokenType: TokenType.REFRESH } },
            { tokenType: TokenType.REFRESH },
            'Sign in again to continue.'
         )
      }

      const id = await refreshAccessToken(userId)

      /*───────────────Create JWT Token───────────────*/
      const accessToken = JWT.create(id, TokenType.ACCESS)
      const refreshToken = JWT.create(id, TokenType.REFRESH)

      /*───────────────Create Token Cookies───────────────*/
      const accessCookie = createTokenCookie(TokenType.ACCESS, accessToken)
      const refreshCookie = createTokenCookie(TokenType.REFRESH, refreshToken)

      /*───────────────Set Token Cookies───────────────*/
      res.cookie(accessCookie.key, accessCookie.value, accessCookie.options)
      res.cookie(refreshCookie.key, refreshCookie.value, refreshCookie.options)

      res.status(200).json(success({}, 'Access token refreshed successfully'))
   } catch (error) {
      next(error)
   }
}

/*───────────────RESEND VERIFICATION CONTROLLER───────────────*/
const resendVerificationController = async (
   req: Request,
   res: Response,
   next: NextFunction
) => {
   try {
      const { email } = req.body

      if (!email) {
         throw badRequest(
            'Email is required',
            { entity: 'auth', meta: { field: 'email' } },
            { field: 'email' },
            'Provide a valid email address.'
         )
      }

      const user = await resendVerification({ email })
      const token = JWT.create(user.id, TokenType.VERIFY)
      const cookie = createTokenCookie(TokenType.VERIFY, token)

      res.cookie(cookie.key, cookie.value, cookie.options)

      res.status(200).json(
         success({
            data: {},
            message: 'Check email for otp to verify your email',
         })
      )
   } catch (error) {
      next(error)
   }
}

/*───────────────FORGOT PASSWORD CONTROLLER───────────────*/
const forgotPasswordController = async (
   req: Request,
   res: Response,
   next: NextFunction
) => {
   try {
      const { email } = req.body

      if (!email) {
         throw badRequest(
            'Email is required',
            { entity: 'auth', meta: { field: 'email' } },
            { field: 'email' },
            'Provide a valid email address.'
         )
      }

      const user = await forgotPassword(email)
      const token = JWT.create(user.id, TokenType.RESET)
      const cookie = createTokenCookie(TokenType.RESET, token)

      res.cookie(cookie.key, cookie.value, cookie.options)

      res.status(200).json(
         success({
            data: {},
            message: 'Otp sent to your email',
         })
      )
   } catch (error) {
      next(error)
   }
}

/*───────────────RESET PASSWORD CONTROLLER───────────────*/
const resetPasswordController = async (
   req: Request,
   res: Response,
   next: NextFunction
) => {
   try {
      const { otpCode, newPassword } = req.body
      const resetToken = req.cookies[env.cookies.KEYS.RESET]

      if (!resetToken) {
         throw unauthenticated(
            'Reset password token is missing',
            { entity: 'auth', meta: { tokenType: TokenType.RESET } },
            { cookie: env.cookies.KEYS.RESET },
            'Restart the password reset process.'
         )
      }

      let userId: string
      try {
         userId = JWT.verify(resetToken, TokenType.RESET)
      } catch {
         throw unauthenticated(
            'Invalid or expired reset token',
            { entity: 'auth', meta: { tokenType: TokenType.RESET } },
            { tokenType: TokenType.RESET },
            'Restart the password reset process.'
         )
      }

      if (!otpCode || !newPassword) {
         throw badRequest(
            'OTP code and new password are required',
            {
               entity: 'auth',
               meta: {
                  otpProvided: !!otpCode,
                  passwordProvided: !!newPassword,
               },
            },
            {
               missing: [
                  !otpCode && 'otpCode',
                  !newPassword && 'newPassword',
               ].filter(Boolean),
            },
            'Provide both OTP code and new password.'
         )
      }

      await resetPassword({ userId, newPassword, otpCode })

      /*───────────────Clear Reset Token Cookie───────────────*/
      const clearResetCookie = clearTokenCookie(TokenType.RESET)
      res.clearCookie(clearResetCookie.key, clearResetCookie.options)

      res.status(200).json(success({}, 'Password reset successfully'))
   } catch (error) {
      next(error)
   }
}

/*───────────────CHANGE PASSWORD CONTROLLER (AUTHENTICATED)───────────────*/
const changePasswordController = async (
   req: Request,
   res: Response,
   next: NextFunction
) => {
   try {
      const userId = req.userId
      const { currentPassword, newPassword } = req.body

      if (!currentPassword || !newPassword) {
         throw badRequest(
            'Current password and new password are required',
            { entity: 'auth', entityId: userId },
            {
               missing: [
                  !currentPassword && 'currentPassword',
                  !newPassword && 'newPassword',
               ].filter(Boolean),
            },
            'Provide both current and new passwords.'
         )
      }

      await changePassword(userId, currentPassword, newPassword)

      res.status(200).json(success({}, 'Password changed successfully'))
   } catch (error) {
      next(error)
   }
}

/*───────────────VERIFY DEVICE CONTROLLER (2FA)───────────────*/
const verifyDeviceController = async (
   req: Request,
   res: Response,
   next: NextFunction
): Promise<void> => {
   try {
      const token = req.cookies[env.cookies.KEYS.VERIFY_EMAIL]

      if (!token) {
         throw unauthenticated(
            'Device verification token missing',
            { entity: 'auth', meta: { tokenType: TokenType.VERIFY } },
            { cookie: env.cookies.KEYS.VERIFY_EMAIL },
            'Request a new login to verify this device.'
         )
      }

      let userId: string
      try {
         userId = JWT.verify(token, TokenType.VERIFY)
      } catch {
         throw unauthenticated(
            'Invalid or expired verification token',
            { entity: 'auth', meta: { tokenType: TokenType.VERIFY } },
            { tokenType: TokenType.VERIFY },
            'Request a new login.'
         )
      }

      const { otpCode, deviceId } = req.body

      if (!otpCode || !deviceId) {
         throw badRequest(
            'OTP code and device ID are required',
            { entity: 'auth' },
            {
               missing: [!otpCode && 'otpCode', !deviceId && 'deviceId'].filter(
                  Boolean
               ),
            },
            'Provide both OTP code and device ID.'
         )
      }

      const device = await verifyDevice({ userId, deviceId, otpCode })

      /*───────────────Clear Verification Cookie───────────────*/
      const clearCookie = clearTokenCookie(TokenType.VERIFY)
      res.clearCookie(clearCookie.key, clearCookie.options)

      /*───────────────Create JWT Tokens───────────────*/
      const accessToken = JWT.create(userId, TokenType.ACCESS)
      const refreshToken = JWT.create(userId, TokenType.REFRESH)

      /*───────────────Set Token Cookies───────────────*/
      const accessCookie = createTokenCookie(TokenType.ACCESS, accessToken)
      const refreshCookie = createTokenCookie(TokenType.REFRESH, refreshToken)

      res.cookie(accessCookie.key, accessCookie.value, accessCookie.options)
      res.cookie(refreshCookie.key, refreshCookie.value, refreshCookie.options)

      res.status(200).json(
         success(device, 'Device verified successfully. You are now signed in.')
      )
   } catch (error) {
      next(error)
   }
}

/*───────────────REQUEST EMAIL CHANGE CONTROLLER───────────────*/
const requestEmailChangeController = async (
   req: Request,
   res: Response,
   next: NextFunction
): Promise<void> => {
   try {
      const userId = req.userId
      const { newEmail } = req.body

      if (!newEmail) {
         throw badRequest(
            'New email is required',
            { entity: 'auth' },
            { field: 'newEmail' },
            'Provide a valid new email address.'
         )
      }

      await requestEmailChange({ userId, newEmail })

      // Create token for email change verification
      const token = JWT.create(userId, TokenType.VERIFY)
      const cookie = createTokenCookie(TokenType.VERIFY, token)
      res.cookie(cookie.key, cookie.value, cookie.options)

      res.status(200).json(
         success(
            {},
            'Verification OTP sent to your new email address. Please verify to complete the email change.'
         )
      )
   } catch (error) {
      next(error)
   }
}

/*───────────────VERIFY EMAIL CHANGE CONTROLLER───────────────*/
const verifyEmailChangeController = async (
   req: Request,
   res: Response,
   next: NextFunction
): Promise<void> => {
   try {
      const token = req.cookies[env.cookies.KEYS.VERIFY_EMAIL]
      if (!token) {
         throw unauthenticated(
            'Email change verification token missing',
            { entity: 'auth', meta: { tokenType: TokenType.VERIFY } },
            { cookie: env.cookies.KEYS.VERIFY_EMAIL },
            'Request a new email change.'
         )
      }

      let userId: string
      try {
         userId = JWT.verify(token, TokenType.VERIFY)
      } catch {
         throw unauthenticated(
            'Invalid or expired verification token',
            { entity: 'auth', meta: { tokenType: TokenType.VERIFY } },
            { tokenType: TokenType.VERIFY },
            'Request a new email change.'
         )
      }

      const { otpCode, newEmail } = req.body

      if (!otpCode || !newEmail) {
         throw badRequest(
            'OTP code and new email are required',
            { entity: 'auth' },
            {
               missing: [!otpCode && 'otpCode', !newEmail && 'newEmail'].filter(
                  Boolean
               ),
            },
            'Provide both OTP code and new email.'
         )
      }

      await verifyEmailChange({ userId, newEmail, otpCode })

      /*───────────────Clear Verification Cookie───────────────*/
      const clearCookie = clearTokenCookie(TokenType.VERIFY)
      res.clearCookie(clearCookie.key, clearCookie.options)

      res.status(200).json(success({}, 'Email changed successfully'))
   } catch (error) {
      next(error)
   }
}

export {
   changePasswordController,
   forgotPasswordController,
   refreshTokenController,
   requestEmailChangeController,
   resendVerificationController,
   resetPasswordController,
   signInController,
   signOutController,
   verifyDeviceController,
   verifyEmailChangeController,
   verifyUserEmailController,
}
