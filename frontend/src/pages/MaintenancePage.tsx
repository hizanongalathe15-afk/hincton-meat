import { useEffect, useState } from 'react'
import {
  Clock, Mail, Phone, RefreshCw, Bell, Loader2, CheckCircle2,
  Database, Server, Rocket, ShieldCheck, Wrench
} from 'lucide-react'

type MaintenanceData = {
  enabled: boolean
  headline: string
  message: string
  estimatedTime: string
  contactEmail: string
  contactPhone: string
}

type BrandInfo = {
  name: string
  logo: string
}

const CHECK_INTERVAL_SECONDS = 15
const RING_RADIUS = 15
const RING_CIRC = 2 * Math.PI * RING_RADIUS

const MaintenancePage = () => {
  const [data, setData] = useState<MaintenanceData | null>(null)
  const [brand, setBrand] = useState<BrandInfo | null>(null)
  const [checking, setChecking] = useState(false)
  const [nextCheckIn, setNextCheckIn] = useState(CHECK_INTERVAL_SECONDS)
  const [notifyEmail, setNotifyEmail] = useState('')
  const [notifyState, setNotifyState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [notifyMessage, setNotifyMessage] = useState('')

  useEffect(() => {
    let active = true
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/content/maintenance-status')
        if (!active) return
        if (res.ok) {
          const status = await res.json()
          if (!status.enabled) {
            window.location.href = '/'
            return
          }
          setData((prev) => prev ?? status)
        }
        setChecking(false)
      } catch {
        if (active) setChecking(true)
      }
    }
    checkStatus()
    const interval = setInterval(() => {
      setNextCheckIn(CHECK_INTERVAL_SECONDS)
      checkStatus()
    }, CHECK_INTERVAL_SECONDS * 1000)
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    let active = true
    fetch('/api/content/site-profile')
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        if (!active || !payload?.profile) return
        const profile = payload.profile
        setBrand({
          name: profile?.brand?.name || 'Hincton Meat',
          logo: profile?.images?.logo || profile?.brand?.logo || '',
        })
      })
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const countdown = setInterval(() => {
      setNextCheckIn((prev) => (prev > 1 ? prev - 1 : CHECK_INTERVAL_SECONDS))
    }, 1000)
    return () => clearInterval(countdown)
  }, [])

  const handleNotify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!notifyEmail.trim() || notifyState === 'submitting') return
    setNotifyState('submitting')
    try {
      const res = await fetch('/api/content/maintenance-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: notifyEmail.trim() }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Could not sign you up right now.')
      setNotifyState('success')
      setNotifyMessage(result.message || 'Thanks! We will email you as soon as the site is back.')
      setNotifyEmail('')
    } catch (err) {
      setNotifyState('error')
      setNotifyMessage(err instanceof Error ? err.message : 'Could not sign you up right now.')
    }
  }

  const headline = data?.headline || "We'll Be Right Back!"
  const message = data?.message || "We're upgrading our systems to serve you better."
  const estimatedTime = data?.estimatedTime
  const contactEmail = data?.contactEmail
  const contactPhone = data?.contactPhone
  const brandName = brand?.name || 'Hincton Meat'
  const logo = brand?.logo

  const steps = [
    { icon: Database, label: 'Upgrading systems' },
    { icon: Server, label: 'Deploying updates' },
    { icon: Rocket, label: 'Final checks' },
  ]

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gray-950 px-4 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-950/50 via-gray-950 to-gray-950" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40" />

      <div className="maint-float-slow absolute -left-24 top-16 h-72 w-72 rounded-full bg-red-600/15 blur-3xl" />
      <div className="maint-float absolute -right-20 bottom-10 h-80 w-80 rounded-full bg-amber-500/10 blur-3xl" />
      <div className="maint-glow absolute left-1/2 top-1/3 h-40 w-40 -translate-x-1/2 rounded-full bg-red-500/10 blur-2xl" />

      <div className="relative z-10 w-full max-w-xl">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
          <div className="mb-8 flex flex-col items-center">
            <div className="relative">
              <div className="maint-glow absolute inset-0 rounded-full bg-red-500/25 blur-xl" />
              <svg className="maint-spin-slow absolute -inset-2 h-[calc(100%+16px)] w-[calc(100%+16px)]" viewBox="0 0 100 100" fill="none">
                <circle cx="50" cy="50" r="48" stroke="rgba(248,113,113,0.25)" strokeWidth="1.5" strokeDasharray="6 10" />
              </svg>
              <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-red-400/30 bg-gray-950/80 shadow-xl shadow-red-950/40">
                {logo ? (
                  <img src={logo} alt={brandName} className="h-16 w-16 object-contain" />
                ) : (
                  <Wrench className="h-10 w-10 text-red-400" strokeWidth={1.5} />
                )}
              </div>
            </div>
            <p className="mt-4 text-sm font-semibold uppercase tracking-[0.25em] text-gray-400">{brandName}</p>
            <span className="mt-3 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 text-xs font-semibold text-amber-300">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
              </span>
              Scheduled maintenance in progress
            </span>
          </div>

          <div className="text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              {headline}
            </h1>
            <p className="mt-4 text-base leading-7 text-gray-300">
              {message}
            </p>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-2">
            {steps.map((step, index) => (
              <div
                key={step.label}
                className={`flex flex-col items-center gap-2 rounded-xl border px-2 py-3 text-center ${
                  index === 1
                    ? 'border-amber-400/40 bg-amber-400/10'
                    : 'border-white/10 bg-white/5'
                }`}
              >
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${index === 1 ? 'bg-amber-400/20' : 'bg-white/5'}`}>
                  <step.icon className={`h-5 w-5 ${index === 1 ? 'animate-pulse text-amber-300' : 'text-gray-400'}`} />
                </div>
                <span className={`text-[11px] font-medium leading-tight ${index === 1 ? 'text-amber-200' : 'text-gray-400'}`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>

          {estimatedTime && (
            <div className="mt-6 flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-5 py-3 backdrop-blur-sm">
              <Clock className="h-5 w-5 shrink-0 text-amber-400" />
              <span className="text-sm font-medium text-gray-200">
                Estimated downtime: <span className="font-bold text-white">{estimatedTime}</span>
              </span>
            </div>
          )}

          <div className="mt-6 flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
            <div className="relative h-14 w-14 shrink-0">
              <svg className="h-14 w-14 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r={RING_RADIUS} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
                <circle
                  cx="18"
                  cy="18"
                  r={RING_RADIUS}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={RING_CIRC}
                  strokeDashoffset={RING_CIRC * (1 - nextCheckIn / CHECK_INTERVAL_SECONDS)}
                  style={{ transition: 'stroke-dashoffset 1s linear' }}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">{nextCheckIn}s</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-sm font-semibold text-white">
                <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" />
                We'll bring you back automatically
              </p>
              <p className="mt-0.5 text-xs leading-5 text-gray-400">
                {checking
                  ? 'Still working on it. This page keeps checking our systems for you.'
                  : `This page checks our systems every ${CHECK_INTERVAL_SECONDS} seconds and returns you to the site the moment we're live.`}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
            <p className="flex items-center justify-center gap-2 text-sm font-semibold text-gray-200">
              <Bell className="h-4 w-4 text-amber-400" />
              Get notified the second we're back
            </p>
            {notifyState === 'success' ? (
              <p className="mt-3 flex items-center justify-center gap-2 text-center text-sm text-emerald-400">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {notifyMessage}
              </p>
            ) : (
              <>
                <form onSubmit={handleNotify} className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <input
                    type="email"
                    required
                    value={notifyEmail}
                    onChange={(e) => {
                      setNotifyEmail(e.target.value)
                      if (notifyState === 'error') setNotifyState('idle')
                    }}
                    placeholder="you@example.com"
                    className="w-full flex-1 rounded-full border border-white/10 bg-gray-950/60 px-5 py-2.5 text-sm text-white placeholder-gray-500 focus:border-amber-400/50 focus:outline-none focus:ring-1 focus:ring-amber-400/50"
                  />
                  <button
                    type="submit"
                    disabled={notifyState === 'submitting' || !notifyEmail.trim()}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-500 px-6 py-2.5 text-sm font-semibold text-gray-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {notifyState === 'submitting' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                    Notify Me
                  </button>
                </form>
                {notifyState === 'error' && (
                  <p className="mt-2 text-center text-xs text-red-400">{notifyMessage}</p>
                )}
              </>
            )}
          </div>

          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() => { window.location.href = '/' }}
              className="maint-shimmer inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-red-600 via-red-500 to-red-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/25 transition-all hover:shadow-red-500/40 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-950"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again Now
            </button>
          </div>

          {(contactEmail || contactPhone) && (
            <div className="mt-8 space-y-3 border-t border-white/10 pt-6">
              <p className="text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                Urgent inquiries
              </p>
              <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-8">
                {contactEmail && (
                  <a href={`mailto:${contactEmail}`} className="flex items-center gap-2 text-sm text-gray-400 transition hover:text-white">
                    <Mail className="h-4 w-4" />
                    {contactEmail}
                  </a>
                )}
                {contactPhone && (
                  <a href={`tel:${contactPhone}`} className="flex items-center gap-2 text-sm text-gray-400 transition hover:text-white">
                    <Phone className="h-4 w-4" />
                    {contactPhone}
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-gray-600">
          {brandName} · Your cart and account are safe while we work.
        </p>
      </div>
    </div>
  )
}

export default MaintenancePage
