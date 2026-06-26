import { doubleCsrf } from 'csrf-csrf'
import type { NextFunction, Request, Response } from 'express'
import { env } from '../config/env/env.config'
import { forbidden } from '../errors/error-factory'
import { success } from '../utils/api.utils'

/*───────────────CSRF Protection Configuration───────────────*/
const { generateToken, doubleCsrfProtection } = doubleCsrf({
   getSecret: () => env.cookies.KEYS.CSRF,
   cookieName: 'csrf_token', // Simple, valid cookie name
   cookieOptions: {
      httpOnly: true, // Required for double-submit cookie
      secure: true,
      sameSite: 'none',
      maxAge: 24 * 60 * 60 * 1000,
   },
   getTokenFromRequest: (req: Request) =>
      (req.headers['x-csrf-token'] as string) || req.body?._csrf || '',
   size: 32,
})
/*───────────────Public Routes (Skip CSRF)───────────────*/
const PUBLIC_CSRF_PATHS = new Set([
   '/health',
   '/auth/csrf',
   '/auth/signin',
   '/auth/verify-device',
   '/auth/verify-email',
   '/auth/resend-verification',
   '/auth/forgot-password',
   '/auth/reset-password',
])
/*───────────────CSRF Validation Middleware───────────────*/
export const csrfMiddleware = (
   req: Request,
   res: Response,
   next: NextFunction
): void => {
   /*── Skip safe HTTP methods ──*/
   if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      next()
      return
   }

   if (PUBLIC_CSRF_PATHS.has(req.path)) {
      console.log(`CSRF SKIPPING path: ${req.path}`, {
         requestId: req.headers['x-request-id'] || 'unknown',
         timestamp: Date.now(),
      })
      next()
      return
   }

   /*── Origin validation (extra hardening) ──*/
   const origin = req.headers.origin
   if (origin && !env.cors.ORIGINS.includes(origin)) {
      console.log('CSRF blocked due to invalid origin', {
         origin,
         allowedOrigins: env.cors.ORIGINS,
         path: req.path,
         ip: req.ip,
      })
      throw forbidden(
         'Invalid request origin',
         { entity: 'csrf', meta: { middleware: 'csrf', endpoint: req.path } },
         { allowedOrigins: env.cors.ORIGINS },
         'Ensure your request originates from an allowed domain'
      )
   }

   /*── CSRF token validation ──*/
   doubleCsrfProtection(req, res, next)
}

/*───────────────CSRF Token Generator Middleware───────────────*/
export const csrfTokenMiddleware = (
   req: Request,
   res: Response,
   next: NextFunction
): void => {
   /*── Only generate token for the dedicated endpoint ──*/
   if (req.method === 'GET' && req.path === '/v1/auth/csrf-token') {
      try {
         const token = generateToken(req, res)
         res.setHeader('X-CSRF-Token', token)
         res.locals.csrfToken = token
      } catch (error) {
         console.log('Failed to generate CSRF token', {
            path: req.path,
            error: error instanceof Error ? error.message : String(error),
         })
      }
   }

   next()
}

/*───────────────CSRF Token Endpoint Handler───────────────*/
export const getCsrfToken = (req: Request, res: Response): void => {
   try {
      const token = generateToken(req, res)

      res.json(
         success(
            {
               csrfToken: token,
               cookieName: 'csrf_token',
               expiresIn: '24h',
            },
            'CSRF Token created successfully'
         )
      )
   } catch (error: any) {
      console.log('Failed to generate CSRF token in endpoint', {
         error: error.message,
      })

      throw error // Let the global error handler deal with this
   }
}
