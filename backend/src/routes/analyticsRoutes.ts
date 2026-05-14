import { Router } from 'express';
import {
  getDashboardStats,
  getSalesAnalytics,
  getProductAnalytics,
  getCustomerAnalytics,
  getOrderAnalytics,
  getRealtimeVisits,
  trackClick,
  trackPageView
} from '../controllers/analyticsController';
import { authenticate, authorize, optionalAuthenticate } from '../middleware/auth';

const router = Router();

router.post('/click', optionalAuthenticate, trackClick);
router.post('/page-view', optionalAuthenticate, trackPageView);
router.get('/dashboard', authenticate, authorize('admin'), getDashboardStats);
router.get('/realtime-visits', authenticate, authorize('admin'), getRealtimeVisits);
router.get('/sales', authenticate, authorize('admin'), getSalesAnalytics);
router.get('/products', authenticate, authorize('admin'), getProductAnalytics);
router.get('/customers', authenticate, authorize('admin'), getCustomerAnalytics);
router.get('/orders', authenticate, authorize('admin'), getOrderAnalytics);

export default router;
