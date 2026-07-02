// biome-ignore assist/source/organizeImports: "ignore these"
import express, {
   type Application,
   type NextFunction,
   type Request,
   type Response,
} from 'express'
import { connectDatabase, getDb } from './config/db.config'
import { env } from './config/env/env.config'
import { serviceUnavailable } from './errors/error-factory'
import { globalErrorHandler } from './middlewares/global-error-handler.middleware'
import { globalMiddlewares } from './middlewares/global.middleware'
import { auth_router } from './modules/auth/auth.route'
import { createAdmin } from './modules/user/admin.bootstrap'
import { user_router } from './modules/user/user.route'
import type { AppBootstrap } from './types/app.types'
import { success } from './utils/api.utils'
import { asyncHandler, isProduction } from './utils/common.utils'

const createApp = (): AppBootstrap => {
   /*───────────────Instantiate Express APP───────────────*/
   const app: Application = express()

   /*───────────────Register Health Route Before Middlewares───────────────*/
   app.get(
      '/health',
      asyncHandler(
         async (
            _req: Request,
            res: Response,
            _next: NextFunction
         ): Promise<void> => {
            /*───────────────Health check with timeout───────────────*/
            const timeout = 5000 // 5 seconds
            const healthCheck = Promise.race([
               getDb().$queryRaw`SELECT 1`,
               new Promise((_, reject) =>
                  setTimeout(
                     () => reject(new Error('Database timeout')),
                     timeout
                  )
               ),
            ])

            try {
               await healthCheck
               console.log('server running good')
               res.status(200).json(
                  success({
                     data: {
                        uptime: process.uptime(),
                     },
                     message: 'Service is healthy',
                  })
               )
            } catch {
               console.log('Service not available')
               /*───────────────Don't expose database errors───────────────*/
               throw serviceUnavailable(
                  'Service Unavailable',
                  {
                     entity: 'health',
                     meta: { endpoint: '/health', check: 'database' },
                  },
                  { service: 'database', status: 'unavailable' },
                  'The service is temporarily unavailable. Please try again later'
               )
            }
         }
      )
   )

   /*───────────────Register Global Middlewares───────────────*/
   globalMiddlewares(app)
   /*───────────────Register API Routes───────────────*/
   app.use('/users', user_router)
   app.use('/auth', auth_router)

   /*───────────────Register Global Error Handler───────────────*/
   app.use(globalErrorHandler)

   /*───────────────Capture Endpoint Not Found (must be after error handler)───────────────*/
   app.use((req: Request, res: Response) => {
      res.status(404).json({
         status: 'error',
         statusCode: 404,
         error: {
            code: 'NOT_FOUND',
            message: 'Endpoint not found',
            endpoint: req.originalUrl,
            method: req.method,
            timestamp: new Date().toISOString(),
         },
         requestId: req.headers['x-request-id']?.toString() ?? 'N/A',
      })
   })

   /*───────────────Server Startup───────────────*/
   let isStarted = false
   let isShuttingDown = false
   async function start(port?: number): Promise<void> {
      if (isStarted) return
      isStarted = true

      /*───────────────Database Connection───────────────*/
      console.log('Connecting to database....')
      await connectDatabase()
      console.log('Database connected')

      /*───────────────Create Admin If not exist───────────────*/
      await createAdmin()

      /*───────────────Listen Server───────────────*/
      const server = app.listen(port, () => {
         const baseUrl = isProduction
            ? env.api.BASE_LIVE_URL
            : env.api.BASE_LOCAL_URL
         console.log('Server started successfully', {
            port,
            baseUrl: `${baseUrl}/health`,
            environment: env.application.NODE_ENV,
         })
      })
      /*───────────────Shut Down Server───────────────*/
      const shutdown = async () => {
         if (isShuttingDown) return
         isShuttingDown = true
         console.log('Shutting down server')
         server.close(() => {
            void getDb()
               .$disconnect()
               .then(() => console.log('Database disconnected'))
               .catch((err: any) =>
                  console.log('Error disconnecting database', err)
               )
               .finally(() => process.exit(0))
         })
      }
      process.on('SIGINT', shutdown)
      process.on('SIGTERM', shutdown)
   }
   return { app, start }
}

export { createApp }
