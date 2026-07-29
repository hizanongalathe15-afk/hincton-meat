import React, { useEffect, useState } from 'react'
import { Coins, Award, Loader2, Gift, Sparkles, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'
import { featuresApi } from '../../services/featuresApi'

type LoyaltyBadge = {
  id?: string
  code?: string
  name: string
  description?: string
  icon?: string
  earnedAt?: string
  tier?: 'bronze' | 'silver' | 'gold' | 'platinum'
}

type LoyaltySummary = {
  balance: number
  ledger: Array<{ id: string; points: number; description?: string; createdAt?: string }>
  badges: LoyaltyBadge[]
  nextTierName?: string
  pointsToNextTier?: number
}

const DEFAULT_SUMMARY: LoyaltySummary = {
  balance: 0,
  ledger: [],
  badges: [],
}

const TIER_STYLES: Record<string, { ring: string; text: string; bg: string }> = {
  bronze: { ring: 'ring-amber-400', text: 'text-amber-700', bg: 'bg-amber-50' },
  silver: { ring: 'ring-slate-300', text: 'text-slate-700', bg: 'bg-slate-50' },
  gold: { ring: 'ring-yellow-400', text: 'text-yellow-700', bg: 'bg-yellow-50' },
  platinum: { ring: 'ring-cyan-400', text: 'text-cyan-700', bg: 'bg-cyan-50' },
}

const FALLBACK_BADGES: LoyaltyBadge[] = [
  { code: 'FIRST_ORDER', name: 'First Bite', description: 'Placed your first order', tier: 'bronze' },
  { code: 'FREQUENT_BUYER', name: 'Frequent Buyer', description: 'Ordered 5 times', tier: 'silver' },
  { code: 'REVIEWER', name: 'Honest Reviewer', description: 'Left 3 reviews', tier: 'bronze' },
]

type LoyaltyBadgesProps = {
  onOpenSpinWin?: () => void
  compact?: boolean
}

const LoyaltyBadges: React.FC<LoyaltyBadgesProps> = ({ onOpenSpinWin, compact = false }) => {
  const [summary, setSummary] = useState<LoyaltySummary>(DEFAULT_SUMMARY)
  const [loading, setLoading] = useState(true)
  const [hasErrored, setHasErrored] = useState(false)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const data: any = await featuresApi.getLoyaltySummary()
        if (cancelled) return
        setSummary({
          balance: Number(data?.balance ?? 0),
          ledger: Array.isArray(data?.ledger) ? data.ledger : [],
          badges: Array.isArray(data?.badges) && data.badges.length ? data.badges : FALLBACK_BADGES,
          nextTierName: data?.nextTierName,
          pointsToNextTier: data?.pointsToNextTier != null ? Number(data.pointsToNextTier) : undefined,
        })
      } catch (error) {
        if (cancelled) return
        setHasErrored(true)
        setSummary({
          balance: 0,
          ledger: [],
          badges: FALLBACK_BADGES,
          nextTierName: undefined,
          pointsToNextTier: undefined,
        })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const handleSpinWinCta = () => {
    if (onOpenSpinWin) {
      onOpenSpinWin()
      return
    }
    toast.success('Spin & Win modal should open from its host page.')
    if (typeof window !== 'undefined') {
      const el = document.querySelector<HTMLButtonElement>('[data-spin-win-open="true"]')
      if (el) el.click()
    }
  }

  const badges = summary.badges?.length ? summary.badges : (hasErrored ? FALLBACK_BADGES : [])

  return (
    <div className="w-full">
      <div className="rounded-2xl bg-gradient-to-br from-red-50 via-amber-50 to-white border border-amber-200/60 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-white shadow-sm ring-1 ring-amber-200">
              <Sparkles className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-amber-700 font-semibold">Loyalty Rewards</div>
              <div className="text-lg font-bold text-gray-900">Your Rewards Balance</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white ring-1 ring-amber-200 shadow-sm">
              <Coins className="w-5 h-5 text-amber-500" />
              <div className="text-right leading-tight">
                <div className="text-[10px] uppercase tracking-wider text-gray-500">Points</div>
                <div className="text-2xl font-extrabold text-gray-900 tabular-nums">
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400 inline" />
                  ) : (
                    summary.balance.toLocaleString()
                  )}
                </div>
              </div>
            </div>
            {!compact && (
              <button
                type="button"
                onClick={handleSpinWinCta}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-700 hover:to-amber-600 text-white text-sm font-semibold shadow-lg shadow-red-600/20 transition-all"
              >
                <Gift className="w-4 h-4" />
                Spin to Win
                <ExternalLink className="w-3.5 h-3.5 opacity-75" />
              </button>
            )}
          </div>
        </div>

        {summary.nextTierName && summary.pointsToNextTier != null && summary.pointsToNextTier > 0 && (
          <div className="mb-5">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-1.5">
              <span className="font-medium">Progress to <strong>{summary.nextTierName}</strong></span>
              <span className="tabular-nums">{summary.pointsToNextTier.toLocaleString()} points away</span>
            </div>
            <div className="h-2 w-full rounded-full bg-amber-100 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 via-red-500 to-amber-500 transition-all duration-700"
                style={{
                  width: `${Math.max(
                    6,
                    Math.min(100, 100 - (summary.pointsToNextTier / Math.max(1, summary.balance + summary.pointsToNextTier)) * 100),
                  )}%`,
                }}
              />
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-semibold text-gray-800">Your Badges</h3>
          </div>
          {loading && badges.length === 0 ? (
            <div className="flex items-center justify-center py-6 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin mr-2 text-gray-400" />
              Loading your badges…
            </div>
          ) : badges.length === 0 ? (
            <div className="text-sm text-gray-500 py-4 px-3 rounded-lg border border-dashed border-gray-200 text-center">
              Earn your first badge by placing an order or leaving a review.
            </div>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {badges.map((badge, idx) => {
                const tier = badge.tier || (idx === 0 ? 'gold' : idx === 1 ? 'silver' : 'bronze')
                const style = TIER_STYLES[tier] || TIER_STYLES.bronze
                return (
                  <li
                    key={badge.code || badge.id || badge.name || idx}
                    className={`flex items-start gap-3 rounded-xl border border-gray-100 ${style.bg} p-3 ring-1 ${style.ring}/40`}
                  >
                    <div className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center bg-white shadow-sm ring-1 ${style.ring}/70`}>
                      <Award className={`w-5 h-5 ${style.text}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className={`text-sm font-bold truncate ${style.text}`}>
                          {badge.name}
                        </div>
                        {badge.earnedAt && (
                          <span className="shrink-0 text-[10px] uppercase tracking-wider text-gray-500">
                            Earned
                          </span>
                        )}
                      </div>
                      {badge.description && (
                        <div className="mt-0.5 text-xs text-gray-600 line-clamp-2">
                          {badge.description}
                        </div>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export default LoyaltyBadges
