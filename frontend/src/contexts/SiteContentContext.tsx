import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { COMPANY_PROFILE, HINCTON_BRAND, HINCTON_MARKETS, HINCTON_QUALITY_POINTS } from '../utils/hinctonBrand'
import api from '../services/contentApi'

export type SitePageContent = {
  title: string
  subtitle: string
  body: string
  image: string
  video?: string
  sections: Array<{ title: string; body: string; image?: string; video?: string; linkLabel?: string; linkUrl?: string }>
}

export interface SiteProfile {
  brand: typeof HINCTON_BRAND & {
    socialLinks?: Array<{ label: string; url: string }>
    whatsapp?: string
    supportPhone?: string
  }
  footer: {
    startYear: number
    autoUpdateCurrentYear: boolean
    endYear: number | null
    companyName: string | null
    allRightsReservedText: string | null
    customCopyrightLine: string | null
  }
  featureToggles: Record<string, boolean | number | string>
  payments: {
    bnpl: Array<{ code: string; label: string; enabled: boolean; description?: string; learnMoreUrl?: string }>
    digitalWallets: Array<{ code: string; label: string; enabled: boolean }>
    crypto: Array<{ code: string; label: string; enabled: boolean; walletAddress?: string }>
  }
  trust: {
    badges: Array<{ code: string; label: string; description?: string }>
    sustainability: Array<{ code: string; label: string; icon?: string }>
    viewCounterWindowMinutes: number
    recentPurchaseWindowHours: number
    socialProofMode: 'REAL_ONLY' | 'REAL_FALLBACK_SIMULATED' | 'SIMULATED_ONLY' | 'OFF'
  }
  gamification: {
    welcomePoints: number
    pointsPerOrder: number
    pointsPerReview: number
    pointsPerReferral: number
    spinWinDailyLimit: number
    loyaltyBadgeThresholds: Record<string, Record<string, number>>
  }
  seo: {
    enableJsonLd: boolean
    enableBreadcrumbsLd: boolean
    enableFaqsLd: boolean
    enableVoiceSearchMeta: boolean
    defaultKeywords: string[]
  }
  newsletter: {
    exitIntentEnabled: boolean
    exitIntentDelayMs: number
    popupTitle: string
    popupSubtitle: string
    footerCta: string
  }
  currencies: Array<{
    code: string
    symbol: string
    label: string
    rate: number
    isDefault: boolean
  }>
  companyProfile: string
  mission: string
  vision: string
  procurementCommitment: string
  markets: string[]
  qualityPoints: string[]
  images: {
    hero: string
    about: string
    market: string
    logo: string
    contact?: string
    farms?: string
    sustainability?: string
    careers?: string
    blog?: string
    wellness?: string
    returns?: string
    maintenance?: string
    downloadThankYou?: string
  }
  heroSlides: Array<{ image: string; alt?: string }>
  pages: Record<string, SitePageContent>
  terms: Array<{ title: string; body: string }>
  privacy: Array<{ title: string; body: string }>
  helpCenter: {
    faqs: Array<{ question: string; answer: string; category: string }>
    guides: Array<{ title: string; content: string; category: string }>
  }
  appInfo: {
    version: string
    build: string
    platform: string
    lastUpdated: string
    permissions: string[]
    features: string[]
    developerContact: string
    legalNotices: string[]
    channelReports: string[]
  }
}

export const defaultSiteProfile: SiteProfile = {
  brand: HINCTON_BRAND,
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
  companyProfile: COMPANY_PROFILE,
  mission: 'To deliver fresh, high-quality meat products while upholding the highest standards of food safety, animal welfare, and environmental sustainability.',
  vision: 'To be the leading global provider of premium meat products, known for excellence in quality, sustainability, and ethical sourcing practices.',
  procurementCommitment: 'We prioritize ethical and sustainable livestock procurement by partnering with trusted farmers and suppliers who meet strict standards.',
  markets: [...HINCTON_MARKETS],
  qualityPoints: [...HINCTON_QUALITY_POINTS],
  images: {
    hero: '/hincton/hero-platter.webp',
    about: '/hincton/beef-fresh.webp',
    market: '/hincton/cattle-market.webp',
    logo: HINCTON_BRAND.logo,
    contact: '/hincton/hero-platter.webp',
    farms: '/hincton/cattle-market.webp',
    sustainability: '/hincton/beef-fresh.webp',
    careers: '/hincton/logo.png',
    blog: '/hincton/hero-platter.webp',
    wellness: '/hincton/beef-fresh.webp',
    returns: '/hincton/hero-platter.webp',
    maintenance: '/hincton/hero-platter.webp',
    downloadThankYou: '/hincton/logo.png',
  },
  heroSlides: [],
  pages: {
    about: {
      title: 'About Us',
      subtitle: 'Quality, freshness, and integrity from supplier to customer.',
      body: COMPANY_PROFILE,
      image: '/hincton/beef-fresh.webp',
      sections: [],
    },
    farms: {
      title: 'Our Farms',
      subtitle: 'Trusted supplier relationships and transparent sourcing.',
      body: 'We work with farms and suppliers that meet our quality, food safety, and handling standards.',
      image: '/hincton/cattle-market.webp',
      sections: [],
    },
    provenance: {
      title: 'What Our Customers Cooked & Farm Provenance',
      subtitle: 'See real culinary creations from our Nairobi home chefs and trace our direct ethical sourcing from Kenyan highland pastures.',
      body: '',
      image: '/hincton/cattle-market.webp',
      sections: [
        { title: 'Naivasha & Laikipia Pastures', body: 'Our cattle graze naturally on pesticide-free Kenyan highland pastures with free access to mineral springs. 100% grass-fed and finished for healthy omega fats and deep beef flavor.', image: '', linkLabel: '100% Halal & Vet Certified', linkUrl: '' },
        { title: 'Sourced at 6:00 AM Daily', body: 'Every carcass is processed at dawn under strict cold-chain supervision. Never frozen twice, ensuring natural juices and enzymes remain preserved from the counter to your doorstep.', image: '', linkLabel: 'Strict 2°C Cold Chain', linkUrl: '' },
        { title: 'Hand-Trimmed by Master Cutters', body: 'Every cut is hand-portioned by veteran Kenyan butchers with 15+ years experience. Custom thicknesses, special marinades, or bone-in cuts available upon request on WhatsApp.', image: '', linkLabel: 'Custom Cut Precision', linkUrl: '' },
      ],
    },
    sustainability: {
      title: 'Sustainability',
      subtitle: 'Responsible sourcing, cold-chain handling, and reduced waste.',
      body: 'Our sustainability approach focuses on efficient operations, responsible procurement, and safe product handling.',
      image: '/hincton/beef-fresh.webp',
      sections: [],
    },
    contact: {
      title: 'Contact',
      subtitle: 'Talk to our team about orders, supply, delivery, or partnerships.',
      body: COMPANY_PROFILE,
      image: '/hincton/hero-platter.webp',
      sections: [],
    },
    careers: {
      title: 'Careers',
      subtitle: 'Join the team behind Hincton Meat Products.',
      body: 'Explore roles in operations, delivery, customer care, procurement, technology, and retail support.',
      image: '/hincton/logo.png',
      sections: [
        { title: 'Our Team', body: 'Admin can add team crew profiles, images, and role descriptions from the content manager.' },
        { title: 'Open Applications', body: 'Share your details and the team will contact you when a suitable role opens.' },
      ],
    },
    wellness: {
      title: 'Wellness',
      subtitle: 'Practical food handling, nutrition, and kitchen guidance.',
      body: 'Read practical guidance for safe storage, balanced meals, preparation, and freshness.',
      image: '/hincton/beef-fresh.webp',
      sections: [],
    },
    returns: {
      title: 'Returns',
      subtitle: 'Clear support for order, quality, and delivery issues.',
      body: 'Because fresh products are perishable, returns are reviewed quickly with order details, timing, and supporting photos where relevant.',
      image: '/hincton/hero-platter.webp',
      sections: [],
    },
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
    blog: {
      title: 'Blog',
      subtitle: 'Stories, guides, updates, and recipes from the Hincton team.',
      body: 'Browse posts from the admin-managed blog.',
      image: '/hincton/hero-platter.webp',
      sections: [],
    },
  },
  terms: [],
  privacy: [],
  helpCenter: {
    faqs: [
      { question: 'How do I place an order?', answer: 'Browse products, add items to cart, proceed to checkout, enter delivery details, and complete payment via M-PESA or card.', category: 'ordering' },
      { question: 'What payment methods do you accept?', answer: 'We accept M-PESA, card payments, and configured pay-on-delivery options where available.', category: 'payment' },
      { question: 'How can I track my order?', answer: 'Use the order tracking page with your order number, or check your profile orders section.', category: 'delivery' },
      { question: 'What is your return policy?', answer: 'Because meat is perishable, returns are limited. Contact support immediately if there are quality or delivery issues.', category: 'returns' },
      { question: 'How do I create an account?', answer: 'Open signup, enter your name, email, phone number, and password, then verify your details when prompted.', category: 'account' },
    ],
    guides: [
      { title: 'Getting Started Guide', content: 'Create an account, browse products, add items to cart, and place your first order.', category: 'getting-started' },
      { title: 'Payment Guide', content: 'Complete payments through the available M-PESA, card, or checkout options.', category: 'payment' },
      { title: 'Delivery Information', content: 'Review delivery times, supported locations, and order tracking information.', category: 'delivery' },
    ],
  },
  appInfo: {
    version: '1.0.0',
    build: '2026.05.14',
    platform: 'Web Application',
    lastUpdated: 'May 14, 2026',
    developerContact: '0797416181',
    permissions: [
      'Location access for delivery coordination',
      'Camera access for profile and review images',
      'Notification permissions for order updates',
      'Storage access for cart and session continuity',
    ],
    features: [
      'Real-time order tracking',
      'Secure M-PESA payments',
      'Product reviews and ratings',
      'Push notifications',
      'Multi-language support',
      'Editable public content',
    ],
    legalNotices: [
      'Terms and Conditions',
      'Privacy Policy',
      'Cookie Policy',
      'Open-source license notices',
    ],
    channelReports: [
      'Sales channel performance',
      'Customer support and feedback reports',
      'Marketing broadcast delivery summaries',
    ],
  },
}

const compactObject = <T extends Record<string, unknown>>(value: T): Partial<T> =>
  Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined && item !== null && item !== '')) as Partial<T>

const phoneToHref = (phone?: string, fallback?: string) => {
  const trimmed = phone?.trim()
  if (!trimmed) return fallback
  if (trimmed.startsWith('tel:')) return trimmed

  const compact = trimmed.replace(/[\s()-]/g, '')
  if (compact.startsWith('+')) return `tel:${compact}`
  if (/^0\d+/.test(compact)) return `tel:+254${compact.slice(1)}`
  return `tel:${compact}`
}

const emailToHref = (email?: string, fallback?: string) => {
  const trimmed = email?.trim()
  if (!trimmed) return fallback
  return trimmed.startsWith('mailto:') ? trimmed : `mailto:${trimmed}`
}

interface SiteContentContextValue {
  profile: SiteProfile
  refresh: () => Promise<void>
}

const SiteContentContext = createContext<SiteContentContextValue | undefined>(undefined)

export const useSiteContent = () => {
  const context = useContext(SiteContentContext)
  if (!context) {
    throw new Error('useSiteContent must be used within a SiteContentProvider')
  }
  return context
}

export const SiteContentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<SiteProfile>(defaultSiteProfile)

  const refresh = async () => {
    try {
      const [profileResponse, commerceResponse] = await Promise.all([
        api.get('/content/site-profile'),
        api.get('/content/commerce-settings').catch(() => ({ data: { settings: null } })),
      ])
      const saved = profileResponse.data.profile || {}
      const commerceGeneral = commerceResponse.data.settings?.general || {}
      const commerceBrand = compactObject({
        name: commerceGeneral.storeName,
        phone: commerceGeneral.storePhone,
        phoneHref: phoneToHref(commerceGeneral.storePhone, saved.brand?.phoneHref),
        email: commerceGeneral.storeEmail,
        emailHref: emailToHref(commerceGeneral.storeEmail, saved.brand?.emailHref),
        address: commerceGeneral.storeAddress,
      })
      setProfile({
        ...defaultSiteProfile,
        ...saved,
        brand: { ...defaultSiteProfile.brand, ...(saved.brand || {}), ...commerceBrand },
        footer: { ...defaultSiteProfile.footer, ...(saved.footer || {}) },
        featureToggles: { ...defaultSiteProfile.featureToggles, ...(saved.featureToggles || {}) },
        payments: {
          bnpl: saved.payments?.bnpl ?? defaultSiteProfile.payments.bnpl,
          digitalWallets: saved.payments?.digitalWallets ?? defaultSiteProfile.payments.digitalWallets,
          crypto: saved.payments?.crypto ?? defaultSiteProfile.payments.crypto,
        },
        trust: {
          ...defaultSiteProfile.trust,
          ...(saved.trust || {}),
          badges: saved.trust?.badges ?? defaultSiteProfile.trust.badges,
          sustainability: saved.trust?.sustainability ?? defaultSiteProfile.trust.sustainability,
        },
        gamification: {
          ...defaultSiteProfile.gamification,
          ...(saved.gamification || {}),
          loyaltyBadgeThresholds: saved.gamification?.loyaltyBadgeThresholds ?? defaultSiteProfile.gamification.loyaltyBadgeThresholds,
        },
        seo: { ...defaultSiteProfile.seo, ...(saved.seo || {}) },
        newsletter: { ...defaultSiteProfile.newsletter, ...(saved.newsletter || {}) },
        currencies: saved.currencies ?? defaultSiteProfile.currencies,
        images: { ...defaultSiteProfile.images, ...(saved.images || {}) },
        pages: { ...defaultSiteProfile.pages, ...(saved.pages || {}) },
        markets: saved.markets || defaultSiteProfile.markets,
        qualityPoints: saved.qualityPoints || defaultSiteProfile.qualityPoints,
        terms: saved.terms || defaultSiteProfile.terms,
        privacy: saved.privacy || defaultSiteProfile.privacy,
        helpCenter: {
          ...defaultSiteProfile.helpCenter,
          ...(saved.helpCenter || {}),
          faqs: saved.helpCenter?.faqs || defaultSiteProfile.helpCenter.faqs,
          guides: saved.helpCenter?.guides || defaultSiteProfile.helpCenter.guides,
        },
        appInfo: { ...defaultSiteProfile.appInfo, ...(saved.appInfo || {}) },
      })
    } catch {
      setProfile(defaultSiteProfile)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  const value = useMemo(() => ({ profile, refresh }), [profile])

  return <SiteContentContext.Provider value={value}>{children}</SiteContentContext.Provider>
}
