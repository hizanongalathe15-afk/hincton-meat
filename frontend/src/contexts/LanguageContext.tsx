import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { resolveLocale, tFactory, type LocaleCode } from '../i18n/i18n'
import { contentApi } from '../services/contentApi'
import { authService } from '../services/authService'
import { useAuth } from './AuthContext'

type LanguageContextValue = {
  locale: LocaleCode
  t: (key: string) => string
  setLocale: (next: LocaleCode) => void
  refresh: () => Promise<void>
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined)

const LANGUAGE_STORAGE_KEY = 'preferredLanguage'

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
  const { user } = useAuth()
  const [locale, setLocaleState] = useState<LocaleCode>(() => {
    if (typeof window === 'undefined') return 'en'
    const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY)
    return resolveLocale(savedLanguage)
  })

  const refresh = async () => {
    try {
      const data = await contentApi.getCommerceSettings()
      const saved = getSavedLanguageFromCommerceSettings(data)
      if (saved) setLocaleState(resolveLocale(saved))
    } catch {
      // Keep existing locale
    }
  }

  useEffect(() => {
    if (user?.profile?.preferredLanguage) {
      const saved = resolveLocale(user.profile.preferredLanguage)
      setLocaleState(saved)
      if (typeof window !== 'undefined') {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, saved)
      }
      return
    }

    void refresh()
  }, [user])

  const setLocale = (next: LocaleCode) => {
    setLocaleState(next)
    if (typeof window !== 'undefined') {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, next)
    }

    if (user?.id) {
      void authService.updatePreferredLanguage(next).catch((error) => {
        console.warn('Failed to save preferred language to server:', error)
      })
    }
  }

  const value = useMemo<LanguageContextValue>(() => {
    return {
      locale,
      t: tFactory(locale),
      setLocale,
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
