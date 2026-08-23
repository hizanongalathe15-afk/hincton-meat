import express from 'express'
import type { AuthRequest } from '../middleware/auth'


import { prisma } from '../config/prisma'
import { z } from 'zod'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { uploadImage } from '../config/cloudinary'
import { cacheService } from '../services/cacheService'
import { siteAppearanceService } from '../services/siteAppearanceService'
import { DEFAULT_SITE_THEME, THEME_COLOR_KEYS, normalizeTheme } from '../constants/siteAppearance'

const router = express.Router()
const emitContactUpdate = (req: any, event: string, payload: Record<string, unknown>) => {
  const io = req.app?.get?.('io')
  if (!io) return
  io.emit(event, payload)
}
const uploadBasePath = process.env.UPLOAD_DIR || (process.env.VERCEL ? '/tmp/uploads' : 'uploads')
const contentUploadPath = path.join(uploadBasePath, 'content')
const ensureDirectory = (dir: string) => {
  try {
    fs.mkdirSync(dir, { recursive: true })
  } catch (error) {
    console.warn(`Unable to create directory ${dir}:`, error)
  }
}
ensureDirectory(contentUploadPath)

const saveLocalContentMedia = (file: Express.Multer.File) => {
  ensureDirectory(contentUploadPath)
  const extension = path.extname(file.originalname) || `.${file.mimetype.split('/')[1] || 'bin'}`
  const filename = `content-${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`
  const localPath = path.join(contentUploadPath, filename)
  fs.writeFileSync(localPath, file.buffer)
  return `/uploads/content/${filename}`
}

const contentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 80 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/') || file.mimetype.startsWith('audio/')) return cb(null, true)
    cb(new Error('Only image, video, or audio files are allowed'))
  },
})

// Middleware to check admin permissions
const requireAdmin = (req: any, res: any, next: any) => {
  const user = req.user
  if (!user || !user.roles.includes('ADMIN')) {
    return res.status(403).json({ error: 'Admin access required' })
  }
  next()
}

const parseJsonValue = <T = any>(value: string | undefined, fallback: T): T => {
  try {
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

router.use(requireAdmin)

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
    socialLinks: [
      { label: 'Instagram', url: 'https://www.instagram.com/hinctonmeatproducts' },
      { label: 'Facebook', url: 'https://www.facebook.com/' },
      { label: 'WhatsApp', url: 'https://wa.me/254759901357' },
    ],
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
    contact: '/hincton/hero-platter.webp',
    farms: '/hincton/cattle-market.webp',
    sustainability: '/hincton/beef-fresh.webp',
    careers: '/hincton/logo.png',
    blog: '/hincton/hero-platter.webp',
    wellness: '/hincton/beef-fresh.webp',
    returns: '/hincton/hero-platter.webp',
  },
  pages: {
    about: { title: 'About Us', subtitle: 'Quality, freshness, and integrity from supplier to customer.', body: 'Hincton Meat Products is a leading supplier of high-quality meat products.', image: '/hincton/beef-fresh.webp', sections: [] },
    farms: { title: 'Our Farms', subtitle: 'Trusted supplier relationships and transparent sourcing.', body: 'We work with farms and suppliers that meet our quality, food safety, and handling standards.', image: '/hincton/cattle-market.webp', sections: [] },
    provenance: { title: 'What Our Customers Cooked & Farm Provenance', subtitle: 'See real culinary creations from our Nairobi home chefs and trace our direct ethical sourcing from Kenyan highland pastures.', body: '', image: '/hincton/cattle-market.webp', sections: [
      { title: 'Naivasha & Laikipia Pastures', body: 'Our cattle graze naturally on pesticide-free Kenyan highland pastures with free access to mineral springs. 100% grass-fed and finished for healthy omega fats and deep beef flavor.', image: '', linkLabel: '100% Halal & Vet Certified', linkUrl: '' },
      { title: 'Sourced at 6:00 AM Daily', body: 'Every carcass is processed at dawn under strict cold-chain supervision. Never frozen twice, ensuring natural juices and enzymes remain preserved from the counter to your doorstep.', image: '', linkLabel: 'Strict 2°C Cold Chain', linkUrl: '' },
      { title: 'Hand-Trimmed by Master Cutters', body: 'Every cut is hand-portioned by veteran Kenyan butchers with 15+ years experience. Custom thicknesses, special marinades, or bone-in cuts available upon request on WhatsApp.', image: '', linkLabel: 'Custom Cut Precision', linkUrl: '' },
    ] },
    sustainability: { title: 'Sustainability', subtitle: 'Responsible sourcing, cold-chain handling, and reduced waste.', body: 'Our sustainability approach focuses on efficient operations, responsible procurement, and safe product handling.', image: '/hincton/beef-fresh.webp', sections: [] },
    contact: { title: 'Contact', subtitle: 'Talk to our team about orders, supply, delivery, or partnerships.', body: 'Contact Hincton Meat Products for retail, wholesale, foodservice, and export enquiries.', image: '/hincton/hero-platter.webp', sections: [] },
    careers: { title: 'Careers', subtitle: 'Join the team behind Hincton Meat Products.', body: 'Explore roles in operations, delivery, customer care, procurement, technology, and retail support.', image: '/hincton/logo.png', sections: [] },
    wellness: { title: 'Wellness', subtitle: 'Practical food handling, nutrition, and kitchen guidance.', body: 'Read practical guidance for safe storage, balanced meals, preparation, and freshness.', image: '/hincton/beef-fresh.webp', sections: [] },
    returns: { title: 'Returns', subtitle: 'Clear support for order, quality, and delivery issues.', body: 'Because fresh products are perishable, returns are reviewed quickly with order details, timing, and supporting photos where relevant.', image: '/hincton/hero-platter.webp', sections: [] },
    maintenance: {
      title: "We're giving the site a little spa day!",
      subtitle: 'We’ll be back soon with a faster, fresher experience.',
      body: 'Thanks for your patience while we update the site. If you need help right away, email us at dialformeat@gmail.com or visit our social pages for live updates.',
      image: '/hincton/hero-platter.webp',
      sections: [
        { title: 'Estimated return time', body: 'Back by 3:00 PM EAT — and if anything changes, we’ll update this page immediately.' },
        { title: 'Need urgent help?', body: 'Email support at dialformeat@gmail.com or message our WhatsApp team while we finish the upgrade.' },
      ],
    },
    downloadThankYou: {
      title: 'Thanks for downloading Hincton Meat!',
      subtitle: 'Your app is ready to open and start serving your next order.',
      body: 'We appreciate you choosing our service. Open the app to shop fresh meat, track orders, and access special checkout offers.',
      image: '/hincton/logo.png',
      sections: [
        { title: 'What to do next', body: 'Open the app and create an account or sign in to start browsing fresh meat and order delivery.' },
        { title: 'Need help?', body: 'Contact support at dialformeat@gmail.com or tap the live chat link in the app.' },
      ],
    },
    blog: { title: 'Blog', subtitle: 'Stories, guides, updates, and recipes from the Hincton team.', body: 'Browse posts from the admin-managed blog.', image: '/hincton/hero-platter.webp', sections: [] },
  },
  terms: [
    {
      title: '1. Agreement To These Terms',
      body: 'By creating an account, browsing products, adding items to cart, placing an order, paying through M-PESA, card, cash on delivery, or using support chat, you agree to these Terms and Conditions. If you do not agree, you should not use the website or place an order. These terms apply to buyers, guests, account holders, and any person acting on behalf of a buyer.',
    },
    {
      title: '2. Account Registration And Security',
      body: 'You must provide accurate names, email addresses, phone numbers, delivery details, and payment information. You are responsible for keeping your password, OTP, and device access secure. Activity from your account may be treated as your activity. Notify Hincton Meat Products immediately if you believe your account, phone, email, or device has been misused.',
    },
    {
      title: '3. Product Information, Weights, And Availability',
      body: 'Product names, images, descriptions, prices, pack sizes, weight units, and availability are managed through the platform and may change based on stock, supplier availability, preparation method, or market price. Meat products can have natural weight variation. We aim to keep product data accurate, but availability is confirmed at order processing and checkout stock validation.',
    },
    {
      title: '4. Orders, Holds, And Stock',
      body: 'Adding a product to cart does not complete a purchase. Stock is confirmed when an order is submitted and accepted by the system. If multiple customers attempt to buy limited stock, the system validates available quantity before creating the order. Hincton Meat Products may cancel, adjust, or contact you about an order if stock, pricing, delivery, payment, address, or compliance issues arise.',
    },
    {
      title: '5. Pricing, Payment, And Taxes',
      body: 'Prices are shown in the currency displayed by the platform, commonly Kenya shillings for local orders. Delivery fees, promotions, discounts, taxes, and payment charges may apply. M-PESA payments require the buyer to approve the STK prompt or complete the provided payment flow. An order may remain pending until payment is confirmed.',
    },
    {
      title: '6. Delivery, Location, And Order Tracking',
      body: 'You must provide a real delivery address and, where available, a map pin or GPS location. If browser location permission is denied, you may enter the address manually and use the map preview to confirm the destination. Delivery times are estimates and may be affected by traffic, weather, stock preparation, payment confirmation, address accuracy, customer availability, or events beyond our control.',
    },
    {
      title: '7. Fresh Food Handling',
      body: 'Meat and perishable products require proper handling after delivery. You are responsible for receiving the order on time, refrigerating or freezing products as appropriate, and following food safety guidance. Hincton Meat Products is not responsible for spoilage caused by delayed collection, incorrect storage, or inability to reach the buyer at the provided contact details.',
    },
    {
      title: '8. Returns, Refunds, And Complaints',
      body: 'Because meat is perishable, returns may be limited. If there is a quality, quantity, delivery, or payment issue, contact support promptly with the order number, photos where relevant, and a clear description. Refunds, replacements, credits, or order adjustments are reviewed case by case according to product condition, timing, evidence, and applicable consumer protection rules.',
    },
    {
      title: '9. Messaging, Reviews, And User Content',
      body: 'You may send messages, contact forms, chats, reviews, images, or profile details through the website. You agree not to submit abusive, illegal, misleading, fraudulent, obscene, threatening, or infringing content. Hincton Meat Products may moderate, remove, or restrict content or accounts that harm users, staff, systems, or business operations.',
    },
    {
      title: '10. Acceptable Use',
      body: 'You must not attack, scrape, overload, reverse engineer, bypass authentication, abuse coupons, impersonate another person, upload malware, exploit bugs, or use the website for illegal activity. We may limit, suspend, or terminate access if we detect misuse, suspicious payments, fraud, security risk, or repeated policy violations.',
    },
    {
      title: '11. Admin Actions And Service Changes',
      body: 'Admins may update products, prices, stock, delivery settings, order statuses, content, promotions, and customer support responses. The website may change, pause, or remove features to improve service, fix bugs, meet legal requirements, or protect users and business operations.',
    },
    {
      title: '12. Limitation Of Liability',
      body: 'To the maximum extent allowed by law, Hincton Meat Products is not liable for indirect, incidental, special, punitive, or consequential losses, including lost profits, lost data, business interruption, device issues, third-party payment downtime, mapping errors, or delays outside reasonable control.',
    },
    {
      title: '13. Governing Law And Contact',
      body: 'These terms are intended to operate under applicable Kenyan law for local transactions unless another written agreement applies. For questions, disputes, or support, contact Hincton Meat Products using the phone, email, or contact page provided on the website.',
    },
  ],
  privacy: [
    {
      title: '1. Privacy Commitment',
      body: 'This Privacy Policy explains how Hincton Meat Products collects, uses, stores, protects, and shares personal information when you visit the website, create an account, upload a profile image, place an order, pin a delivery location, contact support, or use messaging features.',
    },
    {
      title: '2. Information We Collect',
      body: 'We may collect your name, email address, phone number, account password hash, profile image, delivery address, GPS coordinates when you allow location access, order history, cart and wishlist activity, payment references, support messages, reviews, device details, IP address, session records, and communication preferences.',
    },
    {
      title: '3. Profile Images And Uploaded Files',
      body: 'When you upload a profile image, the file is stored by our configured image service or on our server uploads storage. The image may be displayed in your account, navigation menu, support messages, reviews, admin tools, and other account-related areas. Do not upload images that you do not have permission to use.',
    },
    {
      title: '4. Location And Maps',
      body: 'If you allow browser location access, we use coordinates to help confirm delivery drop-off points and improve delivery accuracy. If you deny permission, you can manually enter your address and use the map preview. Map providers may process map requests according to their own terms and privacy policies.',
    },
    {
      title: '5. How We Use Information',
      body: 'We use personal information to create and secure accounts, process orders, validate stock, request payments, deliver products, provide order tracking, send notifications, respond to messages, prevent fraud, improve performance, personalize the experience, maintain records, and comply with legal or operational obligations.',
    },
    {
      title: '6. Communications',
      body: 'We may contact you through in-app notifications, email, phone, SMS, WhatsApp, or support chat about account activity, order status, payment updates, delivery coordination, security alerts, service changes, promotions where allowed, and responses to your enquiries.',
    },
    {
      title: '7. Sharing With Service Providers',
      body: 'We may share necessary data with service providers such as payment processors, M-PESA integrations, delivery teams, hosting providers, email/SMS/WhatsApp gateways, image storage providers, analytics tools, security tools, and map providers. They should only process information needed to provide their services.',
    },
    {
      title: '8. Security And Retention',
      body: 'We use reasonable technical and organizational safeguards, including authentication, password hashing, session management, access controls, and operational monitoring. No system is perfectly secure. We retain information for as long as needed for orders, support, legal, tax, audit, fraud prevention, and service operations.',
    },
    {
      title: '9. Cookies, Sessions, And Local Storage',
      body: 'The website may use cookies, browser storage, guest session IDs, authentication tokens, language preferences, cart state, and similar technologies to keep you signed in, preserve cart activity, remember preferences, secure sessions, and improve responsiveness.',
    },
    {
      title: '10. Your Rights And Choices',
      body: 'You may access, update, or delete your account information, opt out of marketing communications, request data portability, or withdraw consent where applicable. Contact us to exercise these rights. We will respond within reasonable timeframes as required by law.',
    },
    {
      title: '11. Children\'s Privacy',
      body: 'Our services are not intended for children under 13. We do not knowingly collect personal information from children under 13. If we become aware of such collection, we will delete the information promptly.',
    },
    {
      title: '12. Changes To This Policy',
      body: 'We may update this Privacy Policy periodically. We will notify you of material changes through the website, email, or other appropriate means. Continued use of our services after changes constitutes acceptance of the updated policy.',
    },
    {
      title: '13. Contact Us',
      body: 'For privacy-related questions, concerns, or requests, contact Hincton Meat Products using the contact information provided on the website or through your account settings.',
    },
  ],
}

export const siteProfileSchema = z.object({
  brand: z.object({
    name: z.string().trim().default(''),
    tagline: z.string().trim().default(''),
    mantra: z.string().trim().default(''),
    website: z.string().trim().default(''),
    phone: z.string().trim().default(''),
    phoneHref: z.string().trim().default(''),
    email: z.string().trim().default(''),
    emailHref: z.string().trim().default(''),
    address: z.string().trim().default(''),
    socialHandle: z.string().trim().default(''),
    logo: z.string().trim().default(''),
    socialLinks: z.array(z.object({
      label: z.string().trim().default(''),
      url: z.string().trim().default(''),
    })).default([]).optional(),
  }),
  footer: z.object({
    startYear: z.number().int().min(1900).max(2999),
    autoUpdateCurrentYear: z.boolean().default(true),
    endYear: z.number().int().min(1900).max(2999).nullable().optional(),
    companyName: z.string().nullable().optional(),
    allRightsReservedText: z.string().min(0).nullable().optional(),
    customCopyrightLine: z.string().nullable().optional(),
  }).default({
    startYear: 2018,
    autoUpdateCurrentYear: true,
    endYear: null,
    companyName: null,
    allRightsReservedText: 'All rights reserved.',
    customCopyrightLine: null,
  }),
  featureToggles: z.record(z.string(), z.boolean().or(z.number())).default({}),
  payments: z.object({
    bnpl: z.array(z.object({ code: z.string().min(1), label: z.string().min(1), enabled: z.boolean().default(false), description: z.string().optional(), learnMoreUrl: z.string().optional() })).default([]),
    digitalWallets: z.array(z.object({ code: z.string().min(1), label: z.string().min(1), enabled: z.boolean().default(false) })).default([]),
    crypto: z.array(z.object({ code: z.string().min(1), label: z.string().min(1), enabled: z.boolean().default(false), walletAddress: z.string().optional() })).default([]),
  }).optional().default({ bnpl: [], digitalWallets: [], crypto: [] }),
  trust: z.object({
    badges: z.array(z.object({ code: z.string().min(1), label: z.string().min(1), description: z.string().optional() })).default([]),
    sustainability: z.array(z.object({ code: z.string().min(1), label: z.string().min(1), icon: z.string().optional() })).default([]),
    viewCounterWindowMinutes: z.number().int().min(1).max(1440).default(15),
    recentPurchaseWindowHours: z.number().int().min(1).max(24 * 30).default(48),
    socialProofMode: z.enum(['REAL_ONLY', 'REAL_FALLBACK_SIMULATED', 'SIMULATED_ONLY', 'OFF']).default('REAL_FALLBACK_SIMULATED'),
  }).optional().default({ badges: [], sustainability: [], viewCounterWindowMinutes: 15, recentPurchaseWindowHours: 48, socialProofMode: 'REAL_FALLBACK_SIMULATED' }),
  gamification: z.object({
    welcomePoints: z.number().int().min(0).default(100),
    pointsPerOrder: z.number().int().min(0).default(10),
    pointsPerReview: z.number().int().min(0).default(20),
    pointsPerReferral: z.number().int().min(0).default(100),
    spinWinDailyLimit: z.number().int().min(0).max(24).default(1),
    loyaltyBadgeThresholds: z.record(z.string(), z.record(z.string(), z.number())).default({}),
  }).optional().default({ welcomePoints: 100, pointsPerOrder: 10, pointsPerReview: 20, pointsPerReferral: 100, spinWinDailyLimit: 1, loyaltyBadgeThresholds: {} }),
  seo: z.object({
    enableJsonLd: z.boolean().default(true),
    enableBreadcrumbsLd: z.boolean().default(true),
    enableFaqsLd: z.boolean().default(true),
    enableVoiceSearchMeta: z.boolean().default(true),
    defaultKeywords: z.array(z.string()).default([]),
  }).optional().default({ enableJsonLd: true, enableBreadcrumbsLd: true, enableFaqsLd: true, enableVoiceSearchMeta: true, defaultKeywords: [] }),
  newsletter: z.object({
    exitIntentEnabled: z.boolean().default(true),
    exitIntentDelayMs: z.number().int().min(0).default(5000),
    popupTitle: z.string().min(0).default('Subscribe'),
    popupSubtitle: z.string().min(0).default(''),
    footerCta: z.string().min(0).default(''),
  }).optional().default({ exitIntentEnabled: true, exitIntentDelayMs: 5000, popupTitle: 'Subscribe', popupSubtitle: '', footerCta: '' }),
  currencies: z.array(z.object({
    code: z.string().min(1),
    symbol: z.string().min(1),
    label: z.string().min(1),
    rate: z.number().min(0),
    isDefault: z.boolean().default(false),
  })).default([]),
  companyProfile: z.string().trim().default(''),
  mission: z.string().trim().default(''),
  vision: z.string().trim().default(''),
  procurementCommitment: z.string().trim().default(''),
  markets: z.array(z.string().min(1)).default([]),
  qualityPoints: z.array(z.string().min(1)).default([]),
  images: z.object({
    hero: z.string().trim().default(''),
    about: z.string().trim().default(''),
    market: z.string().trim().default(''),
    logo: z.string().trim().default(''),
  }).catchall(z.string().trim().default('')),
  heroSlides: z.array(z.object({ image: z.string().min(1), alt: z.string().optional() })).max(20).default([]),
  pages: z.record(z.string(), z.object({
    title: z.string().min(1),
    subtitle: z.string().optional().default(''),
    body: z.string().optional().default(''),
    image: z.string().optional().default(''),
    video: z.string().optional(),
    sections: z.array(z.object({
      title: z.string().optional().default(''),
      body: z.string().optional().default(''),
      image: z.string().optional(),
      video: z.string().optional(),
      linkLabel: z.string().optional(),
      linkUrl: z.string().optional(),
    })).default([]),
  })).default({}),
  terms: z.array(z.object({
    title: z.string().min(1),
    body: z.string().min(1),
  })).default([]),
  privacy: z.array(z.object({
    title: z.string().min(1),
    body: z.string().min(1),
  })).default([]),
})

router.get('/site-profile', async (_req, res) => {
  try {
    const setting = await prisma.systemSetting.findUnique({ where: { key: 'site_profile' } })
    const profile = setting ? { ...defaultSiteProfile, ...parseJsonValue(setting.value, {}) } : defaultSiteProfile
    res.json({ profile })
  } catch (error) {
    console.error('Get site profile error:', error)
    res.status(500).json({ error: 'Failed to get site profile' })
  }
})

router.put('/site-profile', async (req, res) => {
  try {
    const profile = siteProfileSchema.parse(req.body)
    const setting = await prisma.systemSetting.upsert({
      where: { key: 'site_profile' },
      update: { value: JSON.stringify(profile), type: 'json', group: 'site', isPublic: true },
      create: {
        key: 'site_profile',
        value: JSON.stringify(profile),
        type: 'json',
        group: 'site',
        description: 'Editable public site profile content',
        isPublic: true,
      },
    })

    res.json({ message: 'Site profile updated', profile: parseJsonValue(setting.value, {}) })
  } catch (error) {
    console.error('Update site profile error:', error)
    res.status(500).json({ error: 'Failed to update site profile' })
  }
})

// === SITE APPEARANCE (theme, colours, full reset) ===

const themeSchema = z.record(z.string().min(1).max(40), z.string().min(1).max(80))

router.get('/site-theme', async (_req, res) => {
  try {
    const theme = await siteAppearanceService.getTheme()
    res.json({ theme, colorKeys: THEME_COLOR_KEYS })
  } catch (error) {
    console.error('Get site theme error:', error)
    res.status(500).json({ error: 'Failed to get site theme' })
  }
})

router.put('/site-theme', async (req, res) => {
  try {
    const theme = await siteAppearanceService.saveTheme(themeSchema.parse(req.body.theme || req.body))
    res.json({ message: 'Site theme saved', theme })
  } catch (error: any) {
    console.error('Update site theme error:', error)
    res.status(400).json({ error: error?.message || 'Failed to update site theme' })
  }
})

router.patch('/site-theme/color', async (req, res) => {
  try {
    const { key, value } = z.object({
      key: z.string().min(1).max(40),
      value: z.string().min(1).max(80),
    }).parse(req.body)
    const current = await siteAppearanceService.getTheme()
    const theme = await siteAppearanceService.saveTheme({ ...current, [key]: value })
    res.json({ message: 'Colour updated', key, value, theme })
  } catch (error: any) {
    res.status(400).json({ error: error?.message || 'Failed to update colour' })
  }
})

router.delete('/site-theme/color/:key', async (req, res) => {
  try {
    const key = String(req.params.key)
    const current = await siteAppearanceService.getTheme()
    const { [key]: _removed, ...rest } = current
    const fallback = DEFAULT_SITE_THEME[key] || '#6b7280'
    const theme = await siteAppearanceService.saveTheme({ ...rest, [key]: fallback })
    res.json({ message: 'Colour reset to default', key, theme })
  } catch (error: any) {
    res.status(400).json({ error: error?.message || 'Failed to reset colour' })
  }
})

router.get('/appearance', async (_req, res) => {
  try {
    const appearance = await siteAppearanceService.getAppearance(defaultSiteProfile)
    res.json({ ...appearance, colorKeys: THEME_COLOR_KEYS })
  } catch (error) {
    console.error('Get appearance error:', error)
    res.status(500).json({ error: 'Failed to load appearance settings' })
  }
})

router.put('/appearance', async (req, res) => {
  try {
    const body = z.object({
      profile: siteProfileSchema.optional(),
      theme: themeSchema.optional(),
    }).parse(req.body)

    const [profile, theme] = await Promise.all([
      body.profile ? siteAppearanceService.saveProfile(body.profile) : siteAppearanceService.getProfile(defaultSiteProfile),
      body.theme ? siteAppearanceService.saveTheme(body.theme) : siteAppearanceService.getTheme(),
    ])

    res.json({ message: 'Appearance updated', profile, theme })
  } catch (error: any) {
    console.error('Update appearance error:', error)
    res.status(400).json({ error: error?.message || 'Failed to update appearance' })
  }
})

router.post('/appearance/reset', async (req, res) => {
  try {
    const { mode, targets } = z.object({
      mode: z.enum(['blank', 'defaults']),
      targets: z.array(z.enum(['profile', 'theme', 'all'])).default(['all']),
    }).parse(req.body)

    const result = await siteAppearanceService.resetAppearance(mode, targets, defaultSiteProfile)
    res.json({
      message: mode === 'blank'
        ? 'Storefront reset to a blank slate (no branding, no images, neutral colours)'
        : 'Storefront restored to factory defaults',
      ...result,
    })
  } catch (error: any) {
    console.error('Reset appearance error:', error)
    res.status(400).json({ error: error?.message || 'Failed to reset appearance' })
  }
})

router.post('/appearance/reset-profile-blank', async (_req, res) => {
  try {
    const result = await siteAppearanceService.resetAppearance('blank', ['profile'], defaultSiteProfile)
    res.json({ message: 'Branding and media cleared', profile: result.profile })
  } catch (error: any) {
    res.status(400).json({ error: error?.message || 'Failed to reset profile' })
  }
})

router.post('/uploads', contentUpload.single('media'), async (req, res) => {
  try {
    const file = req.file
    if (!file) return res.status(400).json({ error: 'Media file is required' })
    const mediaType = file.mimetype.startsWith('video/') ? 'video' : file.mimetype.startsWith('audio/') ? 'audio' : 'image'
    try {
      const uploaded = await uploadImage(file.buffer, 'hincton/content')
      return res.status(201).json({ url: uploaded.url, publicId: uploaded.publicId, mediaType })
    } catch {
      const url = saveLocalContentMedia(file)
      return res.status(201).json({ url, publicId: url, mediaType })
    }
  } catch (error) {
    console.error('Content upload error:', error)
    res.status(500).json({ error: 'Failed to upload media' })
  }
})

// === BANNER MANAGEMENT ===
router.get('/banners', async (req, res) => {
  try {
    const banners = await prisma.systemSetting.findMany({
      where: { group: 'banner' },
      orderBy: { key: 'asc' }
    })

    const formattedBanners = banners.map(banner => ({
      id: banner.id,
      key: banner.key,
      title: JSON.parse(banner.value).title || '',
      subtitle: JSON.parse(banner.value).subtitle || '',
      imageUrl: JSON.parse(banner.value).imageUrl || '',
      linkUrl: JSON.parse(banner.value).linkUrl || '',
      isActive: JSON.parse(banner.value).isActive || false,
      position: JSON.parse(banner.value).position || 'home',
      createdAt: banner.createdAt,
      updatedAt: banner.updatedAt
    }))

    res.json({ banners: formattedBanners })
  } catch (error) {
    console.error('Get banners error:', error)
    res.status(500).json({ error: 'Failed to get banners' })
  }
})

router.post('/banners', async (req, res) => {
  try {
    const bannerData = z.object({
      title: z.string().min(1),
      subtitle: z.string().optional(),
      imageUrl: z.string().url(),
      linkUrl: z.string().url().optional(),
      isActive: z.boolean().default(true),
      position: z.enum(['home', 'category', 'product']).default('home')
    }).parse(req.body)

    const key = `banner_${Date.now()}`
    const value = JSON.stringify(bannerData)

    const banner = await prisma.systemSetting.create({
      data: {
        key,
        value,
        type: 'json',
        group: 'banner',
        description: `Banner: ${bannerData.title}`,
        isPublic: true
      }
    })

    res.status(201).json({ message: 'Banner created', banner })
  } catch (error) {
    console.error('Create banner error:', error)
    res.status(500).json({ error: 'Failed to create banner' })
  }
})

router.put('/banners/:id', async (req, res) => {
  try {
    const { id } = req.params
    const bannerData = z.object({
      title: z.string().min(1).optional(),
      subtitle: z.string().optional(),
      imageUrl: z.string().url().optional(),
      linkUrl: z.string().url().optional(),
      isActive: z.boolean().optional(),
      position: z.enum(['home', 'category', 'product']).optional()
    }).parse(req.body)

    const existingBanner = await prisma.systemSetting.findUnique({
      where: { id }
    })

    if (!existingBanner) return res.status(404).json({ error: 'Banner not found' })

    const currentData = JSON.parse(existingBanner.value)
    const updatedData = { ...currentData, ...bannerData }
    const value = JSON.stringify(updatedData)

    const banner = await prisma.systemSetting.update({
      where: { id },
      data: { value }
    })

    res.json({ message: 'Banner updated', banner })
  } catch (error) {
    console.error('Update banner error:', error)
    res.status(500).json({ error: 'Failed to update banner' })
  }
})

router.delete('/banners/:id', async (req, res) => {
  try {
    const { id } = req.params

    await prisma.systemSetting.delete({
      where: { id }
    })

    res.json({ message: 'Banner deleted successfully' })
  } catch (error) {
    console.error('Delete banner error:', error)
    res.status(500).json({ error: 'Failed to delete banner' })
  }
})

// === BLOG MANAGEMENT ===
router.get('/blog', async (req, res) => {
  try {
    const { page = '1', limit = '20', status, search } = req.query
    const pageNum = Math.max(1, parseInt(String(page), 10) || 1)
    const limitNum = Math.max(1, parseInt(String(limit), 10) || 20)
    const skip = (pageNum - 1) * limitNum

    const where: any = {}
    
    if (status === 'published') where.status = 'PUBLISHED'
    if (status === 'draft') where.status = 'DRAFT'
    if (search) {
      where.OR = [
        { title: { contains: String(search), mode: 'insensitive' } },
        { content: { contains: String(search), mode: 'insensitive' } },
        { excerpt: { contains: String(search), mode: 'insensitive' } }
      ]
    }

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: { id: true, username: true, profile: { select: { firstName: true, lastName: true } } } },
          _count: { select: { comments: true } }
        }
      }),
      prisma.blogPost.count({ where })
    ])

    res.json({
      posts,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) }
    })
  } catch (error) {
    console.error('Get blog posts error:', error)
    res.status(500).json({ error: 'Failed to get blog posts' })
  }
})

router.post('/blog', async (req: any, res) => {
  try {
    const postData = z.object({
      title: z.string().min(1),
      slug: z.string().min(1),
      content: z.string().min(1),
      excerpt: z.string().optional(),
      featuredImage: z.string().min(1).optional(),
      category: z.string().optional(),
      isPublished: z.boolean().default(false),
      isFeatured: z.boolean().default(false),
      tags: z.array(z.string()).optional(),
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional()
    }).parse(req.body)

    const { isPublished, metaTitle, metaDescription, tags, ...blogData } = postData
    const post = await prisma.blogPost.create({
      data: {
        ...blogData,
        authorId: req.user!.id,
        tags: tags ? JSON.stringify(tags) : null,
        status: isPublished ? 'PUBLISHED' : 'DRAFT',
        publishedAt: isPublished ? new Date() : null,
        seoTitle: metaTitle,
        seoDescription: metaDescription,
      },
      include: {
        author: { select: { id: true, username: true } }
      }
    })

    res.status(201).json({ message: 'Blog post created', post })
  } catch (error) {
    console.error('Create blog post error:', error)
    res.status(500).json({ error: 'Failed to create blog post' })
  }
})

router.put('/blog/:id', async (req, res) => {
  try {
    const { id } = req.params
    const postData = z.object({
      title: z.string().min(1).optional(),
      slug: z.string().min(1).optional(),
      content: z.string().min(1).optional(),
      excerpt: z.string().optional(),
      featuredImage: z.string().min(1).optional(),
      category: z.string().optional(),
      isPublished: z.boolean().optional(),
      isFeatured: z.boolean().optional(),
      tags: z.array(z.string()).optional(),
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional()
    }).parse(req.body)

    const { isPublished, metaTitle, metaDescription, tags, ...blogData } = postData
    const post = await prisma.blogPost.update({
      where: { id },
      data: {
        ...blogData,
        ...(tags && { tags: JSON.stringify(tags) }),
        ...(typeof isPublished === 'boolean' && { status: isPublished ? 'PUBLISHED' : 'DRAFT', publishedAt: isPublished ? new Date() : null }),
        ...(metaTitle !== undefined && { seoTitle: metaTitle }),
        ...(metaDescription !== undefined && { seoDescription: metaDescription }),
      },
      include: {
        author: { select: { id: true, username: true } }
      }
    })

    res.json({ message: 'Blog post updated', post })
  } catch (error) {
    console.error('Update blog post error:', error)
    res.status(500).json({ error: 'Failed to update blog post' })
  }
})

router.delete('/blog/:id', async (req, res) => {
  try {
    const { id } = req.params

    await prisma.blogPost.delete({
      where: { id }
    })

    res.json({ message: 'Blog post deleted successfully' })
  } catch (error) {
    console.error('Delete blog post error:', error)
    res.status(500).json({ error: 'Failed to delete blog post' })
  }
})

// === CATEGORY MANAGEMENT ===
router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { products: true } },
        parent: { select: { id: true, name: true } },
        children: {
          select: { id: true, name: true },
          orderBy: { name: 'asc' }
        }
      }
    })

    res.json({ categories })
  } catch (error) {
    console.error('Get categories error:', error)
    res.status(500).json({ error: 'Failed to get categories' })
  }
})

router.post('/categories', async (req, res) => {
  try {
    const categoryData = z.object({
      name: z.string().min(1),
      slug: z.string().min(1),
      description: z.string().optional(),
      image: z.string().min(1).optional(),
      parentId: z.string().optional(),
      isActive: z.boolean().default(true),
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional()
    }).parse(req.body)

    const category = await prisma.category.create({
      data: categoryData,
      include: {
        parent: true,
        children: true
      }
    })
    await cacheService.deleteByPrefix('categories:')

    res.status(201).json({ message: 'Category created', category })
  } catch (error) {
    console.error('Create category error:', error)
    res.status(500).json({ error: 'Failed to create category' })
  }
})

router.put('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params
    const categoryData = z.object({
      name: z.string().min(1).optional(),
      slug: z.string().min(1).optional(),
      description: z.string().optional(),
      image: z.string().min(1).optional(),
      parentId: z.string().optional(),
      isActive: z.boolean().optional(),
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional()
    }).parse(req.body)

    const category = await prisma.category.update({
      where: { id },
      data: categoryData,
      include: {
        parent: true,
        children: true
      }
    })
    await cacheService.deleteByPrefix('categories:')

    res.json({ message: 'Category updated', category })
  } catch (error) {
    console.error('Update category error:', error)
    res.status(500).json({ error: 'Failed to update category' })
  }
})

router.delete('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params
    await prisma.$transaction([
      prisma.product.updateMany({ where: { categoryId: id }, data: { categoryId: null } }),
      prisma.category.updateMany({ where: { parentId: id }, data: { parentId: null } }),
      prisma.couponCategory.deleteMany({ where: { categoryId: id } }),
      prisma.category.delete({ where: { id } }),
    ])
    await cacheService.deleteByPrefix('categories:')
    res.json({ message: 'Category deleted successfully' })
  } catch (error) {
    console.error('Delete category error:', error)
    res.status(500).json({ error: 'Failed to delete category' })
  }
})

// === NAVIGATION MANAGEMENT ===
router.get('/navigation', async (req, res) => {
  try {
    const navigation = await prisma.systemSetting.findMany({
      where: { group: 'navigation' },
      orderBy: { key: 'asc' }
    })

    const formattedNavigation = navigation.map(item => ({
      id: item.id,
      key: item.key,
      ...JSON.parse(item.value)
    }))

    res.json({ navigation: formattedNavigation })
  } catch (error) {
    console.error('Get navigation error:', error)
    res.status(500).json({ error: 'Failed to get navigation' })
  }
})

router.post('/navigation', async (req, res) => {
  try {
    const navData = z.object({
      label: z.string().min(1),
      url: z.string().min(1),
      order: z.number().int().default(0),
      isActive: z.boolean().default(true),
      parentKey: z.string().optional()
    }).parse(req.body)

    const key = `nav_${Date.now()}`
    const value = JSON.stringify(navData)

    const navigation = await prisma.systemSetting.create({
      data: {
        key,
        value,
        type: 'json',
        group: 'navigation',
        description: `Navigation: ${navData.label}`,
        isPublic: true
      }
    })

    res.status(201).json({ message: 'Navigation item created', navigation })
  } catch (error) {
    console.error('Create navigation error:', error)
    res.status(500).json({ error: 'Failed to create navigation' })
  }
})

router.put('/navigation/:id', async (req, res) => {
  try {
    const { id } = req.params
    const navData = z.object({
      label: z.string().min(1).optional(),
      url: z.string().min(1).optional(),
      order: z.number().int().optional(),
      isActive: z.boolean().optional(),
      parentKey: z.string().optional()
    }).parse(req.body)

    const existingNav = await prisma.systemSetting.findUnique({
      where: { id }
    })

    if (!existingNav) return res.status(404).json({ error: 'Navigation item not found' })

    const currentData = JSON.parse(existingNav.value)
    const updatedData = { ...currentData, ...navData }
    const value = JSON.stringify(updatedData)

    const navigation = await prisma.systemSetting.update({
      where: { id },
      data: { value }
    })

    res.json({ message: 'Navigation item updated', navigation })
  } catch (error) {
    console.error('Update navigation error:', error)
    res.status(500).json({ error: 'Failed to update navigation' })
  }
})

// === CONTACT FORM SUBMISSION ===
router.post('/contact/submit', async (req, res) => {
  try {
    const userId = (req as any).user?.id
    const contactData = z.object({
      name: z.string().min(1),
      email: z.string().email(),
      phone: z.string().optional(),
      subject: z.string().min(1),
      message: z.string().min(1)
    }).parse(req.body)

    const ticket = await prisma.supportTicket.create({
      data: {
        userId,
        subject: contactData.subject,
        message: [
          `From: ${contactData.name} <${contactData.email}>`,
          contactData.phone ? `Phone: ${contactData.phone}` : null,
          '',
          contactData.message,
        ].filter(Boolean).join('\n'),
        category: 'GENERAL_INQUIRY',
        priority: 'LOW',
        status: 'OPEN'
      }
    })

    console.log('Contact form submission saved:', contactData)
    emitContactUpdate(req, 'contact:message-created', {
      ticketId: ticket.id,
      status: ticket.status,
      subject: ticket.subject,
      createdAt: ticket.createdAt,
    })

    res.json({ message: 'Contact form submitted successfully', ticketId: ticket.id })
  } catch (error) {
    console.error('Contact form submission error:', error)
    res.status(500).json({ error: 'Failed to submit contact form' })
  }
})

// === ADMIN: GET ALL CONTACT MESSAGES ===
router.get('/admin/contact-messages', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'OPEN', search } = req.query

    const where: any = {
      category: { in: ['GENERAL_INQUIRY', 'FEEDBACK'] }
    }

    if (status) {
      where.status = status
    }

    if (search) {
      where.OR = [
        { subject: { contains: search as string, mode: 'insensitive' } },
        { message: { contains: search as string, mode: 'insensitive' } }
      ]
    }

    const tickets = await prisma.supportTicket.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                fullName: true,
                avatar: true
              }
            }
          }
        },
        responses: {
          select: {
            id: true,
            message: true,
            createdAt: true,
            userId: true,
            isAdmin: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit)
    })

    const total = await prisma.supportTicket.count({ where })
    const respondentIds = Array.from(new Set(tickets.flatMap(ticket => ticket.responses.map(response => response.userId)).filter(Boolean)))
    const respondents = respondentIds.length > 0
      ? await prisma.user.findMany({
        where: { id: { in: respondentIds } },
        select: {
          id: true,
          email: true,
          profile: { select: { fullName: true } }
        }
      })
      : []
    const respondentsById = new Map(respondents.map(user => [user.id, user]))

    res.json({
      success: true,
      messages: tickets.map(ticket => ({
        ...ticket,
        ticketNumber: `T-${String(ticket.id).slice(0,8).toUpperCase()}`,
        contactInfo: {
          senderName: ticket.user.profile?.fullName || ticket.user.email,
          senderEmail: ticket.user.email,
          senderPhone: null
        },
        responses: ticket.responses.map(response => ({
          ...response,
          respondent: respondentsById.get(response.userId) || null
        }))
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    })
  } catch (error) {
    console.error('Get contact messages error:', error)
    res.status(500).json({ error: 'Failed to retrieve contact messages' })
  }
})

// === ADMIN: RESPOND TO CONTACT MESSAGE ===
router.post('/admin/contact-messages/:ticketId/respond', requireAdmin, async (req, res) => {
  try {
    const { ticketId } = req.params
    const { message } = req.body
    const adminId = (req as any).user?.id

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Response message is required' })
    }

    // Verify ticket exists
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId }
    })

    if (!ticket) {
      return res.status(404).json({ error: 'Contact message not found' })
    }

    // Create response
    const response = await prisma.supportTicketResponse.create({
      data: {
        ticketId,
        message,
        userId: adminId,
        isAdmin: true
      }
    })

    // Update ticket status
    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status: 'IN_PROGRESS' }
    })
    emitContactUpdate(req, 'contact:message-updated', {
      ticketId,
      status: 'IN_PROGRESS',
      responseId: response.id,
    })

    res.json({
      success: true,
      message: 'Response added successfully',
      response
    })
  } catch (error) {
    console.error('Respond to contact message error:', error)
    res.status(500).json({ error: 'Failed to respond to contact message' })
  }
})

// === ADMIN: CLOSE/RESOLVE CONTACT MESSAGE ===
router.patch('/admin/contact-messages/:ticketId/close', requireAdmin, async (req, res) => {
  try {
    const { ticketId } = req.params

    const ticket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status: 'RESOLVED' }
    })
    emitContactUpdate(req, 'contact:message-updated', {
      ticketId,
      status: ticket.status,
    })

    res.json({
      success: true,
      message: 'Contact message closed successfully',
      ticket
    })
  } catch (error) {
    console.error('Close contact message error:', error)
    res.status(500).json({ error: 'Failed to close contact message' })
  }
})

export default router
