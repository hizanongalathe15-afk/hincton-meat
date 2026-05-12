import { Link } from 'react-router-dom'
import { Award, Globe2, ShieldCheck, Snowflake } from 'lucide-react'
import { useSiteContent } from '../contexts/SiteContentContext'
import { useLanguage } from '../contexts/LanguageContext'

const AboutPage = () => {
  const { profile } = useSiteContent()
  const { t } = useLanguage()
  const brand = profile.brand

  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
        <div className="absolute right-0 top-0 hidden h-80 w-48 rounded-bl-[6rem] bg-gray-200 lg:block" />
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-red-700">{brand.tagline}</p>
            <h1 className="mt-4 text-5xl font-extrabold leading-tight text-gray-900 md:text-7xl">
              {t('about.title')}
              <span className="block text-[#9f2f20]">{t('about.company')}</span>
            </h1>
            <p className="mt-8 max-w-3xl text-xl leading-9 text-gray-700">{profile.companyProfile}</p>
          </div>
          <div className="relative">
            <div className="overflow-hidden rounded-[4rem] bg-[#9f2f20] p-5">
              <img src={profile.images.about} alt="Fresh beef cuts" className="h-[32rem] w-full rounded-[3rem] object-cover" />
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-5xl font-extrabold text-gray-900">
            {t('about.mission')}
            <span className="block text-[#9f2f20]">& {t('about.vision')}</span>
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-2">
            <div className="rounded bg-gray-50 p-8">
              <Award className="h-10 w-10 text-[#9f2f20]" />
              <h3 className="mt-6 text-3xl font-extrabold text-[#9f2f20]">{t('about.mission')}</h3>
              <p className="mt-4 text-lg leading-8 text-gray-700">
                {profile.mission}
              </p>
            </div>
            <div className="rounded bg-gray-50 p-8">
              <Globe2 className="h-10 w-10 text-[#9f2f20]" />
              <h3 className="mt-6 text-3xl font-extrabold text-[#9f2f20]">{t('about.vision')}</h3>
              <p className="mt-4 text-lg leading-8 text-gray-700">
                {profile.vision}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#333437] px-4 py-20 text-white sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-red-300">{t('about.businessMantra')}</p>
            <h2 className="mt-4 text-5xl font-extrabold">
              {brand.mantra}
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-200">
              {profile.procurementCommitment}
            </p>
          </div>
          <div className="grid gap-5">
            {profile.qualityPoints.map((point) => (
              <div key={point} className="flex gap-4 rounded bg-white/10 p-5">
                <Snowflake className="mt-1 h-6 w-6 shrink-0 text-red-300" />
                <p className="text-lg leading-7 text-gray-100">{point}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-red-700">{t('about.marketPresence')}</p>
              <h2 className="mt-4 text-5xl font-extrabold text-gray-950">{t('about.localAndInternationalReach')}</h2>
              <div className="mt-8 space-y-5">
                {profile.markets.map((market) => (
                  <div key={market} className="flex gap-4">
                    <ShieldCheck className="mt-1 h-6 w-6 shrink-0 text-[#9f2f20]" />
                    <p className="text-lg leading-8 text-gray-700">{market}</p>
                  </div>
                ))}
              </div>
              <Link to="/shop" className="mt-10 inline-flex rounded bg-[#9f2f20] px-8 py-3 font-bold text-white hover:bg-[#842719]">
                {t('about.viewProducts')}
              </Link>
            </div>
            <img src={profile.images.market} alt="Livestock suppliers" className="h-[30rem] w-full rounded object-cover" />
          </div>
        </div>
      </section>
    </div>
  )
}

export default AboutPage
