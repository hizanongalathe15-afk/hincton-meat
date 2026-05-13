import express from 'express'
import { prisma } from '../config/prisma'

const router = express.Router()

const parseJsonValue = <T = any>(value: string | undefined, fallback: T): T => {
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

const defaultSiteProfile = {
  brand: {
    name: 'Hincton Meat Products',
    tagline: 'Only Fresh Meat',
    mantra: 'Quality. Freshness. Integrity.',
    website: 'www.hinctonmeatproducts.com',
    phone: '0759 901 357',
    phoneHref: 'tel:+254759901357',
    email: 'dialformeat@gmail.com',
    emailHref: 'mailto:dialformeat@gmail.com',
    address: 'Summit House, Waiyaki Way, Nairobi, Kenya',
    socialHandle: '@hinctonmeatproducts',
    logo: '/hincton/logo.png',
  },
  companyProfile:
    'Hincton Meat Products is a leading supplier of high-quality meat products specializing in goat, beef, chicken, and other livestock products. Located in Nairobi, Kenya, we serve both local and international markets with fresh, safe, and nutritious meat products.',
  mission:
    'To deliver fresh, high-quality meat products while upholding the highest standards of food safety, animal welfare, and environmental sustainability.',
  vision:
    'To be the leading global provider of premium meat products, known for excellence in quality, sustainability, and ethical sourcing practices.',
  procurementCommitment:
    'We prioritize ethical and sustainable livestock procurement by partnering with trusted farmers and suppliers who meet strict standards.',
  markets: [
    'International Market: Exporting premium meat products to the Middle East, East Africa, and other regions.',
    'Local Market: Serving wholesalers, retailers, foodservice providers, and individual consumers across Kenya.',
  ],
  qualityPoints: [
    'Advanced chilling facilities ensuring optimal temperature control.',
    'Modern freezing technology preserving freshness and nutritional value.',
    'Temperature-controlled storage and efficient dispatch systems.',
  ],
  images: {
    hero: '/hincton/hero-platter.jpg',
    about: '/hincton/beef-fresh.jpg',
    market: '/hincton/cattle-market.jpg',
    logo: '/hincton/logo.png',
  },
}

const defaultCommerceSettings = {
  shipping: {
    standardShippingFee: 200,
    expressShippingFee: 450,
    deliveryTimeframe: 'Today before 5 PM',
    expressDeliveryTimeframe: 'Within 2 hours',
    coldChainCutoffHour: 10,
    sameDayDeliveryBy: '5:00 PM',
    insulatedBoxText: 'Delivered cold in an insulated box',
  },
  inventory: {
    lowStockThreshold: 10,
  },
  shop: {
    priceRanges: [
      { id: '0-1000', name: 'Under KSh 1,000', min: 0, max: 1000 },
      { id: '1000-3000', name: 'KSh 1,000 - KSh 3,000', min: 1000, max: 3000 },
      { id: '3000-6000', name: 'KSh 3,000 - KSh 6,000', min: 3000, max: 6000 },
      { id: '6000-13000', name: 'KSh 6,000 - KSh 13,000', min: 6000, max: 13000 },
      { id: '13000-plus', name: 'Over KSh 13,000', min: 13000, max: null },
    ],
  },
  notifications: {
    emailNotifications: true,
    smsNotifications: true,
    whatsappNotifications: true,
    orderNotifications: true,
    lowStockAlerts: true,
  },
}

router.get('/site-profile', async (_req, res) => {
  try {
    const setting = await prisma.systemSetting.findUnique({ where: { key: 'site_profile' } })
    res.json({ profile: setting ? { ...defaultSiteProfile, ...parseJsonValue(setting.value, {}) } : defaultSiteProfile })
  } catch (error) {
    console.error('Public site profile error:', error)
    if (isDatabaseUnavailable(error)) {
      return res.json({ profile: defaultSiteProfile })
    }
    res.status(500).json({ error: 'Failed to get site profile' })
  }
})

router.get('/web-profile', async (_req, res) => {
  try {
    const [setting, products, categories, featuredProducts, inStockProducts] = await Promise.all([
      prisma.systemSetting.findUnique({ where: { key: 'site_profile' } }),
      prisma.product.count({ where: { isPublished: true, deletedAt: null } }),
      prisma.category.count({ where: { isActive: true, deletedAt: null } }),
      prisma.product.count({ where: { isPublished: true, isFeatured: true, deletedAt: null } }),
      prisma.product.count({ where: { isPublished: true, deletedAt: null, stockQuantity: { gt: 0 } } }),
    ])

    const featuredCatalog = await prisma.product.findMany({
      where: { isPublished: true, isFeatured: true, deletedAt: null },
      take: 3,
      orderBy: [{ updatedAt: 'desc' }],
      include: {
        category: { select: { name: true, slug: true } },
        productImages: {
          orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
          take: 1,
          select: { url: true, alt: true },
        },
      },
    })

    res.json({
      profile: setting ? { ...defaultSiteProfile, ...parseJsonValue(setting.value, {}) } : defaultSiteProfile,
      stats: {
        products,
        categories,
        featuredProducts,
        inStockProducts,
      },
      featuredProducts: featuredCatalog,
    })
  } catch (error) {
    console.error('Public web profile error:', error)
    if (isDatabaseUnavailable(error)) {
      return res.json({
        profile: defaultSiteProfile,
        stats: {
          products: 0,
          categories: 0,
          featuredProducts: 0,
          inStockProducts: 0,
        },
        featuredProducts: [],
      })
    }
    res.status(500).json({ error: 'Failed to get web profile' })
  }
})

router.get('/commerce-settings', async (_req, res) => {
  try {
    const setting = await prisma.systemSetting.findUnique({ where: { key: 'commerce_settings' } })
    res.json({ settings: setting ? { ...defaultCommerceSettings, ...parseJsonValue(setting.value, {}) } : defaultCommerceSettings })
  } catch (error) {
    console.error('Public commerce settings error:', error)
    if (isDatabaseUnavailable(error)) {
      return res.json({ settings: defaultCommerceSettings })
    }
    res.status(500).json({ error: 'Failed to get commerce settings' })
  }
})

export default router
