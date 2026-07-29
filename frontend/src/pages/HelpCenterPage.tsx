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

  // ============ RENDER ============
  if (selectedArticle) {
    return (
      <div className="min-h-screen bg-gray-50">
        <section className="bg-gray-950 px-4 py-10 text-white sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <button
              onClick={() => setSelectedSlug(null)}
              className="inline-flex items-center gap-2 text-sm text-red-300 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Help Center
            </button>
            <p className="mt-4 text-xs font-bold uppercase tracking-wide text-red-300">
              {formatCategory(selectedArticle.category)}
            </p>
            <h1 className="mt-2 text-4xl font-extrabold">{selectedArticle.title}</h1>
            <p className="mt-4 max-w-3xl text-gray-300">{selectedArticle.excerpt}</p>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-400">
              <span className="inline-flex items-center gap-1"><Clock className="h-4 w-4" />Updated {new Date(selectedArticle.createdAt).toLocaleDateString()}</span>
              <span className="inline-flex items-center gap-1"><BookOpen className="h-4 w-4" />{selectedArticle.views || 0} views</span>
            </div>
          </div>
        </section>
        <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <article className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
            <div className="prose prose-red max-w-none text-gray-800">
              <p className="whitespace-pre-wrap leading-7"><LinkifiedText text={selectedArticle.content} /></p>
            </div>
            <div className="mt-10 border-t border-gray-100 pt-6">
              <p className="text-sm font-medium text-gray-700 mb-3">Was this article helpful?</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => voteArticle(selectedArticle.slug, true)}
                  className="inline-flex items-center gap-2 rounded border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:border-green-200 hover:text-green-700"
                >
                  <ThumbsUp className="h-4 w-4" /> Yes ({selectedArticle.helpfulYes || 0})
                </button>
                <button
                  onClick={() => voteArticle(selectedArticle.slug, false)}
                  className="inline-flex items-center gap-2 rounded border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:border-red-200 hover:text-red-700"
                >
                  <ThumbsDown className="h-4 w-4" /> No ({selectedArticle.helpfulNo || 0})
                </button>
              </div>
            </div>
          </article>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gray-950 px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-bold uppercase tracking-wide text-red-300">{brand.name}</p>
          <h1 className="mt-3 text-4xl font-extrabold sm:text-5xl">Help Center</h1>
          <p className="mt-4 max-w-3xl text-gray-300">
            Find answers to common questions, browse step-by-step guides, or reach our team for personalized assistance.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Search & Tabs */}
        <div className="mb-6 space-y-5">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search FAQs, guides, and help articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-4 pl-12 pr-4 text-base focus:border-red-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-3">
            {(['faq', 'kb', 'contact'] as TabKey[]).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-colors ${
                  activeTab === t
                    ? 'bg-[#9f2f20] text-white shadow'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {t === 'faq' && <HelpCircle className="h-4 w-4" />}
                {t === 'kb' && <BookOpen className="h-4 w-4" />}
                {t === 'contact' && <MessageCircle className="h-4 w-4" />}
                {t === 'faq' ? 'FAQ' : t === 'kb' ? 'Help Guides' : 'Contact Support'}
              </button>
            ))}
            {allCategories.length > 1 && (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="ml-auto rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-500"
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

        {/* FAQ */}
        {activeTab === 'faq' && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-extrabold text-gray-950">Frequently Asked Questions</h2>
              <button
                onClick={() => setShowTicketForm(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-gray-950 px-4 py-2 text-sm font-bold text-white hover:bg-gray-800"
              >
                <MessageCircle className="h-4 w-4" /> Contact Support
              </button>
            </div>
            {faqLoading ? (
              <div className="space-y-3">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-16 animate-pulse rounded-lg border border-gray-200 bg-white" />
                ))}
              </div>
            ) : faqs.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
                <AlertCircle className="mx-auto h-10 w-10 text-gray-400" />
                <p className="mt-4 font-medium text-gray-700">No FAQs match your search.</p>
                <p className="mt-1 text-sm text-gray-500">Try a different keyword or browse the help guides.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {faqs.map((faq) => (
                  <div key={faq.id} className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                    <button
                      onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                      className="flex w-full items-center justify-between gap-4 p-5 text-left"
                    >
                      <div className="flex-1">
                        {faq.category && (
                          <span className="mb-1 inline-block rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-red-700">
                            {formatCategory(faq.category)}
                          </span>
                        )}
                        <div className="text-lg font-semibold text-gray-950">{faq.question}</div>
                      </div>
                      <div className="flex-shrink-0">
                        {expandedFaq === faq.id ? (
                          <ChevronDown className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-gray-500" />
                        )}
                      </div>
                    </button>
                    {expandedFaq === faq.id && (
                      <div className="border-t border-gray-100 px-5 pb-5">
                        <p className="mt-4 text-gray-700 leading-7">
                          <LinkifiedText text={faq.answer} />
                        </p>
                        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-gray-50 pt-4">
                          <p className="text-sm text-gray-500">Was this FAQ helpful?</p>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => voteFaq(faq.id, true)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-green-50 hover:border-green-200 hover:text-green-700"
                            >
                              <ThumbsUp className="h-3.5 w-3.5" /> Yes ({faq.helpfulYes})
                            </button>
                            <button
                              onClick={() => voteFaq(faq.id, false)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-red-50 hover:border-red-200 hover:text-red-700"
                            >
                              <ThumbsDown className="h-3.5 w-3.5" /> No ({faq.helpfulNo})
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Knowledge Base */}
        {activeTab === 'kb' && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-extrabold text-gray-950">Help Guides & Articles</h2>
              <button
                onClick={() => setShowTicketForm(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-gray-950 px-4 py-2 text-sm font-bold text-white hover:bg-gray-800"
              >
                <MessageCircle className="h-4 w-4" /> Contact Support
              </button>
            </div>
            {kbLoading ? (
              <div className="grid gap-5 md:grid-cols-2">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-40 animate-pulse rounded-2xl border border-gray-200 bg-white" />
                ))}
              </div>
            ) : articles.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
                <FileText className="mx-auto h-10 w-10 text-gray-400" />
                <p className="mt-4 font-medium text-gray-700">No guides match your search.</p>
                <p className="mt-1 text-sm text-gray-500">Browse the FAQ or create a support ticket.</p>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2">
                {articles.map((article) => (
                  <button
                    key={article.id}
                    onClick={() => setSelectedSlug(article.slug)}
                    className="group flex flex-col items-start rounded-2xl border border-gray-200 bg-white p-6 text-left shadow-sm hover:border-red-300 hover:shadow-md transition-all"
                  >
                    {article.category && (
                      <span className="mb-3 inline-block rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-red-700">
                        {formatCategory(article.category)}
                      </span>
                    )}
                    <HelpCircle className="h-8 w-8 text-[#9f2f20]" />
                    <h3 className="mt-4 text-lg font-bold text-gray-950 group-hover:text-[#9f2f20]">{article.title}</h3>
                    <p className="mt-2 line-clamp-3 text-sm text-gray-600 leading-6">
                      {article.excerpt || article.content.slice(0, 140)}...
                    </p>
                    <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
                      <span className="inline-flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" />{article.views} views</span>
                      <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{new Date(article.createdAt).toLocaleDateString()}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Contact Summary */}
        {activeTab === 'contact' && (
          <section className="mb-10 grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-1">
              <h2 className="text-2xl font-extrabold text-gray-950">Reach Our Team</h2>
              <p className="mt-2 text-sm text-gray-600">
                Real humans, ready to help with orders, delivery, quality questions, and wholesale.
              </p>
              <div className="mt-6 space-y-4">
                <a href={`tel:${brand.phone}`} className="flex items-start gap-3 rounded-xl bg-gray-50 p-4 hover:bg-red-50">
                  <div className="rounded-xl bg-red-100 p-2"><Phone className="h-5 w-5 text-[#9f2f20]" /></div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wide text-gray-500">Call</div>
                    <div className="font-semibold text-gray-900">{brand.phone}</div>
                  </div>
                </a>
                <a href={brand.emailHref || `mailto:${brand.email}`} className="flex items-start gap-3 rounded-xl bg-gray-50 p-4 hover:bg-red-50">
                  <div className="rounded-xl bg-red-100 p-2"><Mail className="h-5 w-5 text-[#9f2f20]" /></div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wide text-gray-500">Email</div>
                    <div className="font-semibold text-gray-900 break-all">{brand.email}</div>
                  </div>
                </a>
                <Link to="/contact" className="flex items-start gap-3 rounded-xl bg-gray-50 p-4 hover:bg-red-50">
                  <div className="rounded-xl bg-red-100 p-2"><MessageCircle className="h-5 w-5 text-[#9f2f20]" /></div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wide text-gray-500">Form</div>
                    <div className="font-semibold text-gray-900">Contact Form Page</div>
                  </div>
                </Link>
                <Link to="/forum" className="flex items-start gap-3 rounded-xl bg-gray-50 p-4 hover:bg-red-50">
                  <div className="rounded-xl bg-red-100 p-2"><Users className="h-5 w-5 text-[#9f2f20]" /></div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wide text-gray-500">Community</div>
                    <div className="font-semibold text-gray-900">Browse the customer forum</div>
                  </div>
                </Link>
              </div>
            </div>
            <div className="space-y-6 lg:col-span-2">
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-red-100 p-2"><GitBranch className="h-5 w-5 text-[#9f2f20]" /></div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-extrabold text-gray-950">Guided Help Flow</h2>
                    <p className="mt-2 text-sm text-gray-600">
                      Answer one question at a time and we will guide you to the fastest next step.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={resetDecisionTree}
                    className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50"
                  >
                    Restart
                  </button>
                </div>
                <div className="mt-5 rounded-2xl bg-gray-50 p-5">
                  {decisionLoading ? (
                    <p className="text-sm text-gray-500">Loading guided help…</p>
                  ) : decisionNode ? (
                    <>
                      <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">Current step</p>
                      <h3 className="mt-2 text-xl font-bold text-gray-950">{decisionNode.question}</h3>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {decisionNode.options.map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => handleDecisionOption(option)}
                            className="rounded-2xl border border-gray-200 bg-white p-4 text-left hover:border-red-300 hover:bg-red-50"
                          >
                            <div className="font-semibold text-gray-900">{option.label}</div>
                            {option.resolution && <div className="mt-2 text-sm text-gray-600">{option.resolution}</div>}
                            {option.linkUrl && (
                              <div className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-red-700">
                                {option.linkLabel || 'Open help link'} <ExternalLink className="h-4 w-4" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                      {decisionTrail.length > 0 && (
                        <p className="mt-4 text-xs text-gray-400">Previous steps: {decisionTrail.join(' / ')}</p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">No guided help flow has been published yet.</p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-white p-2"><ShieldAlert className="h-5 w-5 text-[#9f2f20]" /></div>
                  <div>
                    <h2 className="text-2xl font-extrabold text-gray-950">VIP Emergency Bypass</h2>
                    <p className="mt-2 text-sm text-gray-700">
                      Paying customer with a time-sensitive issue? Send an urgent request and the support team can prioritize a manual workaround.
                    </p>
                  </div>
                </div>
                <form onSubmit={submitVipBypass} className="mt-5 grid gap-4 md:grid-cols-2">
                  <input
                    value={vipForm.name}
                    onChange={(e) => setVipForm({ ...vipForm, name: e.target.value })}
                    placeholder="Your full name"
                    className="rounded-xl border border-red-200 bg-white px-4 py-3 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <input
                    type="email"
                    value={vipForm.email}
                    onChange={(e) => setVipForm({ ...vipForm, email: e.target.value })}
                    placeholder="Email address"
                    className="rounded-xl border border-red-200 bg-white px-4 py-3 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <input
                    value={vipForm.orderRef}
                    onChange={(e) => setVipForm({ ...vipForm, orderRef: e.target.value })}
                    placeholder="Order number or reference"
                    className="rounded-xl border border-red-200 bg-white px-4 py-3 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 md:col-span-2"
                  />
                  <textarea
                    value={vipForm.issue}
                    onChange={(e) => setVipForm({ ...vipForm, issue: e.target.value })}
                    rows={4}
                    placeholder="Describe the urgent issue and why you need a manual workaround"
                    className="rounded-xl border border-red-200 bg-white px-4 py-3 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 md:col-span-2"
                  />
                  <div className="md:col-span-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={vipSubmitting}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#9f2f20] px-6 py-3 text-sm font-bold text-white hover:bg-[#842719] disabled:opacity-60"
                    >
                      <AlertCircle className="h-4 w-4" />
                      {vipSubmitting ? 'Sending urgent request…' : 'Request emergency help'}
                    </button>
                  </div>
                </form>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-extrabold text-gray-950">Create a Support Ticket</h2>
                  <p className="mt-2 text-sm text-gray-600">
                    Share the details so our team can respond with the right information. You can track responses in your account.
                  </p>
                </div>
                {!user && (
                  <Link
                    to="/login"
                    className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50"
                  >
                    Sign in first
                  </Link>
                )}
              </div>
              <form onSubmit={submitTicket} className="mt-6 space-y-5">
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">Category</label>
                    <select
                      value={ticketForm.category}
                      onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-red-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      {TICKET_CATEGORIES.map((c) => (
                        <option key={c} value={c}>{formatCategory(c)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">Priority</label>
                    <select
                      value={ticketForm.priority}
                      onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value as any })}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-red-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="LOW">Low — General Question</option>
                      <option value="MEDIUM">Medium — Needs Response</option>
                      <option value="HIGH">High — Affecting Order</option>
                      <option value="URGENT">Urgent — Time-Sensitive</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">Subject</label>
                  <input
                    type="text"
                    value={ticketForm.subject}
                    onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                    required
                    placeholder="Brief summary, e.g. “My order has not arrived yet”"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-red-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">Message</label>
                  <textarea
                    value={ticketForm.message}
                    onChange={(e) => setTicketForm({ ...ticketForm, message: e.target.value })}
                    required
                    rows={6}
                    placeholder="Include order number (if applicable), delivery details, and any relevant notes..."
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-red-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
                  <Link to="/contact" className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50">
                    Open Contact Form
                  </Link>
                  <button
                    type="submit"
                    disabled={submitting || !user}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#9f2f20] px-6 py-3 text-sm font-bold text-white hover:bg-[#842719] disabled:opacity-60"
                  >
                    <Send className="h-4 w-4" />
                    {submitting ? 'Sending…' : user ? 'Submit Ticket' : 'Sign in to Submit'}
                  </button>
                </div>
              </form>
            </div>
            </div>
          </section>
        )}

        {/* Contact Support CTA (for FAQ/KB tabs) */}
        {activeTab !== 'contact' && (
          <section className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col items-start justify-between gap-5 md:flex-row md:items-center">
              <div>
                <h2 className="text-2xl font-extrabold text-gray-950">Still Need Help?</h2>
                <p className="mt-2 text-gray-700 max-w-2xl">
                  Cannot find what you're looking for? Our support team will get back to you with a tailored response.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#9f2f20] px-6 py-3 font-bold text-white hover:bg-[#842719]"
                >
                  <MessageCircle className="h-4 w-4" /> Contact Form
                </Link>
                <button
                  onClick={() => setShowTicketForm(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-6 py-3 font-bold text-gray-900 hover:bg-gray-50"
                >
                  Send Feedback
                </button>
                <a
                  href={`tel:${brand.phone}`}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-6 py-3 font-bold text-gray-900 hover:bg-gray-50"
                >
                  <Phone className="h-4 w-4" />
                  Call {brand.phone}
                </a>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Ticket form modal */}
      {showTicketForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-950 px-6 py-5 text-white">
              <div>
                <h3 className="text-xl font-extrabold">Create Support Ticket</h3>
                <p className="text-sm text-gray-300 mt-0.5">
                  {user ? 'Your ticket will be linked to your account.' : 'Sign in first to create a ticket.'}
                </p>
              </div>
              <button
                onClick={() => setShowTicketForm(false)}
                className="rounded-lg p-2 text-gray-300 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={submitTicket} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">Category</label>
                  <select
                    value={ticketForm.category}
                    onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-red-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    {TICKET_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{formatCategory(c)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">Priority</label>
                  <select
                    value={ticketForm.priority}
                    onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value as any })}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-red-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">Subject</label>
                <input
                  type="text"
                  value={ticketForm.subject}
                  onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                  required
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-red-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">Message</label>
                <textarea
                  value={ticketForm.message}
                  onChange={(e) => setTicketForm({ ...ticketForm, message: e.target.value })}
                  required
                  rows={6}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-red-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowTicketForm(false)}
                  className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !user}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#9f2f20] px-6 py-3 text-sm font-bold text-white hover:bg-[#842719] disabled:opacity-60"
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
