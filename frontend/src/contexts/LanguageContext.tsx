import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { resolveLocale, tFactory, translateLiteral, type LocaleCode } from '../i18n/i18n'
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
  const translationOriginalsRef = useRef(new WeakMap<Text, string>())
  const translationAttrOriginalsRef = useRef(new WeakMap<Element, Record<string, string>>())
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

  useEffect(() => {
    if (typeof document === 'undefined') return
    document.documentElement.lang = locale
  }, [locale])

  useEffect(() => {
    if (typeof document === 'undefined') return
    if (locale === 'en') return

    const originals = translationOriginalsRef.current
    const attrOriginals = translationAttrOriginalsRef.current
    const ignoredTags = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'SELECT', 'OPTION', 'CODE', 'PRE'])
    const translatableAttrs = ['placeholder', 'aria-label', 'title']
    const isIgnoredElement = (element: Element) => {
      return ignoredTags.has(element.tagName) || Boolean(element.closest('[data-no-auto-translate], [translate="no"]'))
    }

    const translateTextNode = (node: Text) => {
      const parent = node.parentElement
      if (!parent || isIgnoredElement(parent)) return
      const original = originals.get(node) || node.nodeValue || ''
      if (!original.trim()) return
      originals.set(node, original)
      const translated = translateLiteral(original, locale)
      if (translated !== node.nodeValue) node.nodeValue = original.replace(original.trim(), translated)
    }

    const translateElementAttrs = (element: Element) => {
      if (isIgnoredElement(element)) return
      const originalAttrs = attrOriginals.get(element) || {}
      let changed = false
      translatableAttrs.forEach((attr) => {
        const current = element.getAttribute(attr)
        if (!current) return
        const original = originalAttrs[attr] || current
        originalAttrs[attr] = original
        const translated = translateLiteral(original, locale)
        if (translated !== current) element.setAttribute(attr, translated)
        changed = true
      })
      if (changed) attrOriginals.set(element, originalAttrs)
    }

    const translateTree = (root: ParentNode) => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
      let node = walker.nextNode()
      while (node) {
        translateTextNode(node as Text)
        node = walker.nextNode()
      }

      if (root instanceof Element) translateElementAttrs(root)
      root.querySelectorAll?.('*').forEach(translateElementAttrs)
    }

    window.setTimeout(() => translateTree(document.body), 0)

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE) translateTextNode(node as Text)
          if (node.nodeType === Node.ELEMENT_NODE) translateTree(node as Element)
        })
        if (mutation.type === 'characterData' && mutation.target.nodeType === Node.TEXT_NODE) {
          translateTextNode(mutation.target as Text)
        }
      })
    })
    observer.observe(document.body, { childList: true, subtree: true, characterData: true })

    return () => observer.disconnect()
  }, [locale])

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
