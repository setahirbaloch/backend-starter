/*───────────────Determine Secure Connection───────────────*/

import type { SmtpConfig } from '../types/mailer.types'
import { env } from './env/env.config'

/* Determine secure connection based on port and explicit SECURE flag */
export const isSecureConnection = (): boolean => {
   if (env.smtp.SECURE) {
      return true
   }
   /* Port 465 is typically used for SSL/TLS */
   return env.smtp.PORT === 465
}

/*───────────────SMTP Configuration Factory───────────────*/
export const createSmtpConfig = (): SmtpConfig => ({
   host: env.smtp.HOST,
   port: env.smtp.PORT,
   secure: isSecureConnection(),
   auth: {
      user: env.smtp.USERNAME,
      pass: env.smtp.PASSWORD,
   },
   pool: true,
   maxConnections: 5,
   maxMessages: 100,
   connectionTimeout: 10_000,
   greetingTimeout: 10_000,
   socketTimeout: 10_000,
})

/*───────────────Email Configuration Helpers───────────────*/
export const getDefaultFromEmail = (): string => env.smtp.FROM_EMAIL
export const getDefaultFromName = (): string => env.smtp.FROM_NAME
