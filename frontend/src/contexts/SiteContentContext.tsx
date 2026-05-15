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
  }
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
  }
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
  },
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
      const response = await api.get('/content/site-profile')
      const saved = response.data.profile || {}
      setProfile({
        ...defaultSiteProfile,
        ...saved,
        brand: { ...defaultSiteProfile.brand, ...(saved.brand || {}) },
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
