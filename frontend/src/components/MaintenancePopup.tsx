import { useEffect, useState } from 'react'
import { X, Wrench, CheckCircle } from 'lucide-react'

type MaintenancePopupData = {
  enabled: boolean
  displayMode: string
  popupTitle: string
  popupMessage: string
}

const DISMISS_KEY = 'maintenance-popup-dismissed'

const MaintenancePopup = () => {
  const [data, setData] = useState<MaintenancePopupData | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem(DISMISS_KEY) === '1') {
      setDismissed(true)
      return
    }
    fetch('/api/content/maintenance-status')
      .then((res) => res.json())
      .then((status) => {
        if (status.enabled && status.displayMode === 'popup') {
          setData(status)
          setTimeout(() => setVisible(true), 300)
        }
      })
      .catch(() => null)
  }, [])

  const handleClose = () => {
    setVisible(false)
    setTimeout(() => {
      setDismissed(true)
      sessionStorage.setItem(DISMISS_KEY, '1')
    }, 200)
  }

  if (dismissed || !data || data.displayMode !== 'popup') return null

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center px-4 transition-all duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

      <div className={`relative w-full max-w-md rounded-2xl border border-white/15 bg-white/10 p-8 shadow-2xl backdrop-blur-2xl transition-all duration-200 ${visible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-white/10 hover:text-white"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-5 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-500/10">
            <Wrench className="h-7 w-7 text-amber-400" strokeWidth={1.5} />
          </div>
        </div>

        <h3 className="text-center text-lg font-bold text-white">
          {data.popupTitle || 'Quick Maintenance'}
        </h3>
        <p className="mt-3 text-center text-sm leading-6 text-gray-300">
          {data.popupMessage || "We're making a quick fix. This feature will be back shortly."}
        </p>

        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-6 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30"
          >
            <CheckCircle className="h-4 w-4 text-emerald-400" />
            Got it, I'll keep browsing
          </button>
        </div>
      </div>
    </div>
  )
}

export default MaintenancePopup
