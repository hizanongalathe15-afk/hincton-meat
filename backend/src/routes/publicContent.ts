import express from 'express'
import { prisma } from '../config/prisma'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { z } from 'zod'
import { DEFAULT_SITE_THEME, mergeTheme } from '../constants/siteAppearance'

const router = express.Router()

const uploadBasePath = process.env.UPLOAD_DIR || (process.env.VERCEL ? '/tmp/uploads' : 'uploads')
const feedbackUploadPath = path.join(uploadBasePath, 'content')
const ensureDirectory = (dir: string) => {
  try {
    fs.mkdirSync(dir, { recursive: true })
  } catch (error) {
    console.warn(`Unable to create directory ${dir}:`, error)
  }
}
ensureDirectory(feedbackUploadPath)

const feedbackUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      ensureDirectory(feedbackUploadPath)
      cb(null, feedbackUploadPath)
    },
    filename: (_req, file, cb) => cb(null, `feedback-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`),
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => file.mimetype.startsWith('image/') ? cb(null, true) : cb(new Error('Only image files are allowed')),
})

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
  footer: {
    startYear: 2018,
    autoUpdateCurrentYear: true,
    endYear: null,
    companyName: null,
    allRightsReservedText: 'All rights reserved.',
    customCopyrightLine: null,
  },
  featureToggles: {
    quickViewModal: true,
    wishlistSharing: true,
    couponAutoApply: true,
    printableReturnLabel: true,
    oneClickReorder: true,
    reviewHelpfulVotes: true,
    backInStockAlerts: true,
    lowStockBadge: true,
    lowStockThreshold: 5,
    currencySwitcher: true,
    socialLoginButtons: true,
    bnplOptions: true,
    newsletterExitIntent: true,
    productShareButtons: true,
    instagramFeed: true,
    instagramFeedHandle: '@hinctonmeatproducts',
    sustainabilityBadges: true,
    trustBadges: true,
    livePurchaseNotifications: true,
    pwaInstallPrompt: true,
    loyaltyProgram: true,
    spinToWin: true,
    arProductTryOn: false,
    voiceSearchMetadata: true,
    cryptoPayments: false,
    abTestingEnabled: true,
    analyticsTelemetry: true,
    socialProofViewers: true,
    subscriptionPlans: true,
    carbonNeutralClaims: true,
    maintenanceMode: false,
    maintenanceSecretKey: '',
    maintenanceDisplayMode: 'full',
    maintenanceHeadline: "We'll Be Right Back!",
    maintenanceMessage: "We're currently making some exciting upgrades to improve your shopping experience. Our team is working hard to get things back online.",
    maintenanceEstimatedTime: '~15 minutes',
    maintenanceContactEmail: '',
    maintenanceContactPhone: '',
    maintenanceBannerText: "We're making improvements. Some features may be temporarily unavailable.",
    maintenancePopupTitle: 'Quick Maintenance',
    maintenancePopupMessage: "We're making a quick fix. This feature will be back shortly.",
  },
  payments: {
    bnpl: [
      { code: 'KLARNA', label: 'Klarna', enabled: false, description: 'Pay in 30 days or split into installments.', learnMoreUrl: 'https://www.klarna.com/' },
      { code: 'AFTERPAY', label: 'Afterpay', enabled: false, description: 'Four interest-free payments every two weeks.', learnMoreUrl: 'https://www.afterpay.com/' },
    ],
    digitalWallets: [
      { code: 'MPESA', label: 'M-PESA', enabled: true },
      { code: 'APPLE_PAY', label: 'Apple Pay', enabled: false },
      { code: 'GOOGLE_PAY', label: 'Google Pay', enabled: false },
      { code: 'PAYPAL', label: 'PayPal', enabled: true },
    ],
    crypto: [
      { code: 'BTC', label: 'Bitcoin', enabled: false, walletAddress: '' },
      { code: 'ETH', label: 'Ethereum', enabled: false, walletAddress: '' },
      { code: 'USDC', label: 'USDC', enabled: false, walletAddress: '' },
    ],
  },
  trust: {
    badges: [
      { code: 'SSL', label: 'Secure Checkout', description: '256-bit SSL encryption' },
      { code: 'MONEY_BACK', label: 'Satisfaction Guarantee', description: 'Full refund for valid quality issues' },
      { code: 'HACCP', label: 'HACCP Certified', description: 'Food safety management system' },
      { code: 'COLD_CHAIN', label: 'Cold Chain Assured', description: 'Chilled end-to-end delivery' },
    ],
    sustainability: [
      { code: 'ETHICAL_SOURCING', label: 'Ethically Sourced Livestock', icon: 'leaf' },
      { code: 'COLD_CHAIN_EFFICIENCY', label: 'Efficient Cold-Chain Logistics', icon: 'snowflake' },
      { code: 'CARBON_OFFSET', label: 'Carbon-Neutral Deliveries', icon: 'circle-dot' },
      { code: 'ZERO_WASTE', label: 'Responsible Waste Disposal', icon: 'recycle' },
    ],
    viewCounterWindowMinutes: 15,
    recentPurchaseWindowHours: 48,
    socialProofMode: 'REAL_FALLBACK_SIMULATED',
  },
  gamification: {
    welcomePoints: 100,
    pointsPerOrder: 10,
    pointsPerReview: 20,
    pointsPerReferral: 100,
    spinWinDailyLimit: 1,
    loyaltyBadgeThresholds: {
      FIRST_ORDER: { requiredOrders: 1 },
      FREQUENT_BUYER: { requiredOrders: 5 },
      REVIEWER: { requiredReviews: 3 },
      AMBASSADOR: { requiredOrders: 20 },
      TOP_CUSTOMER: { requiredSpent: 100000 },
    },
  },
  seo: {
    enableJsonLd: true,
    enableBreadcrumbsLd: true,
    enableFaqsLd: true,
    enableVoiceSearchMeta: true,
    defaultKeywords: ['fresh meat', 'beef', 'goat meat', 'chicken', 'nairobi butcher', 'kenya meat delivery'],
  },
  newsletter: {
    exitIntentEnabled: true,
    exitIntentDelayMs: 5000,
    popupTitle: 'Get 10% off your first order',
    popupSubtitle: 'Subscribe to our newsletter for exclusive offers and new cuts.',
    footerCta: 'Stay up to date with new arrivals and offers.',
  },
  currencies: [
    { code: 'KES', symbol: 'KSh', label: 'Kenyan Shilling', rate: 1.00, isDefault: true },
    { code: 'USD', symbol: '$', label: 'US Dollar', rate: 0.0068, isDefault: false },
    { code: 'EUR', symbol: '€', label: 'Euro', rate: 0.0062, isDefault: false },
    { code: 'GBP', symbol: '£', label: 'British Pound', rate: 0.0053, isDefault: false },
    { code: 'UGX', symbol: 'USh', label: 'Ugandan Shilling', rate: 26.0, isDefault: false },
    { code: 'TZS', symbol: 'TSh', label: 'Tanzanian Shilling', rate: 17.5, isDefault: false },
  ],
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
    hero: '/hincton/hero-platter.webp',
    about: '/hincton/beef-fresh.webp',
    market: '/hincton/cattle-market.webp',
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

router.get('/site-theme', async (_req, res) => {
  try {
    const setting = await prisma.systemSetting.findUnique({ where: { key: 'site_theme' } })
    const saved = setting ? parseJsonValue<Record<string, string>>(setting.value, {}) : {}
    res.json({ theme: mergeTheme(saved) })
  } catch (error) {
    console.error('Public site theme error:', error)
    res.json({ theme: DEFAULT_SITE_THEME })
  }
})

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

router.get('/maintenance-status', async (_req, res) => {
  try {
    const setting = await prisma.systemSetting.findUnique({ where: { key: 'site_profile' } })
    const profile = setting ? parseJsonValue(setting.value, defaultSiteProfile) : defaultSiteProfile
    const toggles = (profile.featureToggles || {}) as Record<string, any>
    const enabled = Boolean(toggles.maintenanceMode)
    res.json({
      enabled,
      displayMode: toggles.maintenanceDisplayMode || 'full',
      headline: toggles.maintenanceHeadline || "We'll Be Right Back!",
      message: toggles.maintenanceMessage || '',
      estimatedTime: toggles.maintenanceEstimatedTime || '',
      contactEmail: toggles.maintenanceContactEmail || '',
      contactPhone: toggles.maintenanceContactPhone || '',
      bannerText: toggles.maintenanceBannerText || '',
      popupTitle: toggles.maintenancePopupTitle || '',
      popupMessage: toggles.maintenancePopupMessage || '',
    })
  } catch (error) {
    res.json({ enabled: false, displayMode: 'full' })
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

router.post('/contact/submit', feedbackUpload.single('screenshot'), async (req, res) => {
  try {
    const contactData = z.object({
      name: z.string().min(1),
      email: z.string().email(),
      phone: z.string().optional(),
      subject: z.string().min(1),
      message: z.string().min(1),
      category: z.string().optional(),
    }).parse(req.body)

    const user = await prisma.user.upsert({
      where: { email: contactData.email },
      update: {
        profile: {
          upsert: {
            create: { fullName: contactData.name },
            update: { fullName: contactData.name },
          },
        },
      },
      create: {
        email: contactData.email,
        roles: ['BUYER'] as any,
        profile: { create: { fullName: contactData.name } },
        security: { create: { is_active: true, isEmailVerified: false } },
      },
    })

    const screenshotUrl = req.file ? `/uploads/content/${req.file.filename}` : null
    const ticket = await prisma.supportTicket.create({
      data: {
        userId: user.id,
        subject: contactData.subject,
        message: [
          `From: ${contactData.name} <${contactData.email}>`,
          contactData.phone ? `Phone: ${contactData.phone}` : null,
          contactData.category ? `Category: ${contactData.category}` : null,
          screenshotUrl ? `Screenshot: ${screenshotUrl}` : null,
          '',
          contactData.message,
        ].filter(Boolean).join('\n'),
        category: contactData.category === 'feedback' ? 'FEEDBACK' : 'GENERAL_INQUIRY',
        priority: contactData.category === 'feedback' ? 'MEDIUM' : 'LOW',
        status: 'OPEN',
      },
    })

    res.json({ message: 'Contact form submitted successfully', ticketId: ticket.id })
  } catch (error) {
    console.error('Public contact form submission error:', error)
    res.status(500).json({ error: 'Failed to submit contact form' })
  }
})

export default router
