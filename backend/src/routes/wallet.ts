import { Router } from 'express'
import { authenticate, authRateLimiter, apiRateLimiter } from '../middleware'
import * as walletController from '../controllers/walletController'

const router = Router()

// All wallet routes require authentication
router.use(authenticate)

// Wallet balance and transactions
router.get('/balance', 
  apiRateLimiter, 
  walletController.getBalance
)
router.get('/transactions', 
  apiRateLimiter, 
  walletController.getTransactions
)

// Wallet operations
router.post('/topup', 
  authRateLimiter, 
  walletController.topup
)
router.post('/withdraw', 
  authRateLimiter, 
  walletController.withdraw
)

// Payment methods
router.get('/payment-methods', 
  apiRateLimiter, 
  walletController.getPaymentMethods
)

export default router
