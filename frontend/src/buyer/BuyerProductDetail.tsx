import { useEffect, useState } from 'react'
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

const BuyerProductDetail = ({ 
  onAddToCart, 
  onToggleWishlist,
  wishlistItems = new Set()
}: BuyerProductDetailProps) => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const routeProduct = (location.state as { product?: Product } | null)?.product
  const [product, setProduct] = useState<Product | null>(routeProduct || null)
  const [recommendations, setRecommendations] = useState<Product[]>([])
  const [loading, setLoading] = useState(!routeProduct)

  useEffect(() => {
    const loadProduct = async () => {
      if (!id) return
      setLoading(!routeProduct)
      try {
        const data = await productsApi.getProduct(id)
        const raw = data.product || data
        const images = (raw.images || raw.productImages?.map((img: any) => img.url) || []).map((url: string) => resolveMediaUrl(url))
        setProduct({
          id: raw.id,
          name: raw.name,
          price: Number(raw.price) || 0,
          originalPrice: raw.comparePrice ? Number(raw.comparePrice) : undefined,
          image: images[0] || '/hincton/hero-platter.jpg',
          images: images.length ? images : ['/hincton/hero-platter.jpg'],
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
        })
      } catch {
        setProduct(null)
      } finally {
        setLoading(false)
      }
    }

    loadProduct()
  }, [id, routeProduct])

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
            image: images[0] || '/hincton/hero-platter.jpg',
            images: images.length ? images : ['/hincton/hero-platter.jpg'],
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
    <div className="bg-gray-50">
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
              <h2 className="text-2xl font-extrabold text-gray-950">Customers also consider</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {recommendations.map((item) => (
              <ProductCard
                key={item.id}
                product={item}
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
