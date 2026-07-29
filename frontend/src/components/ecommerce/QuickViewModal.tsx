import React, { createContext, useCallback, useContext, useMemo, useReducer, useState } from 'react'
import { X, Heart, ShoppingCart, ExternalLink, Star } from 'lucide-react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import { Product } from '../../types/product'
import { useCart } from '../../contexts/CartContext'
import { useWishlist } from '../../contexts/WishlistContext'
import { useCurrency } from '../../utils/currencyAndSeo'

type QuickViewState = {
  isOpen: boolean
  product: Product | null
}

type QuickViewAction =
  | { type: 'OPEN'; product: Product }
  | { type: 'CLOSE' }

const quickViewReducer = (state: QuickViewState, action: QuickViewAction): QuickViewState => {
  switch (action.type) {
    case 'OPEN':
      return { isOpen: true, product: action.product }
    case 'CLOSE':
      return { isOpen: false, product: null }
    default:
      return state
  }
}

type QuickViewContextValue = {
  state: QuickViewState
  open: (product: Product) => void
  close: () => void
}

const QuickViewContext = createContext<QuickViewContextValue | null>(null)

export const useQuickView = (): QuickViewContextValue => {
  const ctx = useContext(QuickViewContext)
  if (!ctx) {
    return {
      state: { isOpen: false, product: null },
      open: () => {},
      close: () => {},
    }
  }
  return ctx
}

export const QuickViewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(quickViewReducer, { isOpen: false, product: null })

  const open = useCallback((product: Product) => dispatch({ type: 'OPEN', product }), [])
  const close = useCallback(() => dispatch({ type: 'CLOSE' }), [])

  const value = useMemo(() => ({ state, open, close }), [state, open, close])

  return <QuickViewContext.Provider value={value}>{children}</QuickViewContext.Provider>
}

type QuickViewModalProps = {
  product: Product | null
  isOpen: boolean
  onClose: () => void
}

const QuickViewModal: React.FC<QuickViewModalProps> = ({ product, isOpen, onClose }) => {
  const { addItem } = useCart()
  const { toggleWishlist, isInWishlist } = useWishlist()
  const { formatPriceInline } = useCurrency()
  const [quantity, setQuantity] = useState(1)
  const [addingToCart, setAddingToCart] = useState(false)

  if (!isOpen || !product) return null

  const productImage = product.images?.[0] || product.image || '/hincton/hero-platter.webp'
  const inWishlist = isInWishlist(product.id)

  const handleAddToCart = async () => {
    setAddingToCart(true)
    try {
      await addItem(product, quantity)
    } catch (error) {
      toast.error('Failed to add item to cart')
    } finally {
      setAddingToCart(false)
    }
  }

  const handleToggleWishlist = () => {
    toggleWishlist(product.id)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-view-title"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/90 hover:bg-gray-100 text-gray-700 shadow-md transition-colors"
          aria-label="Close quick view"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 md:p-8">
          <div className="relative rounded-xl overflow-hidden bg-gray-100 aspect-square">
            <img
              src={productImage}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {!product.inStock && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <span className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg text-sm uppercase tracking-wide">
                  Out of Stock
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <div className="mb-2">
              <span className="text-xs uppercase tracking-wider text-gray-500 font-medium">
                {product.category || 'Premium Cuts'}
              </span>
            </div>
            <h2
              id="quick-view-title"
              className="text-2xl md:text-3xl font-bold text-gray-900 mb-3"
            >
              {product.name}
            </h2>

            {(product.rating > 0 || product.reviews > 0) && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(product.rating)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-500">
                  {product.rating.toFixed(1)} ({product.reviews} reviews)
                </span>
              </div>
            )}

            <div className="mb-5">
              <span className="text-3xl font-bold text-red-700">
                {formatPriceInline(product.price)}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="ml-3 text-lg text-gray-400 line-through">
                  {formatPriceInline(product.originalPrice)}
                </span>
              )}
            </div>

            <p className="text-gray-600 leading-relaxed mb-6 line-clamp-4">
              {product.description ||
                'Premium quality cut, expertly prepared and delivered fresh. Our butchers select only the finest pieces for consistent quality and flavour.'}
            </p>

            {(product.weight || product.origin || product.sku) && (
              <div className="grid grid-cols-3 gap-3 mb-6 text-sm">
                {product.weight && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <span className="block text-xs text-gray-500 mb-1">Weight</span>
                    <span className="font-semibold text-gray-800">{product.weight}</span>
                  </div>
                )}
                {product.origin && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <span className="block text-xs text-gray-500 mb-1">Origin</span>
                    <span className="font-semibold text-gray-800">{product.origin}</span>
                  </div>
                )}
                {product.sku && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <span className="block text-xs text-gray-500 mb-1">SKU</span>
                    <span className="font-semibold text-gray-800">{product.sku}</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-3 mb-6">
              <label className="text-sm font-medium text-gray-700">Qty</label>
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="px-3 py-2 text-gray-600 hover:bg-gray-50 transition-colors"
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span className="px-4 py-2 font-semibold text-gray-800 min-w-[3rem] text-center">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(q => Math.min(99, q + 1))}
                  className="px-3 py-2 text-gray-600 hover:bg-gray-50 transition-colors"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-auto">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!product.inStock || addingToCart}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-red-700 hover:bg-red-800 text-white font-semibold rounded-xl shadow-lg shadow-red-700/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {addingToCart ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ShoppingCart className="w-5 h-5" />
                )}
                Add to Cart
              </button>
              <button
                type="button"
                onClick={handleToggleWishlist}
                className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border-2 font-semibold transition-all ${
                  inWishlist
                    ? 'border-red-500 text-red-600 bg-red-50'
                    : 'border-gray-200 text-gray-700 hover:border-red-400 hover:text-red-600'
                }`}
                aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <Heart className={`w-5 h-5 ${inWishlist ? 'fill-current' : ''}`} />
                <span className="hidden sm:inline">Wishlist</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <Link
                to={`/product/${product.id}`}
                onClick={onClose}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 font-semibold rounded-xl transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                View Full Details
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-gray-700 border border-gray-200 hover:bg-gray-50 font-semibold rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export const QuickViewRoot: React.FC = () => {
  const { state, close } = useQuickView()
  return <QuickViewModal product={state.product} isOpen={state.isOpen} onClose={close} />
}

export default QuickViewModal
