"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const productController_1 = require("../controllers/productController");
const auth_1 = require("../middleware/auth");
const admin_1 = require("../middleware/admin");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
router.get('/', productController_1.getAllProducts);
router.get('/featured', productController_1.getFeaturedProducts);
router.get('/search', productController_1.searchProducts);
router.get('/category/:category', productController_1.getProductsByCategory);
router.get('/:id', productController_1.getProductById);
router.post('/', auth_1.authenticate, admin_1.requireAdmin, (0, validation_1.validateBody)(validation_1.productSchema), productController_1.createProduct);
router.put('/:id', auth_1.authenticate, admin_1.requireAdmin, (0, validation_1.validateBody)(validation_1.productSchema), productController_1.updateProduct);
router.delete('/:id', auth_1.authenticate, admin_1.requireAdmin, productController_1.deleteProduct);
router.patch('/:id/stock', auth_1.authenticate, admin_1.requireAdmin, productController_1.updateStock);
exports.default = router;
//# sourceMappingURL=productRoutes.js.map