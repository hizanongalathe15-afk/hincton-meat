import { useEffect, useState } from 'react'
import { Wrench, Clock, Mail, Phone, RefreshCw, ArrowRight, Bell, Timer, Loader2, CheckCircle2 } from 'lucide-react'

type MaintenanceData = {
  enabled: boolean
  headline: string
  message: string
  estimatedTime: string
  contactEmail: string
  contactPhone: string
}

const CHECK_INTERVAL_SECONDS = 15

const MaintenancePage = () => {
  const [data, setData] = useState<MaintenanceData | null>(null)
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

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gray-950 px-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-950/40 via-gray-950 to-gray-950" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40" />

      <div className="relative z-10 w-full max-w-xl">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl sm:p-12">
          <div className="mb-8 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-red-400/20 bg-red-500/10 backdrop-blur-sm">
              <Wrench className="h-10 w-10 text-red-400" strokeWidth={1.5} />
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              {headline}
            </h1>
            <p className="mt-5 text-base leading-7 text-gray-300">
              {message}
            </p>
          </div>

          {estimatedTime && (
            <div className="mt-8 flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-5 py-3 backdrop-blur-sm">
              <Clock className="h-5 w-5 shrink-0 text-amber-400" />
              <span className="text-sm font-medium text-gray-200">
                Estimated downtime: <span className="font-bold text-white">{estimatedTime}</span>
              </span>
            </div>
          )}

          <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
            <p className="flex items-center justify-center gap-2 text-sm font-semibold text-gray-200">
              <Bell className="h-4 w-4 text-amber-400" />
              Get notified when we're back
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
              className="inline-flex items-center gap-2 rounded-full bg-red-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/20 transition-all hover:bg-red-500 hover:shadow-red-500/30 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-950"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>
          </div>

          {(contactEmail || contactPhone) && (
            <div className="mt-8 space-y-3 border-t border-white/10 pt-6">
              <p className="text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                Urgent inquiries
              </p>
              {contactEmail && (
                <a href={`mailto:${contactEmail}`} className="flex items-center justify-center gap-2 text-sm text-gray-400 transition hover:text-white">
                  <Mail className="h-4 w-4" />
                  {contactEmail}
                </a>
              )}
              {contactPhone && (
                <a href={`tel:${contactPhone}`} className="flex items-center justify-center gap-2 text-sm text-gray-400 transition hover:text-white">
                  <Phone className="h-4 w-4" />
                  {contactPhone}
                </a>
              )}
            </div>
          )}
        </div>

        <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-gray-600">
          <Timer className="h-3.5 w-3.5" />
          {checking
            ? `Still working on it — next check in ${nextCheckIn}s`
            : `This page checks automatically every ${CHECK_INTERVAL_SECONDS} seconds (next in ${nextCheckIn}s)`}
        </p>

        <div className="mt-6 flex justify-center">
          <a
            href="/"
            onClick={(e) => { e.preventDefault(); window.location.href = '/' }}
            className="inline-flex items-center gap-1 text-xs text-gray-600 transition hover:text-gray-400"
          >
            Return home <ArrowRight className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  )
}

export default MaintenancePage
