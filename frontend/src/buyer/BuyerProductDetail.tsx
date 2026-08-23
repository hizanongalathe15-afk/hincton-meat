import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import ProductDetails from './ProductDetails'
import ProductCard from './ProductCard'
import { Product } from '../types/index'
import { productsApi, trackingApi } from '../services/buyerApi'
import { resolveMediaUrl } from '../services/api'

interface BuyerProductDetailProps {
  onAddToCart?: (product: Product, quantity: number) => Promise<void>
  onToggleWishlist?: (productId: string) => void
  wishlistItems?: Set<string>
}

const FALLBACK_PRODUCTS_MAP: Record<string, Product> = {
  'feat-ribeye': {
    id: 'feat-ribeye',
    name: 'Prime Ribeye Steak (Boneless)',
    price: 1400,
    originalPrice: 1600,
    image: '/hincton/beef-cuts.webp',
    images: ['/hincton/beef-cuts.webp', '/hincton/beef-fresh.webp'],
    rating: 4.9,
    reviews: 28,
    category: 'Beef Cuts',
    categorySlug: 'beef',
    inStock: true,
    stockQuantity: 45,
    description: 'Aged prime ribeye steak with deep intramuscular marbling. Cut from grass-fed Kenyan cattle, chilled under strict cold chain control.',
    weight: '1 kg',
    origin: 'Hincton Meat Products',
  },
  'feat-goat-choma': {
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
    description: 'Fresh succulent goat ribs, expertly cut and portioned for authentic charcoal Nyama Choma.',
    weight: '1 kg',
    origin: 'Hincton Meat Products',
  },
  'feat-capon-chicken': {
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
    description: 'Plump, grain-fed farm capon, dressed, cleaned, and chilled. Perfect for family roasts and stews.',
    weight: '1.2 - 1.5 kg',
    origin: 'Hincton Meat Products',
  },
  'prod-sausage-1kg': {
    id: 'prod-sausage-1kg',
    name: 'Value Pack Beef Sausages 1Kg',
    price: 700,
    image: '/hincton/hero-platter.webp',
    images: ['/hincton/hero-platter.webp'],
    rating: 4.8,
    reviews: 52,
    category: 'Sausages',
    categorySlug: 'sausages',
    inStock: true,
    stockQuantity: 100,
    description: 'Juicy, savory Kenyan beef sausages. Perfect for breakfast, pan-frying, and grilling.',
    weight: '1 kg',
    origin: 'Hincton Meat Products',
    sku: 'HMP-SAUSAGE-1KG',
  },
}

const findFallbackProduct = (productId?: string): Product | null => {
  if (!productId) return null
  if (FALLBACK_PRODUCTS_MAP[productId]) return FALLBACK_PRODUCTS_MAP[productId]
  
  // Generic fallback if matching
  return {
    id: productId,
    name: 'Fresh Premium Meat Cut',
    price: 900,
    image: '/hincton/beef-cuts.webp',
    images: ['/hincton/beef-cuts.webp', '/hincton/hero-platter.webp'],
    rating: 4.9,
    reviews: 20,
    category: 'Fresh Cuts',
    categorySlug: 'beef',
    inStock: true,
    stockQuantity: 50,
    description: 'Artisanal, freshly prepared butcher cut from Hincton Meat Products.',
    weight: '1 kg',
    origin: 'Hincton Meat Products',
  }
}

const BuyerProductDetail = ({ 
  onAddToCart, 
  onToggleWishlist,
  wishlistItems = new Set()
}: BuyerProductDetailProps) => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const routeProduct = (location.state as { product?: Product } | null)?.product
  const cachedProduct = useMemo(() => {
    if (!id || typeof window === 'undefined') return null
    try {
      return JSON.parse(window.sessionStorage.getItem(`hincton:product:${id}`) || 'null') as Product | null
    } catch {
      return null
    }
  }, [id])
  const [product, setProduct] = useState<Product | null>(routeProduct || cachedProduct || findFallbackProduct(id))
  const [recommendations, setRecommendations] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    const loadProduct = async () => {
      if (!id) return
      try {
        const data = await productsApi.getProduct(id)
        if (cancelled) return
        const raw = data.product || data
        const images = (raw.images || raw.productImages?.map((img: any) => img.url) || []).map((url: string) => resolveMediaUrl(url))
        const nextProduct = {
          id: raw.id,
          name: raw.name,
          price: Number(raw.price) || 0,
          originalPrice: raw.comparePrice ? Number(raw.comparePrice) : undefined,
          image: images[0] || '/hincton/hero-platter.webp',
          images: images.length ? images : ['/hincton/hero-platter.webp'],
          rating: Number(raw.averageRating || raw.rating || 0),
          reviews: Number(raw.reviewCount || raw.totalReviews || 0),
          category: raw.category?.name || 'Uncategorized',
          categorySlug: raw.category?.slug,
          inStock: Number(raw.stockQuantity || 0) > 0 && raw.isPublished !== false,
          stockQuantity: Number(raw.stockQuantity) || 0,
          lowStockThreshold: Number(raw.lowStockThreshold) || undefined,
          description: raw.description || raw.shortDescription || '',
          weight: [raw.weight, raw.weightUnit].filter(Boolean).join(' ') || raw.weightUnit || '1 kg',
          weightValue: Number(raw.weight) || undefined,
          weightUnit: raw.weightUnit || undefined,
          origin: raw.brand || 'Hincton Meat Products',
          sku: raw.sku,
          videos: (raw.videos || raw.productVideos?.map((video: any) => video.url) || []).map((url: string) => resolveMediaUrl(url)),
          productVideos: raw.productVideos || [],
        }
        setProduct(nextProduct)
        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem(`hincton:product:${nextProduct.id}`, JSON.stringify(nextProduct))
        }
      } catch {
        if (!cancelled && !product) {
          setProduct(findFallbackProduct(id))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadProduct()
    return () => {
      cancelled = true
    }
  }, [id, routeProduct, cachedProduct])

  useEffect(() => {
    if (!id) return
    const startedAt = Date.now()
    productsApi.trackView(id).catch(() => {})
    trackingApi.trackClick({
      linkUrl: `/product/${id}`,
      linkId: id,
      label: product?.name || 'Product detail',
      source: 'product-detail',
      medium: 'page-view',
      path: window.location.pathname,
    }).catch(() => {})

    return () => {
      productsApi.trackView(id, { duration: Math.max(1, Math.round((Date.now() - startedAt) / 1000)) }).catch(() => {})
    }
  }, [id])

  useEffect(() => {
    if (!id) return
    productsApi.getRecommendations({ productId: id, limit: 4 })
      .then((data) => {
        const next = (data.products || []).map((raw: any) => {
          const images = (raw.images || raw.productImages?.map((img: any) => img.url) || []).map((url: string) => resolveMediaUrl(url))
          return {
            id: raw.id,
            name: raw.name,
            price: Number(raw.price) || 0,
            originalPrice: raw.comparePrice ? Number(raw.comparePrice) : undefined,
            image: images[0] || '/hincton/hero-platter.webp',
            images: images.length ? images : ['/hincton/hero-platter.webp'],
            rating: Number(raw.averageRating || raw.rating || 0),
            reviews: Number(raw.reviewCount || raw.totalReviews || 0),
            category: raw.category?.name || 'Uncategorized',
            categorySlug: raw.category?.slug,
            inStock: Number(raw.stockQuantity || 0) > 0 && raw.isPublished !== false,
            stockQuantity: Number(raw.stockQuantity) || 0,
            lowStockThreshold: Number(raw.lowStockThreshold) || undefined,
            description: raw.description || raw.shortDescription || '',
            weight: [raw.weight, raw.weightUnit].filter(Boolean).join(' ') || raw.weightUnit || '',
            weightValue: Number(raw.weight) || undefined,
            weightUnit: raw.weightUnit || undefined,
            origin: raw.brand || 'Hincton Meat Products',
            sku: raw.sku,
            videos: (raw.videos || raw.productVideos?.map((video: any) => video.url) || []).map((url: string) => resolveMediaUrl(url)),
            productVideos: raw.productVideos || [],
          } as Product
        })
        setRecommendations(next)
      })
      .catch(() => setRecommendations([]))
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-red-600" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h2>
          <p className="text-gray-600 mb-6">The product you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/shop')}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Back to Shop
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="ambient-page bg-gray-50">
      <ProductDetails
          product={product}
          onAddToCart={onAddToCart}
          onToggleWishlist={onToggleWishlist}
          isInWishlist={wishlistItems.has(product.id)}
        />
      {recommendations.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-12">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="text-sm font-bold uppercase text-red-700">Recommended</p>
              <h2 className="text-2xl font-extrabold text-gray-950">You may also like</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {recommendations.map((item) => (
              <ProductCard
                key={item.id}
                product={item}
                priority={false}
                onAddToCart={onAddToCart}
                onToggleWishlist={onToggleWishlist}
                isInWishlist={wishlistItems.has(item.id)}
                onClick={() => navigate(`/product/${item.id}`, { state: { product: item } })}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default BuyerProductDetail
