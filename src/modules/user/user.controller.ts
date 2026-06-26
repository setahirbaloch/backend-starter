import {
   badRequest,
   conflict,
   unauthenticated,
} from '@src/errors/error-factory'
import { TokenType } from '@src/types/enums.types'
import { success } from '@src/utils/api.utils'
import { clearTokenCookie, createTokenCookie } from '@src/utils/cookies.utils'
import { extractDeviceInfo } from '@src/utils/device.utils'
import { JWT } from '@src/utils/jwt.utils'
import type { NextFunction, Request, Response } from 'express'
import {
   getUserDevices,
   revokeAllDevicesExceptCurrent,
   revokeDevice,
} from '../device/device.service'
import {
   cancelUserDeletion,
   createUser,
   deleteUserPermanently,
   getCurrentUser,
   getUserDetails,
   getUserLoginHistory,
   listUsers,
   requestUserDeletion,
   updateUserProfile,
   updateUserRole,
   updateUserStatus,
} from './user.service'

/*───────────────CREATE USER CONTROLLER───────────────*/
const createUserController = async (
   req: Request,
   res: Response,
   next: NextFunction
): Promise<void> => {
   try {
      const { email, password } = req.body
      const user = await createUser({ email, password })

      /*───────────────Create Verification Token & Cookie───────────────*/
      const verifyEmailToken = JWT.create(user.id, TokenType.VERIFY)
      const verifyCookie = createTokenCookie(TokenType.VERIFY, verifyEmailToken)

      res.cookie(verifyCookie.key, verifyCookie.value, verifyCookie.options)
      res.status(201).json(success(user, 'User created successfully'))
   } catch (error: any) {
      /**
       * Example: duplicate email constraint
       * Prisma / DB error should ideally be mapped in service layer,
       * but this fallback prevents leaking internal errors.
       */
      if (error?.code === 'P2002') {
         return next(
            conflict(
               'Email already exists',
               { entity: 'user', meta: { field: 'email' } },
               undefined,
               'Try signing in instead of creating a new account.'
            )
         )
      }

      next(error)
   }
}

/*───────────────REQUEST USER DELETION CONTROLLER───────────────*/
const requestUserDeletionController = async (
   req: Request,
   res: Response,
   next: NextFunction
) => {
   try {
      const userId = req.userId
      if (!userId) {
         throw unauthenticated(
            'Authentication required',
            { entity: 'user' },
            undefined,
            'Please login again.'
         )
      }

      const { deletionReason } = req.body

      if (!deletionReason) {
         throw badRequest(
            'Deletion reason is required',
            { entity: 'user' },
            { field: 'deletionReason' }
         )
      }

      await requestUserDeletion(userId, deletionReason)

      /*───────────────Clear Auth Cookies───────────────*/
      const refreshCookie = clearTokenCookie(TokenType.REFRESH)
      const accessCookie = clearTokenCookie(TokenType.ACCESS)

      res.clearCookie(refreshCookie.key, refreshCookie.options)
      res.clearCookie(accessCookie.key, accessCookie.options)

      res.status(200).json(
         success(
            {},
            'Account deletion requested successfully. You have 30 days to cancel this request.'
         )
      )
   } catch (error) {
      next(error)
   }
}

/*───────────────DELETE USER PERMANENTLY CONTROLLER───────────────*/
const deleteUserPermanentlyController = async (
   req: Request,
   res: Response,
   next: NextFunction
): Promise<void> => {
   try {
      const userId = req.userId
      if (!userId) {
         throw unauthenticated(
            'Authentication required',
            { entity: 'user' },
            undefined,
            'Please login again.'
         )
      }
      await deleteUserPermanently(userId)
      res.status(200).json(success({}, 'User deleted permanently successfully'))
   } catch (error) {
      next(error)
   }
}
/*───────────────UPDATE USER PROFILE CONTROLLER───────────────*/
const updateUserProfileController = async (
   req: Request,
   res: Response,
   next: NextFunction
): Promise<void> => {
   try {
      const data = req.body

      const user = await updateUserProfile({ ...data, userId: req.userId })

      res.status(201).json(success(user, 'Profile updated successfully'))
   } catch (error: any) {
      next(error)
   }
}
/*───────────────GET CURRENT USER CONTROLLER───────────────*/
const getCurrentUserController = async (
   req: Request,
   res: Response,
   next: NextFunction
): Promise<void> => {
   try {
      const userId = req.userId
      if (!userId) {
         throw unauthenticated(
            'Authentication required',
            { entity: 'user' },
            undefined,
            'Please login again.'
         )
      }

      const user = await getCurrentUser(userId)
      res.status(200).json(success(user, 'User retrieved successfully'))
   } catch (error) {
      next(error)
   }
}

/*───────────────CANCEL USER DELETION CONTROLLER───────────────*/
const cancelUserDeletionController = async (
   req: Request,
   res: Response,
   next: NextFunction
): Promise<void> => {
   try {
      const userId = req.userId
      if (!userId) {
         throw unauthenticated(
            'Authentication required',
            { entity: 'user' },
            undefined,
            'Please login again.'
         )
      }

      await cancelUserDeletion(userId)

      res.status(200).json(
         success({}, 'Account deletion cancelled. Your account is now active.')
      )
   } catch (error) {
      next(error)
   }
}

/*───────────────GET USER DEVICES CONTROLLER───────────────*/
const getUserDevicesController = async (
   req: Request,
   res: Response,
   next: NextFunction
): Promise<void> => {
   try {
      const userId = req.userId
      if (!userId) {
         throw unauthenticated(
            'Authentication required',
            { entity: 'user' },
            undefined,
            'Please login again.'
         )
      }

      const devices = await getUserDevices(userId)

      // Mark current device
      const currentDeviceId = extractDeviceInfo(req).deviceId
      const devicesWithCurrent = devices.map((device) => ({
         ...device,
         isCurrent: device.deviceId === currentDeviceId,
      }))

      res.status(200).json(
         success(devicesWithCurrent, 'Devices retrieved successfully')
      )
   } catch (error) {
      next(error)
   }
}

/*───────────────REVOKE DEVICE CONTROLLER───────────────*/
const revokeDeviceController = async (
   req: Request,
   res: Response,
   next: NextFunction
): Promise<void> => {
   try {
      const userId = req.userId
      const { deviceId } = req.params

      if (!userId) {
         throw unauthenticated(
            'Authentication required',
            { entity: 'user' },
            undefined,
            'Please login again.'
         )
      }

      if (!deviceId) {
         throw badRequest(
            'Device ID is required',
            { entity: 'device' },
            { field: 'deviceId' },
            'Provide a valid device ID.'
         )
      }

      await revokeDevice(userId, deviceId)

      res.status(200).json(success({}, 'Device revoked successfully'))
   } catch (error) {
      next(error)
   }
}

/*───────────────REVOKE ALL OTHER DEVICES CONTROLLER───────────────*/
const revokeAllOtherDevicesController = async (
   req: Request,
   res: Response,
   next: NextFunction
): Promise<void> => {
   try {
      const userId = req.userId
      if (!userId) {
         throw unauthenticated(
            'Authentication required',
            { entity: 'user' },
            undefined,
            'Please login again.'
         )
      }

      const currentDeviceId = extractDeviceInfo(req).deviceId
      const revokedCount = await revokeAllDevicesExceptCurrent(
         userId,
         currentDeviceId
      )

      res.status(200).json(
         success(
            { revokedCount },
            `Successfully revoked ${revokedCount} device(s)`
         )
      )
   } catch (error) {
      next(error)
   }
}

/*───────────────ADMIN: LIST USERS CONTROLLER───────────────*/
const listUsersController = async (
   req: Request,
   res: Response,
   next: NextFunction
): Promise<void> => {
   try {
      const { page, limit, role, status, search } = req.query

      const result = await listUsers({
         page: page ? Number(page) : undefined,
         limit: limit ? Number(limit) : undefined,
         role: role as any,
         status: status as any,
         search: search as string,
      })

      res.status(200).json(success(result, 'Users retrieved successfully'))
   } catch (error) {
      next(error)
   }
}

/*───────────────ADMIN: GET USER DETAILS CONTROLLER───────────────*/
const getUserDetailsController = async (
   req: Request,
   res: Response,
   next: NextFunction
): Promise<void> => {
   try {
      const { userId } = req.params

      if (!userId) {
         throw badRequest(
            'User ID is required',
            { entity: 'user' },
            { field: 'userId' },
            'Provide a valid user ID.'
         )
      }

      const user = await getUserDetails(userId)

      res.status(200).json(success(user, 'User details retrieved successfully'))
   } catch (error) {
      next(error)
   }
}

/*───────────────ADMIN: UPDATE USER ROLE CONTROLLER───────────────*/
const updateUserRoleController = async (
   req: Request,
   res: Response,
   next: NextFunction
): Promise<void> => {
   try {
      const adminId = req.userId
      const { userId } = req.params
      const { role } = req.body

      if (!userId) {
         throw badRequest(
            'User ID is required',
            { entity: 'user' },
            { field: 'userId' },
            'Provide a valid user ID.'
         )
      }

      if (!role) {
         throw badRequest(
            'Role is required',
            { entity: 'user' },
            { field: 'role' },
            'Provide a valid role.'
         )
      }

      const updatedUser = await updateUserRole(adminId, userId, role)

      res.status(200).json(
         success(updatedUser, 'User role updated successfully')
      )
   } catch (error) {
      next(error)
   }
}

/*───────────────ADMIN: UPDATE USER STATUS CONTROLLER───────────────*/
const updateUserStatusController = async (
   req: Request,
   res: Response,
   next: NextFunction
): Promise<void> => {
   try {
      const { userId } = req.params
      const { status, reason } = req.body

      if (!userId) {
         throw badRequest(
            'User ID is required',
            { entity: 'user' },
            { field: 'userId' },
            'Provide a valid user ID.'
         )
      }

      if (!status) {
         throw badRequest(
            'Status is required',
            { entity: 'user' },
            { field: 'status' },
            'Provide a valid status.'
         )
      }

      const updatedUser = await updateUserStatus(userId, status, reason)

      res.status(200).json(
         success(updatedUser, 'User status updated successfully')
      )
   } catch (error) {
      next(error)
   }
}

/*───────────────ADMIN: GET USER LOGIN HISTORY CONTROLLER───────────────*/
const getUserLoginHistoryController = async (
   req: Request,
   res: Response,
   next: NextFunction
): Promise<void> => {
   try {
      const { userId } = req.params
      const { limit } = req.query

      if (!userId) {
         throw badRequest(
            'User ID is required',
            { entity: 'user' },
            { field: 'userId' },
            'Provide a valid user ID.'
         )
      }

      const history = await getUserLoginHistory(
         userId,
         limit ? Number(limit) : undefined
      )

      res.status(200).json(
         success(history, 'Login history retrieved successfully')
      )
   } catch (error) {
      next(error)
   }
}

export {
   cancelUserDeletionController,
   createUserController,
   deleteUserPermanentlyController,
   getCurrentUserController,
   getUserDetailsController,
   getUserDevicesController,
   getUserLoginHistoryController,
   listUsersController,
   requestUserDeletionController,
   revokeAllOtherDevicesController,
   revokeDeviceController,
   updateUserProfileController,
   updateUserRoleController,
   updateUserStatusController,
}
