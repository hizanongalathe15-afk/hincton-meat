import { Router } from 'express'
import {
  getCategories,
  getCategory,
  getCategoryBySlug,
  getRootCategories,
  getFeaturedCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryProducts
} from '../controllers'
import { authenticate, requireAdmin, authRateLimiter, apiRateLimiter } from '../middleware'

const router = Router()

// Public category routes - rate limited
router.get('/', 
  apiRateLimiter, 
  getCategories
)
router.get('/featured', 
  apiRateLimiter, 
  getFeaturedCategories
)
router.get('/root', 
  apiRateLimiter, 
  getRootCategories
)
router.get('/search', 
  apiRateLimiter,
  getCategories
)
router.get('/:slug', 
  apiRateLimiter, 
  getCategoryBySlug
)

// Protected category routes - require authentication
router.use(authenticate)

router.get('/:id', 
  apiRateLimiter, 
  getCategory
)
router.get('/:id/products', 
  apiRateLimiter, 
  getCategoryProducts
)

// Admin category routes - require admin
router.use(requireAdmin)

router.post('/', 
  authRateLimiter, 
  createCategory
)

router.put('/:id', 
  authRateLimiter, 
  updateCategory
)

router.delete('/:id', 
  authRateLimiter, 
  deleteCategory
)

export default router
