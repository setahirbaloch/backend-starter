import bcrypt from 'bcrypt'
import { env } from '../config/env/env.config'
import { internal, validationError } from '../errors/error-factory'

const MIN_SALT_ROUNDS = 10
const MAX_SALT_ROUNDS = 15
type HashParams = {
   value: string
   saltRounds?: number
}

export const Hash = async ({
   value,
   saltRounds = env.hash.DEFAULT_HASH_SALT_ROUNDS,
}: HashParams): Promise<string> => {
   if (!value) {
      throw validationError(
         'Value is required for hashing',
         { entity: 'hash', meta: { operation: 'hash' } },
         { field: 'value' },
         'Provide a non-empty value to hash'
      )
   }

   if (saltRounds < MIN_SALT_ROUNDS || saltRounds > MAX_SALT_ROUNDS) {
      throw validationError(
         `Salt rounds must be between ${MIN_SALT_ROUNDS} and ${MAX_SALT_ROUNDS}`,
         {
            entity: 'hash',
            meta: { saltRounds, min: MIN_SALT_ROUNDS, max: MAX_SALT_ROUNDS },
         },
         {
            saltRounds,
            validRange: { min: MIN_SALT_ROUNDS, max: MAX_SALT_ROUNDS },
         },
         `Use a salt rounds value between ${MIN_SALT_ROUNDS} and ${MAX_SALT_ROUNDS}`
      )
   }

   try {
      const salt = await bcrypt.genSalt(saltRounds)
      return await bcrypt.hash(value, salt)
   } catch {
      throw internal(
         'Failed to generate hash',
         { entity: 'hash', meta: { operation: 'bcrypt_hash' } },
         { algorithm: 'bcrypt' },
         'Contact support if this error persists'
      )
   }
}

type CompareHashParams = {
   value: string
   hashedValue: string
}

export const compareHash = async ({
   value,
   hashedValue,
}: CompareHashParams): Promise<boolean> => {
   if (!value || !hashedValue) {
      throw validationError(
         'Value and hashed value are required for comparison',
         {
            entity: 'hash',
            meta: {
               operation: 'compare',
               hasValue: !!value,
               hasHashedValue: !!hashedValue,
            },
         },
         {
            missingFields: [
               !value && 'value',
               !hashedValue && 'hashedValue',
            ].filter(Boolean),
         },
         'Provide both the plain value and hashed value for comparison'
      )
   }

   try {
      return await bcrypt.compare(value, hashedValue)
   } catch {
      throw internal(
         'Failed to compare hash values',
         { entity: 'hash', meta: { operation: 'bcrypt_compare' } },
         { algorithm: 'bcrypt' },
         'Contact support if this error persists'
      )
   }
}
