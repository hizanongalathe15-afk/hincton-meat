import React, { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Flame, Loader2 } from 'lucide-react'
import { useQuery } from 'react-query'
import ProductCard from '../buyer/ProductCard'
import { productService } from '../services/productService'
import { Product } from '../types'
import { useLanguage } from '../contexts/LanguageContext'

interface DealsSectionProps {
  className?: string
  onAddToCart?: (product: Product, quantity: number) => Promise<void>
  onToggleWishlist?: (productId: string) => void
  wishlistIds?: Set<string>
}

const DealsSection: React.FC<DealsSectionProps> = ({
  className = '',
  onAddToCart,
  onToggleWishlist,
  wishlistIds,
}) => {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const impressionReported = useRef<Set<string>>(new Set())
  const { data: banners = [], isLoading, isError } = useQuery(
    ['activeDealBanners'],
    productService.getActiveDealBanners,
    { staleTime: 60_000, refetchOnMount: 'always' as any, retry: 1 }
  )

  // Report an impression (once per banner per render) the moment it arrives
  useEffect(() => {
    if (!banners || banners.length === 0) return
    banners.forEach((banner: any) => {
      if (banner && banner.id && !impressionReported.current.has(banner.id)) {
        impressionReported.current.add(banner.id)
        productService.trackDealBannerEvent(banner.id, 'impression', 1)
      }
    })
  }, [banners])

  if (isError || (!isLoading && banners.length === 0)) {
    return null
  }

  return (
    <section className={`w-full space-y-10 ${className}`}>
      {isLoading && (
        <div className="flex justify-center py-14">
          <Loader2 className="h-8 w-8 animate-spin text-red-600" />
        </div>
      )}

      {!isLoading &&
        banners.map((banner: any, bi: number) => {
          if (!banner || !Array.isArray(banner.products) || banner.products.length === 0) {
            return null
          }
          const bannerColor = banner.bannerColor || '#FF5500'
          const textColor = banner.textColor || '#FFFFFF'
          const products: Product[] = banner.products.map((p: any) => ({
            ...p,
            image: p.image || p.images?.[0] || '',
            images: Array.isArray(p.images) && p.images.length ? p.images : p.image ? [p.image] : [],
            videos: p.videos || [],
            rating: Number(p.rating || 0),
            reviews: Number(p.reviews || 0),
            category: p.category || '',
            inStock: Boolean(p.inStock),
          }))

          const onClickSeeAll = () => {
            if (banner.id) productService.trackDealBannerEvent(banner.id, 'click', 1)
            if (banner.seeAllUrl) {
              navigate(banner.seeAllUrl)
            } else if (banner.categorySlug) {
              navigate(`/shop?category=${encodeURIComponent(banner.categorySlug)}`)
            } else {
              navigate('/shop')
            }
          }

          return (
            <div
              key={banner.id || bi}
              className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm"
            >
              {/* Coloured Banner Header */}
              <header
                className="relative flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8 sm:py-5"
                style={{ background: bannerColor, color: textColor }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
                    style={{ background: `color-mix(in srgb, ${textColor} 18%, transparent)` }}
                  >
                    <Flame className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg sm:text-xl font-bold truncate">{banner.title}</h2>
                    {banner.subtitle && (
                      <p
                        className="text-sm mt-0.5 truncate"
                        style={{ color: `color-mix(in srgb, ${textColor} 85%, transparent)` }}
                      >
                        {banner.subtitle}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={onClickSeeAll}
                  className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition hover:brightness-110 active:scale-[0.98]"
                  style={{
                    background: `color-mix(in srgb, ${textColor} 100%, ${bannerColor})`,
                    color: bannerColor,
                  }}
                >
                  {banner.seeAllLabel || (typeof t === 'function' ? t('common.seeAll') : null) || 'See All'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </header>

              {/* Product grid */}
              <div className="p-4 sm:p-6">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                  {products.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={onAddToCart}
                      onToggleWishlist={onToggleWishlist}
                      isInWishlist={wishlistIds?.has(product.id)}
                      onClick={() => {
                        if (banner.id) productService.trackDealBannerEvent(banner.id, 'click', 1)
                        navigate(`/product/${product.slug || product.id}`)
                      }}
                      priority={bi < 1}
                    />
                  ))}
                </div>
              </div>
            </div>
          )
        })}
    </section>
  )
}

export default DealsSection
