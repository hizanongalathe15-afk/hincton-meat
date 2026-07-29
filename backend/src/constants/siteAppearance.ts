export const DEFAULT_SITE_THEME: Record<string, string> = {
  primary: '#dc2626',
  accent: '#f59e0b',
  page: '#fffaf7',
  surface: '#ffffff',
  text: '#1c1917',
  muted: '#78716c',
  border: '#e7e5e4',
  buttonText: '#ffffff',
  header: '#ffffff',
  ad: '#fff1f2',
  success: '#16a34a',
  info: '#2563eb',
  warning: '#d97706',
  danger: '#dc2626',
  link: '#2563eb',
  footer: '#111827',
  footerText: '#f9fafb',
  navText: '#374151',
  navActive: '#dc2626',
  card: '#ffffff',
  overlay: 'rgba(17, 24, 39, 0.55)',
  shadow: 'rgba(28, 25, 23, 0.12)',
}

export const BLANK_SITE_THEME: Record<string, string> = {
  primary: '#6b7280',
  accent: '#9ca3af',
  page: '#ffffff',
  surface: '#ffffff',
  text: '#111827',
  muted: '#6b7280',
  border: '#e5e7eb',
  buttonText: '#ffffff',
  header: '#ffffff',
  ad: '#f9fafb',
  success: '#6b7280',
  info: '#6b7280',
  warning: '#d97706',
  danger: '#ef4444',
  link: '#2563eb',
  footer: '#f3f4f6',
  footerText: '#111827',
  navText: '#374151',
  navActive: '#111827',
  card: '#ffffff',
  overlay: 'rgba(0, 0, 0, 0.4)',
  shadow: 'rgba(0, 0, 0, 0.08)',
}

const emptyImages = () => ({
  hero: '',
  about: '',
  market: '',
  logo: '',
  contact: '',
  farms: '',
  sustainability: '',
  careers: '',
  blog: '',
  wellness: '',
  returns: '',
  maintenance: '',
  downloadThankYou: '',
})

export const buildBlankSiteProfile = () => ({
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
    socialLinks: [] as Array<{ label: string; url: string }>,
  },
  footer: {
    startYear: new Date().getFullYear(),
    autoUpdateCurrentYear: true,
    endYear: null as number | null,
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
    socialProofMode: 'OFF' as const,
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
    defaultKeywords: [] as string[],
  },
  newsletter: {
    exitIntentEnabled: false,
    exitIntentDelayMs: 5000,
    popupTitle: '',
    popupSubtitle: '',
    footerCta: '',
  },
  currencies: [] as Array<{ code: string; symbol: string; label: string; rate: number; isDefault: boolean }>,
  companyProfile: '',
  mission: '',
  vision: '',
  procurementCommitment: '',
  markets: [] as string[],
  qualityPoints: [] as string[],
  images: emptyImages(),
  heroSlides: [] as Array<{ image: string; alt?: string }>,
  pages: {} as Record<string, unknown>,
  terms: [] as Array<{ title: string; body: string }>,
  privacy: [] as Array<{ title: string; body: string }>,
  helpCenter: { faqs: [], guides: [] },
  appInfo: {
    version: '',
    build: '',
    platform: '',
    lastUpdated: '',
    permissions: [] as string[],
    features: [] as string[],
    developerContact: '',
    legalNotices: [] as string[],
    channelReports: [] as string[],
  },
})

export const THEME_COLOR_KEYS = [
  'primary', 'accent', 'page', 'surface', 'text', 'muted', 'border', 'buttonText',
  'header', 'ad', 'success', 'info', 'warning', 'danger', 'link', 'footer',
  'footerText', 'navText', 'navActive', 'card', 'overlay', 'shadow',
] as const

export const mergeTheme = (saved: Record<string, string> | null | undefined) => ({
  ...DEFAULT_SITE_THEME,
  ...(saved || {}),
})

export const normalizeTheme = (input: Record<string, string>) => {
  const theme: Record<string, string> = { ...DEFAULT_SITE_THEME }
  Object.entries(input || {}).forEach(([key, value]) => {
    if (typeof value === 'string' && value.trim()) {
      theme[key] = value.trim()
    }
  })
  return theme
}
