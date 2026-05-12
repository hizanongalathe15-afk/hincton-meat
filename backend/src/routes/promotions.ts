import express from 'express'
import { prisma } from '../config/prisma'
import { z } from 'zod'

const router = express.Router()

const createPromotionSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  code: z.string().min(1),
  discountType: z.enum(['percentage', 'fixed', 'free_delivery', 'BOGO', 'TIERED', 'BUNDLE', 'PERCENTAGE', 'FIXED']).optional(),
  discountValue: z.number().positive(),
  validFrom: z.string(),
  validUntil: z.string(),
  usageLimit: z.number().int().positive().optional(),
  minOrderAmount: z.number().positive().optional(),
  maxDiscount: z.number().positive().optional(),

  isActive: z.boolean().default(true),
})

router.get('/active', async (_req, res) => {
  try {
    const now = new Date()
    const promotions = await prisma.promotion.findMany({
      where: {
        isActive: true,
        validFrom: { lte: now },
        validUntil: { gte: now },
      },
      orderBy: { startDate: 'desc' },
    })

    res.json({ promotions })
  } catch (error) {
    console.error('Get active promotions error:', error)
    res.status(500).json({ error: 'Failed to get active promotions' })
  }
})

router.get('/', async (req, res) => {
  try {
    const { page = '1', limit = '20', status, search } = req.query
    const pageNum = Math.max(1, parseInt(String(page), 10) || 1)
    const limitNum = Math.max(1, parseInt(String(limit), 10) || 20)
    const skip = (pageNum - 1) * limitNum

    const where: any = {}
    const now = new Date()

    if (status === 'active') {
      where.isActive = true
      where.validFrom = { lte: now }
      where.validUntil = { gte: now }
    } else if (status === 'expired') {
      where.validUntil = { lt: now }
    } else if (status === 'upcoming') {
      where.validFrom = { gt: now }
    }

    if (search) {
      const s = String(search)
      where.OR = [
        { title: { contains: s, mode: 'insensitive' } },
        { description: { contains: s, mode: 'insensitive' } },
        { code: { contains: s, mode: 'insensitive' } },
      ]
    }

    const [promotions, total] = await Promise.all([
      prisma.promotion.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.promotion.count({ where }),
    ])

    res.json({
      promotions,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    })
  } catch (error) {
    console.error('Get promotions error:', error)
    res.status(500).json({ error: 'Failed to get promotions' })
  }
})

router.post('/', async (req, res) => {
  try {
    const data = createPromotionSchema.parse(req.body)

    // Prisma schema expects: discountType is String, but other code expects minOrderAmount.
    const promotion = await prisma.promotion.create({
      data: {
        title: data.title,
        description: data.description,
        code: data.code.toUpperCase(),
        discountType: data.discountType ?? 'percentage',
        discountValue: data.discountValue as any,
        startDate: new Date(data.validFrom),
        endDate: new Date(data.validUntil),
        validFrom: new Date(data.validFrom),
        validUntil: new Date(data.validUntil),
        usageLimit: data.usageLimit,
        maxDiscount: data.maxDiscount ? (data.maxDiscount as any) : undefined,
        isActive: data.isActive,
      },
    })

    res.status(201).json({ message: 'Promotion created successfully', promotion })
  } catch (error) {
    console.error('Create promotion error:', error)
    res.status(500).json({ error: 'Failed to create promotion' })
  }
})

router.post('/apply', async (req, res) => {
  try {
    const payload = z.object({
      code: z.string().min(1),
      orderTotal: z.number().positive(),
      userId: z.string().optional(),
      orderId: z.string().optional(),
    }).parse(req.body)

    const now = new Date()

    const promotion = await prisma.promotion.findFirst({
      where: {
        code: payload.code.toUpperCase(),
        isActive: true,
        validFrom: { lte: now },
        validUntil: { gte: now },
      },
    })

    if (!promotion) return res.status(404).json({ error: 'Invalid or expired promotion code' })

    const orderTotal = payload.orderTotal

    if (promotion.minOrderAmount && orderTotal < Number(promotion.minOrderAmount)) {
      return res.status(400).json({ error: 'Minimum order amount not met' })
    }

    let discountAmount = 0

    if (promotion.discountType === 'percentage') {
      discountAmount = (orderTotal * Number(promotion.discountValue)) / 100
    } else {
      discountAmount = Number(promotion.discountValue)
    }

    // Apply maxDiscount limit if specified
    if (promotion.maxDiscount && discountAmount > Number(promotion.maxDiscount)) {
      discountAmount = Number(promotion.maxDiscount)
    }

    const finalTotal = orderTotal - discountAmount

    // Track usage if userId and orderId provided
    if (payload.userId && payload.orderId) {
      try {
        await prisma.promotionUsage.create({
          data: {
            promotionId: promotion.id,
            userId: payload.userId,
            orderId: payload.orderId,
            discountAmount: discountAmount as any,
          },
        })

        // Update promotion usage count
        await prisma.promotion.update({
          where: { id: promotion.id },
          data: { usedCount: { increment: 1 } },
        })
      } catch (usageError) {
        console.error('Failed to track promotion usage:', usageError)
        // Don't fail the request if usage tracking fails
      }
    }

    res.json({
      promotionId: promotion.id,
      code: promotion.code,
      discountAmount,
      finalTotal,
    })
  } catch (error) {
    console.error('Apply promotion error:', error)
    res.status(500).json({ error: 'Failed to apply promotion' })
  }
})

export default router

