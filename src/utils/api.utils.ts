// src/shared/utils/api-response.util.ts
import type { ApiSuccess } from '../types/api.types'

/*────────────────── Internal base (colocated) ──────────────────*/
const base = (requestId?: string) => ({
   timestamp: new Date().toISOString(),
   ...(requestId ? { requestId } : {}),
})

/*────────────────── Generic Success ──────────────────*/
export const success = <T>(
   data: T,
   message = 'Operation successful',
   requestId?: string
): ApiSuccess<T | null> => ({
   status: true,
   data: data ? data : null,
   message,
   ...base(requestId),
})
