import { Router } from 'express'
import { DashboardController } from '../controllers'
import { authenticate, requireAdmin, apiRateLimiter, authRateLimiter } from '../middleware'

const router = Router()

// Protected dashboard routes - require admin authentication
router.use(authenticate)
router.use(requireAdmin)

// Dashboard overview
router.get('/stats/overview', 
  apiRateLimiter, 
  DashboardController.getDashboardStats
)
router.get('/stats/sales', 
  apiRateLimiter, 
  DashboardController.getSalesOverview
)
router.get('/stats/users', 
  apiRateLimiter, 
  DashboardController.getUserGrowth
)
router.get('/stats/products', 
  apiRateLimiter, 
  DashboardController.getProductPerformance
)
router.get('/stats/financial', 
  apiRateLimiter, 
  DashboardController.getFinancialSummary
)
router.get('/activity/recent', 
  apiRateLimiter, 
  DashboardController.getRecentActivity
)

export default router
