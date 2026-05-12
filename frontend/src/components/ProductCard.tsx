import React from 'react'
import { Link } from 'react-router-dom'
import { ShoppingCart, Heart, Play, Star, Truck } from 'lucide-react'
import { formatCurrency } from '../utils/helpers'
import { Product } from '../types/index'
import { useLanguage } from '../contexts/LanguageContext'

interface ProductCardProps {
  product: Product
  onAddToCart?: (product: Product, quantity: number) => void
  onToggleWishlist?: (productId: string) => void
  isInWishlist?: boolean
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onToggleWishlist,
  isInWishlist = false,
}) => {
  const { t } = useLanguage()
  const { id, name, description, price, image, inStock = true } = product

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (onAddToCart && inStock) {
      onAddToCart(product, 1)
    }
  }

  return (
    <Link
      to={`/product/${id}`}
      className="group block bg-white border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-lg"
    >
      {/* Product Image */}
      <div className="relative h-64 bg-gray-100 overflow-hidden">
        {image ? (
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = 'https://images.unsplash.com/photo-1546823998-b7c00af72b9d?w=400&fit=crop'
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <span className="text-gray-400 text-4xl">Meat</span>
          </div>
        )}
        
        {/* Video Indicator */}
        <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
          <Play className="w-3 h-3" />
          Video
        </div>
        
        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            if (onToggleWishlist) {
              onToggleWishlist(id)
            }
          }}
          className="absolute top-2 right-2 bg-white text-gray-700 p-2 rounded-full hover:bg-red-50 hover:text-red-600 transition-colors shadow-md"
        >
          <Heart className={`w-4 h-4 ${isInWishlist ? 'fill-red-600 text-red-600' : ''}`} />
        </button>
        
        {/* Stock Status */}
        {!inStock && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="bg-white text-gray-900 px-4 py-2 rounded-lg font-medium">Out of Stock</span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-red-600 transition-colors">
          {name}
        </h3>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {description}
        </p>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${i < (product.rating || 4) 
                  ? 'fill-yellow-400 text-yellow-400' 
                  : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-600">
            {product.rating || 4.0} ({product.reviews || 128})
          </span>
        </div>

        {/* Free Shipping Badge */}
        <div className="flex items-center gap-2 mb-4">
          <Truck className="w-4 h-4 text-green-600" />
          <span className="text-sm text-green-600 font-medium">{t('product.freeShipping')}</span>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(price)}
          </div>
        </div>

        <button
          onClick={handleAddToCart}
          disabled={!inStock}
          className={`w-full py-3 rounded-sm font-medium transition-colors flex items-center justify-center gap-2 ${
            inStock
              ? 'bg-black text-white hover:bg-gray-800'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          {inStock ? t('product.addToCart') : t('product.outOfStock')}
        </button>
      </div>
    </Link>
  )
}

export default ProductCard
