import express from 'express'
import { prisma } from '../config/prisma'
import { authenticate } from '../middleware/auth'
import { z } from 'zod'

const router = express.Router()

const isAdmin = (req: any) => (req.user?.roles || []).some((role: string) => ['ADMIN', 'SUPER_ADMIN'].includes(role))

const parseBoolean = (v: any) => {
  if (typeof v === 'boolean') return v
  if (typeof v === 'string') return ['1', 'true', 'yes', 'on'].includes(v.toLowerCase())
  return Boolean(v)
}

// ============================================================================
// FAQ ITEMS
// ============================================================================
const faqCreateSchema = z.object({
  question: z.string().min(2).max(500),
  answer: z.string().min(2),
  category: z.string().max(120).optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
  keywords: z.string().optional(),
  createdBy: z.string().optional(),
})

const faqUpdateSchema = faqCreateSchema.partial()

// Public
router.get('/faq', async (req, res) => {
  try {
    const category = typeof req.query.category === 'string' ? req.query.category : undefined
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : undefined
    const includeInactive = typeof req.query.includeInactive === 'string' && parseBoolean(req.query.includeInactive)
    const where: any = {}
    if (!includeInactive) where.isActive = true
    if (category) where.category = category
    if (q) {
      where.OR = [
        { question: { contains: q, mode: 'insensitive' as any } },
        { answer: { contains: q, mode: 'insensitive' as any } },
        { keywords: { contains: q, mode: 'insensitive' as any } },
      ]
    }
    const items = await prisma.faqItem.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    })
    const categories = await prisma.faqItem.groupBy({
      where: { isActive: true },
      by: ['category'],
    })
    res.json({
      faqs: items,
      categories: categories.map(g => g.category).filter(Boolean).sort() as string[],
    })
  } catch (err) {
    console.error('GET /faq error', err)
    res.status(500).json({ error: 'Failed to load FAQ' })
  }
})

router.post('/faq/:id/helpful', async (req, res) => {
  try {
    const { helpful } = z.object({ helpful: z.boolean() }).parse(req.body || {})
    const id = req.params.id
    const faq = await prisma.faqItem.findUnique({ where: { id } })
    if (!faq) return res.status(404).json({ error: 'FAQ not found' })
    const updated = await prisma.faqItem.update({
      where: { id },
      data: helpful ? { helpfulYes: { increment: 1 } } : { helpfulNo: { increment: 1 } },
    })
    res.json({ helpfulYes: updated.helpfulYes, helpfulNo: updated.helpfulNo })
  } catch (err) {
    res.status(400).json({ error: 'Invalid vote' })
  }
})

// Admin FAQ CRUD
router.get('/admin/faq', authenticate, async (req: any, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' })
  try {
    const faqs = await prisma.faqItem.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }] })
    res.json({ faqs })
  } catch (err) {
    res.status(500).json({ error: 'Failed to load FAQs' })
  }
})

router.post('/admin/faq', authenticate, async (req: any, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' })
  try {
    const data = faqCreateSchema.parse(req.body)
    const faq = await prisma.faqItem.create({
      data: { ...data, createdBy: req.user?.id },
    })
    res.status(201).json({ faq })
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Invalid FAQ payload' })
  }
})

router.put('/admin/faq/:id', authenticate, async (req: any, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' })
  try {
    const id = req.params.id
    const data = faqUpdateSchema.parse(req.body)
    const faq = await prisma.faqItem.update({ where: { id }, data })
    res.json({ faq })
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Invalid FAQ payload' })
  }
})

router.delete('/admin/faq/:id', authenticate, async (req: any, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' })
  try {
    await prisma.faqItem.delete({ where: { id: req.params.id } })
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete FAQ' })
  }
})

// ============================================================================
// KNOWLEDGE BASE ARTICLES
// ============================================================================
const kbCreateSchema = z.object({
  title: z.string().min(2).max(500),
  slug: z.string().min(2).max(500),
  category: z.string().max(120).optional(),
  tags: z.string().optional(),
  excerpt: z.string().max(1000).optional(),
  content: z.string().min(2),
  featuredImage: z.string().optional(),
  isPublished: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
})

const kbUpdateSchema = kbCreateSchema.partial()

// Public
router.get('/kb/articles', async (req, res) => {
  try {
    const category = typeof req.query.category === 'string' ? req.query.category : undefined
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : undefined
    const where: any = { isPublished: true }
    if (category) where.category = category
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' as any } },
        { content: { contains: q, mode: 'insensitive' as any } },
        { excerpt: { contains: q, mode: 'insensitive' as any } },
      ]
    }
    const articles = await prisma.knowledgeBaseArticle.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    })
    const categories = await prisma.knowledgeBaseArticle.groupBy({
      where: { isPublished: true },
      by: ['category'],
    })
    res.json({
      articles,
      categories: categories.map(g => g.category).filter(Boolean).sort() as string[],
    })
  } catch (err) {
    console.error('GET /kb/articles error', err)
    res.status(500).json({ error: 'Failed to load help articles' })
  }
})

router.get('/kb/articles/:slug', async (req, res) => {
  try {
    const slug = req.params.slug
    const article = await prisma.knowledgeBaseArticle.findUnique({ where: { slug } })
    if (!article) return res.status(404).json({ error: 'Article not found' })
    if (!article.isPublished) return res.status(404).json({ error: 'Article not found' })
    const viewed = await prisma.knowledgeBaseArticle.update({
      where: { slug },
      data: { views: { increment: 1 } },
    })
    res.json({ article: viewed })
  } catch (err) {
    res.status(500).json({ error: 'Failed to load article' })
  }
})

router.post('/kb/articles/:slug/helpful', async (req, res) => {
  try {
    const { helpful } = z.object({ helpful: z.boolean() }).parse(req.body || {})
    const article = await prisma.knowledgeBaseArticle.findUnique({ where: { slug: req.params.slug } })
    if (!article) return res.status(404).json({ error: 'Article not found' })
    const updated = await prisma.knowledgeBaseArticle.update({
      where: { slug: req.params.slug },
      data: helpful ? { helpfulYes: { increment: 1 } } : { helpfulNo: { increment: 1 } },
    })
    res.json({ helpfulYes: updated.helpfulYes, helpfulNo: updated.helpfulNo })
  } catch (err) {
    res.status(400).json({ error: 'Invalid vote' })
  }
})

// Admin KB CRUD
router.get('/admin/kb/articles', authenticate, async (req: any, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' })
  try {
    const articles = await prisma.knowledgeBaseArticle.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    })
    res.json({ articles })
  } catch (err) {
    res.status(500).json({ error: 'Failed to load articles' })
  }
})

router.post('/admin/kb/articles', authenticate, async (req: any, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' })
  try {
    const data = kbCreateSchema.parse(req.body)
    const article = await prisma.knowledgeBaseArticle.create({
      data: {
        ...data,
        authorId: req.user?.id,
        publishedAt: data.isPublished ? new Date() : null,
      },
    })
    res.status(201).json({ article })
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Invalid article payload' })
  }
})

router.put('/admin/kb/articles/:id', authenticate, async (req: any, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' })
  try {
    const id = req.params.id
    const data = kbUpdateSchema.parse(req.body)
    const existing = await prisma.knowledgeBaseArticle.findUnique({ where: { id } })
    if (!existing) return res.status(404).json({ error: 'Not found' })
    const patch: any = { ...data }
    if (data.isPublished !== undefined && !existing.publishedAt && data.isPublished) patch.publishedAt = new Date()
    const article = await prisma.knowledgeBaseArticle.update({ where: { id }, data: patch })
    res.json({ article })
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Invalid article payload' })
  }
})

router.delete('/admin/kb/articles/:id', authenticate, async (req: any, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' })
  try {
    await prisma.knowledgeBaseArticle.delete({ where: { id: req.params.id } })
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete article' })
  }
})

// ============================================================================
// SUPPORT TICKETS
// ============================================================================
const ticketCreateSchema = z.object({
  subject: z.string().min(2).max(200),
  message: z.string().min(3),
  category: z.string().min(2).max(120).default('GENERAL_INQUIRY'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  orderId: z.string().optional(),
  attachments: z.array(z.string().url()).optional(),
})

const ticketReplySchema = z.object({
  message: z.string().min(1),
  attachments: z.array(z.string().url()).optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'WAITING_ON_CUSTOMER', 'WAITING_ON_THIRD_PARTY', 'RESOLVED', 'CLOSED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  csatScore: z.number().int().min(1).max(5).optional(),
  csatComment: z.string().optional(),
})

const serializeTicket = (t: any) => ({
  ...t,
  attachments: t.attachments ?? null,
  user: t.user
    ? { id: t.user.id, email: t.user.email, name: t.user.profile?.fullName || t.user.username || null, phone: t.user.phone }
    : null,
  responses: (t.responses || []).map((r: any) => ({
    ...r,
    attachments: r.attachments ?? null,
    user: r.user
      ? { id: r.user.id, email: r.user.email, name: r.user.profile?.fullName || r.user.username || null, roles: r.user.roles }
      : null,
  })),
})

// Buyer endpoints
router.get('/support/tickets/mine', authenticate, async (req: any, res) => {
  const userId = req.user?.id
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })
  try {
    const tickets = await prisma.supportTicket.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        responses: {
          orderBy: { createdAt: 'asc' },
          include: { user: { include: { profile: true } } },
        },
        order: undefined as any,
      },
    } as any)
    res.json({ tickets: (tickets as any[]).map(serializeTicket) })
  } catch (err) {
    console.error('GET /support/tickets/mine', err)
    res.status(500).json({ error: 'Failed to load tickets' })
  }
})

router.get('/support/tickets/:id', authenticate, async (req: any, res) => {
  const userId = req.user?.id
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })
  try {
    const id = req.params.id
    const where: any = { id, deletedAt: null }
    if (!isAdmin(req)) where.userId = userId
    const ticket = await prisma.supportTicket.findFirst({
      where,
      include: {
        order: true,
        user: { include: { profile: true } },
        responses: { orderBy: { createdAt: 'asc' }, include: { user: { include: { profile: true } } } },
      },
    } as any)
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' })
    if (!isAdmin(req)) {
      await prisma.supportTicket.update({ where: { id }, data: { readAt: new Date() } })
    }
    res.json({ ticket: serializeTicket(ticket) })
  } catch (err) {
    console.error('GET /support/tickets/:id', err)
    res.status(500).json({ error: 'Failed to load ticket' })
  }
})

router.post('/support/tickets', authenticate, async (req: any, res) => {
  const userId = req.user?.id
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })
  try {
    const data = ticketCreateSchema.parse(req.body)
    const ticket = await prisma.supportTicket.create({
      data: {
        userId,
        subject: data.subject,
        message: data.message,
        category: data.category,
        priority: data.priority,
        orderId: data.orderId,
        attachments: data.attachments?.length ? data.attachments as any : null,
      },
    })
    res.status(201).json({ ticket })
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Invalid ticket' })
  }
})

router.post('/support/tickets/:id/replies', authenticate, async (req: any, res) => {
  const userId = req.user?.id
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })
  try {
    const id = req.params.id
    const data = ticketReplySchema.parse(req.body)
    const admin = isAdmin(req)

    const existingWhere: any = { id, deletedAt: null }
    if (!admin) existingWhere.userId = userId
    const ticket = await prisma.supportTicket.findFirst({ where: existingWhere })
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' })

    const response = await prisma.supportTicketResponse.create({
      data: {
        ticketId: id,
        userId,
        message: data.message,
        isAdmin: admin,
        attachments: data.attachments?.length ? data.attachments as any : null,
      },
    })

    const patch: any = { updatedAt: new Date() }
    if (admin && data.status) patch.status = data.status
    if (admin && data.priority) patch.priority = data.priority
    if (!admin && patch.status === undefined) patch.status = 'OPEN'
    // Buyer closing via CSAT or admin replying auto-bumps to WAITING_ON_CUSTOMER if we can
    if (data.csatScore !== undefined) patch.csatScore = data.csatScore
    if (data.csatComment !== undefined) patch.csatComment = data.csatComment
    if (data.status !== undefined && patch.status === undefined) patch.status = data.status
    if (data.csatScore !== undefined || patch.status === 'RESOLVED' || patch.status === 'CLOSED') {
      patch.resolvedAt = patch.resolvedAt ?? (patch.status === 'RESOLVED' || patch.status === 'CLOSED' ? new Date() : undefined)
    }

    const updated = await prisma.supportTicket.update({ where: { id }, data: patch })

    res.status(201).json({
      response,
      ticket: { id: updated.id, status: updated.status, priority: updated.priority, csatScore: updated.csatScore },
    })
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Invalid reply' })
  }
})

// Admin support endpoints
router.get('/admin/support/tickets', authenticate, async (req: any, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' })
  try {
    const status = typeof req.query.status === 'string' ? (req.query.status as any) : undefined
    const priority = typeof req.query.priority === 'string' ? (req.query.priority as any) : undefined
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : undefined
    const where: any = { deletedAt: null }
    if (status) where.status = status
    if (priority) where.priority = priority
    if (q) {
      where.OR = [
        { subject: { contains: q, mode: 'insensitive' as any } },
        { message: { contains: q, mode: 'insensitive' as any } },
        { id: { contains: q } },
      ]
    }
    const tickets = await prisma.supportTicket.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { include: { profile: true } },
        order: true,
      },
    })
    const counts = await prisma.supportTicket.groupBy({
      where: { deletedAt: null },
      by: ['status'],
      _count: { status: true },
    })
    res.json({
      tickets: (tickets as any[]).map(serializeTicket),
      stats: counts.map(c => ({ status: c.status, count: c._count.status })),
    })
  } catch (err) {
    console.error('GET /admin/support/tickets', err)
    res.status(500).json({ error: 'Failed to load tickets' })
  }
})

router.patch('/admin/support/tickets/:id', authenticate, async (req: any, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' })
  try {
    const id = req.params.id
    const schema = z.object({
      status: z.enum(['OPEN', 'IN_PROGRESS', 'WAITING_ON_CUSTOMER', 'WAITING_ON_THIRD_PARTY', 'RESOLVED', 'CLOSED']).optional(),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
      assignedTo: z.string().optional(),
    })
    const data = schema.parse(req.body)
    const patch: any = { ...data }
    if ((data.status === 'RESOLVED' || data.status === 'CLOSED')) {
      patch.resolvedAt = new Date()
      patch.resolvedBy = req.user?.id
    }
    const ticket = await prisma.supportTicket.update({ where: { id }, data: patch })
    res.json({ ticket })
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Invalid patch' })
  }
})

router.delete('/admin/support/tickets/:id', authenticate, async (req: any, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' })
  try {
    await prisma.supportTicket.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } })
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete' })
  }
})

// ============================================================================
// RETURNS - add self-service detail endpoint (already has /mine and / create)
// ============================================================================
router.get('/returns/mine/:id', authenticate, async (req: any, res) => {
  const userId = req.user?.id
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })
  try {
    const r = await prisma.returnRequest.findFirst({
      where: { id: req.params.id, userId },
      include: { order: true, product: true } as any,
    })
    if (!r) return res.status(404).json({ error: 'Return not found' })
    res.json({ returnRequest: r })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to load return' })
  }
})

// ============================================================================
// INVOICES - downloadable printable HTML (prints/browser saves-as-PDF great)
// ============================================================================
router.get('/invoices/:invoiceNumber/download', authenticate, async (req: any, res) => {
  const userId = req.user?.id
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })
  try {
    const admin = isAdmin(req)
    const where: any = { invoiceNumber: req.params.invoiceNumber }
    if (!admin) where.userId = userId
    const invoice = await prisma.invoice.findFirst({
      where,
      include: {
        order: {
          include: {
            items: { include: { product: true } as any },
            user: { include: { profile: true } },
            shippingAddress: true,
            billingAddress: true,
            payments: true,
          },
        },
        user: { include: { profile: true } },
      } as any,
    })
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' })
    const order = invoice.order as any
    const user = invoice.user || order?.user
    const items = (order?.items || []) as any[]
    const subtotal = items.reduce((s, i) => s + Number(i.price || 0) * Number(i.quantity || 0), 0)
    const totalPaid = Number(invoice.totalAmount || order?.total || subtotal)
    const currency = 'GHS'
    const fmt = (n: number) => `${currency} ${Number(n || 0).toFixed(2)}`

    const brandName = user?.companyProfile?.name || 'Hincton Meat'
    const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Invoice ${invoice.invoiceNumber}</title>
<style>
  @page { size: A4; margin: 18mm 14mm; }
  body { font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif; color:#111; }
  .hdr { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid #b91c1c; padding-bottom:18px; }
  .brand { font-size: 26px; font-weight: 800; color:#9f2f20; letter-spacing:.5px; }
  .addr { font-size:12px; color:#333; line-height:1.55; margin-top:6px; white-space:pre-line; }
  .inv-info { text-align:right; }
  .inv-info h1 { font-size:22px; margin:0 0 4px; }
  .inv-info p { margin:2px 0; font-size:12px; color:#333; }
  .meta { display:grid; grid-template-columns: 1fr 1fr; gap:24px; margin:22px 0; }
  .box h3 { margin:0 0 6px; font-size:13px; text-transform:uppercase; letter-spacing:.5px; color:#777; }
  .box p { margin:2px 0; font-size:13px; line-height:1.5; }
  table { width:100%; border-collapse: collapse; margin-top:10px; font-size:13px; }
  th, td { border-bottom:1px solid #eee; padding: 10px 8px; text-align:left; vertical-align: top; }
  th { background:#fafafa; font-weight:600; color:#444; }
  .num { text-align:right; }
  .totals { margin-left:auto; width:320px; margin-top:18px; }
  .totals tr td { border:none; padding:4px 8px; }
  .totals tr.total td { font-weight:800; font-size:15px; border-top: 2px solid #111; padding-top:10px; }
  .foot { margin-top:40px; font-size:12px; color:#555; border-top:1px dashed #bbb; padding-top:14px; }
  .tag { display:inline-block; padding:3px 8px; border-radius:999px; background:#fee2e2; color:#991b1b; font-weight:700; font-size:12px; }
</style>
</head>
<body>
  <div class="hdr">
    <div>
      <div class="brand">${brandName}</div>
      <div class="addr">Customer Service\nEmail: support@hinctonmeat.com\nTel: 024 000 0000</div>
    </div>
    <div class="inv-info">
      <h1>Invoice <span class="tag">PAID</span></h1>
      <p><b>#${invoice.invoiceNumber}</b></p>
      <p>Issued: ${new Date(invoice.issueDate || invoice.createdAt).toLocaleDateString()}</p>
      <p>Due: ${new Date(invoice.dueDate || invoice.issueDate || invoice.createdAt).toLocaleDateString()}</p>
    </div>
  </div>

  <div class="meta">
    <div class="box">
      <h3>Bill to</h3>
      <p><b>${user?.profile?.fullName || user?.username || user?.email || 'Customer'}</b></p>
      <p>${user?.email || ''}</p>
      <p>${user?.phone || ''}</p>
    </div>
    <div class="box">
      <h3>Order / Shipping</h3>
      <p>Order ID: <b>${order?.id ? order.id.slice(0, 10) : '—'}</b></p>
      <p>Date placed: ${order?.createdAt ? new Date(order.createdAt).toLocaleDateString() : '—'}</p>
      <p>Status: <b>${(invoice.status || order?.status || 'ISSUED').toUpperCase()}</b></p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:46%">Item</th>
        <th class="num">Qty</th>
        <th class="num">Unit</th>
        <th class="num">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${items.length ? items.map(i => `<tr>
        <td><b>${i.product?.name || 'Item'}</b>${i.unitPrice ? `<div style="color:#666;font-size:11px">SKU ${i.product?.sku || '—'}</div>` : ''}</td>
        <td class="num">${i.quantity || 0}</td>
        <td class="num">${fmt(Number(i.unitPrice || i.price || 0))}</td>
        <td class="num">${fmt(Number(i.price || 0) * Number(i.quantity || 0))}</td>
      </tr>`).join('') : `<tr><td colspan="4" style="text-align:center;padding:20px;color:#777;">No items</td></tr>`}
    </tbody>
  </table>

  <table class="totals">
    <tr><td>Subtotal</td><td class="num">${fmt(subtotal)}</td></tr>
    <tr><td>Shipping</td><td class="num">${fmt(Number(order?.shippingCost || 0))}</td></tr>
    <tr><td>Discount</td><td class="num">-${fmt(Number(order?.discountAmount || 0))}</td></tr>
    <tr class="total"><td>TOTAL PAID</td><td class="num">${fmt(totalPaid)}</td></tr>
  </table>

  <div class="foot">
    <div><b>Thank you for your business!</b> For any queries about this invoice, reply to this email or call our support line.</div>
    <div style="margin-top:8px">Invoice generated on ${new Date().toLocaleString()}.</div>
  </div>
</body>
</html>`

    const filename = `Invoice_${invoice.invoiceNumber.replace(/[^a-zA-Z0-9-_]/g, '')}.html`
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(html)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to download invoice' })
  }
})

router.get('/invoices/mine', authenticate, async (req: any, res) => {
  const userId = req.user?.id
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })
  try {
    const invoices = await prisma.invoice.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ invoices })
  } catch (err) {
    res.status(500).json({ error: 'Failed to load invoices' })
  }
})

// ============================================================================
// ALERTS - Back-in-stock & Price-drop subscriptions (public with email)
// ============================================================================
const bisSchema = z.object({
  productId: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
})

router.post('/alerts/back-in-stock', async (req, res) => {
  try {
    const data = bisSchema.parse(req.body)
    const user = (req as any).user
    let userId = user?.id
    let email = data.email || user?.email
    if (!userId && email) {
      const found = await prisma.user.findUnique({ where: { email } })
      userId = found?.id
    }
    if (!userId && email) {
      const created = await prisma.user.create({
        data: { email, roles: ['BUYER'] as any, security: { create: { is_active: true, isEmailVerified: false } } },
      })
      userId = created.id
    }
    if (!userId) return res.status(400).json({ error: 'Email or login required' })

    const product = await prisma.product.findUnique({ where: { id: data.productId } })
    if (!product) return res.status(404).json({ error: 'Product not found' })

    await prisma.backInStockAlert.upsert({
      where: { userId_productId: { userId, productId: data.productId } },
      create: { userId, productId: data.productId, phone: data.phone, alertTriggered: false, createdAt: new Date() },
      update: { phone: data.phone, cancelledAt: null, alertTriggered: false },
    })
    res.json({ ok: true, message: "You'll be notified when this product is back in stock." })
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to subscribe' })
  }
})

router.post('/alerts/price-drop', async (req, res) => {
  try {
    const schema = bisSchema.extend({ targetPrice: z.number().positive().optional() })
    const data = schema.parse(req.body)
    const user = (req as any).user
    let userId = user?.id
    const email = data.email || user?.email
    if (!userId && email) {
      const found = await prisma.user.findUnique({ where: { email } })
      if (found) userId = found.id
      else {
        const created = await prisma.user.create({
          data: { email, roles: ['BUYER'] as any, security: { create: { is_active: true, isEmailVerified: false } } },
        })
        userId = created.id
      }
    }
    if (!userId) return res.status(400).json({ error: 'Email or login required' })
    const product = await prisma.product.findUnique({ where: { id: data.productId } })
    if (!product) return res.status(404).json({ error: 'Product not found' })

    await prisma.priceDropAlert.upsert({
      where: { userId_productId: { userId, productId: data.productId } },
      create: { userId, productId: data.productId, cancelledAt: null },
      update: { cancelledAt: null },
    })
    res.json({ ok: true, message: "You'll be notified when the price drops." })
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to subscribe' })
  }
})

router.get('/alerts/mine', authenticate, async (req: any, res) => {
  const userId = req.user?.id
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })
  try {
    const [bis, pda] = await Promise.all([
      prisma.backInStockAlert.findMany({
        where: { userId, cancelledAt: null },
        include: { product: { include: { productImages: { take: 1 } } } } as any,
      }),
      prisma.priceDropAlert.findMany({
        where: { userId, cancelledAt: null },
        include: { product: { include: { productImages: { take: 1 } } } } as any,
      }),
    ])
    res.json({
      backInStockAlerts: (bis as any[]).map(a => ({
        ...a, product: { ...a.product, image: a.product?.productImages?.[0]?.url || a.product?.images?.[0] || null },
      })),
      priceDropAlerts: (pda as any[]).map(a => ({
        ...a, product: { ...a.product, image: a.product?.productImages?.[0]?.url || a.product?.images?.[0] || null },
      })),
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to load alerts' })
  }
})

router.delete('/alerts/:type/:id', authenticate, async (req: any, res) => {
  const userId = req.user?.id
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })
  try {
    const { type, id } = req.params
    if (type === 'bis') {
      await prisma.backInStockAlert.updateMany({ where: { id, userId }, data: { cancelledAt: new Date() } })
    } else if (type === 'pda') {
      await prisma.priceDropAlert.updateMany({ where: { id, userId }, data: { cancelledAt: new Date() } })
    } else return res.status(400).json({ error: 'Invalid alert type' })
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel alert' })
  }
})

export default router
