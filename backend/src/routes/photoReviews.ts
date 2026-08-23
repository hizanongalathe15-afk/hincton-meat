import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import { prisma } from '../config/prisma'
import { authenticate, optionalAuthenticate } from '../middleware/auth'
import { getGuestSessionIdFromRequest } from '../services/guestClaimService'
import { uploadImage } from '../config/cloudinary'

const router = express.Router()

const isAdmin = (req: any) => (req.user?.roles || []).some((r: string) => ['ADMIN', 'SUPER_ADMIN'].includes(r))

const photoUploadPath = path.resolve(process.env.UPLOAD_DIR || 'uploads', 'photo-reviews')
fs.mkdirSync(photoUploadPath, { recursive: true })

const photoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 80 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) return cb(null, true)
    cb(new Error('Only image or video files are allowed'))
  },
})

const storePhoto = async (file: Express.Multer.File): Promise<string> => {
  try {
    const { url } = await uploadImage(file.buffer, 'photo-reviews')
    return url
  } catch {
    const ext = path.extname(file.originalname) || (file.mimetype.startsWith('video/') ? '.mp4' : '.jpg')
    const filename = `photo-review-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`
    fs.writeFileSync(path.join(photoUploadPath, filename), file.buffer)
    return `/uploads/photo-reviews/${filename}`
  }
}

const voterKeyFor = (req: any): string | null => {
  if (req.user?.id) return `user:${req.user.id}`
  const guestSessionId = getGuestSessionIdFromRequest(req)
  return guestSessionId ? `guest:${guestSessionId}` : null
}

const serializeReview = (review: any) => ({
  id: review.id,
  authorName: review.authorName,
  location: review.location,
  rating: review.rating,
  cutPurchased: review.cutPurchased,
  dishPrepared: review.dishPrepared,
  cookingTip: review.cookingTip,
  photoUrl: review.photoUrl,
  verifiedBuyer: review.verifiedBuyer,
  likes: review.likesCount,
  createdAt: review.createdAt,
})

const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: Number(process.env.PHOTO_REVIEW_SUBMIT_LIMIT_MAX || 6),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'You have submitted too many reviews today. Please try again tomorrow.' },
})

const likeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.PHOTO_REVIEW_LIKE_LIMIT_MAX || 60),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many likes in a short period. Please slow down.' },
})

// Public: list approved photo reviews (featured first, then newest)
router.get('/photo-reviews', optionalAuthenticate, async (req: any, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(String(req.query.limit || '12'), 10) || 12, 1), 24)
    const reviews = await prisma.photoReview.findMany({
      where: { status: 'APPROVED', deletedAt: null },
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    })
    let likedIds: string[] = []
    const voterKey = voterKeyFor(req)
    if (voterKey && reviews.length > 0) {
      const liked = await prisma.photoReviewLike.findMany({
        where: { voterKey, photoReviewId: { in: reviews.map((r) => r.id) } },
        select: { photoReviewId: true },
      })
      likedIds = liked.map((l) => l.photoReviewId)
    }
    res.json({
      reviews: reviews.map((r) => ({ ...serializeReview(r), likedByMe: likedIds.includes(r.id) })),
    })
  } catch (err: any) {
    console.error('Photo reviews list error:', err)
    res.status(500).json({ error: 'Failed to load photo reviews' })
  }
})

// Public-ish: submit a kitchen photo review (logged-in users or guests)
router.post('/photo-reviews', optionalAuthenticate, submitLimiter, photoUpload.single('photo'), async (req: any, res) => {
  try {
    const schema = z.object({
      authorName: z.string().trim().min(2).max(80).optional(),
      location: z.string().trim().max(120).optional(),
      cutPurchased: z.string().trim().min(2).max(120),
      dishPrepared: z.string().trim().min(2).max(160),
      cookingTip: z.string().trim().max(500).optional(),
      rating: z.coerce.number().int().min(1).max(5).default(5),
    })
    const data = schema.parse(req.body)
    if (!req.file) return res.status(400).json({ error: 'Please attach a photo of your dish' })

    let authorName = data.authorName
    let verifiedBuyer = false
    if (req.user?.id) {
      const profile: any = await (prisma as any).userProfile?.findUnique?.({ where: { userId: req.user.id } }).catch(() => null)
      authorName = profile?.fullName?.trim() || req.user.name?.trim() || req.user.username?.trim() || data.authorName
      const orderCount = await prisma.order.count({ where: { userId: req.user.id } })
      verifiedBuyer = orderCount > 0
    }
    if (!authorName) return res.status(400).json({ error: 'Please tell us your name so we can credit your creation' })

    const photoUrl = await storePhoto(req.file)
    const review = await prisma.photoReview.create({
      data: {
        userId: req.user?.id ?? null,
        guestSessionId: req.user?.id ? null : getGuestSessionIdFromRequest(req),
        authorName,
        location: data.location || null,
        rating: data.rating,
        cutPurchased: data.cutPurchased,
        dishPrepared: data.dishPrepared,
        cookingTip: data.cookingTip || null,
        photoUrl,
        verifiedBuyer,
        status: 'APPROVED',
      },
    })

    if (req.user?.id) {
      await prisma.user
        .update({ where: { id: req.user.id }, data: { loyaltyPoints: { increment: 100 } } })
        .catch((err) => console.error('Loyalty award for photo review failed:', err))
    }

    res.json({
      review: { ...serializeReview(review), likedByMe: false },
      loyaltyPointsAwarded: req.user?.id ? 100 : 0,
      message: req.user?.id
        ? 'Your photo review is live. +100 Loyalty Points credited.'
        : 'Your photo review is live. Sign in next time to earn loyalty points.',
    })
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.issues[0]?.message || 'Invalid review data' })
    console.error('Photo review submit error:', err)
    res.status(400).json({ error: err?.message || 'Failed to submit photo review' })
  }
})

// Public-ish: toggle a like (deduplicated per user or guest session)
router.post('/photo-reviews/:id/like', optionalAuthenticate, likeLimiter, async (req: any, res) => {
  try {
    const voterKey = voterKeyFor(req)
    if (!voterKey) return res.status(400).json({ error: 'Unable to identify you for liking. Please try again.' })
    const review = await prisma.photoReview.findFirst({ where: { id: req.params.id, deletedAt: null } })
    if (!review) return res.status(404).json({ error: 'Review not found' })

    const existing = await prisma.photoReviewLike.findUnique({
      where: { photoReviewId_voterKey: { photoReviewId: review.id, voterKey } },
    })
    if (existing) {
      await prisma.$transaction([
        prisma.photoReviewLike.delete({ where: { id: existing.id } }),
        prisma.photoReview.update({ where: { id: review.id }, data: { likesCount: { decrement: 1 } } }),
      ])
      const updated = await prisma.photoReview.findUnique({ where: { id: review.id } })
      return res.json({ liked: false, likes: Math.max(0, updated?.likesCount ?? 0) })
    }
    await prisma.$transaction([
      prisma.photoReviewLike.create({ data: { photoReviewId: review.id, voterKey } }),
      prisma.photoReview.update({ where: { id: review.id }, data: { likesCount: { increment: 1 } } }),
    ])
    const updated = await prisma.photoReview.findUnique({ where: { id: review.id } })
    res.json({ liked: true, likes: updated?.likesCount ?? 0 })
  } catch (err: any) {
    console.error('Photo review like error:', err)
    res.status(500).json({ error: 'Failed to update like' })
  }
})

// Admin: list every review including hidden ones
router.get('/admin/photo-reviews', authenticate, async (req: any, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' })
  try {
    const reviews = await prisma.photoReview.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, email: true, username: true } } },
    })
    res.json({ reviews })
  } catch {
    res.status(500).json({ error: 'Failed to load photo reviews' })
  }
})

// Admin: create a curated review (e.g. from WhatsApp submissions)
router.post('/admin/photo-reviews', authenticate, photoUpload.single('photo'), async (req: any, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' })
  try {
    const schema = z.object({
      authorName: z.string().trim().min(2).max(80),
      location: z.string().trim().max(120).optional(),
      cutPurchased: z.string().trim().min(2).max(120),
      dishPrepared: z.string().trim().min(2).max(160),
      cookingTip: z.string().trim().max(500).optional(),
      rating: z.coerce.number().int().min(1).max(5).default(5),
      verifiedBuyer: z.coerce.boolean().default(true),
      isFeatured: z.coerce.boolean().default(false),
      photoUrl: z.string().url().optional(),
    })
    const data = schema.parse(req.body)
    const photoUrl = req.file ? await storePhoto(req.file) : data.photoUrl
    if (!photoUrl) return res.status(400).json({ error: 'Attach a photo or provide a photoUrl' })
    const review = await prisma.photoReview.create({
      data: {
        authorName: data.authorName,
        location: data.location || null,
        rating: data.rating,
        cutPurchased: data.cutPurchased,
        dishPrepared: data.dishPrepared,
        cookingTip: data.cookingTip || null,
        photoUrl,
        verifiedBuyer: data.verifiedBuyer,
        isFeatured: data.isFeatured,
        status: 'APPROVED',
      },
    })
    res.json({ review })
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.issues[0]?.message || 'Invalid review data' })
    res.status(400).json({ error: err?.message || 'Failed to create photo review' })
  }
})

// Admin: moderate (hide/restore/feature)
router.patch('/admin/photo-reviews/:id', authenticate, async (req: any, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' })
  try {
    const schema = z.object({
      status: z.enum(['APPROVED', 'HIDDEN']).optional(),
      isFeatured: z.boolean().optional(),
      cookingTip: z.string().trim().max(500).optional(),
    })
    const review = await prisma.photoReview.update({ where: { id: req.params.id }, data: schema.parse(req.body) })
    res.json({ review })
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to update photo review' })
  }
})

// Admin: delete
router.delete('/admin/photo-reviews/:id', authenticate, async (req: any, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' })
  try {
    await prisma.photoReview.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } })
    res.json({ ok: true })
  } catch {
    res.status(500).json({ error: 'Failed to delete photo review' })
  }
})

const showcaseReviews = [
  {
    authorName: 'Wanjiru K.',
    location: 'Kilimani, Nairobi',
    rating: 5,
    cutPurchased: 'Prime Dry-Aged Ribeye',
    dishPrepared: 'Cast-Iron Butter Basted Ribeye Steak',
    cookingTip: 'Rest for a solid 8 minutes with crushed garlic butter — melt-in-the-mouth tenderness!',
    photoUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
    verifiedBuyer: true,
    isFeatured: true,
    likesCount: 38,
  },
  {
    authorName: 'Brian O.',
    location: 'Karen, Nairobi',
    rating: 5,
    cutPurchased: 'Fresh Goat / Mbuzi Choma Ribs',
    dishPrepared: 'Acacia Charcoal Mbuzi Choma with Kachumbari',
    cookingTip: 'Slow roast with coarse sea salt and rosemary brine. Best mbuzi in Nairobi hands down.',
    photoUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
    verifiedBuyer: true,
    isFeatured: true,
    likesCount: 54,
  },
  {
    authorName: 'Amina M.',
    location: 'Westlands, Nairobi',
    rating: 5,
    cutPurchased: 'Farm Fresh Country Capon',
    dishPrepared: 'Swahili Coconut Kuku Stew',
    cookingTip: 'Simmered gently with fresh turmeric and coconut cream. Incredibly rich flavor.',
    photoUrl: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
    verifiedBuyer: true,
    isFeatured: true,
    likesCount: 29,
  },
]

export const seedPhotoReviews = async () => {
  try {
    const count = await prisma.photoReview.count({ where: { deletedAt: null } })
    if (count > 0) return
    await prisma.photoReview.createMany({ data: showcaseReviews })
    console.log('Seeded showcase photo reviews')
  } catch (err) {
    console.error('Photo review seed skipped:', err)
  }
}

export default router
