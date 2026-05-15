import { useCallback, useEffect, useRef, useState } from 'react'
import { Activity, ExternalLink, Eye, Link as LinkIcon, RefreshCw, Users } from 'lucide-react'
import { analyticsApi } from '../services/adminApi'
import LinkifiedText from '../components/ui/LinkifiedText'

type RealtimeVisits = {
  generatedAt: string
  today: {
    visits: number
    uniqueVisitors: number
    activeNow: number
    linkClicks: number
  }
  topPages: Array<{ path: string; visits: number }>
  topLinks: Array<{ url: string; label: string; clicks: number }>
  recentViews: Array<{
    id: string
    path: string
    title?: string
    referrer?: string
    deviceType?: string
    browser?: string
    os?: string
    language?: string
    viewedAt: string
  }>
}

const RealtimeVisitsPanel = () => {
  const [data, setData] = useState<RealtimeVisits | null>(null)
  const [loading, setLoading] = useState(true)
  const [autoSync, setAutoSync] = useState(true)
  const abortRef = useRef<AbortController | null>(null)

  const loadVisits = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)
    try {
      const response = await analyticsApi.getRealtimeVisits(controller.signal)
      setData(response)
    } catch (error: any) {
      if (error?.name !== 'CanceledError' && error?.message !== 'canceled') {
        console.error('Failed to load live visits:', error)
      }
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    loadVisits()
    return () => abortRef.current?.abort()
  }, [loadVisits])

  useEffect(() => {
    if (!autoSync) return
    const intervalId = window.setInterval(loadVisits, 30000)
    const handleVisibilityChange = () => {
      if (!document.hidden) loadVisits()
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [autoSync, loadVisits])

  const statCards = [
    { label: 'Visits Today', value: data?.today.visits ?? 0, icon: Eye, color: 'bg-blue-500' },
    { label: 'Unique Visitors', value: data?.today.uniqueVisitors ?? 0, icon: Users, color: 'bg-green-500' },
    { label: 'Active Now', value: data?.today.activeNow ?? 0, icon: Activity, color: 'bg-red-500' },
    { label: 'Link Taps Today', value: data?.today.linkClicks ?? 0, icon: LinkIcon, color: 'bg-purple-500' },
  ]

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Live Visits</h2>
          <p className="text-gray-600">
            Real project page opens and link taps today{data?.generatedAt ? ` - synced ${new Date(data.generatedAt).toLocaleTimeString()}` : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={loadVisits} className="inline-flex items-center gap-2 rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button type="button" onClick={() => setAutoSync((value) => !value)} className={`rounded px-4 py-2 text-sm font-semibold ${autoSync ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
            {autoSync ? 'Auto Sync ON' : 'Auto Sync OFF'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="rounded-lg bg-white p-5 shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.label}</p>
                  <p className="mt-1 text-3xl font-bold text-gray-950">{Number(card.value).toLocaleString()}</p>
                </div>
                <div className={`${card.color} rounded-full p-3 text-white`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="mb-4 text-base font-semibold text-gray-900">Top Pages Today</h3>
          <div className="space-y-3">
            {data?.topPages?.length ? data.topPages.map((page) => (
              <div key={page.path} className="flex items-center justify-between gap-4 rounded border border-gray-100 px-3 py-2">
                <span className="truncate text-sm font-medium text-gray-800">{page.path}</span>
                <span className="text-sm font-bold text-gray-950">{page.visits.toLocaleString()}</span>
              </div>
            )) : <p className="text-sm text-gray-500">No visits recorded today yet.</p>}
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="mb-4 text-base font-semibold text-gray-900">Top Link Taps Today</h3>
          <div className="space-y-3">
            {data?.topLinks?.length ? data.topLinks.map((link) => (
              <div key={`${link.url}-${link.label}`} className="flex items-center justify-between gap-4 rounded border border-gray-100 px-3 py-2">
                <span className="min-w-0 truncate text-sm text-gray-800"><LinkifiedText text={link.label || link.url} /></span>
                <span className="text-sm font-bold text-gray-950">{link.clicks.toLocaleString()}</span>
              </div>
            )) : <p className="text-sm text-gray-500">No link taps recorded today yet.</p>}
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-white p-6 shadow">
        <h3 className="mb-4 text-base font-semibold text-gray-900">Recent Visits</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-3 py-2">Page</th>
                <th className="px-3 py-2">Device</th>
                <th className="px-3 py-2">Language</th>
                <th className="px-3 py-2">Referrer</th>
                <th className="px-3 py-2">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data?.recentViews?.length ? data.recentViews.map((visit) => (
                <tr key={visit.id}>
                  <td className="max-w-xs truncate px-3 py-3 font-medium text-gray-900">{visit.path}</td>
                  <td className="px-3 py-3 text-gray-600">{[visit.deviceType, visit.browser, visit.os].filter(Boolean).join(' / ') || '-'}</td>
                  <td className="px-3 py-3 text-gray-600">{visit.language || '-'}</td>
                  <td className="max-w-xs truncate px-3 py-3 text-gray-600">
                    {visit.referrer ? <span className="inline-flex items-center gap-1"><ExternalLink className="h-3 w-3" /><LinkifiedText text={visit.referrer} /></span> : '-'}
                  </td>
                  <td className="px-3 py-3 text-gray-600">{new Date(visit.viewedAt).toLocaleTimeString()}</td>
                </tr>
              )) : (
                <tr>
                  <td className="px-3 py-6 text-center text-gray-500" colSpan={5}>No recent visits yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

export default RealtimeVisitsPanel
