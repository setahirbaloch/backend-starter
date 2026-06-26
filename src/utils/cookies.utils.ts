import { env } from '../config/env/env.config'
import { TokenType } from '../types/enums.types'
import { isProduction } from './common.utils'

type SameSiteType = 'lax' | 'strict' | 'none'

interface CreateCookieOptionsTypes {
   readonly key: string
   readonly value: string
   readonly maxAge?: number
   readonly expires?: Date
   readonly httpOnly?: boolean
   readonly secure?: boolean
   readonly sameSite?: SameSiteType
   readonly path?: string
   readonly domain?: string
}

interface DeleteCookieOptionsTypes {
   readonly key: string
   readonly path?: string
   readonly domain?: string
}

// const getDefaultDomain = () =>
//   isProduction ? env.api.BASE_LIVE_URL : "localhost";

const getDefaultSameSite = (): SameSiteType => (isProduction ? 'none' : 'lax')

export function createCookie(options: CreateCookieOptionsTypes): {
   key: string
   value: string
   options: Omit<CreateCookieOptionsTypes, 'key' | 'value'>
} {
   return {
      key: options.key,
      value: options.value,
      options: {
         httpOnly: env.cookies.CONFIG.HTTP_ONLY,
         secure: env.cookies.CONFIG.SECURE,
         sameSite: options.sameSite ?? getDefaultSameSite(),
         maxAge: options.maxAge,
         expires: options.expires,
         path: options.path,
         // domain: options.domain ?? getDefaultDomain(),
      },
   }
}

export function clearCookie(options: DeleteCookieOptionsTypes): {
   key: string
   options: Omit<DeleteCookieOptionsTypes, 'key'>
} {
   return {
      key: options.key,
      options: {
         path: options.path ?? '/',
         // domain: options.domain ?? getDefaultDomain(),
      },
   }
}

const tokenCookieConfig: Record<TokenType, { key: string; maxAge: number }> = {
   [TokenType.ACCESS]: {
      key: env.cookies.KEYS.ACCESS,
      maxAge: env.cookies.EXPIRY.ACCESS_SECONDS,
   },
   [TokenType.REFRESH]: {
      key: env.cookies.KEYS.REFRESH,
      maxAge: env.cookies.EXPIRY.REFRESH_SECONDS,
   },
   [TokenType.VERIFY]: {
      key: env.cookies.KEYS.VERIFY_EMAIL,
      maxAge: env.cookies.EXPIRY.VERIFY_EMAIL_SECONDS,
   },
   [TokenType.RESET]: {
      key: env.cookies.KEYS.RESET,
      maxAge: env.cookies.EXPIRY.RESET_SECONDS,
   },
}

export const createTokenCookie = (tokenType: TokenType, token: string) => {
   const config = tokenCookieConfig[tokenType]
   return createCookie({
      key: config.key,
      value: token,
      maxAge: config.maxAge * 1000,
   })
}

export const clearTokenCookie = (tokenType: TokenType) => {
   return clearCookie({
      key: tokenCookieConfig[tokenType].key,
   })
}
