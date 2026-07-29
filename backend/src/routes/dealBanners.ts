import express from 'express'
import { prisma } from '../config/prisma'
import { z } from 'zod'

const router = express.Router()

const isAdmin = (req: any) => (req.user?.roles || []).some((role: string) => ['ADMIN', 'SUPER_ADMIN'].includes(role))

const createDealBannerSchema = z.object({
  title: z.string().min(2).max(120),
  subtitle: z.string().max(255).optional(),
  bannerColor: z.string().default('#FF5500'),
  textColor: z.string().default('#FFFFFF'),
  bannerImage: z.string().optional().or(z.literal('')),
  productIds: z.array(z.string()).optional(),
  categoryId: z.string().optional(),
  flashSaleId: z.string().optional(),
  seeAllUrl: z.string().optional(),
  seeAllLabel: z.string().default('See All'),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

const productInclude = {
  include: {
    productImages: {
      orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }] as any,
      take: 1,
    },
    category: true,
  },
}

const serializeProduct = (product: any, flashSaleOverride?: any) => {
  const comparePrice = Number(product.comparePrice || 0)
  const basePrice = Number(product.price)
  const overridePrice = flashSaleOverride ? Number(flashSaleOverride.salePrice) : null
  const price = overridePrice ?? basePrice
  const originalPriceRaw = flashSaleOverride
    ? Number(flashSaleOverride.originalPrice)
    : comparePrice > basePrice
    ? comparePrice
    : null
  const originalPrice = originalPriceRaw && originalPriceRaw > price ? originalPriceRaw : null
  const discountPercentage = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0
  const remaining = flashSaleOverride
    ? Math.max(0, Math.min(Number(flashSaleOverride.stockAllocated - flashSaleOverride.stockSold), Number(product.stockQuantity || 0)))
    : Number(product.stockQuantity || 0)
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    shortDescription: product.shortDescription,
    price,
    originalPrice,
    discountPercentage,
    isOnSale: product.isOnSale || !!originalPrice,
    stockQuantity: remaining,
    lowStockThreshold: product.lowStockThreshold,
    inStock: product.stockStatus !== 'out_of_stock' && remaining > 0,
    rating: product.averageRating || 0,
    reviews: product.totalReviews || 0,
    totalSold: product.totalSold || 0,
    category: product.category?.name || '',
    categoryId: product.category?.id,
    categorySlug: product.category?.slug,
    weight: product.weight,
    weightUnit: product.weightUnit,
    unit: product.weightUnit,
    image: product.productImages?.[0]?.url || '',
    images: (product.productImages || []).map((img: any) => img.url),
    flashSaleStockRemaining: flashSaleOverride ? remaining : null,
    flashSaleStockAllocated: flashSaleOverride ? Number(flashSaleOverride.stockAllocated || 0) : null,
    flashSaleStockSold: flashSaleOverride ? Number(flashSaleOverride.stockSold || 0) : null,
    weightValue: product.weight,
    sku: product.sku,
    description: product.description,
  }
}

const buildActiveBannerWhere = (now = new Date()) => ({
  isActive: true,
  OR: [
    { startDate: null, endDate: null },
    { startDate: null, endDate: { gte: now } },
    { startDate: { lte: now }, endDate: null },
    { startDate: { lte: now }, endDate: { gte: now } },
  ],
})

const attachProductsForBanners = async (banners: any[]) => {
  const now = new Date()
  const activeFlashSales = await prisma.flashSale.findMany({
    where: { status: 'active', startTime: { lte: now }, endTime: { gt: now } },
    include: { products: true },
  })
  const flashPriceMap = new Map<string, any>()
  for (const sale of activeFlashSales) {
    for (const fp of sale.products) {
      flashPriceMap.set(`${sale.id}:${fp.productId}`, fp)
      flashPriceMap.set(`product:${fp.productId}`, fp)
    }
  }

  return Promise.all(
    banners.map(async (banner: any) => {
      let products: any[] = []
      const parsedProductIds: string[] = banner.productIds
        ? (() => {
            try {
              return JSON.parse(banner.productIds)
            } catch {
              return []
            }
          })()
        : []

      if (banner.flashSaleId) {
        const flashSale = activeFlashSales.find((s) => s.id === banner.flashSaleId)
        if (flashSale) {
          const saleProducts = await prisma.product.findMany({
            where: { id: { in: flashSale.products.map((p) => p.productId) }, isPublished: true, deletedAt: null },
            ...productInclude,
          })
          products = saleProducts.map((p) => {
            const override = flashSale.products.find((fp) => fp.productId === p.id)
            return serializeProduct(p, override)
          })
        }
      } else if (parsedProductIds.length > 0) {
        const raw = await prisma.product.findMany({
          where: { id: { in: parsedProductIds }, isPublished: true, deletedAt: null },
          ...productInclude,
        })
        const idOrder = new Map(parsedProductIds.map((id, idx) => [id, idx]))
        raw.sort((a, b) => (idOrder.get(a.id) ?? 9999) - (idOrder.get(b.id) ?? 9999))
        products = raw.map((p) => serializeProduct(p, flashPriceMap.get(`product:${p.id}`)))
      } else if (banner.categoryId) {
        const raw = await prisma.product.findMany({
          where: { categoryId: banner.categoryId, isPublished: true, deletedAt: null },
          take: 20,
          orderBy: { totalSold: 'desc' },
          ...productInclude,
        })
        products = raw.map((p) => serializeProduct(p, flashPriceMap.get(`product:${p.id}`)))
      }

      return {
        id: banner.id,
        title: banner.title,
        subtitle: banner.subtitle,
        bannerColor: banner.bannerColor,
        textColor: banner.textColor,
        bannerImage: banner.bannerImage,
        seeAllUrl: banner.seeAllUrl,
        seeAllLabel: banner.seeAllLabel,
        sortOrder: banner.sortOrder,
        flashSaleId: banner.flashSaleId,
        categoryId: banner.categoryId,
        startDate: banner.startDate,
        endDate: banner.endDate,
        products,
      }
    }),
  )
}

router.get('/deal-banners/active', async (_req, res) => {
  try {
    const now = new Date()
    const banners = await prisma.dealBanner.findMany({
      where: buildActiveBannerWhere(now),
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    })
    const withProducts = await attachProductsForBanners(banners)
    res.json({ banners: withProducts })
  } catch (error) {
    console.error('Error loading active deal banners:', error)
    res.status(500).json({ error: 'Could not load deals' })
  }
})

router.get('/admin/deal-banners', async (req: any, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Admin access required' })
  try {
    const banners = await prisma.dealBanner.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }] })
    const serialized = banners.map((b: any) => ({
      ...b,
      productIds: b.productIds
        ? (() => {
            try {
              return JSON.parse(b.productIds)
            } catch {
              return []
            }
          })()
        : [],
    }))
    res.json({ banners: serialized })
  } catch (error) {
    console.error('Admin list deal banners error:', error)
    res.status(500).json({ error: 'Could not load deal banners' })
  }
})

router.post('/admin/deal-banners', async (req: any, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Admin access required' })
  try {
    const data = createDealBannerSchema.parse(req.body)
    const banner = await prisma.dealBanner.create({
      data: {
        title: data.title,
        subtitle: data.subtitle || null,
        bannerColor: data.bannerColor,
        textColor: data.textColor,
        bannerImage: data.bannerImage || null,
        productIds: data.productIds ? JSON.stringify(data.productIds) : null,
        categoryId: data.categoryId || null,
        flashSaleId: data.flashSaleId || null,
        seeAllUrl: data.seeAllUrl || null,
        seeAllLabel: data.seeAllLabel,
        sortOrder: data.sortOrder,
        isActive: data.isActive,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        createdBy: req.user?.id || null,
      },
    })
    res.status(201).json({
      banner: {
        ...banner,
        productIds: banner.productIds ? JSON.parse(banner.productIds) : [],
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid deal banner', details: error.issues })
    console.error('Create deal banner error:', error)
    res.status(500).json({ error: 'Could not create deal banner' })
  }
})

router.put('/admin/deal-banners/:id', async (req: any, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Admin access required' })
  try {
    const data = createDealBannerSchema.partial().parse(req.body)
    const updateData: any = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.subtitle !== undefined) updateData.subtitle = data.subtitle || null
    if (data.bannerColor !== undefined) updateData.bannerColor = data.bannerColor
    if (data.textColor !== undefined) updateData.textColor = data.textColor
    if (data.bannerImage !== undefined) updateData.bannerImage = data.bannerImage || null
    if (data.productIds !== undefined) updateData.productIds = data.productIds ? JSON.stringify(data.productIds) : null
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId || null
    if (data.flashSaleId !== undefined) updateData.flashSaleId = data.flashSaleId || null
    if (data.seeAllUrl !== undefined) updateData.seeAllUrl = data.seeAllUrl || null
    if (data.seeAllLabel !== undefined) updateData.seeAllLabel = data.seeAllLabel
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder
    if (data.isActive !== undefined) updateData.isActive = data.isActive
    if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null
    if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null

    const banner = await prisma.dealBanner.update({ where: { id: req.params.id }, data: updateData })
    res.json({
      banner: {
        ...banner,
        productIds: banner.productIds ? JSON.parse(banner.productIds) : [],
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid deal banner update', details: error.issues })
    console.error('Update deal banner error:', error)
    res.status(500).json({ error: 'Could not update deal banner' })
  }
})

router.delete('/admin/deal-banners/:id', async (req: any, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Admin access required' })
  try {
    await prisma.dealBanner.delete({ where: { id: req.params.id } })
    res.json({ ok: true })
  } catch (error) {
    console.error('Delete deal banner error:', error)
    res.status(500).json({ error: 'Could not delete deal banner' })
  }
})

router.post('/admin/deal-banners/:id/track', async (req: any, res) => {
  try {
    const { event } = z.object({ event: z.enum(['click', 'impression']) }).parse(req.body)
    if (event === 'click') {
      await prisma.dealBanner.update({ where: { id: req.params.id }, data: { totalClicks: { increment: 1 } } })
    } else {
      await prisma.dealBanner.update({ where: { id: req.params.id }, data: { totalImpressions: { increment: 1 } } })
    }
    res.json({ ok: true })
  } catch (error) {
    res.status(400).json({ error: 'Invalid track event' })
  }
})

router.post('/admin/products/bulk-discount', async (req: any, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Admin access required' })
  try {
    const schema = z.object({
      productIds: z.array(z.string()).min(1),
      discountPercentage: z.coerce.number().min(0).max(95),
      isOnSale: z.boolean().default(true),
    })
    const data = schema.parse(req.body)
    const products = await prisma.product.findMany({ where: { id: { in: data.productIds }, deletedAt: null } })
    const updated = await Promise.all(
      products.map(async (product) => {
        const currentPrice = Number(product.price)
        const comparePrice = currentPrice
        const discounted = Math.round((currentPrice * (100 - data.discountPercentage)) / 100)
        return prisma.product.update({
          where: { id: product.id },
          data: {
            price: discounted,
            comparePrice,
            isOnSale: data.isOnSale,
          },
        })
      }),
    )
    res.json({ updated: updated.length, ids: updated.map((p) => p.id) })
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid bulk discount payload', details: error.issues })
    console.error('Bulk discount error:', error)
    res.status(500).json({ error: 'Could not apply bulk discount' })
  }
})

router.post('/admin/products/remove-discount', async (req: any, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Admin access required' })
  try {
    const schema = z.object({ productIds: z.array(z.string()).min(1) })
    const data = schema.parse(req.body)
    const products = await prisma.product.findMany({ where: { id: { in: data.productIds }, deletedAt: null } })
    const updated = await Promise.all(
      products.map(async (product) => {
        const restore = product.comparePrice && Number(product.comparePrice) > 0 ? Number(product.comparePrice) : Number(product.price)
        return prisma.product.update({
          where: { id: product.id },
          data: {
            price: restore,
            comparePrice: null,
            isOnSale: false,
          },
        })
      }),
    )
    res.json({ removed: updated.length, ids: updated.map((p) => p.id) })
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid remove discount payload', details: error.issues })
    console.error('Remove discount error:', error)
    res.status(500).json({ error: 'Could not remove discounts' })
  }
})

export default router
