"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../controllers");
const middleware_1 = require("../middleware");
const router = (0, express_1.Router)();
// Protected dashboard routes - require admin authentication
router.use(middleware_1.authenticate);
router.use(middleware_1.requireAdmin);
// Dashboard overview
router.get('/stats/overview', middleware_1.apiRateLimiter, controllers_1.DashboardController.getDashboardStats);
router.get('/stats/sales', middleware_1.apiRateLimiter, controllers_1.DashboardController.getSalesOverview);
router.get('/stats/users', middleware_1.apiRateLimiter, controllers_1.DashboardController.getUserGrowth);
router.get('/stats/products', middleware_1.apiRateLimiter, controllers_1.DashboardController.getProductPerformance);
router.get('/stats/financial', middleware_1.apiRateLimiter, controllers_1.DashboardController.getFinancialSummary);
router.get('/activity/recent', middleware_1.apiRateLimiter, controllers_1.DashboardController.getRecentActivity);
exports.default = router;
//# sourceMappingURL=dashboard.js.map