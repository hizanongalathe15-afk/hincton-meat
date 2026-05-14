import axios from 'axios'

export const VITE_API_URL = import.meta.env.VITE_API_URL || import.meta.env.NEXT_PUBLIC_API_URL

export const normalizeApiUrl = (url?: string): string => {
  const trimmed = url?.trim().replace(/\/+$/, '')
  if (!trimmed) return '/api'
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`
}

export const API_URL = normalizeApiUrl(VITE_API_URL)

export const getApiHost = (): string => {
  if (typeof window === 'undefined') {
    return API_URL === '/api' ? '' : API_URL.replace(/\/api\/?$/, '')
  }

  if (API_URL !== '/api') {
    return API_URL.replace(/\/api\/?$/, '')
  }

  return window.location.origin
}

export const getApiErrorMessage = (error: any, fallback = 'Something went wrong. Please try again.') => {
  if (!error.response) {
    if (error instanceof Error && error.message) return error.message
    return 'Network error. Check your connection.'
  }

  return error.response.data?.message || error.response.data?.error || fallback
}

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

const getGuestSessionId = () => {
  const key = 'hincton:guest-session-id'
  const existing = localStorage.getItem(key)
  if (existing) return existing

  const generated =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `guest-${Date.now()}-${Math.random().toString(36).slice(2)}`

  localStorage.setItem(key, generated)
  return generated
}

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    } else {
      config.headers['X-Guest-Session-Id'] = getGuestSessionId()
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = String(error.config?.url || '')
    const isAuthAttempt =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register') ||
      requestUrl.includes('/auth/phone/request-otp') ||
      requestUrl.includes('/auth/phone/verify-otp') ||
      requestUrl.includes('/auth/forgot-password') ||
      requestUrl.includes('/auth/reset-password')

    if (error.response?.status === 401 && !isAuthAttempt) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
