import compression from 'compression'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import type { Application } from 'express'
import express from 'express'
import {
   additionalSecurityHeaders,
   bodyParserConfig,
   corsConfig,
   helmetConfig,
   validateSecurityConfig,
} from '../config/security.config'
import { csrfMiddleware, csrfTokenMiddleware } from './csrf.middleware'
import { apiRateLimiter } from './rate-limiter.middleware'
import { requestIdMiddleware } from './request-id.middleware'

// Validate security config on startup
validateSecurityConfig()

/*───────────────Global Middlewares───────────────*/
const globalMiddlewares = (app: Application) => {
   /*───────────────1. Request ID & Compression───────────────*/
   app.use(requestIdMiddleware)
   app.use(compression())

   /*───────────────2. Security Headers───────────────*/
   app.use(helmetConfig)
   app.use(additionalSecurityHeaders)

   /*───────────────3. Parsing Middlewares───────────────*/
   app.use(cookieParser())
   app.use(express.json(bodyParserConfig.json))
   app.use(express.urlencoded(bodyParserConfig.urlencoded))

   /*───────────────4. CORS───────────────*/
   app.use(cors(corsConfig))

   /*───────────────5. Rate Limiting───────────────*/
   app.use(apiRateLimiter)

   /*───────────────6. CSRF Protection───────────────*/
   app.use(csrfTokenMiddleware)
   app.use(csrfMiddleware)
}

export { globalMiddlewares }
