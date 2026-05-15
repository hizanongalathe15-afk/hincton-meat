import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useSiteContent } from '../contexts/SiteContentContext'
import { resolveMediaUrl } from '../services/api'

type DynamicContentPageProps = {
  pageKey: string
}

const DynamicContentPage = ({ pageKey }: DynamicContentPageProps) => {
  const { profile } = useSiteContent()
  const page = profile.pages[pageKey]

  if (!page) return null

  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-gray-950 px-4 py-20 text-white sm:px-6 lg:px-8">
        {page.video ? (
          <video src={resolveMediaUrl(page.video)} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover opacity-45" />
        ) : page.image ? (
          <img src={resolveMediaUrl(page.image)} alt={page.title} className="absolute inset-0 h-full w-full object-cover opacity-45" />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/30" />
        <div className="relative mx-auto max-w-7xl">
          <p className="text-sm font-bold uppercase tracking-wide text-red-300">{profile.brand.tagline}</p>
          <h1 className="mt-4 max-w-4xl text-5xl font-extrabold leading-tight md:text-7xl">{page.title}</h1>
          {page.subtitle && <p className="mt-6 max-w-3xl text-xl leading-8 text-gray-100">{page.subtitle}</p>}
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {page.body && <p className="max-w-4xl text-xl leading-9 text-gray-700">{page.body}</p>}

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {(page.sections || []).map((section, index) => (
              <article key={`${section.title}-${index}`} className="overflow-hidden rounded bg-white shadow-sm ring-1 ring-gray-200">
                {section.video ? (
                  <video src={resolveMediaUrl(section.video)} controls className="h-64 w-full object-cover" />
                ) : section.image ? (
                  <img src={resolveMediaUrl(section.image)} alt={section.title} className="h-64 w-full object-cover" />
                ) : null}
                <div className="p-6">
                  <h2 className="text-2xl font-extrabold text-gray-950">{section.title}</h2>
                  {section.body && <p className="mt-3 text-gray-700 leading-7">{section.body}</p>}
                  {section.linkUrl && (
                    <Link to={section.linkUrl} className="mt-5 inline-flex items-center gap-2 font-bold text-red-700 hover:text-red-800">
                      {section.linkLabel || 'Read More'}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default DynamicContentPage
