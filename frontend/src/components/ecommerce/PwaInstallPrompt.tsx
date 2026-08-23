import React, { useEffect, useRef, useState } from 'react'
import { Download, X, Smartphone, ShoppingBag, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import { featuresApi } from '../../services/featuresApi'
import { useSiteContent } from '../../contexts/SiteContentContext'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform?: string }>
}

const DISMISS_KEY = 'hincton:pwa-install:dismissed'
const ACCEPTED_KEY = 'hincton:pwa-install:accepted'
const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000

type PwaInstallPromptProps = {
  variant?: 'banner' | 'button'
  className?: string
}

const PwaInstallPrompt: React.FC<PwaInstallPromptProps> = ({
  variant = 'banner',
  className = '',
}) => {
  const { profile } = useSiteContent()
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null)
  const [canInstall, setCanInstall] = useState(false)
  const [show, setShow] = useState(false)
  const [installing, setInstalling] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const sessionReportedRef = useRef(false)

  const enabled = profile.featureToggles?.pwaInstallPrompt !== false

  useEffect(() => {
    if (!enabled) return
    if (typeof window === 'undefined') return

    const standalone =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      (window.navigator as any)?.standalone === true ||
      document.referrer.includes('android-app://')
    setIsStandalone(standalone)
    if (standalone) {
      if (!sessionReportedRef.current) {
        sessionReportedRef.current = true
        featuresApi
          .trackPwaInstall({ acceptedInstall: true, platform: navigator.platform })
          .catch(() => {})
      }
      return
    }

    try {
      const accepted = localStorage.getItem(ACCEPTED_KEY) === '1'
      if (accepted) {
        setCanInstall(false)
        return
      }
    } catch {
    }

    const checkDismissed = (): boolean => {
      try {
        const raw = localStorage.getItem(DISMISS_KEY)
        if (!raw) return false
        const ts = Number(raw)
        if (!Number.isFinite(ts)) return false
        return Date.now() - ts < DISMISS_TTL_MS
      } catch {
        return false
      }
    }

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      deferredPrompt.current = event as BeforeInstallPromptEvent
      setCanInstall(true)
      if (variant === 'banner' && !checkDismissed()) {
        window.setTimeout(() => setShow(true), 1500)
      }
    }

    const onAppInstalled = () => {
      try { localStorage.setItem(ACCEPTED_KEY, '1') } catch {}
      setShow(false)
      setCanInstall(false)
      toast.success('Hincton Meat app installed successfully!')
      featuresApi
        .trackPwaInstall({ acceptedInstall: true, platform: navigator.platform })
        .catch(() => {})
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onAppInstalled)
    }
  }, [enabled, variant])

  const isIos = typeof window !== 'undefined' && /iphone|ipad|ipod/i.test(window.navigator.userAgent)

  const handleInstall = async () => {
    if (isIos && !deferredPrompt.current) {
      toast('To install: Tap the Share button in Safari, then select "Add to Home Screen"', { duration: 6000 })
      setShow(false)
      return
    }

    if (!deferredPrompt.current || installing) {
      toast('Open browser menu and select "Install" or "Add to Home Screen"', { duration: 4500 })
      setShow(false)
      return
    }

    setInstalling(true)
    try {
      await deferredPrompt.current.prompt()
      const choice = await deferredPrompt.current.userChoice
      const accepted = choice.outcome === 'accepted'
      try {
        if (!accepted) {
          localStorage.setItem(DISMISS_KEY, String(Date.now()))
        } else {
          localStorage.setItem(ACCEPTED_KEY, '1')
        }
      } catch {
      }
      featuresApi
        .trackPwaInstall({
          acceptedInstall: accepted,
          platform: choice.platform || navigator.platform,
        })
        .catch(() => {})
      if (accepted) {
        toast.success('App is being added to your home screen')
      } else {
        toast('Install dismissed. You can install anytime from the menu.')
      }
      setShow(false)
      setCanInstall(false)
    } catch {
      toast('Install via browser menu: Tap "Add to Home screen"')
    } finally {
      setInstalling(false)
      deferredPrompt.current = null
    }
  }

  const handleDismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())) } catch {}
    featuresApi
      .trackPwaInstall({ acceptedInstall: false, platform: navigator.platform })
      .catch(() => {})
    setShow(false)
  }

  if (!enabled || isStandalone) return null
  if (!canInstall && variant === 'button') return null

  if (variant === 'button') {
    return (
      <button
        type="button"
        onClick={handleInstall}
        disabled={installing}
        className={`inline-flex items-center gap-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white px-4 py-2.5 text-sm font-semibold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        <Smartphone className="w-4 h-4" />
        {installing ? 'Preparing install…' : 'Install App'}
      </button>
    )
  }

  if (!show) return null

  return (
    <div className={`fixed inset-x-0 bottom-0 z-40 px-3 pb-3 sm:px-6 sm:pb-6 ${className}`}>
      <div className="mx-auto max-w-2xl rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 border border-gray-100 overflow-hidden">
        <div className="flex items-stretch">
          <div className="hidden sm:flex shrink-0 items-center justify-center w-20 bg-gradient-to-br from-red-600 to-amber-500 text-white">
            <Download className="w-8 h-8" />
          </div>
          <div className="flex-1 p-4">
            <div className="flex items-start gap-3">
              <div className="sm:hidden shrink-0 p-2 rounded-xl bg-gradient-to-br from-red-600 to-amber-500 text-white">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <div className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">
                    Install the Hincton App
                  </div>
                </div>
                <div className="font-bold text-gray-900 leading-snug">
                  Order from your home screen, get push updates, and shop faster.
                </div>
                <div className="mt-1 text-xs text-gray-600 line-clamp-2">
                  Adds a lightweight web app tile to your phone — no app store needed.
                </div>
              </div>
              <button
                type="button"
                onClick={handleDismiss}
                className="shrink-0 -mr-1 -mt-1 p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Dismiss install prompt"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={handleInstall}
                disabled={installing}
                className="inline-flex items-center justify-center gap-2 flex-1 rounded-xl bg-red-700 hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all"
              >
                {installing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Opening install…
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Install App
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PwaInstallPrompt
