export enum OtpPurpose {
   VERIFY_EMAIL = 'VERIFY_EMAIL',
   RESET_PASSWORD = 'RESET_PASSWORD',
   CHANGE_EMAIL = 'CHANGE_EMAIL',
   VERIFY_DEVICE = 'VERIFY_DEVICE',
}

export enum OtpStatus {
   PENDING = 'PENDING',
   VERIFIED = 'VERIFIED',
   EXPIRED = 'EXPIRED',
}

export enum UserRole {
   ADMIN = 'ADMIN',
   USER = 'USER',
}

export enum UserStatus {
   ACTIVE = 'ACTIVE',
   INACTIVE = 'INACTIVE',
   SUSPENDED = 'SUSPENDED',
   BANNED = 'BANNED',
   DELETED = 'DELETED',
}

export const TokenType = {
   ACCESS: 'ACCESS',
   REFRESH: 'REFRESH',
   VERIFY: 'VERIFY',
   RESET: 'RESET',
} as const

export type TokenType = (typeof TokenType)[keyof typeof TokenType]
