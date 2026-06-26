declare global {
   namespace Express {
      interface Request {
         userId: string
         file?: unknown
         files?: unknown
      }
   }
}

export {}
