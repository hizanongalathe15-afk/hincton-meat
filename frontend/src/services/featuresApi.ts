import axios from 'axios'
import { API_TIMEOUT_MS, API_URL } from './api'
import { getAuthHeaders } from './adminApi'

const FEATURES_DISABLED_KEY = 'hincton:features-api-disabled'

const isFeaturesApiDisabled = () => {
  try {
    return sessionStorage.getItem(FEATURES_DISABLED_KEY) === '1'
  } catch {
    return false
  }
}

const disableFeaturesApi = () => {
  try {
    sessionStorage.setItem(FEATURES_DISABLED_KEY, '1')
  } catch {
    // ignore storage failures
  }
}

const apiClient = axios.create({
  baseURL: `${API_URL}/features`,
  timeout: API_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  if (isFeaturesApiDisabled()) {
    return Promise.reject(new axios.CanceledError('features-api-disabled'))
  }
  const authHeaders = getAuthHeaders()
  if (authHeaders.Authorization) {
    config.headers.set('Authorization', authHeaders.Authorization)
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 404) {
      disableFeaturesApi()
    }
    return Promise.reject(error)
  }
)

const call = <T>(fn: () => Promise<T>) => {
  if (isFeaturesApiDisabled()) return Promise.resolve(undefined as T)
  return fn().catch((error) => {
    if (axios.isCancel(error)) return undefined as T
    throw error
  })
}

export const featuresApi = {
  // Newsletter
  subscribeNewsletter(payload: { email: string; firstName?: string; lastName?: string; source?: 'EXIT_INTENT' | 'FOOTER' | 'CHECKOUT' | 'POPUP' | 'WEBSITE' | 'IMPORT' }) {
    return apiClient.post('/newsletter/subscribe', payload).then(r => r.data)
  },
  unsubscribeNewsletter(payload: { email: string; reason?: string }) {
    return apiClient.post('/newsletter/unsubscribe', payload).then(r => r.data)
  },
  getNewsletterSubscribers() {
    return apiClient.get('/newsletter/list').then(r => r.data)
  },

  // Wishlist sharing
  shareWishlist(payload: { wishlistId?: string; title?: string; recipientEmail?: string; recipientName?: string; expiresDays?: number }) {
    return apiClient.post('/wishlist/share', payload).then(r => r.data as { id: string; token: string; expiresAt: string; shareUrl: string })
  },
  getSharedWishlist(token: string) {
    return apiClient.get(`/wishlist/share/${encodeURIComponent(token)}`).then(r => r.data)
  },

  // Review helpful votes
  voteReviewHelpful(reviewId: string, helpful: boolean) {
    return apiClient.post(`/reviews/${encodeURIComponent(reviewId)}/helpful`, { helpful }).then(r => r.data)
  },

  // Return labels
  generateReturnLabel(returnRequestId: string) {
    return apiClient.post(`/returns/${encodeURIComponent(returnRequestId)}/label`).then(r => r.data)
  },

  // Back in stock
  registerBackInStockAlert(payload: { productId: string; variantId?: string; email?: string; phone?: string; sentVia?: 'EMAIL' | 'SMS' | 'BOTH' }) {
    return apiClient.post('/products/back-in-stock-alert', payload).then(r => r.data)
  },

  // Social proof
  getSocialProofRecent(params?: { limit?: number; productId?: string }) {
    const search = new URLSearchParams()
    if (params?.limit) search.set('limit', String(params.limit))
    if (params?.productId) search.set('productId', params.productId)
    const qs = search.toString()
    return apiClient.get(`/social-proof/recent${qs ? `?${qs}` : ''}`).then(r => r.data as { events: Array<any> })
  },
  trackSocialProofEvent(payload: { eventType: 'PURCHASE' | 'VIEW' | 'CART_ADD' | 'REVIEW'; productId?: string; city?: string; country?: string; customerInitials?: string; quantity?: number }) {
    return apiClient.post('/social-proof/events', payload).then(r => r.data)
  },

  // Gamification
  getSpinWinConfig() {
    return apiClient.get('/gamification/spin-win/config').then(r => r.data)
  },
  playSpinWin() {
    return apiClient.post('/gamification/spin-win/play').then(r => r.data)
  },
  getLoyaltySummary() {
    return apiClient.get('/gamification/loyalty/summary').then(r => r.data as { balance: number; ledger: any[]; badges: any[] })
  },

  // Experiments + telemetry
  assignExperiment(payload: { experimentKey: string; variant: string; sessionId: string }) {
    return call(() => apiClient.post('/experiments/assign', payload).then(r => r.data))
  },
  reportCwv(payload: { name: 'LCP' | 'FID' | 'CLS' | 'INP' | 'TTFB' | 'FCP'; value: number; rating: 'good' | 'needs-improvement' | 'poor'; path?: string; sessionId?: string; connectionType?: string }) {
    return call(() => apiClient.post('/telemetry/cwv', payload).then(r => r.data))
  },
  trackPwaInstall(payload: { acceptedInstall: boolean; platform?: string; sessionId?: string }) {
    return call(() => apiClient.post('/telemetry/pwa-install', payload).then(r => r.data))
  },

  // Coupon best deal auto-apply
  getBestCouponForCart(payload: { cartSubtotal: number; itemCount: number; productIds: string[]; customerSegment?: string }) {
    return apiClient.post('/coupons/best-for-cart', payload).then(r => r.data as { bestCoupon: any; candidates: Array<{ coupon: any; savings: number }> })
  },
}
