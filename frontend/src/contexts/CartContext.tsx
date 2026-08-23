import React, { createContext, useContext, useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { CartItem, Product } from '../types'
import { useAuth } from './AuthContext'
import { cartApi } from '../services/buyerApi'

interface CartContextType {
  items: CartItem[]
  reminder: {
    type: string
    message: string
    productIds?: string[]
  } | null
  addItem: (product: Product, quantity: number) => Promise<void>
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: (askConfirmation?: boolean) => void
  getTotalItems: () => number
  getTotalPrice: () => number
  isInCart: (productId: string) => boolean
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const LOCAL_CART_KEY = 'hincton:local-cart:v2'

const readLocalCart = (): CartItem[] => {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(LOCAL_CART_KEY)
    return raw ? (JSON.parse(raw) as CartItem[]) : []
  } catch {
    return []
  }
}

const writeLocalCart = (items: CartItem[]) => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(items))
  } catch {
    // Ignore storage quota
  }
}

const mapBackendCartItems = (data: any): CartItem[] => {
  return (data.cart?.items || []).map((item: any) => {
    const product = item.product || {}
    const images = product.images || (product.productImages?.map((img: any) => img.url)) || []
    return {
      id: product.id || item.productId,
      name: product.name || 'Meat Item',
      price: Number(product.price) || 0,
      image: images[0] || '/hincton/hero-platter.webp',
      images,
      rating: Number(product.averageRating || 5),
      reviews: Number(product.reviewCount || 0),
      category: product.category?.name || 'Fresh Meat',
      inStock: Number(product.stockQuantity ?? 10) > 0,
      quantity: item.quantity,
      weight: product.weight ? `${product.weight} ${product.weightUnit || 'kg'}` : product.weightUnit || '1 kg',
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
  const [items, setItems] = useState<CartItem[]>(() => readLocalCart())
  const [reminder, setReminder] = useState<CartContextType['reminder']>(null)
  const { user } = useAuth()

  // Save to local storage whenever items change
  useEffect(() => {
    writeLocalCart(items)
  }, [items])

  useEffect(() => {
    let cancelled = false

    const loadCart = async () => {
      try {
        const data = await cartApi.getCart()
        if (cancelled) return
        const backendItems = mapBackendCartItems(data)
        if (backendItems.length > 0) {
          setItems(backendItems)
        }
        setReminder(data.cart?.reminder || null)
      } catch (error) {
        // Keep existing local cart items without breaking user experience
      }
    }

    loadCart()

    return () => {
      cancelled = true
    }
  }, [user])

  const addItem = async (product: Product, quantity: number): Promise<void> => {
    if (!product.inStock && (product.stockQuantity ?? 1) <= 0) {
      toast.error('This cut is currently out of stock.')
      return
    }

    // Optimistic local update
    setItems((current) => {
      const existing = current.find((i) => i.id === product.id)
      if (existing) {
        return current.map((i) => (i.id === product.id ? { ...i, quantity: i.quantity + quantity } : i))
      }
      const newItem: CartItem = {
        id: product.id,
        name: product.name,
        price: Number(product.price) || 0,
        image: product.image || product.images?.[0] || '/hincton/hero-platter.webp',
        images: product.images || [product.image],
        rating: product.rating || 5,
        reviews: product.reviews || 0,
        category: product.category || 'Fresh Meat',
        inStock: true,
        quantity,
        weight: product.weight || '1 kg',
      }
      return [...current, newItem]
    })

    toast.success(`Added ${quantity} × ${product.name} to cart`)

    // Background sync with backend
    cartApi.addToCart({ productId: product.id, quantity }).catch(() => {
      // Backend will sync on next cart fetch
    })
  }

  const removeItem = (productId: string) => {
    // Optimistic removal
    setItems((current) => current.filter((item) => item.id !== productId))
    toast.success('Item removed from cart.')

    cartApi.getCart()
      .then((data) => {
        const item = (data.cart?.items || []).find((cartItem: any) => cartItem.productId === productId || cartItem.product?.id === productId)
        if (item?.id) return cartApi.removeFromCart(item.id)
      })
      .catch(() => {})
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) {
      removeItem(productId)
      return
    }

    // Optimistic quantity update
    setItems((current) =>
      current.map((item) => (item.id === productId ? { ...item, quantity } : item))
    )

    cartApi.getCart()
      .then((data) => {
        const item = (data.cart?.items || []).find((cartItem: any) => cartItem.productId === productId || cartItem.product?.id === productId)
        if (item?.id) return cartApi.updateCartItem(item.id, quantity)
      })
      .catch(() => {})
  }

  const isInCart = (productId: string) => {
    return items.some((item) => item.id === productId)
  }

  const clearCart = (askConfirmation = false) => {
    void askConfirmation
    setItems([])
    setReminder(null)
    writeLocalCart([])
    cartApi.clearCart().catch(() => {})
  }

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0)
  }

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const value = {
    items,
    reminder,
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
