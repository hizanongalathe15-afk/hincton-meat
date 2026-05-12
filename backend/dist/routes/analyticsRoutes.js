"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const analyticsController_1 = require("../controllers/analyticsController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/dashboard', auth_1.authenticate, (0, auth_1.authorize)('admin'), analyticsController_1.getDashboardStats);
router.get('/sales', auth_1.authenticate, (0, auth_1.authorize)('admin'), analyticsController_1.getSalesAnalytics);
router.get('/products', auth_1.authenticate, (0, auth_1.authorize)('admin'), analyticsController_1.getProductAnalytics);
router.get('/customers', auth_1.authenticate, (0, auth_1.authorize)('admin'), analyticsController_1.getCustomerAnalytics);
router.get('/orders', auth_1.authenticate, (0, auth_1.authorize)('admin'), analyticsController_1.getOrderAnalytics);
exports.default = router;
//# sourceMappingURL=analyticsRoutes.js.map