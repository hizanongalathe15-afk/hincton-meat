import { Router } from 'express'
import { UserSessionController } from '../controllers'
import { authenticate, requireAdmin, apiRateLimiter, authRateLimiter } from '../middleware'

const router = Router()

// Public endpoints for user session tracking
router.post('/track', 
  authRateLimiter, 
  UserSessionController.trackUserActivity
)

router.post('/status', 
  authRateLimiter, 
  UserSessionController.updateUserOnlineStatus
)

router.post('/offline', 
  authRateLimiter, 
  UserSessionController.markUserOffline
)

// Protected endpoints - require authentication
router.use(authenticate)

router.get('/stats', 
  apiRateLimiter, 
  UserSessionController.getUserStats
)

router.get('/online/count', 
  apiRateLimiter, 
  UserSessionController.getOnlineUserCount
)

router.get('/online', 
  apiRateLimiter, 
  UserSessionController.getOnlineUsers
)

router.get('/offline', 
  apiRateLimiter, 
  UserSessionController.getOfflineUsers
)

// Admin only endpoints
router.use(requireAdmin)

router.get('/admin/realtime', 
  apiRateLimiter, 
  UserSessionController.getRealTimeUserStats
)

router.get('/admin/session/:userId', 
  apiRateLimiter, 
  UserSessionController.getUserSessionDetails
)

router.post('/admin/revoke/:sessionId',
  authRateLimiter,
  UserSessionController.revokeSession
)

router.delete('/admin/session/:sessionId',
  authRateLimiter,
  UserSessionController.deleteAdminSession
)

router.delete('/admin/sessions',
  authRateLimiter,
  UserSessionController.clearAdminSessions
)

router.post('/admin/cleanup', 
  authRateLimiter, 
  UserSessionController.cleanupOldSessions
)

export default router
