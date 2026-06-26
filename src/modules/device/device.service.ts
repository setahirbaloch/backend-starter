import { getDb } from '@src/config/db.config'
import { badRequest, notFound } from '@src/errors/error-factory'
import { OtpPurpose } from '@src/types/enums.types'
import { extractDeviceInfo } from '@src/utils/device.utils'
import type { Request } from 'express'
import { generateAndSendOtp } from '../otp/otp.service'

/*───────────────── Module-level DB client ─────────────────*/
const db = getDb()

/*───────────────── Device Session Types ─────────────────*/
export type DeviceSessionInfo = {
   id: string
   deviceId: string
   deviceName: string | null
   deviceType: string | null
   browser: string | null
   os: string | null
   ipAddress: string | null
   isTrusted: boolean
   lastActiveAt: Date
   createdAt: Date
}

/*───────────────── Check if device is trusted ─────────────────*/
export const isDeviceTrusted = async (
   userId: string,
   deviceId: string
): Promise<boolean> => {
   const device = await db.deviceSession.findUnique({
      where: {
         userId_deviceId: {
            userId,
            deviceId,
         },
      },
      select: {
         isTrusted: true,
         revokedAt: true,
      },
   })

   return device ? device.isTrusted && !device.revokedAt : false
}

/*───────────────── Register or update device ─────────────────*/
export const registerDevice = async (
   userId: string,
   req: Request,
   isTrusted = false
): Promise<void> => {
   const deviceInfo = extractDeviceInfo(req)

   await db.deviceSession.upsert({
      where: {
         userId_deviceId: {
            userId,
            deviceId: deviceInfo.deviceId,
         },
      },
      update: {
         lastActiveAt: new Date(),
         ipAddress: deviceInfo.ipAddress,
         isTrusted,
      },
      create: {
         userId,
         deviceId: deviceInfo.deviceId,
         deviceName: deviceInfo.deviceName,
         deviceType: deviceInfo.deviceType,
         browser: deviceInfo.browser,
         os: deviceInfo.os,
         ipAddress: deviceInfo.ipAddress,
         userAgent: deviceInfo.userAgent,
         isTrusted,
         lastActiveAt: new Date(),
      },
   })
}

/*───────────────── Trust current device ─────────────────*/
export const trustDevice = async (
   userId: string,
   deviceId: string
): Promise<{ deviceId: string; isTrusted: boolean }> => {
   const device = await db.deviceSession.findUnique({
      where: {
         userId_deviceId: {
            userId,
            deviceId,
         },
      },
      select: {
         isTrusted: true,
      },
   })

   if (!device) {
      throw notFound(
         'Device not found',
         { entity: 'device', meta: { userId, deviceId } },
         { deviceId },
         'The device may have already been revoked.'
      )
   }

   if (device.isTrusted) {
      throw badRequest(
         'Device already trusted',
         {
            entity: 'device',
            meta: { userId, deviceId },
         },
         { deviceId },
         'The device is already trusted.'
      )
   }

   const updatedDevice = await db.deviceSession.update({
      where: {
         userId_deviceId: {
            userId,
            deviceId,
         },
      },
      data: {
         isTrusted: true,
      },
   })
   return updatedDevice
}

/*───────────────── Send device verification OTP ─────────────────*/
export const sendDeviceVerificationOtp = async (
   userId: string,
   email: string
): Promise<void> => {
   await generateAndSendOtp({
      userId,
      email,
      purpose: OtpPurpose.VERIFY_DEVICE,
   })
}

/*───────────────── Get user devices ─────────────────*/
export const getUserDevices = async (
   userId: string
): Promise<DeviceSessionInfo[]> => {
   const devices = await db.deviceSession.findMany({
      where: {
         userId,
         revokedAt: null,
      },
      select: {
         id: true,
         deviceId: true,
         deviceName: true,
         deviceType: true,
         browser: true,
         os: true,
         ipAddress: true,
         isTrusted: true,
         lastActiveAt: true,
         createdAt: true,
      },
      orderBy: {
         lastActiveAt: 'desc',
      },
   })

   return devices
}

/*───────────────── Revoke device session ─────────────────*/
export const revokeDevice = async (
   userId: string,
   deviceId: string
): Promise<void> => {
   const device = await db.deviceSession.findUnique({
      where: {
         userId_deviceId: {
            userId,
            deviceId,
         },
      },
   })

   if (!device) {
      throw notFound(
         'Device session not found',
         { entity: 'device', meta: { userId, deviceId } },
         { deviceId },
         'The device session may have already been revoked.'
      )
   }

   await db.deviceSession.update({
      where: {
         userId_deviceId: {
            userId,
            deviceId,
         },
      },
      data: {
         revokedAt: new Date(),
      },
   })
}

/*───────────────── Revoke all devices except current ─────────────────*/
export const revokeAllDevicesExceptCurrent = async (
   userId: string,
   currentDeviceId: string
): Promise<number> => {
   const result = await db.deviceSession.updateMany({
      where: {
         userId,
         deviceId: {
            not: currentDeviceId,
         },
         revokedAt: null,
      },
      data: {
         revokedAt: new Date(),
      },
   })

   return result.count
}
