import { useState } from 'react'

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


  const [isAdding, setIsAdding] = useState(false)
  const [activeTab, setActiveTab] = useState<'description' | 'nutrition' | 'storage'>('description')

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
    if (newQuantity >= 1 && newQuantity <= 99) {
      setQuantity(newQuantity)
    }
  }

  const discountPercentage = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Enhanced Media Gallery */}
        <div className="space-y-4">
          {/* Main Media Display */}
          <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-50 group">
            {mediaItems.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-gray-400">No media</div>
            ) : selectedItem?.type === 'image' ? (
              <img
                src={selectedItem.url}
                alt={selectedItem.alt}
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
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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

              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-opacity-70"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setSelectedMedia((selectedMedia + 1) % mediaItems.length)}
              disabled={mediaItems.length === 0}

              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-opacity-70"
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
                className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                  selectedMedia === index ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {item.type === 'image' ? (
                  <img
                    src={item.thumbnail}
                    alt={item.alt}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="relative w-full h-full">
                    <img
                      src={item.thumbnail}
                      alt={item.alt}
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
          <div className="text-sm text-gray-600 text-center">
            {selectedItem?.type === 'video' 
              ? 'Click play to watch product video' 
              : 'Click image to zoom in'
            }
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-gray-500 uppercase tracking-wide">{product.category}</span>
              {discountPercentage > 0 && (
                <span className="bg-red-600 text-white px-2 py-1 rounded-md text-xs font-bold">
                  -{discountPercentage}% OFF
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
            
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
          <div className="flex items-center gap-4">
            <span className="text-3xl font-bold text-gray-900">
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
          <div className="flex items-center gap-2">
            {product.inStock ? (
              <>
                <Check className="w-5 h-5 text-green-500" />
                <span className="text-green-700 font-medium">In Stock - Ready to Ship</span>
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
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => handleQuantityChange(quantity - 1)}
                  className="p-2 hover:bg-gray-100"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                  className="w-16 text-center border-x border-gray-300 py-2"
                  min="1"
                  max="99"
                />
                <button
                  onClick={() => handleQuantityChange(quantity + 1)}
                  className="p-2 hover:bg-gray-100"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleAddToCart}
                disabled={!product.inStock || isAdding}
                className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium"
              >
                {isAdding ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShoppingCart className="w-5 h-5" />}
                {isAdding ? 'Adding to Cart...' : 'Add to Cart'}
              </button>
              <button
                onClick={() => onToggleWishlist?.(product.id)}
                className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Heart 
                  className={`w-5 h-5 ${isInWishlist ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} 
                />
              </button>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4 border-y border-gray-200">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-gray-600" />
              <div>
                <div className="font-medium text-sm">Free Delivery</div>
                <div className="text-xs text-gray-500">On orders over {formatPrice(6500)}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-gray-600" />
              <div>
                <div className="font-medium text-sm">Quality Guaranteed</div>
                <div className="text-xs text-gray-500">Premium cuts</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-gray-600" />
              <div>
                <div className="font-medium text-sm">Easy Returns</div>
                <div className="text-xs text-gray-500">30-day policy</div>
              </div>
            </div>
          </div>

          {/* Product Details Tabs */}
          <div className="space-y-4">
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
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <span className="font-medium">Calories</span>
                    <p className="text-xl font-bold text-gray-900">{product.nutritionInfo.calories}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <span className="font-medium">Protein</span>
                    <p className="text-xl font-bold text-gray-900">{product.nutritionInfo.protein}g</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <span className="font-medium">Fat</span>
                    <p className="text-xl font-bold text-gray-900">{product.nutritionInfo.fat}g</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <span className="font-medium">Carbs</span>
                    <p className="text-xl font-bold text-gray-900">{product.nutritionInfo.carbs}g</p>
                  </div>
                </div>
              )}

              {activeTab === 'storage' && (
                <div className="space-y-4">
                  <p className="text-gray-700">{product.storage}</p>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
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
