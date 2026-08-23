import { useState, useEffect, useRef, useCallback, type CSSProperties, type RefObject } from 'react'
import { careersApi } from '../services/buyerApi'
import { useSiteContent } from '../contexts/SiteContentContext'
import { useLanguage } from '../contexts/LanguageContext'
import { Briefcase, MapPin, Clock, ChevronDown, ChevronUp, Send, XCircle, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface MaskPos { x: number; y: number; sw: number; sh: number }

function useIsMobile() {
  const [m, setM] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const h = (e: MediaQueryListEvent | MediaQueryList) => setM(e.matches)
    h(mq)
    mq.addEventListener('change', h as any)
    return () => mq.removeEventListener('change', h as any)
  }, [])
  return m
}

function useMaskPositions(sectionRef: RefObject<HTMLElement>, cardRefs: RefObject<(HTMLElement | null)[]>) {
  const [positions, setPositions] = useState<MaskPos[]>([])
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const update = () => {
      const sr = el.getBoundingClientRect()
      const cards = cardRefs.current || []
      const next: MaskPos[] = cards.map((c: HTMLElement | null) => {
        if (!c) return { x: 0, y: 0, sw: sr.width, sh: sr.height }
        const cr = c.getBoundingClientRect()
        return { x: cr.left - sr.left, y: cr.top - sr.top, sw: sr.width, sh: sr.height }
      })
      setPositions(next)
    }
    const ro = new ResizeObserver(update)
    ro.observe(el)
    update()
    return () => ro.disconnect()
  }, [sectionRef, cardRefs])
  return positions
}

function useImageWidth(src: string, sectionHeight: number) {
  const [w, setW] = useState(0)
  useEffect(() => {
    if (!src || !sectionHeight) return
    const img = new Image()
    img.onload = () => {
      const rw = img.naturalWidth * (sectionHeight / img.naturalHeight)
      setW(rw)
    }
    img.src = src
  }, [src, sectionHeight])
  return w
}

function useStaggeredReveal(_count: number) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); io.disconnect() }
    }, { threshold: 0.12 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  const getAnimStyle = useCallback((i: number): CSSProperties => ({
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(24px)',
    transition: `opacity 0.6s cubic-bezier(0.16,1,0.3,1) ${i * 120}ms, transform 0.6s cubic-bezier(0.16,1,0.3,1) ${i * 120}ms`,
  }), [visible])
  return { containerRef, getAnimStyle }
}

function MaskedCard({ bgImage, position, imageWidth, focalX = 0.8, className, children, cardRef, style }: {
  bgImage: string; position?: MaskPos; imageWidth: number; focalX?: number
  className?: string; children?: React.ReactNode; cardRef?: (el: HTMLElement | null) => void; style?: CSSProperties
}) {
  const pos = position || { x: 0, y: 0, sw: 0, sh: 0 }
  const overflow = imageWidth > pos.sw ? imageWidth - pos.sw : 0
  const focalOffset = overflow * focalX
  const bg: CSSProperties = pos.sh ? {
    backgroundImage: `url(${bgImage})`,
    backgroundSize: `auto ${pos.sh}px`,
    backgroundPosition: `-${pos.x + focalOffset}px -${pos.y}px`,
    backgroundRepeat: 'no-repeat',
  } : { backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
  return <div ref={cardRef as any} className={className} style={{ ...bg, ...style }}>{children}</div>
}

interface JobPosting {
  id: string; title: string; department: string; location: string; type: string
  description: string; requirements: string; salaryRange?: string; deadline?: string
  maxSpots: number; googleFormUrl?: string; status: string; createdAt: string
  _count?: { applications: number }
}

const DEFAULT_CONTENT = {
  heroImage: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1280&q=80',
  section2Image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=1280&q=80',
  section3Img1: 'https://images.unsplash.com/photo-1577219491135-ce391738fbfc?w=1280&q=80',
  section3Img2: 'https://images.unsplash.com/photo-1551218808-94e220242969?w=1280&q=80',
  section3Bg: 'https://images.unsplash.com/photo-1504672281656-e4981d70414b?w=1280&q=80',
  heroBars: ['Premium Quality Meats', 'Expert Butchery Team', 'Trusted by Thousands'],
  heroTitle: 'We deliver the finest cuts with passion and expertise',
  heroSubtitle: 'Join the Hincton Meat Family',
  heroCtaLabel: 'View Open Positions',
  section2Title: 'Our Culture',
  section2Subtitle: 'What makes us different',
  section2CtaLabel: 'See Openings',
  section2CtaText: 'Want to be part of something great? Explore our current openings.',
  cultureCards: [
    { title: 'Our\nCraft', subtitle: 'Artisan butchery meets modern standards', active: true },
    { title: 'Growth\nPath', subtitle: 'We invest in our team development', active: false },
    { title: 'Team\nSpirit', subtitle: 'A family that works hard and celebrates harder', active: false },
    { title: 'Fresh\nDaily', subtitle: null, active: false },
  ],
  section3Heading: 'Open\nPositions',
  section3Subheading: 'Join Our Team',
  infoCard1Title: 'The Hiring\nProcess',
  infoCard2Title: 'Benefits &\nPerks',
  infoCardCtaLabel: 'Apply Now',
  infoCardCtaText: 'Consultation',
}

export default function CareersPage() {
  const { profile } = useSiteContent()
  const { t } = useLanguage()
  const isMobile = useIsMobile()
  const [content, setContent] = useState(DEFAULT_CONTENT)
  const [jobs, setJobs] = useState<JobPosting[]>([])
  const [expandedJob, setExpandedJob] = useState<string | null>(null)
  const [applyingJob, setApplyingJob] = useState<JobPosting | null>(null)
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', coverLetter: '', honeypot: '' })
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [filterDepartment, setFilterDepartment] = useState('')

  const s1Ref = useRef<HTMLElement>(null)
  const s1CardRefs = useRef<(HTMLElement | null)[]>([])
  const s2Ref = useRef<HTMLElement>(null)
  const s2CardRefs = useRef<(HTMLElement | null)[]>([])

  const s1Positions = useMaskPositions(s1Ref, s1CardRefs)
  const s2Positions = useMaskPositions(s2Ref, s2CardRefs)

  const s1H = s1Ref.current?.getBoundingClientRect().height || 0
  const s2H = s2Ref.current?.getBoundingClientRect().height || 0
  const s1ImgW = useImageWidth(content.heroImage, s1H)
  const s2ImgW = useImageWidth(content.section2Image, s2H)

  const s1Reveal = useStaggeredReveal(4)
  const s2Reveal = useStaggeredReveal(4)
  const s3Reveal = useStaggeredReveal(4)

  useEffect(() => {
    careersApi.getPageContent().then(d => setContent(d)).catch(() => {})
    loadJobs()
  }, [])

  const loadJobs = async () => {
    try {
      const data = await careersApi.getJobs()
      setJobs(data.jobs || [])
    } catch { setJobs([]) }
  }

  const departments = Array.from(new Set(jobs.map(j => j.department)))
  const filteredJobs = filterDepartment ? jobs.filter(j => j.department === filterDepartment) : jobs

  const focalS1 = isMobile ? 0.7 : 0.8
  const focalS2 = isMobile ? 0.65 : 0.8

  const setS1Card = (i: number) => (el: HTMLElement | null) => { s1CardRefs.current[i] = el }
  const setS2Card = (i: number) => (el: HTMLElement | null) => { s2CardRefs.current[i] = el }

  const handleApply = async () => {
    if (!applyingJob || !formData.name || !formData.email || !formData.phone) {
      toast.error('Please fill in all required fields')
      return
    }
    if (formData.honeypot) return
    setSubmitting(true)
    try {
      if (applyingJob.googleFormUrl) {
        window.open(applyingJob.googleFormUrl, '_blank')
        setSubmitted(true)
        setSubmitting(false)
        return
      }
      const fd = new FormData()
      fd.append('name', formData.name)
      fd.append('email', formData.email)
      fd.append('phone', formData.phone)
      fd.append('coverLetter', formData.coverLetter)
      if (cvFile) fd.append('cv', cvFile)
      await careersApi.apply(applyingJob.id, fd)
      setSubmitted(true)
      toast.success('Application submitted successfully!')
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to submit application')
    } finally { setSubmitting(false) }
  }

  const whatsappNumber = profile?.brand?.whatsapp || ''

  return (
    <div className="bg-white min-h-screen">
      <section ref={(el) => { (s1Ref as any).current = el; (s1Reveal.containerRef as any).current = el }}
        className="h-screen w-full overflow-hidden flex flex-col pt-20 md:pt-24 px-3 md:px-5 pb-1.5 md:pb-2 gap-1.5 md:gap-2">
        {content.heroBars.map((bar, i) => (
          <MaskedCard key={i} bgImage={content.heroImage} position={s1Positions[i]} imageWidth={s1ImgW} focalX={focalS1}
            className="w-full h-14 md:h-20 shrink-0 rounded-xl md:rounded-2xl overflow-hidden relative"
            cardRef={setS1Card(i)} style={s1Reveal.getAnimStyle(i)}>
            <span className="flex items-center justify-center h-full text-black text-lg md:text-3xl font-bold text-center relative z-10">{bar}</span>
          </MaskedCard>
        ))}
        <MaskedCard bgImage={content.heroImage} position={s1Positions[3]} imageWidth={s1ImgW} focalX={focalS1}
          className="w-full flex-1 min-h-0 rounded-xl md:rounded-2xl overflow-hidden relative"
          cardRef={setS1Card(3)} style={s1Reveal.getAnimStyle(3)}>
          <div className="absolute top-4 left-4 md:top-7 md:left-7 text-black text-xs md:text-sm font-semibold leading-5 max-w-[200px] md:max-w-[320px] z-10">
            {content.heroTitle}
          </div>
          <div className="absolute bottom-5 left-3 md:bottom-8 md:left-4 z-10">
            <span className="block text-black text-xs md:text-sm font-semibold mb-1 md:mb-2">{content.heroSubtitle}</span>
            <h1 className="text-black text-[clamp(3rem,11vw,11rem)] font-bold leading-[0.79] tracking-tight">
              Hincton<br />Meat
            </h1>
          </div>
          <a href="#positions" className="absolute bottom-6 right-4 md:bottom-10 md:right-8 text-white text-xs md:text-sm font-semibold z-10">
            {content.heroCtaLabel}
          </a>
        </MaskedCard>
      </section>

      <section ref={(el) => { (s2Ref as any).current = el; (s2Reveal.containerRef as any).current = el }}
        className="min-h-screen md:h-screen w-full overflow-hidden flex flex-col pt-1.5 md:pt-2 px-3 md:px-5 pb-1.5 md:pb-2 gap-1.5 md:gap-2">
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 grid-rows-[auto_auto_auto_auto] md:grid-rows-[1fr_1fr_0.8fr] gap-1.5 md:gap-2">
          <MaskedCard bgImage={content.section2Image} position={s2Positions[0]} imageWidth={s2ImgW} focalX={focalS2}
            className="rounded-xl md:rounded-2xl overflow-hidden relative min-h-[160px] md:min-h-0"
            cardRef={setS2Card(0)} style={s2Reveal.getAnimStyle(0)}>
            <span className="absolute top-4 left-5 md:top-6 md:left-7 text-white md:text-black text-2xl md:text-3xl font-bold z-10">{content.section2Title}</span>
            <span className="absolute bottom-4 left-5 md:bottom-6 md:left-7 text-white md:text-black text-xs md:text-sm font-semibold z-10">{content.section2Subtitle}</span>
          </MaskedCard>

          <MaskedCard bgImage={content.section2Image} position={s2Positions[1]} imageWidth={s2ImgW} focalX={focalS2}
            className="md:row-span-2 rounded-xl md:rounded-2xl overflow-hidden relative min-h-[200px] md:min-h-0"
            cardRef={setS2Card(1)} style={s2Reveal.getAnimStyle(1)}>
            <span className="absolute bottom-16 left-5 md:bottom-20 md:left-7 text-white text-xs md:text-sm font-semibold leading-5 z-10">
              {content.section2CtaText}
            </span>
            <a href="#positions" className="absolute bottom-4 right-4 md:bottom-6 md:right-6 px-5 py-3 md:px-8 md:py-5 bg-white rounded-full text-black text-base md:text-xl font-bold z-10 hover:scale-105 transition-transform">
              {content.section2CtaLabel}
            </a>
          </MaskedCard>

          <MaskedCard bgImage={content.section2Image} position={s2Positions[2]} imageWidth={s2ImgW} focalX={focalS2}
            className="rounded-xl md:rounded-2xl overflow-hidden relative min-h-[160px] md:min-h-0"
            cardRef={setS2Card(2)} style={s2Reveal.getAnimStyle(2)}>
            <h2 className="absolute top-4 left-5 md:top-6 md:left-7 text-white md:text-black text-[clamp(3rem,7vw,6rem)] font-bold leading-[0.9] z-10 whitespace-pre-line">
              {(content.cultureCards?.[0]?.title || 'Our\nCraft').split('\\n').map((l, i) => <span key={i}>{l}<br /></span>)}
            </h2>
          </MaskedCard>

          <MaskedCard bgImage={content.section2Image} position={s2Positions[3]} imageWidth={s2ImgW} focalX={focalS2}
            className="col-span-1 md:col-span-2 rounded-xl md:rounded-2xl overflow-hidden relative min-h-[200px] md:min-h-0"
            cardRef={setS2Card(3)} style={s2Reveal.getAnimStyle(3)}>
            <div className="absolute inset-0 z-10 flex flex-wrap md:flex-nowrap gap-1.5 md:gap-2 p-2 md:p-3">
              {(content.cultureCards || DEFAULT_CONTENT.cultureCards).map((card, i) => (
                <div key={i} className={`flex-1 min-w-[calc(50%-4px)] md:min-w-0 rounded-xl md:rounded-2xl p-3 md:p-5 flex flex-col justify-between ${card.active ? 'bg-white/90 backdrop-blur-md' : 'bg-white/20 backdrop-blur-xl'}`}>
                  <h3 className={`text-xl md:text-4xl font-bold leading-[1.05] whitespace-pre-line ${card.active ? 'text-black' : 'text-white'}`}>
                    {card.title}
                  </h3>
                  {card.subtitle && (
                    <p className={`text-xs md:text-sm mt-2 ${card.active ? 'text-black/60' : 'text-white/70'}`}>{card.subtitle}</p>
                  )}
                </div>
              ))}
            </div>
          </MaskedCard>
        </div>
      </section>

      <section ref={s3Reveal.containerRef} id="positions"
        className="min-h-screen md:h-screen w-full overflow-hidden flex flex-col pt-1.5 md:pt-2 px-3 md:px-5 pb-1.5 md:pb-2 gap-1.5 md:gap-2">
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-1.5 md:gap-2">
          <div className="flex flex-col gap-1.5 md:gap-2">
            <div className="rounded-xl md:rounded-2xl bg-stone-50 p-5 md:p-7 flex flex-col justify-between flex-[1.2] min-h-[180px] md:min-h-0" style={s3Reveal.getAnimStyle(0)}>
              <h2 className="text-[clamp(3rem,7vw,6.5rem)] font-bold leading-[0.95] text-black whitespace-pre-line">
                {content.section3Heading.split('\\n').map((l, i) => <span key={i}>{l}<br /></span>)}
              </h2>
              <p className="text-xs md:text-sm font-semibold text-black">{content.section3Subheading}</p>
            </div>
            <div className="flex gap-1.5 md:gap-2 flex-1 min-h-[140px] md:min-h-0" style={s3Reveal.getAnimStyle(1)}>
              <div className="flex-1 rounded-xl md:rounded-2xl overflow-hidden">
                <img src={content.section3Img1} alt="Our team" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 rounded-xl md:rounded-2xl overflow-hidden">
                <img src={content.section3Img2} alt="Our workplace" className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="rounded-xl md:rounded-2xl bg-zinc-200 p-5 md:p-7 flex items-end justify-between flex-[0.8] min-h-[160px] md:min-h-0" style={s3Reveal.getAnimStyle(2)}>
              <div>
                <p className="text-xs md:text-sm font-semibold text-black mb-2 md:mb-3">{content.infoCardCtaText}</p>
                <h3 className="text-xl md:text-3xl font-bold text-black leading-7 whitespace-pre-line">
                  {content.infoCard1Title.split('\\n').map((l, i) => <span key={i}>{l}<br /></span>)}
                </h3>
              </div>
              <a href="#job-listings" className="px-5 py-3 md:px-8 md:py-5 bg-white rounded-full text-black text-base md:text-xl font-bold hover:scale-105 transition-transform">
                {content.infoCardCtaLabel}
              </a>
            </div>
          </div>
          <div className="rounded-xl md:rounded-2xl overflow-hidden relative min-h-[350px] md:min-h-0" style={s3Reveal.getAnimStyle(3)}>
            <img src={content.section3Bg} alt="Team" className="w-full h-full object-cover" />
            <div className="absolute bottom-3 left-3 right-3 md:bottom-5 md:left-5 md:right-5 flex gap-1.5 md:gap-2">
              <div className="flex-1 bg-white rounded-xl md:rounded-2xl p-3 md:p-5 flex flex-col justify-between h-36 md:h-52">
                <h4 className="text-lg md:text-2xl font-bold text-black leading-7 whitespace-pre-line">
                  {content.infoCard1Title.split('\\n').map((l, i) => <span key={i}>{l}<br /></span>)}
                </h4>
                <div className="self-end w-9 h-9 md:w-12 md:h-12 rounded-full border border-black flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="rotate-[-45deg]">
                    <path d="M1 7h12m0 0L8 2m5 5L8 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
              <div className="flex-1 bg-white/20 backdrop-blur-xl rounded-xl md:rounded-2xl p-3 md:p-5 flex flex-col justify-between h-36 md:h-52">
                <h4 className="text-lg md:text-2xl font-bold text-white leading-7 whitespace-pre-line">
                  {content.infoCard2Title.split('\\n').map((l, i) => <span key={i}>{l}<br /></span>)}
                </h4>
                <div className="self-end w-9 h-9 md:w-12 md:h-12 rounded-full border border-white flex items-center justify-center text-white">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="rotate-[-45deg]">
                    <path d="M1 7h12m0 0L8 2m5 5L8 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div id="job-listings" className="px-3 md:px-5 py-8 md:py-16 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <h2 className="text-3xl md:text-5xl font-bold text-black tracking-tight">{t('careers.hiring')}</h2>
          <div className="flex items-center gap-3">
            <select value={filterDepartment} onChange={e => setFilterDepartment(e.target.value)}
              className="px-4 py-2 rounded-xl border border-stone-300 bg-white text-sm font-semibold text-black focus:outline-none focus:ring-2 focus:ring-black/10">
              <option value="">{t('careers.allDepartments')}</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        {filteredJobs.length === 0 ? (
          <div className="text-center py-20 text-stone-400">
            <Briefcase className="mx-auto h-16 w-16 mb-4 opacity-30" />
            <p className="text-xl font-semibold">{t('careers.noOpenPositions')}</p>
            <p className="text-sm mt-2">{t('careers.checkBackLater')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map(job => {
              const isExpanded = expandedJob === job.id
              const spotsLeft = job.maxSpots - (job._count?.applications || 0)
              const spotsAvailable = spotsLeft > 0
              return (
                <div key={job.id} className="rounded-2xl border border-stone-200 bg-white overflow-hidden transition-shadow hover:shadow-lg">
                  <button onClick={() => setExpandedJob(isExpanded ? null : job.id)}
                    className="w-full p-5 md:p-6 flex items-center justify-between text-left">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-lg md:text-xl font-bold text-black">{job.title}</h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${spotsAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                          {spotsAvailable ? `${spotsLeft} spot${spotsLeft > 1 ? 's' : ''} left` : 'Full'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-stone-500">
                        <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{job.department}</span>
                        <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{job.location}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{job.type.replace('_', ' ')}</span>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="h-5 w-5 text-stone-400" /> : <ChevronDown className="h-5 w-5 text-stone-400" />}
                  </button>
                  {isExpanded && (
                    <div className="px-5 md:px-6 pb-6 border-t border-stone-100">
                      <div className="mt-4 prose prose-sm max-w-none text-stone-600" dangerouslySetInnerHTML={{ __html: job.description.replace(/\n/g, '<br/>') }} />
                      <div className="mt-4">
                        <h4 className="text-sm font-bold text-black mb-2">Requirements</h4>
                        <ul className="list-disc list-inside text-sm text-stone-500 space-y-1">
                          {job.requirements.split('\n').filter(Boolean).map((r, i) => <li key={i}>{r}</li>)}
                        </ul>
                      </div>
                      {job.salaryRange && <p className="mt-3 text-sm font-semibold text-stone-700">Salary: {job.salaryRange}</p>}
                      {job.deadline && <p className="text-xs text-stone-400 mt-1">Deadline: {new Date(job.deadline).toLocaleDateString()}</p>}
                      <div className="flex gap-3 mt-5">
                        <button onClick={() => { setApplyingJob(job); setSubmitted(false) }} disabled={!spotsAvailable}
                          className="px-6 py-3 bg-black text-white rounded-xl text-sm font-bold hover:bg-stone-800 transition disabled:opacity-40">
                          {t('careers.applyNow')}
                        </button>
                        <a href={`https://wa.me/?text=${encodeURIComponent(`Check out this job at Hincton Meat: ${job.title}`)}`}
                          target="_blank" rel="noopener noreferrer"
                          className="px-4 py-3 bg-green-50 text-green-700 rounded-xl text-sm font-bold hover:bg-green-100 transition">
                          Share via WhatsApp
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <div className="mt-12 text-center p-6 rounded-2xl bg-stone-50 border border-stone-200">
          <p className="text-sm font-semibold text-stone-600">{t('careers.fallbackTitle')}</p>
          <p className="text-xs text-stone-400 mt-1">
            {whatsappNumber
              ? <span>WhatsApp: <a href={`https://wa.me/${whatsappNumber}`} className="text-black underline font-semibold" target="_blank" rel="noopener noreferrer">{whatsappNumber}</a></span>
              : <span>{t('careers.fallbackEmail')}: <a href="mailto:careers@hinctonmeat.com" className="text-black underline font-semibold">careers@hinctonmeat.com</a></span>
            }
          </p>
        </div>
      </div>

      {applyingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => !submitting && setApplyingJob(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            {submitted ? (
              <div className="text-center py-8">
                <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
                <h3 className="text-2xl font-bold text-black">{t('careers.applicationSubmitted')}</h3>
                <p className="text-sm text-stone-500 mt-2">{t('careers.weWillReview')}</p>
                <button onClick={() => setApplyingJob(null)} className="mt-6 px-6 py-3 bg-black text-white rounded-xl text-sm font-bold">{t('common.close') || 'Close'}</button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-black">Apply: {applyingJob.title}</h3>
                  <button onClick={() => setApplyingJob(null)} className="p-1 hover:bg-stone-100 rounded-lg"><XCircle className="h-5 w-5 text-stone-400" /></button>
                </div>
                <div className="space-y-4">
                  <input type="hidden" value={formData.honeypot} onChange={e => setFormData(p => ({ ...p, honeypot: e.target.value }))} />
                  <div className="hidden"><input type="text" name="website" tabIndex={-1} autoComplete="off" value={formData.honeypot} onChange={e => setFormData(p => ({ ...p, honeypot: e.target.value }))} /></div>
                  <div>
                    <label className="text-xs font-semibold text-stone-600 mb-1 block">Full Name *</label>
                    <input type="text" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-black/10" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-stone-600 mb-1 block">Email *</label>
                    <input type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-black/10" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-stone-600 mb-1 block">Phone *</label>
                    <input type="tel" value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-black/10" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-stone-600 mb-1 block">Cover Letter</label>
                    <textarea value={formData.coverLetter} onChange={e => setFormData(p => ({ ...p, coverLetter: e.target.value }))} rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 resize-none" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-stone-600 mb-1 block">Upload CV (PDF, DOC)</label>
                    <input type="file" accept=".pdf,.doc,.docx,.txt" onChange={e => setCvFile(e.target.files?.[0] || null)}
                      className="w-full text-sm text-stone-500 file:mr-3 file:px-4 file:py-2 file:rounded-xl file:border-0 file:bg-stone-100 file:text-stone-700 file:font-semibold" />
                  </div>
                  <button onClick={handleApply} disabled={submitting}
                    className="w-full py-3 bg-black text-white rounded-xl text-sm font-bold hover:bg-stone-800 transition disabled:opacity-50 flex items-center justify-center gap-2">
                    {submitting ? 'Submitting...' : <><Send className="h-4 w-4" />{t('careers.submitApplication')}</>}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
