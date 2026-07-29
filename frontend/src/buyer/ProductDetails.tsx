import { useState } from 'react'
import toast from 'react-hot-toast'

import { 
  ShoppingCart, 
  Heart, 
  Star, 
  Plus,
  Minus,
  Truck, 
  Shield, 
  RefreshCw,
  Check,
  Info,
  Play,
  Volume2,
  VolumeX,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  Share2,
  Download,
  X,
  Loader2
} from 'lucide-react'
import { Product } from '../types/index'
import { formatPrice } from '../utils/currency'

interface ProductDetailsProps {
  product: Product
  onAddToCart?: (product: Product, quantity: number) => Promise<void>
  onToggleWishlist?: (productId: string) => void
  isInWishlist?: boolean
}

const ProductDetails = ({ 
  product, 
  onAddToCart, 
  onToggleWishlist, 
  isInWishlist = false
}: ProductDetailsProps) => {
  const [quantity, setQuantity] = useState(1)
  const [selectedMedia, setSelectedMedia] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const [showZoom, setShowZoom] = useState(false)

  // Enhanced media data with videos and images
  const parsedImages: string[] = Array.isArray((product as any).images)
    ? ((product as any).images as string[])
    : typeof (product as any).images === 'string'
      ? (() => {
          try {
            return JSON.parse((product as any).images)
          } catch {
            return []
          }
        })()
      : product.image
        ? [product.image]
        : []

  const parsedImagesNormalized = parsedImages.filter(Boolean)
  const parsedVideos: string[] = Array.isArray((product as any).videos)
    ? (product as any).videos
    : Array.isArray((product as any).productVideos)
      ? (product as any).productVideos.map((video: any) => video.url).filter(Boolean)
      : []

  const mediaItems = [
    ...parsedImagesNormalized.map((url) => ({
      type: 'image' as const,
      url,
      thumbnail: url,
      alt: `${product.name}`
    })),
    ...parsedVideos.map((url) => ({
      type: 'video' as const,
      url,
      thumbnail: parsedImagesNormalized[0] ?? '',
      alt: `${product.name} - Product Video`
    })),
    ...(typeof (product as any).videoUrl === 'string' && (product as any).videoUrl
      ? [{
          type: 'video' as const,
          url: (product as any).videoUrl,
          thumbnail: parsedImagesNormalized[0] ?? '',
          alt: `${product.name} - Product Video`
        }]
      : [])
  ]
  const selectedItem = mediaItems[selectedMedia]

  const productUrl = typeof window === 'undefined' ? '' : window.location.href

  const downloadSelectedImage = () => {
    if (selectedItem?.type !== 'image') return
    const link = document.createElement('a')
    link.href = selectedItem.url
    link.download = `${product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'product-image'}.jpg`
    link.target = '_blank'
    link.rel = 'noopener'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Image download started')
  }

  const shareSelectedImage = async () => {
    if (selectedItem?.type !== 'image') return
    const shareData = { title: product.name, text: `Check out ${product.name} from Hincton Meat Products.`, url: productUrl }
    const copyProductLink = async () => {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(productUrl)
      } else {
        const field = document.createElement('textarea')
        field.value = productUrl
        field.style.position = 'fixed'
        field.style.opacity = '0'
        document.body.appendChild(field)
        field.select()
        document.execCommand('copy')
        document.body.removeChild(field)
      }
      toast.success('Product link copied — paste it in any app or website')
    }

    if (navigator.share) {
      try {
        try {
          const response = await fetch(selectedItem.url)
          if (!response.ok) throw new Error('Image unavailable')
          const image = await response.blob()
          const extension = image.type.split('/')[1] || 'jpg'
          const file = new File([image], `${product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'product'}.${extension}`, { type: image.type })
          if (navigator.canShare?.({ files: [file] })) {
            await navigator.share({ ...shareData, files: [file] })
            return
          }
        } catch (error) {
          if ((error as Error).name === 'AbortError') return
          // Continue with the ordinary system share sheet if file sharing is unavailable.
        }
        await navigator.share(shareData)
        return
      } catch (error) {
        if ((error as Error).name === 'AbortError') return
        // Continue with a reliable copy-and-paste fallback.
      }
    }

    try {
      await copyProductLink()
    } catch {
      toast.error('Unable to share or copy this product link')
    }
  }


  const [isAdding, setIsAdding] = useState(false)
  const [activeTab, setActiveTab] = useState<'description' | 'nutrition' | 'storage'>('description')
  const availableStock = Math.max(0, Number(product.stockQuantity || 0))
  const maxQuantity = product.inStock ? Math.max(1, availableStock) : 1

  const handleAddToCart = async () => {
    if (!product.inStock) return
    
    setIsAdding(true)
    try {
      if (onAddToCart) {
        await onAddToCart(product, quantity)
      }
    } finally {
      setIsAdding(false)
    }
  }

  const handleQuantityChange = (newQuantity: number) => {
    if (!Number.isFinite(newQuantity)) return
    const clampedQuantity = Math.min(Math.max(1, Math.floor(newQuantity)), maxQuantity)
    setQuantity(clampedQuantity)
  }

  const discountPercentage = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Enhanced Media Gallery */}
        <div className="space-y-4">
          {/* Main Media Display */}
          <div className="gravity-panel group relative aspect-square overflow-hidden rounded-[2rem] bg-gray-50 shadow-2xl shadow-stone-900/10">
            {mediaItems.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-gray-400">No media</div>
            ) : selectedItem?.type === 'image' ? (
              <img
                src={selectedItem.url}
                alt={selectedItem.alt}
                loading="eager"
                decoding="async"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                onClick={() => setShowZoom(true)}
              />
            ) : (
              <video
                src={selectedItem?.url}
                className="w-full h-full object-cover"
                controls
                muted={isMuted}
              />
            )}

            
            {/* Media Controls Overlay */}
            <div className="absolute right-4 top-4 flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              {selectedItem?.type === 'image' && (
                <>
                  <button
                    type="button"
                    onClick={shareSelectedImage}
                    className="rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
                    aria-label="Share product image"
                    title="Share image"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={downloadSelectedImage}
                    className="rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
                    aria-label="Download product image"
                    title="Download image"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </>
              )}
              {selectedItem?.type === 'video' && (

                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              )}
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            {selectedItem?.type === 'image' && (
                <button
                  onClick={() => setShowZoom(true)}
                  className="bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              )}

            </div>

            {/* Navigation Arrows */}
            <button
              onClick={() => setSelectedMedia((selectedMedia - 1 + mediaItems.length) % mediaItems.length)}
              disabled={mediaItems.length === 0}

              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white opacity-100 shadow-lg transition hover:bg-black/70 sm:opacity-0 sm:group-hover:opacity-100"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setSelectedMedia((selectedMedia + 1) % mediaItems.length)}
              disabled={mediaItems.length === 0}

              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white opacity-100 shadow-lg transition hover:bg-black/70 sm:opacity-0 sm:group-hover:opacity-100"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Media Type Badge */}
            <div className="absolute top-4 left-4">
            {selectedItem?.type === 'video' && (

                <div className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                  <Play className="w-4 h-4" />
                  Video
                </div>
              )}

            </div>
          </div>

          {/* Thumbnail Gallery */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {mediaItems.map((item, index) => (

              <button
                key={index}
                onClick={() => setSelectedMedia(index)}
                className={`h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl border-2 transition-all ${
                  selectedMedia === index ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {item.type === 'image' ? (
                  <img
                    src={item.thumbnail}
                    alt={item.alt}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="relative w-full h-full">
                    <img
                      src={item.thumbnail}
                      alt={item.alt}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                      <Play className="w-6 h-6 text-white" />
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Media Info */}
          <div className="rounded-full bg-white/70 px-4 py-2 text-center text-sm text-gray-600 shadow-sm">
            {selectedItem?.type === 'video' 
              ? 'Click play to watch product video' 
              : 'Click image to zoom in'
            }
          </div>
        </div>

        {/* Product Info */}
        <div className="gravity-panel space-y-6 rounded-[2rem] bg-white/70 p-6 sm:p-8">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold uppercase tracking-[.12em] text-red-700">{product.category}</span>
              {discountPercentage > 0 && (
                <span className="bg-red-600 text-white px-2 py-1 rounded-md text-xs font-bold">
                  -{discountPercentage}% OFF
                </span>
              )}
            </div>
            <h1 className="mb-3 text-3xl font-extrabold tracking-tight text-gray-950 sm:text-4xl">{product.name}</h1>
            
            {/* Rating */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${i < Math.floor(product.rating) 
                      ? 'fill-yellow-400 text-yellow-400' 
                      : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-gray-600">{product.rating} ({product.reviews} reviews)</span>
            </div>
          </div>

          {/* Price */}
          <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-gradient-to-r from-red-50 to-amber-50/70 px-4 py-4">
            <span className="text-3xl font-extrabold tracking-tight text-gray-950">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && (
              <span className="text-xl text-gray-500 line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
            {product.weight && (
              <span className="text-gray-600">per {product.weight}</span>
            )}
          </div>

          {/* Stock Status */}
          <div className={`flex items-center gap-2 rounded-xl px-3 py-2 ${product.inStock ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {product.inStock ? (
              <>
                <Check className="w-5 h-5 text-green-500" />
                <span className="text-green-700 font-medium">In Stock - {availableStock} available</span>
              </>
            ) : (
              <>
                <Info className="w-5 h-5 text-red-500" />
                <span className="text-red-700 font-medium">Out of Stock</span>
              </>
            )}
          </div>

          {/* Quantity and Add to Cart */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="font-medium">Quantity:</span>
              <div className="flex items-center overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <button
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={quantity <= 1}
                  className="p-2 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                  className="w-16 border-x border-gray-200 bg-transparent py-2 text-center font-bold"
                  min="1"
                  max={maxQuantity}
                />
                <button
                  onClick={() => handleQuantityChange(quantity + 1)}
                  disabled={!product.inStock || quantity >= maxQuantity}
                  className="p-2 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {product.inStock && (
                <span className="text-sm text-gray-500">Max {maxQuantity} from live stock</span>
              )}
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleAddToCart}
                disabled={!product.inStock || isAdding}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-red-600 px-6 py-3.5 font-bold text-white shadow-lg shadow-red-600/25 transition hover:-translate-y-0.5 hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {isAdding ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShoppingCart className="w-5 h-5" />}
                {isAdding ? 'Adding to Cart...' : 'Add to Cart'}
              </button>
              <button
                onClick={() => onToggleWishlist?.(product.id)}
                className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:bg-red-50"
              >
                <Heart 
                  className={`w-5 h-5 ${isInWishlist ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} 
                />
              </button>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 gap-3 border-y border-gray-200/80 py-5 sm:grid-cols-3">
            <div className="rounded-2xl bg-white/70 p-3 shadow-sm flex items-center gap-2">
              <Truck className="w-5 h-5 text-gray-600" />
              <div>
                <div className="font-medium text-sm">Free Delivery</div>
                <div className="text-xs text-gray-500">On orders over {formatPrice(6500)}</div>
              </div>
            </div>
            <div className="rounded-2xl bg-white/70 p-3 shadow-sm flex items-center gap-2">
              <Shield className="w-5 h-5 text-gray-600" />
              <div>
                <div className="font-medium text-sm">Quality Guaranteed</div>
                <div className="text-xs text-gray-500">Premium cuts</div>
              </div>
            </div>
            <div className="rounded-2xl bg-white/70 p-3 shadow-sm flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-gray-600" />
              <div>
                <div className="font-medium text-sm">Easy Returns</div>
                <div className="text-xs text-gray-500">30-day policy</div>
              </div>
            </div>
          </div>

          {/* Product Details Tabs */}
          <div className="space-y-4 rounded-2xl border border-white/80 bg-white/60 p-4 sm:p-5">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('description')}
                className={`px-4 py-2 font-medium text-sm border-b-2 ${
                  activeTab === 'description'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Description
              </button>
              <button
                onClick={() => setActiveTab('nutrition')}
                className={`px-4 py-2 font-medium text-sm border-b-2 ${
                  activeTab === 'nutrition'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Nutrition
              </button>
              <button
                onClick={() => setActiveTab('storage')}
                className={`px-4 py-2 font-medium text-sm border-b-2 ${
                  activeTab === 'storage'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Storage
              </button>
            </div>

            <div className="py-4">
              {activeTab === 'description' && (
                <div className="space-y-4">
                  <p className="text-gray-700">{product.description}</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium">Origin:</span>
                      <p className="text-gray-600">{product.origin}</p>
                    </div>
                    <div>
                      <span className="font-medium">Weight:</span>
                      <p className="text-gray-600">{product.weight}</p>
                    </div>
                  </div>
                  {product.cookingTips && (
                    <div>
                      <h4 className="font-medium mb-2">Cooking Tips:</h4>
                      <ul className="list-disc list-inside space-y-1 text-gray-600">
                        {product.cookingTips.map((tip, index) => (
                          <li key={index}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'nutrition' && product.nutritionInfo && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="gravity-card rounded-2xl bg-gray-50 p-4">
                    <span className="font-medium">Calories</span>
                    <p className="text-xl font-bold text-gray-900">{product.nutritionInfo.calories}</p>
                  </div>
                  <div className="gravity-card rounded-2xl bg-gray-50 p-4">
                    <span className="font-medium">Protein</span>
                    <p className="text-xl font-bold text-gray-900">{product.nutritionInfo.protein}g</p>
                  </div>
                  <div className="gravity-card rounded-2xl bg-gray-50 p-4">
                    <span className="font-medium">Fat</span>
                    <p className="text-xl font-bold text-gray-900">{product.nutritionInfo.fat}g</p>
                  </div>
                  <div className="gravity-card rounded-2xl bg-gray-50 p-4">
                    <span className="font-medium">Carbs</span>
                    <p className="text-xl font-bold text-gray-900">{product.nutritionInfo.carbs}g</p>
                  </div>
                </div>
              )}

              {activeTab === 'storage' && (
                <div className="space-y-4">
                  <p className="text-gray-700">{product.storage}</p>
                  <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4">
                    <h4 className="font-medium text-yellow-800 mb-2">Storage Guidelines:</h4>
                    <ul className="list-disc list-inside space-y-1 text-yellow-700">
                      <li>Refrigerate immediately upon receipt</li>
                      <li>Consume within 3-5 days of opening</li>
                      <li>Freeze for extended storage (up to 6 months)</li>
                      <li>Thaw in refrigerator, not at room temperature</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      {/* Zoom Modal */}
      {showZoom && mediaItems[selectedMedia]?.type === 'image' && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setShowZoom(false)}
        >

          <div className="relative max-w-4xl max-h-full">
            <img
              src={mediaItems[selectedMedia].url}
              alt={mediaItems[selectedMedia].alt}
              className="max-w-full max-h-full object-contain"
            />
            <button
              onClick={() => setShowZoom(false)}
              className="absolute top-4 right-4 bg-white text-black p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

export default ProductDetails
