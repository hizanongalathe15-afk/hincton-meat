"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../controllers");
const middleware_1 = require("../middleware");
const router = (0, express_1.Router)();
// Public category routes - rate limited
router.get('/', middleware_1.apiRateLimiter, controllers_1.getCategories);
router.get('/featured', middleware_1.apiRateLimiter, controllers_1.getFeaturedCategories);
router.get('/root', middleware_1.apiRateLimiter, controllers_1.getRootCategories);
router.get('/search', middleware_1.apiRateLimiter, controllers_1.getCategories);
router.get('/:slug', middleware_1.apiRateLimiter, controllers_1.getCategoryBySlug);
// Protected category routes - require authentication
router.use(middleware_1.authenticate);
router.get('/:id', middleware_1.apiRateLimiter, controllers_1.getCategory);
router.get('/:id/products', middleware_1.apiRateLimiter, controllers_1.getCategoryProducts);
// Admin category routes - require admin
router.use(middleware_1.requireAdmin);
router.post('/', middleware_1.authRateLimiter, controllers_1.createCategory);
router.put('/:id', middleware_1.authRateLimiter, controllers_1.updateCategory);
router.delete('/:id', middleware_1.authRateLimiter, controllers_1.deleteCategory);
exports.default = router;
//# sourceMappingURL=categories.js.map