import { env } from '@config/env/env.config'
import type { JwtPayload as DefaultJwtPayload } from 'jsonwebtoken'
import jwt from 'jsonwebtoken'
import { invalidToken, tokenExpired } from '../errors/error-factory'
import { TokenType } from '../types/enums.types'

const ALGORITHM: jwt.Algorithm = 'HS256'

const secretKeys: Record<TokenType, string> = {
   [TokenType.ACCESS]: env.jwt.KEYS.ACCESS,
   [TokenType.REFRESH]: env.jwt.KEYS.REFRESH,
   [TokenType.VERIFY]: env.jwt.KEYS.VERIFY_EMAIL,
   [TokenType.RESET]: env.jwt.KEYS.RESET_PASSWORD,
}

const expiryTimes: Record<TokenType, number> = {
   [TokenType.ACCESS]: env.jwt.EXPIRY.ACCESS_SECONDS,
   [TokenType.REFRESH]: env.jwt.EXPIRY.REFRESH_SECONDS,
   [TokenType.VERIFY]: env.jwt.EXPIRY.VERIFY_EMAIL_SECONDS,
   [TokenType.RESET]: env.jwt.EXPIRY.RESET_PASSWORD_SECONDS,
}

export interface JwtPayload extends DefaultJwtPayload {
   sub: string
   type: TokenType
}

export interface CreateJwtOptions {
   userId: string
   secretKey: string
   expiresIn: number
   type: TokenType
}

export interface VerifyJwtOptions {
   token: string
   secretKey: string
   type: TokenType
}

export const JWT = {
   create: (userId: string, type: TokenType): string => {
      return jwt.sign({ sub: userId, type }, secretKeys[type], {
         expiresIn: expiryTimes[type],
         algorithm: ALGORITHM,
      })
   },

   verify: (token: string, type: TokenType): string => {
      let decoded: unknown
      try {
         decoded = jwt.verify(token, secretKeys[type], {
            algorithms: [ALGORITHM],
         })
      } catch (err: any) {
         if (err.name === 'TokenExpiredError') {
            throw tokenExpired(
               `${type} token has expired`,
               {
                  entity: 'jwt',
                  meta: { tokenType: type, operation: 'verify' },
               },
               { tokenType: type },
               'Please sign in again to get a new token'
            )
         }
         throw invalidToken(
            `Invalid ${type} token`,
            { entity: 'jwt', meta: { tokenType: type, operation: 'verify' } },
            { tokenType: type },
            'Ensure you are using a valid token or sign in again'
         )
      }

      if (!JWT.isValidPayload(decoded, type)) {
         throw invalidToken(
            `Malformed ${type} token`,
            {
               entity: 'jwt',
               meta: { tokenType: type, operation: 'validate_payload' },
            },
            { tokenType: type, expectedType: type },
            'Token payload is invalid. Please sign in again'
         )
      }

      return (decoded as JwtPayload).sub
   },

   isValidPayload: (payload: unknown, expectedType: TokenType): boolean => {
      if (typeof payload !== 'object' || payload === null) {
         return false
      }
      const p = payload as Record<string, unknown>
      return (
         typeof p.sub === 'string' &&
         typeof p.type === 'string' &&
         p.type === expectedType
      )
   },
}
