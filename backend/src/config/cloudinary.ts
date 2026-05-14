import { v2 as cloudinary } from 'cloudinary'
import { Cloudinary } from '@cloudinary/url-gen'



// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_SECRET,
  secure: true
})

export const cloudinaryApi = new Cloudinary({
  cloud: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_NAME
  },
  url: {
    secure: true
  }
})

// Upload image to Cloudinary
export const uploadImage = async (
  file: string | Buffer,
  folder: string = 'premium-meat-shop'
): Promise<{ url: string; publicId: string }> => {
  try {
    if (
      !(process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_NAME) ||
      !(process.env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_KEY) ||
      !(process.env.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_SECRET)
    ) {
      throw new Error('Cloudinary is not configured')
    }

    if (Buffer.isBuffer(file)) {
      const result = await new Promise<any>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: 'auto',
            quality: 'auto',
            fetch_format: 'auto',
          },
          (error, uploadResult) => {
            if (error || !uploadResult) return reject(error || new Error('Cloudinary upload failed'))
            resolve(uploadResult)
          }
        )
        stream.end(file)
      })

      return {
        url: result.secure_url,
        publicId: result.public_id,
      }
    }

    const result = await cloudinary.uploader.upload(file, {
      folder,
      resource_type: 'auto',
      quality: 'auto',
      fetch_format: 'auto'
    })

    return {
      url: result.secure_url,
      publicId: result.public_id
    }
  } catch (error) {
    console.error('Cloudinary upload error:', error)
    throw new Error('Failed to upload image')
  }
}

// Delete image from Cloudinary
export const deleteImage = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId)
  } catch (error) {
    console.error('Cloudinary delete error:', error)
    throw new Error('Failed to delete image')
  }
}

// Get optimized image URL
export const getOptimizedImageUrl = (
  publicId: string,
  options: {
    width?: number
    height?: number
    quality?: number
    crop?: string
  } = {}
): string => {
  const transformations = []

  if (options.width) transformations.push(`w_${options.width}`)
  if (options.height) transformations.push(`h_${options.height}`)
  if (options.quality) transformations.push(`q_${options.quality}`)
  if (options.crop) transformations.push(`c_${options.crop}`)

  const transformationString = transformations.length > 0 
    ? transformations.join(',') 
    : 'q_auto,f_auto'

  return cloudinary.url(publicId, {
    transformation: transformationString,
    secure: true
  })
}

export default cloudinary
