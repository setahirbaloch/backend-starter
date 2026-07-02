import { env } from '@src/config/env/env.config'
import { internal } from '@src/errors/error-factory'
import type { EmailOptions, SmtpConfig } from '@src/types/mailer.types'
import nodemailer from 'nodemailer'

/*───────────────Environment───────────────*/
const isTestEnvironment = env.application.NODE_ENV === 'test'
const isMailerEnabled = !isTestEnvironment

/*───────────────Determine Secure Connection───────────────*/
const isSecureConnection = (): boolean => {
   return env.smtp.SECURE || env.smtp.PORT === 465
}

/*───────────────SMTP Configuration───────────────*/
const smtpConfig: SmtpConfig = {
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
}

/*───────────────Mail Transporter───────────────*/
const mailTransporter = nodemailer.createTransport(smtpConfig)

/*───────────────Send Email───────────────*/
export async function sendEmail(options: EmailOptions): Promise<void> {
   if (!isMailerEnabled) {
      console.log('[TEST EMAIL]', {
         to: options.to,
         subject: options.subject,
      })
      return
   }

   try {
      await mailTransporter.sendMail({
         from: options.from ?? env.smtp.FROM_EMAIL,
         to: options.to,
         cc: options.cc,
         bcc: options.bcc,
         replyTo: options.replyTo,
         subject: options.subject,
         html: options.html,
         text: options.text,
      })
   } catch {
      throw internal(
         'Failed to send email',
         {
            entity: 'mailer',
            meta: {
               recipient: options.to,
               subject: options.subject,
            },
         },
         {
            hasHtml: Boolean(options.html),
            hasText: Boolean(options.text),
         },
         'Check your SMTP configuration or try again later'
      )
   }
}

/*───────────────Verify SMTP Connection───────────────*/
export async function verifyMailerConnection(): Promise<void> {
   if (!isMailerEnabled) {
      return
   }

   try {
      await mailTransporter.verify()
   } catch {
      throw internal(
         'Mailer verification failed',
         {
            entity: 'mailer',
            meta: {
               host: env.smtp.HOST,
               port: env.smtp.PORT,
            },
         },
         {
            smtpHost: env.smtp.HOST,
         },
         'Verify your SMTP credentials and network connectivity'
      )
   }
}

export { mailTransporter }
