/*─────────────── Input Types ───────────────*/
export type UserInput = {
   email: string
   password: string
}

export type UserProfileInput = {
   userId: string

   firstName?: string | null
   lastName?: string | null
   displayName?: string | null
   bio?: string | null
   avatarUrl?: string | null
   phone?: string | null
   whatsApp?: string | null
}

/*─────────────── User───────────────*/
export const userPublicSelect = {
   id: true,
   email: true,
   role: true,
   status: true,
} as const

export type UserPublic = {
   id: string
   email: string
   role: string
   status: string
}

/*─────────────── User Profile───────────────*/

export const userProfilePublicSelect = {
   id: true,
   firstName: true,
   lastName: true,
   displayName: true,
   bio: true,
   avatarUrl: true,
   phone: true,
   whatsApp: true,
} as const

export type UserProfilePublic = {
   id: string
   firstName?: string | null
   lastName?: string | null
   displayName?: string | null
   bio?: string | null
   avatarUrl?: string | null
   phone?: string | null
   whatsApp?: string | null
}
