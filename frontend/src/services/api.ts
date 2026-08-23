import axios from 'axios'

export const VITE_API_URL = import.meta.env.VITE_API_URL || import.meta.env.NEXT_PUBLIC_API_URL

export const normalizeApiUrl = (url?: string): string => {
  const trimmed = url?.trim().replace(/\/+$/, '')
  if (!trimmed) return '/api'
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`
}

export const API_URL = normalizeApiUrl(VITE_API_URL)
export const API_TIMEOUT_MS = 40000

export const getApiHost = (): string => {
  if (typeof window === 'undefined') {
    return API_URL === '/api' ? '' : API_URL.replace(/\/api\/?$/, '')
  }

  if (API_URL !== '/api') {
    return API_URL.replace(/\/api\/?$/, '')
  }

  return window.location.origin
}

const isCloudinaryUrl = (url: string) => {
  return /^https?:\/\/res\.cloudinary\.com\//i.test(url)
}

const withCloudinaryAutoOptimization = (url: string) => {
  if (!isCloudinaryUrl(url) || url.includes('/q_auto') || url.includes('/f_auto')) return url

  if (url.includes('/image/upload/')) {
    return url.replace('/image/upload/', '/image/upload/q_auto,f_auto/')
  }

  if (url.includes('/video/upload/')) {
    return url.replace('/video/upload/', '/video/upload/q_auto/')
  }

  return url
}

export const resolveMediaUrl = (url?: string): string => {
  const fallback = ''
  if (!url) return fallback
  if (/^https?:\/\//i.test(url)) return withCloudinaryAutoOptimization(url)
  if (/^\/\//i.test(url) || url.startsWith('data:') || url.startsWith('blob:')) return url
  if (url.startsWith('/uploads')) return `${getApiHost()}${url}`
  return url
}

export const getEmbedVideoUrl = (url?: string): string => {
  if (!url) return ''
  const resolved = resolveMediaUrl(url)

  const youtubeMatch = resolved.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([^&?/]+)/i)
  if (youtubeMatch?.[1]) return `https://www.youtube.com/embed/${youtubeMatch[1]}`

  const vimeoMatch = resolved.match(/vimeo\.com\/(?:video\/)?(\d+)/i)
  if (vimeoMatch?.[1]) return `https://player.vimeo.com/video/${vimeoMatch[1]}`

  return ''
}

export const isDirectVideoUrl = (url?: string): boolean => {
  if (!url) return false
  return /\.(mp4|webm|ogg|mov)(\?|#|$)/i.test(url) || /\/video\/upload\//i.test(url)
}

export const getApiErrorMessage = (error: any, fallback = 'Something went wrong. Please try again.') => {
  if (!error.response) {
    if (error instanceof Error && error.message) {
      if (error.message.includes('timeout')) return 'Server is starting up. Please give it a few moments.'
      return error.message
    }
    return 'Network error. Check your connection.'
  }

  return error.response.data?.message || error.response.data?.error || fallback
}

export const api = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT_MS,
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

// Response interceptor with automatic retry on cold start and clean auth handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config
    const isGetOrSafe = config?.method === 'get' || config?.url?.includes('/cart') || config?.url?.includes('/products') || config?.url?.includes('/content')

    // Retry on timeouts, 502, 503, 504, or network error (up to 2 times) for idempotent/read requests
    if (config && isGetOrSafe && (!config.__retryCount || config.__retryCount < 2)) {
      const isNetworkOrTimeout = !error.response || error.code === 'ECONNABORTED' || [502, 503, 504].includes(error.response?.status)
      if (isNetworkOrTimeout) {
        config.__retryCount = (config.__retryCount || 0) + 1
        const delay = config.__retryCount * 1200
        await new Promise((resolve) => setTimeout(resolve, delay))
        return api(config)
      }
    }

    if (error.response?.status === 401) {
      // Clear token silently without breaking the guest user journey
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }

    return Promise.reject(error)
  }
)

export default api
