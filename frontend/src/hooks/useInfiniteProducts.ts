import { useState, useCallback, useEffect } from 'react'
import { productsApi } from '../services/buyerApi'

interface UseInfiniteProductsOptions {
  category?: string
  search?: string
  sortBy?: string
  minPrice?: number
  maxPrice?: number
  initialLimit?: number
}

export const useInfiniteProducts = (options: UseInfiniteProductsOptions = {}) => {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [error, setError] = useState<string | null>(null)

  const {
    category,
    search,
    sortBy = 'createdAt',
    minPrice,
    maxPrice,
    initialLimit = 20
  } = options

  const loadProducts = useCallback(async (pageNum: number, isRefresh = false) => {
    if (loading) return
    
    setLoading(true)
    setError(null)

    try {
      const response = await productsApi.getProducts({
        page: pageNum,
        limit: initialLimit,
        category,
        search,
        sortBy,
        minPrice,
        maxPrice
      })

      const newProducts = response.products || []
      
      if (isRefresh) {
        setProducts(newProducts)
        setPage(2)
      } else {
        setProducts(prev => [...prev, ...newProducts])
        setPage(pageNum + 1)
      }

      setHasMore(newProducts.length === initialLimit)
    } catch (err) {
      setError('Failed to load products')
      console.error('Products loading error:', err)
    } finally {
      setLoading(false)
    }
  }, [category, search, sortBy, minPrice, maxPrice, initialLimit, loading])

  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      loadProducts(page)
    }
  }, [hasMore, loading, page, loadProducts])

  const refresh = useCallback(() => {
    setProducts([])
    setHasMore(true)
    setPage(1)
    loadProducts(1, true)
  }, [loadProducts])

  // Initial load and refresh on filter changes
  useEffect(() => {
    refresh()
  }, [category, search, sortBy, minPrice, maxPrice])

  return {
    products,
    loading,
    hasMore,
    error,
    loadMore,
    refresh
  }
}
