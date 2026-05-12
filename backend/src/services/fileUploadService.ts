// @ts-nocheck
import multer from 'multer'
import path from 'path'
import fs from 'fs/promises'
import { v2 as cloudinary } from 'cloudinary'
import { prisma } from '../database'

export interface UploadOptions {
  folder?: string
  maxSize?: number
  allowedTypes?: string[]
  isPublic?: boolean
  generateThumbnails?: boolean
}

export interface UploadResult {
  success: boolean
  url?: string
  publicId?: string
  filename?: string
  size?: number
  mimeType?: string
  error?: string
}

export interface FileMetadata {
  originalName: string
  filename: string
  path: string
  size: number
  mimeType: string
  uploadedAt: Date
  uploadedBy?: string
  folder?: string
  isPublic: boolean
}

class FileUploadService {
  private uploadDir: string
  private cloudinaryConfig: any

  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR || './uploads'
    this.ensureUploadDirectory()
    this.initializeCloudinary()
  }

  private async ensureUploadDirectory(): Promise<void> {
    try {
      await fs.access(this.uploadDir)
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true })
    }

    // Create subdirectories
    const subdirs = ['products', 'profiles', 'documents', 'temp']
    for (const subdir of subdirs) {
      const fullPath = path.join(this.uploadDir, subdir)
      try {
        await fs.access(fullPath)
      } catch {
        await fs.mkdir(fullPath, { recursive: true })
      }
    }
  }

  private initializeCloudinary(): void {
    this.cloudinaryConfig = {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    }

    cloudinary.config(this.cloudinaryConfig)
  }

  private getMulterConfig(options: UploadOptions = {}): multer.Options {
    const {
      maxSize = 10 * 1024 * 1024, // 10MB default
      allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      folder = 'general'
    } = options

    const storage = multer.diskStorage({
      destination: async (req, file, cb) => {
        const uploadPath = path.join(this.uploadDir, folder)
        await fs.mkdir(uploadPath, { recursive: true })
        cb(null, uploadPath)
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        const ext = path.extname(file.originalname)
        cb(null, file.fieldname + '-' + uniqueSuffix + ext)
      }
    })

    const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true)
      } else {
        cb(new Error(`File type ${file.mimetype} is not allowed`))
      }
    }

    return {
      storage,
      limits: {
        fileSize: maxSize
      },
      fileFilter
    }
  }

  getMiddleware(options: UploadOptions = {}): multer.Multer {
    return multer(this.getMulterConfig(options))
  }

  async uploadToCloudinary(
    filePath: string,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    try {
      const {
        folder = 'hincton',
        generateThumbnails = true
      } = options

      const result = await cloudinary.uploader.upload(filePath, {
        folder,
        resource_type: 'auto',
        use_filename: true,
        unique_filename: true,
        overwrite: false,
        transformation: generateThumbnails ? [
          { width: 800, height: 600, crop: 'limit', quality: 'auto' },
          { width: 400, height: 300, crop: 'limit', quality: 'auto', format: 'webp' }
        ] : undefined
      })

      // Clean up local file after upload
      await fs.unlink(filePath)

      return {
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
        filename: result.original_filename,
        size: result.bytes,
        mimeType: result.format
      }

    } catch (error) {
      console.error('Cloudinary upload error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      }
    }
  }

  async uploadLocal(
    file: Express.Multer.File,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    try {
      const {
        folder = 'general',
        isPublic = true
      } = options

      const filename = file.filename
      const filePath = file.path

      // Get file info
      const stats = await fs.stat(filePath)
      const metadata: FileMetadata = {
        originalName: file.originalname,
        filename,
        path: filePath,
        size: stats.size,
        mimeType: file.mimetype,
        uploadedAt: new Date(),
        folder,
        isPublic
      }

      // Save to database if user is authenticated
      // This would be handled in the controller with user info

      const publicUrl = this.getLocalUrl(filename, folder)

      return {
        success: true,
        url: publicUrl,
        filename,
        size: stats.size,
        mimeType: file.mimetype
      }

    } catch (error) {
      console.error('Local upload error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Local upload failed'
      }
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    const useCloudinary = process.env.USE_CLOUDINARY === 'true'

    if (useCloudinary) {
      return this.uploadToCloudinary(file.path, options)
    } else {
      return this.uploadLocal(file, options)
    }
  }

  async deleteFile(publicId: string, isCloudinary: boolean = true): Promise<boolean> {
    try {
      if (isCloudinary) {
        const result = await cloudinary.uploader.destroy(publicId)
        return result.result === 'ok'
      } else {
        // Local file deletion
        const filePath = path.join(this.uploadDir, publicId)
        await fs.unlink(filePath)
        return true
      }
    } catch (error) {
      console.error('File deletion error:', error)
      return false
    }
  }

  async generateThumbnail(
    imagePath: string,
    outputPath: string,
    width: number = 300,
    height: number = 300
  ): Promise<string> {
    try {
      // This would require image processing library like sharp
      // For now, return the original path
      // In production, implement actual thumbnail generation
      
      const thumbnailName = `thumb_${path.basename(imagePath)}`
      const thumbnailPath = path.join(path.dirname(outputPath), thumbnailName)
      
      // Copy file as placeholder (implement actual resizing in production)
      await fs.copyFile(imagePath, thumbnailPath)
      
      return thumbnailPath
    } catch (error) {
      console.error('Thumbnail generation error:', error)
      return imagePath // Return original if thumbnail fails
    }
  }

  private getLocalUrl(filename: string, folder: string): string {
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000'
    return `${baseUrl}/uploads/${folder}/${filename}`
  }

  async validateImage(filePath: string): Promise<{
    isValid: boolean
    error?: string
    metadata?: any
  }> {
    try {
      const stats = await fs.stat(filePath)
      const maxSize = 10 * 1024 * 1024 // 10MB

      if (stats.size > maxSize) {
        return {
          isValid: false,
          error: 'File size exceeds maximum limit of 10MB'
        }
      }

      // Basic file type validation
      const ext = path.extname(filePath).toLowerCase()
      const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
      
      if (!allowedExts.includes(ext)) {
        return {
          isValid: false,
          error: 'File type not allowed'
        }
      }

      return {
        isValid: true,
        metadata: {
          size: stats.size,
          extension: ext
        }
      }

    } catch (error) {
      return {
        isValid: false,
        error: 'File validation failed'
      }
    }
  }

  async cleanupTempFiles(): Promise<void> {
    try {
      const tempDir = path.join(this.uploadDir, 'temp')
      const files = await fs.readdir(tempDir)
      const now = Date.now()
      const maxAge = 24 * 60 * 60 * 1000 // 24 hours

      for (const file of files) {
        const filePath = path.join(tempDir, file)
        const stats = await fs.stat(filePath)
        
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath)
        }
      }
    } catch (error) {
      console.error('Temp file cleanup error:', error)
    }
  }

  async getFileStats(): Promise<{
    totalFiles: number
    totalSize: number
    fileTypes: Record<string, number>
  }> {
    try {
      const stats = {
        totalFiles: 0,
        totalSize: 0,
        fileTypes: {} as Record<string, number>
      }

      const scanDirectory = async (dirPath: string) => {
        const files = await fs.readdir(dirPath)
        
        for (const file of files) {
          const filePath = path.join(dirPath, file)
          const fileStat = await fs.stat(filePath)
          
          if (fileStat.isDirectory()) {
            await scanDirectory(filePath)
          } else {
            stats.totalFiles++
            stats.totalSize += fileStat.size
            
            const ext = path.extname(file).toLowerCase()
            stats.fileTypes[ext] = (stats.fileTypes[ext] || 0) + 1
          }
        }
      }

      await scanDirectory(this.uploadDir)
      
      return stats

    } catch (error) {
      console.error('File stats error:', error)
      return {
        totalFiles: 0,
        totalSize: 0,
        fileTypes: {}
      }
    }
  }

  async optimizeImage(imagePath: string): Promise<string> {
    try {
      // This would require image optimization library
      // For now, return the original path
      // In production, implement actual optimization
      
      return imagePath
    } catch (error) {
      console.error('Image optimization error:', error)
      return imagePath
    }
  }

  getUploadLimits(): {
    maxFileSize: number
    allowedTypes: string[]
    maxFiles: number
  } {
    return {
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'application/pdf',
        'text/plain'
      ],
      maxFiles: 10 // Maximum files per request
    }
  }

  async createUploadFolder(folderName: string): Promise<boolean> {
    try {
      const folderPath = path.join(this.uploadDir, folderName)
      await fs.mkdir(folderPath, { recursive: true })
      return true
    } catch (error) {
      console.error('Folder creation error:', error)
      return false
    }
  }

  async moveFile(sourcePath: string, destinationPath: string): Promise<boolean> {
    try {
      await fs.rename(sourcePath, destinationPath)
      return true
    } catch (error) {
      console.error('File move error:', error)
      return false
    }
  }

  async copyFile(sourcePath: string, destinationPath: string): Promise<boolean> {
    try {
      await fs.copyFile(sourcePath, destinationPath)
      return true
    } catch (error) {
      console.error('File copy error:', error)
      return false
    }
  }
}

export const fileUploadService = new FileUploadService()
export default fileUploadService
