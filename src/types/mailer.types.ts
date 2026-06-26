export interface EmailOptions {
   to: string | string[]
   subject: string
   html?: string
   text?: string
   from?: string
   cc?: string | string[]
   bcc?: string | string[]
   replyTo?: string
}

export interface SmtpConfig {
   host: string
   port: number
   secure: boolean
   auth: {
      user: string
      pass: string
   }
   pool: boolean
   maxConnections: number
   maxMessages: number
   connectionTimeout: number
   greetingTimeout: number
   socketTimeout: number
}

export interface MailerService {
   sendEmail(options: EmailOptions): Promise<void>
   verify(): Promise<void>
}
