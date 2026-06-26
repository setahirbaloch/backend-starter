import {
   otpExpired,
   otpInvalid,
   otpNotFound,
   otpPersistFailed,
   otpSendFailed,
} from '@src/errors/error-factory'
import type { OtpPurpose } from '@src/types/enums.types'
import { OtpStatus } from '@src/types/enums.types'
import { compareHash, Hash } from '@src/utils/hash.utils'
import {
   generateOtpWithExpiry,
   getPrisma,
   isOtpExpired,
   minutesLeft,
} from '@src/utils/otp.utils'
import { sendEmail } from '../mailer/mailer.service'
import type {
   DbOrTx,
   GenerateOtpInput,
   ResendOtpInput,
   VerifyOtpInput,
   VerifyOtpOutput,
} from './otp.types'

/*───────────────── Expire old OTPs ─────────────────*/
async function expireOldOtps(
   prisma: DbOrTx,
   userId: string,
   purpose: OtpPurpose
): Promise<void> {
   await prisma.otp.updateMany({
      where: { userId, purpose, status: OtpStatus.PENDING },
      data: { status: OtpStatus.EXPIRED },
   })
}

/*───────────────── Persist OTP ─────────────────*/
async function persistOtp(
   prisma: DbOrTx,
   userId: string,
   otp: string,
   expiredAt: Date,
   purpose: OtpPurpose
): Promise<{ id: string; userId: string }> {
   try {
      const hashedOtp = await Hash({ value: otp })
      return await prisma.otp.create({
         data: {
            userId,
            otpCode: hashedOtp,
            expiredAt,
            purpose,
            status: OtpStatus.PENDING,
         },
      })
   } catch (_err) {
      throw otpPersistFailed(
         'Failed to persist OTP',
         { entity: 'otp', entityId: userId, meta: { purpose } },
         { otpLength: 6, purpose },
         'Try again later or contact support'
      )
   }
}

/*───────────────── Send OTP Email ─────────────────*/
export async function sendOtpEmail(
   email: string,
   otp: string,
   expiredAt: Date
): Promise<void> {
   try {
      await sendEmail({
         to: email,
         subject: 'Your OTP Code',
         html: `<p>Your OTP is <strong>${otp}</strong></p><p>Expires in ${minutesLeft(
            expiredAt
         )} minutes</p>`,
      })
   } catch (_err) {
      throw otpSendFailed(
         'Failed to send OTP email',
         { entity: 'otp', meta: { hasEmail: !!email } },
         { minutesLeft: minutesLeft(expiredAt) },
         'Check the email address or try again later'
      )
   }
}

/*───────────────── Generate OTP ─────────────────*/
export async function generateOtpDb(
   prisma: DbOrTx,
   userId: string,
   purpose: OtpPurpose
) {
   await expireOldOtps(prisma, userId, purpose)
   const { otp, expiredAt } = generateOtpWithExpiry()
   await persistOtp(prisma, userId, otp, expiredAt, purpose)
   return { otp, expiredAt }
}

export async function generateAndSendOtp(
   input: GenerateOtpInput
): Promise<void> {
   const { userId, email, purpose, tx } = input
   const prisma = getPrisma(tx)

   await expireOldOtps(prisma, userId, purpose)
   const { otp, expiredAt } = generateOtpWithExpiry()

   const persistedOtp = await persistOtp(
      prisma,
      userId,
      otp,
      expiredAt,
      purpose
   )
   if (!persistedOtp)
      throw otpPersistFailed(
         'Failed to persist OTP',
         { entity: 'otp', entityId: userId },
         { otpLength: 6, purpose },
         'Try again later'
      )

   await sendOtpEmail(email, otp, expiredAt)
}

/*───────────────── Verify OTP ─────────────────*/
export async function verifyOtp(
   input: VerifyOtpInput
): Promise<VerifyOtpOutput> {
   const { userId, purpose, otpCode, tx } = input
   const prisma = getPrisma(tx)

   const record = await prisma.otp.findFirst({
      where: { userId, purpose, status: OtpStatus.PENDING },
      orderBy: { createdAt: 'desc' },
   })

   if (!record)
      throw otpNotFound(
         'OTP not found',
         { entity: 'otp', entityId: userId },
         { purpose },
         'Request a new OTP'
      )

   if (isOtpExpired(record.expiredAt))
      throw otpExpired(
         'OTP has expired',
         { entity: 'otp', entityId: userId },
         { expiredAt: record.expiredAt },
         'Request a new OTP'
      )

   const isValid = await compareHash({
      value: otpCode,
      hashedValue: record.otpCode,
   })
   if (!isValid)
      throw otpInvalid(
         'OTP is invalid',
         { entity: 'otp', entityId: userId },
         { otpCodeLength: otpCode.length },
         'Check the OTP code and try again'
      )

   await prisma.otp.update({
      where: { id: record.id },
      data: { status: OtpStatus.VERIFIED, verifiedAt: new Date() },
   })

   return true
}

/*───────────────── Resend OTP ─────────────────*/
export async function resendOtp(input: ResendOtpInput): Promise<void> {
   await generateAndSendOtp(input)
}
