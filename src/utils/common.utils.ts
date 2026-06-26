import type { NextFunction, Request, Response } from 'express'
import parsePhoneNumberFromString from 'libphonenumber-js'
import { env } from '../config/env/env.config'
import type { AsyncHandler, AsyncHandlerWrapper } from '../types/common.types'

export const asyncHandler: AsyncHandlerWrapper = (fn: AsyncHandler) => {
   return async (
      req: Request,
      res: Response,
      next: NextFunction
   ): Promise<void> => {
      try {
         await fn(req, res, next)
      } catch (error) {
         next(error)
      }
   }
}

export const isProduction = env.application.NODE_ENV === 'production'
export const isDevelopment = env.application.NODE_ENV === 'development'
export const isTest = env.application.NODE_ENV === 'test'

export function parsePhoneNumberAuto(input: string): string {
   const phoneNumber = parsePhoneNumberFromString(input, { extract: true })

   if (!phoneNumber || !phoneNumber.isValid()) {
      throw new Error(`Invalid phone number: ${input}`)
   }

   return phoneNumber.number
}
