import { Request, Response, NextFunction } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'

export interface FileUploadOptions {
  maxFileSize?: number // in bytes
  maxFiles?: number
  allowedMimeTypes?: string[]
  destination?: string
  requireAuth?: boolean
}

export const createFileUpload = (options: FileUploadOptions = {}) => {
  const {
    maxFileSize = 10 * 1024 * 1024, // 10MB default
    maxFiles = 5,
    allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    destination = 'uploads/',
    requireAuth = true
  } = options

  // Ensure upload directory exists
  const uploadDir = path.join(process.cwd(), destination)
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir)
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      const ext = path.extname(file.originalname)
      cb(null, file.fieldname + '-' + uniqueSuffix + ext)
    }
  })

  const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Check file type
    if (allowedMimeTypes.length > 0 && !allowedMimeTypes.includes(file.mimetype)) {
      const error = new Error(`File type ${file.mimetype} not allowed`) as any
      error.code = 'INVALID_FILE_TYPE'
      return cb(error, false)
    }

    // Check file size (additional check)
    if (file.size > maxFileSize) {
      const error = new Error(`File size exceeds limit of ${maxFileSize} bytes`) as any
      error.code = 'FILE_TOO_LARGE'
      return cb(error, false)
    }

    cb(null, true)
  }

  const upload = multer({
    storage,
    limits: {
      fileSize: maxFileSize,
      files: maxFiles
    },
    fileFilter
  })

  return (req: Request, res: Response, next: NextFunction) => {
    // Check authentication if required
    if (requireAuth && !(req as any).user) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required for file upload'
      })
    }

    upload.array('files', maxFiles)(req, res, (error: any) => {
      if (error) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({
            success: false,
            error: 'FILE_TOO_LARGE',
            message: `File size exceeds limit of ${maxFileSize} bytes`
          })
        }

        if (error.code === 'LIMIT_FILE_COUNT') {
          return res.status(413).json({
            success: false,
            error: 'TOO_MANY_FILES',
            message: `Too many files uploaded. Maximum allowed: ${maxFiles}`
          })
        }

        if (error.code === 'INVALID_FILE_TYPE') {
          return res.status(400).json({
            success: false,
            error: 'INVALID_FILE_TYPE',
            message: error.message
          })
        }

        return res.status(500).json({
          success: false,
          error: 'UPLOAD_ERROR',
          message: 'File upload failed'
        })
      }

      // Add file info to request object
      ;(req as any).files = req.files
      next()
    })
  }
}

// Specific upload configurations
export const imageUpload = createFileUpload({
  maxFileSize: 5 * 1024 * 1024, // 5MB
  maxFiles: 3,
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  destination: 'uploads/images/'
})

export const documentUpload = createFileUpload({
  maxFileSize: 20 * 1024 * 1024, // 20MB
  maxFiles: 2,
  allowedMimeTypes: ['application/pdf', 'text/plain'],
  destination: 'uploads/documents/'
})

export const productImageUpload = createFileUpload({
  maxFileSize: 2 * 1024 * 1024, // 2MB
  maxFiles: 5,
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  destination: 'uploads/products/',
  requireAuth: true
})

// File validation utilities
export const validateImageFile = (file: Express.Multer.File): { valid: boolean; error?: string } => {
  // Check file extension
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
  const fileExtension = path.extname(file.originalname).toLowerCase()
  
  if (!allowedExtensions.includes(fileExtension)) {
    return {
      valid: false,
      error: `File extension ${fileExtension} not allowed for images`
    }
  }

  // Check MIME type
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return {
      valid: false,
      error: `MIME type ${file.mimetype} not allowed for images`
    }
  }

  return { valid: true }
}

export const validateDocumentFile = (file: Express.Multer.File): { valid: boolean; error?: string } => {
  // Check file extension
  const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt']
  const fileExtension = path.extname(file.originalname).toLowerCase()
  
  if (!allowedExtensions.includes(fileExtension)) {
    return {
      valid: false,
      error: `File extension ${fileExtension} not allowed for documents`
    }
  }

  // Check MIME type
  const allowedMimeTypes = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return {
      valid: false,
      error: `MIME type ${file.mimetype} not allowed for documents`
    }
  }

  return { valid: true }
}
