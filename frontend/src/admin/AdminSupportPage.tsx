import { useEffect, useMemo, useState } from 'react'
import {
  Search, ChevronRight, LifeBuoy, Clock, Filter,
  Send, X, ArrowLeft, Trash2, CheckCircle2, User, Mail, Phone,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { supportApi } from '../services/adminApi'
import ConfirmationDialog from '../components/ui/ConfirmationDialog'
import { useConfirmationDialog } from '../hooks/useConfirmationDialog'

const STATUS_FILTERS = ['ALL', 'OPEN', 'IN_PROGRESS', 'WAITING_ON_CUSTOMER', 'WAITING_ON_THIRD_PARTY', 'RESOLVED', 'CLOSED']

const CATEGORY_LABELS: Record<string, string> = {
  SHIPPING: 'Shipping', PAYMENTS: 'Payments', RETURNS: 'Returns', ORDERS: 'Orders',
  PRODUCTS: 'Products', ACCOUNT: 'Account', GENERAL_INQUIRY: 'General', FEEDBACK: 'Feedback',
  TECHNICAL: 'Technical', WHOLESALE: 'Wholesale',
}

const STATUS_STYLE: Record<string, string> = {
  OPEN: 'bg-yellow-100 text-yellow-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  WAITING_ON_CUSTOMER: 'bg-purple-100 text-purple-800',
  WAITING_ON_THIRD_PARTY: 'bg-orange-100 text-orange-800',
  RESOLVED: 'bg-green-100 text-green-800',
  CLOSED: 'bg-gray-100 text-gray-700',
}

const PRIORITY_STYLE: Record<string, string> = {
  URGENT: 'bg-red-100 text-red-800',
  HIGH: 'bg-orange-100 text-orange-800',
  MEDIUM: 'bg-blue-100 text-blue-800',
  LOW: 'bg-gray-100 text-gray-700',
}

interface Ticket {
  id: string
  ticketNumber: string
  subject: string
  category: string | null
  priority: string | null
  status: string | null
  message: string
  attachments?: string[] | null
  csatScore?: number | null
  csatComment?: string | null
  assignedTo?: string | null
  createdAt: string
  updatedAt: string
  user?: { id: string; name: string; email: string; phone?: string | null } | null
  responses?: TicketResponse[]
}

interface TicketResponse {
  id: string
  senderName: string
  senderRole: string
  message: string
  attachments?: string[] | null
  createdAt: string
}

const AdminSupportPage = () => {
  const [loading, setLoading] = useState(true)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selected, setSelected] = useState<Ticket | null>(null)
  const [reply, setReply] = useState('')
  const [replying, setReplying] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL')
  const [search, setSearch] = useState('')
  const [patchStatus, setPatchStatus] = useState<string>('')
  const [patchPriority, setPatchPriority] = useState<string>('')
  const { isOpen, options, confirm, handleConfirm, handleCancel } = useConfirmationDialog()

  const loadTickets = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (statusFilter !== 'ALL') params.status = statusFilter
      if (priorityFilter !== 'ALL') params.priority = priorityFilter
      if (search.trim()) params.q = search.trim()
      const data = await supportApi.listTickets(params)
      setTickets(data.tickets || data || [])
    } catch (err: any) {
      console.error(err)
      toast.error('Could not load tickets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTickets()
  }, [statusFilter, priorityFilter, search])

  const loadDetail = async (id: string) => {
    try {
      const data = await supportApi.getTicket(id)
      setSelected(data.ticket || null)
      setSelectedId(id)
      setPatchStatus(data.ticket?.status || '')
      setPatchPriority(data.ticket?.priority || '')
      setReply('')
    } catch {
      toast.error('Could not load ticket detail')
    }
  }

  useEffect(() => {
    if (selectedId) loadDetail(selectedId)
  }, [selectedId])

  const stats = useMemo(() => {
    return {
      total: tickets.length,
      open: tickets.filter((t) => t.status === 'OPEN').length,
      inProgress: tickets.filter((t) => t.status === 'IN_PROGRESS').length,
      resolved: tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length,
      avgCsat: tickets.filter((t) => typeof t.csatScore === 'number').reduce((s, t) => s + Number(t.csatScore || 0), 0) / Math.max(1, tickets.filter((t) => typeof t.csatScore === 'number').length) || 0,
    }
  }, [tickets])

  const applyPatch = async () => {
    if (!selected) return
    try {
      const payload: any = {}
      if (patchStatus && patchStatus !== selected.status) payload.status = patchStatus
      if (patchPriority && patchPriority !== selected.priority) payload.priority = patchPriority
      if (!Object.keys(payload).length) { toast.success('No changes'); return }
      await supportApi.patchTicket(selected.id, payload)
      toast.success('Ticket updated')
      await loadDetail(selected.id)
      await loadTickets()
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Could not update')
    }
  }

  const submitReply = async () => {
    if (!selected || !reply.trim()) return
    setReplying(true)
    try {
      const payload: any = { message: reply.trim() }
      if (patchStatus && patchStatus !== selected.status) payload.status = patchStatus
      if (patchPriority && patchPriority !== selected.priority) payload.priority = patchPriority
      await supportApi.replyTicket(selected.id, payload)
      toast.success('Reply sent')
      await loadDetail(selected.id)
      await loadTickets()
      setReply('')
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Could not reply')
    } finally {
      setReplying(false)
    }
  }

  const requestDelete = (t: Ticket) => {
    confirm({
      title: 'Delete ticket?',
      message: `Delete ticket ${t.ticketNumber}? This action is permanent.`,
      type: 'danger',
      onConfirm: async () => {
        try {
          await supportApi.deleteTicket(t.id)
          toast.success('Ticket deleted')
          if (selectedId === t.id) { setSelected(null); setSelectedId(null) }
          await loadTickets()
        } catch {
          toast.error('Could not delete')
        }
      },
      confirmText: 'Delete',
      cancelText: 'Cancel',
    })
  }

  if (selected) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <button onClick={() => { setSelected(null); setSelectedId(null) }} className="inline-flex items-center gap-2 text-sm font-bold text-red-700 hover:text-red-800 mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to all tickets
        </button>
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-gray-100 px-6 py-5 bg-gradient-to-r from-gray-950 via-[#9f2f20] to-gray-950 text-white">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-extrabold">{selected.subject}</h1>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${STATUS_STYLE[selected.status || 'OPEN']}`}>
                    {(selected.status || 'OPEN').replace(/_/g, ' ')}
                  </span>
                  {selected.priority && (
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${PRIORITY_STYLE[selected.priority]}`}>
                      {selected.priority}
                    </span>
                  )}
                  {selected.category && (
                    <span className="rounded-full bg-white/10 backdrop-blur px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide">
                      {CATEGORY_LABELS[selected.category] || selected.category}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-xs text-red-200">#{selected.ticketNumber || selected.id} · Opened {new Date(selected.createdAt).toLocaleString()}</p>
                {selected.csatScore && (
                  <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-green-600/30 border border-green-400/40 px-3 py-1 text-xs text-green-50 font-bold">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Customer rated: {selected.csatScore}/5 {selected.csatComment && <span className="opacity-90">“{selected.csatComment}”</span>}
                  </div>
                )}
              </div>
              <button onClick={() => requestDelete(selected)} className="inline-flex self-start items-center gap-1.5 rounded-lg border border-red-400/40 bg-red-500/20 px-3 py-1.5 text-xs font-bold text-red-50 hover:bg-red-500/40">
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </div>
          </div>

          {selected.user && (
            <div className="border-b border-gray-100 px-6 py-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-gray-100 p-2"><User className="h-5 w-5 text-gray-600" /></div>
                <div>
                  <p className="font-bold text-gray-950">{selected.user.name}</p>
                  <p className="text-xs text-gray-500">{selected.user.email}</p>
                </div>
              </div>
              <a href={`mailto:${selected.user.email}`} className="inline-flex items-center gap-1.5 text-sm text-gray-700 hover:text-red-700"><Mail className="h-4 w-4" /> Email</a>
              {selected.user.phone && <a href={`tel:${selected.user.phone}`} className="inline-flex items-center gap-1.5 text-sm text-gray-700 hover:text-red-700"><Phone className="h-4 w-4" /> {selected.user.phone}</a>}
            </div>
          )}

          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-gray-800">{selected.user?.name || 'Customer'} · Original message</p>
                <p className="text-xs text-gray-500">{new Date(selected.createdAt).toLocaleString()}</p>
              </div>
              <p className="whitespace-pre-wrap text-gray-800 leading-7">{selected.message}</p>
              {selected.attachments && selected.attachments.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {selected.attachments.map((a: string, idx: number) => (
                    <a key={idx} href={a} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700">Attachment {idx + 1}</a>
                  ))}
                </div>
              )}
            </div>
            {(selected.responses || []).map((r: TicketResponse) => (
              <div key={r.id} className={`rounded-lg border p-4 ${r.senderRole !== 'USER' ? 'bg-white border-gray-200 ml-6' : 'bg-red-50 border-red-100 mr-6'}`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-800">{r.senderName} {r.senderRole !== 'USER' && <span className="text-xs font-bold ml-1 text-red-700">· Staff</span>}</p>
                  <p className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleString()}</p>
                </div>
                <p className="whitespace-pre-wrap text-gray-800 leading-7">{r.message}</p>
                {r.attachments && r.attachments.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {r.attachments.map((a: string, idx: number) => (
                      <a key={idx} href={a} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700">Attachment {idx + 1}</a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 bg-gray-50 px-6 py-5 space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">Status</label>
                <select value={patchStatus || selected.status || 'OPEN'} onChange={e => setPatchStatus(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-500">
                  {STATUS_FILTERS.filter(s => s !== 'ALL').map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">Priority</label>
                <select value={patchPriority || selected.priority || 'MEDIUM'} onChange={e => setPatchPriority(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-500">
                  {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <button onClick={applyPatch} className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50">
              Save properties
            </button>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">Reply to customer</label>
              <textarea value={reply} onChange={e => setReply(e.target.value)} rows={4} placeholder="Type a response that will be emailed to the customer…" className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-500" />
              <div className="mt-3 flex items-center justify-end gap-2">
                <button onClick={submitReply} disabled={!reply.trim() || replying} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60">
                  <Send className="h-4 w-4" /> {replying ? 'Sending…' : 'Send reply'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <ConfirmationDialog isOpen={isOpen} onClose={handleCancel} onConfirm={handleConfirm} title={options?.title || ''} message={options?.message || ''} confirmText={options?.confirmText} cancelText={options?.cancelText} type={options?.type} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-950">Support Tickets</h1>
          <p className="mt-1 text-sm text-gray-600">Respond to customers, triage, and manage support work.</p>
        </div>
      </div>

      <div className="grid gap-4 mb-8 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total tickets', value: stats.total, icon: LifeBuoy, color: 'bg-blue-50 text-blue-700' },
          { label: 'Open', value: stats.open, icon: Clock, color: 'bg-yellow-50 text-yellow-700' },
          { label: 'In Progress', value: stats.inProgress, icon: Send, color: 'bg-purple-50 text-purple-700' },
          { label: 'Avg CSAT', value: stats.avgCsat ? `${stats.avgCsat.toFixed(1)} / 5` : '—', icon: CheckCircle2, color: 'bg-green-50 text-green-700' },
        ].map((c) => (
          <div key={c.label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{c.label}</p>
                <p className="mt-2 text-3xl font-black text-gray-950">{c.value}</p>
              </div>
              <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${c.color}`}>
                <c.icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4 flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-500">
              {STATUS_FILTERS.map(s => <option key={s} value={s}>Status: {s.replace(/_/g, ' ')}</option>)}
            </select>
            <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-500">
              {['ALL', 'LOW', 'MEDIUM', 'HIGH', 'URGENT'].map(p => <option key={p} value={p}>Priority: {p}</option>)}
            </select>
          </div>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search ticket subject, message, user..." className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-4 text-sm focus:border-red-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500" />
          </div>
        </div>

        {loading ? (
          <div className="divide-y divide-gray-100">
            {[0, 1, 2, 3].map(i => <div key={i} className="h-20 animate-pulse bg-white" />)}
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center">
            <LifeBuoy className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 font-semibold text-gray-700">No tickets match your filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {tickets.map((t) => (
              <button key={t.id} onClick={() => { setSelectedId(t.id) }} className="w-full text-left p-4 sm:p-5 hover:bg-gray-50 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-gray-950 truncate">{t.subject}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_STYLE[t.status || 'OPEN']}`}>
                      {(t.status || 'OPEN').replace(/_/g, ' ')}
                    </span>
                    {t.priority && (
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${PRIORITY_STYLE[t.priority]}`}>
                        {t.priority}
                      </span>
                    )}
                    {t.category && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-700">
                        {CATEGORY_LABELS[t.category] || t.category}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-600 truncate max-w-3xl">{t.message}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    <span className="truncate">#{t.ticketNumber || t.id?.slice(0, 8)?.toUpperCase()}</span>
                    <span>·</span>
                    <span className="truncate">{t.user?.name || 'Customer'}</span>
                    {t.user?.email && <><span>·</span><span className="truncate">{t.user.email}</span></>}
                    <span>·</span>
                    <span>{new Date(t.updatedAt || t.createdAt).toLocaleString()}</span>
                    {typeof t.csatScore === 'number' && (
                      <>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1 font-medium text-green-700"><CheckCircle2 className="h-3 w-3" /> CSAT {t.csatScore}/5</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <X onClick={(e) => { e.stopPropagation(); requestDelete(t) }} className="h-4 w-4 p-1 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 cursor-pointer" />
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <ConfirmationDialog isOpen={isOpen} onClose={handleCancel} onConfirm={handleConfirm} title={options?.title || ''} message={options?.message || ''} confirmText={options?.confirmText} cancelText={options?.cancelText} type={options?.type} />
    </div>
  )
}

export default AdminSupportPage
