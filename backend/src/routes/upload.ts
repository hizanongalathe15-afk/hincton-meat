import express, { Request, Response } from 'express'
import multer from 'multer'
import { createClient } from '@supabase/supabase-js'
import path from 'path'
import fs from 'fs'
import { authenticate, authorize } from '../middleware/auth'

const router = express.Router()
const tempDir = path.resolve('uploads/temp')

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true })
}

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || ''
)

const bucketName = process.env.SUPABASE_BUCKET_NAME || 'hinton_bucket'
const upload = multer({ dest: tempDir })

type MulterRequest = Request & { file?: Express.Multer.File }

router.post('/upload-product-image', authenticate, authorize('ADMIN'), upload.single('image'), async (req: MulterRequest, res: Response) => {
  try {
    const { productId } = req.body
    const file = req.file

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' })
    }

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      return res.status(500).json({ error: 'Supabase configuration is missing' })
    }

    const fileBuffer = fs.readFileSync(file.path)
    const fileExt = path.extname(file.originalname)
    const fileName = `products/${productId}/${Date.now()}${fileExt}`

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, fileBuffer, {
        contentType: file.mimetype,
        cacheControl: '3600'
      })

    if (error) {
      throw error
    }

    const urlData = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName).data

    fs.unlinkSync(file.path)

    res.json({
      success: true,
      url: urlData.publicUrl,
      message: 'Image uploaded successfully!'
    })
  } catch (error: any) {
    console.error('Upload error:', error)
    res.status(500).json({ error: error?.message || 'Upload failed' })
  }
})

router.get('/product-images/:productId', async (req, res) => {
  try {
    const { productId } = req.params

    const { data, error } = await supabase.storage
      .from(bucketName)
      .list(`products/${productId}/`)

    if (error) {
      if (error.message?.includes('NotFound')) {
        return res.json({ success: true, images: [] })
      }
      throw error
    }

    const images = data.map((file) => ({
      name: file.name,
      url: supabase.storage.from(bucketName).getPublicUrl(`products/${productId}/${file.name}`).data.publicUrl,
      size: (file.metadata as any)?.size,
      created_at: file.created_at
    }))

    res.json({ success: true, images })
  } catch (error: any) {
    console.error('Error fetching images:', error)
    res.status(500).json({ error: error?.message || 'Failed to list images' })
  }
})

router.delete('/delete-product-image', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { imagePath } = req.body

    if (!imagePath) {
      return res.status(400).json({ error: 'Image path is required' })
    }

    const { error } = await supabase.storage
      .from(bucketName)
      .remove([imagePath])

    if (error) {
      throw error
    }

    res.json({ success: true, message: 'Image deleted successfully' })
  } catch (error: any) {
    console.error('Delete error:', error)
    res.status(500).json({ error: error?.message || 'Delete failed' })
  }
})

export default router
