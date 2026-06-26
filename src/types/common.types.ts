import type { NextFunction, Request, Response } from 'express'

export type AsyncHandler = (
   req: Request,
   res: Response,
   next: NextFunction
) => Promise<void>

export type AsyncHandlerWrapper = (
   fn: AsyncHandler
) => (req: Request, res: Response, next: NextFunction) => void

export interface EnvironmentStatus {
   nodeEnv: string
   isProduction: boolean
   isDevelopment: boolean
   isTest: boolean
}
