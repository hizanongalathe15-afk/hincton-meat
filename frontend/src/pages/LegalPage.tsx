import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSiteContent } from '../contexts/SiteContentContext'
import { contentApi } from '../services/contentApi'
import LinkifiedText from '../components/ui/LinkifiedText'

type LegalPageProps = {
  type: 'terms' | 'privacy'
}

type LegalSection = {
  title: string
  body: string
}

const updatedDate = 'May 14, 2026'

const LegalPage = ({ type }: LegalPageProps) => {
  const [sections, setSections] = useState<LegalSection[]>([])
  const [loading, setLoading] = useState(true)
  const { profile } = useSiteContent()

  useEffect(() => {
    const loadContent = async () => {
      try {
        const data = await contentApi.getSiteProfile()
        const content = type === 'terms' ? data.profile.terms : data.profile.privacy
        setSections(content || [])
      } catch (error) {
        console.error('Failed to load legal content:', error)
        // Fallback to empty
        setSections([])
      } finally {
        setLoading(false)
      }
    }

    loadContent()
  }, [type])

  const isTerms = type === 'terms'
  const title = isTerms ? 'Terms And Conditions' : 'Privacy Policy'

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-700 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gray-950 px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-bold uppercase tracking-wide text-red-300">{profile.brand.name || ''}</p>
          <h1 className="mt-3 text-4xl font-extrabold sm:text-5xl">{title}</h1>
          <p className="mt-4 max-w-3xl text-gray-300">Last updated: {updatedDate}</p>
        </div>
      </section>

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-base leading-8 text-gray-700">
            These terms are written for customers using the Hincton Meat Products website, buyer account, checkout,
            delivery tracking, messaging, and related services. Read the full page before creating an account or placing an order.
          </p>

          <div className="mt-8 space-y-8">
            {sections.map((section, index) => (
              <section key={index}>
                <h2 className="text-xl font-extrabold text-gray-950">{section.title}</h2>
                <p className="mt-3 leading-8 text-gray-700"><LinkifiedText text={section.body} /></p>
              </section>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-3 border-t border-gray-200 pt-6">
            <Link to="/register" className="rounded-md bg-red-700 px-5 py-3 text-sm font-bold text-white hover:bg-red-800">
              Back To Signup
            </Link>
            <Link to="/contact" className="rounded-md border border-gray-300 px-5 py-3 text-sm font-bold text-gray-800 hover:bg-gray-50">
              Contact Support
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

export default LegalPage
