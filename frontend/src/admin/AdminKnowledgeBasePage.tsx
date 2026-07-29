import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Plus, Save, Trash2, ThumbsUp, ThumbsDown, Search, X, BookOpen, Eye, Clock, Sparkles } from 'lucide-react'
import { supportApi } from '../services/adminApi'
import { useConfirmationDialog } from '../hooks/useConfirmationDialog'
import ConfirmationDialog from '../components/ui/ConfirmationDialog'

const CATEGORIES = ['general', 'getting-started', 'shipping', 'returns', 'payments', 'orders', 'products', 'account', 'wholesale', 'technical', 'loyalty']

const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

const AdminKnowledgeBasePage = () => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [articles, setArticles] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string>('ALL')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<any>({
    id: '', title: '', slug: '', summary: '', content: '',
    category: 'general', tags: '', orderWeight: 0, isPublished: true, featuredImage: '',
    estimatedReadMinutes: 3,
  })
  const { isOpen, options, confirm, handleConfirm, handleCancel } = useConfirmationDialog()

  const load = async () => {
    setLoading(true)
    try {
      const data = await supportApi.listArticles()
      setArticles(data.articles || data || [])
    } catch {
      toast.error('Could not load articles')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => articles.filter((a) => {
    const s = search.toLowerCase()
    const matchesSearch = !search || `${a.title} ${a.summary || ''} ${a.content || ''} ${a.tags || ''}`.toLowerCase().includes(s)
    const matchesCat = category === 'ALL' || a.category === category
    return matchesSearch && matchesCat
  }), [articles, search, category])

  const startNew = () => {
    setDraft({
      id: '', title: '', slug: '', summary: '', content: '',
      category: 'general', tags: '', orderWeight: (articles.length + 1) * 10, isPublished: true, featuredImage: '',
      estimatedReadMinutes: 3,
    })
    setEditingId('NEW')
  }

  const startEdit = (a: any) => {
    setDraft({
      id: a.id,
      title: a.title || '',
      slug: a.slug || '',
      summary: a.summary || '',
      content: a.content || '',
      category: a.category || 'general',
      tags: Array.isArray(a.tags) ? a.tags.join(', ') : (a.tags || ''),
      orderWeight: a.orderWeight || 0,
      isPublished: a.isPublished !== false,
      featuredImage: a.featuredImage || '',
      estimatedReadMinutes: a.estimatedReadMinutes || 3,
    })
    setEditingId(a.id)
  }

  const submit = async () => {
    if (!draft.title.trim() || !draft.content.trim()) {
      toast.error('Please fill in title and content')
      return
    }
    const payload: any = {
      title: draft.title.trim(),
      slug: (draft.slug || slugify(draft.title)).trim() || slugify(draft.title),
      summary: draft.summary.trim(),
      content: draft.content.trim(),
      category: draft.category,
      tags: typeof draft.tags === 'string' ? draft.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : (draft.tags || []),
      orderWeight: draft.orderWeight,
      isPublished: draft.isPublished,
      featuredImage: draft.featuredImage || undefined,
      estimatedReadMinutes: Number(draft.estimatedReadMinutes) || 3,
    }
    setSaving(true)
    try {
      if (draft.id) {
        await supportApi.updateArticle(draft.id, payload)
        toast.success('Article updated')
      } else {
        await supportApi.createArticle(payload)
        toast.success('Article created')
      }
      setEditingId(null)
      await load()
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Could not save article')
    } finally {
      setSaving(false)
    }
  }

  const remove = (a: any) => {
    confirm({
      title: 'Delete article?',
      message: `Delete: "${a.title}"? This removes it from the knowledge base.`,
      type: 'danger',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          await supportApi.deleteArticle(a.id)
          toast.success('Article deleted')
          await load()
        } catch {
          toast.error('Could not delete article')
        }
      },
    })
  }

  if (editingId) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
        <button onClick={() => setEditingId(null)} className="inline-flex items-center gap-2 text-sm font-bold text-red-700 hover:text-red-800 mb-6">
          <X className="h-4 w-4" /> Back to articles
        </button>
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-gray-950 via-[#9f2f20] to-gray-950 text-white px-6 py-5">
            <h1 className="text-2xl font-extrabold inline-flex items-center gap-2"><BookOpen className="h-6 w-6" /> {draft.id ? 'Edit Article' : 'Create Article'}</h1>
            <p className="text-sm text-red-200 mt-1">Long-form help guide for the public Help Center.</p>
          </div>
          <div className="p-6 space-y-5">
            <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5">Title</label>
                <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value, slug: draft.slug || slugify(e.target.value) })} placeholder="How to place your first order" className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-500" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5">URL Slug</label>
                <input value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: slugify(e.target.value) })} placeholder="auto-generated from title" className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-500" />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_1fr_1fr_auto]">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5">Category</label>
                <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-500">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5">Read time (minutes)</label>
                <input type="number" min={1} value={draft.estimatedReadMinutes} onChange={(e) => setDraft({ ...draft, estimatedReadMinutes: Number(e.target.value) })} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-500" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5">Order weight</label>
                <input type="number" value={draft.orderWeight} onChange={(e) => setDraft({ ...draft, orderWeight: Number(e.target.value) })} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-500" />
              </div>
              <label className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-200 bg-white text-sm">
                <input type="checkbox" checked={draft.isPublished} onChange={(e) => setDraft({ ...draft, isPublished: e.target.checked })} />
                Published
              </label>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5">Featured image URL (optional)</label>
              <input value={draft.featuredImage} onChange={(e) => setDraft({ ...draft, featuredImage: e.target.value })} placeholder="/uploads/guides/hero.jpg" className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-500" />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5">Summary / Excerpt</label>
              <textarea value={draft.summary} onChange={(e) => setDraft({ ...draft, summary: e.target.value })} rows={2} placeholder="Short summary shown on help cards and meta descriptions." className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-500" />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5">Tags (comma-separated)</label>
              <input value={draft.tags} onChange={(e) => setDraft({ ...draft, tags: e.target.value })} placeholder="orders, checkout, first-time" className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-500" />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5">Content</label>
              <textarea value={draft.content} onChange={(e) => setDraft({ ...draft, content: e.target.value })} rows={16} placeholder="Full article with paragraphs, headings, and step-by-step instructions." className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-500 font-mono leading-7" />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button onClick={() => setEditingId(null)} className="rounded-lg border border-gray-200 bg-white px-5 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={submit} disabled={saving} className="rounded-lg bg-red-600 px-5 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60 inline-flex items-center gap-2">
                <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save Article'}
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
          <h1 className="text-3xl font-extrabold text-gray-950 inline-flex items-center gap-2"><BookOpen className="h-8 w-8 text-red-600" /> Knowledge Base</h1>
          <p className="mt-1 text-sm text-gray-600">Long-form help guides with view counts and helpful voting.</p>
        </div>
        <button onClick={startNew} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-700">
          <Plus className="h-4 w-4" /> New Article
        </button>
      </div>

      <div className="grid gap-4 mb-8 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Articles</p>
            <p className="mt-2 text-3xl font-black text-gray-950">{articles.length}</p>
          </div>
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><BookOpen className="h-5 w-5" /></div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total Views</p>
            <p className="mt-2 text-3xl font-black text-gray-950">{articles.reduce((s, a) => s + Number(a.views || 0), 0)}</p>
          </div>
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-50 text-yellow-700"><Eye className="h-5 w-5" /></div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Published</p>
            <p className="mt-2 text-3xl font-black text-gray-950">{articles.filter((a) => a.isPublished !== false).length}</p>
          </div>
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-700"><Sparkles className="h-5 w-5" /></div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4 flex flex-col gap-3 lg:flex-row lg:items-center">
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-500">
            <option value="ALL">All categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ')}</option>)}
          </select>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by title, content, or tags…" className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-4 text-sm focus:border-red-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500" />
          </div>
        </div>

        {loading ? (
          <div className="divide-y divide-gray-100">
            {[0, 1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse bg-white" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 font-semibold text-gray-700">No articles match.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((a) => (
              <div key={a.id} className="p-4 sm:p-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-gray-950">{a.title}</h3>
                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-700">
                      {(a.category || 'general').split('-').map((w: string) => w[0].toUpperCase() + w.slice(1)).join(' ')}
                    </span>
                    {a.isPublished === false && <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-700">Draft</span>}
                  </div>
                  {a.summary && <p className="mt-2 text-sm text-gray-600 line-clamp-2">{a.summary}</p>}
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1 font-mono text-gray-400">/{a.slug}</span>
                    <span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {a.views || 0}</span>
                    <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {a.estimatedReadMinutes || 3} min</span>
                    <span className="inline-flex items-center gap-1 text-green-700"><ThumbsUp className="h-3.5 w-3.5" /> {a.helpfulYes || 0}</span>
                    <span className="inline-flex items-center gap-1 text-red-700"><ThumbsDown className="h-3.5 w-3.5" /> {a.helpfulNo || 0}</span>
                    {Array.isArray(a.tags) && a.tags.length > 0 && (
                      <span className="inline-flex flex-wrap items-center gap-1">
                        {a.tags.slice(0, 3).map((t: string) => (
                          <span key={t} className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600">#{t}</span>
                        ))}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => startEdit(a)} className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-bold text-gray-700 hover:bg-gray-50">Edit</button>
                  <button onClick={() => remove(a)} className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-bold text-red-700 hover:bg-red-50 inline-flex items-center gap-1">
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

export default AdminKnowledgeBasePage
