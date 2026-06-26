import { env } from '@src/config/env/env.config'
import { internal } from '@src/errors/error-factory'
import type { EmailOptions, SmtpConfig } from '@src/types/mailer.types'
import nodemailer from 'nodemailer'

/*───────────────Determine Secure Connection───────────────*/
/* Determine secure connection based on port and explicit SECURE flag */
const isSecureConnection = (): boolean => {
   if (env.smtp.SECURE) {
      return true
   }
   /* Port 465 is typically used for SSL/TLS */
   return env.smtp.PORT === 465
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

/*───────────────Create Mail Transporter───────────────*/
const mailTransporter = nodemailer.createTransport(smtpConfig)

/*───────────────Verify SMTP Connection───────────────*/
/* Graceful SMTP connection verification - don't crash on failure */
mailTransporter.verify().then(
   () => {
      console.log('SMTP server connection verified successfully')
   },
   (err) => {
      /* Log error but don't throw - allow application to start */
      /* Email sending will fail gracefully later if needed */
      console.log(
         'SMTP connection verification failed - emails may not work',
         err,
         {
            host: env.smtp.HOST,
            port: env.smtp.PORT,
         }
      )
   }
)

/*───────────────Send Email───────────────*/
export async function sendEmail(options: EmailOptions): Promise<void> {
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
   } catch (_error) {
      throw internal(
         'Failed to send email',
         {
            entity: 'mailer',
            meta: { recipient: options.to, subject: options.subject },
         },
         { hasHtml: !!options.html, hasText: !!options.text },
         'Check your SMTP configuration or try again later'
      )
   }
}

/*───────────────Verify Connection───────────────*/
export async function verifyMailerConnection(): Promise<void> {
   try {
      await mailTransporter.verify()
   } catch (_error) {
      throw internal(
         'Mailer verification failed',
         {
            entity: 'mailer',
            meta: { host: env.smtp.HOST, port: env.smtp.PORT },
         },
         { smtpHost: env.smtp.HOST },
         'Verify your SMTP credentials and network connectivity'
      )
   }
}

export { mailTransporter }
