export const validateImageFile = (
   mimetype: string,
   originalname: string
): void => {
   const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
   ]

   if (!allowedMimeTypes.includes(mimetype)) {
      throw new Error(`Unsupported image type: ${originalname}`)
   }
}

export const validateImageSize = (size: number): void => {
   const maxSizeBytes = 5 * 1024 * 1024

   if (size > maxSizeBytes) {
      throw new Error('Image exceeds maximum size of 5MB')
   }
}
