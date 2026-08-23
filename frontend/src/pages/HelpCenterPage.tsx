import { FormEvent, useEffect, useMemo, useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  HelpCircle,
  Search,
  MessageCircle,
  Phone,
  Mail,
  ThumbsUp,
  ThumbsDown,
  X,
  Send,
  FileText,
  ArrowLeft,
  AlertCircle,
  Clock,
  BookOpen,
  GitBranch,
  ShieldAlert,
  Users,
  ExternalLink,
  Sparkles,
} from 'lucide-react'
import { useSiteContent } from '../contexts/SiteContentContext'
import { Link, useNavigate } from 'react-router-dom'
import LinkifiedText from '../components/ui/LinkifiedText'
import toast from 'react-hot-toast'
import {
  faqApi,
  knowledgeBaseApi,
  supportTicketsApi,
  decisionTreeApi,
  vipBypassApi,
} from '../services/buyerApi'
import { useAuth } from '../contexts/AuthContext'

type TabKey = 'faq' | 'kb' | 'contact'

interface DecisionTreeOption {
  id: string
  label: string
  nextNodeId?: string | null
  resolution?: string | null
  linkUrl?: string | null
  linkLabel?: string | null
}

interface DecisionTreeNode {
  id: string
  question: string
  options: DecisionTreeOption[]
}

interface FaqItem {
  id: string
  question: string
  answer: string
  category: string | null
  sortOrder: number
  isActive: boolean
  helpfulYes: number
  helpfulNo: number
  views?: number
}

interface KbArticle {
  id: string
  title: string
  slug: string
  category: string | null
  excerpt: string | null
  content: string
  featuredImage?: string | null
  views: number
  helpfulYes: number
  helpfulNo: number
  publishedAt?: string | null
  createdAt: string
}

const CATEGORY_LABELS: Record<string, string> = {
  SHIPPING: 'Shipping & Delivery',
  PAYMENTS: 'Payments',
  RETURNS: 'Returns & Refunds',
  ORDERS: 'Orders & Tracking',
  PRODUCTS: 'Products & Stock',
  ACCOUNT: 'Account & Profile',
  GENERAL_INQUIRY: 'General',
  FEEDBACK: 'Feedback',
  TECHNICAL: 'Technical Issues',
  WHOLESALE: 'Wholesale & Bulk',
}

const TICKET_CATEGORIES = [
  'GENERAL_INQUIRY',
  'SHIPPING',
  'PAYMENTS',
  'RETURNS',
  'ORDERS',
  'PRODUCTS',
  'ACCOUNT',
  'TECHNICAL',
  'WHOLESALE',
  'FEEDBACK',
]

const HelpCenterPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { profile } = useSiteContent()
  const brand = profile.brand

  const [activeTab, setActiveTab] = useState<TabKey>('faq')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // FAQ
  const [faqs, setFaqs] = useState<FaqItem[]>([])
  const [faqCategories, setFaqCategories] = useState<string[]>([])
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null)
  const [faqLoading, setFaqLoading] = useState(true)

  // Knowledge Base
  const [articles, setArticles] = useState<KbArticle[]>([])
  const [kbCategories, setKbCategories] = useState<string[]>([])
  const [kbLoading, setKbLoading] = useState(true)
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)
  const [selectedArticle, setSelectedArticle] = useState<KbArticle | null>(null)

  // Contact form / ticket
  const [showTicketForm, setShowTicketForm] = useState(false)
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    message: '',
    category: 'GENERAL_INQUIRY',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
  })
  const [submitting, setSubmitting] = useState(false)
  const [decisionNode, setDecisionNode] = useState<DecisionTreeNode | null>(null)
  const [decisionLoading, setDecisionLoading] = useState(true)
  const [decisionTrail, setDecisionTrail] = useState<string[]>([])
  const [vipForm, setVipForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    orderRef: '',
    issue: '',
  })
  const [vipSubmitting, setVipSubmitting] = useState(false)

  const loadFaqs = async () => {
    setFaqLoading(true)
    try {
      const params: any = {}
      if (selectedCategory !== 'all') params.category = selectedCategory
      if (searchTerm.trim()) params.q = searchTerm.trim()
      const data = await faqApi.getFaqs(params)
      setFaqs(data.faqs || [])
      setFaqCategories(data.categories || [])
    } catch (e) {
      console.error('FAQ load error', e)
      toast.error('Could not load FAQs')
    } finally {
      setFaqLoading(false)
    }
  }

  const loadArticles = async () => {
    setKbLoading(true)
    try {
      const params: any = {}
      if (selectedCategory !== 'all') params.category = selectedCategory
      if (searchTerm.trim()) params.q = searchTerm.trim()
      const data = await knowledgeBaseApi.getArticles(params)
      setArticles(data.articles || [])
      setKbCategories(data.categories || [])
    } catch (e) {
      console.error('KB load error', e)
      toast.error('Could not load articles')
    } finally {
      setKbLoading(false)
    }
  }

  useEffect(() => {
    loadFaqs()
  }, [selectedCategory, searchTerm])

  useEffect(() => {
    loadArticles()
  }, [selectedCategory, searchTerm])

  useEffect(() => {
    if (selectedSlug) {
      knowledgeBaseApi
        .getArticle(selectedSlug)
        .then((d) => setSelectedArticle(d.article))
        .catch(() => toast.error('Could not load article'))
    } else {
      setSelectedArticle(null)
    }
  }, [selectedSlug])

  useEffect(() => {
    decisionTreeApi.getRoot()
      .then((d) => setDecisionNode(d.node || null))
      .catch(() => undefined)
      .finally(() => setDecisionLoading(false))
  }, [])

  useEffect(() => {
    setVipForm((prev) => ({
      ...prev,
      name: user?.name || prev.name,
      email: user?.email || prev.email,
    }))
  }, [user])

  const allCategories = useMemo(() => {
    const set = new Set<string>()
    faqCategories.forEach((c) => c && set.add(c))
    kbCategories.forEach((c) => c && set.add(c))
    return ['all', ...Array.from(set)]
  }, [faqCategories, kbCategories])

  const voteFaq = async (id: string, helpful: boolean) => {
    try {
      const r = await faqApi.voteHelpful(id, helpful)
      setFaqs((prev) =>
        prev.map((f) =>
          f.id === id
            ? { ...f, helpfulYes: r.helpfulYes, helpfulNo: r.helpfulNo }
            : f
        )
      )
      toast.success(helpful ? 'Marked as helpful' : 'Feedback noted')
    } catch {
      toast.error('Could not register feedback')
    }
  }

  const voteArticle = async (slug: string, helpful: boolean) => {
    try {
      const r = await knowledgeBaseApi.voteHelpful(slug, helpful)
      setSelectedArticle((prev) =>
        prev ? { ...prev, helpfulYes: r.helpfulYes, helpfulNo: r.helpfulNo } : prev
      )
      setArticles((prev) =>
        prev.map((a) =>
          a.slug === slug
            ? { ...a, helpfulYes: r.helpfulYes, helpfulNo: r.helpfulNo }
            : a
        )
      )
      toast.success(helpful ? 'Marked as helpful' : 'Feedback noted')
    } catch {
      toast.error('Could not register feedback')
    }
  }

  const submitTicket = async (e: FormEvent) => {
    e.preventDefault()
    if (!ticketForm.subject.trim() || !ticketForm.message.trim()) {
      toast.error('Please include a subject and message')
      return
    }
    if (!user) {
      toast.error('Please sign in before submitting a support ticket')
      navigate('/login')
      return
    }
    setSubmitting(true)
    try {
      await supportTicketsApi.createTicket(ticketForm)
      toast.success('Ticket created. Our team will respond shortly.')
      setTicketForm({
        subject: '',
        message: '',
        category: 'GENERAL_INQUIRY',
        priority: 'MEDIUM',
      })
      setShowTicketForm(false)
      if (user) navigate('/profile?tab=tickets')
    } catch (err: any) {
      console.error(err)
      toast.error(err?.response?.data?.error || 'Failed to create ticket')
    } finally {
      setSubmitting(false)
    }
  }

  const formatCategory = (c: string | null | undefined) => {
    if (!c) return 'General'
    return (CATEGORY_LABELS[c as string] || c.replace(/_/g, ' '))
  }

  const handleDecisionOption = async (option: DecisionTreeOption) => {
    if (option.nextNodeId) {
      try {
        const d = await decisionTreeApi.getNode(option.nextNodeId)
        setDecisionTrail((prev) => [...prev, decisionNode?.question || ''])
        setDecisionNode(d.node || null)
      } catch {
        toast.error('Could not load the next help step')
      }
    }
  }

  const resetDecisionTree = async () => {
    setDecisionLoading(true)
    try {
      const d = await decisionTreeApi.getRoot()
      setDecisionNode(d.node || null)
      setDecisionTrail([])
    } catch {
      toast.error('Could not reset the help flow')
    } finally {
      setDecisionLoading(false)
    }
  }

  const submitVipBypass = async (e: FormEvent) => {
    e.preventDefault()
    if (!vipForm.name.trim() || !vipForm.email.trim() || !vipForm.issue.trim()) {
      toast.error('Please complete the emergency request form')
      return
    }
    setVipSubmitting(true)
    try {
      await vipBypassApi.submit(vipForm)
      toast.success('Emergency request sent. Our team will review it urgently.')
      setVipForm((prev) => ({ ...prev, orderRef: '', issue: '' }))
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to submit emergency request')
    } finally {
      setVipSubmitting(false)
    }
  }

  // ============ ARTICLE DETAIL VIEW ============
  if (selectedArticle) {
    return (
      <div className="min-h-screen bg-[#faf9f7]">
        <section className="relative overflow-hidden bg-[#1a1b1e] px-4 py-16 text-white sm:px-6 lg:px-8">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-900/20 via-transparent to-transparent" />
          <div className="relative mx-auto max-w-3xl">
            <button
              onClick={() => setSelectedSlug(null)}
              className="group inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur transition hover:bg-white/20"
            >
              <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-0.5" />
              Back to Help Center
            </button>
            <div className="mt-8">
              {selectedArticle.category && (
                <span className="inline-block rounded-full bg-red-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-red-300">
                  {formatCategory(selectedArticle.category)}
                </span>
              )}
              <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
                {selectedArticle.title}
              </h1>
              {selectedArticle.excerpt && (
                <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/70">
                  {selectedArticle.excerpt}
                </p>
              )}
              <div className="mt-6 flex flex-wrap items-center gap-5 text-sm text-white/50">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {new Date(selectedArticle.createdAt).toLocaleDateString()}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4" />
                  {selectedArticle.views || 0} views
                </span>
              </div>
            </div>
          </div>
        </section>

        <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          <article className="rounded-3xl border border-stone-200/80 bg-white p-8 shadow-xl shadow-black/5 sm:p-12">
            <div className="prose prose-stone max-w-none text-stone-700">
              <p className="whitespace-pre-wrap text-base leading-8">
                <LinkifiedText text={selectedArticle.content} />
              </p>
            </div>

            <div className="mt-12 border-t border-stone-100 pt-8">
              <p className="mb-4 text-sm font-semibold text-stone-700">Was this article helpful?</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => voteArticle(selectedArticle.slug, true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-5 py-2.5 text-sm font-medium text-stone-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                >
                  <ThumbsUp className="h-4 w-4" />
                  Yes ({selectedArticle.helpfulYes || 0})
                </button>
                <button
                  onClick={() => voteArticle(selectedArticle.slug, false)}
                  className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-5 py-2.5 text-sm font-medium text-stone-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                >
                  <ThumbsDown className="h-4 w-4" />
                  No ({selectedArticle.helpfulNo || 0})
                </button>
              </div>
            </div>
          </article>
        </main>
      </div>
    )
  }

  // ============ MAIN VIEW ============
  return (
    <div className="min-h-screen bg-[#faf9f7]">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#1a1b1e] px-4 pb-28 pt-20 text-white sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-red-900/25 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-red-300 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            {brand.name} Support
          </div>
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
            How can we help?
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-white/70">
            Search FAQs, read guides, or get personal support from our team.
          </p>
        </div>
      </section>

      {/* Floating Search + Tabs */}
      <div className="relative z-20 -mt-14 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-stone-200/80 bg-white p-2 shadow-2xl shadow-black/10">
            <div className="relative">
              <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Search FAQs, guides, and help articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border-0 bg-transparent py-4 pl-14 pr-5 text-base text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-0"
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {([
              { key: 'faq' as TabKey, label: 'FAQ', icon: HelpCircle },
              { key: 'kb' as TabKey, label: 'Help Guides', icon: BookOpen },
              { key: 'contact' as TabKey, label: 'Contact Support', icon: MessageCircle },
            ]).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
                  activeTab === key
                    ? 'bg-[#9f2f20] text-white shadow-lg shadow-red-900/25'
                    : 'bg-white text-stone-600 shadow-sm hover:bg-stone-50 border border-stone-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}

            {allCategories.length > 1 && (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="ml-2 rounded-full border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-600 shadow-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
              >
                {allCategories.map((c) => (
                  <option key={c} value={c}>
                    {c === 'all' ? 'All Topics' : formatCategory(c)}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* ───────── FAQ TAB ───────── */}
        {activeTab === 'faq' && (
          <section>
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-2xl font-black tracking-tight text-stone-950">
                Frequently Asked Questions
              </h2>
              <button
                onClick={() => setShowTicketForm(true)}
                className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800"
              >
                <MessageCircle className="h-4 w-4" />
                Contact Support
              </button>
            </div>

            {faqLoading ? (
              <div className="space-y-3">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-16 animate-pulse rounded-2xl bg-white" />
                ))}
              </div>
            ) : faqs.length === 0 ? (
              <div className="rounded-3xl border border-stone-200 bg-white p-16 text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-stone-300" />
                <p className="mt-5 text-lg font-semibold text-stone-700">No FAQs match your search</p>
                <p className="mt-2 text-sm text-stone-500">Try a different keyword or browse the guides</p>
              </div>
            ) : (
              <div className="space-y-3">
                {faqs.map((faq) => {
                  const isOpen = expandedFaq === faq.id
                  return (
                    <div
                      key={faq.id}
                      className={`overflow-hidden rounded-2xl border bg-white transition-all ${
                        isOpen
                          ? 'border-red-200 shadow-lg shadow-red-900/5'
                          : 'border-stone-200/80 shadow-sm hover:border-stone-300'
                      }`}
                    >
                      <button
                        onClick={() => setExpandedFaq(isOpen ? null : faq.id)}
                        className="flex w-full items-center justify-between gap-4 p-5 text-left sm:p-6"
                      >
                        <div className="flex-1">
                          {faq.category && (
                            <span className="mb-2 inline-block rounded-full bg-red-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-700">
                              {formatCategory(faq.category)}
                            </span>
                          )}
                          <div className="text-base font-semibold text-stone-900 sm:text-lg">
                            {faq.question}
                          </div>
                        </div>
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition ${
                            isOpen ? 'bg-red-50 text-red-600' : 'bg-stone-100 text-stone-500'
                          }`}
                        >
                          {isOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                        </div>
                      </button>

                      {isOpen && (
                        <div className="border-t border-stone-100 px-5 pb-6 sm:px-6">
                          <p className="mt-5 text-stone-600 leading-7">
                            <LinkifiedText text={faq.answer} />
                          </p>
                          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-stone-50 pt-5">
                            <p className="text-sm text-stone-500">Was this helpful?</p>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => voteFaq(faq.id, true)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                              >
                                <ThumbsUp className="h-3.5 w-3.5" />
                                Yes ({faq.helpfulYes})
                              </button>
                              <button
                                onClick={() => voteFaq(faq.id, false)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                              >
                                <ThumbsDown className="h-3.5 w-3.5" />
                                No ({faq.helpfulNo})
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        )}

        {/* ───────── KNOWLEDGE BASE TAB ───────── */}
        {activeTab === 'kb' && (
          <section>
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-2xl font-black tracking-tight text-stone-950">
                Help Guides & Articles
              </h2>
              <button
                onClick={() => setShowTicketForm(true)}
                className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800"
              >
                <MessageCircle className="h-4 w-4" />
                Contact Support
              </button>
            </div>

            {kbLoading ? (
              <div className="grid gap-5 sm:grid-cols-2">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-48 animate-pulse rounded-3xl bg-white" />
                ))}
              </div>
            ) : articles.length === 0 ? (
              <div className="rounded-3xl border border-stone-200 bg-white p-16 text-center">
                <FileText className="mx-auto h-12 w-12 text-stone-300" />
                <p className="mt-5 text-lg font-semibold text-stone-700">No guides match your search</p>
                <p className="mt-2 text-sm text-stone-500">Browse the FAQ or create a support ticket</p>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2">
                {articles.map((article) => (
                  <button
                    key={article.id}
                    onClick={() => setSelectedSlug(article.slug)}
                    className="group flex flex-col items-start rounded-3xl border border-stone-200/80 bg-white p-6 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-red-200 hover:shadow-xl hover:shadow-red-900/5"
                  >
                    {article.category && (
                      <span className="mb-4 inline-block rounded-full bg-red-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-700">
                        {formatCategory(article.category)}
                      </span>
                    )}
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-[#9f2f20] transition group-hover:bg-[#9f2f20] group-hover:text-white">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-bold text-stone-900 group-hover:text-[#9f2f20]">
                      {article.title}
                    </h3>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-stone-500">
                      {article.excerpt || article.content.slice(0, 140)}…
                    </p>
                    <div className="mt-5 flex items-center gap-4 text-xs text-stone-400">
                      <span className="inline-flex items-center gap-1">
                        <BookOpen className="h-3.5 w-3.5" />
                        {article.views} views
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(article.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ───────── CONTACT TAB ───────── */}
        {activeTab === 'contact' && (
          <section className="space-y-8">
            {/* Quick contact cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: Phone, label: 'Call', value: brand.phone, href: `tel:${brand.phone}` },
                { icon: Mail, label: 'Email', value: brand.email, href: brand.emailHref || `mailto:${brand.email}` },
                { icon: MessageCircle, label: 'Form', value: 'Contact Form', href: '/contact' },
                { icon: Users, label: 'Community', value: 'Customer Forum', href: '/forum' },
              ].map((item) => {
                const Icon = item.icon
                const isInternal = item.href.startsWith('/')
                const cardClass = "group flex flex-col items-start rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-red-200 hover:shadow-lg"
                return isInternal ? (
                  <Link key={item.label} to={item.href} className={cardClass}>
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-[#9f2f20] transition group-hover:bg-[#9f2f20] group-hover:text-white">
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-wider text-stone-400">{item.label}</p>
                    <p className="mt-1 text-sm font-semibold text-stone-900 break-all">{item.value}</p>
                  </Link>
                ) : (
                  <a key={item.label} href={item.href} className={cardClass}>
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-[#9f2f20] transition group-hover:bg-[#9f2f20] group-hover:text-white">
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-wider text-stone-400">{item.label}</p>
                    <p className="mt-1 text-sm font-semibold text-stone-900 break-all">{item.value}</p>
                  </a>
                )
              })}
            </div>

            {/* Guided Help Flow */}
            <div className="rounded-3xl border border-stone-200/80 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-[#9f2f20]">
                    <GitBranch className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-stone-950">Guided Help Flow</h2>
                    <p className="mt-1 text-sm text-stone-500">
                      Answer one question at a time — we’ll guide you to the fastest solution.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={resetDecisionTree}
                  className="rounded-full border border-stone-200 px-3.5 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-50"
                >
                  Restart
                </button>
              </div>

              <div className="mt-6 rounded-2xl bg-stone-50 p-5 sm:p-6">
                {decisionLoading ? (
                  <p className="text-sm text-stone-500">Loading guided help…</p>
                ) : decisionNode ? (
                  <>
                    <p className="text-xs font-bold uppercase tracking-wider text-stone-400">Current step</p>
                    <h3 className="mt-2 text-lg font-bold text-stone-900 sm:text-xl">{decisionNode.question}</h3>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      {decisionNode.options.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => handleDecisionOption(option)}
                          className="rounded-2xl border border-stone-200 bg-white p-4 text-left transition hover:border-red-300 hover:bg-red-50/50"
                        >
                          <div className="font-semibold text-stone-900">{option.label}</div>
                          {option.resolution && (
                            <div className="mt-2 text-sm text-stone-500">{option.resolution}</div>
                          )}
                          {option.linkUrl && (
                            <div className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-red-700">
                              {option.linkLabel || 'Open help link'}
                              <ExternalLink className="h-3.5 w-3.5" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                    {decisionTrail.length > 0 && (
                      <p className="mt-4 text-xs text-stone-400">
                        Previous: {decisionTrail.join(' → ')}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-stone-500">No guided help flow has been published yet.</p>
                )}
              </div>
            </div>

            {/* VIP Emergency Bypass */}
            <div className="rounded-3xl border border-red-200 bg-gradient-to-br from-red-50 to-orange-50 p-6 shadow-sm sm:p-8">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#9f2f20] shadow-sm">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-stone-950">VIP Emergency Bypass</h2>
                  <p className="mt-1 text-sm text-stone-600">
                    Time-sensitive issue? Send an urgent request and our team can prioritize a manual workaround.
                  </p>
                </div>
              </div>

              <form onSubmit={submitVipBypass} className="mt-6 grid gap-4 sm:grid-cols-2">
                <input
                  value={vipForm.name}
                  onChange={(e) => setVipForm({ ...vipForm, name: e.target.value })}
                  placeholder="Your full name"
                  className="rounded-xl border border-red-200/80 bg-white px-4 py-3 text-sm outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                />
                <input
                  type="email"
                  value={vipForm.email}
                  onChange={(e) => setVipForm({ ...vipForm, email: e.target.value })}
                  placeholder="Email address"
                  className="rounded-xl border border-red-200/80 bg-white px-4 py-3 text-sm outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                />
                <input
                  value={vipForm.orderRef}
                  onChange={(e) => setVipForm({ ...vipForm, orderRef: e.target.value })}
                  placeholder="Order number or reference"
                  className="rounded-xl border border-red-200/80 bg-white px-4 py-3 text-sm outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-500/10 sm:col-span-2"
                />
                <textarea
                  value={vipForm.issue}
                  onChange={(e) => setVipForm({ ...vipForm, issue: e.target.value })}
                  rows={3}
                  placeholder="Describe the urgent issue..."
                  className="rounded-xl border border-red-200/80 bg-white px-4 py-3 text-sm outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-500/10 sm:col-span-2"
                />
                <div className="sm:col-span-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={vipSubmitting}
                    className="inline-flex items-center gap-2 rounded-full bg-[#9f2f20] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-red-900/20 transition hover:bg-[#842719] disabled:opacity-60"
                  >
                    <AlertCircle className="h-4 w-4" />
                    {vipSubmitting ? 'Sending…' : 'Request emergency help'}
                  </button>
                </div>
              </form>
            </div>

            {/* Create Ticket */}
            <div className="rounded-3xl border border-stone-200/80 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-stone-950">Create a Support Ticket</h2>
                  <p className="mt-1 text-sm text-stone-500">
                    Share the details so our team can respond with the right information.
                  </p>
                </div>
                {!user && (
                  <Link
                    to="/login"
                    className="rounded-full border border-stone-200 px-3.5 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-50"
                  >
                    Sign in first
                  </Link>
                )}
              </div>

              <form onSubmit={submitTicket} className="mt-6 space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-500">
                      Category
                    </label>
                    <select
                      value={ticketForm.category}
                      onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                      className="w-full rounded-xl border border-stone-200 bg-stone-50/60 px-4 py-3 text-sm outline-none transition focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-500/10"
                    >
                      {TICKET_CATEGORIES.map((c) => (
                        <option key={c} value={c}>{formatCategory(c)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-500">
                      Priority
                    </label>
                    <select
                      value={ticketForm.priority}
                      onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value as any })}
                      className="w-full rounded-xl border border-stone-200 bg-stone-50/60 px-4 py-3 text-sm outline-none transition focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-500/10"
                    >
                      <option value="LOW">Low — General Question</option>
                      <option value="MEDIUM">Medium — Needs Response</option>
                      <option value="HIGH">High — Affecting Order</option>
                      <option value="URGENT">Urgent — Time-Sensitive</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-500">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={ticketForm.subject}
                    onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                    required
                    placeholder="Brief summary of your issue"
                    className="w-full rounded-xl border border-stone-200 bg-stone-50/60 px-4 py-3 text-sm outline-none transition focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-500/10"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-500">
                    Message
                  </label>
                  <textarea
                    value={ticketForm.message}
                    onChange={(e) => setTicketForm({ ...ticketForm, message: e.target.value })}
                    required
                    rows={5}
                    placeholder="Include order number, delivery details, and any relevant notes..."
                    className="w-full resize-none rounded-xl border border-stone-200 bg-stone-50/60 px-4 py-3 text-sm outline-none transition focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-500/10"
                  />
                </div>
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
                  <Link
                    to="/contact"
                    className="rounded-full border border-stone-200 px-5 py-3 text-center text-sm font-semibold text-stone-700 hover:bg-stone-50"
                  >
                    Open Contact Form
                  </Link>
                  <button
                    type="submit"
                    disabled={submitting || !user}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#9f2f20] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-red-900/20 transition hover:bg-[#842719] disabled:opacity-60"
                  >
                    <Send className="h-4 w-4" />
                    {submitting ? 'Sending…' : user ? 'Submit Ticket' : 'Sign in to Submit'}
                  </button>
                </div>
              </form>
            </div>
          </section>
        )}

        {/* Still Need Help CTA (FAQ / KB) */}
        {activeTab !== 'contact' && (
          <section className="mt-14 rounded-3xl border border-stone-200/80 bg-white p-8 shadow-sm">
            <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-stone-950">Still need help?</h2>
                <p className="mt-2 max-w-lg text-stone-500">
                  Can’t find what you’re looking for? Our support team is ready to assist.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 rounded-full bg-[#9f2f20] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-red-900/20 transition hover:bg-[#842719]"
                >
                  <MessageCircle className="h-4 w-4" />
                  Contact Form
                </Link>
                <button
                  onClick={() => setShowTicketForm(true)}
                  className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-5 py-3 text-sm font-semibold text-stone-800 transition hover:bg-stone-50"
                >
                  Create Ticket
                </button>
                <a
                  href={`tel:${brand.phone}`}
                  className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-5 py-3 text-sm font-semibold text-stone-800 transition hover:bg-stone-50"
                >
                  <Phone className="h-4 w-4" />
                  Call
                </a>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Ticket Modal */}
      {showTicketForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8 backdrop-blur-sm">
          <div className="w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-[#1a1b1e] px-6 py-5 text-white">
              <div>
                <h3 className="text-lg font-bold">Create Support Ticket</h3>
                <p className="mt-0.5 text-sm text-white/60">
                  {user ? 'Linked to your account' : 'Sign in required to submit'}
                </p>
              </div>
              <button
                onClick={() => setShowTicketForm(false)}
                className="rounded-full p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={submitTicket} className="max-h-[70vh] space-y-5 overflow-y-auto p-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-500">
                    Category
                  </label>
                  <select
                    value={ticketForm.category}
                    onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                    className="w-full rounded-xl border border-stone-200 bg-stone-50/60 px-4 py-3 text-sm outline-none focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-500/10"
                  >
                    {TICKET_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{formatCategory(c)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-500">
                    Priority
                  </label>
                  <select
                    value={ticketForm.priority}
                    onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value as any })}
                    className="w-full rounded-xl border border-stone-200 bg-stone-50/60 px-4 py-3 text-sm outline-none focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-500/10"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Subject
                </label>
                <input
                  type="text"
                  value={ticketForm.subject}
                  onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                  required
                  className="w-full rounded-xl border border-stone-200 bg-stone-50/60 px-4 py-3 text-sm outline-none focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-500/10"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Message
                </label>
                <textarea
                  value={ticketForm.message}
                  onChange={(e) => setTicketForm({ ...ticketForm, message: e.target.value })}
                  required
                  rows={5}
                  className="w-full resize-none rounded-xl border border-stone-200 bg-stone-50/60 px-4 py-3 text-sm outline-none focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-500/10"
                />
              </div>
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowTicketForm(false)}
                  className="rounded-full border border-stone-200 px-5 py-3 text-sm font-semibold text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !user}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#9f2f20] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-red-900/20 transition hover:bg-[#842719] disabled:opacity-60"
                >
                  <Send className="h-4 w-4" />
                  {submitting ? 'Sending…' : user ? 'Submit Ticket' : 'Sign in Required'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default HelpCenterPage