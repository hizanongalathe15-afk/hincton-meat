import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef, useMemo } from 'react'
import { Award, ChevronLeft, ChevronRight, Globe2, Shield, Snowflake, Truck } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import HeroSection from './HeroSection'
import MeatCutsGuide from '../components/ecommerce/MeatCutsGuide'
import ButcherRecipes from '../components/ecommerce/ButcherRecipes'
import PhotoReviewsProvenanceSection from '../components/ecommerce/PhotoReviewsProvenanceSection'
import LoyaltyReferralSection from '../components/ecommerce/LoyaltyReferralSection'
import SplitLayoutContainer from '../components/Layout/SplitLayoutContainer'
import SmartwatchCompactView from '../components/Layout/SmartwatchCompactView'
import { useLayoutSplit } from '../contexts/LayoutSplitContext'
import { Product } from '../types/index'
import { productsApi as api, trackingApi, photoReviewsApi, meatGuideApi } from '../services/buyerApi'
import { resolveMediaUrl } from '../services/api'
import { useLanguage } from '../contexts/LanguageContext'
import { useSiteContent } from '../contexts/SiteContentContext'
import { HINCTON_BRAND, HINCTON_MARKETS, HINCTON_PRODUCTS } from '../utils/hinctonBrand'

interface BuyerHomeProps {
  onProductClick?: (product: Product) => void
  onAddToCart?: (product: Product, quantity: number) => Promise<void>
  onToggleWishlist?: (productId: string) => void
  wishlistItems?: Set<string>
}

const DEFAULT_FEATURED_PRODUCTS: Product[] = [
  {
    id: 'feat-ribeye',
    name: 'Prime Ribeye Steak (Boneless)',
    price: 1400,
    originalPrice: 1600,
    image: '/hincton/beef-cuts.webp',
    images: ['/hincton/beef-cuts.webp'],
    rating: 4.9,
    reviews: 28,
    category: 'Beef Cuts',
    categorySlug: 'beef',
    inStock: true,
    stockQuantity: 45,
    description: 'Thick cut, rich marbling, aged to tender perfection. Ideal for grilling and pan-searing.',
    weight: '1 kg',
    origin: 'Hincton Meat Products',
  },
  {
    id: 'feat-goat-choma',
    name: 'Mbuzi Choma Ribs (Selected Cuts)',
    price: 900,
    image: '/hincton/goat-meat.webp',
    images: ['/hincton/goat-meat.webp'],
    rating: 4.8,
    reviews: 42,
    category: 'Goat / Mbuzi',
    categorySlug: 'goat',
    inStock: true,
    stockQuantity: 60,
    description: 'Fresh succulent goat ribs, expertly prepared for authentic Kenyan nyama choma.',
    weight: '1 kg',
    origin: 'Hincton Meat Products',
  },
  {
    id: 'feat-capon-chicken',
    name: 'Farm Fresh Dressed Capon',
    price: 450,
    image: '/hincton/chicken.webp',
    images: ['/hincton/chicken.webp'],
    rating: 4.9,
    reviews: 35,
    category: 'Capon',
    categorySlug: 'chicken',
    inStock: true,
    stockQuantity: 50,
    description: 'Plump, naturally raised farm chicken, cleaned and ready for roast or stew.',
    weight: '1.2 - 1.5 kg',
    origin: 'Hincton Meat Products',
  },
]

const BuyerHome = ({
  onProductClick: _onProductClick,
  onAddToCart,
  onToggleWishlist: _onToggleWishlist,
  wishlistItems: _wishlistItems = new Set(),
}: BuyerHomeProps) => {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { profile } = useSiteContent()
  const localizedMarkets = profile.markets.join('|') === HINCTON_MARKETS.join('|')
    ? HINCTON_MARKETS.map((_, index) => t(`buyerHome.markets.${index}`))
    : profile.markets
  const brandMantra = profile.brand.mantra === HINCTON_BRAND.mantra ? t('brand.mantra') : profile.brand.mantra
  const [_products, setProducts] = useState<Product[]>(DEFAULT_FEATURED_PRODUCTS)
  const [categories, setCategories] = useState<any[]>([])
  const [productTiles, setProductTiles] = useState<any[]>([])
  const reduceMotion = useReducedMotion()
  const topProductScrollerRef = useRef<HTMLDivElement>(null)
  const bottomProductScrollerRef = useRef<HTMLDivElement>(null)
  const [preloadedReviews, setPreloadedReviews] = useState<any[] | null>(null)
  const [preloadedGuideCategories, setPreloadedGuideCategories] = useState<any[] | null>(null)

  const localizedFallbackCategories = useMemo(
    () =>
      HINCTON_PRODUCTS.map((category) => ({
        ...category,
        name: t(`category.${category.category}.name`) || category.name,
        description:
          t(`category.${category.category}.description`) || category.description,
        cta: t('about.viewProducts'),
      })),
    [t],
  )

  useEffect(() => {
    let cancelled = false
    const fetchData = async () => {
      try {
        // Fetch featured products and all products with retry safety
        const [productsData, allProductsData, categoriesData, reviewsData, guideData] = await Promise.all([
          api.getFeaturedProducts().catch(() => ({ products: [] })),
          api.getProducts({ limit: 12 }).catch(() => ({ products: [] })),
          api.getCategories().catch(() => ({ categories: [] })),
          photoReviewsApi.list(12).catch(() => ({ reviews: [] })),
          meatGuideApi.getGuide().catch(() => ({ categories: [] })),
        ])

        if (cancelled) return
        
        // Transform API data to component format
        const transformedProducts = (productsData.products || []).slice(0, 3).map((product: any) => ({
          id: product.id,
          name: product.name,
          price: Number(product.price) || 0,
          originalPrice: product.comparePrice ? Number(product.comparePrice) : undefined,
          image: resolveMediaUrl(product.productImages?.[0]?.url) || '/hincton/hero-platter.webp',
          images: product.productImages?.map((img: any) => resolveMediaUrl(img.url)) || ['/hincton/hero-platter.webp'],
          rating: Number(product.averageRating || 4.8),
          reviews: Number(product.reviewCount || 12),
          category: product.category?.name || t('category.uncategorized'),
          categorySlug: product.category?.slug || product.categoryId || product.category?.id,
          inStock: product.stockQuantity > 0,
          stockQuantity: Number(product.stockQuantity) || 0,
          lowStockThreshold: Number(product.lowStockThreshold) || undefined,
          description: product.description || '',
          weight: [product.weight, product.weightUnit].filter(Boolean).join(' ') || product.weightUnit || '1 kg',
          weightValue: Number(product.weight) || undefined,
          weightUnit: product.weightUnit || undefined,
          origin: product.brand || 'Hincton Meat Products',
        }))
        
        if (transformedProducts.length > 0) {
          setProducts(transformedProducts)
        }

        const backendProductTiles = (allProductsData.products || []).map((product: any) => ({
          name: product.name,
          category: product.category?.slug || product.categoryId || product.category?.id || '',
          description: product.shortDescription || product.description || product.category?.name || t('buyerHome.products.fallbackProductDescription'),
          image: resolveMediaUrl(product.productImages?.[0]?.url || product.images?.[0]) || '/hincton/hero-platter.webp',
          href: `/product/${product.id}`,
          cta: t('buyerHome.products.viewProduct'),
        }))

        if (backendProductTiles.length > 0) {
          setProductTiles(backendProductTiles)
        }

        const transformedCategories = (categoriesData.categories || []).slice(0, 6).map((category: any) => ({
          name: category.name,
          category: category.slug || category.id,
          description: category.description || '',
          image: category.image || '/hincton/hero-platter.webp',
        }))
        
        setCategories(transformedCategories.length ? transformedCategories : localizedFallbackCategories)

        // Preload photo reviews & meat guide so those sections render instantly
        setPreloadedReviews(reviewsData.reviews || [])
        setPreloadedGuideCategories(guideData.categories || [])
      } catch (error) {
        // Retain default products & fallback categories gracefully
        setCategories(localizedFallbackCategories)
      }
    }

    fetchData()
    return () => {
      cancelled = true
    }
  }, [localizedFallbackCategories, t])

  const features = useMemo(
    () => [
      {
        icon: Award,
        title: t('buyerHome.features.freshMeat.title'),
        description: t('buyerHome.features.freshMeat.description'),
      },
      {
        icon: Truck,
        title: t('buyerHome.features.efficientDispatch.title'),
        description: t('buyerHome.features.efficientDispatch.description'),
      },
      {
        icon: Shield,
        title: t('buyerHome.features.foodSafety.title'),
        description: t('buyerHome.features.foodSafety.description'),
      },
      {
        icon: Snowflake,
        title: t('buyerHome.features.coldChain.title'),
        description: t('buyerHome.features.coldChain.description'),
      },
    ],
    [t],
  )

  const handleSearch = (query: string) => {
    const params = new URLSearchParams()
    if (query.trim()) {
      params.set('q', query.trim())
    }
    navigate(`/shop${params.toString() ? `?${params.toString()}` : ''}`)
  }

  const scrollProductTiles = (row: 'top' | 'bottom', direction: 'left' | 'right') => {
    const scroller = row === 'top' ? topProductScrollerRef.current : bottomProductScrollerRef.current
    if (!scroller) return
    scroller.scrollBy({
      left: direction === 'left' ? -scroller.clientWidth * 0.85 : scroller.clientWidth * 0.85,
      behavior: 'smooth',
    })
  }

  const displayedTiles = productTiles.length
    ? productTiles
    : categories.map((category: any) => ({
        ...category,
        href: `/shop?category=${category.category}`,
        cta: t('about.viewProducts'),
      }))
  const topProductTiles = displayedTiles.filter((_, index) => index % 2 === 0)
  const bottomProductTiles = displayedTiles.filter((_, index) => index % 2 === 1)
  const reveal = {
    initial: reduceMotion ? false : { opacity: 0, y: 34 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.18 },
    transition: { duration: 0.7 },
  }

  const { isWatchMode } = useLayoutSplit()

  return (
    <div className="ambient-page bg-[var(--site-page,#ffffff)]">
      <SplitLayoutContainer>
        <HeroSection onSearch={handleSearch} />

      <section className="gravity-panel border-y border-stone-200/70 bg-white/75 py-5">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-5 text-center sm:grid-cols-3 sm:px-8">
          {[
            ['Freshness first', 'Prepared with careful cold-chain handling.'],
            ['Clear ordering', 'Browse, save favourites, and track your order.'],
            ['Account control', 'Manage addresses, alerts, devices, and preferences.'],
          ].map(([title, description]) => (
            <div key={title} className="px-4 sm:border-r sm:border-stone-200 last:border-0">
              <p className="font-semibold text-stone-900">{title}</p>
              <p className="mt-1 text-sm text-stone-500">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <motion.section {...reveal} className="relative bg-[#f6f4f1]/75 py-16">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <motion.div key={feature.title} whileHover={reduceMotion ? undefined : { y: -7 }} className="group text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-red-700 shadow-[0_12px_30px_rgba(34,25,21,.08)] transition-transform duration-300 group-hover:rotate-3">
                  <Icon className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-gray-950">{feature.title}</h3>
                <p className="text-sm leading-6 text-gray-600">{feature.description}</p>
              </motion.div>
            )
          })}
        </div>
      </motion.section>

      <motion.section {...reveal} id="products" className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="text-center md:text-left">
              <p className="text-sm font-bold uppercase tracking-wide text-red-700">{t('buyerHome.products.offered')}</p>
              <h2 className="mt-3 text-4xl font-extrabold text-gray-950">{t('buyerHome.products.title')}</h2>
              <p className="mt-4 text-lg text-gray-600">
                {productTiles.length
                  ? t('buyerHome.products.descriptionAdmin')
                  : t('buyerHome.products.descriptionFallback')}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {(['top', 'bottom'] as const).map((row) => (
                <div key={row} className="flex items-center justify-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wide text-gray-500">{t(`buyerHome.products.row.${row}`)}</span>
                  <button
                    type="button"
                    onClick={() => scrollProductTiles(row, 'left')}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-800 shadow-sm transition hover:border-red-500 hover:text-red-700"
                    aria-label={t('buyerHome.products.scrollLeft').replace('{row}', t(`buyerHome.products.row.${row}`))}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollProductTiles(row, 'right')}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-800 shadow-sm transition hover:border-red-500 hover:text-red-700"
                    aria-label={t('buyerHome.products.scrollRight').replace('{row}', t(`buyerHome.products.row.${row}`))}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6" aria-label={productTiles.length ? t('buyerHome.products.productsAria') : t('buyerHome.products.categoriesAria')}>
            {[
              { ref: topProductScrollerRef, tiles: topProductTiles, label: t('buyerHome.products.upperRow') },
              { ref: bottomProductScrollerRef, tiles: bottomProductTiles, label: t('buyerHome.products.lowerRow') },
            ].map((row) => (
              <div
                key={row.label}
                ref={row.ref}
                className="-mx-4 flex gap-5 overflow-x-auto scroll-smooth px-4 pb-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
                aria-label={row.label}
              >
                {row.tiles.map((category: any) => (
                  <Link
                    key={`${row.label}-${category.href}-${category.name}`}
                    to={category.href}
                    onClick={() => trackingApi.trackClick({
                      linkUrl: category.href,
                      linkId: category.category || category.href,
                      label: category.name,
                      source: 'home',
                      medium: productTiles.length ? 'product-tile' : 'category-tile',
                      path: window.location.pathname,
                    }).catch(() => {})}
                    className="group block w-[82vw] shrink-0 sm:w-[24rem] lg:w-[30rem]"
                  >
                    <div className="relative mb-4 aspect-[4/3] overflow-hidden rounded-2xl shadow-[0_18px_45px_rgba(31,24,20,.18)]">
                      <img
                        src={category.image}
                        alt={category.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                        <h3 className="mb-1 text-2xl font-bold">{category.name}</h3>
                        <p className="text-sm text-gray-200">{category.description}</p>
                      </div>
                    </div>
                    <span className="block rounded-xl bg-[#262321] py-3 text-center font-bold text-white transition-colors group-hover:bg-red-700">
                      {category.cta}
                    </span>
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.section {...reveal} className="bg-white py-24">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-red-700">{t('buyerHome.marketPresence')}</p>
            <h2 className="mt-3 text-4xl font-extrabold text-gray-950">{t('buyerHome.marketPresenceTitle')}</h2>
            <div className="mt-8 space-y-5">
              {localizedMarkets.map((market) => (
                <div key={market} className="flex gap-3 text-lg leading-8 text-gray-700">
                  <Globe2 className="mt-1 h-6 w-6 shrink-0 text-red-700" />
                  <p>{market}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="overflow-hidden rounded-3xl bg-gray-950 shadow-[0_24px_70px_rgba(35,24,20,.2)]">
            <img src={profile.images.market} alt={t('buyerHome.marketImageAlt')} className="h-72 w-full object-cover opacity-90" />
            <div className="p-8">
              <h3 className="text-3xl font-extrabold text-white">{t('buyerHome.procurementTitle')}</h3>
              <p className="mt-4 text-lg leading-8 text-gray-200">
                {t('buyerHome.procurementDescription')}
              </p>
            </div>
          </div>
        </div>
      </motion.section>

        {/* What Our Customers Cooked Photo Reviews & Farmer Provenance */}
        <PhotoReviewsProvenanceSection preloadedReviews={preloadedReviews} />

        {/* Master Butcher Meat Cuts Guide */}
        <MeatCutsGuide preloadedCategories={preloadedGuideCategories} />

        {/* Culinary Inspiration & 1-Click Recipe Butcher Packs */}
        <ButcherRecipes onAddToCart={onAddToCart} />

        {/* Loyalty Points & Referral Rewards */}
        <LoyaltyReferralSection />

        <motion.section {...reveal} className="relative isolate overflow-hidden bg-[#242220] py-24">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-red-600/30 blur-3xl" aria-hidden="true" />
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-4xl font-extrabold text-white">{brandMantra}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-red-100">
              {t('buyerHome.orderPrompt')}
            </p>
            <Link
              to="/shop"
              className="mt-8 inline-flex rounded-lg bg-white px-10 py-4 text-lg font-bold text-red-600 transition hover:bg-gray-100"
            >
              {t('buyerHome.startShopping')}
            </Link>
          </div>
        </motion.section>
      </SplitLayoutContainer>

      {isWatchMode && <SmartwatchCompactView />}
    </div>
  )
}

export default BuyerHome
