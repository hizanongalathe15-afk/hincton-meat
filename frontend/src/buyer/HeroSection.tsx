import { Link } from 'react-router-dom'
import { useSiteContent } from '../contexts/SiteContentContext'
import { useTypewriter } from '../utils/animations'

interface HeroSectionProps {
  onSearch?: (query: string) => void
}

const HeroSection = ({ onSearch }: HeroSectionProps) => {
  void onSearch
  const { profile } = useSiteContent()
  const brand = profile.brand
  const { text: typedCompanyProfile, isTyping } = useTypewriter({
    text: profile.companyProfile,
    speed: 26,
    delay: 350,
  })

  return (
    <section className="relative min-h-[660px] overflow-hidden bg-[#333437]">
      <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/80 via-black/55 to-[#9f2f20]/45" />
      <img
        src={profile.images.hero}
        alt="Fresh Hincton Meat Products selection"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute -bottom-36 right-[-8rem] z-10 hidden h-[34rem] w-[34rem] rounded-[7rem] border-[3rem] border-[#9f2f20] opacity-90 lg:block" />

      <div className="relative z-20 flex h-full items-center">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl py-24">
            <div className="mb-8 inline-flex items-center gap-4 rounded bg-white px-4 py-3 shadow-lg">
              <img src={profile.images.logo || brand.logo} alt={brand.name} className="h-16 w-auto" />
              <span className="hidden text-sm font-extrabold uppercase tracking-wide text-[#9f2f20] sm:block">
                {brand.tagline}
              </span>
            </div>
            <h1 className="mb-6 text-5xl font-extrabold leading-tight text-white md:text-7xl">
              Only
              <span className="block text-[#c13a28]">Fresh Meat</span>
            </h1>
            <p
              className="relative mb-8 grid max-w-2xl text-xl leading-8 text-gray-100"
              aria-label={profile.companyProfile}
            >
              <span className="invisible col-start-1 row-start-1" aria-hidden="true">
                {profile.companyProfile}
              </span>
              <span className="col-start-1 row-start-1" aria-hidden="true">
                {typedCompanyProfile}
                <span className={`ml-1 inline-block h-6 w-0.5 translate-y-1 bg-gray-100 ${isTyping ? 'animate-pulse' : 'opacity-0'}`} />
              </span>
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                to="/shop"
                className="inline-flex items-center justify-center rounded bg-[#9f2f20] px-8 py-3 font-semibold text-white transition-colors hover:bg-[#842719]"
              >
                Shop Products
              </Link>
              <Link
                to="/web-profile"
                className="inline-flex items-center justify-center rounded bg-white px-8 py-3 font-semibold text-gray-900 transition-colors hover:bg-gray-100"
              >
                View Profile
              </Link>
            </div>
            <p className="mt-10 text-lg font-semibold italic text-white">"{brand.mantra}"</p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
