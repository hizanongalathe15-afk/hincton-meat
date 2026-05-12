import { Router } from 'express';
import {
  createDelivery,
  updateDeliveryStatus,
  updateLocation,
  getDeliveries,
  getDeliveryById,
  addCustomerRating
} from '../controllers/deliveryController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, authorize('admin'), createDelivery);
router.get('/', authenticate, getDeliveries);
router.get('/:id', authenticate, getDeliveryById);
router.put('/:id/status', authenticate, authorize('admin'), updateDeliveryStatus);
router.patch('/:id/location', authenticate, authorize('admin'), updateLocation);
router.patch('/:id/rating', authenticate, addCustomerRating);

export default router;
