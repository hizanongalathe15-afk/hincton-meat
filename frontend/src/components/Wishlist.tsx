import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Heart, ShoppingCart, Trash2, Star } from 'lucide-react'

import toast from 'react-hot-toast'
import '../styles/glassmorphism.css'
import { useLanguage } from '../contexts/LanguageContext'

interface WishlistItem {
  id: string
  product: {
    id: string
    name: string
    price: number
    images: string[]
    reviews: { rating: number }[]
  }
  createdAt: string
}

const Wishlist: React.FC = () => {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const { t } = useLanguage()


  useEffect(() => {
    fetchWishlist()
  }, [])

  const fetchWishlist = async () => {
    try {
      const response = await fetch('/api/wishlist', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setWishlistItems(data.wishlistItems)
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const removeFromWishlist = async (productId: string) => {
    try {
      const response = await fetch(`/api/wishlist/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        setWishlistItems(prev => prev.filter(item => item.product.id !== productId))
        toast.success('Item removed from wishlist')
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error)
      toast.error('Failed to remove item')
    }
  }

  const moveToCart = async (productIds: string[]) => {
    setMovingIds(productIds)
    try {
      const response = await fetch('/api/wishlist/move-to-cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ productIds })
      })

      if (response.ok) {
        const data = await response.json()
        setWishlistItems(prev => prev.filter(item => !productIds.includes(item.product.id)))
        setSelectedItems([])
        toast.success(`${data.itemsMoved} items moved to cart`)
      }
    } catch (error) {
      console.error('Error moving to cart:', error)
      toast.error('Failed to move items to cart')
    } finally {
      setMovingIds([])
    }
  }

  const toggleItemSelection = (productId: string) => {
    setSelectedItems(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  const selectAllItems = () => {
    setSelectedItems(wishlistItems.map(item => item.product.id))
  }

  const clearSelection = () => {
    setSelectedItems([])
  }

  const calculateAverageRating = (reviews: { rating: number }[]) => {
    if (reviews.length === 0) return 0
    return reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('wishlist.myWishlist')}</h1>
          <p className="text-gray-600">
            {t('wishlist.itemsInWishlist').replace('{count}', wishlistItems.length.toString())}
          </p>
        </div>

        {/* Bulk Actions */}
        {wishlistItems.length > 0 && (
          <div className="glass-card p-4 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <input
                  type="checkbox"
                  checked={selectedItems.length === wishlistItems.length}
                  onChange={selectedItems.length === wishlistItems.length ? clearSelection : selectAllItems}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">
                  {selectedItems.length > 0 && t('wishlist.selected').replace('{count}', selectedItems.length.toString())}
                </span>
              </div>
              
              <div className="flex items-center space-x-3">
                {selectedItems.length > 0 && (
                  <>
                    <button
                      onClick={() => moveToCart(selectedItems)}
                      disabled={movingIds.length > 0}
                      className="glass-button px-4 py-2 text-sm font-medium text-primary-600 rounded-lg hover:bg-primary-50 flex items-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {movingIds.length > 0 ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        <ShoppingCart className="w-4 h-4" />
                      )}
                      <span>{t('wishlist.moveToCart').replace('{count}', selectedItems.length.toString())}</span>
                    </button>
                    <button
                      onClick={clearSelection}
                      className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
                    >
                      {t('wishlist.clearSelection')}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Wishlist Items */}
        {wishlistItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="glass-card p-8 max-w-md mx-auto">
              <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t('wishlist.empty')}</h3>
              <p className="text-gray-600 mb-6">
                {t('wishlist.emptyDescription')}
              </p>
              <Link
                to="/shop"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                <span>{t('wishlist.startShopping')}</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlistItems.map((item) => (
              <div key={item.id} className="glass-card p-4 hover:shadow-xl transition-shadow duration-300">
                {/* Product Image */}
                <div className="relative mb-4">
                  <Link to={`/product/${item.product.id}`}>
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </Link>
                  
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.product.id)}
                    onChange={() => toggleItemSelection(item.product.id)}
                    className="absolute top-2 left-2 w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                  
                  {/* Remove Button */}
                  <button
                    onClick={() => removeFromWishlist(item.product.id)}
                    className="absolute top-2 right-2 p-2 glass-button rounded-full hover:bg-red-500 hover:text-white transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Product Info */}
                <div className="space-y-2">
                  <Link to={`/product/${item.product.id}`}>
                    <h3 className="font-medium text-gray-900 hover:text-primary-600 transition-colors line-clamp-2">
                      {item.product.name}
                    </h3>
                  </Link>
                  
                  {/* Rating */}
                  <div className="flex items-center space-x-1">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(calculateAverageRating(item.product.reviews))
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">
                      ({item.product.reviews.length})
                    </span>
                  </div>

                  {/* Price */}
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-primary-600">
                      KSH {item.product.price.toLocaleString()}
                    </span>
                    
                    {/* Quick Actions */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => moveToCart([item.product.id])}
                        disabled={movingIds.length > 0}
                        className="p-2 glass-button rounded-full hover:bg-primary-500 hover:text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        title="Add to Cart"
                      >
                        {movingIds.includes(item.product.id) ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : (
                          <ShoppingCart className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Wishlist
