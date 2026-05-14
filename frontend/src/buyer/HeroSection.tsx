import { Link } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import { useSiteContent } from '../contexts/SiteContentContext'
import { useTypewriter } from '../utils/animations'
import { COMPANY_PROFILE, HINCTON_BRAND } from '../utils/hinctonBrand'

interface HeroSectionProps {
  onSearch?: (query: string) => void
}

const HeroSection = ({ onSearch }: HeroSectionProps) => {
  void onSearch
  const { t } = useLanguage()
  const { profile } = useSiteContent()
  const brand = profile.brand
  const brandTagline = brand.tagline === HINCTON_BRAND.tagline ? t('brand.tagline') : brand.tagline
  const brandMantra = brand.mantra === HINCTON_BRAND.mantra ? t('brand.mantra') : brand.mantra
  const companyProfile = profile.companyProfile === COMPANY_PROFILE ? t('company.profile') : profile.companyProfile
  const { text: typedCompanyProfile, isTyping } = useTypewriter({
    text: companyProfile,
    speed: 26,
    delay: 350,
  })

  return (
    <section className="relative min-h-[520px] md:min-h-[660px] overflow-hidden bg-[#333437]">
      <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/80 via-black/55 to-[#9f2f20]/45" />
      <img
        src={profile.images.hero}
        alt={t('hero.heroImageAlt')}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute -bottom-36 right-[-8rem] z-10 hidden h-[34rem] w-[34rem] rounded-[7rem] border-[3rem] border-[#9f2f20] opacity-90 lg:block" />

      <div className="relative z-20 flex h-full items-center">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl py-16 sm:py-20">
            <div className="mb-8 inline-flex items-center gap-4 rounded bg-white px-4 py-3 shadow-lg">
              <img src={profile.images.logo || brand.logo} alt={brand.name} className="h-16 w-auto" />
              <span className="hidden text-sm font-extrabold uppercase tracking-wide text-[#9f2f20] sm:block">
                {brandTagline}
              </span>
            </div>
            <h1 className="mb-6 text-3xl font-extrabold leading-tight text-white sm:text-4xl md:text-5xl lg:text-6xl">
              {t('hero.title.main')}
              <span className="block text-[#c13a28]">{t('hero.title.highlight')}</span>
            </h1>
            <p
              className="relative mb-8 grid max-w-2xl text-base leading-7 text-gray-100 sm:text-lg sm:leading-8"
              aria-label={companyProfile}
            >
              <span className="invisible col-start-1 row-start-1" aria-hidden="true">
                {companyProfile}
              </span>
              <span className="col-start-1 row-start-1" aria-hidden="true">
                {typedCompanyProfile}
                <span className={`ml-1 inline-block h-6 w-0.5 translate-y-1 bg-gray-100 ${isTyping ? 'animate-pulse' : 'opacity-0'}`} />
              </span>
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to="/shop"
                className="inline-flex items-center justify-center rounded bg-[#9f2f20] px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#842719] sm:px-8 sm:py-3 sm:text-base"
              >
                {t('hero.cta.shopProducts')}
              </Link>
              <Link
                to="/web-profile"
                className="inline-flex items-center justify-center rounded bg-white px-6 py-2 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-100 sm:px-8 sm:py-3 sm:text-base"
              >
                {t('hero.cta.viewProfile')}
              </Link>
            </div>
            <p className="mt-8 text-base sm:text-lg font-semibold italic text-white">"{brandMantra}"</p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
