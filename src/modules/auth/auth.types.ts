/** Resend verification input */
export type ResendVerificationInput = {
   email: string
}

/** Sign in result with 2FA information */
export type SignInResult = {
   user: import('../user/user.types').UserPublic
   isTrustedDevice: boolean
   deviceId?: string
}

/** Change email input */
export type ChangeEmailInput = {
   userId: string
   newEmail: string
}
