// src/config/env.config.ts

import dotenv from 'dotenv'
import { deepFreeze } from '../../utils/deep-freeze.util'
import {
   parseBoolean,
   parseEnum,
   parseList,
   parseNumber,
   parseString,
} from '../../utils/env.utils'
import { EnvSchema } from './env.schema'

dotenv.config({ path: '.env' })

const normalizeSmtpCredential = (key: string, value: string): string => {
   const trimmed = value.trim()

   if (key === 'SMTP_PASSWORD') {
      return trimmed.replace(/\s+/g, '')
   }

   return trimmed
}

/* ────────────── Domain Type (exported ON PURPOSE) ────────────── */

export type Env = {
   application: {
      NAME: string
      VERSION: string
      NODE_ENV: 'development' | 'production' | 'test'
      PORT: number
   }
   admin: {
      EMAIL: string
      PASSWORD: string
   }
   database: {
      DATABASE_URL: string
   }
   api: {
      BASE_LOCAL_URL: string
      BASE_LIVE_URL: string
      PREFIX: string
   }
   cors: {
      ORIGINS: string[]
      HEADERS: string[]
      METHODS: string[]
      CREDENTIALS: boolean
   }
   smtp: {
      HOST: string
      PORT: number
      SERVICE: string
      USERNAME: string
      PASSWORD: string
      FROM_NAME: string
      FROM_EMAIL: string
      SECURE: boolean
   }
   jwt: {
      KEYS: {
         VERIFY_EMAIL: string
         ACCESS: string
         REFRESH: string
         RESET_PASSWORD: string
      }
      EXPIRY: {
         VERIFY_EMAIL_SECONDS: number
         ACCESS_SECONDS: number
         REFRESH_SECONDS: number
         RESET_PASSWORD_SECONDS: number
      }
   }
   cookies: {
      CONFIG: {
         DOMAIN: string
         SECURE: boolean
         HTTP_ONLY: boolean
         SAME_SITE: 'Strict' | 'Lax' | 'None'
      }
      KEYS: {
         VERIFY_EMAIL: string
         ACCESS: string
         REFRESH: string
         RESET: string
         CSRF: string
      }
      EXPIRY: {
         ACCESS_SECONDS: number
         REFRESH_SECONDS: number
         VERIFY_EMAIL_SECONDS: number
         RESET_SECONDS: number
      }
   }
   otp: {
      EXPIRY_MINUTES: number
      LENGTH: number
      ALLOWED_CHARS: string
   }
   password: {
      MIN_LENGTH: number
      REQUIRE_UPPERCASE: boolean
      REQUIRE_LOWERCASE: boolean
      REQUIRE_NUMBERS: boolean
      REQUIRE_SYMBOLS: boolean
   }
   hash: {
      DEFAULT_HASH_SALT_ROUNDS: number
   }
   cloudinary: {
      CLOUD_NAME: string
      API_KEY: string
      API_SECRET: string
   }
}

/* ────────────── Runtime Env (validated once) ────────────── */

export const env: Env = deepFreeze({
   application: {
      NAME: parseString({ key: 'APPLICATION' }),
      VERSION: parseString({ key: 'VERSION' }),
      NODE_ENV: parseEnum({
         key: 'NODE_ENV',
         values: EnvSchema.NODE_ENV,
      }),
      PORT: parseNumber({ key: 'PORT' }),
   },

   admin: {
      EMAIL: parseString({ key: 'ADMIN_EMAIL' }),
      PASSWORD: parseString({ key: 'ADMIN_PASSWORD' }),
   },

   database: {
      DATABASE_URL: parseString({ key: 'DATABASE_URL' }),
   },

   api: {
      BASE_LOCAL_URL: parseString({ key: 'API_BASE_LOCAL_URL' }),
      BASE_LIVE_URL: parseString({ key: 'API_BASE_LIVE_URL' }),
      PREFIX: parseString({ key: 'API_PREFIX' }),
   },

   cors: {
      ORIGINS: parseList({ key: 'CORS_ORIGINS' }),
      HEADERS: parseList({ key: 'CORS_HEADERS' }),
      METHODS: parseList({ key: 'CORS_METHODS' }).map((m) => m.toUpperCase()),
      CREDENTIALS: parseBoolean({ key: 'CORS_CREDENTIALS' }),
   },

   smtp: {
      HOST: parseString({ key: 'SMTP_HOST' }),
      PORT: parseNumber({ key: 'SMTP_PORT' }),
      SERVICE: parseString({ key: 'SMTP_SERVICE' }),
      USERNAME: normalizeSmtpCredential(
         'SMTP_USERNAME',
         parseString({ key: 'SMTP_USERNAME' })
      ),
      PASSWORD: normalizeSmtpCredential(
         'SMTP_PASSWORD',
         parseString({ key: 'SMTP_PASSWORD' })
      ),
      FROM_NAME: parseString({ key: 'SMTP_FROM_NAME' }),
      FROM_EMAIL: parseString({ key: 'SMTP_FROM_EMAIL' }),
      SECURE: parseBoolean({ key: 'SMTP_SECURE' }),
   },

   jwt: {
      KEYS: {
         VERIFY_EMAIL: parseString({ key: 'JWT_VERIFY_EMAIL_KEY' }),
         ACCESS: parseString({ key: 'JWT_ACCESS_KEY' }),
         REFRESH: parseString({ key: 'JWT_REFRESH_KEY' }),
         RESET_PASSWORD: parseString({ key: 'JWT_CHANGE_PASSWORD_KEY' }),
      },
      EXPIRY: {
         VERIFY_EMAIL_SECONDS: parseNumber({
            key: 'JWT_VERIFY_EMAIL_EXPIRY_SECONDS',
         }),
         ACCESS_SECONDS: parseNumber({ key: 'JWT_ACCESS_EXPIRY_SECONDS' }),
         REFRESH_SECONDS: parseNumber({ key: 'JWT_REFRESH_EXPIRY_SECONDS' }),
         RESET_PASSWORD_SECONDS: parseNumber({
            key: 'JWT_RESET_PASSWORD_EXPIRY_SECONDS',
         }),
      },
   },

   cookies: {
      CONFIG: {
         DOMAIN: parseString({ key: 'COOKIE_DOMAIN' }),
         SECURE: parseBoolean({ key: 'COOKIE_SECURE' }),
         HTTP_ONLY: parseBoolean({ key: 'COOKIE_HTTP_ONLY' }),
         SAME_SITE: parseEnum({
            key: 'COOKIE_SAME_SITE',
            values: EnvSchema.COOKIE_SAME_SITE,
         }),
      },
      KEYS: {
         VERIFY_EMAIL: parseString({ key: 'VERIFY_EMAIL_COOKIE_KEY' }),
         ACCESS: parseString({ key: 'ACCESS_COOKIE_KEY' }),
         REFRESH: parseString({ key: 'REFRESH_COOKIE_KEY' }),
         RESET: parseString({ key: 'RESET_COOKIE_KEY' }),
         CSRF: parseString({ key: 'CSRF_COOKIE_KEY', fallback: '_csrf' }),
      },
      EXPIRY: {
         ACCESS_SECONDS: parseNumber({
            key: 'ACCESS_COOKIE_KEY_EXPIRY_SECONDS',
         }),
         REFRESH_SECONDS: parseNumber({
            key: 'REFRESH_COOKIE_KEY_EXPIRY_SECONDS',
         }),
         VERIFY_EMAIL_SECONDS: parseNumber({
            key: 'VERIFY_EMAIL_COOKIE_EXPIRY_SECONDS',
         }),
         RESET_SECONDS: parseNumber({
            key: 'RESET_COOKIE_KEY_EXPIRY_SECONDS',
         }),
      },
   },

   otp: {
      EXPIRY_MINUTES: parseNumber({ key: 'OTP_EXPIRY_MINUTES' }),
      LENGTH: parseNumber({ key: 'OTP_LENGTH' }),
      ALLOWED_CHARS: parseString({ key: 'OTP_ALLOWED_CHARS' }),
   },

   password: {
      MIN_LENGTH: parseNumber({ key: 'PASSWORD_MIN_LENGTH' }),
      REQUIRE_UPPERCASE: parseBoolean({ key: 'PASSWORD_REQUIRE_UPPERCASE' }),
      REQUIRE_LOWERCASE: parseBoolean({ key: 'PASSWORD_REQUIRE_LOWERCASE' }),
      REQUIRE_NUMBERS: parseBoolean({ key: 'PASSWORD_REQUIRE_NUMBERS' }),
      REQUIRE_SYMBOLS: parseBoolean({ key: 'PASSWORD_REQUIRE_SYMBOLS' }),
   },

   hash: {
      DEFAULT_HASH_SALT_ROUNDS: parseNumber({
         key: 'DEFAULT_HASH_SALT_ROUNDS',
      }),
   },
   cloudinary: {
      CLOUD_NAME: parseString({ key: 'CLOUDINARY_CLOUD_NAME' }),
      API_KEY: parseString({ key: 'CLOUDINARY_API_KEY' }),
      API_SECRET: parseString({ key: 'CLOUDINARY_API_SECRET' }),
   },
})
