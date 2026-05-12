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

// API versioning
router.use('/api/v1', (req, res, next) => {
  ;(req as any).apiVersion = 'v1'
  next()

})

// Route groups
router.use('/auth', authRoutes)
router.use('/products', productRoutes)
router.use('/orders', orderRoutes)
router.use('/cart', cartRoutes)
router.use('/wishlist', wishlistRoutes)
router.use('/notifications', notificationRoutes)
router.use('/analytics', analyticsRoutes)
router.use('/subscriptions', subscriptionRoutes)
router.use('/payments/mpesa', mpesaRoutes)
router.use('/affiliates', affiliateRoutes)
router.use('/promotions', promotionRoutes)
router.use('/qr-codes', qrCodeRoutes)
router.use('/returns', returnRoutes)
router.use('/blog', blogRoutes)
router.use('/chat', chatRoutes)
router.use('/content', contentRoutes)
router.use('/admin/dashboard', adminDashboardRoutes)
router.use('/deliveries', deliveryRoutes)
router.use('/messages', messageCatalogRoutes)
// router.use('/messages', messageRoutes)
// router.use('/help', helpRoutes)

// New route groups
router.use('/categories', categoryRoutes)
router.use('/payments', paymentRoutes)
router.use('/coupons', couponRoutes)
router.use('/users', userRoutes)
router.use('/search', searchRoutes)
router.use('/files', fileUploadRoutes)
router.use('/dashboard', dashboardRoutes)
router.use('/reviews', reviewRoutes)
router.use('/user-sessions', userSessionRoutes)

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
})

// API documentation
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Hincton Meat API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/v1/auth',
      products: '/api/v1/products',
      categories: '/api/v1/categories',
      orders: '/api/v1/orders',
      cart: '/api/v1/cart',
      wishlist: '/api/v1/wishlist',
      payments: '/api/v1/payments',
      coupons: '/api/v1/coupons',
      users: '/api/v1/users',
      search: '/api/v1/search',
      files: '/api/v1/files',
      dashboard: '/api/v1/dashboard',
      analytics: '/api/v1/analytics',
      subscriptions: '/api/v1/subscriptions',
      reviews: '/api/v1/reviews',
      notifications: '/api/v1/notifications',
      deliveries: '/api/v1/deliveries',
      messages: '/api/v1/messages',
      help: '/api/v1/help',
      blog: '/api/v1/blog',
      chat: '/api/v1/chat',
      content: '/api/v1/content',
      affiliates: '/api/v1/affiliates',
      promotions: '/api/v1/promotions',
      'qr-codes': '/api/v1/qr-codes',
      returns: '/api/v1/returns',
      health: '/api/v1/health'
    }
  })
})

export default router
