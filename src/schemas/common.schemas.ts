import { z } from 'zod'

/**
 * Common Schema Components
 * Reusable schema building blocks for consistent validation across the application
 */
export const emailSchema = z
   .email('Invalid email address')
   .max(255, 'Email must be less than 255 characters')
   .transform((v) => v.toLowerCase().trim())

export const isoDateStringSchema = z
   .string()
   .refine((date) => !Number.isNaN(Date.parse(date)), {
      message: 'Invalid date format',
   })

export const strictObject = <T extends z.ZodRawShape>(shape: T) =>
   z.object(shape).strict()

export const optionalStrictObject = <T extends z.ZodRawShape>(shape: T) =>
   z.object(shape).partial().strict()

export const strongPasswordSchema = z
   .string()
   .min(8, 'Password must be at least 8 characters long')
   .max(12, 'Password must be less than 12 characters')
   .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
   .regex(/[a-z]/, 'Must contain at least one lowercase letter')
   .regex(/[0-9]/, 'Must contain at least one number')
   .regex(
      /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/,
      'Must contain at least one special character'
   )
