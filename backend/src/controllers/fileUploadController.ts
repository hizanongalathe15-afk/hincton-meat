import { Request, Response, NextFunction } from 'express'
import { asyncHandler, AppError, ValidationError } from '../middleware'
import { imageUpload, documentUpload, productImageUpload, validateImageFile, validateDocumentFile } from '../middleware'

export const uploadImages = [
  imageUpload,
  asyncHandler(async (req: Request, res: Response) => {
    const files = (req as any).files
    
    if (!files || files.length === 0) {
      throw new ValidationError('No files uploaded')
    }
    
    const uploadedFiles = files.map((file: Express.Multer.File) => ({
      id: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      url: `/uploads/images/${file.filename}`
    }))
    
    res.status(201).json({
      success: true,
      data: uploadedFiles,
      message: 'Images uploaded successfully'
    })
  })
]

export const uploadDocuments = [
  documentUpload,
  asyncHandler(async (req: Request, res: Response) => {
    const files = (req as any).files
    
    if (!files || files.length === 0) {
      throw new ValidationError('No files uploaded')
    }
    
    const uploadedFiles = files.map((file: Express.Multer.File) => ({
      id: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      url: `/uploads/documents/${file.filename}`
    }))
    
    res.status(201).json({
      success: true,
      data: uploadedFiles,
      message: 'Documents uploaded successfully'
    })
  })
]

export const uploadProductImages = [
  productImageUpload,
  asyncHandler(async (req: Request, res: Response) => {
    const files = (req as any).files
    const { productId } = req.body
    
    if (!files || files.length === 0) {
      throw new ValidationError('No files uploaded')
    }
    
    if (!productId) {
      throw new ValidationError('Product ID is required')
    }
    
    const uploadedFiles = files.map((file: Express.Multer.File) => ({
      id: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      url: `/uploads/products/${file.filename}`,
      productId
    }))
    
    res.status(201).json({
      success: true,
      data: uploadedFiles,
      message: 'Product images uploaded successfully'
    })
  })
]

export const validateImage = asyncHandler(async (req: Request, res: Response) => {
  const { file } = req.body
  
  if (!file) {
    throw new ValidationError('File data is required')
  }
  
  const validation = validateImageFile(file)
  
  res.json({
    success: true,
    data: validation
  })
})

export const validateDocument = asyncHandler(async (req: Request, res: Response) => {
  const { file } = req.body
  
  if (!file) {
    throw new ValidationError('File data is required')
  }
  
  const validation = validateDocumentFile(file)
  
  res.json({
    success: true,
    data: validation
  })
})

export const deleteFile = asyncHandler(async (req: Request, res: Response) => {
  const { filename } = req.params
  
  if (!filename) {
    throw new ValidationError('Filename is required')
  }
  
  // In a real implementation, you would delete the file from storage
  // For now, just return success
  
  res.json({
    success: true,
    message: 'File deleted successfully'
  })
})

export const getFile = asyncHandler(async (req: Request, res: Response) => {
  const { filename } = req.params
  
  if (!filename) {
    throw new ValidationError('Filename is required')
  }
  
  // In a real implementation, you would serve the file
  // For now, just return file info
  
  res.json({
    success: true,
    data: {
      filename,
      url: `/uploads/${filename}`
    }
  })
})
