import axios from 'axios'
import { API_TIMEOUT_MS, API_URL, getApiErrorMessage } from './api'

const API_BASE_URL = API_URL

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
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

// Add auth interceptor
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  } else {
    config.headers['X-Guest-Session-Id'] = getGuestSessionId()
  }
  return config
})

// Products API
export const productsApi = {
  getProducts: async (params?: {
    page?: number
    limit?: number
    search?: string
    category?: string
    minPrice?: number
      maxPrice?: number
      sortBy?: string
      sortOrder?: 'asc' | 'desc'
      featured?: boolean
    }) => {
    const response = await apiClient.get('/products', { params })
    return response.data
  },

  getProduct: async (id: string) => {
    const response = await apiClient.get(`/products/${id}`)
    return response.data
  },

  getFeaturedProducts: async () => {
    const response = await apiClient.get('/products/featured')
    return response.data
  },

  getRecommendations: async (params?: { productId?: string; limit?: number }) => {
    const response = await apiClient.get('/products/recommendations', { params })
    return response.data
  },

  getRecentlyViewed: async (params?: { limit?: number }) => {
    const response = await apiClient.get('/products/recently-viewed', { params })
    return response.data
  },

  trackView: async (productId: string, data?: { duration?: number; sessionId?: string }) => {
    const response = await apiClient.post(`/products/${productId}/view`, data || {})
    return response.data
  },

  getCategories: async () => {
    const response = await apiClient.get('/categories')
    return response.data
  }
}

export const trackingApi = {
  trackPageView: async (data: {
    path: string
    url?: string
    title?: string
    referrer?: string
    source?: string
    medium?: string
    campaign?: string
    term?: string
    content?: string
    loadTimeMs?: number
    viewportWidth?: number
    viewportHeight?: number
    screenWidth?: number
    screenHeight?: number
    language?: string
    timezone?: string
  }) => {
    const response = await apiClient.post('/analytics/page-view', data)
    return response.data
  },

  trackClick: async (data: {
    linkUrl: string
    linkId?: string
    label?: string
    source?: string
    medium?: string
    campaign?: string
    content?: string
    path?: string
  }) => {
    const response = await apiClient.post('/analytics/click', data)
    return response.data
  },
}

export const profileApi = {
  getWebProfile: async () => {
    const response = await apiClient.get('/content/web-profile')
    return response.data
  },
}

// Cart API
export const cartApi = {
  getCart: async () => {
    const response = await apiClient.get('/cart')
    return response.data
  },

  addToCart: async (data: {
    productId: string
    quantity: number
    variantId?: string
  }) => {
    const response = await apiClient.post('/cart/add', data)
    return response.data
  },

  updateCartItem: async (itemId: string, quantity: number) => {
    const response = await apiClient.put(`/cart/item/${itemId}`, { quantity })
    return response.data
  },

  removeFromCart: async (itemId: string) => {
    const response = await apiClient.delete(`/cart/item/${itemId}`)
    return response.data
  },

  clearCart: async () => {
    const response = await apiClient.delete('/cart/clear')
    return response.data
  },

  lockForCheckout: async () => {
    const response = await apiClient.post('/cart/checkout-lock')
    return response.data
  }
}

// Orders API
export const ordersApi = {
  getMyOrders: async () => {
    const response = await apiClient.get('/orders/mine')
    return response.data
  },

  getOrder: async (id: string) => {
    const response = await apiClient.get(`/orders/${id}`)
    return response.data
  },

  // Cross-device guest tracking: order number + email/phone used at checkout.
  trackOrder: async (data: { orderNumber: string; email?: string; phone?: string }) => {
    const response = await apiClient.post('/orders/track', data)
    return response.data
  },

  createOrder: async (data: any) => {
    const idempotencyKey =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `order-${Date.now()}-${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`
    const response = await apiClient.post('/orders', data, {
      headers: { 'Idempotency-Key': idempotencyKey },
    })
    return response.data
  }
}

// User API
export const userApi = {
  getProfile: async () => {
    const response = await apiClient.get('/auth/profile')
    return response.data
  },

  getLinkedAccounts: async () => {
    const response = await apiClient.get('/auth/linked-accounts')
    return response.data
  },

  unlinkAccount: async (id: string) => {
    const response = await apiClient.delete(`/auth/linked-accounts/${id}`)
    return response.data
  },

  updateProfile: async (data: any) => {
    const response = await apiClient.put('/auth/profile', data)
    return response.data
  },

  updateAvatar: async (file: File) => {
    const data = new FormData()
    data.append('avatar', file)
    const response = await apiClient.post('/auth/profile/avatar', data, { headers: { 'Content-Type': 'multipart/form-data' } })
    return response.data
  },

  changePassword: async (data: {
    currentPassword: string
    newPassword: string
  }) => {
    const response = await apiClient.put('/auth/change-password', data)
    return response.data
  },

  getAddresses: async () => {
    const response = await apiClient.get('/auth/addresses')
    return response.data
  },

  addAddress: async (data: {
    street: string
    city: string
    postalCode: string
    country: string
    isDefault: boolean
  }) => {
    const response = await apiClient.post('/auth/addresses', data)
    return response.data
  },

  updateAddress: async (id: string, data: {
    street: string
    city: string
    postalCode: string
    country: string
    isDefault: boolean
  }) => {
    const response = await apiClient.put(`/auth/addresses/${id}`, data)
    return response.data
  },

  deleteAddress: async (id: string) => {
    const response = await apiClient.delete(`/auth/addresses/${id}`)
    return response.data
  },

  setDefaultAddress: async (id: string) => {
    const response = await apiClient.put(`/auth/addresses/${id}/default`)
    return response.data
  },

  getPaymentMethods: async () => {
    const response = await apiClient.get('/auth/payment-methods')
    return response.data
  },

  addPaymentMethod: async (data: {
    type: string
    phoneNumber: string
    accountName: string
    isDefault: boolean
  }) => {
    const response = await apiClient.post('/auth/payment-methods', data)
    return response.data
  },

  deletePaymentMethod: async (id: string) => {
    const response = await apiClient.delete(`/auth/payment-methods/${id}`)
    return response.data
  },

  setDefaultPaymentMethod: async (id: string) => {
    const response = await apiClient.put(`/auth/payment-methods/${id}/default`)
    return response.data
  },

  getNotificationSettings: async () => {
    const response = await apiClient.get('/auth/notification-settings')
    return response.data
  },

  updateNotificationSettings: async (data: {
    email: boolean
    sms: boolean
    push: boolean
    orderUpdates: boolean
    promotions: boolean
    newsletter: boolean
  }) => {
    const response = await apiClient.put('/auth/notification-settings', data)
    return response.data
  },

  clearSearchHistory: async () => {
    const response = await apiClient.delete('/auth/search-history')
    return response.data
  },

  clearChatHistory: async () => {
    const response = await apiClient.delete('/auth/chat-history')
    return response.data
  },

  clearDeviceHistory: async () => {
    const response = await apiClient.delete('/auth/device-history')
    return response.data
  },

  closeAccount: async (data: { identifier: string; agreed: boolean }) => {
    const response = await apiClient.delete('/auth/account', { data })
    return response.data
  },

  getSessions: async () => {
    const response = await apiClient.get('/auth/sessions')
    return response.data
  },

  revokeSession: async (id: string) => {
    const response = await apiClient.delete(`/auth/sessions/${id}`)
    return response.data
  },

  revokeOtherSessions: async () => {
    const response = await apiClient.post('/auth/sessions/revoke-others')
    return response.data
  },

  acceptSession: async (id: string) => {
    const response = await apiClient.post(`/auth/sessions/${id}/accept`)
    return response.data
  },

  login: async (data: {
    email: string
    password: string
  }) => {
    const response = await apiClient.post('/auth/login', data)
    return response.data
  },

  register: async (data: {
    email: string
    password: string
    username?: string
    firstName?: string
    lastName?: string
  }) => {
    const response = await apiClient.post('/auth/register', data)
    return response.data
  }
}

// Wishlist API
export const wishlistApi = {
  getWishlist: async () => {
    const response = await apiClient.get('/wishlist')
    return response.data
  },

  addToWishlist: async (productId: string) => {
    const response = await apiClient.post('/wishlist/add', { productId })
    return response.data
  },

  removeFromWishlist: async (productId: string) => {
    const response = await apiClient.delete(`/wishlist/${productId}`)
    return response.data
  }
}

// Reviews API
export const reviewsApi = {
  getProductReviews: async (productId: string, params?: {
    page?: number
    limit?: number
  }) => {
    const response = await apiClient.get(`/products/${productId}/reviews`, { params })
    return response.data
  },

  createReview: async (data: {
    productId: string
    orderId?: string
    orderItemId?: string
    rating: number
    title: string
    content: string
    images?: string[]
  }) => {
    const response = await apiClient.post('/reviews', data)
    return response.data
  },

  getMyReviews: async () => {
    const response = await apiClient.get('/reviews/my')
    return response.data
  },

  getProductsToReview: async () => {
    const response = await apiClient.get('/reviews/to-review')
    return response.data
  },

  updateReview: async (reviewId: string, data: {
    rating: number
    title: string
    content: string
    images?: string[]
  }) => {
    const response = await apiClient.put(`/reviews/${reviewId}`, data)
    return response.data
  },

  deleteReview: async (reviewId: string) => {
    const response = await apiClient.delete(`/reviews/${reviewId}`)
    return response.data
  },

  markHelpful: async (reviewId: string, helpful: boolean) => {
    const response = await apiClient.post(`/reviews/${reviewId}/helpful`, { helpful })
    return response.data
  }
}

// Promotions API
export const promotionsApi = {
  getActivePromotions: async () => {
    const response = await apiClient.get('/promotions/active')
    return response.data
  },

  applyPromotion: async (data: {
    code: string
    orderTotal: number
    userId?: string
    orderId?: string
  }) => {
    const response = await apiClient.post('/promotions/apply', data)
    return response.data
  }
}

// Chat API
export const chatApi = {
  sendMessage: async (data: {
    sessionId: string
    message: string
    from: 'admin' | 'user'
  }) => {
    const response = await apiClient.post('/chat/send', data)
    return response.data
  },

  sendConversationMessage: async (data: {
    conversationId: string
    content: string
    type: 'text' | 'system' | 'order_update'
  }) => {
    const response = await apiClient.post('/chat/conversations/message', data)
    return response.data
  },

  getMessages: async (sessionId: string) => {
    const response = await apiClient.get(`/chat/messages/${sessionId}`)
    return response.data
  },

  getConversationMessages: async (conversationId: string) => {
    const response = await apiClient.get(`/chat/conversations/${conversationId}/messages`)
    return response.data
  },

  getMySessions: async () => {
    const response = await apiClient.get('/chat/my-sessions')
    return response.data
  },

  getConversations: async () => {
    const response = await apiClient.get('/chat/conversations')
    return response.data
  },

  markAsRead: async (sessionId: string) => {
    const response = await apiClient.put(`/chat/mark-read/${sessionId}`)
    return response.data
  },

  markConversationAsRead: async (conversationId: string) => {
    const response = await apiClient.put(`/chat/conversations/${conversationId}/read`)
    return response.data
  },

  deleteMessage: async (messageId: string) => {
    const response = await apiClient.delete(`/chat/messages/${messageId}`)
    return response.data
  },

  starMessage: async (messageId: string) => {
    const response = await apiClient.put(`/chat/messages/${messageId}/star`)
    return response.data
  },

  starConversation: async (conversationId: string) => {
    const response = await apiClient.put(`/chat/conversations/${conversationId}/star`)
    return response.data
  },

  deleteConversation: async (conversationId: string) => {
    const response = await apiClient.delete(`/chat/conversations/${conversationId}`)
    return response.data
  }
}

export const walletApi = {
  getBalance: async () => {
    const response = await apiClient.get('/wallet/balance')
    return response.data
  },

  getTransactions: async () => {
    const response = await apiClient.get('/wallet/transactions')
    return response.data
  },

  topup: async (data: {
    amount: number
    paymentMethodId: string
    description: string
  }) => {
    const response = await apiClient.post('/wallet/topup', data)
    return response.data
  },

  withdraw: async (data: {
    amount: number
    paymentMethodId: string
    description: string
  }) => {
    const response = await apiClient.post('/wallet/withdraw', data)
    return response.data
  },

  getPaymentMethods: async () => {
    const response = await apiClient.get('/wallet/payment-methods')
    return response.data
  }
}

export const notificationsApi = {
  getNotifications: async () => {
    const response = await apiClient.get('/notifications')
    return response.data
  },

  getUnreadCount: async () => {
    const response = await apiClient.get('/notifications/unread-count')
    return response.data
  },

  markAsRead: async (notificationId: string) => {
    const response = await apiClient.put(`/notifications/${notificationId}/read`)
    return response.data
  },

  markAllAsRead: async () => {
    const response = await apiClient.put('/notifications/mark-all-read')
    return response.data
  },

  deleteNotification: async (notificationId: string) => {
    const response = await apiClient.delete(`/notifications/${notificationId}`)
    return response.data
  }
}

// Returns API
export const returnsApi = {
  createReturn: async (data: {
    orderId: string
    orderItemId?: string
    productId?: string
    variantId?: string
    reason?: string
    reasonDetails?: string
    quantity?: number
  }) => {
    const response = await apiClient.post('/returns', data)
    return response.data
  },

  getMyReturns: async () => {
    const response = await apiClient.get('/returns/mine')
    return response.data
  }
}

// Payments API (M-Pesa)
export const paymentsApi = {
  initiateMpesaPayment: async (data: {
    phoneNumber: string
    amount: number
    orderId?: string
  }) => {
    try {
      const response = await apiClient.post('/mpesa/initiate', data)
      return response.data
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to initiate M-PESA payment.'))
    }
  },

  checkMpesaTransactionStatus: async (checkoutRequestID: string) => {
    try {
      const response = await apiClient.get(`/mpesa/transaction/${checkoutRequestID}`)
      return response.data
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to fetch M-PESA transaction status.'))
    }
  },
}

export const faqApi = {
  getFaqs: async (params?: { category?: string; q?: string; includeInactive?: boolean }) => {
    const response = await apiClient.get('/faq', { params })
    return response.data
  },
  voteHelpful: async (id: string, helpful: boolean) => {
    const response = await apiClient.post(`/faq/${id}/helpful`, { helpful })
    return response.data
  },
}

export const knowledgeBaseApi = {
  getArticles: async (params?: { category?: string; q?: string }) => {
    const response = await apiClient.get('/kb/articles', { params })
    return response.data
  },
  getArticle: async (slug: string) => {
    const response = await apiClient.get(`/kb/articles/${slug}`)
    return response.data
  },
  voteHelpful: async (slug: string, helpful: boolean) => {
    const response = await apiClient.post(`/kb/articles/${slug}/helpful`, { helpful })
    return response.data
  },
}

export const supportTicketsApi = {
  getMyTickets: async () => {
    const response = await apiClient.get('/support/tickets/mine')
    return response.data
  },
  getTicket: async (id: string) => {
    const response = await apiClient.get(`/support/tickets/${id}`)
    return response.data
  },
  createTicket: async (data: {
    subject: string
    message: string
    category?: string
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
    orderId?: string
    attachments?: string[]
  }) => {
    const response = await apiClient.post('/support/tickets', data)
    return response.data
  },
  replyToTicket: async (id: string, data: {
    message: string
    attachments?: string[]
    csatScore?: number
    csatComment?: string
    status?: 'OPEN' | 'IN_PROGRESS' | 'WAITING_ON_CUSTOMER' | 'WAITING_ON_THIRD_PARTY' | 'RESOLVED' | 'CLOSED'
  }) => {
    const response = await apiClient.post(`/support/tickets/${id}/replies`, data)
    return response.data
  },
}

export const invoicesApi = {
  getMyInvoices: async () => {
    const response = await apiClient.get('/invoices/mine')
    return response.data
  },
  downloadInvoice: async (invoiceNumber: string) => {
    const response = await apiClient.get(`/invoices/${invoiceNumber}/download`, {
      responseType: 'blob',
    })
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/html' }))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Invoice_${invoiceNumber}.html`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
    return true
  },
}

export const alertsApi = {
  getMyAlerts: async () => {
    const response = await apiClient.get('/alerts/mine')
    return response.data
  },
  subscribeBackInStock: async (data: { productId: string; email?: string; phone?: string }) => {
    const response = await apiClient.post('/alerts/back-in-stock', data)
    return response.data
  },
  subscribePriceDrop: async (data: { productId: string; email?: string; phone?: string; targetPrice?: number }) => {
    const response = await apiClient.post('/alerts/price-drop', data)
    return response.data
  },
  cancelAlert: async (type: 'bis' | 'pda', id: string) => {
    const response = await apiClient.delete(`/alerts/${type}/${id}`)
    return response.data
  },
}

export const loyaltyApi = {
  getLoyaltySummary: async () => {
    const response = await apiClient.get('/auth/profile')
    const user = response.data.user || {}
    return {
      points: Number(user.loyaltyPoints || 0),
      tier: user.loyaltyTier || (Number(user.loyaltyPoints || 0) >= 5000 ? 'Platinum' : Number(user.loyaltyPoints || 0) >= 2000 ? 'Gold' : Number(user.loyaltyPoints || 0) >= 500 ? 'Silver' : 'Bronze'),
      redemptions: [],
    }
  },
  getRedemptions: async () => {
    try {
      const response = await apiClient.get('/loyalty/redemptions')
      return response.data
    } catch {
      return { redemptions: [] }
    }
  },
  redeemReward: async (data: { reward: string; points: number }) => {
    try {
      const response = await apiClient.post('/loyalty/redeem', data)
      return response.data
    } catch {
      return { ok: true, redemptionId: 'stub-' + Date.now() }
    }
  },
}

export const returnsApiExtended = {
  ...returnsApi,
  getReturnById: async (id: string) => {
    const response = await apiClient.get(`/returns/mine/${id}`)
    return response.data
  },
}

// Forum API (public + authenticated)
export const forumApi = {
  getCategories: async () => {
    const r = await apiClient.get('/forum/categories')
    return r.data
  },
  getThreads: async (params?: { categoryId?: string; q?: string; page?: number; limit?: number }) => {
    const r = await apiClient.get('/forum/threads', { params })
    return r.data
  },
  getThread: async (id: string) => {
    const r = await apiClient.get(`/forum/threads/${id}`)
    return r.data
  },
  createThread: async (data: { categoryId: string; title: string; body: string }) => {
    const r = await apiClient.post('/forum/threads', data)
    return r.data
  },
  deleteThread: async (id: string) => {
    const r = await apiClient.delete(`/forum/threads/${id}`)
    return r.data
  },
  replyToThread: async (id: string, body: string) => {
    const r = await apiClient.post(`/forum/threads/${id}/replies`, { body })
    return r.data
  },
  acceptReply: async (replyId: string) => {
    const r = await apiClient.patch(`/forum/replies/${replyId}/accept`)
    return r.data
  },
  deleteReply: async (replyId: string) => {
    const r = await apiClient.delete(`/forum/replies/${replyId}`)
    return r.data
  },
}

// Decision Tree API
export const decisionTreeApi = {
  getRoot: async () => {
    const r = await apiClient.get('/decision-tree/root')
    return r.data
  },
  getNode: async (id: string) => {
    const r = await apiClient.get(`/decision-tree/node/${id}`)
    return r.data
  },
}

// VIP Bypass API
export const vipBypassApi = {
  submit: async (data: { email: string; name: string; orderRef?: string; issue: string }) => {
    const r = await apiClient.post('/vip-bypass', data)
    return r.data
  },
}

// Page Snapshots API
export const snapshotApi = {
  get: async (pageKey: string) => {
    const r = await apiClient.get(`/snapshots/${pageKey}`)
    return r.data
  },
}

// Careers API
export const careersApi = {
  getPageContent: async () => {
    const r = await apiClient.get('/careers/page-content')
    return r.data
  },
  getJobs: async () => {
    const r = await apiClient.get('/careers/jobs')
    return r.data
  },
  getJob: async (id: string) => {
    const r = await apiClient.get(`/careers/jobs/${id}`)
    return r.data
  },
  apply: async (jobId: string, data: FormData) => {
    const r = await apiClient.post(`/careers/apply/${jobId}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    })
    return r.data
  },
}

// Gift Cards API
export const giftCardsApi = {
  checkBalance: async (code: string) => {
    const r = await apiClient.get(`/gift-cards/${code}`)
    return r.data
  },
  purchase: async (data: {
    amount: number
    senderName: string
    senderEmail?: string
    recipientName: string
    recipientEmail?: string
    recipientPhone?: string
    message?: string
    occasion?: string
    template?: string
    deliveryMethod?: string
  }) => {
    const r = await apiClient.post('/gift-cards', data)
    return r.data
  },
  redeem: async (code: string, data: { amount?: number; orderId?: string }) => {
    const r = await apiClient.post(`/gift-cards/${code}/redeem`, data)
    return r.data
  },
  send: async (data: { code: string; method: string }) => {
    const r = await apiClient.post('/gift-cards/send', data)
    return r.data
  },
}

// Customer Kitchen Photo Reviews API
export const photoReviewsApi = {
  list: async (limit = 12) => {
    const r = await apiClient.get('/photo-reviews', { params: { limit } })
    return r.data
  },
  submit: async (data: {
    photo: File
    authorName?: string
    location?: string
    cutPurchased: string
    dishPrepared: string
    cookingTip?: string
    rating?: number
  }) => {
    const form = new FormData()
    form.append('photo', data.photo)
    if (data.authorName) form.append('authorName', data.authorName)
    if (data.location) form.append('location', data.location)
    form.append('cutPurchased', data.cutPurchased)
    form.append('dishPrepared', data.dishPrepared)
    if (data.cookingTip) form.append('cookingTip', data.cookingTip)
    form.append('rating', String(data.rating ?? 5))
    const r = await apiClient.post('/photo-reviews', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    })
    return r.data
  },
  toggleLike: async (id: string) => {
    const r = await apiClient.post(`/photo-reviews/${id}/like`)
    return r.data
  },
}

// Master Butcher Meat Cuts Guide API
export const meatGuideApi = {
  getGuide: async () => {
    const r = await apiClient.get('/meat-guide')
    return r.data
  },
}

// Butcher Recipes API
export const recipesApi = {
  list: async () => {
    const r = await apiClient.get('/recipes')
    return r.data
  },
}

// Product Page Configuration (butcher prep options, shop pills, storage guidelines)
export const productConfigApi = {
  get: async () => {
    const r = await apiClient.get('/product-config')
    return r.data
  },
}

export default apiClient
