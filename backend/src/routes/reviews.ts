import { Router } from 'express'
import { ReviewController } from '../controllers'
import { authenticate, requireAdmin, authRateLimiter, apiRateLimiter } from '../middleware'
import * as reviewsController from '../controllers/reviewsController'

const router = Router()

// Public review routes
router.get('/product/:productId', 
  apiRateLimiter, 
  ReviewController.getProductReviews
)

// Protected review routes
router.use(authenticate)

// New buyer-specific review endpoints
router.get('/my', 
  apiRateLimiter, 
  reviewsController.getMyReviews
)
router.get('/to-review', 
  apiRateLimiter, 
  reviewsController.getProductsToReview
)
router.post('/', 
  authRateLimiter, 
  reviewsController.createReview
)
router.put('/:id', 
  authRateLimiter, 
  reviewsController.updateReview
)
router.delete('/:id', 
  authRateLimiter, 
  reviewsController.deleteReview
)
router.post('/:id/helpful', 
  authRateLimiter, 
  reviewsController.markHelpful
)

// Admin review routes must come before the generic /:id route.
router.get('/admin/product-reviews', 
  authenticate, 
  requireAdmin, 
  reviewsController.getAdminProductReviews
)

router.get('/:id', 
  apiRateLimiter, 
  ReviewController.getReview
)
router.post('/:id/report', 
  authRateLimiter, 
  ReviewController.reportReview
)

// Admin review routes
router.use(requireAdmin)

router.get('/stats/overview', 
  apiRateLimiter, 
  ReviewController.getReviewStats
)

export default router
