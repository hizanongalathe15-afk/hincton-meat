import React, { createContext, useContext, useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { CartItem, Product } from '../types'
import { useAuth } from './AuthContext'
import { cartApi } from '../services/buyerApi'
import { getApiErrorMessage } from '../services/api'

interface CartContextType {
  items: CartItem[]
  addItem: (product: Product, quantity: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: (askConfirmation?: boolean) => void
  getTotalItems: () => number
  getTotalPrice: () => number
  isInCart: (productId: string) => boolean
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const mapBackendCartItems = (data: any): CartItem[] => {
  return (data.cart?.items || []).map((item: any) => {
    const product = item.product || {}
    const images = product.images || []
    return {
      id: product.id,
      name: product.name,
      price: Number(product.price) || 0,
      image: images[0] || '',
      images,
      rating: 0,
      reviews: 0,
      category: product.category?.name || 'Uncategorized',
      inStock: Number(product.stockQuantity || 0) > 0,
      quantity: item.quantity,
    } as CartItem
  })
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([])
  const { user } = useAuth()

  useEffect(() => {
    let cancelled = false

    const loadCart = async () => {
      try {
        const data = await cartApi.getCart()
        if (cancelled) return
        setItems(mapBackendCartItems(data))
      } catch (error) {
        console.error('Failed to load backend cart:', error)
        setItems([])
      }
    }

    loadCart()

    return () => {
      cancelled = true
    }
  }, [user])

  const addItem = (product: Product, quantity: number) => {
    if (!product.inStock) {
      toast.error('This item is out of stock.')
      return
    }

    cartApi.addToCart({ productId: product.id, quantity })
      .then((response) => {
        toast.success(response?.message || `Added ${quantity} ${product.name} to cart.`)
        return cartApi.getCart()
      })
      .then((data) => {
        setItems(mapBackendCartItems(data))
      })
      .catch((error) => {
        console.error('Failed to save cart item:', error)
        toast.error(getApiErrorMessage(error, 'Could not save cart item.'))
      })
  }

  const removeItem = (productId: string) => {
    cartApi.getCart()
      .then((data) => {
        const item = (data.cart?.items || []).find((cartItem: any) => cartItem.productId === productId)
        if (item?.id) return cartApi.removeFromCart(item.id)
      })
      .then((response) => {
        if (response?.message) toast.success(response.message)
        return cartApi.getCart()
      })
      .then((data) => {
        setItems(mapBackendCartItems(data))
      })
      .catch((error) => {
        console.error('Failed to remove backend cart item:', error)
        toast.error(getApiErrorMessage(error, 'Could not remove cart item.'))
      })
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) {
      removeItem(productId)
      return
    }

    cartApi.getCart()
      .then((data) => {
        const item = (data.cart?.items || []).find((cartItem: any) => cartItem.productId === productId)
        if (item?.id) return cartApi.updateCartItem(item.id, quantity)
      })
      .then(() => cartApi.getCart())
      .then((data) => setItems(mapBackendCartItems(data)))
      .catch((error) => {
        console.error('Failed to update backend cart quantity:', error)
        toast.error(getApiErrorMessage(error, 'Could not update cart quantity.'))
      })
  }

  const isInCart = (productId: string) => {
    return items.some(item => item.id === productId)
  }

  const clearCart = () => {
    cartApi.clearCart()
      .then(() => {
        setItems([])
        toast.success('Cart cleared successfully.')
      })
      .catch((error) => {
        console.error('Failed to clear backend cart:', error)
        toast.error(getApiErrorMessage(error, 'Could not clear cart.'))
      })
  }

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0)
  }

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const value = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getTotalItems,
    getTotalPrice,
    isInCart,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
