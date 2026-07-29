import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MessageSquare, Pin, Lock, CheckCircle2, Search, Plus, Check, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { forumApi } from '../services/buyerApi'
import { useAuth } from '../contexts/AuthContext'

interface Category {
  id: string
  name: string
  slug: string
  description?: string
  icon?: string
  _count: { threads: number }
}

interface Thread {
  id: string
  title: string
  body: string
  isPinned: boolean
  isLocked: boolean
  isSolved: boolean
  views: number
  createdAt: string
  updatedAt: string
  user: { id: string; username?: string; profile?: { fullName?: string; avatar?: string } }
  category: { id: string; name: string; slug: string }
  _count: { replies: number }
}

interface Reply {
  id: string
  body: string
  isAccepted: boolean
  createdAt: string
  user: { id: string; username?: string; profile?: { fullName?: string; avatar?: string } }
}

const Avatar = ({ user }: { user: Thread['user'] }) => {
  const name = user.profile?.fullName || user.username || 'U'
  return (
    <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center text-red-700 text-xs font-bold shrink-0">
      {user.profile?.avatar ? <img src={user.profile.avatar} alt={name} className="h-full w-full rounded-full object-cover" /> : name[0].toUpperCase()}
    </div>
  )
}

// ─── Category list ───────────────────────────────────────────────────────────

const CategoryList = () => {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    forumApi.getCategories().then((d) => setCategories(d.categories || [])).catch(() => toast.error('Failed to load forum')).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-t-transparent" /></div>

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">Community Forum</h1>
        <p className="mt-2 text-gray-500">Ask questions, share tips, and help fellow customers.</p>
      </div>
      <div className="space-y-3">
        {categories.map((cat) => (
          <Link key={cat.id} to={`/forum/${cat.slug}`} className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200 hover:ring-red-300 transition">
            <div className="text-2xl w-10 text-center">{cat.icon || '💬'}</div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900">{cat.name}</p>
              {cat.description && <p className="text-sm text-gray-500 truncate">{cat.description}</p>}
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-semibold text-gray-700">{cat._count.threads}</p>
              <p className="text-xs text-gray-400">threads</p>
            </div>
          </Link>
        ))}
        {categories.length === 0 && <p className="text-center text-gray-400 py-12">No forum categories yet.</p>}
      </div>
    </div>
  )
}

// ─── Thread list ─────────────────────────────────────────────────────────────

const ThreadList = ({ slug }: { slug: string }) => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [threads, setThreads] = useState<Thread[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [catId, setCatId] = useState<string>('')
  const [newThread, setNewThread] = useState(false)
  const [form, setForm] = useState({ title: '', body: '' })
  const [submitting, setSubmitting] = useState(false)

  const loadThreads = async (query = q) => {
    setLoading(true)
    try {
      const cats = await forumApi.getCategories()
      const cat = (cats.categories as Category[]).find((c) => c.slug === slug)
      if (cat) setCatId(cat.id)
      const data = await forumApi.getThreads({ categoryId: cat?.id, q: query || undefined })
      setThreads(data.threads || [])
      setTotal(data.total || 0)
    } catch {
      toast.error('Failed to load threads')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadThreads() }, [slug])

  const submit = async () => {
    if (!user) { toast.error('Please sign in to post'); return }
    if (!form.title.trim() || !form.body.trim()) { toast.error('Title and body are required'); return }
    setSubmitting(true)
    try {
      const data = await forumApi.createThread({ categoryId: catId, title: form.title, body: form.body })
      navigate(`/forum/thread/${data.thread.id}`)
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to create thread')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-center gap-3">
        <Link to="/forum" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"><ArrowLeft className="h-4 w-4" /> Forum</Link>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-gray-900 capitalize">{slug.replace(/-/g, ' ')}</h1>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2">
            <Search className="h-4 w-4 text-gray-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && loadThreads(q)} placeholder="Search threads…" className="text-sm outline-none w-36" />
          </div>
          <button onClick={() => setNewThread(!newThread)} className="flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
            <Plus className="h-4 w-4" /> New thread
          </button>
        </div>
      </div>

      {newThread && (
        <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-red-200">
          <h2 className="mb-3 font-bold text-gray-900">Start a new thread</h2>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Thread title" className="mb-3 w-full rounded-xl border px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-red-300" />
          <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={4} placeholder="Describe your question or topic…" className="w-full rounded-xl border px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-red-300 resize-none" />
          <div className="mt-3 flex justify-end gap-2">
            <button onClick={() => setNewThread(false)} className="rounded-xl border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
            <button onClick={submit} disabled={submitting} className="rounded-xl bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">{submitting ? 'Posting…' : 'Post thread'}</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-t-transparent" /></div>
      ) : (
        <div className="space-y-2">
          {threads.map((t) => (
            <Link key={t.id} to={`/forum/thread/${t.id}`} className="flex items-start gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200 hover:ring-red-300 transition">
              <Avatar user={t.user} />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                  {t.isPinned && <Pin className="h-3.5 w-3.5 text-red-500" />}
                  {t.isLocked && <Lock className="h-3.5 w-3.5 text-gray-400" />}
                  {t.isSolved && <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />}
                  <span className="font-semibold text-gray-900 truncate">{t.title}</span>
                </div>
                <p className="text-sm text-gray-500 truncate">{t.body}</p>
                <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                  <span>{t.user.profile?.fullName || t.user.username}</span>
                  <span>·</span>
                  <span>{new Date(t.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="flex items-center gap-1 text-sm text-gray-500"><MessageSquare className="h-4 w-4" />{t._count.replies}</div>
                <div className="text-xs text-gray-400">{t.views} views</div>
              </div>
            </Link>
          ))}
          {threads.length === 0 && <p className="text-center text-gray-400 py-12">No threads yet. Be the first to post!</p>}
        </div>
      )}
      <p className="mt-4 text-xs text-center text-gray-400">{total} total threads</p>
    </div>
  )
}

// ─── Thread detail ────────────────────────────────────────────────────────────

const ThreadDetail = ({ id }: { id: string }) => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [thread, setThread] = useState<Thread & { replies: Reply[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [reply, setReply] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    try {
      const data = await forumApi.getThread(id)
      setThread(data.thread)
    } catch {
      toast.error('Thread not found')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  const postReply = async () => {
    if (!user) { toast.error('Sign in to reply'); return }
    if (!reply.trim()) return
    setSubmitting(true)
    try {
      await forumApi.replyToThread(id, reply)
      setReply('')
      await load()
      toast.success('Reply posted')
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to post reply')
    } finally {
      setSubmitting(false)
    }
  }

  const accept = async (replyId: string) => {
    try {
      await forumApi.acceptReply(replyId)
      await load()
      toast.success('Marked as accepted answer')
    } catch {
      toast.error('Failed to accept reply')
    }
  }

  const deleteReply = async (replyId: string) => {
    if (!confirm('Delete this reply?')) return
    try {
      await forumApi.deleteReply(replyId)
      await load()
    } catch {
      toast.error('Failed to delete reply')
    }
  }

  if (loading) return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-t-transparent" /></div>
  if (!thread) return <div className="mx-auto max-w-3xl px-4 py-10 text-center text-gray-500">Thread not found.</div>

  const isOwner = user?.id === thread.user.id

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"><ArrowLeft className="h-4 w-4" /> Back</button>

      {/* Thread body */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 mb-4">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          {thread.isPinned && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700 font-medium">Pinned</span>}
          {thread.isLocked && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700 font-medium">Locked</span>}
          {thread.isSolved && <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700 font-medium flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />Solved</span>}
        </div>
        <h1 className="text-xl font-extrabold text-gray-900 mb-4">{thread.title}</h1>
        <div className="flex items-center gap-3 mb-4">
          <Avatar user={thread.user} />
          <div>
            <p className="text-sm font-semibold text-gray-800">{thread.user.profile?.fullName || thread.user.username}</p>
            <p className="text-xs text-gray-400">{new Date(thread.createdAt).toLocaleString()}</p>
          </div>
        </div>
        <p className="text-gray-700 whitespace-pre-wrap leading-7">{thread.body}</p>
      </div>

      {/* Replies */}
      <h2 className="font-bold text-gray-900 mb-3">{thread.replies?.length || 0} Replies</h2>
      <div className="space-y-3 mb-6">
        {(thread.replies || []).map((r) => (
          <div key={r.id} className={`rounded-2xl p-5 shadow-sm ring-1 ${r.isAccepted ? 'ring-green-300 bg-green-50' : 'ring-gray-200 bg-white'}`}>
            {r.isAccepted && (
              <div className="flex items-center gap-1.5 mb-2 text-green-700 text-xs font-bold">
                <Check className="h-4 w-4" /> Accepted answer
              </div>
            )}
            <div className="flex items-center gap-3 mb-3">
              <Avatar user={r.user} />
              <div>
                <p className="text-sm font-semibold text-gray-800">{r.user.profile?.fullName || r.user.username}</p>
                <p className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleString()}</p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                {isOwner && !thread.isSolved && !r.isAccepted && (
                  <button onClick={() => accept(r.id)} className="rounded-lg border border-green-300 px-2 py-1 text-xs text-green-700 hover:bg-green-50 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Accept
                  </button>
                )}
                {(user?.id === r.user.id || (user as any)?.role === 'admin') && (
                  <button onClick={() => deleteReply(r.id)} className="rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-500 hover:bg-gray-50">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
            <p className="text-gray-700 whitespace-pre-wrap leading-7 text-sm">{r.body}</p>
          </div>
        ))}
      </div>

      {/* Reply box */}
      {!thread.isLocked ? (
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
          <h3 className="mb-3 font-bold text-gray-900">Post a reply</h3>
          {user ? (
            <>
              <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={4} placeholder="Write your reply…" className="w-full rounded-xl border px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-red-300 resize-none" />
              <div className="mt-3 flex justify-end">
                <button onClick={postReply} disabled={submitting || !reply.trim()} className="rounded-xl bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">{submitting ? 'Posting…' : 'Post reply'}</button>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-500">Please <Link to="/login" className="text-red-600 font-semibold">sign in</Link> to reply.</p>
          )}
        </div>
      ) : (
        <div className="rounded-2xl bg-gray-50 p-4 text-center text-sm text-gray-500 ring-1 ring-gray-200">
          <Lock className="mx-auto h-5 w-5 mb-1 text-gray-400" /> This thread is locked.
        </div>
      )}
    </div>
  )
}

// ─── Router wrapper ───────────────────────────────────────────────────────────

const CommunityForumPage = () => {
  const { slug, threadId } = useParams<{ slug?: string; threadId?: string }>()
  if (threadId) return <ThreadDetail id={threadId} />
  if (slug) return <ThreadList slug={slug} />
  return <CategoryList />
}

export default CommunityForumPage
