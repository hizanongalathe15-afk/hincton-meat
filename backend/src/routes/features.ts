import express from 'express'
import { z } from 'zod'
import { prisma } from '../config/prisma'
import { authenticate, requireAdmin, type AuthRequest } from '../middleware'
import crypto from 'node:crypto'

const router = express.Router()

const uid = (prefix = 'rec') => `${prefix}_${crypto.randomBytes(10).toString('hex')}`

// -------- Helpers (raw SQL fallbacks for non-Prisma tables) --------
async function sql<T = any>(query: string, params: any[] = []): Promise<T[]> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any
    return (await (prisma as any).$queryRawUnsafe(query, ...params)) as T[]
  } catch (_) {
    return [] as T[]
  }
}

async function sqlExec(query: string, params: any[] = []): Promise<{ rows?: any[]; count: number }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
    const res = await (prisma as any).$executeRawUnsafe(query, ...params)
    return { count: Number(res ?? 0) }
  } catch (_) {
    return { count: 0 }
  }
}

const EmailSchema = z.string().email().min(5).max(200)

// ============================================================
// 1. Newsletter subscriptions
// ============================================================
const newsSubscribeSchema = z.object({
  email: EmailSchema,
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  source: z.enum(['EXIT_INTENT','FOOTER','CHECKOUT','POPUP','WEBSITE','IMPORT']).default('WEBSITE'),
})

router.post('/newsletter/subscribe', async (req, res) => {
  try {
    const body = newsSubscribeSchema.parse(req.body)
    const rows = await sql<any>(`SELECT id FROM newsletter_subscribers WHERE email = $1`, [body.email])
    if (rows.length > 0) {
      await sqlExec(
        `UPDATE newsletter_subscribers SET subscribed = true, source = COALESCE($2, source), "updatedAt" = CURRENT_TIMESTAMP WHERE email = $1`,
        [body.email, body.source ?? null],
      )
      return res.json({ success: true, message: 'Subscription preferences updated', subscribed: true })
    }
    const id = uid('nws')
    const token = crypto.randomBytes(20).toString('hex')
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip
    const ua = req.headers['user-agent'] as string | undefined
    await sqlExec(
      `INSERT INTO newsletter_subscribers (id, email, "firstName", "lastName", source, "doubleOptInToken", "unsubscribeToken", "ipAddress", "userAgent")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [id, body.email, body.firstName ?? null, body.lastName ?? null, body.source, token, token, ip ?? null, ua ?? null],
    )
    res.status(201).json({ success: true, message: 'Subscribed successfully', id })
  } catch (error: any) {
    res.status(400).json({ success: false, error: error?.message ?? 'Invalid payload' })
  }
})

router.post('/newsletter/unsubscribe', async (req, res) => {
  try {
    const schema = z.object({ email: EmailSchema, reason: z.string().max(500).optional() })
    const body = schema.parse(req.body)
    const token = crypto.randomBytes(20).toString('hex')
    await sqlExec(
      `UPDATE newsletter_subscribers SET subscribed = false, "unsubscribedAt" = CURRENT_TIMESTAMP, reason = $2, "unsubscribeToken" = $3, "updatedAt" = CURRENT_TIMESTAMP WHERE email = $1`,
      [body.email, body.reason ?? null, token],
    )
    res.json({ success: true, message: 'Unsubscribed' })
  } catch (error: any) {
    res.status(400).json({ success: false, error: error?.message ?? 'Invalid payload' })
  }
})

router.get('/newsletter/list', authenticate, requireAdmin, async (_req, res) => {
  const rows = await sql<any>(
    `SELECT id, email, "firstName", "lastName", source, subscribed, "createdAt" FROM newsletter_subscribers ORDER BY "createdAt" DESC LIMIT 1000`,
  )
  res.json({ subscribers: rows })
})

// ============================================================
// 2. Wishlist share tokens + public resolver
// ============================================================
const wishShareSchema = z.object({
  wishlistId: z.string().cuid().optional(),
  title: z.string().max(120).optional(),
  recipientEmail: z.string().email().optional(),
  recipientName: z.string().max(80).optional(),
  expiresDays: z.number().int().min(1).max(365).default(30),
})

router.post('/wishlist/share', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id
    const body = wishShareSchema.parse(req.body)
    const token = crypto.randomBytes(22).toString('base64url')
    const id = uid('wsh')
    const expiresAt = new Date(Date.now() + body.expiresDays * 24 * 60 * 60 * 1000)
    await sqlExec(
      `INSERT INTO wishlist_shares (id, "userId", "wishlistId", token, title, "recipientEmail", "recipientName", "expiresAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [id, userId, body.wishlistId ?? null, token, body.title ?? null, body.recipientEmail ?? null, body.recipientName ?? null, expiresAt],
    )
    res.status(201).json({ id, token, expiresAt, shareUrl: `/u/wishlist/${token}` })
  } catch (error: any) {
    res.status(400).json({ success: false, error: error?.message ?? 'Invalid payload' })
  }
})

router.get('/wishlist/share/:token', async (req, res) => {
  const rows = await sql<any>(
    `SELECT w.*, u.email AS ownerEmail
     FROM wishlist_shares w LEFT JOIN users u ON u.id = w."userId"
     WHERE w.token = $1 AND (w."expiresAt" IS NULL OR w."expiresAt" > CURRENT_TIMESTAMP)
     LIMIT 1`,
    [req.params.token],
  )
  if (!rows.length) return res.status(404).json({ error: 'Share link not found or expired' })
  const share = rows[0]
  await sqlExec(`UPDATE wishlist_shares SET "publicViewCount" = "publicViewCount" + 1 WHERE token = $1`, [req.params.token])

  // Resolve items from the shared user's wishlist
  const items = await prisma.wishlistItem?.findMany?.({
    where: { wishlist: { userId: share.userId } },
    include: { product: { include: { productImages: { take: 1 } } } },
  }).catch(() => []) || []
  res.json({ share, items })
})

// ============================================================
// 3. Review helpful votes
// ============================================================
const helpfulSchema = z.object({ helpful: z.boolean() })
router.post('/reviews/:reviewId/helpful', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id
    const reviewId = z.string().cuid().or(z.string().regex(/^rev_/)).parse(req.params.reviewId)
    const { helpful } = helpfulSchema.parse(req.body)
    const id = uid('rvh')
    await sqlExec(
      `INSERT INTO review_helpful_votes (id, "reviewId", "userId", helpful) VALUES ($1,$2,$3,$4)
       ON CONFLICT ("reviewId", "userId") DO UPDATE SET helpful = EXCLUDED.helpful`,
      [id, reviewId, userId, helpful],
    )
    const aggregated = await sql<{helpful:number; not_helpful:number}>(
      `SELECT
        COUNT(CASE WHEN helpful = true THEN 1 END)::int AS helpful,
        COUNT(CASE WHEN helpful = false THEN 1 END)::int AS not_helpful
       FROM review_helpful_votes WHERE "reviewId" = $1`,
      [reviewId],
    )
    res.json({ success: true, ...(aggregated[0] ?? { helpful: 0, not_helpful: 0 }) })
  } catch (error: any) {
    res.status(400).json({ success: false, error: error?.message ?? 'Invalid payload' })
  }
})

// ============================================================
// 4. Return labels (printable)
// ============================================================
router.post('/returns/:returnId/label', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id
    const returnId = req.params.returnId
    // Try Prisma, fallback raw
    const returnReq: any = (prisma.returnRequest as any)
      ? await (prisma.returnRequest as any).findFirst({ where: { id: returnId, userId } })
      : (await sql<any>(`SELECT * FROM return_requests WHERE id = $1 AND "userId" = $2 LIMIT 1`, [returnId, userId]))[0]
    if (!returnReq) return res.status(404).json({ error: 'Return request not found' })

    const existing = await sql<any>(`SELECT * FROM return_labels WHERE "returnRequestId" = $1 LIMIT 1`, [returnId])
    const carrier = 'Hincton Couriers'
    const trackingNumber = `HML${Date.now().toString(36).toUpperCase()}${crypto.randomBytes(2).toString('hex').toUpperCase()}`
    const qrCodeData = JSON.stringify({ rma: returnId, tracking: trackingNumber, carrier })
    const line1 = `RMA #${returnId} | Order #${returnReq.orderId ?? ''}`
    const line2 = 'Hincton Meat Products Returns Department'
    const line3 = 'Summit House, Waiyaki Way, Nairobi, Kenya'
    const line4 = `Tracking: ${trackingNumber} | Carrier: ${carrier}`
    const labelText = `${line1}\n${line2}\n${line3}\n${line4}\n\nCustomer: ${returnReq.shippingName ?? (req.user as any)?.name ?? ''}\nAddress: ${returnReq.shippingAddress ?? ''}\nReason: ${returnReq.reason ?? ''}`
    if (existing[0]) {
      return res.json({ label: existing[0] })
    }
    const id = uid('lbl')
    const expiry = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    await sqlExec(
      `INSERT INTO return_labels (id, "returnRequestId", "userId", "orderId", "trackingNumber", carrier, "qrCodeData", "labelText", "expiresAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [id, returnId, userId, returnReq.orderId ?? null, trackingNumber, carrier, qrCodeData, labelText, expiry],
    )
    const [label] = await sql<any>(`SELECT * FROM return_labels WHERE id = $1`, [id])
    res.status(201).json({ label, labelText, trackingNumber, carrier, qrCodeData, expiresAt: expiry })
  } catch (error: any) {
    res.status(400).json({ success: false, error: error?.message ?? 'Invalid payload' })
  }
})

// ============================================================
// 5. Back in stock alert registration
// ============================================================
const bisaSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  sentVia: z.enum(['EMAIL','SMS','BOTH']).default('EMAIL'),
})
router.post('/products/back-in-stock-alert', async (req, res) => {
  try {
    const body = bisaSchema.parse(req.body)
    if (!body.email && !body.phone) {
      return res.status(400).json({ error: 'Email or phone is required' })
    }
    // Use Prisma model if available
    if ((prisma as any).backInStockAlert) {
      const record = await (prisma as any).backInStockAlert.create({
        data: {
          productId: body.productId,
          variantId: body.variantId ?? null,
          email: body.email ?? null,
          phone: body.phone ?? null,
          sentVia: body.sentVia,
          notificationStatus: 'PENDING',
          expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        },
      })
      return res.status(201).json({ success: true, id: record.id })
    }
    const id = uid('bisa')
    await sqlExec(
      `INSERT INTO back_in_stock_alerts (id, "productId", "variantId", email, phone, "sentVia", "notificationStatus", "expiresAt")
       VALUES ($1,$2,$3,$4,$5,$6,'PENDING',$7)`,
      [id, body.productId, body.variantId ?? null, body.email ?? null, body.phone ?? null, body.sentVia, new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)],
    )
    res.status(201).json({ success: true, id })
  } catch (error: any) {
    res.status(400).json({ success: false, error: error?.message ?? 'Invalid payload' })
  }
})

// ============================================================
// 6. Social proof (live recent purchase events, viewers)
// ============================================================
router.get('/social-proof/recent', async (req, res) => {
  try {
    const limit = Math.min(Number((req.query as any).limit ?? 20), 60)
    const productId = (req.query as any).productId as string | undefined
    const productFilter = productId ? `AND "productId" = $2` : ''
    const params = productId ? [limit, productId] : [limit]
    const rows = await sql<any>(
      `SELECT * FROM social_proof_events
       WHERE "eventType" IN ('PURCHASE','CART_ADD','REVIEW') ${productFilter}
       ORDER BY "createdAt" DESC LIMIT $1`,
      params,
    )
    res.json({ events: rows })
  } catch {
    res.json({ events: [] })
  }
})

const socialProofInSchema = z.object({
  eventType: z.enum(['PURCHASE','VIEW','CART_ADD','REVIEW']),
  productId: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  customerInitials: z.string().optional(),
  quantity: z.number().int().min(1).default(1),
})
router.post('/social-proof/events', async (req, res) => {
  try {
    const body = socialProofInSchema.parse(req.body)
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip
    const id = uid('spe')
    await sqlExec(
      `INSERT INTO social_proof_events (id, "eventType", "productId", city, country, "customerInitials", quantity, "ipAddress")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [id, body.eventType, body.productId ?? null, body.city ?? null, body.country ?? null, body.customerInitials ?? null, body.quantity, ip ?? null],
    )
    res.status(201).json({ id })
  } catch (error: any) {
    res.status(400).json({ success: false, error: error?.message ?? 'Invalid payload' })
  }
})

// ============================================================
// 7. Gamification: Spin-win + loyalty ledger
// ============================================================
const spinPrizes = [
  { code: 'COUPON_10', label: '10% Off Coupon', points: 0, weight: 30 },
  { code: 'COUPON_FREE_SHIP', label: 'Free Shipping', points: 0, weight: 20 },
  { code: 'LOYALTY_POINTS_50', label: '50 Loyalty Points', points: 50, weight: 25 },
  { code: 'LOYALTY_POINTS_100', label: '100 Loyalty Points', points: 100, weight: 10 },
  { code: 'COUPON_15', label: '15% Off Coupon', points: 0, weight: 10 },
  { code: 'NO_PRIZE', label: 'Try Again Soon', points: 0, weight: 5 },
]
function pickPrize() {
  const total = spinPrizes.reduce((a, b) => a + b.weight, 0)
  let r = Math.random() * total
  for (const p of spinPrizes) {
    r -= p.weight
    if (r <= 0) return p
  }
  return spinPrizes[spinPrizes.length - 1]
}

router.get('/gamification/spin-win/config', async (_req, res) => {
  res.json({
    prizes: spinPrizes.map(p => ({ code: p.code, label: p.label })),
    dailyPlayLimitPerUser: 1,
  })
})

router.post('/gamification/spin-win/play', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
    const playsToday = await sql<{count:number}>(
      `SELECT COUNT(*)::int AS count FROM spin_win_plays
       WHERE "userId" = $1 AND "createdAt" >= $2 AND "createdAt" < $3`,
      [userId, today, tomorrow],
    )
    if ((playsToday[0]?.count ?? 0) >= 1) {
      return res.status(429).json({ error: 'Daily spin limit reached. Please check back tomorrow.' })
    }
    const prize = pickPrize()
    const id = uid('swp')
    const expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    let couponId: string | null = null
    if (prize.code.startsWith('COUPON_') && (prisma as any).coupon) {
      try {
        const percentage = prize.code === 'COUPON_15' ? 15 : prize.code === 'COUPON_10' ? 10 : 0
        const coupon = await (prisma as any).coupon.create({
          data: {
            code: `SPIN_${crypto.randomBytes(5).toString('hex').toUpperCase()}`,
            discountType: prize.code === 'COUPON_FREE_SHIP' ? 'FREE_SHIPPING' : 'PERCENTAGE',
            discountValue: prize.code === 'COUPON_FREE_SHIP' ? 100 : percentage,
            maxRedemptions: 1,
            expiresAt: expiry,
            active: true,
          },
        })
        couponId = coupon.id
      } catch { /* ignore */ }
    }
    let pointsAwarded = prize.points
    if (pointsAwarded > 0) {
      try {
        await sqlExec(
          `INSERT INTO loyalty_points (id, "userId", points, type, reason, "expiresAt") VALUES ($1,$2,$3,'SPIN_WIN',$4,$5)`,
          [uid('lp'), userId, pointsAwarded, `Spin-to-win play: ${prize.label}`, new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)],
        )
        await (prisma as any).user?.update?.({ where: { id: userId }, data: { loyaltyPoints: { increment: pointsAwarded } } }).catch(() => {})
      } catch { /* ignore */ }
    }
    await sqlExec(
      `INSERT INTO spin_win_plays (id, "userId", "prizeCode", "prizeLabel", "couponId", "pointsAwarded", "expiresAt") VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [id, userId, prize.code, prize.label, couponId, pointsAwarded, expiry],
    )
    res.status(201).json({
      success: true,
      id,
      prize: { code: prize.code, label: prize.label, pointsAwarded },
      couponId,
      expiresAt: expiry,
    })
  } catch (error: any) {
    res.status(400).json({ success: false, error: error?.message ?? 'Invalid payload' })
  }
})

router.get('/gamification/loyalty/summary', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id
    const ledger = await sql<any>(
      `SELECT * FROM loyalty_points WHERE "userId" = $1 ORDER BY "createdAt" DESC LIMIT 200`,
      [userId],
    )
    const badges = await sql<any>(`SELECT * FROM loyalty_badges WHERE "userId" = $1`, [userId])
    const user: any = (prisma as any).user ? await (prisma as any).user.findUnique({ where: { id: userId }, select: { loyaltyPoints: true } }) : null
    res.json({
      balance: Number(user?.loyaltyPoints ?? ledger.reduce((acc, r) => acc + Number(r.points || 0), 0)),
      ledger,
      badges,
    })
  } catch {
    res.json({ balance: 0, ledger: [], badges: [] })
  }
})

// ============================================================
// 8. A/B experiments + CWV telemetry + PWA install
// ============================================================
const abAssignSchema = z.object({ experimentKey: z.string().min(1), variant: z.string().min(1), sessionId: z.string().min(1) })
router.post('/experiments/assign', async (req, res) => {
  try {
    const body = abAssignSchema.parse(req.body)
    const existing = await sql<any>(
      `SELECT * FROM ab_experiment_assignments WHERE "experimentKey" = $1 AND "sessionId" = $2 LIMIT 1`,
      [body.experimentKey, body.sessionId],
    )
    if (existing[0]) return res.json({ assigned: existing[0] })
    const id = uid('ab')
    await sqlExec(
      `INSERT INTO ab_experiment_assignments (id, "experimentKey", variant, "sessionId") VALUES ($1,$2,$3,$4)
       ON CONFLICT ("experimentKey", "sessionId") DO NOTHING`,
      [id, body.experimentKey, body.variant, body.sessionId],
    )
    res.status(201).json({ assigned: { id, experimentKey: body.experimentKey, variant: body.variant, sessionId: body.sessionId } })
  } catch (error: any) {
    res.status(400).json({ success: false, error: error?.message ?? 'Invalid payload' })
  }
})

const cwvSchema = z.object({
  name: z.enum(['LCP','FID','CLS','INP','TTFB','FCP']),
  value: z.number().min(0),
  rating: z.enum(['good','needs-improvement','poor']),
  path: z.string().optional(),
  sessionId: z.string().optional(),
  connectionType: z.string().optional(),
})
router.get('/telemetry/cwv', (_req, res) => {
  res.json({ success: true, message: 'Telemetry endpoint active' })
})

router.post('/telemetry/cwv', async (req, res) => {
  try {
    const body = cwvSchema.parse(req.body)
    const id = uid('cwv')
    const ua = req.headers['user-agent'] as string | undefined
    await sqlExec(
      `INSERT INTO cwv_events (id, name, value, rating, path, "sessionId", "userAgent", "connectionType") VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [id, body.name, body.value, body.rating, body.path ?? null, body.sessionId ?? null, ua ?? null, body.connectionType ?? null],
    )
    res.status(201).json({ success: true, id })
  } catch (_err) {
    res.status(200).json({ success: true, message: 'Recorded' })
  }
})

router.post('/telemetry/pwa-install', async (req, res) => {
  try {
    const schema = z.object({ acceptedInstall: z.boolean(), platform: z.string().optional(), sessionId: z.string().optional() })
    const body = schema.parse(req.body)
    const id = uid('pwi')
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip
    await sqlExec(
      `INSERT INTO pwa_install_events (id, "acceptedInstall", platform, "sessionId", "ipAddress", "installedAt")
       VALUES ($1,$2,$3,$4,$5, CASE WHEN $2 = true THEN CURRENT_TIMESTAMP ELSE NULL END)`,
      [id, body.acceptedInstall, body.platform ?? null, body.sessionId ?? null, ip ?? null],
    )
    res.status(201).json({ id })
  } catch (error: any) {
    res.status(400).json({ success: false, error: error?.message ?? 'Invalid payload' })
  }
})

// ============================================================
// 9. Coupon auto-apply helper (returns best coupon for cart)
// ============================================================
const autoCouponSchema = z.object({
  cartSubtotal: z.number().min(0),
  itemCount: z.number().int().min(0),
  productIds: z.array(z.string().min(1)).default([]),
  customerSegment: z.string().optional(),
})
router.post('/coupons/best-for-cart', async (req, res) => {
  try {
    const body = autoCouponSchema.parse(req.body)
    if (!(prisma as any).coupon) {
      return res.json({ bestCoupon: null, candidates: [] })
    }
    const now = new Date()
    const candidates: any[] = await (prisma as any).coupon.findMany({
      where: {
        active: true,
        startsAt: { lte: now },
        OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
        minOrderValue: { lte: body.cartSubtotal },
      },
      orderBy: [{ discountType: 'asc' }, { discountValue: 'desc' }],
    })
    const scored = candidates
      .filter(c => {
        if (c.maxRedemptions != null && c.totalRedemptions >= c.maxRedemptions) return false
        return true
      })
      .map(c => {
        let savings = 0
        if (c.discountType === 'PERCENTAGE') savings = body.cartSubtotal * (Number(c.discountValue || 0) / 100)
        else if (c.discountType === 'FIXED') savings = Number(c.discountValue || 0)
        else if (c.discountType === 'FREE_SHIPPING') savings = 400 // representative
        if (c.maxDiscountAmount && savings > Number(c.maxDiscountAmount)) savings = Number(c.maxDiscountAmount)
        return { coupon: c, savings }
      })
      .sort((a, b) => b.savings - a.savings)
    const best = scored[0]?.coupon ?? null
    res.json({ bestCoupon: best, candidates: scored })
  } catch (error: any) {
    res.status(400).json({ success: false, error: error?.message ?? 'Invalid payload' })
  }
})

export default router
