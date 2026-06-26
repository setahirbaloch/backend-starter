import type cors from 'cors'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import { isProduction } from '../utils/common.utils'
import { env } from './env/env.config'

/*───────────────Helmet Security Headers Configuration───────────────*/
export const helmetConfig = helmet({
   hidePoweredBy: true,
   // Add more helmet options as needed
})

/*───────────────CORS Configuration───────────────*/
export const validateCorsConfig = () => {
   if (!Array.isArray(env.cors.ORIGINS) || env.cors.ORIGINS.length === 0) {
      const message =
         'CORS origins not configured - API may be vulnerable to CSRF attacks'
      if (isProduction) {
         throw new Error(`${message} - CORS must be configured in production`)
      }
   }
   if (!Array.isArray(env.cors.METHODS) || env.cors.METHODS.length === 0) {
      const message = 'CORS methods not configured'
      if (isProduction) {
         throw new Error(
            `${message} - CORS methods must be configured in production`
         )
      }
   }
}

export const corsConfig: cors.CorsOptions = {
   origin: env.cors.ORIGINS,
   allowedHeaders: env.cors.HEADERS,
   methods: env.cors.METHODS,
   credentials: env.cors.CREDENTIALS,
}

/*───────────────Rate Limiting Configuration───────────────*/
export const rateLimitConfig = rateLimit({
   windowMs: 15 * 60 * 1000, // 15 minutes (you can make this configurable)
   max: 100, // limit each IP to 100 requests per windowMs
   message: 'Too many requests from this IP, please try again later',
   standardHeaders: true,
   legacyHeaders: false,
})

/*───────────────Body Parser Configuration───────────────*/
export const bodyParserConfig = {
   json: { limit: '10mb' },
   urlencoded: { extended: true, limit: '10mb' },
}

/*───────────────Security Middleware Order Constants───────────────*/
export const MIDDLEWARE_ORDER = {
   REQUEST_ID: 1, // First - tag all requests
   COMPRESSION: 2, // Early - performance
   SECURITY_HEADERS: 3, // Security headers
   PARSING: 4, // Cookie, JSON, URL-encoded parsing
   CORS: 5, // Cross-origin handling
   RATE_LIMITING: 6, // Rate limiting
   CSRF_PROTECTION: 7, // CSRF validation (last before routes)
} as const

/*───────────────Security Validation───────────────*/
export const validateSecurityConfig = () => {
   validateCorsConfig()

   // Add more security validations here
   if (isProduction && !env.cors.CREDENTIALS) {
      console.log(
         'CORS credentials disabled in production - check if this is intended'
      )
   }
}

/*───────────────Security Headers Helper───────────────*/
export const additionalSecurityHeaders = (_req: any, res: any, next: any) => {
   // Disable x-powered-by (helmet already does this, but explicit)
   res.removeHeader('x-powered-by')

   // Add any custom security headers here
   res.setHeader('X-Content-Type-Options', 'nosniff')
   res.setHeader('X-Frame-Options', 'DENY')

   next()
}
