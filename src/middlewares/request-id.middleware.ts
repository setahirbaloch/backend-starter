import { randomUUID } from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'

export function requestIdMiddleware(
   req: Request,
   res: Response,
   next: NextFunction
): void {
   const requestId = randomUUID()
   req.headers['x-request-id'] = requestId
   ;(req as { requestId?: string }).requestId = requestId
   res.setHeader('x-request-id', requestId)
   next()
}
