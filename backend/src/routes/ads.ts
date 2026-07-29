import express from 'express'
import { prisma } from '../config/prisma'
import { z } from 'zod'
import { authenticate } from '../middleware/auth'
import { authorize } from '../middleware/auth'
import multer from 'multer'
import fs from 'fs'
import path from 'path'
import { uploadImage } from '../config/cloudinary'

const router = express.Router()
const uploadBasePath = process.env.UPLOAD_DIR || (process.env.VERCEL ? '/tmp/uploads' : 'uploads')
const adUploadPath = path.join(uploadBasePath, 'ads')
const ensureDirectory = (dir: string) => fs.mkdirSync(dir, { recursive: true })

const saveLocalMedia = (file: Express.Multer.File) => {
  ensureDirectory(adUploadPath)
  const extension = path.extname(file.originalname) || `.${file.mimetype.split('/')[1] || 'bin'}`
  const filename = `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`
  const localPath = path.join(adUploadPath, filename)
  fs.writeFileSync(localPath, file.buffer)
  return `/uploads/ads/${filename}`
}

const inferMediaType = (url?: string, fallback: 'image' | 'gif' | 'video' | 'audio' | 'sticker' = 'image') => {
  const value = String(url || '')
  if (/\.(mp3|wav|ogg|m4a)(\?|#|$)/i.test(value)) return 'audio'
  if (/\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(value) || /(youtube\.com|youtu\.be|vimeo\.com)/i.test(value)) return 'video'
  if (/\.gif(\?|#|$)/i.test(value)) return 'gif'
  return fallback
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (
      file.mimetype.startsWith('image/') ||
      file.mimetype.startsWith('video/') ||
      file.mimetype.startsWith('audio/') ||
      ['image/webp', 'video/webm'].includes(file.mimetype)
    ) return cb(null, true)
    cb(new Error('Only images, GIFs, stickers, videos, or audio files are allowed'))
  },
})

// Ad placement schemas
const adPlacementSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['BANNER', 'SIDEBAR', 'FOOTER', 'HEADER', 'IN_CONTENT', 'POPUP', 'VIDEO']),
  position: z.string(),
  size: z.object({
    width: z.number(),
    height: z.number()
  }),
  isActive: z.boolean().default(true),
  targeting: z.object({
    creative: z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      imageUrl: z.string().min(1).optional(),
      mediaUrl: z.string().min(1).optional(),
      mediaType: z.enum(['image', 'gif', 'video', 'audio', 'sticker']).optional(),
      shape: z.enum(['rectangle', 'square', 'circle', 'triangle']).optional(),
      landingUrl: z.string().min(1).optional(),
      buttonText: z.string().optional(),
    }).optional(),
    locations: z.array(z.string()).optional(),
    demographics: z.object({
      ageRange: z.object({
        min: z.number().optional(),
        max: z.number().optional()
      }).optional(),
      gender: z.array(z.string()).optional(),
      interests: z.array(z.string()).optional()
    }).optional(),
    behavior: z.object({
      pageViews: z.number().optional(),
      timeOnSite: z.number().optional(),
      previousPurchases: z.boolean().optional()
    }).optional()
  }).optional(),
  schedule: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    daysOfWeek: z.array(z.number()).optional(), // 0-6 (Sunday-Saturday)
    hoursOfDay: z.array(z.number()).optional() // 0-23
  }).optional()
})

const adCampaignSchema = z.object({
  name: z.string().min(1),
  advertiserId: z.string().optional(),
  budget: z.object({
    total: z.number(),
    daily: z.number().optional(),
    cpc: z.number().optional(), // Cost per click
    cpm: z.number().optional(), // Cost per mille (1000 impressions)
    cpa: z.number().optional()  // Cost per action
  }),
  targeting: z.object({
    locations: z.array(z.string()).optional(),
    demographics: z.object({
      ageRange: z.object({
        min: z.number().optional(),
        max: z.number().optional()
      }).optional(),
      gender: z.array(z.string()).optional(),
      interests: z.array(z.string()).optional()
    }).optional(),
    keywords: z.array(z.string()).optional(),
    devices: z.array(z.enum(['DESKTOP', 'MOBILE', 'TABLET'])).optional()
  }).optional(),
  creative: z.object({
    title: z.string(),
    description: z.string(),
    imageUrl: z.string().min(1).optional(),
    mediaUrl: z.string().min(1).optional(),
    mediaType: z.enum(['image', 'gif', 'video', 'audio', 'sticker']).optional(),
    shape: z.enum(['rectangle', 'square', 'circle', 'triangle']).optional(),
    stickerUrl: z.string().min(1).optional(),
    landingUrl: z.string().min(1),
    buttonText: z.string().optional()
  }),
  isActive: z.boolean().default(true),
  startDate: z.string().datetime(),
  endDate: z.string().datetime()
})

router.post('/upload-media', authenticate, authorize('ADMIN'), upload.single('media'), async (req, res) => {
  try {
    const file = req.file
    if (!file) return res.status(400).json({ error: 'No media file uploaded' })

    const mediaType = file.mimetype.startsWith('audio/')
      ? 'audio'
      : file.mimetype.startsWith('video/')
      ? 'video'
      : file.mimetype === 'image/gif'
        ? 'gif'
        : 'image'
    let uploaded: { url: string; publicId: string }

    try {
      uploaded = await uploadImage(file.buffer, 'hincton/ads')
    } catch (error) {
      const url = saveLocalMedia(file)
      uploaded = { url, publicId: url }
    }

    res.status(201).json({
      url: uploaded.url,
      publicId: uploaded.publicId,
      mediaType,
      message: 'Ad media uploaded successfully',
    })
  } catch (error: any) {
    console.error('Upload ad media error:', error)
    res.status(500).json({ error: error?.message || 'Failed to upload ad media' })
  }
})

// === AD PLACEMENTS ===
router.get('/placements', authenticate, async (req, res) => {
  try {
    const { page = '1', limit = '50', type, isActive } = req.query
    const pageNum = Math.max(1, parseInt(String(page), 10) || 1)
    const limitNum = Math.max(1, parseInt(String(limit), 10) || 50)
    const skip = (pageNum - 1) * limitNum

    const where: any = {}
    if (type) where.type = type
    if (isActive !== undefined) where.isActive = isActive === 'true'

    const [placements, total] = await Promise.all([
      prisma.adPlacement?.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              impressions: true,
              clicks: true
            }
          }
        }
      }),
      prisma.adPlacement?.count({ where })
    ])

    res.json({
      placements: placements || [],
      pagination: { page: pageNum, limit: limitNum, total: total || 0, pages: Math.ceil((total || 0) / limitNum) }
    })
  } catch (error) {
    console.error('Get ad placements error:', error)
    res.status(500).json({ error: 'Failed to get ad placements' })
  }
})

router.post('/placements', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const data = adPlacementSchema.parse(req.body)
    
    const placement = await prisma.adPlacement?.create({
      data: {
        ...data,
        size: data.size as any,
        targeting: data.targeting as any,
        schedule: data.schedule as any
      }
    })

    res.status(201).json({ message: 'Ad placement created successfully', placement })
  } catch (error) {
    console.error('Create ad placement error:', error)
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid placement data', details: error.issues })
    }
    res.status(500).json({ error: 'Failed to create ad placement' })
  }
})

router.put('/placements/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params
    const data = adPlacementSchema.partial().parse(req.body)

    const placement = await prisma.adPlacement?.update({
      where: { id },
      data: {
        ...data,
        ...(data.size && { size: data.size as any }),
        ...(data.targeting && { targeting: data.targeting as any }),
        ...(data.schedule && { schedule: data.schedule as any })
      }
    })

    res.json({ message: 'Ad placement updated successfully', placement })
  } catch (error) {
    console.error('Update ad placement error:', error)
    res.status(500).json({ error: 'Failed to update ad placement' })
  }
})

router.delete('/placements/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params
    
    await prisma.$transaction([
      prisma.adConversion.deleteMany({ where: { placementId: id } }),
      prisma.adClick.deleteMany({ where: { placementId: id } }),
      prisma.adImpression.deleteMany({ where: { placementId: id } }),
      prisma.adPlacement.delete({ where: { id } }),
    ])

    res.json({ message: 'Ad placement deleted successfully' })
  } catch (error) {
    console.error('Delete ad placement error:', error)
    res.status(500).json({ error: 'Failed to delete ad placement' })
  }
})

// === AD CAMPAIGNS ===
router.get('/campaigns', authenticate, async (req, res) => {
  try {
    const { page = '1', limit = '50', isActive, advertiserId } = req.query
    const pageNum = Math.max(1, parseInt(String(page), 10) || 1)
    const limitNum = Math.max(1, parseInt(String(limit), 10) || 50)
    const skip = (pageNum - 1) * limitNum

    const where: any = {}
    if (isActive !== undefined) where.isActive = isActive === 'true'
    if (advertiserId) where.advertiserId = advertiserId

    const [campaigns, total] = await Promise.all([
      prisma.adCampaign?.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          advertiser: {
            select: {
              id: true,
              username: true,
              email: true
            }
          },
          _count: {
            select: {
              impressions: true,
              clicks: true,
              conversions: true
            }
          }
        }
      }),
      prisma.adCampaign?.count({ where })
    ])

    res.json({
      campaigns: campaigns || [],
      pagination: { page: pageNum, limit: limitNum, total: total || 0, pages: Math.ceil((total || 0) / limitNum) }
    })
  } catch (error) {
    console.error('Get ad campaigns error:', error)
    res.status(500).json({ error: 'Failed to get ad campaigns' })
  }
})

router.post('/campaigns', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const data = adCampaignSchema.parse(req.body)
    const advertiserId = data.advertiserId || (req as any).user?.id
    if (!advertiserId) {
      return res.status(400).json({ error: 'Advertiser is required' })
    }
    
    const campaign = await prisma.adCampaign?.create({
      data: {
        ...data,
        advertiserId,
        budget: data.budget as any,
        targeting: data.targeting as any,
        creative: data.creative as any
      }
    })

    res.status(201).json({ message: 'Ad campaign created successfully', campaign })
  } catch (error) {
    console.error('Create ad campaign error:', error)
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid campaign data', details: error.issues })
    }
    res.status(500).json({ error: 'Failed to create ad campaign' })
  }
})

router.put('/campaigns/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params
    const data = adCampaignSchema.partial().parse(req.body)

    const campaign = await prisma.adCampaign?.update({
      where: { id },
      data: {
        ...data,
        ...(data.budget && { budget: data.budget as any }),
        ...(data.targeting && { targeting: data.targeting as any }),
        ...(data.creative && { creative: data.creative as any })
      }
    })

    res.json({ message: 'Ad campaign updated successfully', campaign })
  } catch (error) {
    console.error('Update ad campaign error:', error)
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid campaign data', details: error.issues })
    }
    res.status(500).json({ error: 'Failed to update ad campaign' })
  }
})

router.delete('/campaigns/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params

    await prisma.$transaction([
      prisma.adConversion.deleteMany({ where: { campaignId: id } }),
      prisma.adClick.deleteMany({ where: { campaignId: id } }),
      prisma.adImpression.deleteMany({ where: { campaignId: id } }),
      prisma.adCampaign.delete({ where: { id } }),
    ])

    res.json({ message: 'Ad campaign deleted successfully' })
  } catch (error) {
    console.error('Delete ad campaign error:', error)
    res.status(500).json({ error: 'Failed to delete ad campaign' })
  }
})

// === AD SERVING ===
router.get('/serve', async (req, res) => {
  try {
    const { placementId, location, device, userAgent } = req.query
    
    // Get placement details
    const placementKey = String(placementId || '').trim()
    if (!placementKey) return res.json({ ad: null, reason: 'placement_required' })

    const placement = await prisma.adPlacement?.findFirst({
      where: {
        OR: [
          { id: placementKey },
          { position: placementKey },
          { name: placementKey },
        ],
      },
      select: {
        id: true,
        name: true,
        type: true,
        position: true,
        size: true,
        isActive: true,
        targeting: true,
        schedule: true
      }
    })

    if (!placement || !placement.isActive) {
      return res.json({ ad: null, reason: 'placement_not_found' })
    }

    const placementCreative = (placement.targeting as any)?.creative
    if (placementCreative?.mediaUrl || placementCreative?.imageUrl) {
      return res.json({
        ad: {
          id: placement.id,
          title: placementCreative.title || placement.name,
          description: placementCreative.description || '',
          imageUrl: placementCreative.imageUrl || placementCreative.mediaUrl,
          mediaUrl: placementCreative.mediaUrl || placementCreative.imageUrl,
          mediaType: placementCreative.mediaType || inferMediaType(placementCreative.mediaUrl || placementCreative.imageUrl),
          shape: placementCreative.shape || 'rectangle',
          landingUrl: placementCreative.landingUrl || '/shop',
          buttonText: placementCreative.buttonText || 'Shop now',
          advertiser: 'Hincton',
          placement: {
            id: placement.id,
            type: placement.type,
            size: placement.size,
          },
          tracking: {
            impressionId: `placement_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
          },
        },
      })
    }

    // Check targeting criteria
    const now = new Date()
    const userLocation = location as string
    const userDevice = device as string

    // Find matching campaigns
    const campaigns = await prisma.adCampaign?.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      select: {
        id: true,
        name: true,
        advertiserId: true,
        budget: true,
        targeting: true,
        creative: true,
        isActive: true,
        startDate: true,
        endDate: true,
        createdAt: true,
        updatedAt: true,
        advertiser: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      }
    })

    if (!campaigns || campaigns.length === 0) {
      return res.json({ ad: null, reason: 'no_matching_campaigns' })
    }

    // Select best campaign (simplified - in production would use more sophisticated bidding)
    const selectedCampaign = campaigns[0]

    // Record impression
    const impression = await prisma.adImpression?.create({
      data: {
        campaignId: selectedCampaign.id,
        placementId: placement.id,
        userAgent: userAgent as string,
        ip: req.ip,
        location: userLocation,
        device: userDevice,
        timestamp: new Date()
      }
    })

    const creative = selectedCampaign.creative as any
    res.json({
      ad: {
        id: selectedCampaign.id,
        title: creative?.title,
        description: creative?.description,
        imageUrl: creative?.imageUrl || creative?.mediaUrl,
        mediaUrl: creative?.mediaUrl || creative?.imageUrl,
        mediaType: creative?.mediaType || inferMediaType(creative?.mediaUrl || creative?.imageUrl),
        shape: creative?.shape || 'rectangle',
        stickerUrl: creative?.stickerUrl,
        landingUrl: creative?.landingUrl,
        buttonText: creative?.buttonText,
        advertiser: selectedCampaign.advertiser?.username,
        placement: {
          id: placement.id,
          type: placement.type,
          size: placement.size
        },
        tracking: {
          impressionId: impression?.id || `imp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        },
      },
      tracking: {
        impressionId: impression?.id
      }
    })
  } catch (error) {
    console.error('Serve ad error:', error)
    res.status(500).json({ error: 'Failed to serve ad' })
  }
})

router.post('/track/:type', async (req, res) => {
  try {
    const { type } = req.params // 'click' or 'conversion'
    const { impressionId, campaignId, placementId } = req.body

    if (type === 'click') {
      await prisma.adClick?.create({
        data: {
          campaignId,
          placementId,
          impressionId,
          timestamp: new Date(),
          ip: req.ip,
          userAgent: req.get('User-Agent')
        }
      })
    } else if (type === 'conversion') {
      await prisma.adConversion?.create({
        data: {
          campaignId,
          placementId,
          impressionId,
          timestamp: new Date(),
          value: req.body.value || 0,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        }
      })
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Track ad error:', error)
    res.status(500).json({ error: 'Failed to track ad interaction' })
  }
})

// === ANALYTICS ===
router.get('/analytics', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { period = '30', campaignId, placementId } = req.query
    const days = Math.max(1, parseInt(String(period), 10) || 30)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const where: any = {
      timestamp: { gte: startDate }
    }
    if (campaignId) where.campaignId = campaignId
    if (placementId) where.placementId = placementId

    const [impressions, clicks, conversions, revenue] = await Promise.all([
      prisma.adImpression?.count({ where }),
      prisma.adClick?.count({ where }),
      prisma.adConversion?.count({ where }),
      prisma.adConversion?.aggregate({
        where,
        _sum: { value: true }
      })
    ])

    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0
    const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0
    const cpm = impressions > 0 ? (Number(revenue._sum.value) || 0) / (impressions / 1000) : 0
    const cpc = clicks > 0 ? (Number(revenue._sum.value) || 0) / clicks : 0

    res.json({
      period: `${days} days`,
      metrics: {
        impressions,
        clicks,
        conversions,
        revenue: Number(revenue._sum.value) || 0,
        ctr: parseFloat(ctr.toFixed(2)),
        conversionRate: parseFloat(conversionRate.toFixed(2)),
        cpm: parseFloat(cpm.toFixed(2)),
        cpc: parseFloat(cpc.toFixed(2))
      },
      generatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Get ad analytics error:', error)
    res.status(500).json({ error: 'Failed to get ad analytics' })
  }
})

export default router
