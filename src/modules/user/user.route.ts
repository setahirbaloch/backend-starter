import { authenticate, authorize } from '@src/middlewares/auth.middleware'
import { validate } from '@src/middlewares/validation.middleware'
import { UserRole } from '@src/types/enums.types'
import { asyncHandler } from '@src/utils/common.utils'
import { Router } from 'express'
import {
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
} from './user.controller'
import {
   DeleteUserSchema,
   ListUsersSchema,
   UpdateUserRoleSchema,
   UpdateUserStatusSchema,
   UserBaseSchema,
   UserIdParamSchema,
   updateUserProfileSchema,
} from './user.schema'

/*───────────────User Routes───────────────*/
export const user_router = Router()

/*───────────────Public Routes───────────────*/
user_router.post(
   '/',
   validate(UserBaseSchema),
   asyncHandler(createUserController)
)

/*───────────────Authenticated User Routes───────────────*/
/*───────────────Get Current User───────────────*/
user_router.get('/me', authenticate, asyncHandler(getCurrentUserController))

/*───────────────Profile Management───────────────*/
user_router.patch(
   '/me/profile',
   authenticate,
   validate(updateUserProfileSchema),
   asyncHandler(updateUserProfileController)
)

/*───────────────Account Deletion───────────────*/
user_router.delete(
   '/me',
   authenticate,
   validate(DeleteUserSchema),
   asyncHandler(requestUserDeletionController)
)

user_router.post(
   '/me/cancel-deletion',
   authenticate,
   asyncHandler(cancelUserDeletionController)
)

user_router.delete(
   '/me/delete-permanently',
   authenticate,
   asyncHandler(deleteUserPermanentlyController)
)

/*───────────────Device/Session Management───────────────*/
user_router.get(
   '/me/devices',
   authenticate,
   asyncHandler(getUserDevicesController)
)

user_router.delete(
   '/me/devices/:deviceId',
   authenticate,
   asyncHandler(revokeDeviceController)
)

user_router.post(
   '/me/devices/revoke-all',
   authenticate,
   asyncHandler(revokeAllOtherDevicesController)
)

/*───────────────Admin Routes───────────────*/
user_router.get(
   '/admin/users',
   authenticate,
   authorize([UserRole.ADMIN]),
   validate(ListUsersSchema, 'query'),
   asyncHandler(listUsersController)
)

user_router.get(
   '/admin/users/:userId',
   authenticate,
   authorize([UserRole.ADMIN]),
   validate(UserIdParamSchema, 'params'),
   asyncHandler(getUserDetailsController)
)

user_router.patch(
   '/admin/users/:userId/role',
   authenticate,
   authorize([UserRole.ADMIN]),
   validate(UserIdParamSchema, 'params'),
   validate(UpdateUserRoleSchema),
   asyncHandler(updateUserRoleController)
)

user_router.patch(
   '/admin/users/:userId/status',
   authenticate,
   authorize([UserRole.ADMIN]),
   validate(UserIdParamSchema, 'params'),
   validate(UpdateUserStatusSchema),
   asyncHandler(updateUserStatusController)
)

user_router.get(
   '/admin/users/:userId/login-history',
   authenticate,
   authorize([UserRole.ADMIN]),
   validate(UserIdParamSchema, 'params'),
   asyncHandler(getUserLoginHistoryController)
)
