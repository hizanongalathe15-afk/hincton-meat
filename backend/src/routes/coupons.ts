import { Router } from 'express'
import { CouponController } from '../controllers'
import { authenticate, requireAdmin, authRateLimiter, apiRateLimiter } from '../middleware'

const router = Router()

// Public coupon routes - rate limited
router.get('/active', 
  apiRateLimiter, 
  CouponController.getActiveCoupons
)
router.get('/validate', 
  authRateLimiter, 
  CouponController.validateCoupon
)
router.get('/code/:code', 
  apiRateLimiter, 
  CouponController.getCouponByCode
)

// Protected coupon routes - require authentication
router.use(authenticate)

router.get('/', 
  apiRateLimiter, 
  CouponController.getCoupons
)
router.get('/:id', 
  apiRateLimiter, 
  CouponController.getCoupon
)

// Admin coupon routes - require admin
router.use(requireAdmin)

router.post('/', 
  authRateLimiter, 
  CouponController.createCoupon
)
router.put('/:id', 
  authRateLimiter, 
  CouponController.updateCoupon
)
router.delete('/:id', 
  authRateLimiter, 
  CouponController.deleteCoupon
)
router.get('/stats', 
  apiRateLimiter, 
  CouponController.getCouponStats
)

export default router
