import { Router } from 'express'
import { SearchController } from '../controllers'
import { authenticate, apiRateLimiter } from '../middleware'

const router = Router()

// Public search routes
router.post('/products', 
  apiRateLimiter, 
  SearchController.searchProducts
)
router.get('/products', 
  apiRateLimiter, 
  SearchController.getFilteredProducts
)
router.get('/suggestions', 
  apiRateLimiter, 
  SearchController.getSearchSuggestions
)
router.get('/popular', 
  apiRateLimiter, 
  SearchController.getPopularSearches
)
router.get('/autocomplete', 
  apiRateLimiter, 
  SearchController.getAutocompleteSuggestions
)
router.post('/advanced', 
  apiRateLimiter, 
  SearchController.advancedSearch
)

// Category search
router.get('/categories', 
  apiRateLimiter, 
  SearchController.searchCategories
)

export default router
