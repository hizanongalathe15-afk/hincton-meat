import { useEffect, useState } from 'react'
import { X, Wrench } from 'lucide-react'

type MaintenanceBannerData = {
  enabled: boolean
  displayMode: string
  bannerText: string
}

const DISMISS_KEY = 'maintenance-banner-dismissed'

const MaintenanceBanner = () => {
  const [data, setData] = useState<MaintenanceBannerData | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem(DISMISS_KEY) === '1') {
      setDismissed(true)
      return
    }
    fetch('/api/content/maintenance-status')
      .then((res) => res.json())
      .then((status) => {
        if (status.enabled && (status.displayMode === 'banner' || status.displayMode === 'full')) {
          setData(status)
        }
      })
      .catch(() => null)
  }, [])

  const handleDismiss = () => {
    setDismissed(true)
    sessionStorage.setItem(DISMISS_KEY, '1')
  }

  if (dismissed || !data || data.displayMode !== 'banner') return null

  return (
    <div className="relative z-50 flex items-center gap-3 border-b border-amber-300/30 bg-amber-500/10 px-4 py-2.5 backdrop-blur-xl">
      <Wrench className="h-4 w-4 shrink-0 text-amber-400" />
      <p className="flex-1 text-center text-sm font-medium text-amber-100">
        {data.bannerText || "We're making improvements. Some features may be temporarily unavailable."}
      </p>
      <button
        type="button"
        onClick={handleDismiss}
        className="flex h-6 w-6 items-center justify-center rounded-full text-amber-400/70 transition hover:bg-white/10 hover:text-white"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

export default MaintenanceBanner
