import { Router } from 'express';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getFeaturedProducts,
  getProductsByCategory,
  updateStock,
  searchProducts
} from '../controllers/productController';
import { authenticate, authorize } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';
import { validateBody, productSchema } from '../middleware/validation';

const router = Router();

router.get('/', getAllProducts);
router.get('/featured', getFeaturedProducts);
router.get('/search', searchProducts);
router.get('/category/:category', getProductsByCategory);
router.get('/:id', getProductById);

router.post('/', authenticate, requireAdmin, validateBody(productSchema), createProduct);
router.put('/:id', authenticate, requireAdmin, validateBody(productSchema), updateProduct);
router.delete('/:id', authenticate, requireAdmin, deleteProduct);
router.patch('/:id/stock', authenticate, requireAdmin, updateStock);

export default router;
