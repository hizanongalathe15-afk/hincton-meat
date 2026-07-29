import express from 'express'
import { prisma } from '../config/prisma'
import { authenticate, optionalAuthenticate } from '../middleware/auth'
import { z } from 'zod'

const router = express.Router()

const isAdmin = (req: any) => (req.user?.roles || []).some((r: string) => ['ADMIN', 'SUPER_ADMIN'].includes(r))

// ============================================================================
// DECISION TREE
// ============================================================================

router.get('/decision-tree/root', async (_req, res) => {
  try {
    const root = await prisma.decisionTreeNode.findFirst({
      where: { isRoot: true, isActive: true },
      include: { options: { orderBy: { sortOrder: 'asc' } } },
    })
    res.json({ node: root })
  } catch {
    res.status(500).json({ error: 'Failed to load decision tree' })
  }
})

router.get('/decision-tree/node/:id', async (req, res) => {
  try {
    const node = await prisma.decisionTreeNode.findUnique({
      where: { id: req.params.id },
      include: { options: { orderBy: { sortOrder: 'asc' } } },
    })
    if (!node) return res.status(404).json({ error: 'Node not found' })
    res.json({ node })
  } catch {
    res.status(500).json({ error: 'Failed to load node' })
  }
})

// Admin: full tree management
router.get('/admin/decision-tree', authenticate, async (req: any, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' })
  try {
    const nodes = await prisma.decisionTreeNode.findMany({
      orderBy: [{ isRoot: 'desc' }, { sortOrder: 'asc' }],
      include: { options: { orderBy: { sortOrder: 'asc' } } },
    })
    res.json({ nodes })
  } catch {
    res.status(500).json({ error: 'Failed to load tree' })
  }
})

router.post('/admin/decision-tree/node', authenticate, async (req: any, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' })
  try {
    const schema = z.object({
      key: z.string().min(1).max(120),
      question: z.string().min(2),
      isRoot: z.boolean().default(false),
      sortOrder: z.number().int().default(0),
      isActive: z.boolean().default(true),
    })
    const data = schema.parse(req.body)
    if (data.isRoot) {
      await prisma.decisionTreeNode.updateMany({ where: { isRoot: true }, data: { isRoot: false } })
    }
    const node = await prisma.decisionTreeNode.create({ data, include: { options: true } })
    res.json({ node })
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to create node' })
  }
})

router.put('/admin/decision-tree/node/:id', authenticate, async (req: any, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' })
  try {
    const schema = z.object({
      key: z.string().min(1).max(120).optional(),
      question: z.string().min(2).optional(),
      isRoot: z.boolean().optional(),
      sortOrder: z.number().int().optional(),
      isActive: z.boolean().optional(),
      options: z.array(z.object({
        id: z.string().optional(),
        label: z.string().min(1),
        nextNodeId: z.string().nullable().optional(),
        resolution: z.string().nullable().optional(),
        linkUrl: z.string().nullable().optional(),
        linkLabel: z.string().nullable().optional(),
        sortOrder: z.number().int().default(0),
      })).optional(),
    })
    const { options, ...nodeData } = schema.parse(req.body)
    if (nodeData.isRoot) {
      await prisma.decisionTreeNode.updateMany({ where: { isRoot: true, id: { not: req.params.id } }, data: { isRoot: false } })
    }
    const node = await prisma.decisionTreeNode.update({ where: { id: req.params.id }, data: nodeData })
    if (options !== undefined) {
      await prisma.decisionTreeOption.deleteMany({ where: { nodeId: req.params.id } })
      await prisma.decisionTreeOption.createMany({
        data: options.map((o) => ({ ...o, id: undefined, nodeId: req.params.id })),
      })
    }
    const updated = await prisma.decisionTreeNode.findUnique({ where: { id: node.id }, include: { options: { orderBy: { sortOrder: 'asc' } } } })
    res.json({ node: updated })
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to update node' })
  }
})

router.delete('/admin/decision-tree/node/:id', authenticate, async (req: any, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' })
  try {
    await prisma.decisionTreeNode.delete({ where: { id: req.params.id } })
    res.json({ ok: true })
  } catch {
    res.status(500).json({ error: 'Failed to delete node' })
  }
})

// ============================================================================
// FORUM CATEGORIES
// ============================================================================

router.get('/forum/categories', optionalAuthenticate, async (_req, res) => {
  try {
    const categories = await prisma.forumCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { threads: { where: { deletedAt: null } } } },
      },
    })
    res.json({ categories })
  } catch {
    res.status(500).json({ error: 'Failed to load forum categories' })
  }
})

router.post('/admin/forum/categories', authenticate, async (req: any, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' })
  try {
    const schema = z.object({
      name: z.string().min(2).max(120),
      slug: z.string().min(2).max(120),
      description: z.string().max(500).optional(),
      icon: z.string().max(50).optional(),
      sortOrder: z.number().int().default(0),
      isActive: z.boolean().default(true),
    })
    const data = schema.parse(req.body)
    const cat = await prisma.forumCategory.create({ data })
    res.json({ category: cat })
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to create category' })
  }
})

router.put('/admin/forum/categories/:id', authenticate, async (req: any, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' })
  try {
    const schema = z.object({
      name: z.string().min(2).max(120).optional(),
      slug: z.string().min(2).max(120).optional(),
      description: z.string().max(500).nullable().optional(),
      icon: z.string().max(50).nullable().optional(),
      sortOrder: z.number().int().optional(),
      isActive: z.boolean().optional(),
    })
    const cat = await prisma.forumCategory.update({ where: { id: req.params.id }, data: schema.parse(req.body) })
    res.json({ category: cat })
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to update category' })
  }
})

router.delete('/admin/forum/categories/:id', authenticate, async (req: any, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' })
  try {
    await prisma.forumCategory.delete({ where: { id: req.params.id } })
    res.json({ ok: true })
  } catch {
    res.status(500).json({ error: 'Failed to delete category' })
  }
})

// ============================================================================
// FORUM THREADS
// ============================================================================

router.get('/forum/threads', optionalAuthenticate, async (req: any, res) => {
  try {
    const { categoryId, q, page = '1', limit = '20' } = req.query as Record<string, string>
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const where: any = { deletedAt: null }
    if (categoryId) where.categoryId = categoryId
    if (q) where.title = { contains: q, mode: 'insensitive' }
    const [threads, total] = await Promise.all([
      prisma.forumThread.findMany({
        where, skip, take: parseInt(limit),
        orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }],
        include: {
          user: { select: { id: true, username: true, profile: { select: { fullName: true, avatar: true } } } },
          category: { select: { id: true, name: true, slug: true } },
          _count: { select: { replies: { where: { deletedAt: null } } } },
        },
      }),
      prisma.forumThread.count({ where }),
    ])
    res.json({ threads, total, page: parseInt(page), limit: parseInt(limit) })
  } catch {
    res.status(500).json({ error: 'Failed to load threads' })
  }
})

router.get('/forum/threads/:id', optionalAuthenticate, async (req, res) => {
  try {
    const thread = await prisma.forumThread.findFirst({
      where: { id: req.params.id, deletedAt: null },
      include: {
        user: { select: { id: true, username: true, profile: { select: { fullName: true, avatar: true } } } },
        category: true,
        replies: {
          where: { deletedAt: null },
          orderBy: [{ isAccepted: 'desc' }, { createdAt: 'asc' }],
          include: {
            user: { select: { id: true, username: true, profile: { select: { fullName: true, avatar: true } } } },
          },
        },
      },
    })
    if (!thread) return res.status(404).json({ error: 'Thread not found' })
    await prisma.forumThread.update({ where: { id: thread.id }, data: { views: { increment: 1 } } })
    res.json({ thread })
  } catch {
    res.status(500).json({ error: 'Failed to load thread' })
  }
})

router.post('/forum/threads', authenticate, async (req: any, res) => {
  try {
    const schema = z.object({
      categoryId: z.string().min(1),
      title: z.string().min(5).max(300),
      body: z.string().min(10),
    })
    const data = schema.parse(req.body)
    const thread = await prisma.forumThread.create({
      data: { ...data, userId: req.user.id },
      include: {
        user: { select: { id: true, username: true, profile: { select: { fullName: true, avatar: true } } } },
        category: true,
        _count: { select: { replies: true } },
      },
    })
    res.json({ thread })
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to create thread' })
  }
})

router.put('/forum/threads/:id', authenticate, async (req: any, res) => {
  try {
    const thread = await prisma.forumThread.findFirst({ where: { id: req.params.id, deletedAt: null } })
    if (!thread) return res.status(404).json({ error: 'Thread not found' })
    if (thread.userId !== req.user.id && !isAdmin(req)) return res.status(403).json({ error: 'Forbidden' })
    const schema = z.object({
      title: z.string().min(5).max(300).optional(),
      body: z.string().min(10).optional(),
      isPinned: z.boolean().optional(),
      isLocked: z.boolean().optional(),
      isSolved: z.boolean().optional(),
    })
    const updated = await prisma.forumThread.update({ where: { id: req.params.id }, data: schema.parse(req.body) })
    res.json({ thread: updated })
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to update thread' })
  }
})

router.delete('/forum/threads/:id', authenticate, async (req: any, res) => {
  try {
    const thread = await prisma.forumThread.findFirst({ where: { id: req.params.id, deletedAt: null } })
    if (!thread) return res.status(404).json({ error: 'Thread not found' })
    if (thread.userId !== req.user.id && !isAdmin(req)) return res.status(403).json({ error: 'Forbidden' })
    await prisma.forumThread.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } })
    res.json({ ok: true })
  } catch {
    res.status(500).json({ error: 'Failed to delete thread' })
  }
})

// ============================================================================
// FORUM REPLIES
// ============================================================================

router.post('/forum/threads/:id/replies', authenticate, async (req: any, res) => {
  try {
    const thread = await prisma.forumThread.findFirst({ where: { id: req.params.id, deletedAt: null } })
    if (!thread) return res.status(404).json({ error: 'Thread not found' })
    if (thread.isLocked && !isAdmin(req)) return res.status(403).json({ error: 'Thread is locked' })
    const schema = z.object({ body: z.string().min(2) })
    const { body } = schema.parse(req.body)
    const reply = await prisma.forumReply.create({
      data: { threadId: req.params.id, userId: req.user.id, body },
      include: {
        user: { select: { id: true, username: true, profile: { select: { fullName: true, avatar: true } } } },
      },
    })
    await prisma.forumThread.update({ where: { id: req.params.id }, data: { updatedAt: new Date() } })
    res.json({ reply })
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to post reply' })
  }
})

router.patch('/forum/replies/:id/accept', authenticate, async (req: any, res) => {
  try {
    const reply = await prisma.forumReply.findFirst({ where: { id: req.params.id, deletedAt: null } })
    if (!reply) return res.status(404).json({ error: 'Reply not found' })
    const thread = await prisma.forumThread.findUnique({ where: { id: reply.threadId } })
    if (thread?.userId !== req.user.id && !isAdmin(req)) return res.status(403).json({ error: 'Forbidden' })
    await prisma.forumReply.updateMany({ where: { threadId: reply.threadId }, data: { isAccepted: false } })
    await prisma.forumReply.update({ where: { id: reply.id }, data: { isAccepted: true } })
    await prisma.forumThread.update({ where: { id: reply.threadId }, data: { isSolved: true } })
    res.json({ ok: true })
  } catch {
    res.status(500).json({ error: 'Failed to accept reply' })
  }
})

router.delete('/forum/replies/:id', authenticate, async (req: any, res) => {
  try {
    const reply = await prisma.forumReply.findFirst({ where: { id: req.params.id, deletedAt: null } })
    if (!reply) return res.status(404).json({ error: 'Reply not found' })
    if (reply.userId !== req.user.id && !isAdmin(req)) return res.status(403).json({ error: 'Forbidden' })
    await prisma.forumReply.update({ where: { id: reply.id }, data: { deletedAt: new Date() } })
    res.json({ ok: true })
  } catch {
    res.status(500).json({ error: 'Failed to delete reply' })
  }
})

// ============================================================================
// VIP EMERGENCY BYPASS
// ============================================================================

router.post('/vip-bypass', optionalAuthenticate, async (req: any, res) => {
  try {
    const schema = z.object({
      email: z.string().email(),
      name: z.string().min(2).max(200),
      orderRef: z.string().max(100).optional(),
      issue: z.string().min(10).max(2000),
    })
    const data = schema.parse(req.body)
    const request = await prisma.vipBypassRequest.create({
      data: { ...data, userId: req.user?.id ?? null },
    })
    res.json({ ok: true, id: request.id, message: 'Your urgent request has been received. Our team will contact you within 30 minutes.' })
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to submit bypass request' })
  }
})

router.get('/admin/vip-bypass', authenticate, async (req: any, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' })
  try {
    const { status, page = '1', limit = '20' } = req.query as Record<string, string>
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const where: any = {}
    if (status) where.status = status
    const [requests, total] = await Promise.all([
      prisma.vipBypassRequest.findMany({
        where, skip, take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, username: true, email: true } } },
      }),
      prisma.vipBypassRequest.count({ where }),
    ])
    res.json({ requests, total })
  } catch {
    res.status(500).json({ error: 'Failed to load bypass requests' })
  }
})

router.patch('/admin/vip-bypass/:id', authenticate, async (req: any, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' })
  try {
    const schema = z.object({
      status: z.enum(['PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED']).optional(),
      adminNote: z.string().max(2000).optional(),
    })
    const data = schema.parse(req.body)
    const resolved = data.status === 'RESOLVED' || data.status === 'REJECTED'
    const request = await prisma.vipBypassRequest.update({
      where: { id: req.params.id },
      data: {
        ...data,
        ...(resolved ? { resolvedAt: new Date(), resolvedBy: req.user.id } : {}),
      },
    })
    res.json({ request })
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to update bypass request' })
  }
})

// ============================================================================
// PAGE SNAPSHOTS
// ============================================================================

router.get('/snapshots/:pageKey', async (req, res) => {
  try {
    const snapshot = await prisma.pageSnapshot.findFirst({
      where: {
        pageKey: req.params.pageKey,
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    })
    res.json({ snapshot })
  } catch {
    res.status(500).json({ error: 'Failed to load snapshot' })
  }
})

router.get('/admin/snapshots', authenticate, async (req: any, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' })
  try {
    const snapshots = await prisma.pageSnapshot.findMany({ orderBy: { capturedAt: 'desc' } })
    res.json({ snapshots })
  } catch {
    res.status(500).json({ error: 'Failed to load snapshots' })
  }
})

router.post('/admin/snapshots', authenticate, async (req: any, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' })
  try {
    const schema = z.object({
      pageKey: z.string().min(1).max(120),
      title: z.string().min(1).max(300),
      htmlContent: z.string().min(1),
      expiresAt: z.string().datetime().nullable().optional(),
      isActive: z.boolean().default(true),
    })
    const data = schema.parse(req.body)
    const snapshot = await prisma.pageSnapshot.upsert({
      where: { pageKey: data.pageKey },
      create: { ...data, expiresAt: data.expiresAt ? new Date(data.expiresAt) : null },
      update: { ...data, capturedAt: new Date(), expiresAt: data.expiresAt ? new Date(data.expiresAt) : null },
    })
    res.json({ snapshot })
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to save snapshot' })
  }
})

router.delete('/admin/snapshots/:id', authenticate, async (req: any, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' })
  try {
    await prisma.pageSnapshot.delete({ where: { id: req.params.id } })
    res.json({ ok: true })
  } catch {
    res.status(500).json({ error: 'Failed to delete snapshot' })
  }
})

// ============================================================================
// DOWNTIME COUPON GENERATOR
// ============================================================================

router.post('/admin/downtime-coupon', authenticate, async (req: any, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' })
  try {
    const schema = z.object({
      discountType: z.enum(['PERCENTAGE', 'FIXED']).default('PERCENTAGE'),
      discountValue: z.number().positive().default(10),
      usageLimit: z.number().int().positive().nullable().optional(),
      validDays: z.number().int().positive().default(7),
      prefix: z.string().max(20).default('SORRY'),
    })
    const data = schema.parse(req.body)
    const code = `${data.prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    const validUntil = new Date(Date.now() + data.validDays * 86400000)
    const coupon = await prisma.coupon.create({
      data: {
        code,
        description: `Downtime apology coupon — auto-generated ${new Date().toLocaleDateString()}`,
        discountType: data.discountType,
        discountValue: data.discountValue,
        usageLimit: data.usageLimit ?? null,
        validFrom: new Date(),
        validUntil,
        isActive: true,
        usedCount: 0,
      },
    })
    res.json({ coupon })
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to generate coupon' })
  }
})

// ============================================================================
// SUPPORT ANALYTICS
// ============================================================================

router.get('/admin/support/analytics', authenticate, async (req: any, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' })
  try {
    const { from, to } = req.query as Record<string, string>
    const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 86400000)
    const toDate = to ? new Date(to) : new Date()
    const where = { createdAt: { gte: fromDate, lte: toDate }, deletedAt: null }

    const [
      totalTickets,
      openTickets,
      resolvedTickets,
      csatData,
      byStatus,
      byPriority,
      byCategory,
      recentTickets,
      avgResolutionRaw,
    ] = await Promise.all([
      prisma.supportTicket.count({ where }),
      prisma.supportTicket.count({ where: { ...where, status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
      prisma.supportTicket.count({ where: { ...where, status: { in: ['RESOLVED', 'CLOSED'] } } }),
      prisma.supportTicket.aggregate({ where: { ...where, csatScore: { not: null } }, _avg: { csatScore: true }, _count: { csatScore: true } }),
      prisma.supportTicket.groupBy({ by: ['status'], where, _count: { id: true } }),
      prisma.supportTicket.groupBy({ by: ['priority'], where, _count: { id: true } }),
      prisma.supportTicket.groupBy({ by: ['category'], where, _count: { id: true } }),
      prisma.supportTicket.findMany({
        where, take: 10, orderBy: { createdAt: 'desc' },
        select: { id: true, ticketNumber: true, subject: true, status: true, priority: true, createdAt: true },
      }),
      prisma.$queryRaw<{ avg_hours: number }[]>`
        SELECT AVG(EXTRACT(EPOCH FROM ("resolvedAt" - "createdAt")) / 3600) as avg_hours
        FROM support_tickets
        WHERE "resolvedAt" IS NOT NULL
          AND "createdAt" >= ${fromDate}
          AND "createdAt" <= ${toDate}
          AND "deletedAt" IS NULL
      `.catch(() => [{ avg_hours: null }]),
    ])

    // Build daily ticket volume for the period
    const days = Math.ceil((toDate.getTime() - fromDate.getTime()) / 86400000)
    const dailyTickets = await prisma.supportTicket.groupBy({
      by: ['createdAt'],
      where,
      _count: { id: true },
    })

    res.json({
      summary: {
        total: totalTickets,
        open: openTickets,
        resolved: resolvedTickets,
        avgCsat: csatData._avg.csatScore ? Number(csatData._avg.csatScore.toFixed(2)) : null,
        csatResponses: csatData._count.csatScore,
        avgResolutionHours: avgResolutionRaw[0]?.avg_hours ? Number(Number(avgResolutionRaw[0].avg_hours).toFixed(1)) : null,
        resolutionRate: totalTickets > 0 ? Math.round((resolvedTickets / totalTickets) * 100) : 0,
        periodDays: days,
      },
      byStatus: byStatus.map((s) => ({ status: s.status, count: s._count.id })),
      byPriority: byPriority.map((p) => ({ priority: p.priority, count: p._count.id })),
      byCategory: byCategory.map((c) => ({ category: c.category, count: c._count.id })),
      recentTickets,
    })
  } catch (err: any) {
    console.error('Support analytics error:', err)
    res.status(500).json({ error: 'Failed to load support analytics' })
  }
})

export default router
