// src/shared/middlewares/global-error.middleware.ts

import type { NextFunction, Request, Response } from 'express'
import { ErrorCode } from '../errors/error-codes'
import type { ExtendedHttpError } from '../errors/error-factory'
import { isProduction } from '../utils/common.utils'

export interface ApiError {
   code: ErrorCode
   message: string
   endpoint: string
   method: string
   timestamp: string
   details?: unknown // optional safe info
   suggestion?: string // optional suggestion
   documentationUrl?: string // optional docs link
}

export interface ErrorResponse {
   status: boolean
   statusCode: number
   error: ApiError
   requestId: string
}

/*────────────────── Global Error Handler ──────────────────*/
export const globalErrorHandler = (
   err: unknown,
   req: Request,
   res: Response,
   next: NextFunction
): void => {
   if (res.headersSent) {
      next(err)
      return
   }

   const error = err as Partial<ExtendedHttpError>

   // Determine HTTP status code
   const statusCode = error.statusCode ?? error.status ?? 500

   //   Determine error
   function isErrorCode(value: unknown): value is ErrorCode {
      return (
         typeof value === 'string' &&
         (Object.values(ErrorCode) as string[]).includes(value)
      )
   }

   const rawCode = (error as { code?: unknown })?.code

   const code: ErrorCode = isErrorCode(rawCode)
      ? rawCode
      : rawCode === 'EBADCSRFTOKEN'
        ? ErrorCode.CSRF_TOKEN_INVALID
        : ErrorCode.INTERNAL_SERVER_ERROR

   // Determine message
   const message =
      statusCode < 500
         ? (error.message ?? 'Request failed')
         : isProduction
           ? 'Internal Server Error'
           : (error.message ?? 'Internal Server Error')

   // Request ID for tracing
   const requestId = req.headers['x-request-id']?.toString() ?? 'N/A'

   // Build structured API error
   const payload: ErrorResponse = {
      status: false,
      statusCode,
      error: {
         code: code,
         message,
         endpoint: req.originalUrl,
         method: req.method,
         timestamp: new Date().toISOString(),
         ...(error.details ? { details: error.details } : {}),
         ...(error.suggestion ? { suggestion: error.suggestion } : {}),
         ...(error.documentationUrl
            ? { documentationUrl: error.documentationUrl }
            : {}),
      },
      requestId,
   }

   // Optional: structured logging hook
   /*
  logger.error({
    code,
    message,
    statusCode,
    method: req.method,
    endpoint: req.originalUrl,
    requestId,
    context: error.context,
    stack: error.stack,
    details: error.details
  });
  */

   res.status(statusCode).json(payload)
}
