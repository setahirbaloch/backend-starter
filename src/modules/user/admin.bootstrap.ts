// services/user/admin.bootstrap.ts

import { getDb } from '@src/config/db.config'
import { env } from '@src/config/env/env.config'
import { UserRole, UserStatus } from '@src/types/enums.types'
import { Hash } from '@src/utils/hash.utils'

export async function createAdmin(): Promise<void> {
   const { EMAIL, PASSWORD } = env.admin
   if (!EMAIL || !PASSWORD) return

   const db = getDb()

   const exists = await db.user.findFirst({
      where: { email: EMAIL, deletedAt: null },
   })

   console.log('Admin already exists')
   if (exists) return

   await db.user.create({
      data: {
         email: EMAIL,
         password: await Hash({ value: PASSWORD }),
         role: UserRole.ADMIN,
         status: UserStatus.ACTIVE,
         emailVerified: true,
         emailVerifiedAt: new Date(),
      },
   })
   console.log('Admin created successfully')
}
