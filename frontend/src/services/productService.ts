import api from './api'
import { Product, CreateProductData, UpdateProductData, ProductFilters, ProductResponse } from '../types/product'

export const productService = {
  async getProducts(filters?: ProductFilters): Promise<ProductResponse> {
    const params = new URLSearchParams()
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString())
        }
      })
    }

    const response = await api.get(`/products?${params.toString()}`)
    return response.data
  },

  async getProduct(id: string): Promise<Product> {
    const response = await api.get(`/products/${id}`)
    return response.data.product
  },

  async createProduct(productData: CreateProductData): Promise<Product> {
    const response = await api.post('/products', productData)
    return response.data.product
  },

  async updateProduct(id: string, productData: UpdateProductData): Promise<Product> {
    const response = await api.put(`/products/${id}`, productData)
    return response.data.product
  },

  async deleteProduct(id: string): Promise<void> {
    await api.delete(`/products/${id}`)
  },

  async getFeaturedProducts(): Promise<Product[]> {
    const response = await api.get('/products/featured')
    return response.data.products
  },

  async getProductsByCategory(category: string): Promise<Product[]> {
    const response = await api.get(`/products/category/${category}`)
    return response.data.products
  },

  async updateStock(id: string, stockQuantity: number, inStock: boolean): Promise<Product> {
    const response = await api.patch(`/products/${id}/stock`, {
      stockQuantity,
      inStock,
    })
    return response.data.product
  },

  async searchProducts(query: string, filters?: ProductFilters): Promise<ProductResponse> {
    const params = new URLSearchParams()
    params.append('q', query)
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && key !== 'search') {
          params.append(key, value.toString())
        }
      })
    }

    const response = await api.get(`/products/search?${params.toString()}`)
    return response.data
  },

  async getActiveDealBanners(): Promise<Array<{
    id: string
    title: string
    subtitle?: string
    bannerColor: string
    textColor: string
    bannerImage?: string
    seeAllUrl?: string
    seeAllLabel?: string
    products: Product[]
  }>> {
    const response = await api.get('/deal-banners/active')
    return response.data.banners || []
  },

  async trackDealBannerEvent(id: string, event: 'click' | 'impression', increment = 1) {
    try {
      await api.post(`/deal-banners/${id}/track`, { event, increment })
    } catch {
      // tracking is best-effort, never break the UI
    }
  },
}
