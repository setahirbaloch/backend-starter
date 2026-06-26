// src/shared/errors/error.types.ts
import type { ErrorCode } from './error-codes'

/**
 * Structured context for the error.
 * Can include entity, entityId, requestId, or extra metadata.
 */
export interface ErrorContext {
   /** entity name: user, order, token, etc. */
   entity?: string
   /** entity id or reference */
   entityId?: string | number
   /** any extra structured metadata */
   meta?: Record<string, unknown>
}

/**
 * Options for creating an AppError
 */
export interface AppErrorOptions {
   /** Internal error code */
   code: ErrorCode
   /** Human-readable message */
   message: string
   /** Optional structured context */
   context?: ErrorContext
   /** Optional structured details for client (field-level info, arrays, objects) */
   details?: unknown
   /** Optional suggestion for client to fix error */
   suggestion?: string
}
