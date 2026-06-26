// src/config/cloudinary.config.ts

import { v2 as cloudinary } from 'cloudinary'
import { env } from './env/env.config'

/**
 * Configure Cloudinary with environment variables
 */
cloudinary.config({
   cloud_name: env.cloudinary.CLOUD_NAME,
   api_key: env.cloudinary.API_KEY,
   api_secret: env.cloudinary.API_SECRET,
})

export default cloudinary

/**
 * Cloudinary configuration for multer storage
 */
export const cloudinaryStorage = {
   cloudinary,
   params: {
      folder: 'bk-starter/photos',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [
         {
            width: 1200,
            height: 800,
            crop: 'limit',
            quality: 'auto',
         },
      ],
   } as const,
}

/**
 * Generate public ID for photos
 */
export const generatePublicId = (assetId: string, fileName: string): string => {
   const timestamp = Date.now()
   const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9]/g, '_')
   return `asset_${assetId}_${timestamp}_${sanitizedFileName}`
}

/**
 * Get optimized image URL
 */
export const getOptimizedImageUrl = (
   publicId: string,
   options: {
      width?: number
      height?: number
      quality?: 'auto' | number
      format?: 'jpg' | 'png' | 'webp'
   } = {}
): string => {
   const {
      width = 800,
      height = 600,
      quality = 'auto',
      format = 'webp',
   } = options

   return cloudinary.url(publicId, {
      width,
      height,
      crop: 'fill',
      quality,
      format,
      secure: true,
   })
}
