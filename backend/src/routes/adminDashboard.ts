import express from 'express'
import { prisma } from '../config/prisma'
import { z } from 'zod'
import type { AuthRequest } from '../middleware/auth'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { uploadImage } from '../config/cloudinary'
import { notifyOrderCustomer, notifyRecipients } from '../utils/notificationService'

const router = express.Router()
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

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) return cb(null, true)
    cb(new Error('Only image, GIF, sticker, or video files are allowed'))
  },
})

const slugify = (input: string) =>
  input.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

const toBool = (value: unknown, fallback = false) => {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') return value === 'true'
  return fallback
}

const storeUploadedImages = async (files: Express.Multer.File[], folder = 'hincton/products') => {
  const urls: string[] = []

  for (const file of files) {
    try {
      const uploaded = await uploadImage(file.buffer, folder)
      urls.push(uploaded.url)
    } catch (error) {
      const filename = `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`
      ensureDirectory(productUploadPath)
      const localPath = path.join(productUploadPath, filename)
      try {
        fs.writeFileSync(localPath, file.buffer)
        urls.push(`/${localPath.replace(/\\/g, '/')}`)
      } catch (writeError) {
        console.warn(`Unable to write fallback local image ${localPath}:`, writeError)
      }
    }
  }

  return urls
}

const storeUploadedMedia = async (files: Express.Multer.File[], folder = 'hincton/products') => {
  const urls: string[] = []

  for (const file of files) {
    try {
      const uploaded = await uploadImage(file.buffer, folder)
      urls.push(uploaded.url)
    } catch (error) {
      const filename = `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`
      ensureDirectory(productUploadPath)
      const localPath = path.join(productUploadPath, filename)
      try {
        fs.writeFileSync(localPath, file.buffer)
        urls.push(`/${localPath.replace(/\\/g, '/')}`)
      } catch (writeError) {
        console.warn(`Unable to write fallback local media ${localPath}:`, writeError)
      }
    }
  }

  return urls
}

const statusLocation = (status: string) => {
  if (status === 'OUT_FOR_DELIVERY') return 'Delivery route'
  if (status === 'SHIPPED') return 'Dispatch'
  if (status === 'DELIVERED') return 'Customer location'
  if (status === 'PROCESSING') return 'Hincton Meat Products preparation'
  return 'Hincton Meat Products'
}

const statusDescription = (status: string) => {
  if (status === 'OUT_FOR_DELIVERY') return 'The order is with the rider and heading to the customer.'
  if (status === 'SHIPPED') return 'The order has left dispatch.'
  if (status === 'DELIVERED') return 'The order was delivered successfully.'
  if (status === 'PROCESSING') return 'The order is being prepared and packed.'
  if (status === 'CONFIRMED') return 'The order has been confirmed.'
  return `Order status changed to ${status.replace(/_/g, ' ').toLowerCase()}.`
}

const notifyAdmins = async (title: string, message: string, data?: Record<string, unknown>) => {
  const admins = await prisma.user.findMany({
    where: { roles: { has: 'ADMIN' } as any },
    select: { id: true, email: true, phone: true },
  })

  return notifyRecipients({
    type: 'SYSTEM',
    title,
    message,
    actionUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/dashboard`,
    data,
    channels: ['inApp', 'email'],
    recipients: admins,
  })
}

const maybeNotifyLowStock = async (product: any) => {
  const threshold = Number(product.lowStockThreshold || 5)
  const stock = Number(product.stockQuantity || 0)
  if (stock > threshold) return

  await notifyAdmins(
    `Low stock: ${product.name}`,
    `${product.name} is at ${stock} ${product.weightUnit || 'units'} left. Threshold is ${threshold}.`,
    { productId: product.id, stockQuantity: stock, lowStockThreshold: threshold }
  )
}


// Middleware to check admin permissions
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
      totalUsers,
      newCustomers,
      recentOrders
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

      prisma.user.count({ where: { deletedAt: null } }),
      
      // New customers this month
      prisma.user.count({
        where: { createdAt: { gte: monthAgo } }
      }),
      
      // Recent orders
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { email: true, username: true } }
        }
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
          products: 0,
          users: 0
        }
      },
      topProducts: topProductsWithDetails,
      lowStockProducts,
      recentOrders,
      generatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    res.status(500).json({ error: 'Failed to load dashboard data' })
  }
})

// === ORDER MANAGEMENT ===
router.get('/orders', async (req, res) => {
  try {
    const { page = '1', limit = '20', status, search, dateFrom, dateTo } = req.query
    const pageNum = Math.max(1, parseInt(String(page), 10) || 1)
    const limitNum = Math.max(1, parseInt(String(limit), 10) || 20)
    const skip = (pageNum - 1) * limitNum

    const where: any = {}
    
    if (status) where.status = status
    if (search) {
      where.OR = [
        { orderNumber: { contains: String(search), mode: 'insensitive' } },
        { user: { email: { contains: String(search), mode: 'insensitive' } } },
        { guestEmail: { contains: String(search), mode: 'insensitive' } }
      ]
    }
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = new Date(String(dateFrom))
      if (dateTo) where.createdAt.lte = new Date(String(dateTo))
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, email: true, username: true } },
          orderItems: {
            include: {
              product: { select: { id: true, name: true, price: true } }
            }
          }
        }
      }),
      prisma.order.count({ where })
    ])

    res.json({
      orders,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) }
    })
  } catch (error) {
    console.error('Get orders error:', error)
    res.status(500).json({ error: 'Failed to get orders' })
  }
})

router.get('/orders/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: { 
          select: { 
            id: true, email: true, username: true,
            profile: { select: { firstName: true, lastName: true, mpesaPhone: true } }
          } 
        },
        orderItems: {
          include: {
            product: { select: { id: true, name: true, price: true, productImages: { select: { url: true } } } },
            variant: { select: { id: true, name: true } }
          }
        },
        payments: true,
        returnRequests: true
      }
    })

    if (!order) return res.status(404).json({ error: 'Order not found' })

    res.json({ order })
  } catch (error) {
    console.error('Get order error:', error)
    res.status(500).json({ error: 'Failed to get order' })
  }
})

router.put('/orders/:id/status', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const { status, notes, trackingNumber, courier } = z.object({
      status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REFUNDED']),
      notes: z.string().optional(),
      trackingNumber: z.string().optional(),
      courier: z.string().optional()
    }).parse(req.body)

    const order = await prisma.order.update({
      where: { id },
      data: {
        status,
        deliveryStatus: status === 'OUT_FOR_DELIVERY' ? 'OUT_FOR_DELIVERY' : status === 'DELIVERED' ? 'DELIVERED' : status === 'SHIPPED' ? 'IN_TRANSIT' : undefined,
        notes,
        trackingNumber,
        courier,
        ...(status === 'DELIVERED' && { deliveredAt: new Date() }),
        ...(status === 'CANCELLED' && { cancelledAt: new Date() }),
        ...(status === 'REFUNDED' && { refundedAt: new Date() })
      },
      include: {
        user: { select: { id: true, email: true, phone: true } },
      },
    })

    // Create status history entry
    await prisma.orderStatusHistory.create({
      data: {
        orderId: id,
        status,
        notes,
        createdBy: req.user!.id
      }
    })

    await prisma.trackingHistory.create({
      data: {
        orderId: id,
        trackingNumber: trackingNumber || order.trackingNumber || order.orderNumber,
        status,
        location: statusLocation(status),
        description: notes || statusDescription(status),
        rawData: { courier: courier || order.courier || null },
      },
    })

    notifyOrderCustomer(
      order,
      `Order update ${order.orderNumber}`,
      notes || statusDescription(status),
      ['inApp', 'email', 'sms', 'whatsapp']
    ).catch((error) => console.error('Order status notification error:', error))

    res.json({ message: 'Order status updated', order })
  } catch (error) {
    console.error('Update order status error:', error)
    res.status(500).json({ error: 'Failed to update order status' })
  }
})

// === PRODUCT MANAGEMENT ===
router.get('/products', async (req, res) => {
  try {
    const { page = '1', limit = '20', search, category, status } = req.query
    const pageNum = Math.max(1, parseInt(String(page), 10) || 1)
    const limitNum = Math.max(1, parseInt(String(limit), 10) || 20)
    const skip = (pageNum - 1) * limitNum

    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { description: { contains: String(search), mode: 'insensitive' } },
        { sku: { contains: String(search), mode: 'insensitive' } }
      ]
    }
    if (category) where.categoryId = category
    if (status === 'published') where.isPublished = true
    if (status === 'draft') where.isPublished = false

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          category: { select: { id: true, name: true } },
          productImages: { select: { id: true, url: true, alt: true } },
          productVideos: { select: { id: true, url: true, provider: true, thumbnail: true, title: true, sortOrder: true }, orderBy: { sortOrder: 'asc' } },
          _count: { select: { orderItems: true } }
        }
      }),
      prisma.product.count({ where })
    ])

    res.json({
      products,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) }
    })
  } catch (error) {
    console.error('Get products error:', error)
    res.status(500).json({ error: 'Failed to get products' })
  }
})

router.get('/products/:id', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: {
        category: true,
        productImages: true,
        productVideos: true,
        _count: { select: { orderItems: true } },
      },
    })
    if (!product) return res.status(404).json({ error: 'Product not found' })
    res.json({ product })
  } catch (error) {
    console.error('Get product error:', error)
    res.status(500).json({ error: 'Failed to get product' })
  }
})

router.post('/products', upload.fields([{ name: 'images', maxCount: 8 }, { name: 'videos', maxCount: 4 }]), async (req, res) => {
  try {
    const productData = z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      price: z.coerce.number().positive(),
      comparePrice: z.coerce.number().positive().optional(),
      sku: z.string().optional(),
      stockQuantity: z.coerce.number().int().default(0),
      categoryId: z.string().optional(),
      isPublished: z.preprocess((v) => toBool(v, false), z.boolean()).default(false),
      isFeatured: z.preprocess((v) => toBool(v, false), z.boolean()).default(false),
      weight: z.coerce.number().optional(),
      unit: z.string().optional(),
    }).parse(req.body)

    const uploadedFiles = (req.files ?? {}) as Record<string, Express.Multer.File[]>
    const imageUrls = await storeUploadedImages(uploadedFiles.images || [])
    const videoUrls = await storeUploadedMedia(uploadedFiles.videos || [], 'hincton/products/videos')
    const sku = productData.sku?.trim() || `HMP-${Date.now()}`

    const product = await prisma.product.create({
      data: {
        name: productData.name,
        slug: `${slugify(productData.name)}-${Date.now()}`,
        description: productData.description,
        price: productData.price as any,
        comparePrice: productData.comparePrice as any,
        sku,
        stockQuantity: productData.stockQuantity,
        categoryId: productData.categoryId || undefined,
        isPublished: productData.isPublished,
        isFeatured: productData.isFeatured,
        weight: productData.weight,
        weightUnit: productData.unit,
        brand: undefined,
        productImages: { create: imageUrls.map((url, index) => ({ url, sortOrder: index, isPrimary: index === 0 })) },
        productVideos: { create: videoUrls.map((url, index) => ({ url, provider: 'upload', sortOrder: index, title: productData.name })) },
      } as any,
      include: {
        category: true,
        productImages: true,
        productVideos: true
      }
    })

    maybeNotifyLowStock(product).catch((error) => console.error('Low stock notification error:', error))

    res.status(201).json({ message: 'Product created', product })
  } catch (error) {
    console.error('Create product error:', error)
    res.status(500).json({ error: 'Failed to create product' })
  }
})

router.put('/products/:id', upload.fields([{ name: 'images', maxCount: 8 }, { name: 'videos', maxCount: 4 }]), async (req, res) => {
  try {
    const { id } = req.params
    const productData = z.object({
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      price: z.coerce.number().positive().optional(),
      comparePrice: z.coerce.number().positive().optional(),
      sku: z.string().optional(),
      stockQuantity: z.coerce.number().int().optional(),
      categoryId: z.string().optional(),
      isPublished: z.preprocess((v) => v === undefined ? undefined : toBool(v), z.boolean().optional()),
      isFeatured: z.preprocess((v) => v === undefined ? undefined : toBool(v), z.boolean().optional()),
      weight: z.coerce.number().optional(),
      unit: z.string().optional(),
      existingImages: z.string().optional(),
      existingVideos: z.string().optional(),
    }).parse(req.body)

    const uploadedFiles = (req.files ?? {}) as Record<string, Express.Multer.File[]>
    const imageUrls = await storeUploadedImages(uploadedFiles.images || [])
    const videoUrls = await storeUploadedMedia(uploadedFiles.videos || [], 'hincton/products/videos')
    const existingImages = productData.existingImages ? JSON.parse(productData.existingImages) as string[] : undefined
    const existingVideos = productData.existingVideos ? JSON.parse(productData.existingVideos) as string[] : undefined

    if (existingImages) {
      await prisma.productImage.deleteMany({ where: { productId: id, url: { notIn: existingImages } } })
    }
    if (existingVideos) {
      await prisma.productVideo.deleteMany({ where: { productId: id, url: { notIn: existingVideos } } })
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        name: productData.name,
        slug: productData.name ? `${slugify(productData.name)}-${Date.now()}` : undefined,
        description: productData.description,
        price: productData.price as any,
        comparePrice: productData.comparePrice as any,
        sku: productData.sku,
        stockQuantity: productData.stockQuantity,
        categoryId: productData.categoryId || undefined,
        isPublished: productData.isPublished,
        isFeatured: productData.isFeatured,
        weight: productData.weight,
        weightUnit: productData.unit,
        ...(imageUrls.length ? { productImages: { create: imageUrls.map((url, index) => ({ url, sortOrder: index, isPrimary: index === 0 && !existingImages?.length })) } } : {}),
        ...(videoUrls.length ? { productVideos: { create: videoUrls.map((url, index) => ({ url, provider: 'upload', sortOrder: index + (existingVideos?.length || 0), title: productData.name })) } } : {}),
      } as any,
      include: {
        category: true,
        productImages: true,
        productVideos: true
      }
    })

    maybeNotifyLowStock(product).catch((error) => console.error('Low stock notification error:', error))

    res.json({ message: 'Product updated', product })
  } catch (error) {
    console.error('Update product error:', error)
    res.status(500).json({ error: 'Failed to update product' })
  }
})

router.delete('/products/:id', async (req, res) => {
  try {
    await prisma.product.delete({ where: { id: req.params.id } })
    res.json({ message: 'Product deleted' })
  } catch (error) {
    console.error('Delete product error:', error)
    res.status(500).json({ error: 'Failed to delete product' })
  }
})

// === CUSTOMER MANAGEMENT ===
router.get('/customers', async (req, res) => {
  try {
    const { page = '1', limit = '20', search } = req.query
    const pageNum = Math.max(1, parseInt(String(page), 10) || 1)
    const limitNum = Math.max(1, parseInt(String(limit), 10) || 20)
    const skip = (pageNum - 1) * limitNum

    const where: any = {}
    
    if (search) {
      where.OR = [
        { email: { contains: String(search), mode: 'insensitive' } },
        { username: { contains: String(search), mode: 'insensitive' } },
        { profile: { 
          OR: [
            { firstName: { contains: String(search), mode: 'insensitive' } },
            { lastName: { contains: String(search), mode: 'insensitive' } }
          ]
        }}
      ]
    }

    const [customers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          username: true,
          createdAt: true,
          profile: {
            select: {
              firstName: true,
              lastName: true,
              mpesaPhone: true
            }
          },
          _count: {
            select: {
              orders: true
            }
          }
        }
      }),
      prisma.user.count({ where })
    ])

    // Get total spent for each customer
    const customerIds = customers.map(c => c.id)
    const orderTotals = await prisma.order.groupBy({
      by: ['userId'],
      where: { 
        userId: { in: customerIds },
        status: { not: 'CANCELLED' }
      },
      _sum: { totalAmount: true }
    })

    const customersWithSpending = customers.map(customer => {
      const orderTotal = orderTotals.find(ot => ot.userId === customer.id)
      return {
        ...customer,
        totalSpent: orderTotal?._sum.totalAmount || 0
      }
    })

    res.json({
      customers: customersWithSpending,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) }
    })
  } catch (error) {
    console.error('Get customers error:', error)
    res.status(500).json({ error: 'Failed to get customers' })
  }
})

router.get('/customers/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    const customer = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true,
        profile: true,
        addresses: true,
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true,
            status: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            orders: true,
            reviews: true,
            returnRequests: true
          }
        }
      }
    })

    if (!customer) return res.status(404).json({ error: 'Customer not found' })

    // Get total spent
    const totalSpent = await prisma.order.aggregate({
      where: { 
        userId: id,
        status: { not: 'CANCELLED' }
      },
      _sum: { totalAmount: true }
    })

    res.json({ 
      customer: {
        ...customer,
        totalSpent: totalSpent._sum.totalAmount || 0
      }
    })
  } catch (error) {
    console.error('Get customer error:', error)
    res.status(500).json({ error: 'Failed to get customer' })
  }
})

// === ANALYTICS & REPORTS ===
router.get('/analytics/sales', async (req, res) => {
  try {
    const { period = '30' } = req.query
    const days = Math.max(1, parseInt(String(period), 10) || 30)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const salesData = await prisma.order.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: { gte: startDate },
        status: { not: 'CANCELLED' }
      },
      _sum: { totalAmount: true },
      _count: true
    })

    // Group by date
    const dailySales = salesData.reduce((acc: any, sale) => {
      const date = sale.createdAt.toISOString().split('T')[0]
      if (!acc[date]) {
        acc[date] = { date, revenue: 0, orders: 0 }
      }
      acc[date].revenue += Number(sale._sum.totalAmount || 0)
      acc[date].orders += sale._count
      return acc
    }, {})

    res.json({ salesData: Object.values(dailySales) })
  } catch (error) {
    console.error('Sales analytics error:', error)
    res.status(500).json({ error: 'Failed to get sales analytics' })
  }
})

router.get('/analytics/products', async (req, res) => {
  try {
    const topProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 10
    })

    const productIds = topProducts.map(p => p.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, price: true }
    })

    const topProductsWithDetails = topProducts.map(p => {
      const product = products.find(pr => pr.id === p.productId)
      return {
        ...p,
        product
      }
    })

    res.json({ topProducts: topProductsWithDetails })
  } catch (error) {
    console.error('Product analytics error:', error)
    res.status(500).json({ error: 'Failed to get product analytics' })
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

    const where: any = {}
    if (showUnreadOnly) {
      where.isRead = false
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        }
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { isRead: false } })
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
    const { id } = req.params
    
    const notification = await prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() }
    })

    res.json({ message: 'Notification marked as read', notification })
  } catch (error) {
    console.error('Mark notification read error:', error)
    res.status(500).json({ error: 'Failed to mark notification as read' })
  }
})

router.put('/notifications/mark-all-read', async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { isRead: false },
      data: { isRead: true, readAt: new Date() }
    })

    res.json({ message: 'All notifications marked as read' })
  } catch (error) {
    console.error('Mark all notifications read error:', error)
    res.status(500).json({ error: 'Failed to mark all notifications as read' })
  }
})

router.delete('/notifications/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    await prisma.notification.delete({
      where: { id }
    })

    res.json({ message: 'Notification deleted successfully' })
  } catch (error) {
    console.error('Delete notification error:', error)
    res.status(500).json({ error: 'Failed to delete notification' })
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

    res.json({
      users,
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

// === CONTENT MANAGEMENT ===
router.get('/content/banners', async (req, res) => {
  try {
    const banners = await prisma.banner?.findMany({
      orderBy: { sortOrder: 'asc' }
    }) || []

    res.json({ banners })
  } catch (error) {
    console.error('Get banners error:', error)
    res.status(500).json({ error: 'Failed to get banners' })
  }
})

router.post('/content/banners', async (req, res) => {
  try {
    const bannerData = z.object({
      title: z.string(),
      subtitle: z.string().optional(),
      imageUrl: z.string().url(),
      linkUrl: z.string().url().optional(),
      isActive: z.boolean().default(true),
      sortOrder: z.number().default(0)
    }).parse(req.body)

    const banner = await prisma.banner?.create({
      data: bannerData
    })

    res.json({ message: 'Banner created successfully', banner })
  } catch (error) {
    console.error('Create banner error:', error)
    res.status(500).json({ error: 'Failed to create banner' })
  }
})

router.put('/content/banners/:id', async (req, res) => {
  try {
    const { id } = req.params
    const bannerData = z.object({
      title: z.string().optional(),
      subtitle: z.string().optional(),
      imageUrl: z.string().url().optional(),
      linkUrl: z.string().url().optional(),
      isActive: z.boolean().optional(),
      sortOrder: z.number().optional()
    }).parse(req.body)

    const banner = await prisma.banner?.update({
      where: { id },
      data: bannerData
    })

    res.json({ message: 'Banner updated successfully', banner })
  } catch (error) {
    console.error('Update banner error:', error)
    res.status(500).json({ error: 'Failed to update banner' })
  }
})

router.delete('/content/banners/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    await prisma.banner?.delete({
      where: { id }
    })

    res.json({ message: 'Banner deleted successfully' })
  } catch (error) {
    console.error('Delete banner error:', error)
    res.status(500).json({ error: 'Failed to delete banner' })
  }
})

// === QR CODE MANAGEMENT ===
router.get('/qr-codes', async (req, res) => {
  try {
    const qrCodes = await prisma.qrCode?.findMany({
      orderBy: { createdAt: 'desc' }
    }) || []

    res.json({ qrCodes })
  } catch (error) {
    console.error('Get QR codes error:', error)
    res.status(500).json({ error: 'Failed to get QR codes' })
  }
})

router.post('/qr-codes', async (req, res) => {
  try {
    const qrData = z.object({
      name: z.string(),
      type: z.enum(['PRODUCT', 'ORDER', 'URL', 'CUSTOM']),
      referenceId: z.string().optional(),
      url: z.string().url().optional(),
      description: z.string().optional(),
      discountCode: z.string().optional(),
      welcomeTitle: z.string().optional(),
      welcomeMessage: z.string().optional(),
      welcomeColor: z.string().optional(),
      autoRedirect: z.boolean().optional(),
      redirectDelay: z.number().optional(),
      imageUrl: z.string().optional(),
      data: z.any().optional(),
      isActive: z.boolean().default(true)
    }).parse(req.body)

    // Generate QR code (simplified - in production you'd use a QR library)
    const qrCode = await prisma.qrCode?.create({
      data: {
        name: qrData.name,
        code: `https://hincton.meat/${qrData.type.toLowerCase()}/${qrData.referenceId || qrData.url}`,
        description: qrData.description,
        targetUrl: qrData.url || '/',
        discountCode: qrData.discountCode,
        welcomeTitle: qrData.welcomeTitle,
        welcomeMessage: qrData.welcomeMessage,
        welcomeColor: qrData.welcomeColor,
        autoRedirect: qrData.autoRedirect,
        redirectDelay: qrData.redirectDelay,
        imageUrl: qrData.imageUrl,
        isActive: qrData.isActive
      }
    })

    res.json({ message: 'QR code created successfully', qrCode })
  } catch (error) {
    console.error('Create QR code error:', error)
    res.status(500).json({ error: 'Failed to create QR code' })
  }
})

// === SYSTEM METRICS ===
router.get('/system-metrics', async (req, res) => {
  try {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

    const [
      totalUsers,
      activeUsersToday,
      totalOrders,
      ordersToday,
      totalProducts,
      lowStockProducts,
      systemHealth
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
      }),
      {
        database: 'connected',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version
      }
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
        system: systemHealth
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Get system metrics error:', error)
    res.status(500).json({ error: 'Failed to get system metrics' })
  }
})

export default router
