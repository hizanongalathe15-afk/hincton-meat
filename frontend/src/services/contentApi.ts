import axios from 'axios'
import { API_TIMEOUT_MS, API_URL } from './api'

const API_BASE_URL = API_URL

// Create axios instance with auth
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Content API for static pages
export const contentApi = {
  // Get about page content
  getAboutContent: async () => {
    const response = await api.get('/content/about')
    return response.data
  },

  // Get contact page content
  getContactContent: async () => {
    const response = await api.get('/content/contact')
    return response.data
  },

  // Get home page content
  getHomeContent: async () => {
    const response = await api.get('/content/home')
    return response.data
  },

  // Get company info/stats
  getCompanyStats: async () => {
    const response = await api.get('/content/stats')
    return response.data
  },

  getCommerceSettings: async () => {
    const response = await api.get('/content/commerce-settings')
    return response.data
  },

  getSiteProfile: async () => {
    const response = await api.get('/content/site-profile')
    return response.data
  },

  // Submit contact form
  submitContactForm: async (formData: FormData | {
    name: string
    email: string
    phone?: string
    subject: string
    message: string
  }) => {
    const response = await api.post(
      '/content/contact/submit',
      formData,
      formData instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined
    )
    return response.data
  },

  // Update about content (admin only)
  updateAboutContent: async (content: any) => {
    const response = await api.put('/admin/content/about', content)
    return response.data
  },

  // Update contact content (admin only)
  updateContactContent: async (content: any) => {
    const response = await api.put('/admin/content/contact', content)
    return response.data
  },

  // Update home content (admin only)
  updateHomeContent: async (content: any) => {
    const response = await api.put('/admin/content/home', content)
    return response.data
  },

  // Update company stats (admin only)
  updateCompanyStats: async (stats: any) => {
    const response = await api.put('/admin/content/stats', stats)
    return response.data
  }
}

export default api
