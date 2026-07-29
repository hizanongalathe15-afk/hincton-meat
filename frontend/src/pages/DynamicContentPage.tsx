import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useSiteContent } from '../contexts/SiteContentContext'
import { getEmbedVideoUrl, isDirectVideoUrl, resolveMediaUrl } from '../services/api'

type DynamicContentPageProps = {
  pageKey: string
}

const DynamicContentPage = ({ pageKey }: DynamicContentPageProps) => {
  const { profile } = useSiteContent()
  const page = profile.pages[pageKey]

  if (!page) return null

  const renderParagraphs = (body?: string, className = 'text-gray-700 leading-7') => (
    <div className="space-y-4">
      {(body || '').split(/\n{1,}/).map((paragraph, index) => (
        paragraph.trim() ? <p key={index} className={className}>{paragraph.trim()}</p> : null
      ))}
    </div>
  )

  const renderVideo = (url: string, title: string, className: string) => {
    const videoUrl = resolveMediaUrl(url)
    const embedUrl = getEmbedVideoUrl(videoUrl)
    if (embedUrl) return <iframe src={embedUrl} title={title} className={className} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
    if (isDirectVideoUrl(videoUrl)) return <video src={videoUrl} autoPlay muted loop playsInline controls className={className} />
    return null
  }

  return (
    <div className="ambient-page min-h-screen bg-white">
      <section className="gravity-hero relative overflow-hidden bg-gray-950 px-4 py-20 text-white sm:px-6 lg:px-8">
        {page.video ? (
          renderVideo(page.video, page.title, 'absolute inset-0 h-full w-full object-cover opacity-45')
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
          {page.body && <div className="max-w-4xl text-xl leading-9">{renderParagraphs(page.body, 'text-gray-700 leading-9')}</div>}

          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {(page.sections || []).map((section, index) => (
              <article key={`${section.title}-${index}`} className="gravity-card overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-gray-200">
                {section.video ? (
                  renderVideo(section.video, section.title || page.title, 'h-64 w-full object-cover')
                ) : section.image ? (
                  <img src={resolveMediaUrl(section.image)} alt={section.title} className="h-64 w-full object-cover" />
                ) : null}
                <div className="p-6">
                  <h2 className="text-2xl font-extrabold text-gray-950">{section.title}</h2>
                  {section.body && <div className="mt-3">{renderParagraphs(section.body)}</div>}
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
