import type { NextFunction, Request, Response } from 'express'
import type z from 'zod'
import { ZodError } from 'zod'
import { validationError } from '../errors/error-factory'

/*───────────────Validation Middleware Factory───────────────*/
/* Creates a middleware that validates request body against a Zod schema */
export const validate =
   (schema: z.ZodSchema, source: 'body' | 'query' | 'params' = 'body') =>
   (req: Request, _res: Response, next: NextFunction): void => {
      try {
         schema.parse(req[source])
         next()
      } catch (error) {
         if (error instanceof ZodError) {
            /* Use a simple plain message for validation failures */
            let errorMessage = 'Validation failed'
            if (source === 'query') errorMessage = 'Invalid query parameters'
            if (source === 'params') errorMessage = 'Invalid route parameters'

            const validationErr = validationError(errorMessage)
            /* Attach detailed validation errors to the error object */
            ;(validationErr as { details?: unknown }).details =
               error.issues.map((issue) => ({
                  path: issue.path.join('.'),
                  message: issue.message,
                  code: issue.code,
               }))
            throw validationErr
         }
         next(error)
      }
   }
