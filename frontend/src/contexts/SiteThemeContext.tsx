import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../services/api'

export type SiteTheme = Record<string, string>

export const defaultSiteTheme: SiteTheme = {
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
  laserColor: '#22c55e',
  glassTint: 'rgba(255, 255, 255, 0.65)',
  glassBorder: 'rgba(255, 255, 255, 0.35)',
}

export const blankSiteTheme: SiteTheme = {
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

export const themeColorFields = [
  ['primary', 'Primary', 'Buttons, links, highlights'],
  ['accent', 'Accent', 'Badges and secondary CTAs'],
  ['page', 'Page background', 'Main canvas behind content'],
  ['surface', 'Surface', 'Cards, modals, inputs'],
  ['text', 'Text', 'Headings and body copy'],
  ['muted', 'Muted text', 'Labels and secondary copy'],
  ['border', 'Borders', 'Dividers and outlines'],
  ['buttonText', 'Button text', 'Text on primary buttons'],
  ['header', 'Header', 'Navigation bar background'],
  ['ad', 'Promotion', 'Ads and promo strips'],
  ['success', 'Success', 'Confirmed actions'],
  ['info', 'Info', 'Neutral notices'],
  ['warning', 'Warning', 'Caution states'],
  ['danger', 'Danger', 'Errors and destructive actions'],
  ['link', 'Links', 'Hyperlink colour'],
  ['footer', 'Footer background', 'Footer bar'],
  ['footerText', 'Footer text', 'Footer copy'],
  ['navText', 'Nav text', 'Navigation labels'],
  ['navActive', 'Nav active', 'Active nav item'],
  ['card', 'Card', 'Card backgrounds'],
  ['overlay', 'Overlay', 'Modals and dimmed backdrops'],
  ['shadow', 'Shadow tint', 'Soft shadow colour'],
  ['laserColor', 'Laser Scanner Beam', 'QR Scanner Laser Beam & Particle Glow'],
  ['glassTint', 'Glass Tint', 'Glassmorphism backdrop tint overlay'],
  ['glassBorder', 'Glass Border', 'Glassmorphism card edge sheen'],
] as const

const SiteThemeContext = createContext<{
  theme: SiteTheme
  applyTheme: (theme: SiteTheme) => void
} | undefined>(undefined)

export const applySiteTheme = (theme: SiteTheme) => {
  const root = document.documentElement
  root.dataset.siteTheme = 'custom'
  Object.entries({ ...defaultSiteTheme, ...theme }).forEach(([key, value]) => {
    if (value) {
      root.style.setProperty(`--site-${key}`, value)
      if (key === 'laserColor') {
        root.style.setProperty('--laser-color', value)
      }
    }
  })
}

export const SiteThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<SiteTheme>(() => {
    try {
      const cached = localStorage.getItem('hincton_site_theme')
      return cached ? { ...defaultSiteTheme, ...JSON.parse(cached) } : defaultSiteTheme
    } catch {
      return defaultSiteTheme
    }
  })

  const applyTheme = (next: SiteTheme) => {
    const merged = { ...defaultSiteTheme, ...next }
    setTheme(merged)
    applySiteTheme(merged)
    try {
      localStorage.setItem('hincton_site_theme', JSON.stringify(merged))
    } catch {}
  }

  useEffect(() => {
    applySiteTheme(theme)
    api.get('/content/site-theme')
      .then(({ data }) => {
        if (data.theme) applyTheme(data.theme)
      })
      .catch(() => undefined)
  }, [])

  return <SiteThemeContext.Provider value={{ theme, applyTheme }}>{children}</SiteThemeContext.Provider>
}

export const useSiteTheme = () => {
  const context = useContext(SiteThemeContext)
  if (!context) throw new Error('useSiteTheme must be used within SiteThemeProvider')
  return context
}
