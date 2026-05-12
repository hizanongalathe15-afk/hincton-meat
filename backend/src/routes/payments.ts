import { Router } from 'express'
import { PaymentController } from '../controllers'
import { authenticate, requireAdmin, authRateLimiter, apiRateLimiter, passwordResetRateLimiter } from '../middleware'

const router = Router()

// Public payment routes (for webhooks, callbacks) - strict rate limiting
router.post('/webhook/mpesa', 
  passwordResetRateLimiter, 
  PaymentController.processMpesaWebhook
)
router.get('/success/:transactionId', 
  authRateLimiter, 
  PaymentController.getPaymentSuccessPage
)
router.get('/failed/:transactionId', 
  authRateLimiter, 
  PaymentController.getPaymentFailedPage
)

// Payment verification routes - public but rate limited
router.get('/verify/:reference', 
  authRateLimiter, 
  PaymentController.verifyPayment
)
router.post('/verify/:reference', 
  authRateLimiter, 
  PaymentController.confirmPayment
)

// Protected payment routes
router.use(authenticate)

// User payment routes
router.get('/', 
  authRateLimiter, 
  PaymentController.getPaymentsByUser
)
router.get('/:id', PaymentController.getPayment)
router.post('/', 
  authRateLimiter, 
  PaymentController.createPayment
)
router.put('/:id/status', 
  authRateLimiter, 
  PaymentController.updatePaymentStatus
)
router.post('/:id/complete', 
  authRateLimiter, 
  PaymentController.completePayment
)
router.post('/:id/fail', 
  authRateLimiter, 
  PaymentController.failPayment
)

// Admin payment routes
router.use(requireAdmin)

router.get('/admin/all', 
  apiRateLimiter, 
  PaymentController.getPayments
)
router.get('/admin/stats', 
  apiRateLimiter, 
  PaymentController.getPaymentStats
)
router.get('/admin/mpesa', 
  apiRateLimiter, 
  PaymentController.getMpesaPayments
)
router.get('/admin/order/:orderId', 
  apiRateLimiter, 
  PaymentController.getPaymentsByOrder
)

// Payment verification routes
router.get('/verify/:reference', PaymentController.verifyPayment)
router.post('/verify/:reference', PaymentController.confirmPayment)

export default router
