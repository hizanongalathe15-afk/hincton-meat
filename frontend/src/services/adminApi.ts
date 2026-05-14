import axios from 'axios'
import { API_TIMEOUT_MS, API_URL, getApiErrorMessage } from './api'

const API_BASE_URL = API_URL

// Create axios instance with auth
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth interceptor
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }

    return Promise.reject(new Error(getApiErrorMessage(error)))
  }
)

// Dashboard API
export const dashboardApi = {
  getOverview: async () => {
    const response = await apiClient.get('/admin/dashboard')
    return response.data
  },

  getSalesAnalytics: async (period = '30') => {
    const response = await apiClient.get(`/admin/analytics/sales?period=${period}`)
    return response.data
  },

  getProductAnalytics: async () => {
    const response = await apiClient.get('/admin/analytics/products')
    return response.data
  }
}

// Orders API
export const ordersApi = {
  getOrders: async (params?: {
    page?: number
    limit?: number
    status?: string
    search?: string
    dateFrom?: string
    dateTo?: string
  }) => {
    const response = await apiClient.get('/admin/orders', { params })
    return response.data
  },

  getOrder: async (id: string) => {
    const response = await apiClient.get(`/admin/orders/${id}`)
    return response.data
  },

  updateOrderStatus: async (id: string, data: {
    status: string
    notes?: string
    trackingNumber?: string
    courier?: string
  }) => {
    const response = await apiClient.put(`/admin/orders/${id}/status`, data)
    return response.data
  }
}

// Products API
export const productsApi = {
  getProducts: async (params?: {
    page?: number
    limit?: number
    search?: string
    category?: string
    status?: string
  }) => {
    const response = await apiClient.get('/admin/products', { params })
    return response.data
  },

  getProduct: async (id: string) => {
    const response = await apiClient.get(`/admin/products/${id}`)
    return response.data
  },

  createProduct: async (data: any) => {
    const response = await apiClient.post('/admin/products', data, data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined)
    return response.data
  },

  updateProduct: async (id: string, data: any) => {
    const response = await apiClient.put(`/admin/products/${id}`, data, data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined)
    return response.data
  },

  deleteProduct: async (id: string) => {
    const response = await apiClient.delete(`/admin/products/${id}`)
    return response.data
  }
}

// Customers API
export const customersApi = {
  getCustomers: async (params?: {
    page?: number
    limit?: number
    search?: string
  }) => {
    const response = await apiClient.get('/admin/customers', { params })
    return response.data
  },

  getCustomer: async (id: string) => {
    const response = await apiClient.get(`/admin/customers/${id}`)
    return response.data
  }
}

// Content Management API
export const contentApi = {
  // Banners
  getBanners: async () => {
    const response = await apiClient.get('/admin/content/banners')
    return response.data
  },

  createBanner: async (data: any) => {
    const response = await apiClient.post('/admin/content/banners', data)
    return response.data
  },

  updateBanner: async (id: string, data: any) => {
    const response = await apiClient.put(`/admin/content/banners/${id}`, data)
    return response.data
  },

  deleteBanner: async (id: string) => {
    const response = await apiClient.delete(`/admin/content/banners/${id}`)
    return response.data
  },

  // Blog
  getBlogPosts: async (params?: {
    page?: number
    limit?: number
    status?: string
    search?: string
  }) => {
    const response = await apiClient.get('/admin/content/blog', { params })
    return response.data
  },

  createBlogPost: async (data: any) => {
    const response = await apiClient.post('/admin/content/blog', data)
    return response.data
  },

  updateBlogPost: async (id: string, data: any) => {
    const response = await apiClient.put(`/admin/content/blog/${id}`, data)
    return response.data
  },

  deleteBlogPost: async (id: string) => {
    const response = await apiClient.delete(`/admin/content/blog/${id}`)
    return response.data
  },

  // Categories
  getCategories: async () => {
    const response = await apiClient.get('/admin/content/categories')
    return response.data
  },

  createCategory: async (data: any) => {
    const response = await apiClient.post('/admin/content/categories', data)
    return response.data
  },

  updateCategory: async (id: string, data: any) => {
    const response = await apiClient.put(`/admin/content/categories/${id}`, data)
    return response.data
  },

  deleteCategory: async (id: string) => {
    const response = await apiClient.delete(`/admin/content/categories/${id}`)
    return response.data
  },

  // Navigation
  getNavigation: async () => {
    const response = await apiClient.get('/admin/content/navigation')
    return response.data
  },

  createNavigationItem: async (data: any) => {
    const response = await apiClient.post('/admin/content/navigation', data)
    return response.data
  },

  updateNavigationItem: async (id: string, data: any) => {
    const response = await apiClient.put(`/admin/content/navigation/${id}`, data)
    return response.data
  },

  getSiteProfile: async () => {
    const response = await apiClient.get('/admin/content/site-profile')
    return response.data
  },

  updateSiteProfile: async (data: any) => {
    const response = await apiClient.put('/admin/content/site-profile', data)
    return response.data
  },

  uploadContentImage: async (file: File) => {
    const data = new FormData()
    data.append('image', file)
    const response = await apiClient.post('/admin/content/uploads', data, { headers: { 'Content-Type': 'multipart/form-data' } })
    return response.data
  }
}

// Settings API
export const settingsApi = {
  getSettings: async () => {
    const response = await apiClient.get('/admin/settings')
    return response.data
  },

  updateSetting: async (key: string, value: string) => {
    const response = await apiClient.put(`/admin/settings/${key}`, { value })
    return response.data
  },

  createSetting: async (data: any) => {
    const response = await apiClient.post('/admin/settings', data)
    return response.data
  }
}

// Notifications API
export const notificationsApi = {
  getNotifications: async (params?: {
    page?: number
    limit?: number
    unread?: boolean
  }) => {
    const response = await apiClient.get('/admin/notifications', { params })
    return response.data
  },

  markAsRead: async (id: string) => {
    const response = await apiClient.put(`/admin/notifications/${id}/read`)
    return response.data
  },

  markAllAsRead: async () => {
    const response = await apiClient.put('/admin/notifications/mark-all-read')
    return response.data
  },

  deleteNotification: async (id: string) => {
    const response = await apiClient.delete(`/admin/notifications/${id}`)
    return response.data
  }
}

// Users Management API
export const usersApi = {
  getUsers: async (params?: {
    page?: number
    limit?: number
    search?: string
    role?: string
  }) => {
    const response = await apiClient.get('/admin/users', { params })
    return response.data
  },

  getUser: async (id: string) => {
    const response = await apiClient.get(`/admin/users/${id}`)
    return response.data
  },

  updateUserStatus: async (id: string, data: {
    action: 'activate' | 'deactivate' | 'lock' | 'unlock' | 'verify_email' | 'verify_phone'
  }) => {
    const response = await apiClient.put(`/admin/users/${id}/status`, data)
    return response.data
  }
}

// System Metrics API
export const systemApi = {
  getMetrics: async () => {
    const response = await apiClient.get('/admin/system/metrics')
    return response.data
  },

  getHealth: async () => {
    const response = await apiClient.get('/admin/system/health')
    return response.data
  },

  getWakeTime: async () => {
    const response = await apiClient.get('/admin/system/wake-time')
    return response.data  },

  getAdminSessions: async () => {
    const response = await apiClient.get('/user-sessions/admin/realtime')
    return response.data  }
}

// QR Codes API
export const qrCodesApi = {
  getQRCodes: async () => {
    const response = await apiClient.get('/admin/qr-codes')
    return response.data
  },

  createQRCode: async (data: any) => {
    const response = await apiClient.post('/admin/qr-codes', data)
    return response.data
  },

  deleteQRCode: async (id: string) => {
    const response = await apiClient.delete(`/admin/qr-codes/${id}`)
    return response.data
  }
}

// Analytics API
export const analyticsApi = {
  getDashboardStats: async () => {
    const response = await apiClient.get('/analytics/dashboard')
    return response.data
  },

  getSalesAnalytics: async (period = '30') => {
    const response = await apiClient.get(`/analytics/sales?period=${period}`)
    return response.data
  },

  getProductAnalytics: async () => {
    const response = await apiClient.get('/analytics/products')
    return response.data
  },

  getCustomerAnalytics: async () => {
    const response = await apiClient.get('/analytics/customers')
    return response.data
  },

  getOrderAnalytics: async () => {
    const response = await apiClient.get('/analytics/orders')
    return response.data
  }
}

// Ad Management API
export const adsApi = {
  getPlacements: async (page = 1, limit = 50) => {
    const response = await apiClient.get(`/ads/placements?page=${page}&limit=${limit}`)
    return response.data
  },

  getCampaigns: async (page = 1, limit = 50) => {
    const response = await apiClient.get(`/ads/campaigns?page=${page}&limit=${limit}`)
    return response.data
  },

  getAnalytics: async (period = '30') => {
    const response = await apiClient.get(`/ads/analytics?period=${period}`)
    return response.data
  },

  createPlacement: async (data: any) => {
    const response = await apiClient.post('/ads/placements', data)
    return response.data
  },

  createCampaign: async (data: any) => {
    const response = await apiClient.post('/ads/campaigns', data)
    return response.data
  },

  updatePlacement: async (id: string, data: any) => {
    const response = await apiClient.put(`/ads/placements/${id}`, data)
    return response.data
  },

  updateCampaign: async (id: string, data: any) => {
    const response = await apiClient.put(`/ads/campaigns/${id}`, data)
    return response.data
  },

  deletePlacement: async (id: string) => {
    const response = await apiClient.delete(`/ads/placements/${id}`)
    return response.data
  },

  deleteCampaign: async (id: string) => {
    const response = await apiClient.delete(`/ads/campaigns/${id}`)
    return response.data
  },

  uploadMedia: async (file: File) => {
    const data = new FormData()
    data.append('media', file)
    const response = await apiClient.post('/ads/upload-media', data, { headers: { 'Content-Type': 'multipart/form-data' } })
    return response.data
  }
}

// Contact Messages / Support Tickets API
export const contactMessagesApi = {
  getAll: async (page = 1, limit = 20, status = 'OPEN', search = '') => {
    const response = await apiClient.get('/admin/content/admin/contact-messages', {
      params: { page, limit, status, search }
    })
    return response.data
  },

  getById: async (ticketId: string) => {
    const response = await apiClient.get(`/admin/content/admin/contact-messages/${ticketId}`)
    return response.data
  },

  respond: async (ticketId: string, message: string) => {
    const response = await apiClient.post(`/admin/content/admin/contact-messages/${ticketId}/respond`, {
      message
    })
    return response.data
  },

  close: async (ticketId: string) => {
    const response = await apiClient.patch(`/admin/content/admin/contact-messages/${ticketId}/close`)
    return response.data
  }
}

// Reviews API
export const reviewsApi = {
  getProductReviews: async (params?: {
    page?: number
    limit?: number
    productId?: string
    status?: string
    rating?: number
  }) => {
    const response = await apiClient.get('/reviews/admin/product-reviews', { params })
    return response.data
  }
}

export default apiClient
