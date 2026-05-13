import { Router } from 'express'

// Import all routes
import authRoutes from './auth'
import productRoutes from './products'
import orderRoutes from './orders'
import cartRoutes from './cart'
import wishlistRoutes from './wishlist'
import notificationRoutes from './notifications'
import analyticsRoutes from './analyticsRoutes'
import subscriptionRoutes from './subscriptions'
import mpesaRoutes from './mpesa'
import affiliateRoutes from './affiliates'
import promotionRoutes from './promotions'
import qrCodeRoutes from './qrCodes'
import returnRoutes from './returns'
import blogRoutes from './blog'
import chatRoutes from './chat'
import contentRoutes from './contentManagement'
import publicContentRoutes from './publicContent'
import adminDashboardRoutes from './adminDashboard'
import adminRoutes from './admin'
import deliveryRoutes from './deliveryRoutes'
import messageCatalogRoutes from './messages'
// import messageRoutes from './message'
// import helpRoutes from './help'

// New routes we created
import categoryRoutes from './categories'
import paymentRoutes from './payments'
import couponRoutes from './coupons'
import userRoutes from './users'
import searchRoutes from './search'
import fileUploadRoutes from './fileUpload'
import dashboardRoutes from './dashboard'
import reviewRoutes from './reviews'
import userSessionRoutes from './userSessions'

const router = Router()

// Mount routes directly under /api (no /v1 prefix for backwards compatibility)
router.use('/api/auth', authRoutes)
router.use('/api/products', productRoutes)
router.use('/api/orders', orderRoutes)
router.use('/api/cart', cartRoutes)
router.use('/api/wishlist', wishlistRoutes)
router.use('/api/notifications', notificationRoutes)
router.use('/api/analytics', analyticsRoutes)
router.use('/api/subscriptions', subscriptionRoutes)
router.use('/api/payments/mpesa', mpesaRoutes)
router.use('/api/affiliates', affiliateRoutes)
router.use('/api/promotions', promotionRoutes)
router.use('/api/qr-codes', qrCodeRoutes)
router.use('/api/returns', returnRoutes)
router.use('/api/blog', blogRoutes)
router.use('/api/chat', chatRoutes)
router.use('/api/content', publicContentRoutes)
router.use('/api/admin', adminRoutes)
router.use('/api/admin/dashboard', adminDashboardRoutes)
router.use('/api/admin/content', contentRoutes)
router.use('/api/deliveries', deliveryRoutes)
router.use('/api/messages', messageCatalogRoutes)
// router.use('/api/messages', messageRoutes)
// router.use('/api/help', helpRoutes)

// New route groups
router.use('/api/categories', categoryRoutes)
router.use('/api/payments', paymentRoutes)
router.use('/api/coupons', couponRoutes)
router.use('/api/users', userRoutes)
router.use('/api/search', searchRoutes)
router.use('/api/files', fileUploadRoutes)
router.use('/api/dashboard', dashboardRoutes)
router.use('/api/reviews', reviewRoutes)
router.use('/api/user-sessions', userSessionRoutes)

// Health check
router.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
})

// Root API documentation
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Hincton Meat API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      categories: '/api/categories',
      orders: '/api/orders',
      cart: '/api/cart',
      wishlist: '/api/wishlist',
      payments: '/api/payments',
      coupons: '/api/coupons',
      users: '/api/users',
      search: '/api/search',
      files: '/api/files',
      dashboard: '/api/dashboard',
      analytics: '/api/analytics',
      subscriptions: '/api/subscriptions',
      reviews: '/api/reviews',
      notifications: '/api/notifications',
      deliveries: '/api/deliveries',
      messages: '/api/messages',
      blog: '/api/blog',
      chat: '/api/chat',
      content: '/api/content',
      affiliates: '/api/affiliates',
      promotions: '/api/promotions',
      'qr-codes': '/api/qr-codes',
      returns: '/api/returns',
      health: '/api/health'
    }
  })
})

export default router
