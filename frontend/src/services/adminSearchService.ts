import { api } from './api'
import { formatPrice } from '../utils/currency'

export interface SearchResult {
  id: string
  type: 'product' | 'order' | 'user'
  title: string
  subtitle?: string
  icon?: string
  data: any
}

export interface SearchSuggestion {
  text: string
  type: 'product' | 'order' | 'user'
  count?: number
}

const SEARCH_HISTORY_KEY = 'admin_search_history'
const MAX_HISTORY_ITEMS = 10

export const adminSearchService = {
  // Fetch search suggestions from API
  async getSearchSuggestions(query: string): Promise<SearchSuggestion[]> {
    if (!query || query.length < 2) return []
    
    try {
      const response = await api.get('/search/autocomplete', {
        params: { query, limit: 8 }
      })
      return response.data.data || []
    } catch (error) {
      console.error('Error fetching suggestions:', error)
      return []
    }
  },

  // Perform actual search across products, orders, users
  async performSearch(query: string): Promise<SearchResult[]> {
    if (!query || query.length < 2) return []
    
    try {
      const [productsRes, ordersRes, usersRes] = await Promise.allSettled([
        api.get('/search/products', { params: { query, limit: 5 } }),
        api.get('/orders', { params: { search: query, limit: 5 } }).catch(() => ({ data: { data: [] } })),
        api.get('/users', { params: { search: query, limit: 5 } }).catch(() => ({ data: { data: [] } }))
      ])

      const results: SearchResult[] = []

      // Process products
      if (productsRes.status === 'fulfilled') {
        const products = productsRes.value.data.data || []
        products.forEach((product: any) => {
          results.push({
            id: product.id,
            type: 'product',
            title: product.name,
            subtitle: formatPrice(Number(product.price) || 0),
            data: product
          })
        })
      }

      // Process orders
      if (ordersRes.status === 'fulfilled') {
        const orders = ordersRes.value.data.data || []
        orders.forEach((order: any) => {
          results.push({
            id: order.id,
            type: 'order',
            title: `Order #${order.orderNumber || order.id.slice(0, 8)}`,
            subtitle: formatPrice(Number(order.total) || 0),
            data: order
          })
        })
      }

      // Process users
      if (usersRes.status === 'fulfilled') {
        const users = usersRes.value.data.data || []
        users.forEach((user: any) => {
          results.push({
            id: user.id,
            type: 'user',
            title: user.email,
            subtitle: user.phone || 'No phone',
            data: user
          })
        })
      }

      // Save to history
      if (results.length > 0) {
        this.saveSearchHistory(query)
      }

      return results
    } catch (error) {
      console.error('Error performing search:', error)
      return []
    }
  },

  // Get search history
  getSearchHistory(): string[] {
    try {
      const history = localStorage.getItem(SEARCH_HISTORY_KEY)
      return history ? JSON.parse(history) : []
    } catch {
      return []
    }
  },

  // Save search query to history
  saveSearchHistory(query: string): void {
    try {
      let history = this.getSearchHistory()
      
      // Remove duplicate if exists
      history = history.filter(item => item.toLowerCase() !== query.toLowerCase())
      
      // Add to beginning
      history.unshift(query)
      
      // Keep only last 10
      history = history.slice(0, MAX_HISTORY_ITEMS)
      
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history))
    } catch (error) {
      console.error('Error saving search history:', error)
    }
  },

  // Clear all search history
  clearSearchHistory(): void {
    try {
      localStorage.removeItem(SEARCH_HISTORY_KEY)
    } catch (error) {
      console.error('Error clearing search history:', error)
    }
  },

  // Remove single item from history
  removeFromHistory(query: string): void {
    try {
      let history = this.getSearchHistory()
      history = history.filter(item => item !== query)
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history))
    } catch (error) {
      console.error('Error removing from history:', error)
    }
  }
}
