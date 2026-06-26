import { emailSchema, strongPasswordSchema } from '@src/schemas/common.schemas'
import z from 'zod'

// OTP code validation
const otpCodeSchema = z
   .string()
   .trim()
   .regex(/^\d{6}$/, 'OTP must be exactly 6 digits')

// Verify email schema
export const VerifyEmailSchema = z.object({
   otpCode: otpCodeSchema,
})

// Resend verification schema
export const ResendVerificationSchema = z
   .object({
      email: emailSchema,
   })
   .strict()

// Forgot password schema
export const ForgotPasswordSchema = z.object({
   email: emailSchema,
})

// Reset password schema
export const ResetPasswordSchema = z.object({
   otpCode: otpCodeSchema,
   newPassword: strongPasswordSchema,
})

// Change password schema (authenticated)
export const AuthenticatedChangePasswordSchema = z.object({
   currentPassword: strongPasswordSchema,
   newPassword: strongPasswordSchema,
})

// Verify device schema (2FA)
export const VerifyDeviceSchema = z.object({
   otpCode: otpCodeSchema,
   deviceId: z.string().min(1, 'Device ID is required'),
})

// Request email change schema
export const RequestEmailChangeSchema = z.object({
   newEmail: emailSchema,
})

// Verify email change schema
export const VerifyEmailChangeSchema = z.object({
   otpCode: otpCodeSchema,
   newEmail: emailSchema,
})
