import rateLimit from 'express-rate-limit'
import { isProduction } from '../utils/common.utils'

/*───────────────Rate Limiter for Authentication Endpoints───────────────*/
/* Rate limiter for authentication endpoints (OTP generation, verification, etc.) */
export const authRateLimiter = rateLimit({
   windowMs: 15 * 60 * 1000 /* 15 minutes */,
   max: isProduction
      ? 5
      : 10 /* Limit each IP to 5 requests per windowMs in production, 100 in development */,
   message: 'Too many authentication attempts, please try again later',
   standardHeaders: true /* Return rate limit info in the `RateLimit-*` headers */,
   legacyHeaders: false /* Disable the `X-RateLimit-*` headers */,
   skip: (req) => {
      /* Skip rate limiting for health checks */
      return req.path === '/health'
   },
})

/*───────────────General API Rate Limiter───────────────*/
export const apiRateLimiter = rateLimit({
   windowMs: 15 * 60 * 1000 /* 15 minutes */,
   max: isProduction
      ? 50
      : 100 /* Limit each IP to 50 requests per windowMs in production */,
   standardHeaders: true,
   legacyHeaders: false,
   skip: (req) => {
      return req.path === '/health'
   },
})
