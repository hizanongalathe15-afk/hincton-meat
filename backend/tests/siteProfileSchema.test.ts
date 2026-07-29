import test from 'node:test'
import assert from 'node:assert/strict'
import { siteProfileSchema } from '../src/routes/contentManagement'

test('allows blank brand fields so a storefront can be cleared', () => {
  const parsed = siteProfileSchema.parse({
    brand: {
      name: '',
      tagline: '',
      mantra: '',
      website: '',
      phone: '',
      phoneHref: '',
      email: '',
      emailHref: '',
      address: '',
      socialHandle: '',
      logo: '',
      socialLinks: [],
    },
    footer: {
      startYear: 2026,
      autoUpdateCurrentYear: true,
      endYear: null,
      companyName: '',
      allRightsReservedText: '',
      customCopyrightLine: '',
    },
    featureToggles: {},
    payments: { bnpl: [], digitalWallets: [], crypto: [] },
    trust: {
      badges: [],
      sustainability: [],
      viewCounterWindowMinutes: 15,
      recentPurchaseWindowHours: 48,
      socialProofMode: 'OFF',
    },
    gamification: {
      welcomePoints: 0,
      pointsPerOrder: 0,
      pointsPerReview: 0,
      pointsPerReferral: 0,
      spinWinDailyLimit: 0,
      loyaltyBadgeThresholds: {},
    },
    seo: {
      enableJsonLd: false,
      enableBreadcrumbsLd: false,
      enableFaqsLd: false,
      enableVoiceSearchMeta: false,
      defaultKeywords: [],
    },
    newsletter: {
      exitIntentEnabled: false,
      exitIntentDelayMs: 5000,
      popupTitle: '',
      popupSubtitle: '',
      footerCta: '',
    },
    currencies: [],
    companyProfile: '',
    mission: '',
    vision: '',
    procurementCommitment: '',
    markets: [],
    qualityPoints: [],
    images: {
      hero: '',
      about: '',
      market: '',
      logo: '',
    },
    heroSlides: [],
    pages: {},
    terms: [],
    privacy: [],
    helpCenter: { faqs: [], guides: [] },
    appInfo: {
      version: '',
      build: '',
      platform: '',
      lastUpdated: '',
      permissions: [],
      features: [],
      developerContact: '',
      legalNotices: [],
      channelReports: [],
    },
  })

  assert.equal(parsed.brand.name, '')
  assert.equal(parsed.images.logo, '')
})
