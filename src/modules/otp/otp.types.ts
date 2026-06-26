import type { OtpPurpose } from '@src/types/enums.types'

export type DbOrTx = any

export interface GenerateOtpInput {
   userId: string
   email: string
   purpose: OtpPurpose
   tx?: DbOrTx
}

export interface VerifyOtpInput {
   userId: string
   purpose: OtpPurpose
   otpCode: string
   tx?: DbOrTx
}

export type VerifyOtpOutput = boolean

export interface ResendOtpInput {
   userId: string
   email: string
   purpose: OtpPurpose
}
