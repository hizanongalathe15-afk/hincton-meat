import { Router, Request, Response } from 'express'
import { prisma } from '../config/prisma'
import { authenticate, requireAdmin, apiRateLimiter, asyncHandler, authRateLimiter } from '../middleware'
import crypto from 'crypto'

const router = Router()

const generateGiftCardCode = (): string => {
  const prefix = 'HM'
  const segments = Array.from({ length: 3 }, () =>
    crypto.randomBytes(2).toString('hex').toUpperCase()
  )
  return `${prefix}-${segments.join('-')}`
}

// ============================================================================
// PUBLIC ROUTES
// ============================================================================

// Check gift card balance
router.get('/:code', apiRateLimiter, asyncHandler(async (req: Request, res: Response) => {
  const card = await prisma.giftCard.findUnique({
    where: { code: req.params.code.toUpperCase() },
  })

  if (!card) {
    return res.status(404).json({ error: 'Gift card not found' })
  }

  res.json({
    giftCard: {
      code: card.code,
      balance: card.balance,
      amount: card.amount,
      currency: card.currency,
      status: card.status,
      expiresAt: card.expiresAt,
      occasion: card.occasion,
      message: card.message,
      senderName: card.senderName,
      recipientName: card.recipientName,
    },
  })
}))

// Purchase/create gift card
router.post('/', authRateLimiter, asyncHandler(async (req: Request, res: Response) => {
  const {
    amount,
    senderName,
    senderEmail,
    recipientName,
    recipientEmail,
    recipientPhone,
    message,
    occasion,
    template,
    deliveryMethod,
  } = req.body

  if (!amount || !senderName || !recipientName) {
    return res.status(400).json({ error: 'Amount, sender name, and recipient name are required' })
  }

  const numericAmount = Number(amount)
  if (numericAmount < 500 || numericAmount > 50000) {
    return res.status(400).json({ error: 'Amount must be between KSh 500 and KSh 50,000' })
  }

  const code = generateGiftCardCode()

  const card = await prisma.giftCard.create({
    data: {
      code,
      amount: numericAmount,
      balance: numericAmount,
      senderName: String(senderName).trim(),
      senderEmail: senderEmail ? String(senderEmail).trim().toLowerCase() : null,
      recipientName: String(recipientName).trim(),
      recipientEmail: recipientEmail ? String(recipientEmail).trim().toLowerCase() : null,
      recipientPhone: recipientPhone ? String(recipientPhone).trim() : null,
      message: message ? String(message).trim() : null,
      occasion: occasion ? String(occasion).trim() : null,
      template: template ? String(template).trim() : null,
      deliveryMethod: deliveryMethod || 'EMAIL',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    },
  })

  res.status(201).json({ giftCard: card, message: 'Gift card created successfully' })
}))

// Redeem gift card
router.post('/:code/redeem', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { amount, orderId } = req.body

  const card = await prisma.giftCard.findUnique({
    where: { code: req.params.code.toUpperCase() },
  })

  if (!card) {
    return res.status(404).json({ error: 'Gift card not found' })
  }

  if (card.status !== 'ACTIVE') {
    return res.status(400).json({ error: `Gift card is ${card.status.toLowerCase()}` })
  }

  if (card.expiresAt && card.expiresAt < new Date()) {
    await prisma.giftCard.update({
      where: { id: card.id },
      data: { status: 'EXPIRED' },
    })
    return res.status(400).json({ error: 'Gift card has expired' })
  }

  if (card.balance <= 0) {
    return res.status(400).json({ error: 'Gift card has no remaining balance' })
  }

  const redeemAmount = amount ? Math.min(Number(amount), card.balance) : card.balance
  const newBalance = card.balance - redeemAmount

  await prisma.giftCard.update({
    where: { id: card.id },
    data: {
      balance: newBalance,
      status: newBalance <= 0 ? 'REDEEMED' : 'ACTIVE',
      redeemedBy: req.user?.id || null,
    },
  })

  res.json({
    redeemed: redeemAmount,
    remainingBalance: newBalance,
    orderId,
    message: `KSh ${redeemAmount} redeemed from gift card`,
  })
}))

// Send gift card (WhatsApp/Email share link generation)
router.post('/send', authRateLimiter, asyncHandler(async (req: Request, res: Response) => {
  const { code, method } = req.body

  if (!code) {
    return res.status(400).json({ error: 'Gift card code is required' })
  }

  const card = await prisma.giftCard.findUnique({
    where: { code: String(code).toUpperCase() },
  })

  if (!card) {
    return res.status(404).json({ error: 'Gift card not found' })
  }

  const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/gift-cards/redeem?code=${card.code}`

  let deliveryInfo: Record<string, string> = {}
  if (method === 'WHATSAPP' && card.recipientPhone) {
    deliveryInfo = {
      method: 'WHATSAPP',
      url: `https://wa.me/${card.recipientPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
        `🎁 You received a Hincton Meat Gift Card!\n\nAmount: KSh ${card.balance}\nFrom: ${card.senderName}\n${card.message ? `Message: ${card.message}\n` : ''}\nRedeem at: ${shareUrl}`
      )}`,
    }
  } else if (method === 'EMAIL' && card.recipientEmail) {
    deliveryInfo = {
      method: 'EMAIL',
      shareUrl,
      message: 'Email delivery queued',
    }
  } else {
    deliveryInfo = {
      method: 'PRINT',
      shareUrl,
      message: 'Use this link to share your gift card',
    }
  }

  res.json({ deliveryInfo })
}))

// ============================================================================
// ADMIN ROUTES
// ============================================================================

router.use(authenticate)
router.use(requireAdmin)

// List all gift cards
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { status, page = 1, limit = 20 } = req.query

  const where: any = {}
  if (status) where.status = String(status)

  const [giftCards, total] = await Promise.all([
    prisma.giftCard.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    }),
    prisma.giftCard.count({ where }),
  ])

  res.json({
    giftCards,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  })
}))

export default router
