import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { COMPANY_PROFILE, HINCTON_BRAND, HINCTON_MARKETS, HINCTON_QUALITY_POINTS } from '../utils/hinctonBrand'
import api from '../services/contentApi'

export interface SiteProfile {
  brand: typeof HINCTON_BRAND
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
    hero: '/hincton/hero-platter.jpg',
    about: '/hincton/beef-fresh.jpg',
    market: '/hincton/cattle-market.jpg',
    logo: HINCTON_BRAND.logo,
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
        markets: saved.markets || defaultSiteProfile.markets,
        qualityPoints: saved.qualityPoints || defaultSiteProfile.qualityPoints,
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
