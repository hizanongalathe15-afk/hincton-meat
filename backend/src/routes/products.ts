import express from 'express'
import { z } from 'zod'
import multer from 'multer'
import path from 'path'
import fs from 'fs/promises'
import sharp from 'sharp'

import { prisma } from '../config/prisma'
import { authenticate, authorize } from '../middleware/auth'
import { cacheService } from '../services/cacheService'

const router = express.Router()

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, 'uploads/products/')
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) return cb(null, true)
    cb(new Error('Only image files are allowed'))
  },
})

const optimizeProductUpload = async (file: Express.Multer.File) => {
  const parsed = path.parse(file.filename)
  const webpName = `${parsed.name}.webp`
  const webpPath = path.join(path.dirname(file.path), webpName)

  await sharp(file.path)
    .rotate()
    .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 78, effort: 5 })
    .toFile(webpPath)

  await fs.unlink(file.path).catch(() => undefined)
  return `/uploads/products/${webpName}`
}

const optimizeProductUploads = async (files: Express.Multer.File[]) => {
  return Promise.all(files.map(optimizeProductUpload))
}

const slugify = (input: string) =>
  input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

const parsePageInt = (value: unknown, fallback: number) => {
  const s = typeof value === 'string' ? value : undefined
  const n = s ? parseInt(s, 10) : NaN
  return Number.isFinite(n) ? n : fallback
}

const parseCursor = (value: unknown) => {
  if (typeof value !== 'string' || !value.trim()) return null
  try {
    const parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'))
    if (parsed && typeof parsed === 'object' && typeof parsed.id === 'string') return parsed as { id: string; createdAt?: string }
  } catch {
    return null
  }
  return null
}

const encodeCursor = (product: { id: string; createdAt?: Date | string }) => {
  return Buffer.from(JSON.stringify({
    id: product.id,
    createdAt: product.createdAt instanceof Date ? product.createdAt.toISOString() : product.createdAt,
  })).toString('base64url')
}

const getProductOrderBy = (sortBy: unknown, sortOrder: unknown): any[] => {
  const direction = sortOrder === 'asc' ? 'asc' : 'desc'

  switch (sortBy) {
    case 'price':
      return [{ price: direction }, { createdAt: 'desc' }]
    case 'rating':
    case 'averageRating':
      return [{ averageRating: 'desc' }, { totalReviews: 'desc' }, { createdAt: 'desc' }]
    case 'newest':
    case 'createdAt':
      return [{ createdAt: direction }]
    case 'name':
      return [{ name: direction }]
    case 'featured':
    default:
      return [{ isFeatured: 'desc' }, { totalSold: 'desc' }, { createdAt: 'desc' }]
  }
}

const deriveRating = (reviews: Array<{ rating: number }> | undefined) => {
  const r = reviews ?? []
  const reviewCount = r.length
  const averageRating = reviewCount > 0 ? r.reduce((sum, x) => sum + x.rating, 0) / reviewCount : 0
  return { averageRating, reviewCount }
}

const defaultSearchAliases: Record<string, string[]> = {
  grilling: ['steak', 't-bone', 'rib eye', 'rump', 'choma', 'kebab', 'sausages'],
  grill: ['steak', 't-bone', 'rib eye', 'rump', 'choma', 'kebab', 'sausages'],
  stew: ['cubes', 'beef cubes', 'goat', 'brisket', 'shin', 'chuck'],
  cheap: ['mince', 'bones', 'offal', 'liver', 'matumbo'],
  broth: ['bones', 'soup', 'stock'],
  quick: ['sausages', 'mince', 'strips', 'fillet'],
  dinner: ['sausages', 'mince', 'strips', 'fillet', 'chicken'],
}

const safeJsonParse = <T = any>(value: string | undefined, fallback: T): T => {
  try {
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

const isDatabaseUnavailable = (error: unknown) => {
  const code = (error as any)?.code
  return code === 'P1001' || code === 'P2021' || code === 'P2022'
}

const expandSearchTerms = async (query: string) => {
  const terms = [query]
  try {
    const setting = await prisma.systemSetting.findUnique({ where: { key: 'search_aliases' } })
    const aliases = (setting ? { ...defaultSearchAliases, ...safeJsonParse(setting.value, {}) } : defaultSearchAliases) as Record<string, string[]>
    const lower = query.toLowerCase()
    Object.entries(aliases).forEach(([key, values]) => {
      if (lower.includes(key)) terms.push(...values)
    })
  } catch {
    Object.entries(defaultSearchAliases).forEach(([key, values]) => {
      if (query.toLowerCase().includes(key)) terms.push(...values)
    })
  }
  return Array.from(new Set(terms.filter(Boolean)))
}

const createProductSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  price: z.number().positive(),
  comparePrice: z.number().positive().optional(),
  stockQuantity: z.number().int().min(0),
  isFeatured: z.boolean().optional().default(false),
  isPublished: z.boolean().optional().default(true),
  categoryId: z.string().optional(),
})

const updateProductSchema = createProductSchema.partial()

const productInclude = {
  category: { select: { id: true, name: true, slug: true } },
  reviews: { select: { rating: true } },
  productImages: { select: { url: true } },
  productVideos: { select: { url: true, provider: true, thumbnail: true, title: true, description: true, sortOrder: true }, orderBy: { sortOrder: 'asc' as const } },
}

const serializeProduct = (product: any) => {
  const { averageRating, reviewCount } = deriveRating(product.reviews as any)
  return {
    ...product,
    images: product.productImages?.map((img: any) => img.url) ?? [],
    videos: product.productVideos?.map((video: any) => video.url) ?? [],
    productVideos: product.productVideos ?? [],
    averageRating,
    reviewCount,
  }
}

const getRecommendedProducts = async (productId?: string, limitNum = 8) => {
  const current = productId
    ? await prisma.product.findFirst({
        where: { id: productId, isPublished: true, deletedAt: null },
        select: { id: true, categoryId: true, name: true },
      })
    : null

  const productIds = new Set<string>()
  const recommended: any[] = []
  const pushProducts = (items: any[]) => {
    for (const item of items) {
      if (productIds.has(item.id) || item.id === productId) continue
      productIds.add(item.id)
      recommended.push(item)
      if (recommended.length >= limitNum) break
    }
  }

  if (current?.categoryId) {
    pushProducts(await prisma.product.findMany({
      where: { id: { not: current.id }, categoryId: current.categoryId, isPublished: true, deletedAt: null, stockQuantity: { gt: 0 } },
      take: limitNum,
      orderBy: [{ isFeatured: 'desc' }, { totalSold: 'desc' }, { averageRating: 'desc' }, { createdAt: 'desc' }],
      include: productInclude,
    }))
  }

  if (recommended.length < limitNum) {
    const boughtTogether = productId
      ? await prisma.orderItem.groupBy({
          by: ['productId'],
          where: {
            productId: { not: productId },
            order: { orderItems: { some: { productId } } },
          },
          _sum: { quantity: true },
          orderBy: { _sum: { quantity: 'desc' } },
          take: limitNum,
        })
      : []
    const ids = boughtTogether.map((item) => item.productId).filter(Boolean) as string[]
    if (ids.length) {
      const products = await prisma.product.findMany({
        where: { id: { in: ids }, isPublished: true, deletedAt: null, stockQuantity: { gt: 0 } },
        include: productInclude,
      })
      pushProducts(ids.map((id) => products.find((product) => product.id === id)).filter(Boolean))
    }
  }

  if (recommended.length < limitNum) {
    pushProducts(await prisma.product.findMany({
      where: { isPublished: true, deletedAt: null, stockQuantity: { gt: 0 }, ...(productId ? { id: { not: productId } } : {}) },
      take: limitNum,
      orderBy: [{ isFeatured: 'desc' }, { totalSold: 'desc' }, { averageRating: 'desc' }, { createdAt: 'desc' }],
      include: productInclude,
    }))
  }

  return recommended.slice(0, limitNum).map(serializeProduct)
}

const getSessionId = (req: express.Request) => {
  const header = req.header('X-Guest-Session-Id')
  if (header && header.trim().length >= 8) return header.trim()
  return `guest-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

// GET /api/products/featured
router.get('/featured', async (req, res) => {
  try {
    const { limit = '8' } = req.query
    const limitNum = parsePageInt(limit, 8)

    const products = await cacheService.remember(`products:featured:${limitNum}`, 60, async () => {
      const rows = await prisma.product.findMany({
        where: { isFeatured: true, isPublished: true, deletedAt: null, stockQuantity: { gt: 0 } },
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: productInclude,
      })
      return rows.map(serializeProduct)
    })

    res.json({ products })
  } catch (error) {
    console.error('Get featured products error:', error)
    if (isDatabaseUnavailable(error)) {
      return res.json({ products: [] })
    }
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/products/recommendations
router.get('/recommendations', async (req, res) => {
  try {
    const limitNum = parsePageInt(req.query.limit, 8)
    const productId = typeof req.query.productId === 'string' ? req.query.productId : undefined
    const products = await getRecommendedProducts(productId, limitNum)
    res.json({ products, source: productId ? 'product-context' : 'storefront' })
  } catch (error) {
    console.error('Get product recommendations error:', error)
    if (isDatabaseUnavailable(error)) return res.json({ products: [], source: 'unavailable' })
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/products/recently-viewed
router.get('/recently-viewed', async (req: any, res) => {
  try {
    const limitNum = Math.min(parsePageInt(req.query.limit, 8), 24)
    const sessionId = getSessionId(req)
    const where: any = req.user?.id
      ? { OR: [{ userId: req.user.id }, { sessionId }] }
      : { sessionId }

    const views = await prisma.productView.findMany({
      where,
      orderBy: { viewedAt: 'desc' },
      take: 100,
      select: { productId: true, viewedAt: true, duration: true },
    })

    const latestByProduct = new Map<string, { viewedAt: Date; duration?: number | null }>()
    views.forEach((view) => {
      if (!view.productId || latestByProduct.has(view.productId)) return
      latestByProduct.set(view.productId, { viewedAt: view.viewedAt, duration: view.duration })
    })

    const ids = Array.from(latestByProduct.keys()).slice(0, limitNum)
    const products = ids.length
      ? await prisma.product.findMany({
          where: { id: { in: ids }, isPublished: true, deletedAt: null },
          include: productInclude,
        })
      : []

    const byId = new Map(products.map((product) => [product.id, product]))
    res.json({
      products: ids
        .map((id) => {
          const product = byId.get(id)
          if (!product) return null
          const meta = latestByProduct.get(id)
          return {
            ...serializeProduct(product),
            viewedAt: meta?.viewedAt.toISOString(),
            viewDuration: meta?.duration || null,
          }
        })
        .filter(Boolean),
    })
  } catch (error) {
    console.error('Get recently viewed products error:', error)
    if (isDatabaseUnavailable(error)) return res.json({ products: [] })
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const { page = '1', limit = '20', cursor, category, categoryId, minPrice, maxPrice, search, sortBy = 'featured', sortOrder = 'desc' } = req.query

    const pageNum = parsePageInt(page, 1)
    const limitNum = parsePageInt(limit, 20)
    const safeLimit = Math.min(Math.max(limitNum, 1), 60)
    const parsedCursor = parseCursor(cursor)
    const orderBy = getProductOrderBy(sortBy, sortOrder)
    const useCursor = Boolean(parsedCursor || cursor === undefined || cursor === '')

    const where: any = { isPublished: true, deletedAt: null }
    const andFilters: any[] = []
    if (categoryId) where.categoryId = String(categoryId)
    if (category) {
      const categoryValue = String(category)
      andFilters.push({
        OR: [
        { categoryId: categoryValue },
        { category: { is: { slug: categoryValue } } },
        { category: { is: { name: { equals: categoryValue, mode: 'insensitive' } } } },
        ],
      })
    }
    if (minPrice || maxPrice) {
      where.price = {}
      if (minPrice) where.price.gte = parseFloat(String(minPrice))
      if (maxPrice) where.price.lte = parseFloat(String(maxPrice))
    }
    if (search) {
      const s = String(search)
      const searchTerms = await expandSearchTerms(s)
      andFilters.push({
        OR: searchTerms.flatMap((term) => [
          { name: { contains: term, mode: 'insensitive' } },
          { description: { contains: term, mode: 'insensitive' } },
          { shortDescription: { contains: term, mode: 'insensitive' } },
          { slug: { contains: term, mode: 'insensitive' } },
          { sku: { contains: term, mode: 'insensitive' } },
          { brand: { contains: term, mode: 'insensitive' } },
          { metaKeywords: { contains: term, mode: 'insensitive' } },
          { category: { is: { name: { contains: term, mode: 'insensitive' } } } },
          { category: { is: { slug: { contains: term, mode: 'insensitive' } } } },
        ]),
      })
    }
    if (andFilters.length) where.AND = andFilters

    const cacheKey = `products:list:${JSON.stringify({ limit: safeLimit, cursor: parsedCursor, category, categoryId, minPrice, maxPrice, search, sortBy, sortOrder, useCursor })}`
    const payload = await cacheService.remember(cacheKey, 45, async () => {
      const [rows, total] = await Promise.all([
        prisma.product.findMany({
          where,
          ...(parsedCursor ? { cursor: { id: parsedCursor.id }, skip: 1 } : useCursor ? {} : { skip: (pageNum - 1) * safeLimit }),
          take: safeLimit + 1,
          orderBy,
          include: productInclude,
        }),
        prisma.product.count({ where }),
      ])
      const hasMore = rows.length > safeLimit
      const products = rows.slice(0, safeLimit).map(serializeProduct)
      const last = rows[Math.min(rows.length, safeLimit) - 1]
      return {
        products,
        pagination: {
          page: pageNum,
          limit: safeLimit,
          total,
          pages: Math.ceil(total / safeLimit),
          hasMore,
          nextCursor: hasMore && last ? encodeCursor(last) : null,
          mode: useCursor ? 'cursor' : 'offset',
        },
      }
    })

    res.json(payload)
  } catch (error) {
    console.error('Get products error:', error)
    if (isDatabaseUnavailable(error)) {
      const pageNum = parsePageInt(req.query.page, 1)
      const limitNum = parsePageInt(req.query.limit, 20)
      return res.json({
        products: [],
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: 0,
          pages: 0,
        },
      })
    }
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        ...productInclude,
        reviews: { select: { rating: true, title: true, comment: true, createdAt: true, userId: true } },
      },
    })

    if (!product) return res.status(404).json({ error: 'Product not found' })

    const serialized = await cacheService.remember(`products:detail:${id}`, 60, async () => serializeProduct(product))
    res.json(serialized)
  } catch (error) {
    console.error('Get product error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/products/:id/view
router.post('/:id/view', async (req, res) => {
  try {
    const { id } = req.params
    const exists = await prisma.product.findFirst({
      where: { id, isPublished: true, deletedAt: null },
      select: { id: true },
    })
    if (!exists) return res.status(404).json({ error: 'Product not found' })

    const sessionId = String(req.body?.sessionId || getSessionId(req))
    const duration = Number.isFinite(Number(req.body?.duration)) ? Number(req.body.duration) : undefined
    await prisma.productView.create({
      data: {
        productId: id,
        userId: (req as any).user?.id,
        sessionId,
        duration,
      },
    })

    res.status(201).json({ success: true })
  } catch (error) {
    console.error('Track product view error:', error)
    res.status(500).json({ error: 'Failed to track product view' })
  }
})

// POST /api/products (Admin)
router.post('/', authenticate, authorize('ADMIN'), upload.array('images', 5), async (req, res) => {
  try {
    const productData = createProductSchema.parse(req.body)
    const files = (req.files ?? []) as Express.Multer.File[]
    const imageUrls = await optimizeProductUploads(files)

    const created = await prisma.product.create({
      data: {
        name: productData.name,
        slug: slugify(productData.name),
        description: productData.description,
        shortDescription: productData.shortDescription,
        price: productData.price as any,
        comparePrice: productData.comparePrice as any,
        stockQuantity: productData.stockQuantity,
        isFeatured: productData.isFeatured ?? false,
        isPublished: productData.isPublished ?? true,
        sku: `SKU-${Date.now()}`,

        // In this Prisma schema, Product.categoryId is optional; but strict Prisma types sometimes
        // infer it as `never` depending on relation usage. Use an unchecked create field via `as any`.



        productImages: { create: imageUrls.map((url) => ({ url })) as any },
      },

      include: { reviews: { select: { rating: true } }, productImages: { select: { url: true } } },
    })

    const { averageRating, reviewCount } = deriveRating((created as any).reviews)
    await cacheService.deleteByPrefix('products:')

    res.status(201).json({
      message: 'Product created successfully',
      product: {
        ...created,
      images: (created as any).productImages?.map((img: any) => img.url) ?? [] ,
        averageRating,
        reviewCount,
      },
    })
  } catch (error) {
    console.error('Create product error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PUT /api/products/:id (Admin)
router.put('/:id', authenticate, authorize('ADMIN'), upload.array('images', 5), async (req, res) => {
  try {
    const { id } = req.params
    const updateData = updateProductSchema.parse(req.body)
    const files = (req.files ?? []) as Express.Multer.File[]
    const imageUrls = await optimizeProductUploads(files)

    const existing = await prisma.product.findUnique({ where: { id } })
    if (!existing) return res.status(404).json({ error: 'Product not found' })

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name: updateData.name,
        slug: updateData.name ? slugify(updateData.name) : undefined,
        description: updateData.description,
        shortDescription: updateData.shortDescription,
        price: updateData.price as any,
        comparePrice: updateData.comparePrice as any,
        stockQuantity: updateData.stockQuantity,
        isFeatured: updateData.isFeatured,
        isPublished: updateData.isPublished,
        categoryId: updateData.categoryId,
        ...(imageUrls.length
          ? { productImages: { create: imageUrls.map((url) => ({ url })) } }
          : {}),
      },
      include: { reviews: { select: { rating: true } }, productImages: { select: { url: true } } },
    })

    const { averageRating, reviewCount } = deriveRating((updated as any).reviews)
    await cacheService.deleteByPrefix('products:')


    res.json({
      message: 'Product updated successfully',
      product: {
        ...updated,
        images: (updated as any).productImages?.map((img: any) => img.url) ?? [] ,
        averageRating,
        reviewCount,
      },
    })
  } catch (error) {
    console.error('Update product error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// DELETE /api/products/:id (Admin)
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params
    const existing = await prisma.product.findFirst({ where: { id, deletedAt: null } })
    if (!existing) return res.status(404).json({ error: 'Product not found' })

    await prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), isPublished: false },
    })
    await cacheService.deleteByPrefix('products:')

    res.json({ message: 'Product deleted successfully' })
  } catch (error) {
    console.error('Delete product error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/products/featured/list
router.get('/featured/list', async (req, res) => {
  try {
    const { limit = '8' } = req.query
    const limitNum = parsePageInt(limit, 8)

    const products = await prisma.product.findMany({
      where: { isFeatured: true, stockQuantity: { gt: 0 } },
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      include: {
        reviews: { select: { rating: true } },
        productImages: { select: { url: true } },
      },
    })

    const productsWithDerived = products.map((product) => {
      const { averageRating, reviewCount } = deriveRating(product.reviews as any)
      return {
        ...product,
        images: product.productImages.map((img) => img.url),
        averageRating,
        reviewCount,
      }
    })

    res.json({ products: productsWithDerived })
  } catch (error) {
    console.error('Get featured products error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
