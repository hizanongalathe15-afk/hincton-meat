import { useEffect, useState } from 'react'
import { Wrench, Clock, Mail, Phone, RefreshCw, ArrowRight } from 'lucide-react'

type MaintenanceData = {
  enabled: boolean
  headline: string
  message: string
  estimatedTime: string
  contactEmail: string
  contactPhone: string
}

const MaintenancePage = () => {
  const [data, setData] = useState<MaintenanceData | null>(null)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    fetch('/api/content/maintenance-status')
      .then((res) => res.json())
      .then(setData)
      .catch(() => null)
  }, [])

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/content/maintenance-status')
        if (res.ok) {
          const status = await res.json()
          if (!status.enabled) {
            clearInterval(interval)
            window.location.href = '/'
          }
        }
      } catch {
        setChecking(true)
      }
    }, 15_000)
    return () => clearInterval(interval)
  }, [])

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

        {checking && (
          <p className="mt-6 text-center text-xs text-gray-600">
            Still working on it — this page auto-refreshes every 15 seconds.
          </p>
        )}

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
