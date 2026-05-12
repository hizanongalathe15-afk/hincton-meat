"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../controllers");
const middleware_1 = require("../middleware");
const router = (0, express_1.Router)();
// Public coupon routes - rate limited
router.get('/active', middleware_1.apiRateLimiter, controllers_1.CouponController.getActiveCoupons);
router.get('/validate', middleware_1.authRateLimiter, controllers_1.CouponController.validateCoupon);
router.get('/code/:code', middleware_1.apiRateLimiter, controllers_1.CouponController.getCouponByCode);
// Protected coupon routes - require authentication
router.use(middleware_1.authenticate);
router.get('/', middleware_1.apiRateLimiter, controllers_1.CouponController.getCoupons);
router.get('/:id', middleware_1.apiRateLimiter, controllers_1.CouponController.getCoupon);
// Admin coupon routes - require admin
router.use(middleware_1.requireAdmin);
router.post('/', middleware_1.authRateLimiter, controllers_1.CouponController.createCoupon);
router.put('/:id', middleware_1.authRateLimiter, controllers_1.CouponController.updateCoupon);
router.delete('/:id', middleware_1.authRateLimiter, controllers_1.CouponController.deleteCoupon);
router.get('/stats', middleware_1.apiRateLimiter, controllers_1.CouponController.getCouponStats);
exports.default = router;
//# sourceMappingURL=coupons.js.map