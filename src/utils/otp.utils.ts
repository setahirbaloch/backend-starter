import crypto from 'node:crypto'
import type { DbOrTx } from '@src/modules/otp/otp.types'
import { DateTime } from 'luxon'
import { getDb } from '../config/db.config'
import { env } from '../config/env/env.config'
import { validationError } from '../errors/error-factory'

/*───────────────── Types ─────────────────*/
export interface OtpWithExpiry {
   otp: string
   expiredAt: Date
}

export interface OtpValidationResult {
   isExpired: boolean
   minutesLeft: number
}

/*───────────────── Internal Validators ─────────────────*/
const validateOtpLength = (length: number): number => {
   if (!Number.isInteger(length) || length <= 0) {
      throw validationError('OTP length must be a positive integer')
   }

   if (length > 8) {
      throw validationError('OTP length cannot exceed 8 digits')
   }

   return length
}

const validateExpiryMinutes = (minutes: number): number => {
   if (!Number.isInteger(minutes) || minutes <= 0) {
      throw validationError('OTP expiry minutes must be a positive integer')
   }
   return minutes
}

/*───────────────── OTP Generators ─────────────────*/
export function generateOtpCode(length = 6): string {
   const safeLength = validateOtpLength(length)

   let otp = ''
   for (let i = 0; i < safeLength; i++) {
      otp += crypto.randomInt(0, 10).toString()
   }

   return otp
}

export function generateOtpWithExpiry(): OtpWithExpiry {
   const length = validateOtpLength(env.otp.LENGTH)
   const expiryMinutes = validateExpiryMinutes(env.otp.EXPIRY_MINUTES)

   const otp = generateOtpCode(length)
   const expiredAt = DateTime.now().plus({ minutes: expiryMinutes }).toJSDate()

   return { otp, expiredAt }
}

/*───────────────── Expiry Helpers ─────────────────*/
export function isOtpExpired(expiresAt: Date): boolean {
   return DateTime.now() >= DateTime.fromJSDate(expiresAt)
}

export function minutesLeft(expiresAt: Date): number {
   const diffMs =
      DateTime.fromJSDate(expiresAt).toMillis() - DateTime.now().toMillis()

   return Math.max(0, Math.ceil(diffMs / 60_000))
}

export function validateOtpExpiry(expiresAt: Date): OtpValidationResult {
   return {
      isExpired: isOtpExpired(expiresAt),
      minutesLeft: minutesLeft(expiresAt),
   }
}

/*───────────────── Prisma Resolver ─────────────────*/
export const getPrisma = (tx?: DbOrTx): DbOrTx => {
   return tx ?? getDb()
}
