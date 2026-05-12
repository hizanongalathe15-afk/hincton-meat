import React, { createContext, useContext, useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from './AuthContext'
import { wishlistApi } from '../services/buyerApi'


interface WishlistContextType {
  items: Set<string>
  addToWishlist: (productId: string) => void
  removeFromWishlist: (productId: string) => void
  toggleWishlist: (productId: string) => void
  isInWishlist: (productId: string) => boolean
  clearWishlist: () => void
  getWishlistCount: () => number
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

export const useWishlist = () => {
  const context = useContext(WishlistContext)
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider')
  }
  return context
}

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<Set<string>>(new Set())
  const { user } = useAuth()
  const storageKey = user ? `wishlist:${user.id}` : 'wishlist:guest'

  useEffect(() => {
    let cancelled = false

    const loadUserWishlist = async () => {
      if (!user) return false
      try {
        const data = await wishlistApi.getWishlist()
        if (cancelled) return true
        setItems(new Set((data.wishlistItems || []).map((item: any) => item.productId)))
        return true
      } catch (error) {
        console.error('Failed to load backend wishlist:', error)
        return false
      }
    }

    loadUserWishlist().then((loadedFromApi) => {
      if (cancelled || loadedFromApi) return
      const savedWishlist = localStorage.getItem(storageKey)
      if (savedWishlist) {
        try {
          const wishlistArray = JSON.parse(savedWishlist)
          setItems(new Set(wishlistArray))
        } catch (error) {
          localStorage.removeItem(storageKey)
          setItems(new Set())
        }
      } else {
        setItems(new Set())
      }
    })

    return () => {
      cancelled = true
    }
  }, [storageKey, user])

  useEffect(() => {
    if (user) return
    const savedWishlist = localStorage.getItem(storageKey)
    if (savedWishlist) {
      try {
        const wishlistArray = JSON.parse(savedWishlist)
        setItems(new Set(wishlistArray))
      } catch (error) {
        localStorage.removeItem(storageKey)
        setItems(new Set())
      }
    } else {
      setItems(new Set())
    }
  }, [storageKey, user])

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(Array.from(items)))
  }, [items, storageKey])

  const addToWishlist = (productId: string) => {
    setItems(prevItems => {
      const newItems = new Set(prevItems)
      if (newItems.has(productId)) {
        toast.error('Item is already in wishlist')
        return prevItems
      }
      newItems.add(productId)
      toast.success('Item added to wishlist')
      return newItems
    })

    if (user) {
      wishlistApi.addToWishlist(productId).catch((error) => {
        console.error('Failed to sync wishlist item:', error)
        toast.error('Wishlist saved locally, but backend sync failed')
      })
    }
  }

  const removeFromWishlist = (productId: string) => {
    setItems(prevItems => {
      const newItems = new Set(prevItems)
      newItems.delete(productId)
      toast.success('Item removed from wishlist')
      return newItems
    })

    if (user) {
      wishlistApi.removeFromWishlist(productId).catch((error) => {
        console.error('Failed to sync wishlist removal:', error)
      })
    }
  }

  const toggleWishlist = (productId: string) => {
    if (items.has(productId)) {
      removeFromWishlist(productId)
    } else {
      addToWishlist(productId)
    }
  }

  const isInWishlist = (productId: string) => {
    return items.has(productId)
  }

  const clearWishlist = () => {
    setItems(new Set())
    toast.success('Wishlist cleared')
  }

  const getWishlistCount = () => {
    return items.size
  }

  const value = {
    items,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    isInWishlist,
    clearWishlist,
    getWishlistCount,
  }

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}
