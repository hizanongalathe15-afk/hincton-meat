import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Plus, Save, Trash2, ThumbsUp, ThumbsDown, Search, X, HelpCircle, Eye } from 'lucide-react'
import { supportApi } from '../services/adminApi'
import { useConfirmationDialog } from '../hooks/useConfirmationDialog'
import ConfirmationDialog from '../components/ui/ConfirmationDialog'

const CATEGORIES = ['general', 'shipping', 'returns', 'payments', 'orders', 'products', 'account', 'wholesale', 'technical', 'loyalty']

const AdminFaqsPage = () => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [faqs, setFaqs] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string>('ALL')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState({ id: '', question: '', answer: '', category: 'general', orderWeight: 0, isPublished: true })
  const { isOpen, options, confirm, handleConfirm, handleCancel } = useConfirmationDialog()

  const load = async () => {
    setLoading(true)
    try {
      const data = await supportApi.listFaqs()
      setFaqs(data.faqs || data || [])
    } catch {
      toast.error('Could not load FAQs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = faqs.filter((f) => {
    const matchesSearch = !search || `${f.question} ${f.answer}`.toLowerCase().includes(search.toLowerCase())
    const matchesCat = category === 'ALL' || f.category === category
    return matchesSearch && matchesCat
  })

  const startNew = () => {
    setDraft({ id: '', question: '', answer: '', category: 'general', orderWeight: (faqs.length + 1) * 10, isPublished: true })
    setEditingId('NEW')
  }

  const startEdit = (f: any) => {
    setDraft({
      id: f.id,
      question: f.question || '',
      answer: f.answer || '',
      category: f.category || 'general',
      orderWeight: f.orderWeight || 0,
      isPublished: f.isPublished !== false,
    })
    setEditingId(f.id)
  }

  const submit = async () => {
    if (!draft.question.trim() || !draft.answer.trim()) {
      toast.error('Please fill in question and answer')
      return
    }
    setSaving(true)
    try {
      if (draft.id) {
        await supportApi.updateFaq(draft.id, {
          question: draft.question.trim(),
          answer: draft.answer.trim(),
          category: draft.category,
          orderWeight: draft.orderWeight,
          isPublished: draft.isPublished,
        })
        toast.success('FAQ updated')
      } else {
        await supportApi.createFaq({
          question: draft.question.trim(),
          answer: draft.answer.trim(),
          category: draft.category,
          orderWeight: draft.orderWeight,
          isPublished: draft.isPublished,
        })
        toast.success('FAQ created')
      }
      setEditingId(null)
      await load()
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Could not save FAQ')
    } finally {
      setSaving(false)
    }
  }

  const remove = (f: any) => {
    confirm({
      title: 'Delete FAQ?',
      message: `Delete: "${f.question}"? This removes it from the help center.`,
      type: 'danger',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          await supportApi.deleteFaq(f.id)
          toast.success('FAQ deleted')
          await load()
        } catch {
          toast.error('Could not delete FAQ')
        }
      },
    })
  }

  if (editingId) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
        <button onClick={() => setEditingId(null)} className="inline-flex items-center gap-2 text-sm font-bold text-red-700 hover:text-red-800 mb-6">
          <X className="h-4 w-4" /> Back to FAQs
        </button>
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-gray-950 via-[#9f2f20] to-gray-950 text-white px-6 py-5">
            <h1 className="text-2xl font-extrabold">{draft.id ? 'Edit FAQ' : 'Create FAQ'}</h1>
            <p className="text-sm text-red-200 mt-1">This FAQ will appear in the public Help Center.</p>
          </div>
          <div className="p-6 space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5">Category</label>
              <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-500">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c[0].toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5">Question</label>
              <input value={draft.question} onChange={(e) => setDraft({ ...draft, question: e.target.value })} placeholder="Example: How do I track my order?" className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-500" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5">Answer</label>
              <textarea value={draft.answer} onChange={(e) => setDraft({ ...draft, answer: e.target.value })} rows={6} placeholder="Write the full answer…" className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-500" />
            </div>
            <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5">Order weight</label>
                <input type="number" value={draft.orderWeight} onChange={(e) => setDraft({ ...draft, orderWeight: Number(e.target.value) })} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-500" />
              </div>
              <label className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-200 bg-white text-sm">
                <input type="checkbox" checked={draft.isPublished} onChange={(e) => setDraft({ ...draft, isPublished: e.target.checked })} />
                Published (visible)
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setEditingId(null)} className="rounded-lg border border-gray-200 bg-white px-5 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={submit} disabled={saving} className="rounded-lg bg-red-600 px-5 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60 inline-flex items-center gap-2">
                <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save FAQ'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-950 inline-flex items-center gap-2"><HelpCircle className="h-8 w-8 text-red-600" /> FAQ Management</h1>
          <p className="mt-1 text-sm text-gray-600">Database-backed FAQs shown in your public Help Center. Customers can mark them helpful.</p>
        </div>
        <button onClick={startNew} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-700">
          <Plus className="h-4 w-4" /> Add FAQ
        </button>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4 flex flex-col gap-3 lg:flex-row lg:items-center">
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-500">
            <option value="ALL">All categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c[0].toUpperCase() + c.slice(1)}</option>)}
          </select>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search FAQs…" className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-4 text-sm focus:border-red-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500" />
          </div>
        </div>

        {loading ? (
          <div className="divide-y divide-gray-100">
            {[0, 1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse bg-white" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <HelpCircle className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 font-semibold text-gray-700">No FAQs match.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((f) => (
              <div key={f.id} className="p-4 sm:p-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-gray-950">{f.question}</h3>
                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-700">
                      {f.category?.[0]?.toUpperCase() + (f.category?.slice(1) || '')}
                    </span>
                    {f.isPublished === false && (
                      <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-700">Draft</span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-gray-600 line-clamp-3">{f.answer}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> Views: {f.views || 0}</span>
                    <span className="inline-flex items-center gap-1 text-green-700"><ThumbsUp className="h-3.5 w-3.5" /> {f.helpfulYes || 0}</span>
                    <span className="inline-flex items-center gap-1 text-red-700"><ThumbsDown className="h-3.5 w-3.5" /> {f.helpfulNo || 0}</span>
                    {typeof f.orderWeight === 'number' && <span>Weight: {f.orderWeight}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => startEdit(f)} className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-bold text-gray-700 hover:bg-gray-50">Edit</button>
                  <button onClick={() => remove(f)} className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-bold text-red-700 hover:bg-red-50 inline-flex items-center gap-1">
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmationDialog isOpen={isOpen} onClose={handleCancel} onConfirm={handleConfirm} title={options?.title || ''} message={options?.message || ''} confirmText={options?.confirmText} cancelText={options?.cancelText} type={options?.type} />
    </div>
  )
}

export default AdminFaqsPage
