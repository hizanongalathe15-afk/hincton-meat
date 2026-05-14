import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { trackingApi } from '../services/buyerApi'
import { useLanguage } from '../contexts/LanguageContext'

const getNavigationLoadTime = () => {
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
  if (!navigation) return undefined
  return Math.max(0, Math.round(navigation.loadEventEnd - navigation.startTime))
}

const getUtmValue = (params: URLSearchParams, key: string) => params.get(key) || undefined

const VisitTracker = () => {
  const location = useLocation()
  const { locale } = useLanguage()
  const previousUrlRef = useRef<string | undefined>(typeof document !== 'undefined' ? document.referrer || undefined : undefined)

  useEffect(() => {
    const path = `${location.pathname}${location.search}${location.hash}`
    const params = new URLSearchParams(location.search)
    const url = window.location.href

    trackingApi.trackPageView({
      path,
      url,
      title: document.title,
      referrer: previousUrlRef.current,
      source: getUtmValue(params, 'utm_source'),
      medium: getUtmValue(params, 'utm_medium'),
      campaign: getUtmValue(params, 'utm_campaign'),
      term: getUtmValue(params, 'utm_term'),
      content: getUtmValue(params, 'utm_content'),
      loadTimeMs: getNavigationLoadTime(),
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      language: locale || navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }).catch(() => undefined)

    previousUrlRef.current = url
  }, [location.pathname, location.search, location.hash, locale])

  return null
}

export default VisitTracker
