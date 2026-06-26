import crypto from 'node:crypto'
import type { Request } from 'express'

/**
 * Device Utilities
 * Helper functions for device tracking and fingerprinting
 */

/**
 * Generate a unique device ID based on user agent and other factors
 */
export const generateDeviceId = (req: Request): string => {
   const userAgent = req.headers['user-agent'] || 'unknown'
   const acceptLanguage = req.headers['accept-language'] || ''
   const acceptEncoding = req.headers['accept-encoding'] || ''

   const fingerprint = `${userAgent}|${acceptLanguage}|${acceptEncoding}`
   return crypto.createHash('sha256').update(fingerprint).digest('hex')
}

/**
 * Extract device information from request
 */
export const extractDeviceInfo = (req: Request) => {
   const userAgent = req.headers['user-agent'] || ''
   const ipAddress = getClientIp(req)

   return {
      deviceId: generateDeviceId(req),
      userAgent,
      ipAddress,
      deviceName: parseDeviceName(userAgent),
      deviceType: parseDeviceType(userAgent),
      browser: parseBrowser(userAgent),
      os: parseOS(userAgent),
   }
}

/**
 * Get client IP address from request
 */
export const getClientIp = (req: Request): string => {
   const forwarded = req.headers['x-forwarded-for']
   if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim()
   }
   return req.socket.remoteAddress || 'unknown'
}

/**
 * Parse device name from user agent
 */
const parseDeviceName = (userAgent: string): string => {
   if (/mobile/i.test(userAgent)) {
      if (/iPhone/i.test(userAgent)) return 'iPhone'
      if (/iPad/i.test(userAgent)) return 'iPad'
      if (/Android/i.test(userAgent)) return 'Android Device'
      return 'Mobile Device'
   }
   if (/tablet/i.test(userAgent)) return 'Tablet'
   return 'Desktop'
}

/**
 * Parse device type from user agent
 */
const parseDeviceType = (userAgent: string): string => {
   if (/mobile/i.test(userAgent)) return 'mobile'
   if (/tablet/i.test(userAgent)) return 'tablet'
   return 'desktop'
}

/**
 * Parse browser from user agent
 */
const parseBrowser = (userAgent: string): string => {
   if (/Edg/i.test(userAgent)) return 'Edge'
   if (/Chrome/i.test(userAgent)) return 'Chrome'
   if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) return 'Safari'
   if (/Firefox/i.test(userAgent)) return 'Firefox'
   if (/MSIE|Trident/i.test(userAgent)) return 'Internet Explorer'
   return 'Unknown'
}

/**
 * Parse OS from user agent
 */
const parseOS = (userAgent: string): string => {
   if (/Windows NT 10/i.test(userAgent)) return 'Windows 10'
   if (/Windows NT 6.3/i.test(userAgent)) return 'Windows 8.1'
   if (/Windows NT 6.2/i.test(userAgent)) return 'Windows 8'
   if (/Windows NT 6.1/i.test(userAgent)) return 'Windows 7'
   if (/Windows/i.test(userAgent)) return 'Windows'
   if (/Mac OS X/i.test(userAgent)) return 'macOS'
   if (/Linux/i.test(userAgent)) return 'Linux'
   if (/Android/i.test(userAgent)) return 'Android'
   if (/iOS/i.test(userAgent)) return 'iOS'
   return 'Unknown'
}
