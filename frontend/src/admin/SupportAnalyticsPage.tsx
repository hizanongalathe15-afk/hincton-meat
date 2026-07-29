import { useEffect, useState } from 'react'
import {
  BarChart2, Star, Clock, TrendingUp, CheckCircle2, AlertCircle,
  RefreshCw, Ticket, Zap, Gift, Download,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { communityAdminApi } from '../services/adminApi'

const STATUS_COLOR: Record<string, string> = {
  OPEN: 'bg-yellow-100 text-yellow-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  WAITING_ON_CUSTOMER: 'bg-purple-100 text-purple-800',
  WAITING_ON_THIRD_PARTY: 'bg-orange-100 text-orange-800',
  RESOLVED: 'bg-green-100 text-green-800',
  CLOSED: 'bg-gray-100 text-gray-700',
}

const PRIORITY_COLOR: Record<string, string> = {
  URGENT: 'bg-red-100 text-red-800',
  HIGH: 'bg-orange-100 text-orange-800',
  MEDIUM: 'bg-blue-100 text-blue-800',
  LOW: 'bg-gray-100 text-gray-700',
}

interface Analytics {
  summary: {
    total: number
    open: number
    resolved: number
    avgCsat: number | null
    csatResponses: number
    avgResolutionHours: number | null
    resolutionRate: number
    periodDays: number
  }
  byStatus: { status: string; count: number }[]
  byPriority: { priority: string; count: number }[]
  byCategory: { category: string; count: number }[]
  recentTickets: { id: string; ticketNumber: string; subject: string; status: string; priority: string; createdAt: string }[]
}

const CsatStars = ({ score }: { score: number | null }) => {
  if (score === null) return <span className="text-gray-400 text-sm">No data</span>
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`h-4 w-4 ${s <= Math.round(score) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
      ))}
      <span className="ml-1 text-sm font-semibold text-gray-700">{score.toFixed(1)}</span>
    </div>
  )
}

const BarRow = ({ label, count, max, colorClass }: { label: string; count: number; max: number; colorClass: string }) => (
  <div className="flex items-center gap-3">
    <span className={`w-40 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}>{label}</span>
    <div className="flex-1 rounded-full bg-gray-100 h-2.5">
      <div className={`h-2.5 rounded-full bg-red-500`} style={{ width: `${max > 0 ? (count / max) * 100 : 0}%` }} />
    </div>
    <span className="w-6 text-right text-sm font-semibold text-gray-700">{count}</span>
  </div>
)

const SupportAnalyticsPage = () => {
  const [data, setData] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)
  const [couponLoading, setCouponLoading] = useState(false)
  const [generatedCoupon, setGeneratedCoupon] = useState<string | null>(null)

  const load = async (d = days) => {
    setLoading(true)
    try {
      const from = new Date(Date.now() - d * 86400000).toISOString()
      const result = await communityAdminApi.getSupportAnalytics({ from })
      setData(result)
    } catch {
      toast.error('Failed to load support analytics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleDaysChange = (d: number) => {
    setDays(d)
    load(d)
  }

  const generateCoupon = async () => {
    setCouponLoading(true)
    try {
      const result = await communityAdminApi.generateDowntimeCoupon({ discountType: 'PERCENTAGE', discountValue: 10, validDays: 7, prefix: 'SORRY' })
      setGeneratedCoupon(result.coupon.code)
      toast.success(`Coupon created: ${result.coupon.code}`)
    } catch {
      toast.error('Failed to generate coupon')
    } finally {
      setCouponLoading(false)
    }
  }

  const copyCode = () => {
    if (!generatedCoupon) return
    navigator.clipboard.writeText(generatedCoupon).then(() => toast.success('Copied!'))
  }

  const s = data?.summary

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Analytics</h1>
          <p className="text-sm text-gray-500">Ticket metrics, CSAT scores, and resolution performance</p>
        </div>
        <div className="flex items-center gap-3">
          {[7, 14, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => handleDaysChange(d)}
              className={`rounded-full px-3 py-1 text-sm font-medium ${days === d ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              {d}d
            </button>
          ))}
          <button onClick={() => load()} className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Downtime coupon generator */}
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-dashed border-red-200 bg-red-50 p-4">
        <Gift className="h-6 w-6 text-red-600 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-red-800">Generate downtime apology coupon</p>
          <p className="text-xs text-red-600">Auto-creates a 10% off coupon valid 7 days. Share with affected customers.</p>
        </div>
        {generatedCoupon && (
          <button onClick={copyCode} className="rounded-lg bg-white border border-red-200 px-3 py-1.5 text-sm font-mono font-bold text-red-700 hover:bg-red-50">
            {generatedCoupon} — Copy
          </button>
        )}
        <button
          onClick={generateCoupon}
          disabled={couponLoading}
          className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
        >
          <Zap className="h-4 w-4" />
          {couponLoading ? 'Generating…' : 'Generate coupon'}
        </button>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-red-600 border-t-transparent" />
        </div>
      ) : !data ? null : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { icon: Ticket, label: 'Total tickets', value: s!.total, sub: `Last ${s!.periodDays} days` },
              { icon: AlertCircle, label: 'Open / In progress', value: s!.open, sub: 'Pending resolution', highlight: s!.open > 10 },
              { icon: CheckCircle2, label: 'Resolved / Closed', value: s!.resolved, sub: `${s!.resolutionRate}% resolution rate` },
              { icon: Star, label: 'Avg CSAT', value: s!.avgCsat !== null ? `${s!.avgCsat}/5` : '—', sub: `${s!.csatResponses} responses` },
              { icon: Clock, label: 'Avg resolution', value: s!.avgResolutionHours !== null ? `${s!.avgResolutionHours}h` : '—', sub: 'Hours to resolve' },
              { icon: TrendingUp, label: 'Resolution rate', value: `${s!.resolutionRate}%`, sub: 'Resolved of total' },
            ].map(({ icon: Icon, label, value, sub, highlight }) => (
              <div key={label} className={`rounded-2xl p-4 shadow-sm ring-1 ${highlight ? 'ring-red-200 bg-red-50' : 'ring-gray-200 bg-white'}`}>
                <Icon className={`h-5 w-5 ${highlight ? 'text-red-600' : 'text-gray-400'}`} />
                <p className="mt-2 text-2xl font-extrabold text-gray-900">{value}</p>
                <p className="text-xs font-semibold text-gray-700">{label}</p>
                <p className="text-xs text-gray-400">{sub}</p>
              </div>
            ))}
          </div>

          {/* CSAT visual */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <BarChart2 className="h-5 w-5 text-red-600" />
              <h2 className="font-bold text-gray-900">Customer Satisfaction (CSAT)</h2>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-5xl font-black text-gray-900">{s!.avgCsat !== null ? s!.avgCsat.toFixed(1) : '—'}</div>
              <div>
                <CsatStars score={s!.avgCsat} />
                <p className="mt-1 text-sm text-gray-500">{s!.csatResponses} customers rated their experience</p>
                <p className="text-xs text-gray-400 mt-0.5">Scale: 1 (poor) – 5 (excellent)</p>
              </div>
            </div>
          </div>

          {/* Charts row */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* By status */}
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
              <h2 className="mb-4 font-bold text-gray-900">By Status</h2>
              <div className="space-y-3">
                {data.byStatus.map(({ status, count }) => (
                  <BarRow key={status} label={status.replace(/_/g, ' ')} count={count} max={Math.max(...data.byStatus.map((s) => s.count))} colorClass={STATUS_COLOR[status] || 'bg-gray-100 text-gray-700'} />
                ))}
              </div>
            </div>

            {/* By priority */}
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
              <h2 className="mb-4 font-bold text-gray-900">By Priority</h2>
              <div className="space-y-3">
                {data.byPriority.map(({ priority, count }) => (
                  <BarRow key={priority} label={priority} count={count} max={Math.max(...data.byPriority.map((p) => p.count))} colorClass={PRIORITY_COLOR[priority] || 'bg-gray-100 text-gray-700'} />
                ))}
              </div>
            </div>

            {/* By category */}
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
              <h2 className="mb-4 font-bold text-gray-900">By Category</h2>
              <div className="space-y-3">
                {data.byCategory.slice(0, 8).map(({ category, count }) => (
                  <BarRow key={category || 'Uncategorized'} label={category || 'Uncategorized'} count={count} max={Math.max(...data.byCategory.map((c) => c.count))} colorClass="bg-gray-100 text-gray-700" />
                ))}
              </div>
            </div>
          </div>

          {/* Recent tickets */}
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-bold text-gray-900">Recent Tickets</h2>
              <Download className="h-4 w-4 text-gray-400" />
            </div>
            <div className="divide-y">
              {data.recentTickets.map((t) => (
                <div key={t.id} className="flex items-center gap-4 px-6 py-3">
                  <span className="font-mono text-xs text-gray-400 w-24 shrink-0">{t.ticketNumber}</span>
                  <span className="flex-1 truncate text-sm text-gray-800">{t.subject}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[t.status] || 'bg-gray-100'}`}>{t.status.replace(/_/g, ' ')}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_COLOR[t.priority] || 'bg-gray-100'}`}>{t.priority}</span>
                  <span className="text-xs text-gray-400 w-24 text-right">{new Date(t.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default SupportAnalyticsPage
