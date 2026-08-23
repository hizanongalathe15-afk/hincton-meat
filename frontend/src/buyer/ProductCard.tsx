import { useState, useRef, useCallback } from 'react'
import type { MouseEvent } from 'react'
import { ShoppingCart, Heart, Star, Plus, Minus, MessageCircle, Loader2 } from 'lucide-react'
import { Product } from '../types/index'
import { formatPrice } from '../utils/currency'
import { useSiteContent } from '../contexts/SiteContentContext'
import { useLanguage } from '../contexts/LanguageContext'
import { motion, useReducedMotion } from 'framer-motion'

interface ProductCardProps {
  product: Product
  onAddToCart?: (product: Product, quantity: number) => Promise<void>
  onToggleWishlist?: (productId: string) => void
  isInWishlist?: boolean
  className?: string
  onClick?: () => void
  priority?: boolean
}

const ProductCard = ({ 
  product, 
  onAddToCart, 
  onToggleWishlist, 
  isInWishlist = false,
  className = '',
  onClick,
  priority = false
}: ProductCardProps) => {
  const { profile } = useSiteContent()
  const { t } = useLanguage()
  const reduceMotion = useReducedMotion()
  const cardRef = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 })
  const [quantity, setQuantity] = useState(1)
  const baseWeight = product.weightValue || Number.parseFloat(String(product.weight || '1')) || 1
  const baseUnit = product.weightUnit || (String(product.weight || '').toLowerCase().includes('g') ? 'g' : 'kg')
  const formatWeightLabel = (multiplier: number) => {
    if (baseUnit === 'pcs') return `${multiplier} ${multiplier === 1 ? 'pc' : 'pcs'}`

    const normalizedUnit = baseUnit.toLowerCase()
    const grams = normalizedUnit === 'g' ? baseWeight * multiplier : baseWeight * multiplier * 1000
    if (grams >= 1000) {
      const kg = grams / 1000
      return `${Number.isInteger(kg) ? kg : kg.toFixed(2).replace(/\.?0+$/, '')} kg`
    }
    return `${Math.round(grams)} g`
  }
  const packMultipliers = baseUnit === 'pcs' ? [1, 2, 5] : [1, 2, 5, 10]
  const weightOptions = packMultipliers.map((multiplier) => ({
    label: formatWeightLabel(multiplier),
    multiplier,
  }))
  const [selectedWeight, setSelectedWeight] = useState(weightOptions[0])
  const [isAdding, setIsAdding] = useState(false)
  const fallbackImage = 'https://images.unsplash.com/photo-1546823998-b7c00af72b9d?w=600&h=600&fit=crop'

  const handleAddToCart = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    if (!product.inStock || isAdding) return

    setIsAdding(true)
    try {
      if (onAddToCart) {
        await onAddToCart({ ...product, weight: selectedWeight.label }, quantity * selectedWeight.multiplier)
      }
    } finally {
      setIsAdding(false)
    }
  }

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= 99) {
      setQuantity(newQuantity)
    }
  }

  const discountPercentage = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0
  const lowStockThreshold = product.lowStockThreshold || 10
  const isLowStock = product.inStock && typeof product.stockQuantity === 'number' && product.stockQuantity > 0 && product.stockQuantity <= lowStockThreshold
  const whatsappDigits = (profile.brand.phoneHref || profile.brand.phone || '').replace(/\D/g, '')
  const whatsappPhone = whatsappDigits.startsWith('254') ? whatsappDigits : whatsappDigits.startsWith('0') ? `254${whatsappDigits.slice(1)}` : whatsappDigits
  const whatsappHref = whatsappPhone
    ? `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(t('product.whatsappMessage').replace('{brand}', profile.brand.name).replace('{product}', product.name))}`
    : ''

  const handleMouseMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (reduceMotion) return
    const card = cardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = (e.clientX - cx) / (rect.width / 2)
    const dy = (e.clientY - cy) / (rect.height / 2)
    setTilt({ rotateX: -dy * 6, rotateY: dx * 6 })
  }, [reduceMotion])

  const handleMouseLeave = useCallback(() => {
    setTilt({ rotateX: 0, rotateY: 0 })
  }, [])

  return (
    <motion.div
        ref={cardRef}
        style={{ rotateX: tilt.rotateX, rotateY: tilt.rotateY, transformStyle: 'preserve-3d' }}
        transition={{ type: 'spring', stiffness: 280, damping: 22 }}
        className={`glass-panel group overflow-hidden rounded-3xl border border-white/70 bg-white/85 shadow-sm hover:-translate-y-1 hover:shadow-xl ${onClick ? 'cursor-pointer' : ''} ${className}`}
        onClick={onClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
      {/* Product Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <img
          src={product.image}
          alt={product.name}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding="async"
          onError={(event) => {
            event.currentTarget.src = fallbackImage
          }}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-2">
          {discountPercentage > 0 && (
            <span className="bg-red-600 text-white px-2 py-1 rounded-md text-xs font-bold">
              -{discountPercentage}%
            </span>
          )}
          {!product.inStock && (
            <span className="bg-gray-800 text-white px-2 py-1 rounded-md text-xs font-bold">
              {t('product.outOfStock')}
            </span>
          )}
          {isLowStock && (
            <span className="bg-red-700 text-white px-2 py-1 rounded-md text-xs font-bold">
              {t('product.onlyLeft').replace('{count}', String(product.stockQuantity || 0))}
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={(event) => {
            event.stopPropagation()
            onToggleWishlist?.(product.id)
          }}
          className="absolute right-3 top-3 rounded-full bg-white/95 p-2 text-gray-700 shadow-md transition hover:bg-white hover:text-red-600"
          aria-label={t('product.toggleWishlist')}
        >
          <Heart 
            className={`w-4 h-4 ${isInWishlist ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} 
          />
        </button>

        {/* Quick Add Controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 transition-opacity group-hover:opacity-100">
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-md bg-white">
              <button
                onClick={(event) => {
                  event.stopPropagation()
                  handleQuantityChange(quantity - 1)
                }}
                className="p-2 hover:bg-gray-100"
                aria-label={t('product.decreaseQuantity')}
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="min-w-8 px-2 text-center text-sm font-bold">{quantity}</span>
              <button
                onClick={(event) => {
                  event.stopPropagation()
                  handleQuantityChange(quantity + 1)
                }}
                className="p-2 hover:bg-gray-100"
                aria-label={t('product.increaseQuantity')}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={!product.inStock || isAdding}
              className="glass-button flex flex-1 items-center justify-center gap-2 bg-red-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
              {isAdding ? t('product.adding') : t('product.add')}
            </button>
          </div>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <div className="mb-2">
          <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold uppercase text-red-700">{product.category}</span>
        </div>
        
        <h3 className="mb-2 line-clamp-2 min-h-[2.75rem] text-base font-bold leading-snug text-gray-950 transition-colors group-hover:text-red-700">
          {product.name}
        </h3>

        {product.weight && (
          <p className="mb-3 text-sm text-gray-600">{product.weight} {product.origin ? `- ${product.origin}` : ''}</p>
        )}

        <label className="mb-3 block text-xs font-bold uppercase text-gray-500" onClick={(event) => event.stopPropagation()}>
          {t('product.weight')}
          <div className="mt-2 rounded-md border border-gray-200 bg-gray-50 p-3">
            <div className="mb-2 flex items-center justify-between text-sm normal-case text-gray-900">
              <span>{selectedWeight.label}</span>
              <span>{selectedWeight.multiplier} x {formatPrice(product.price)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {weightOptions.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => setSelectedWeight(option)}
                  className={`rounded-md border px-2 py-2 text-xs font-bold transition ${
                    selectedWeight.label === option.label
                      ? 'border-red-600 bg-red-600 text-white'
                      : 'border-gray-200 bg-white text-gray-800 hover:border-red-300 hover:bg-red-50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </label>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${i < Math.floor(product.rating) 
                  ? 'fill-yellow-400 text-yellow-400' 
                  : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-600">
            {product.rating} ({product.reviews})
          </span>
        </div>

        {/* Price */}
        <div className="border-t border-gray-100 pt-4">
          <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
            <div>
              <span className="block text-[11px] font-bold uppercase tracking-wide text-gray-500">{t('product.now')}</span>
              <span className="text-xl font-extrabold text-gray-950">
                {formatPrice(product.price * selectedWeight.multiplier)}
              </span>
            </div>
            {product.originalPrice && product.originalPrice > product.price && (
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wide text-gray-500">{t('product.before')}</span>
                <span className="text-sm font-semibold text-gray-500 line-through">
                  {formatPrice(product.originalPrice * selectedWeight.multiplier)}
                </span>
              </div>
            )}
          </div>
        </div>
        {whatsappHref && (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            onClick={(event) => event.stopPropagation()}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm font-bold text-green-700 hover:bg-green-100"
          >
            <MessageCircle className="h-4 w-4" />
            {t('product.whatsappHelp')}
          </a>
        )}
      </div>
    </motion.div>
  )
}

export default ProductCard
