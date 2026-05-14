import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, HelpCircle, Search, MessageCircle, Phone } from 'lucide-react'
import { useSiteContent } from '../contexts/SiteContentContext'
import { Link } from 'react-router-dom'
import LinkifiedText from '../components/ui/LinkifiedText'

const HelpCenterPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
  const { profile } = useSiteContent()
  const brand = profile.brand
  const faqs = profile.helpCenter.faqs
  const guides = profile.helpCenter.guides

  const categories = useMemo(() => {
    const names = Array.from(new Set([...faqs.map((faq) => faq.category), ...guides.map((guide) => guide.category)].filter(Boolean)))
    return [{ id: 'all', name: 'All Topics' }, ...names.map((name) => ({ id: name, name: name.replace(/-/g, ' ') }))]
  }, [faqs, guides])

  const filteredFaqs = faqs.filter(faq =>
    (selectedCategory === 'all' || faq.category === selectedCategory) &&
    (faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
     faq.answer.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const filteredGuides = guides.filter(guide =>
    (selectedCategory === 'all' || guide.category === selectedCategory) &&
    (guide.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
     guide.content.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gray-950 px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-bold uppercase tracking-wide text-red-300">{brand.name}</p>
          <h1 className="mt-3 text-4xl font-extrabold sm:text-5xl">Help Center</h1>
          <p className="mt-4 max-w-3xl text-gray-300">
            Find answers to common questions, browse guides, or contact our support team.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Search and Filter */}
        <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search FAQs and guides..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded border border-gray-300 pl-10 pr-4 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded border border-gray-300 px-4 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500"
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* FAQs */}
        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-bold text-gray-950">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {filteredFaqs.map((faq, index) => (
              <div key={index} className="rounded-lg border border-gray-200 bg-white shadow-sm">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="flex w-full items-center justify-between p-6 text-left"
                >
                  <span className="text-lg font-medium text-gray-950">{faq.question}</span>
                  {expandedFaq === index ? (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-500" />
                  )}
                </button>
                {expandedFaq === index && (
                  <div className="border-t border-gray-200 px-6 pb-6">
                    <p className="mt-4 text-gray-700"><LinkifiedText text={faq.answer} /></p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Guides */}
        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-bold text-gray-950">Help Guides</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {filteredGuides.map((guide, index) => (
              <div key={index} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <HelpCircle className="h-8 w-8 text-red-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-950 mb-2">{guide.title}</h3>
                <p className="text-gray-700 mb-4"><LinkifiedText text={guide.content} /></p>
                <button className="text-red-600 hover:text-red-800 font-medium">
                  Read More →
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Contact Support */}
        <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-2xl font-bold text-gray-950">Still Need Help?</h2>
          <p className="text-gray-700 mb-6">
            Can't find what you're looking for? Our support team is here to help.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded bg-red-600 px-6 py-3 font-bold text-white hover:bg-red-700"
            >
              <MessageCircle className="h-4 w-4" />
              Contact Support
            </Link>
            <Link
              to="/feedback"
              className="inline-flex items-center gap-2 rounded border border-gray-300 px-6 py-3 font-bold text-gray-800 hover:bg-gray-50"
            >
              Send Feedback
            </Link>
            <a
              href={`tel:${brand.phone}`}
              className="inline-flex items-center gap-2 rounded border border-gray-300 px-6 py-3 font-bold text-gray-800 hover:bg-gray-50"
            >
              <Phone className="h-4 w-4" />
              Call {brand.phone}
            </a>
          </div>
        </section>
      </main>
    </div>
  )
}

export default HelpCenterPage
