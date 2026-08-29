import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ArrowDownRight, Sparkles } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { useLanguage } from '../contexts/LanguageContext'
import { useSiteContent } from '../contexts/SiteContentContext'
import { COMPANY_PROFILE, HINCTON_BRAND } from '../utils/hinctonBrand'

interface HeroSectionProps {
  onSearch?: (query: string) => void
}

const HeroSection = ({ onSearch }: HeroSectionProps) => {
  void onSearch
  const { t } = useLanguage()
  const { profile } = useSiteContent()
  const reduceMotion = useReducedMotion()
  const brand = profile.brand
  const slides = profile.heroSlides?.length ? profile.heroSlides : [{ image: profile.images.hero, alt: t('hero.heroImageAlt') }]
  const [activeSlide, setActiveSlide] = useState(0)
  useEffect(() => {
    if (slides.length < 2 || reduceMotion) return
    const interval = window.setInterval(() => setActiveSlide((current) => (current + 1) % slides.length), 6500)
    return () => window.clearInterval(interval)
  }, [slides.length, reduceMotion])
  const brandTagline = brand.tagline === HINCTON_BRAND.tagline ? t('brand.tagline') : brand.tagline
  const brandMantra = brand.mantra === HINCTON_BRAND.mantra ? t('brand.mantra') : brand.mantra
  const savedCompanyProfile = profile.companyProfile?.trim() || ''
  const companyProfile = savedCompanyProfile === COMPANY_PROFILE || savedCompanyProfile.length < 40
    ? t('company.profile')
    : savedCompanyProfile

  const rise = (delay = 0) => ({
    initial: reduceMotion ? false : { opacity: 0, y: 28 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, delay },
  })

  return (
    <section className="hero-orbit relative isolate min-h-[610px] overflow-hidden bg-[#171615] text-white md:min-h-[710px]">
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="flex h-full transition-transform duration-[1400ms] ease-in-out" style={{ width: `${slides.length * 100}%`, transform: `translateX(-${activeSlide * (100 / slides.length)}%)` }}>
          {slides.map((slide, index) => <img key={`${slide.image}-${index}`} src={slide.image} alt="" className="h-full w-full shrink-0 object-cover opacity-45" style={{ width: `${100 / slides.length}%` }} />)}
        </div>
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(12,11,10,.96)_8%,rgba(19,17,16,.79)_48%,rgba(116,31,21,.52)_100%)]" />
      <div className="hero-grid absolute inset-0 opacity-30" aria-hidden="true" />
      <div className="hero-glow absolute -left-32 top-20 h-80 w-80 rounded-full bg-red-600/30 blur-3xl" aria-hidden="true" />
      {slides.length > 1 && <div className="absolute bottom-7 right-7 z-20 flex gap-2" aria-label="Hero slides">{slides.map((slide, index) => <button key={`${slide.image}-${index}`} onClick={() => setActiveSlide(index)} className={`h-2 rounded-full transition-all ${activeSlide === index ? 'w-7 bg-white' : 'w-2 bg-white/50'}`} aria-label={`Show slide ${index + 1}`} />)}</div>}

      <motion.div className="hero-orbit-card hero-orbit-card--top" animate={reduceMotion ? undefined : { y: [0, -13, 0], rotate: [-4, -2, -4] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }} aria-hidden="true">
        <Sparkles className="h-5 w-5" />
        <span>Freshly prepared</span>
      </motion.div>
      <motion.div className="hero-orbit-card hero-orbit-card--bottom" animate={reduceMotion ? undefined : { y: [0, 12, 0], rotate: [5, 7, 5] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }} aria-hidden="true">
        <span className="hero-orbit-dot" />
        <span>Cold-chain care</span>
      </motion.div>
      <motion.div className="hero-ring absolute -bottom-40 right-[5%] hidden h-[33rem] w-[33rem] rounded-full border border-white/20 lg:block" animate={reduceMotion ? undefined : { rotate: 360 }} transition={{ duration: 48, repeat: Infinity, ease: 'linear' }} aria-hidden="true" />

      <div className="relative z-10 mx-auto flex min-h-[610px] w-full max-w-7xl items-center px-5 py-20 sm:px-8 md:min-h-[710px] lg:px-8">
        <div className="max-w-4xl">
          <motion.div {...rise(0)} className="mb-8 inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-3 py-2 pr-5 backdrop-blur-md">
            <img src={profile.images.logo || brand.logo} alt={brand.name} className="h-9 w-auto rounded-full bg-white p-1" />
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/90 sm:text-sm">{brandTagline}</span>
          </motion.div>
          <motion.h1 {...rise(0.12)} className="max-w-3xl text-balance text-5xl font-semibold leading-[.94] tracking-[-0.06em] sm:text-6xl md:text-7xl lg:text-8xl">
            {t('hero.title.main')}
            <span className="block text-[var(--site-primary,#f06b58)]">{t('hero.title.highlight')}</span>
          </motion.h1>
          <motion.p {...rise(0.24)} className="mt-7 max-w-2xl text-base leading-7 text-white/78 sm:text-lg sm:leading-8">
            {companyProfile}
          </motion.p>
          <motion.div {...rise(0.36)} className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link to="/shop" className="hero-primary-button group">
              {t('hero.cta.shopProducts')} <ArrowDownRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1 group-hover:translate-y-1" />
            </Link>
            <Link to="/web-profile" className="hero-secondary-button">{t('hero.cta.viewProfile')}</Link>
          </motion.div>
          <motion.p {...rise(0.48)} className="mt-12 border-l border-[var(--site-primary,#f06b58)] pl-4 text-sm font-medium italic text-white/80 sm:text-base">“{brandMantra}”</motion.p>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
