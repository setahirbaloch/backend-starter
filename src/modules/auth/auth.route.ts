import { authenticate } from '@src/middlewares/auth.middleware'
import { getCsrfToken } from '@src/middlewares/csrf.middleware'
import { authRateLimiter } from '@src/middlewares/rate-limiter.middleware'
import { validate } from '@src/middlewares/validation.middleware'
import { asyncHandler } from '@src/utils/common.utils'
import { Router } from 'express'
import { UserBaseSchema } from '../user/user.schema'
import {
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
} from './auth.controller'
import {
   AuthenticatedChangePasswordSchema,
   ForgotPasswordSchema,
   RequestEmailChangeSchema,
   ResendVerificationSchema,
   ResetPasswordSchema,
   VerifyDeviceSchema,
   VerifyEmailChangeSchema,
   VerifyEmailSchema,
} from './auth.schema'

/*───────────────Auth Routes───────────────*/
const auth_router = Router()

/*───────────────Public Routes───────────────*/
auth_router.get('/csrf', authRateLimiter, getCsrfToken)

/*───────────────Email Verification───────────────*/
auth_router.post(
   '/verify-email',
   authRateLimiter,
   validate(VerifyEmailSchema),
   asyncHandler(verifyUserEmailController)
)

auth_router.post(
   '/resend-verification',
   authRateLimiter,
   validate(ResendVerificationSchema),
   asyncHandler(resendVerificationController)
)

/*───────────────Sign In & Device Verification (2FA)───────────────*/
auth_router.post(
   '/signin',
   authRateLimiter,
   validate(UserBaseSchema),
   asyncHandler(signInController)
)

auth_router.post(
   '/verify-device',
   authRateLimiter,
   validate(VerifyDeviceSchema),
   asyncHandler(verifyDeviceController)
)

/*───────────────Token Management───────────────*/
auth_router.post(
   '/refresh-access-token',
   authRateLimiter,
   asyncHandler(refreshTokenController)
)

/*───────────────Password Management───────────────*/
auth_router.post(
   '/forgot-password',
   authRateLimiter,
   validate(ForgotPasswordSchema),
   asyncHandler(forgotPasswordController)
)

auth_router.post(
   '/reset-password',
   authRateLimiter,
   validate(ResetPasswordSchema),
   asyncHandler(resetPasswordController)
)

/*───────────────Authenticated Routes───────────────*/
auth_router.post('/signout', authenticate, asyncHandler(signOutController))

auth_router.put(
   '/change-password',
   authenticate,
   validate(AuthenticatedChangePasswordSchema),
   asyncHandler(changePasswordController)
)

/*───────────────Email Change───────────────*/
auth_router.post(
   '/change-email',
   authenticate,
   validate(RequestEmailChangeSchema),
   asyncHandler(requestEmailChangeController)
)

auth_router.post(
   '/verify-email-change',
   authenticate,
   validate(VerifyEmailChangeSchema),
   asyncHandler(verifyEmailChangeController)
)

export { auth_router }
