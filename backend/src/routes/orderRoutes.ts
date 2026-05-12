import { Router } from 'express';
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  getOrderStats
} from '../controllers/orderController';
import { authenticate, authorize } from '../middleware/auth';
import { validateBody, orderSchema } from '../middleware/validation';

const router = Router();

router.post('/', authenticate, validateBody(orderSchema), createOrder);
router.get('/', authenticate, getOrders);
router.get('/stats', authenticate, authorize('admin'), getOrderStats);
router.get('/:id', authenticate, getOrderById);
router.put('/:id/status', authenticate, authorize('admin'), updateOrderStatus);
router.patch('/:id/cancel', authenticate, cancelOrder);

export default router;
