import { Router } from 'express';
import {
  initiateSTKPush,
  mpesaCallback,
  checkTransactionStatus,
  getUserTransactions
} from '../controllers/mpesaController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/stk-push', authenticate, initiateSTKPush);
router.post('/callback', mpesaCallback);
router.get('/transaction/:checkoutRequestID', authenticate, checkTransactionStatus);
router.get('/transactions', authenticate, getUserTransactions);

export default router;
