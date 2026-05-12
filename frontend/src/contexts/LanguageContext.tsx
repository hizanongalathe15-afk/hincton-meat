import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { resolveLocale, tFactory, type LocaleCode } from '../i18n/i18n'
import { contentApi } from '../services/contentApi'

type LanguageContextValue = {
  locale: LocaleCode
  t: (key: string) => string
  setLocale: (next: LocaleCode) => void
  refresh: () => Promise<void>
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined)

const getSavedLanguageFromCommerceSettings = (data: any): string | undefined => {
  if (data?.settings && !Array.isArray(data.settings)) {
    return data.settings?.general?.language
  }

  const commerce = (data?.settings || []).find((setting: any) => setting.key === 'commerce_settings')
  if (!commerce?.value) return undefined

  try {
    const parsed = JSON.parse(commerce.value)
    return parsed?.general?.language
  } catch {
    return undefined
  }
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocale] = useState<LocaleCode>('en')

  const refresh = async () => {
    try {
      const data = await contentApi.getCommerceSettings()
      const saved = getSavedLanguageFromCommerceSettings(data)
      if (saved) setLocale(resolveLocale(saved))
    } catch {
      // Keep existing locale
    }
  }

  useEffect(() => {
    // best-effort load saved language
    void refresh()
  }, [])

  const value = useMemo<LanguageContextValue>(() => {
    return {
      locale,
      t: tFactory(locale),
      setLocale: (next) => setLocale(next),
      refresh,
    }
  }, [locale])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export const useLanguage = () => {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
