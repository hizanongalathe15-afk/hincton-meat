import { Router } from 'express'
import { UserController } from '../controllers'
import { authenticate, requireAdmin, authRateLimiter, apiRateLimiter, passwordResetRateLimiter } from '../middleware'

const router = Router()

// Protected user routes - require authentication
router.use(authenticate)

// User profile routes - stricter rate limiting for sensitive operations
router.get('/profile', 
  authRateLimiter, 
  UserController.getProfile
)
router.put('/profile', 
  authRateLimiter, 
  UserController.updateProfile
)
router.put('/password', 
  passwordResetRateLimiter, 
  UserController.changePassword
)

// Admin user routes
router.use(requireAdmin)

router.get('/', 
  apiRateLimiter, 
  UserController.getUsers
)
router.get('/:id', 
  apiRateLimiter, 
  UserController.getUser
)
router.put('/:id', 
  authRateLimiter, 
  UserController.updateUser
)
router.post('/:id/deactivate', 
  authRateLimiter, 
  UserController.deactivateUser
)
router.post('/:id/activate', 
  authRateLimiter, 
  UserController.activateUser
)
router.delete('/:id', 
  authRateLimiter, 
  UserController.deleteUser
)
router.get('/stats/overview', 
  apiRateLimiter, 
  UserController.getUserStats
)

// Admin user management routes
router.post('/admin/create', 
  authRateLimiter, 
  UserController.createAdminUser
)
router.post('/:id/block', 
  authRateLimiter, 
  UserController.blockUser
)
router.post('/:id/unblock', 
  authRateLimiter, 
  UserController.unblockUser
)
router.put('/:id/password', 
  authRateLimiter, 
  UserController.changeUserPassword
)
router.delete('/:id', 
  authRateLimiter, 
  UserController.deleteUserAccount
)

export default router
