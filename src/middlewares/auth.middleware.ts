import type { UserRole } from '@generated/enums'
import type { NextFunction, Request, Response } from 'express'
import { getDb } from '../config/db.config'
import { env } from '../config/env/env.config'
import { forbidden, unauthenticated } from '../errors/error-factory'
import { TokenType } from '../types/enums.types'
import { JWT } from '../utils/jwt.utils'

/*───────────────Authentication Middleware───────────────*/
export const authenticate = async (
   req: Request,
   _res: Response,
   next: NextFunction
): Promise<void> => {
   try {
      /*───────────────Extract token from cookie or Authorization header───────────────*/
      const token = req.cookies[env.cookies.KEYS.ACCESS]

      if (!token) {
         throw unauthenticated(
            'Authentication required',
            {
               entity: 'auth',
               meta: { middleware: 'authenticate', endpoint: req.path },
            },
            { cookieName: env.cookies.KEYS.ACCESS },
            'Please sign in to access this resource'
         )
      }

      /*───────────────Verify JWT token───────────────*/
      const userId = JWT.verify(token, TokenType.ACCESS)

      /*───────────────Get user and attach to request───────────────*/
      req.userId = userId
      next()
   } catch (error) {
      next(error)
   }
}

/*───────────────Authorization Middleware (Role-Based)───────────────*/
export const authorize = (allowedRoles: UserRole[]) => {
   return async (
      req: Request,
      _res: Response,
      next: NextFunction
   ): Promise<void> => {
      try {
         const userId = req.userId

         if (!userId) {
            throw unauthenticated(
               'Authentication required',
               {
                  entity: 'auth',
                  meta: { middleware: 'authorize', endpoint: req.path },
               },
               undefined,
               'Please sign in to access this resource'
            )
         }

         const db = getDb()
         const user = await db.user.findUnique({
            where: { id: userId },
            select: { role: true, status: true },
         })

         if (!user) {
            throw unauthenticated(
               'User not found',
               { entity: 'auth', entityId: userId },
               undefined,
               'Please sign in again'
            )
         }

         if (!allowedRoles.includes(user.role)) {
            throw forbidden(
               'Insufficient permissions',
               {
                  entity: 'auth',
                  entityId: userId,
                  meta: { userRole: user.role, requiredRoles: allowedRoles },
               },
               { userRole: user.role, requiredRoles: allowedRoles },
               'You do not have permission to access this resource'
            )
         }

         next()
      } catch (error) {
         next(error)
      }
   }
}
