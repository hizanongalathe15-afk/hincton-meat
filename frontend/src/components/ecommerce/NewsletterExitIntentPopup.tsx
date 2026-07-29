import React, { useEffect, useRef, useState } from 'react'
import { X, Mail, Loader2, CheckCircle2, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import { featuresApi } from '../../services/featuresApi'
import { useSiteContent } from '../../contexts/SiteContentContext'

const DISMISS_KEY = 'hincton:newsletter-exit:dismissed'

const isRecentlyDismissed = (): boolean => {
  try {
    const raw = localStorage.getItem(DISMISS_KEY)
    if (!raw) return false
    const ts = Number(raw)
    if (!Number.isFinite(ts)) return false
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000
    return Date.now() - ts < SEVEN_DAYS
  } catch {
    return false
  }
}

const markDismissed = () => {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
  } catch {
  }
}

const NewsletterExitIntentPopup: React.FC = () => {
  const { profile } = useSiteContent()
  const [show, setShow] = useState(false)
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [loading, setLoading] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const triggerArmedRef = useRef(false)
  const delayRef = useRef<number | null>(null)
  const alreadyShownRef = useRef(false)

  const exitEnabled = !!profile.newsletter?.exitIntentEnabled
  const delay = profile.newsletter?.exitIntentDelayMs ?? 5000
  const popupTitle = profile.newsletter?.popupTitle || 'Get 10% off your first order'
  const popupSubtitle = profile.newsletter?.popupSubtitle || 'Subscribe for exclusive offers and new cuts.'

  const maybeShow = () => {
    if (!exitEnabled || alreadyShownRef.current) return
    if (isRecentlyDismissed()) return
    setShow(true)
    alreadyShownRef.current = true
  }

  useEffect(() => {
    if (!exitEnabled) return
    if (typeof window === 'undefined' || typeof document === 'undefined') return

    const arm = () => {
      if (triggerArmedRef.current) return
      triggerArmedRef.current = true

      const onMouseLeave = (event: MouseEvent) => {
        if (event.clientY > 10) return
        maybeShow()
      }
      document.addEventListener('mouseleave', onMouseLeave)

      delayRef.current = window.setTimeout(() => {
        const touchyDevice = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent || '')
        if (touchyDevice) maybeShow()
      }, Math.max(5000, delay + 15000))

      return () => {
        document.removeEventListener('mouseleave', onMouseLeave)
        if (delayRef.current) window.clearTimeout(delayRef.current)
      }
    }

    const initialDelay = window.setTimeout(arm, Math.max(300, delay))
    return () => {
      window.clearTimeout(initialDelay)
      if (delayRef.current) window.clearTimeout(delayRef.current)
    }
  }, [exitEnabled, delay])

  const handleClose = () => {
    markDismissed()
    setShow(false)
  }

  const validateEmail = (value: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!validateEmail(email)) {
      toast.error('Please enter a valid email address')
      return
    }
    setLoading(true)
    try {
      await featuresApi.subscribeNewsletter({
        email: email.trim(),
        firstName: firstName.trim() || undefined,
        source: 'EXIT_INTENT',
      })
      setSubscribed(true)
      toast.success('Thanks for subscribing! Check your inbox for your offer.')
      markDismissed()
    } catch (error) {
      toast.error('Could not subscribe right now. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  if (!show) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="newsletter-exit-title"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative z-10 w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden">
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-3 right-3 z-20 p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
          aria-label="Close newsletter popup"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-red-600 via-red-700 to-amber-600" />
          <div className="absolute inset-0 opacity-20 mix-blend-overlay" style={{
            backgroundImage: 'radial-gradient(circle at 20% 20%, #ffffff 0%, transparent 40%), radial-gradient(circle at 80% 70%, #ffffff 0%, transparent 40%)',
          }} />
          <div className="relative px-8 pt-10 pb-8 text-center text-white">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white/15 backdrop-blur-sm mb-4">
              <Sparkles className="w-7 h-7" />
            </div>
            <div className="text-[11px] uppercase tracking-[0.3em] text-white/80 font-semibold mb-1">
              Wait before you go
            </div>
            <h2 id="newsletter-exit-title" className="text-2xl font-extrabold leading-tight">
              {popupTitle}
            </h2>
            <p className="mt-2 text-white/90 text-sm">{popupSubtitle}</p>
          </div>
        </div>

        <div className="p-6 pt-5">
          {subscribed ? (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center p-3 rounded-full bg-green-100 text-green-600 mb-3">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="text-lg font-bold text-gray-900">You're in!</div>
              <p className="mt-1 text-sm text-gray-600">
                Your welcome offer is on its way. Keep an eye on your inbox.
              </p>
              <button
                type="button"
                onClick={handleClose}
                className="mt-5 w-full rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 transition-colors"
              >
                Got it, thanks
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="sr-only" htmlFor="exit-newsletter-firstname">First name</label>
                <input
                  id="exit-newsletter-firstname"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name (optional)"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none"
                  autoComplete="given-name"
                />
              </div>
              <label className="block">
                <span className="sr-only">Email address</span>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    required
                    className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none"
                    autoComplete="email"
                  />
                </div>
              </label>
              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-red-700 hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 text-sm font-bold text-white shadow-lg shadow-red-700/20 transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Subscribing…
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    Claim my offer
                  </>
                )}
              </button>
              <p className="text-center text-[11px] text-gray-500 pt-1">
                We respect your inbox. Unsubscribe anytime.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default NewsletterExitIntentPopup
