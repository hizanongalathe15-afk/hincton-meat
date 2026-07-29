import React, { useEffect, useState } from 'react'
import { Users, ShoppingBag, Clock, Flame } from 'lucide-react'
import toast from 'react-hot-toast'
import { featuresApi } from '../../services/featuresApi'
import { useSiteContent } from '../../contexts/SiteContentContext'

type SocialProofWidgetProps = {
  productId?: string
  className?: string
}

type SocialProofEvent = {
  eventType: 'PURCHASE' | 'VIEW' | 'CART_ADD' | 'REVIEW'
  productId?: string
  city?: string
  country?: string
  customerInitials?: string
  customerName?: string
  quantity?: number
  minutesAgo?: number
  productName?: string
}

const FALLBACK_CITIES = [
  'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Malindi', 'Kitale'
]
const FALLBACK_NAMES = [
  'J.M.', 'A.K.', 'S.N.', 'P.O.', 'L.W.', 'D.M.', 'R.K.', 'T.O.', 'V.N.', 'B.W.'
]

const loadSimulatedRecent = (): { count: number; events: SocialProofEvent[] } => {
  try {
    const raw = localStorage.getItem('hincton:social-proof:simulated')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed.count === 'number') return parsed
    }
  } catch {
  }
  return {
    count: 8 + Math.floor(Math.random() * 12),
    events: Array.from({ length: 3 + Math.floor(Math.random() * 4) }, (_, i) => ({
      eventType: i === 0 ? 'PURCHASE' : 'VIEW',
      city: FALLBACK_CITIES[Math.floor(Math.random() * FALLBACK_CITIES.length)],
      customerInitials: FALLBACK_NAMES[Math.floor(Math.random() * FALLBACK_NAMES.length)],
      minutesAgo: 1 + Math.floor(Math.random() * 45),
      quantity: 1 + Math.floor(Math.random() * 3),
    })),
  }
}

const persistSimulatedRecent = (data: { count: number; events: SocialProofEvent[] }) => {
  try {
    localStorage.setItem('hincton:social-proof:simulated', JSON.stringify({
      ...data,
      _ts: Date.now(),
    }))
  } catch {
  }
}

const SocialProofWidget: React.FC<SocialProofWidgetProps> = ({ productId, className = '' }) => {
  const { profile } = useSiteContent()
  const [viewersCount, setViewersCount] = useState<number | null>(null)
  const [recentEvents, setRecentEvents] = useState<SocialProofEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [bannerEvent, setBannerEvent] = useState<SocialProofEvent | null>(null)

  const mode = profile.trust.socialProofMode || 'REAL_FALLBACK_SIMULATED'
  const viewersWindow = profile.trust.viewCounterWindowMinutes ?? 15
  const purchaseWindow = profile.trust.recentPurchaseWindowHours ?? 48

  useEffect(() => {
    if (mode === 'OFF') {
      setLoading(false)
      return
    }

    let cancelled = false
    const simulated = loadSimulatedRecent()

    const load = async () => {
      setLoading(true)
      try {
        const res = await featuresApi.getSocialProofRecent({ limit: 8, productId })
        if (cancelled) return
        const events: SocialProofEvent[] = Array.isArray(res?.events) ? res.events : []
        const viewEvents = events.filter(e => e.eventType === 'VIEW')
        const purchaseEvents = events.filter(e => e.eventType === 'PURCHASE')

        const viewers = viewEvents.length
          ? Math.min(99, Math.max(3, viewEvents.length + Math.floor(Math.random() * 6)))
          : simulated.count

        setViewersCount(viewers)
        setRecentEvents(purchaseEvents.length ? purchaseEvents.slice(0, 4) : simulated.events)
        persistSimulatedRecent({ count: viewers, events: purchaseEvents.length ? purchaseEvents : simulated.events })
      } catch (error) {
        if (cancelled) return
        if (mode === 'REAL_ONLY') {
          setViewersCount(null)
          setRecentEvents([])
        } else {
          setViewersCount(simulated.count)
          setRecentEvents(simulated.events)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    const viewInterval = setInterval(() => {
      setViewersCount(prev => {
        if (prev === null) return prev
        const drift = (Math.random() - 0.5) * 2
        const next = Math.max(2, Math.min(99, Math.round(prev + drift)))
        return next
      })
    }, 15000)

    return () => {
      cancelled = true
      clearInterval(viewInterval)
    }
  }, [productId, mode])

  useEffect(() => {
    if (!recentEvents.length) return
    const pickEvent = () => {
      const purchases = recentEvents.filter(e => e.eventType === 'PURCHASE')
      const pool = purchases.length ? purchases : recentEvents
      const event = pool[Math.floor(Math.random() * pool.length)]
      setBannerEvent(event)
      setTimeout(() => setBannerEvent(null), 6500)
    }
    pickEvent()
    const interval = setInterval(pickEvent, 22000)
    return () => clearInterval(interval)
  }, [recentEvents])

  const showBanner = (event: SocialProofEvent) => {
    if (!event.city && !event.customerInitials) return
    const initials = event.customerInitials || 'A customer'
    const city = event.city || 'Kenya'
    const minutesAgo = event.minutesAgo ?? 5
    const unit = minutesAgo <= 1 ? 'minute' : 'minutes'
    const qty = event.quantity ?? 1
    const suffix = qty > 1 ? ` (x${qty})` : ''
    const productRef = event.productName ? ` ${event.productName}${suffix}` : suffix

    const t = toast.custom(
      (tInstance) => (
        <div
          className={`${
            tInstance.visible ? 'animate-enter' : 'animate-leave'
          } max-w-sm w-full bg-white shadow-2xl rounded-xl pointer-events-auto flex items-start gap-3 p-3 border border-gray-100`}
        >
          <div className="shrink-0 p-2 rounded-full bg-red-50 text-red-700">
            <Flame className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-gray-900">
              {initials} in {city}
            </div>
            <div className="text-xs text-gray-600">
              purchased{productRef} · {minutesAgo} {unit} ago
            </div>
          </div>
        </div>
      ),
      { duration: 6500, position: 'bottom-left' },
    )
    return t
  }

  useEffect(() => {
    if (bannerEvent) showBanner(bannerEvent)
  }, [bannerEvent])

  if (mode === 'OFF') return null

  return (
    <div className={`space-y-3 ${className}`}>
      {(loading || viewersCount !== null) && viewersCount !== 0 && (
        <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-800">
          <Users className="w-3.5 h-3.5" />
          {loading ? (
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
              Checking site activity…
            </span>
          ) : (
            <span>
              <strong>{viewersCount}</strong> people are viewing this now
              <span className="text-sky-600"> · last {viewersWindow}m</span>
            </span>
          )}
        </div>
      )}

      {recentEvents.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-3">
          <div className="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
            <ShoppingBag className="w-3.5 h-3.5 text-red-600" />
            Recent activity
            <span className="text-gray-400 normal-case font-normal">· {purchaseWindow}h</span>
          </div>
          <ul className="space-y-2">
            {recentEvents.slice(0, 3).map((event, idx) => {
              const initials = event.customerInitials || FALLBACK_NAMES[idx % FALLBACK_NAMES.length]
              const city = event.city || FALLBACK_CITIES[idx % FALLBACK_CITIES.length]
              const minutesAgo = event.minutesAgo ?? 3 + idx * 7
              return (
                <li key={idx} className="flex items-start gap-2 text-xs">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-500 to-amber-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                    {initials.replace(/[^A-Z.]/g, '').slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-gray-800">
                      <strong>{initials}</strong> in {city}
                      {event.eventType === 'PURCHASE' ? ' purchased' : ' viewed'}
                      {event.quantity && event.quantity > 1 ? ` x${event.quantity}` : ''}
                    </div>
                    <div className="flex items-center gap-1 text-gray-500">
                      <Clock className="w-3 h-3" />
                      {minutesAgo}m ago
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

export default SocialProofWidget
