import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Award, Beef, Globe2, Mail, MapPin, Phone, ShieldCheck, ShoppingBag, Snowflake, Truck } from 'lucide-react'
import { profileApi } from '../services/buyerApi'
import { defaultSiteProfile, SiteProfile, useSiteContent } from '../contexts/SiteContentContext'

interface WebProfileData {
  profile?: Partial<SiteProfile>
  stats?: {
    products: number
    categories: number
    featuredProducts: number
    inStockProducts: number
  }
  featuredProducts?: Array<{
    id: string
    name: string
    shortDescription?: string
    description?: string
    price: string | number
    stockQuantity: number
    category?: { name?: string; slug?: string } | null
    productImages?: Array<{ url: string; alt?: string | null }>
  }>
}

const mergeProfile = (profile?: Partial<SiteProfile>): SiteProfile => ({
  ...defaultSiteProfile,
  ...profile,
  brand: { ...defaultSiteProfile.brand, ...(profile?.brand || {}) },
  images: { ...defaultSiteProfile.images, ...(profile?.images || {}) },
  markets: profile?.markets || defaultSiteProfile.markets,
  qualityPoints: profile?.qualityPoints || defaultSiteProfile.qualityPoints,
})

const WebProfilePage = () => {
  const { profile: contextProfile } = useSiteContent()
  const [data, setData] = useState<WebProfileData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    profileApi
      .getWebProfile()
      .then((response) => {
        if (active) setData(response)
      })
      .catch(() => {
        if (active) setData(null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const profile = mergeProfile(data?.profile || contextProfile)
  const brand = profile.brand
  const stats = data?.stats || {
    products: 0,
    categories: profile.markets.length,
    featuredProducts: 0,
    inStockProducts: 0,
  }
  const featuredProducts = data?.featuredProducts || []

  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-gray-950 text-white">
        <img src={profile.images.hero} alt={`${brand.name} profile`} className="absolute inset-0 h-full w-full object-cover opacity-45" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-[#9f2f20]/55" />
        <div className="relative mx-auto grid min-h-[620px] max-w-7xl gap-12 px-4 pb-16 pt-32 sm:px-6 lg:grid-cols-[1fr_0.86fr] lg:items-center lg:px-8">
          <div>
            <div className="mb-8 inline-flex items-center gap-4 rounded bg-white px-4 py-3 text-gray-950 shadow-lg">
              <img src={profile.images.logo || brand.logo} alt={brand.name} className="h-16 w-auto" />
              <span className="hidden text-sm font-extrabold uppercase tracking-wide text-[#9f2f20] sm:block">{brand.tagline}</span>
            </div>
            <h1 className="text-5xl font-extrabold leading-tight md:text-7xl">{brand.name}</h1>
            <p className="mt-6 max-w-3xl text-xl leading-9 text-gray-100">{profile.companyProfile}</p>
            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <Link to="/shop" className="inline-flex items-center justify-center gap-2 rounded bg-[#9f2f20] px-8 py-3 font-bold text-white transition hover:bg-[#842719]">
                <ShoppingBag className="h-5 w-5" />
                Shop Products
              </Link>
              <Link to="/contact" className="inline-flex items-center justify-center gap-2 rounded bg-white px-8 py-3 font-bold text-gray-950 transition hover:bg-gray-100">
                <Mail className="h-5 w-5" />
                Contact Hincton
              </Link>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { label: 'Live products', value: stats.products, icon: Beef },
              { label: 'In stock', value: stats.inStockProducts, icon: ShieldCheck },
              { label: 'Featured', value: stats.featuredProducts, icon: Award },
              { label: 'Categories', value: stats.categories, icon: Globe2 },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div key={item.label} className="rounded bg-white/10 p-6 backdrop-blur">
                  <Icon className="h-8 w-8 text-red-300" />
                  <div className="mt-5 text-4xl font-extrabold">{loading ? '...' : item.value}</div>
                  <div className="mt-1 text-sm font-bold uppercase tracking-wide text-gray-200">{item.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-3">
          {[
            { title: 'Mission', text: profile.mission, icon: Award },
            { title: 'Vision', text: profile.vision, icon: Globe2 },
            { title: 'Procurement', text: profile.procurementCommitment, icon: Truck },
          ].map((item) => {
            const Icon = item.icon
            return (
              <article key={item.title} className="rounded bg-gray-50 p-8">
                <Icon className="h-10 w-10 text-[#9f2f20]" />
                <h2 className="mt-6 text-3xl font-extrabold text-gray-950">{item.title}</h2>
                <p className="mt-4 text-lg leading-8 text-gray-700">{item.text}</p>
              </article>
            )
          })}
        </div>
      </section>

      <section className="bg-[#333437] px-4 py-20 text-white sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-red-300">Quality profile</p>
            <h2 className="mt-4 text-5xl font-extrabold">{brand.mantra}</h2>
            <p className="mt-6 text-lg leading-8 text-gray-200">
              Cold-chain handling, responsible sourcing, and reliable dispatch support local and international buyers.
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
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-red-700">Market reach</p>
            <h2 className="mt-4 text-5xl font-extrabold text-gray-950">Local and international supply</h2>
            <div className="mt-8 space-y-5">
              {profile.markets.map((market) => (
                <div key={market} className="flex gap-4">
                  <ShieldCheck className="mt-1 h-6 w-6 shrink-0 text-[#9f2f20]" />
                  <p className="text-lg leading-8 text-gray-700">{market}</p>
                </div>
              ))}
            </div>
          </div>
          <img src={profile.images.market} alt="Hincton Meat Products market operations" className="h-[30rem] w-full rounded object-cover" />
        </div>
      </section>

      {featuredProducts.length ? (
        <section className="bg-gray-50 px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-red-700">Live catalog</p>
                <h2 className="mt-3 text-4xl font-extrabold text-gray-950">Featured products from backend</h2>
              </div>
              <Link to="/shop" className="inline-flex rounded bg-[#9f2f20] px-7 py-3 font-bold text-white hover:bg-[#842719]">
                View full shop
              </Link>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {featuredProducts.map((product) => (
                <Link key={product.id} to={`/product/${product.id}`} className="group overflow-hidden rounded bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                  <div className="aspect-[4/3] overflow-hidden bg-gray-200">
                    <img
                      src={product.productImages?.[0]?.url || '/hincton/beef-cuts.jpg'}
                      alt={product.productImages?.[0]?.alt || product.name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-6">
                    <p className="text-sm font-bold uppercase tracking-wide text-red-700">{product.category?.name || 'Hincton product'}</p>
                    <h3 className="mt-2 text-2xl font-extrabold text-gray-950">{product.name}</h3>
                    <p className="mt-3 line-clamp-2 text-gray-600">{product.shortDescription || product.description || 'Fresh Hincton Meat Products catalog item.'}</p>
                    <div className="mt-5 flex items-center justify-between font-bold">
                      <span className="text-[#9f2f20]">KES {Number(product.price).toLocaleString()}</span>
                      <span className="text-sm text-gray-500">{product.stockQuantity} available</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 rounded bg-gray-950 p-8 text-white md:grid-cols-3">
          <a href={brand.phoneHref} className="flex items-center gap-4 rounded bg-white/10 p-5 hover:bg-white/15">
            <Phone className="h-7 w-7 text-red-300" />
            <span>{brand.phone}</span>
          </a>
          <a href={brand.emailHref} className="flex items-center gap-4 rounded bg-white/10 p-5 hover:bg-white/15">
            <Mail className="h-7 w-7 text-red-300" />
            <span>{brand.email}</span>
          </a>
          <div className="flex items-center gap-4 rounded bg-white/10 p-5">
            <MapPin className="h-7 w-7 shrink-0 text-red-300" />
            <span>{brand.address}</span>
          </div>
        </div>
      </section>
    </div>
  )
}

export default WebProfilePage
