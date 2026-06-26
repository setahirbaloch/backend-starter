import { type Prisma, PrismaClient } from '@generated/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { env } from './env/env.config'

export type PrismaTx = Prisma.TransactionClient

let prisma: PrismaClient | null = null

function createPrismaClient(): PrismaClient {
   return new PrismaClient({
      adapter: new PrismaPg({
         connectionString: env.database.DATABASE_URL,
      }),
      // log:
      //   env.application.NODE_ENV === "development"
      //     ? ["query", "warn", "error"]
      //     : ["error"],
   })
}

export function getDb(): PrismaClient {
   if (!prisma) prisma = createPrismaClient()
   return prisma
}

export async function connectDatabase(): Promise<void> {
   await getDb().$connect()
}

export async function disconnectDatabase(): Promise<void> {
   if (!prisma) return
   await prisma.$disconnect()
   prisma = null
}

export async function withTransaction<T>(
   fn: (tx: PrismaTx) => Promise<T>
): Promise<T> {
   return getDb().$transaction(fn)
}
