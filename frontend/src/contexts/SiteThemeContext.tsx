import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../services/api'

export type SiteTheme = Record<string, string>

export const defaultSiteTheme: SiteTheme = {
  primary: '#dc2626', accent: '#f59e0b', page: '#fffaf7', surface: '#ffffff',
  text: '#1c1917', muted: '#78716c', border: '#e7e5e4', buttonText: '#ffffff',
  header: '#ffffff', ad: '#fff1f2', success: '#16a34a', info: '#2563eb',
}

const SiteThemeContext = createContext<{ theme: SiteTheme; applyTheme: (theme: SiteTheme) => void } | undefined>(undefined)

export const applySiteTheme = (theme: SiteTheme) => {
  const root = document.documentElement
  root.dataset.siteTheme = 'custom'
  Object.entries({ ...defaultSiteTheme, ...theme }).forEach(([key, value]) => root.style.setProperty(`--site-${key}`, value))
}

export const SiteThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<SiteTheme>(defaultSiteTheme)
  const applyTheme = (next: SiteTheme) => { const merged = { ...defaultSiteTheme, ...next }; setTheme(merged); applySiteTheme(merged) }

  useEffect(() => {
    applySiteTheme(defaultSiteTheme)
    api.get('/content/site-theme').then(({ data }) => applyTheme(data.theme || defaultSiteTheme)).catch(() => undefined)
  }, [])

  return <SiteThemeContext.Provider value={{ theme, applyTheme }}>{children}</SiteThemeContext.Provider>
}

export const useSiteTheme = () => {
  const context = useContext(SiteThemeContext)
  if (!context) throw new Error('useSiteTheme must be used within SiteThemeProvider')
  return context
}
