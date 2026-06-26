import createHttpError from 'http-errors'
import type { ErrorContext } from './error.types'
import { ErrorCode } from './error-codes'

export type ExtendedHttpError = ReturnType<typeof createHttpError> & {
   code: ErrorCode
   context?: ErrorContext
   details?: unknown // optional structured info
   suggestion?: string
}

const ERROR_STATUS: Record<ErrorCode, number> = {
   [ErrorCode.BAD_REQUEST]: 400,
   [ErrorCode.VALIDATION_ERROR]: 422,
   [ErrorCode.UNAUTHENTICATED]: 401,
   [ErrorCode.UNAUTHORIZED]: 401,
   [ErrorCode.FORBIDDEN]: 403,
   [ErrorCode.NOT_FOUND]: 404,
   [ErrorCode.CONFLICT]: 409,
   [ErrorCode.RATE_LIMIT_EXCEEDED]: 429,
   [ErrorCode.INTERNAL_SERVER_ERROR]: 500,
   [ErrorCode.SERVICE_UNAVAILABLE]: 503,
   [ErrorCode.DATABASE_ERROR]: 503,
   [ErrorCode.TOKEN_EXPIRED]: 401,
   [ErrorCode.TOKEN_INVALID]: 401,
   [ErrorCode.METHOD_NOT_ALLOWED]: 405,
   [ErrorCode.ENDPOINT_NOT_FOUND]: 404,
   [ErrorCode.USER_SCHEDULED_FOR_DELETION]: 403,
   [ErrorCode.INPUT_SANITIZATION_ERROR]: 400,
   [ErrorCode.CSRF_TOKEN_INVALID]: 403,
   [ErrorCode.OTP_NOT_FOUND]: 404,
   [ErrorCode.OTP_EXPIRED]: 410,
   [ErrorCode.OTP_INVALID]: 400,
   [ErrorCode.OTP_SEND_FAILED]: 500,
   [ErrorCode.OTP_PERSIST_FAILED]: 500,
}

/**
 * Create HTTP error with optional properties
 */
const createError = (
   code: ErrorCode,
   message: string,
   context?: ErrorContext,
   details?: unknown,
   suggestion?: string
): ExtendedHttpError => {
   const err = createHttpError(ERROR_STATUS[code], message) as ExtendedHttpError
   err.code = code

   if (context) err.context = context
   if (details) err.details = details
   if (suggestion) err.suggestion = suggestion

   return err
}

/**
 * Factory helper to predefine code and allow optional message, context, details, suggestion
 */
const factory =
   (code: ErrorCode) =>
   (
      message: string,
      context?: ErrorContext,
      details?: unknown,
      suggestion?: string
   ) =>
      createError(code, message, context, details, suggestion)

/*──────────────── Public API ────────────────*/
export const badRequest = factory(ErrorCode.BAD_REQUEST)
export const validationError = factory(ErrorCode.VALIDATION_ERROR)
export const unauthenticated = factory(ErrorCode.UNAUTHENTICATED)
export const unauthorized = factory(ErrorCode.UNAUTHORIZED)
export const forbidden = factory(ErrorCode.FORBIDDEN)
export const notFound = factory(ErrorCode.NOT_FOUND)
export const conflict = factory(ErrorCode.CONFLICT)
export const rateLimitExceeded = factory(ErrorCode.RATE_LIMIT_EXCEEDED)
export const internal = factory(ErrorCode.INTERNAL_SERVER_ERROR)
export const databaseError = factory(ErrorCode.DATABASE_ERROR)
export const serviceUnavailable = factory(ErrorCode.SERVICE_UNAVAILABLE)
export const tokenExpired = factory(ErrorCode.TOKEN_EXPIRED)
export const invalidToken = factory(ErrorCode.TOKEN_INVALID)
export const methodNotAllowed = factory(ErrorCode.METHOD_NOT_ALLOWED)
export const endpointNotFound = factory(ErrorCode.ENDPOINT_NOT_FOUND)
export const scheduleForDeletion = factory(
   ErrorCode.USER_SCHEDULED_FOR_DELETION
)
export const inputSanitizationError = factory(
   ErrorCode.INPUT_SANITIZATION_ERROR
)
/* OTP Errors */
export const otpNotFound = factory(ErrorCode.OTP_NOT_FOUND)
export const otpExpired = factory(ErrorCode.OTP_EXPIRED)
export const otpInvalid = factory(ErrorCode.OTP_INVALID)
export const otpSendFailed = factory(ErrorCode.OTP_SEND_FAILED)
export const otpPersistFailed = factory(ErrorCode.OTP_PERSIST_FAILED)
