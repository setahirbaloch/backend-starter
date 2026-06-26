declare module 'multer' {
   export type FileFilterCallback = (
      error: Error | null,
      acceptFile?: boolean
   ) => void

   export interface StorageEngine {}

   export interface MulterError extends Error {
      code?: string
      field?: string
      storageErrors?: string[]
      size?: number
   }

   const multer: any
   export default multer
   export { multer }
}
