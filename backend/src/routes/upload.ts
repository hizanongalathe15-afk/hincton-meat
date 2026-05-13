import express, { Request, Response } from 'express'
import multer from 'multer'
import { authenticate, authorize } from '../middleware/auth'
import { deleteImage, uploadImage } from '../config/cloudinary'

const router = express.Router()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => file.mimetype.startsWith('image/') ? cb(null, true) : cb(new Error('Only image files are allowed')),
})

type MulterRequest = Request & { file?: Express.Multer.File }

router.post('/upload-product-image', authenticate, authorize('ADMIN'), upload.single('image'), async (req: MulterRequest, res: Response) => {
  try {
    const file = req.file

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const uploaded = await uploadImage(file.buffer, 'hincton/products')

    res.json({
      success: true,
      url: uploaded.url,
      publicId: uploaded.publicId,
      message: 'Image uploaded successfully',
    })
  } catch (error: any) {
    console.error('Upload error:', error)
    res.status(500).json({
      error: error?.message || 'Upload failed',
      message: 'Image storage is not configured. Configure Cloudinary for persistent uploads on Render.',
    })
  }
})

router.get('/product-images/:productId', async (_req, res) => {
  res.json({ success: true, images: [] })
})

router.delete('/delete-product-image', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { publicId } = req.body

    if (!publicId) {
      return res.status(400).json({ error: 'publicId is required' })
    }

    await deleteImage(publicId)

    res.json({ success: true, message: 'Image deleted successfully' })
  } catch (error: any) {
    console.error('Delete error:', error)
    res.status(500).json({ error: error?.message || 'Delete failed' })
  }
})

export default router
