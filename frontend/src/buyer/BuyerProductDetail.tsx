import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ProductDetails from './ProductDetails'
import { Product } from '../types/index'
import { productsApi } from '../services/buyerApi'

interface BuyerProductDetailProps {
  onAddToCart?: (product: Product, quantity: number) => void
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
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProduct = async () => {
      if (!id) return
      setLoading(true)
      try {
        const data = await productsApi.getProduct(id)
        const raw = data.product || data
        const images = raw.images || raw.productImages?.map((img: any) => img.url) || []
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
        })
      } catch {
        setProduct(null)
      } finally {
        setLoading(false)
      }
    }

    loadProduct()
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
    </div>
  )
}

export default BuyerProductDetail
