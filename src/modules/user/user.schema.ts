import {
   emailSchema,
   strictObject,
   strongPasswordSchema,
} from '@src/schemas/common.schemas'
import { UserRole, UserStatus } from '@src/types/enums.types'
import { parsePhoneNumberAuto } from '@src/utils/common.utils'
import z from 'zod'

export const UserBaseSchema = strictObject({
   email: emailSchema,
   password: strongPasswordSchema,
})

export const DeleteUserSchema = z.object({
   deletionReason: z
      .string()
      .min(10, 'Deletion reason must be at least 10 characters')
      .max(500, 'Deletion reason must be less than 500 characters')
      .optional(),
})

export const updateUserProfileSchema = z
   .object({
      firstName: z.string().trim().min(1).max(100).optional(),
      lastName: z.string().trim().min(1).max(100).optional(),
      displayName: z.string().trim().min(1).max(120).optional(),
      bio: z.string().trim().max(500).optional(),
      avatarUrl: z.string().url().optional(),
      phone: z
         .string()
         .optional()
         .transform((value) =>
            value ? parsePhoneNumberAuto(value) : undefined
         ),
      whatsApp: z
         .string()
         .optional()
         .transform((value) =>
            value ? parsePhoneNumberAuto(value) : undefined
         ),
   })
   .strict()

// Admin schemas
export const ListUsersSchema = z.object({
   page: z.coerce.number().int().min(1).optional(),
   limit: z.coerce.number().int().min(1).max(100).optional(),
   role: z.enum(UserRole).optional(),
   status: z.enum(UserStatus).optional(),
   search: z.string().trim().optional(),
})

export const UpdateUserRoleSchema = z.object({
   role: z.enum(UserRole),
})

export const UpdateUserStatusSchema = z.object({
   status: z.enum(UserStatus),
   reason: z.string().trim().max(500).optional(),
})

export const UserIdParamSchema = z.object({
   userId: z.uuid('Invalid user ID format'),
})
