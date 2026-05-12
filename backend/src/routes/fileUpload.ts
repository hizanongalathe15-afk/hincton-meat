import { Router } from 'express'
import { FileUploadController } from '../controllers'
import { authenticate, requireAdmin, apiRateLimiter, authRateLimiter } from '../middleware'

const router = Router()

// File validation routes - public but rate limited
router.post('/validate/image', 
  authRateLimiter, 
  FileUploadController.validateImage
)
router.post('/validate/document', 
  authRateLimiter, 
  FileUploadController.validateDocument
)

// Protected file upload routes - require authentication
router.use(authenticate)

// Image upload routes - stricter rate limiting
router.post('/images', 
  authRateLimiter, 
  FileUploadController.uploadImages
)
router.post('/documents', 
  authRateLimiter, 
  FileUploadController.uploadDocuments
)
router.post('/product-images', 
  authRateLimiter, 
  FileUploadController.uploadProductImages
)

// File management routes - admin only
router.use(requireAdmin)

router.get('/file/:filename', 
  apiRateLimiter, 
  FileUploadController.getFile
)
router.delete('/file/:filename', 
  authRateLimiter, 
  FileUploadController.deleteFile
)

export default router
