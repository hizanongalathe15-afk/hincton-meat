import express from 'express'
import { prisma } from '../config/prisma'
import { z } from 'zod'
import { notifyRecipients } from '../utils/notificationService'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { uploadImage } from '../config/cloudinary'

const router = express.Router()

// Admin middleware to check permissions
const requireAdmin = (req: any, res: any, next: any) => {
  const user = req.user
  if (!user || !user.roles.includes('ADMIN')) {
    return res.status(403).json({ error: 'Admin access required' })
  }
  next()
}

// Apply admin middleware to all routes
router.use(requireAdmin)

// === DASHBOARD OVERVIEW ===
router.get('/dashboard', async (req, res) => {
  try {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

    const [
      totalSalesToday,
      totalSalesWeek,
      totalSalesMonth,
      previousMonthSales,
      ordersCount,
      currentMonthOrders,
      previousMonthOrders,
      ordersByStatus,
      topProducts,
      lowStockProducts,
      totalProducts,
      currentMonthProducts,
      previousMonthProducts,
      totalUsers,
      newCustomers,
      previousMonthUsers,
      recentOrders,
      abandonedCarts
    ] = await Promise.all([
      // Total sales today
      prisma.order.aggregate({
        where: {
          createdAt: { gte: today },
          status: { not: 'CANCELLED' }
        },
        _sum: { totalAmount: true }
      }),
      
      // Total sales this week
      prisma.order.aggregate({
        where: {
          createdAt: { gte: weekAgo },
          status: { not: 'CANCELLED' }
        },
        _sum: { totalAmount: true }
      }),
      
      // Total sales this month
      prisma.order.aggregate({
        where: {
          createdAt: { gte: monthAgo },
          status: { not: 'CANCELLED' }
        },
        _sum: { totalAmount: true }
      }),

      prisma.order.aggregate({
        where: {
          createdAt: { gte: new Date(monthAgo.getTime() - 30 * 24 * 60 * 60 * 1000), lt: monthAgo },
          status: { not: 'CANCELLED' }
        },
        _sum: { totalAmount: true }
      }),
      
      // Total orders count
      prisma.order.count(),

      prisma.order.count({
        where: {
          createdAt: { gte: monthAgo },
        }
      }),

      prisma.order.count({
        where: {
          createdAt: { gte: new Date(monthAgo.getTime() - 30 * 24 * 60 * 60 * 1000), lt: monthAgo },
        }
      }),
      
      // Orders by status
      prisma.order.groupBy({
        by: ['status'],
        _count: true
      }),
      
      // Top selling products
      prisma.orderItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5
      }),
      
      // Low stock products
      prisma.product.findMany({
        where: { stockQuantity: { lte: 10 } },
        select: { id: true, name: true, stockQuantity: true },
        orderBy: { stockQuantity: 'asc' },
        take: 10
      }),

      prisma.product.count({ where: { deletedAt: null } }),

      prisma.product.count({
        where: { deletedAt: null, createdAt: { gte: monthAgo } }
      }),

      prisma.product.count({
        where: { deletedAt: null, createdAt: { gte: new Date(monthAgo.getTime() - 30 * 24 * 60 * 60 * 1000), lt: monthAgo } }
      }),

      prisma.user.count({ where: { deletedAt: null } }),
      
      // New customers this month
      prisma.user.count({
        where: { createdAt: { gte: monthAgo } }
      }),

      prisma.user.count({
        where: { deletedAt: null, createdAt: { gte: new Date(monthAgo.getTime() - 30 * 24 * 60 * 60 * 1000), lt: monthAgo } }
      }),
      
      // Recent orders
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { email: true, username: true } }
        }
      }),

      prisma.abandonedCart.findMany({
        take: 10,
        orderBy: { abandonedAt: 'desc' },
        include: {
          user: { select: { email: true, phone: true, profile: { select: { fullName: true } } } },
          reminders: { select: { id: true }, take: 20 },
        },
      })
    ])

    // Get product details for top products
    const topProductIds = topProducts.map(p => p.productId)
    const topProductsDetails = await prisma.product.findMany({
      where: { id: { in: topProductIds } },
      select: { id: true, name: true, price: true, stockQuantity: true }
    })

    const topProductsWithDetails = topProducts.map(p => {
      const details = topProductsDetails.find(d => d.id === p.productId)
      return {
        ...p,
        product: details
      }
    })

    const currentMonthSales = Number(totalSalesMonth._sum.totalAmount || 0)
    const previousSales = Number(previousMonthSales._sum.totalAmount || 0)
    const percentChange = (current: number, previous: number) => previous > 0 ? ((current - previous) / previous) * 100 : current > 0 ? 100 : 0

    res.json({
      overview: {
        totalSalesToday: totalSalesToday._sum.totalAmount || 0,
        totalSalesWeek: totalSalesWeek._sum.totalAmount || 0,
        totalSalesMonth: totalSalesMonth._sum.totalAmount || 0,
        totalOrders: ordersCount,
        totalProducts,
        totalUsers,
        newCustomersThisMonth: newCustomers,
        ordersByStatus,
        changes: {
          revenue: percentChange(currentMonthSales, previousSales),
          orders: percentChange(currentMonthOrders, previousMonthOrders),
          products: percentChange(currentMonthProducts, previousMonthProducts),
          users: percentChange(newCustomers, previousMonthUsers)
        }
      },
      topProducts: topProductsWithDetails,
      lowStockProducts,
      recentOrders,
      abandonedCarts: abandonedCarts.map((cart) => ({
        id: cart.id,
        customerName: cart.user?.profile?.fullName || cart.user?.email || cart.guestEmail || cart.guestPhone || cart.guestSessionId || 'Guest buyer',
        customerEmail: cart.user?.email || cart.guestEmail || '',
        customerPhone: cart.user?.phone || cart.guestPhone || '',
        items: Array.isArray(cart.cartItems) ? cart.cartItems : [],
        totalAmount: Number(cart.cartValue || 0),
        abandonedAt: cart.abandonedAt,
        recoveryEmailsSent: cart.reminders.length,
        recoveryStatus: cart.recoveryStatus,
      })),
      generatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    res.status(500).json({ error: 'Failed to load dashboard data' })
  }
})

// Very small, schema-aligned subset to keep admin API compiling.
const uploadBasePath = process.env.UPLOAD_DIR || (process.env.VERCEL ? '/tmp/uploads' : 'uploads')
const productUploadPath = path.join(uploadBasePath, 'products')
const ensureDirectory = (dir: string) => {
  try {
    fs.mkdirSync(dir, { recursive: true })
  } catch (error) {
    console.warn(`Unable to create directory ${dir}:`, error)
  }
}
ensureDirectory(productUploadPath)

const productImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) return cb(null, true)
    cb(new Error('Only image, GIF, or video files are allowed'))
  },
})

const saveMediaToServer = (file: Express.Multer.File, folder: 'products' | 'ads') => {
  const targetPath = path.join(uploadBasePath, folder)
  ensureDirectory(targetPath)
  const filename = `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`
  fs.writeFileSync(path.join(targetPath, filename), file.buffer)
  return `/uploads/${folder}/${filename}`
}

const uploadMediaFile = async (file: Express.Multer.File, folder: 'products' | 'ads') => {
  try {
    return (await uploadImage(file.buffer, `hincton/${folder}`)).url
  } catch (error) {
    console.warn(`Cloudinary ${folder} upload unavailable, saving on server:`, error instanceof Error ? error.message : error)
    return saveMediaToServer(file, folder)
  }
}

const slugify = (input: string) =>
  input.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `product-${Date.now()}`

const parseNumber = (value: unknown) => {
  if (value === '' || value === undefined || value === null) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : value
}

const parseBoolean = (value: unknown) => {
  if (typeof value === 'boolean') return value
  if (value === 'true') return true
  if (value === 'false') return false
  return value
}

const productPayloadSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional().default(''),
  shortDescription: z.string().optional(),
  categoryId: z.string().optional().transform((value) => value || undefined),
  price: z.preprocess(parseNumber, z.number().positive()),
  comparePrice: z.preprocess(parseNumber, z.number().positive().optional()),
  stockQuantity: z.preprocess(parseNumber, z.number().int().min(0)),
  sku: z.string().optional().transform((value) => value?.trim() || undefined),
  weight: z.preprocess(parseNumber, z.number().nonnegative().optional()),
  unit: z.string().optional(),
  isPublished: z.preprocess(parseBoolean, z.boolean().default(true)),
  isFeatured: z.preprocess(parseBoolean, z.boolean().default(false)),
  existingImages: z.string().optional(),
  existingVideos: z.string().optional(),
})

const productInclude = {
  category: { select: { id: true, name: true, slug: true } },
  productImages: { orderBy: { sortOrder: 'asc' as const } },
  productVideos: { orderBy: { sortOrder: 'asc' as const } },
  reviews: { select: { rating: true } },
  _count: { select: { orderItems: true } },
}

const serializeProduct = (product: any) => {
  const reviews = product.reviews || []
  const reviewCount = reviews.length
  const averageRating = reviewCount ? reviews.reduce((sum: number, review: any) => sum + Number(review.rating || 0), 0) / reviewCount : Number(product.averageRating || 0)

  return {
    ...product,
    price: Number(product.price),
    comparePrice: product.comparePrice ? Number(product.comparePrice) : null,
    images: product.productImages?.map((image: any) => image.url) || [],
    videos: product.productVideos?.map((video: any) => video.url) || [],
    averageRating,
    reviewCount: reviewCount || Number(product.totalReviews || 0),
  }
}

const makeUniqueSlug = async (name: string, idToIgnore?: string) => {
  const base = slugify(name)
  let slug = base
  let suffix = 2

  while (true) {
    const existing = await prisma.product.findUnique({ where: { slug }, select: { id: true } })
    if (!existing || existing.id === idToIgnore) return slug
    slug = `${base}-${suffix++}`
  }
}

router.get('/health', async (_req, res) => {
  res.json({ ok: true })
})

// GET /admin/orders - Get all orders with filtering
router.get('/orders', async (req, res) => {
  try {
    const page = Number(req.query.page || 1)
    const limit = Number(req.query.limit || 50)
    const status = req.query.status as string | undefined
    const search = req.query.search as string | undefined
    const dateFrom = req.query.dateFrom as string | undefined
    const dateTo = req.query.dateTo as string | undefined

    const skip = (page - 1) * limit
    const where: any = {}

    if (status) {
      where.status = status
    }

    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = new Date(dateFrom)
      if (dateTo) where.createdAt.lte = new Date(dateTo)
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { guestEmail: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { trackingNumber: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: { select: { id: true, email: true, username: true } },
          orderItems: true,
          payments: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.order.count({ where })
    ])

    res.json({
      orders: orders.map(order => ({
        ...order,
        totalAmount: Number(order.totalAmount),
        subtotal: Number(order.subtotal),
        shippingCost: Number(order.shippingCost)
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Get orders error:', error)
    res.status(500).json({ error: 'Failed to fetch orders' })
  }
})

// GET /admin/orders/:id - Get single order
router.get('/orders/:id', async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        user: true,
        orderItems: { include: { product: true } },
        payments: true,
        trackingHistory: true
      }
    })

    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }

    res.json({
      ...order,
      totalAmount: Number(order.totalAmount),
      subtotal: Number(order.subtotal),
      shippingCost: Number(order.shippingCost)
    })
  } catch (error) {
    console.error('Get order error:', error)
    res.status(500).json({ error: 'Failed to fetch order' })
  }
})

const adminOrderStatusSchema = z.object({
  status: z.enum([
    'PENDING',
    'CONFIRMED',
    'PROCESSING',
    'SHIPPED',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'CANCELLED',
    'REFUNDED',
    'RETURNED',
    'PARTIALLY_SHIPPED',
    'ON_HOLD',
    'AWAITING_PAYMENT',
    'PAYMENT_FAILED',
  ]),
  paymentStatus: z.enum([
    'UNPAID',
    'PAID',
    'FAILED',
    'REFUNDED',
    'PARTIALLY_REFUNDED',
    'PENDING',
    'AUTHORIZED',
    'VOIDED',
    'EXPIRED',
  ]).optional(),
  notes: z.string().max(1000).optional(),
  trackingNumber: z.string().max(120).optional(),
  courier: z.string().max(120).optional(),
})

const adminOrderNoteSchema = z.object({
  notes: z.string().trim().min(1).max(2000),
})

const adminOrderReasonSchema = z.object({
  reason: z.string().trim().min(3).max(1000),
})

const adminRefundSchema = z.object({
  amount: z.number().positive().optional(),
  reason: z.string().trim().min(3).max(1000),
})

const allowedOrderTransitions: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'PROCESSING', 'AWAITING_PAYMENT', 'ON_HOLD', 'CANCELLED', 'PAYMENT_FAILED'],
  AWAITING_PAYMENT: ['PENDING', 'CONFIRMED', 'PROCESSING', 'PAYMENT_FAILED', 'ON_HOLD', 'CANCELLED'],
  PAYMENT_FAILED: ['AWAITING_PAYMENT', 'PENDING', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'ON_HOLD', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'PARTIALLY_SHIPPED', 'OUT_FOR_DELIVERY', 'ON_HOLD', 'CANCELLED', 'REFUNDED'],
  PARTIALLY_SHIPPED: ['SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'ON_HOLD'],
  SHIPPED: ['OUT_FOR_DELIVERY', 'DELIVERED', 'RETURNED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'RETURNED', 'ON_HOLD'],
  DELIVERED: ['RETURNED', 'REFUNDED'],
  ON_HOLD: ['PENDING', 'CONFIRMED', 'PROCESSING', 'CANCELLED'],
  CANCELLED: [],
  REFUNDED: [],
  RETURNED: ['REFUNDED'],
}

const orderStatusDescription = (status: string, orderNumber: string, notes?: string) => {
  if (notes) return notes
  const label = status.replace(/_/g, ' ').toLowerCase()
  return `Order ${orderNumber} is now ${label}.`
}

const notifyOrderBuyer = (order: any, title: string, message: string) => notifyRecipients({
  type: 'ORDER',
  title,
  message,
  actionUrl: `/order-tracking/${order.orderNumber}`,
  channels: ['inApp', 'email', 'sms', 'whatsapp'],
  recipients: order.user ? [{
    id: order.user.id,
    email: order.user.email,
    phone: order.user.phone || order.user.profile?.mpesaPhone,
  }] : [{
    email: order.guestEmail || undefined,
    phone: order.guestPhone || undefined,
  }],
  data: { orderId: order.id, orderNumber: order.orderNumber, status: order.status },
})

const createOrderAudit = (tx: any, req: any, action: string, orderId: string, oldValues: any, newValues: any) => tx.auditLog.create({
  data: {
    userId: req.user?.id,
    action,
    entityType: 'Order',
    entityId: orderId,
    oldValues,
    newValues,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  },
})

router.put('/orders/:id/status', async (req: any, res) => {
  try {
    const adminId = req.user?.id
    const data = adminOrderStatusSchema.parse(req.body)

    const existing = await prisma.order.findFirst({
      where: { id: req.params.id, deletedAt: null },
      include: {
        user: { select: { id: true, email: true, phone: true, profile: { select: { mpesaPhone: true, fullName: true } } } },
        payments: { orderBy: { createdAt: 'desc' }, take: 1 },
        orderItems: true,
      },
    })

    if (!existing) return res.status(404).json({ error: 'Order not found' })

    const allowedNext = allowedOrderTransitions[existing.status] || []
    const isSameStatus = data.status === existing.status
    if (!isSameStatus && !allowedNext.includes(data.status)) {
      return res.status(400).json({
        error: `Invalid order status change from ${existing.status} to ${data.status}`,
        allowedNext,
      })
    }

    const updated = await prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id: existing.id },
        data: {
          status: data.status,
          paymentStatus: data.paymentStatus,
          trackingNumber: data.trackingNumber || undefined,
          courier: data.courier || undefined,
          notes: data.notes ?? existing.notes,
          deliveredAt: data.status === 'DELIVERED' && !existing.deliveredAt ? new Date() : undefined,
          cancelledAt: data.status === 'CANCELLED' && !existing.cancelledAt ? new Date() : undefined,
          refundedAt: data.status === 'REFUNDED' && !existing.refundedAt ? new Date() : undefined,
        },
        include: {
          user: { select: { id: true, email: true, phone: true, profile: { select: { mpesaPhone: true, fullName: true } } } },
          orderItems: true,
          payments: true,
          statusHistory: { orderBy: { createdAt: 'desc' }, take: 10 },
          trackingHistory: { orderBy: { timestamp: 'desc' }, take: 10 },
        },
      })

      if (!isSameStatus || data.notes) {
        await tx.orderStatusHistory.create({
          data: {
            orderId: existing.id,
            status: data.status,
            notes: data.notes || `Admin changed status from ${existing.status} to ${data.status}`,
            createdBy: adminId || 'admin',
          },
        })
      }

      await tx.trackingHistory.create({
        data: {
          orderId: existing.id,
          trackingNumber: data.trackingNumber || existing.trackingNumber || existing.orderNumber,
          status: data.status,
          location: data.status === 'OUT_FOR_DELIVERY' ? 'Delivery route' : 'Hincton Meat Products',
          description: orderStatusDescription(data.status, existing.orderNumber, data.notes),
          rawData: {
            previousStatus: existing.status,
            newStatus: data.status,
            previousPaymentStatus: existing.paymentStatus,
            newPaymentStatus: data.paymentStatus || existing.paymentStatus,
            courier: data.courier || existing.courier,
          },
        },
      })

      if (data.paymentStatus && existing.payments[0]) {
        await tx.payment.update({
          where: { id: existing.payments[0].id },
          data: { status: data.paymentStatus },
        })
      }

      await tx.auditLog.create({
        data: {
          userId: adminId,
          action: 'ORDER_STATUS_UPDATE',
          entityType: 'Order',
          entityId: existing.id,
          oldValues: {
            status: existing.status,
            paymentStatus: existing.paymentStatus,
            trackingNumber: existing.trackingNumber,
            courier: existing.courier,
          },
          newValues: {
            status: data.status,
            paymentStatus: data.paymentStatus || existing.paymentStatus,
            trackingNumber: data.trackingNumber || existing.trackingNumber,
            courier: data.courier || existing.courier,
            notes: data.notes,
          },
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      })

      return order
    })

    await notifyRecipients({
      type: 'ORDER',
      title: `Order update ${updated.orderNumber}`,
      message: orderStatusDescription(updated.status, updated.orderNumber, data.notes),
      actionUrl: `/order-tracking/${updated.orderNumber}`,
      channels: ['inApp', 'email', 'sms', 'whatsapp'],
      recipients: updated.user ? [{
        id: updated.user.id,
        email: updated.user.email,
        phone: updated.user.phone || updated.user.profile?.mpesaPhone,
      }] : [{
        email: updated.guestEmail || undefined,
        phone: updated.guestPhone || undefined,
      }],
      data: { orderId: updated.id, orderNumber: updated.orderNumber, status: updated.status },
    }).catch((error) => console.error('Order status communication error:', error))

    res.json({ message: 'Order status updated successfully', order: updated })
  } catch (error) {
    console.error('Admin update order status error:', error)
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid order update payload', details: error.issues })
    res.status(500).json({ error: 'Failed to update order status' })
  }
})

router.post('/orders/:id/accept', async (req: any, res) => {
  try {
    const existing = await prisma.order.findFirst({
      where: { id: req.params.id, deletedAt: null },
      include: { user: { select: { id: true, email: true, phone: true, profile: { select: { mpesaPhone: true } } } } },
    })
    if (!existing) return res.status(404).json({ error: 'Order not found' })
    if (!['PENDING', 'AWAITING_PAYMENT'].includes(existing.status)) {
      return res.status(400).json({ error: `Order cannot be accepted from ${existing.status}` })
    }

    const order = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: existing.id },
        data: { status: 'CONFIRMED', adminNotes: req.body?.notes || existing.adminNotes },
        include: { user: { select: { id: true, email: true, phone: true, profile: { select: { mpesaPhone: true } } } } },
      })
      await tx.orderStatusHistory.create({
        data: { orderId: existing.id, status: 'CONFIRMED', notes: 'Admin accepted order', createdBy: req.user?.id || 'admin' },
      })
      await tx.trackingHistory.create({
        data: {
          orderId: existing.id,
          trackingNumber: existing.trackingNumber || existing.orderNumber,
          status: 'CONFIRMED',
          location: 'Hincton Meat Products',
          description: `Order ${existing.orderNumber} has been accepted and confirmed.`,
        },
      })
      await createOrderAudit(tx, req, 'ORDER_ACCEPTED', existing.id, { status: existing.status }, { status: 'CONFIRMED' })
      return updated
    })

    await notifyOrderBuyer(order, `Order accepted ${order.orderNumber}`, `Your Hincton order ${order.orderNumber} has been accepted and is being prepared.`)
      .catch((error) => console.error('Order accept notification error:', error))
    res.json({ message: 'Order accepted successfully', order })
  } catch (error) {
    console.error('Accept order error:', error)
    res.status(500).json({ error: 'Failed to accept order' })
  }
})

router.put('/orders/:id/internal-notes', async (req: any, res) => {
  try {
    const data = adminOrderNoteSchema.parse(req.body)
    const existing = await prisma.order.findFirst({ where: { id: req.params.id, deletedAt: null } })
    if (!existing) return res.status(404).json({ error: 'Order not found' })

    const order = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({ where: { id: existing.id }, data: { adminNotes: data.notes } })
      await createOrderAudit(tx, req, 'ORDER_INTERNAL_NOTES_UPDATE', existing.id, { adminNotes: existing.adminNotes }, { adminNotes: data.notes })
      return updated
    })

    res.json({ message: 'Internal notes saved', order })
  } catch (error) {
    console.error('Update internal notes error:', error)
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Notes are required', details: error.issues })
    res.status(500).json({ error: 'Failed to save internal notes' })
  }
})

router.post('/orders/:id/cancel', async (req: any, res) => {
  try {
    const data = adminOrderReasonSchema.parse(req.body)
    const existing = await prisma.order.findFirst({
      where: { id: req.params.id, deletedAt: null },
      include: {
        user: { select: { id: true, email: true, phone: true, profile: { select: { mpesaPhone: true } } } },
        orderItems: true,
      },
    })
    if (!existing) return res.status(404).json({ error: 'Order not found' })
    if (!['PENDING', 'CONFIRMED', 'PROCESSING', 'AWAITING_PAYMENT', 'ON_HOLD', 'PAYMENT_FAILED'].includes(existing.status)) {
      return res.status(400).json({ error: `Order cannot be cancelled from ${existing.status}` })
    }

    const order = await prisma.$transaction(async (tx) => {
      for (const item of existing.orderItems) {
        if (!item.productId) continue
        if (item.variantId) {
          await tx.productVariant.update({ where: { id: item.variantId }, data: { stockQuantity: { increment: item.quantity } } })
        } else {
          await tx.product.update({ where: { id: item.productId }, data: { stockQuantity: { increment: item.quantity } } })
        }
      }
      const updated = await tx.order.update({
        where: { id: existing.id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          adminNotes: `${existing.adminNotes || ''}\nCancellation reason: ${data.reason}`.trim(),
        },
        include: { user: { select: { id: true, email: true, phone: true, profile: { select: { mpesaPhone: true } } } } },
      })
      await tx.orderStatusHistory.create({
        data: { orderId: existing.id, status: 'CANCELLED', notes: data.reason, createdBy: req.user?.id || 'admin' },
      })
      await createOrderAudit(tx, req, 'ORDER_CANCELLED', existing.id, { status: existing.status }, { status: 'CANCELLED', reason: data.reason })
      return updated
    })

    await notifyOrderBuyer(order, `Order cancelled ${order.orderNumber}`, `Your Hincton order ${order.orderNumber} was cancelled. Reason: ${data.reason}`)
      .catch((error) => console.error('Order cancel notification error:', error))
    res.json({ message: 'Order cancelled successfully', order })
  } catch (error) {
    console.error('Admin cancel order error:', error)
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Cancellation reason is required', details: error.issues })
    res.status(500).json({ error: 'Failed to cancel order' })
  }
})

router.post('/orders/:id/mark-paid', async (req: any, res) => {
  try {
    const existing = await prisma.order.findFirst({
      where: { id: req.params.id, deletedAt: null },
      include: {
        user: { select: { id: true, email: true, phone: true, profile: { select: { mpesaPhone: true } } } },
        payments: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    })
    if (!existing) return res.status(404).json({ error: 'Order not found' })

    const order = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: existing.id },
        data: { paymentStatus: 'PAID', status: existing.status === 'PENDING' ? 'CONFIRMED' : existing.status },
        include: { user: { select: { id: true, email: true, phone: true, profile: { select: { mpesaPhone: true } } } } },
      })
      if (existing.payments[0]) {
        await tx.payment.update({ where: { id: existing.payments[0].id }, data: { status: 'PAID', completedAt: new Date() } })
      }
      await createOrderAudit(tx, req, 'ORDER_MARKED_PAID', existing.id, { paymentStatus: existing.paymentStatus }, { paymentStatus: 'PAID' })
      return updated
    })

    await notifyOrderBuyer(order, `Payment confirmed ${order.orderNumber}`, `Payment for your Hincton order ${order.orderNumber} has been confirmed.`)
      .catch((error) => console.error('Manual paid notification error:', error))
    res.json({ message: 'Order marked as paid', order })
  } catch (error) {
    console.error('Mark paid error:', error)
    res.status(500).json({ error: 'Failed to mark order as paid' })
  }
})

router.post('/orders/:id/refund', async (req: any, res) => {
  try {
    const data = adminRefundSchema.parse(req.body)
    const existing = await prisma.order.findFirst({
      where: { id: req.params.id, deletedAt: null },
      include: {
        user: { select: { id: true, email: true, phone: true, profile: { select: { mpesaPhone: true } } } },
        payments: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    })
    if (!existing) return res.status(404).json({ error: 'Order not found' })
    const payment = existing.payments[0]
    if (!payment) return res.status(400).json({ error: 'No payment exists for this order' })

    const refundAmount = data.amount || Number(payment.amount)
    const isPartial = refundAmount < Number(payment.amount)
    const order = await prisma.$transaction(async (tx) => {
      await tx.refund.create({
        data: {
          paymentId: payment.id,
          orderId: existing.id,
          amount: refundAmount as any,
          reason: data.reason,
          status: 'REFUNDED',
          refundReference: `MANUAL-${Date.now()}`,
          processedBy: req.user?.id || 'admin',
          completedAt: new Date(),
        },
      })
      await tx.payment.update({ where: { id: payment.id }, data: { status: isPartial ? 'PARTIALLY_REFUNDED' : 'REFUNDED' } })
      const updated = await tx.order.update({
        where: { id: existing.id },
        data: { paymentStatus: isPartial ? 'PARTIALLY_REFUNDED' : 'REFUNDED', status: isPartial ? existing.status : 'REFUNDED', refundedAt: isPartial ? existing.refundedAt : new Date() },
        include: { user: { select: { id: true, email: true, phone: true, profile: { select: { mpesaPhone: true } } } } },
      })
      await createOrderAudit(tx, req, 'ORDER_REFUND_PROCESSED', existing.id, { paymentStatus: existing.paymentStatus }, { amount: refundAmount, reason: data.reason, paymentStatus: isPartial ? 'PARTIALLY_REFUNDED' : 'REFUNDED' })
      return updated
    })

    await notifyOrderBuyer(order, `Refund processed ${order.orderNumber}`, `A refund of ${refundAmount} has been recorded for your Hincton order ${order.orderNumber}.`)
      .catch((error) => console.error('Refund notification error:', error))
    res.json({ message: 'Refund recorded successfully', order })
  } catch (error) {
    console.error('Refund order error:', error)
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Refund amount/reason is invalid', details: error.issues })
    res.status(500).json({ error: 'Failed to process refund' })
  }
})

router.get('/products', async (req, res) => {
  try {
    const page = Number(req.query.page || 1)
    const limit = Number(req.query.limit || 50)
    const search = String(req.query.search || '').trim()
    const category = String(req.query.category || '').trim()
    const status = String(req.query.status || '').trim()
    const where: any = { deletedAt: null }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (category) {
      where.OR = [
        ...(where.OR || []),
        { categoryId: category },
        { category: { is: { slug: category } } },
        { category: { is: { name: { equals: category, mode: 'insensitive' } } } },
      ]
    }

    if (status === 'active') where.isPublished = true
    if (status === 'inactive') where.isPublished = false
    if (status === 'out_of_stock') where.stockQuantity = 0

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: Math.max(page - 1, 0) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: productInclude,
      }),
      prisma.product.count({ where }),
    ])

    res.json({
      products: products.map(serializeProduct),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('Admin get products error:', error)
    res.status(500).json({ error: 'Failed to get products' })
  }
})

// POST /admin/products/bulk-upload - Bulk upload products
router.post('/products/bulk-upload', productImageUpload.array('files', 100), async (req, res) => {
  try {
    const { products } = req.body
    
    if (!products) {
      return res.status(400).json({ error: 'No products data provided' })
    }

    let productsArray: any[] = []
    try {
      productsArray = typeof products === 'string' ? JSON.parse(products) : products
    } catch (e) {
      return res.status(400).json({ error: 'Invalid products JSON format' })
    }

    if (!Array.isArray(productsArray)) {
      return res.status(400).json({ error: 'Products must be an array' })
    }

    const created: any[] = []
    const failed: any[] = []

    for (let i = 0; i < productsArray.length; i++) {
      try {
        const productData = productPayloadSchema.parse(productsArray[i])
        const slug = await makeUniqueSlug(productData.name)
        
        const product = await prisma.product.create({
          data: {
            name: productData.name,
            slug,
            description: productData.description || '',
            shortDescription: productData.shortDescription,
            price: productData.price,
            comparePrice: productData.comparePrice,
            stockQuantity: productData.stockQuantity,
            sku: productData.sku,
            weight: productData.weight,
            weightUnit: productData.unit,
            isPublished: productData.isPublished,
            isFeatured: productData.isFeatured,
            categoryId: productData.categoryId,
            createdAt: new Date()
          }
        })
        created.push(product)
      } catch (error: any) {
        failed.push({
          index: i,
          data: productsArray[i],
          error: error.message
        })
      }
    }

    res.json({
      success: true,
      message: `Bulk upload completed: ${created.length} created, ${failed.length} failed`,
      created: created.length,
      failed: failed.length,
      failedItems: failed
    })
  } catch (error) {
    console.error('Bulk upload error:', error)
    res.status(500).json({ error: 'Bulk upload failed' })
  }
})

// GET /admin/products/bulk-export - Export all products
router.get('/products/bulk-export', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { deletedAt: null },
      include: {
        category: { select: { name: true } },
        productImages: { select: { url: true }, take: 1 }
      },
      orderBy: { createdAt: 'desc' }
    })

    const exportData = products.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      shortDescription: p.shortDescription,
      sku: p.sku,
      category: p.category?.name,
      price: Number(p.price),
      comparePrice: p.comparePrice ? Number(p.comparePrice) : null,
      stockQuantity: p.stockQuantity,
      weight: p.weight,
      unit: p.weightUnit,
      isPublished: p.isPublished,
      isFeatured: p.isFeatured,
      image: p.productImages[0]?.url,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    }))

    // Set headers for CSV download
    const csvHeaders = Object.keys(exportData[0] || {})
    const csvContent = [
      csvHeaders.join(','),
      ...exportData.map(item => 
        csvHeaders.map(header => {
          const value = (item as any)[header]
          if (value === null || value === undefined) return ''
          if (typeof value === 'string' && value.includes(',')) return `"${value}"`
          return value
        }).join(',')
      )
    ].join('\n')

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename="products-export.csv"')
    res.send(csvContent)
  } catch (error) {
    console.error('Bulk export error:', error)
    res.status(500).json({ error: 'Bulk export failed' })
  }
})

router.get('/products/:id', async (req, res) => {
  try {
    const product = await prisma.product.findFirst({
      where: { id: req.params.id, deletedAt: null },
      include: productInclude,
    })

    if (!product) return res.status(404).json({ error: 'Product not found' })
    res.json({ product: serializeProduct(product) })
  } catch (error) {
    console.error('Admin get product error:', error)
    res.status(500).json({ error: 'Failed to get product' })
  }
})

router.post('/products', productImageUpload.fields([{ name: 'images', maxCount: 12 }, { name: 'videos', maxCount: 8 }]), async (req, res) => {
  try {
    const data = productPayloadSchema.parse(req.body)
    const files = req.files as Record<string, Express.Multer.File[]> | undefined
    const imageFiles = files?.images || []
    const videoFiles = files?.videos || []
    const imageUrls = await Promise.all(imageFiles.map((file) => uploadMediaFile(file, 'products')))
    const videoUrls = await Promise.all(videoFiles.map((file) => uploadMediaFile(file, 'products')))
    const slug = await makeUniqueSlug(data.name)
    const sku = data.sku || `SKU-${Date.now()}`

    const product = await prisma.product.create({
      data: {
        name: data.name,
        slug,
        sku,
        description: data.description,
        shortDescription: data.shortDescription,
        price: data.price as any,
        comparePrice: data.comparePrice as any,
        stockQuantity: data.stockQuantity,
        stockStatus: data.stockQuantity > 0 ? 'in_stock' : 'out_of_stock',
        categoryId: data.categoryId,
        weight: data.weight,
        weightUnit: data.unit,
        isPublished: data.isPublished,
        isFeatured: data.isFeatured,
        publishedAt: data.isPublished ? new Date() : null,
        productImages: {
          create: imageUrls.map((url, index) => ({ url, sortOrder: index, isPrimary: index === 0 })),
        },
        productVideos: {
          create: videoUrls.map((url, index) => ({ url, provider: 'cloudinary', sortOrder: index })),
        },
      },
      include: productInclude,
    })

    res.status(201).json({ message: 'Product created successfully', product: serializeProduct(product) })
  } catch (error: any) {
    console.error('Admin create product error:', error)
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Please check the product details and try again.', details: error.issues })
    }
    res.status(500).json({ error: 'Failed to create product' })
  }
})

router.put('/products/:id', productImageUpload.fields([{ name: 'images', maxCount: 12 }, { name: 'videos', maxCount: 8 }]), async (req, res) => {
  try {
    const existing = await prisma.product.findFirst({ where: { id: req.params.id, deletedAt: null }, include: { productImages: true, productVideos: true } })
    if (!existing) return res.status(404).json({ error: 'Product not found' })

    const data = productPayloadSchema.partial({ name: true, price: true, stockQuantity: true }).parse(req.body)
    const files = req.files as Record<string, Express.Multer.File[]> | undefined
    const imageFiles = files?.images || []
    const videoFiles = files?.videos || []
    const newImageUrls = await Promise.all(imageFiles.map((file) => uploadMediaFile(file, 'products')))
    const newVideoUrls = await Promise.all(videoFiles.map((file) => uploadMediaFile(file, 'products')))
    const keptImages = data.existingImages ? JSON.parse(data.existingImages) as string[] : existing.productImages.map((image) => image.url)
    const keptVideos = data.existingVideos ? JSON.parse(data.existingVideos) as string[] : existing.productVideos.map((video) => video.url)
    const finalImageUrls = [...keptImages, ...newImageUrls]
    const finalVideoUrls = [...keptVideos, ...newVideoUrls]

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        name: data.name,
        slug: data.name ? await makeUniqueSlug(data.name, req.params.id) : undefined,
        description: data.description,
        shortDescription: data.shortDescription,
        price: data.price as any,
        comparePrice: data.comparePrice as any,
        stockQuantity: data.stockQuantity,
        stockStatus: data.stockQuantity === undefined ? undefined : data.stockQuantity > 0 ? 'in_stock' : 'out_of_stock',
        categoryId: data.categoryId,
        weight: data.weight,
        weightUnit: data.unit,
        isPublished: data.isPublished,
        isFeatured: data.isFeatured,
        publishedAt: data.isPublished ? (existing.publishedAt || new Date()) : null,
        productImages: {
          deleteMany: {},
          create: finalImageUrls.map((url, index) => ({ url, sortOrder: index, isPrimary: index === 0 })),
        },
        productVideos: {
          deleteMany: {},
          create: finalVideoUrls.map((url, index) => ({ url, provider: 'cloudinary', sortOrder: index })),
        },
      },
      include: productInclude,
    })

    res.json({ message: 'Product updated successfully', product: serializeProduct(product) })
  } catch (error: any) {
    console.error('Admin update product error:', error)
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Please check the product details and try again.', details: error.issues })
    }
    res.status(500).json({ error: 'Failed to update product' })
  }
})

router.delete('/products/:id', async (req, res) => {
  try {
    const product = await prisma.product.findFirst({ where: { id: req.params.id, deletedAt: null } })
    if (!product) return res.status(404).json({ error: 'Product not found' })

    await prisma.product.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date(), isPublished: false },
    })

    res.json({ message: 'Product deleted successfully' })
  } catch (error) {
    console.error('Admin delete product error:', error)
    res.status(500).json({ error: 'Failed to delete product' })
  }
})

router.get('/settings', async (_req, res) => {
  try {
    const settings = await prisma.systemSetting.findMany({
      orderBy: { group: 'asc' }
    })
    res.json({ settings })
  } catch (error) {
    console.error('Get admin settings error:', error)
    res.status(500).json({ error: 'Failed to get settings' })
  }
})

const updateSettingSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
  type: z.enum(['string', 'number', 'boolean', 'json']).default('string'),
  description: z.string().optional(),
  group: z.string().default('general'),
  isPublic: z.boolean().default(false),
})

router.post('/settings', async (req, res) => {
  try {
    const data = updateSettingSchema.parse(req.body)
    
    const setting = await prisma.systemSetting.upsert({
      where: { key: data.key },
      update: {
        value: data.value,
        type: data.type,
        description: data.description,
        group: data.group,
        isPublic: data.isPublic,
      },
      create: data,
    })

    res.json({ message: 'Setting updated successfully', setting })
  } catch (error) {
    console.error('Update admin settings error:', error)
    res.status(500).json({ error: 'Failed to update setting' })
  }
})

router.put('/settings/:key', async (req, res) => {
  try {
    const { key } = req.params
    const { value } = z.object({ value: z.string() }).parse(req.body)
    
    const setting = await prisma.systemSetting.update({
      where: { key },
      data: { value },
    })

    res.json({ message: 'Setting updated successfully', setting })
  } catch (error) {
    console.error('Update admin setting error:', error)
    res.status(500).json({ error: 'Failed to update setting' })
  }
})

const communicationSchema = z.object({
  target: z.enum(['all', 'users', 'emails']),
  userIds: z.array(z.string()).optional().default([]),
  emails: z.array(z.string().email()).optional().default([]),
  channels: z.array(z.enum(['email', 'inApp', 'sms', 'whatsapp'])).min(1),
  type: z.enum(['SYSTEM', 'PROMOTION', 'ACCOUNT']).default('SYSTEM'),
  subject: z.string().min(3).max(160),
  message: z.string().min(3).max(5000),
  actionUrl: z.string().optional(),
})

router.post('/communications/send', async (req, res) => {
  try {
    const payload = communicationSchema.parse(req.body)

    const userWhere =
      payload.target === 'all'
        ? { deletedAt: null }
        : payload.target === 'users'
          ? { id: { in: payload.userIds } }
          : { email: { in: payload.emails } }

    const users = await prisma.user.findMany({
      where: userWhere as any,
      select: { id: true, email: true, phone: true, profile: { select: { mpesaPhone: true } } },
    })
    const existingEmails = new Set(users.map((user) => user.email))
    const rawEmailRecipients = payload.target === 'emails'
      ? payload.emails.filter((email) => !existingEmails.has(email)).map((email) => ({ email }))
      : []

    const summary = await notifyRecipients({
      type: payload.type,
      title: payload.subject,
      message: payload.message,
      actionUrl: payload.actionUrl,
      channels: payload.channels,
      recipients: [
        ...users.map((user) => ({
        id: user.id,
        email: user.email,
        phone: user.phone || user.profile?.mpesaPhone,
        })),
        ...rawEmailRecipients,
      ],
    })

    res.json({ message: 'Communication processed', recipients: users.length + rawEmailRecipients.length, summary })
  } catch (error) {
    console.error('Admin communication error:', error)
    res.status(500).json({ error: 'Failed to send communication' })
  }
})

// === USER MANAGEMENT ===
router.get('/users', async (req, res) => {
  try {
    const { page = '1', limit = '20', search, role } = req.query
    const pageNum = Math.max(1, parseInt(String(page), 10) || 1)
    const limitNum = Math.max(1, parseInt(String(limit), 10) || 20)
    const skip = (pageNum - 1) * limitNum

    const where: any = { deletedAt: null }
    
    if (search) {
      where.OR = [
        { email: { contains: String(search), mode: 'insensitive' } },
        { username: { contains: String(search), mode: 'insensitive' } },
        { profile: { 
          OR: [
            { firstName: { contains: String(search), mode: 'insensitive' } },
            { lastName: { contains: String(search), mode: 'insensitive' } },
            { fullName: { contains: String(search), mode: 'insensitive' } }
          ]
        }}
      ]
    }

    if (role) {
      where.roles = { has: String(role).toUpperCase() }
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          username: true,
          phone: true,
          roles: true,
          createdAt: true,
          updatedAt: true,
          profile: {
            select: {
              firstName: true,
              lastName: true,
              fullName: true,
              avatar: true,
              mpesaPhone: true
            }
          },
          security: {
            select: {
              isEmailVerified: true,
              isPhoneVerified: true,
              is_active: true,
              is_locked: true,
              last_login_at: true
            }
          },
          _count: {
            select: {
              orders: true,
              reviews: true
            }
          }
        }
      }),
      prisma.user.count({ where })
    ])

    // Get total spent for each user
    const userIds = users.map(u => u.id)
    const orderTotals = await prisma.order.groupBy({
      by: ['userId'],
      where: { 
        userId: { in: userIds },
        status: { not: 'CANCELLED' }
      },
      _sum: { totalAmount: true }
    })

    const usersWithSpending = users.map(user => {
      const orderTotal = orderTotals.find(ot => ot.userId === user.id)
      return {
        ...user,
        totalSpent: Number(orderTotal?._sum.totalAmount || 0)
      }
    })

    res.json({
      users: usersWithSpending,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) }
    })
  } catch (error) {
    console.error('Get users error:', error)
    res.status(500).json({ error: 'Failed to get users' })
  }
})

router.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    const user = await prisma.user.findUnique({
      where: { id, deletedAt: null },
      select: {
        id: true,
        email: true,
        username: true,
        phone: true,
        roles: true,
        createdAt: true,
        updatedAt: true,
        profile: true,
        security: true,
        addresses: true,
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true,
            status: true,
            paymentStatus: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            orders: true,
            reviews: true,
            addresses: true
          }
        }
      }
    })

    if (!user) return res.status(404).json({ error: 'User not found' })

    // Get total spent
    const totalSpent = await prisma.order.aggregate({
      where: { 
        userId: id,
        status: { not: 'CANCELLED' }
      },
      _sum: { totalAmount: true }
    })

    res.json({ 
      user: {
        ...user,
        totalSpent: Number(totalSpent._sum.totalAmount || 0)
      }
    })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ error: 'Failed to get user' })
  }
})

router.put('/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params
    const { action } = z.object({
      action: z.enum(['activate', 'deactivate', 'lock', 'unlock', 'verify_email', 'verify_phone'])
    }).parse(req.body)

    const updateData: any = {}
    
    switch (action) {
      case 'activate':
        updateData.security = { update: { is_active: true, is_locked: false } }
        break
      case 'deactivate':
        updateData.security = { update: { is_active: false } }
        break
      case 'lock':
        updateData.security = { update: { is_locked: true, locked_until: new Date(Date.now() + 24 * 60 * 60 * 1000) } }
        break
      case 'unlock':
        updateData.security = { update: { is_locked: false, locked_until: null, login_attempts: 0 } }
        break
      case 'verify_email':
        updateData.security = { update: { isEmailVerified: true } }
        break
      case 'verify_phone':
        updateData.security = { update: { isPhoneVerified: true } }
        break
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        security: true,
        profile: true
      }
    })

    res.json({ message: `User ${action}d successfully`, user })
  } catch (error) {
    console.error('Update user status error:', error)
    res.status(500).json({ error: 'Failed to update user status' })
  }
})

// === NOTIFICATIONS MANAGEMENT ===
router.get('/notifications', async (req, res) => {
  try {
    const { page = '1', limit = '50', unread = 'false' } = req.query
    const pageNum = Math.max(1, parseInt(String(page), 10) || 1)
    const limitNum = Math.max(1, parseInt(String(limit), 10) || 50)
    const skip = (pageNum - 1) * limitNum
    const showUnreadOnly = unread === 'true'

    const where: any = { userId: (req as any).user?.id }
    if (showUnreadOnly) {
      where.isRead = false
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId: (req as any).user?.id, isRead: false } }),
    ])

    res.json({
      notifications,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
      unreadCount
    })
  } catch (error) {
    console.error('Get notifications error:', error)
    res.status(500).json({ error: 'Failed to get notifications' })
  }
})

router.put('/notifications/:id/read', async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { id: req.params.id, userId: (req as any).user?.id },
      data: { isRead: true, readAt: new Date() },
    })
    res.json({ message: 'Notification marked as read' })
  } catch (error) {
    console.error('Mark notification read error:', error)
    res.status(500).json({ error: 'Failed to mark notification as read' })
  }
})

router.put('/notifications/mark-all-read', async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: (req as any).user?.id, isRead: false },
      data: { isRead: true, readAt: new Date() },
    })
    res.json({ message: 'All notifications marked as read' })
  } catch (error) {
    console.error('Mark all notifications read error:', error)
    res.status(500).json({ error: 'Failed to mark all notifications as read' })
  }
})

router.put('/notifications/:id/archive', async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { id: req.params.id, userId: (req as any).user?.id },
      data: { isRead: true, readAt: new Date() },
    })
    res.json({ message: 'Notification archived' })
  } catch (error) {
    console.error('Archive notification error:', error)
    res.status(500).json({ error: 'Failed to archive notification' })
  }
})

router.delete('/notifications/:id', async (req, res) => {
  try {
    await prisma.notification.deleteMany({
      where: { id: req.params.id, userId: (req as any).user?.id },
    })
    res.json({ message: 'Notification deleted successfully' })
  } catch (error) {
    console.error('Delete notification error:', error)
    res.status(500).json({ error: 'Failed to delete notification' })
  }
})

// === SYSTEM METRICS ===
router.get('/system-metrics', async (req, res) => {
  try {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const [
      totalUsers,
      activeUsersToday,
      totalOrders,
      ordersToday,
      totalProducts,
      lowStockProducts
    ] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.user.count({
        where: {
          deletedAt: null,
          security: {
            last_login_at: { gte: today }
          }
        }
      }),
      prisma.order.count(),
      prisma.order.count({
        where: {
          createdAt: { gte: today }
        }
      }),
      prisma.product.count({ where: { deletedAt: null } }),
      prisma.product.count({
        where: {
          deletedAt: null,
          stockQuantity: { lte: 10 }
        }
      })
    ])

    res.json({
      metrics: {
        users: {
          total: totalUsers,
          activeToday: activeUsersToday
        },
        orders: {
          total: totalOrders,
          today: ordersToday
        },
        products: {
          total: totalProducts,
          lowStock: lowStockProducts
        },
        system: {
          database: 'connected',
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          nodeVersion: process.version
        }
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Get system metrics error:', error)
    res.status(500).json({ error: 'Failed to get system metrics' })
  }
})

export default router
