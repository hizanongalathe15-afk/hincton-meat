import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useSiteContent } from '../contexts/SiteContentContext'

export type CurrencyDef = {
  code: string
  symbol: string
  label: string
  rate: number
  isDefault: boolean
}

export type FormatAmountOptions = {
  minimumFractionDigits?: number
  maximumFractionDigits?: number
}

type CurrencyContextValue = {
  currencies: CurrencyDef[]
  active: CurrencyDef
  setCurrency: (code: string) => void
  convertAmount: (amount: number, fromCode?: string) => number
  formatAmount: (amount: number, opts?: FormatAmountOptions) => string
  formatPriceInline: (amount: number) => string
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null)

const countryCurrency: Record<string, string> = {
  KE: 'KES', UG: 'UGX', TZ: 'TZS', GB: 'GBP', US: 'USD',
  IE: 'EUR', DE: 'EUR', FR: 'EUR', ES: 'EUR', IT: 'EUR', NL: 'EUR',
}

const detectCurrencyCode = (currencies: CurrencyDef[], fallback: string) => {
  if (typeof navigator === 'undefined') return fallback
  const locale = navigator.languages?.[0] || navigator.language || ''
  const country = locale.match(/[-_]([A-Z]{2})\b/i)?.[1]?.toUpperCase()
  const byLocale = country ? countryCurrency[country] : undefined
  const byTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone === 'Africa/Nairobi' ? 'KES' : undefined
  const detected = byLocale || byTimeZone || fallback
  return currencies.some((currency) => currency.code === detected) ? detected : fallback
}

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile } = useSiteContent()
  const currencies: CurrencyDef[] = useMemo(() => {
    const arr = (profile.currencies ?? []).length ? profile.currencies : []
    if (arr.length && !arr.some(c => c.isDefault)) arr[0].isDefault = true
    if (arr.length) return arr
    return [{ code: 'KES', symbol: 'KSh', label: 'Kenyan Shilling', rate: 1, isDefault: true }]
  }, [profile.currencies])

  const defaultCode = currencies.find(c => c.isDefault)?.code ?? currencies[0]?.code ?? 'KES'
  const [activeCode, setActiveCode] = useState<string>(() => detectCurrencyCode(currencies, defaultCode))

  useEffect(() => {
    const available = new Set(currencies.map(c => c.code))
    const detectedCode = detectCurrencyCode(currencies, defaultCode)
    if (!available.has(activeCode) || activeCode !== detectedCode) setActiveCode(detectedCode)
  }, [currencies, activeCode, defaultCode])

  const convertAmount = useCallback((amount: number, fromCode?: string) => {
    const baseCode = fromCode ?? (currencies.find(c => c.isDefault)?.code ?? 'KES')
    const base = currencies.find(c => c.code === baseCode)
    const target = currencies.find(c => c.code === activeCode) ?? currencies[0]
    if (!base) return amount
    const inBase = base.rate === 1 ? amount : amount / base.rate
    return inBase * (target?.rate ?? 1)
  }, [currencies, activeCode])

  const formatAmount = useCallback((amount: number, opts?: FormatAmountOptions) => {
    const target = currencies.find(c => c.code === activeCode) ?? currencies[0]
    const converted = convertAmount(amount)
    const minDigits = opts?.minimumFractionDigits ?? (target.code === 'KES' || target.code === 'UGX' || target.code === 'TZS' ? 0 : 2)
    const maxDigits = opts?.maximumFractionDigits ?? minDigits
    try {
      return new Intl.NumberFormat('en-KE', {
        minimumFractionDigits: minDigits,
        maximumFractionDigits: maxDigits,
      }).format(Number.isFinite(converted) ? converted : 0)
    } catch {
      return String(Math.round(converted * Math.pow(10, maxDigits)) / Math.pow(10, maxDigits))
    }
  }, [currencies, activeCode, convertAmount])

  const formatPriceInline = useCallback((amount: number) => {
    const target = currencies.find(c => c.code === activeCode) ?? currencies[0]
    const formatted = formatAmount(amount)
    const orderBefore = ['$', '£', '€'].includes(target.symbol)
    return orderBefore ? `${target.symbol}${formatted}` : `${target.symbol} ${formatted}`
  }, [currencies, activeCode, formatAmount])

  const setCurrency = useCallback((code: string) => {
    setActiveCode(code)
  }, [])

  const active = useMemo(() => currencies.find(c => c.code === activeCode) ?? currencies[0], [currencies, activeCode])

  const value = useMemo<CurrencyContextValue>(() => ({
    currencies,
    active,
    setCurrency,
    convertAmount,
    formatAmount,
    formatPriceInline,
  }), [currencies, active, setCurrency, convertAmount, formatAmount, formatPriceInline])

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
}

export const useCurrency = (): CurrencyContextValue => {
  const ctx = useContext(CurrencyContext)
  if (!ctx) {
    const empty = {
      code: 'KES', symbol: 'KSh', label: 'Kenyan Shilling', rate: 1, isDefault: true,
    }
    return {
      currencies: [empty],
      active: empty,
      setCurrency: () => {},
      convertAmount: (n) => n,
      formatAmount: (n) => String(n),
      formatPriceInline: (n) => `KSh ${n}`,
    }
  }
  return ctx
}

// --- SEO + Product JSON-LD helpers ---
export type ProductJsonLd = {
  '@context': 'https://schema.org/'
  '@type': 'Product'
  name: string
  description?: string
  image?: string[]
  sku?: string
  brand?: { '@type': 'Brand'; name: string }
  offers?: {
    '@type': 'Offer'
    priceCurrency: string
    price: string
    availability?: string
    url?: string
  }
  aggregateRating?: {
    '@type': 'AggregateRating'
    ratingValue: string | number
    reviewCount: number
  }
  review?: Array<{
    '@type': 'Review'
    author: { '@type': 'Person'; name: string }
    reviewRating: { '@type': 'Rating'; ratingValue: string | number }
  }>
}

export type BreadcrumbListLd = {
  '@context': 'https://schema.org/'
  '@type': 'BreadcrumbList'
  itemListElement: Array<{
    '@type': 'ListItem'
    position: number
    name: string
    item?: string
  }>
}

export type FaqLd = {
  '@context': 'https://schema.org/'
  '@type': 'FAQPage'
  mainEntity: Array<{
    '@type': 'Question'
    name: string
    acceptedAnswer: { '@type': 'Answer'; text: string }
  }>
}

export const buildProductLd = (
  product: { id: string; name: string; description?: string; image?: string; price: number; sku?: string; rating?: number; ratingCount?: number; category?: string },
  currency: CurrencyDef,
): ProductJsonLd => ({
  '@context': 'https://schema.org/',
  '@type': 'Product',
  name: product.name,
  description: product.description,
  image: product.image ? [product.image] : undefined,
  sku: product.sku ?? product.id,
  brand: { '@type': 'Brand', name: 'Hincton Meat Products' },
  offers: {
    '@type': 'Offer',
    priceCurrency: currency.code,
    price: (product.price * (currency.rate || 1)).toFixed(2),
    availability: 'https://schema.org/InStock',
  },
  aggregateRating: (product.rating || product.ratingCount) ? {
    '@type': 'AggregateRating',
    ratingValue: String(product.rating ?? 5),
    reviewCount: Number(product.ratingCount ?? 0),
  } : undefined,
})

export const buildBreadcrumbsLd = (crumbs: Array<{ name: string; url?: string }>): BreadcrumbListLd => ({
  '@context': 'https://schema.org/',
  '@type': 'BreadcrumbList',
  itemListElement: crumbs.map((c, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: c.name,
    item: c.url,
  })),
})

export const buildFaqLd = (faqs: Array<{ question: string; answer: string }>): FaqLd => ({
  '@context': 'https://schema.org/',
  '@type': 'FAQPage',
  mainEntity: faqs.map(f => ({
    '@type': 'Question',
    name: f.question,
    acceptedAnswer: { '@type': 'Answer', text: f.answer },
  })),
})

export const injectLdScript = (id: string, data: Record<string, unknown> | Array<Record<string, unknown>>) => {
  if (typeof document === 'undefined') return
  let el = document.getElementById(id) as HTMLScriptElement | null
  if (!el) {
    el = document.createElement('script')
    el.type = 'application/ld+json'
    el.id = id
    document.head.appendChild(el)
  }
  el.textContent = JSON.stringify(data)
}

export const removeLdScript = (id: string) => {
  if (typeof document === 'undefined') return
  document.getElementById(id)?.remove()
}

// --- Voice-search meta helpers ---
export const setVoiceMeta = (keywords: string[], description: string) => {
  if (typeof document === 'undefined') return
  const upsertMeta = (name: string, content: string) => {
    let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)
    if (!el) {
      el = document.createElement('meta')
      el.name = name
      document.head.appendChild(el)
    }
    el.content = content
  }
  if (keywords.length) upsertMeta('keywords', keywords.join(', '))
  if (description) upsertMeta('description', description)
  upsertMeta('application-name', 'Hincton Meat Products')
  upsertMeta('apple-mobile-web-app-title', 'Hincton Meat')
  upsertMeta('theme-color', '#8B1E1F')
}

// --- A/B experiment hook helpers ---
const EXPERIMENT_STORAGE_KEY = 'hincton:ab-assignments'

export type ExperimentVariant = { key: string; variant: string; assignedAt: string }

const loadAssignments = (): Record<string, ExperimentVariant> => {
  try {
    const raw = localStorage.getItem(EXPERIMENT_STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

const saveAssignments = (assignments: Record<string, ExperimentVariant>) => {
  try { localStorage.setItem(EXPERIMENT_STORAGE_KEY, JSON.stringify(assignments)) } catch {}
}

export const getOrAssignExperiment = (key: string, variants: string[] = ['control', 'treatment']): ExperimentVariant => {
  const assignments = loadAssignments()
  if (assignments[key]) return assignments[key]
  const variant = variants[Math.floor(Math.random() * variants.length)]
  const item: ExperimentVariant = { key, variant, assignedAt: new Date().toISOString() }
  assignments[key] = item
  saveAssignments(assignments)
  return item
}
