"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../controllers");
const middleware_1 = require("../middleware");
const router = (0, express_1.Router)();
// Public payment routes (for webhooks, callbacks) - strict rate limiting
router.post('/webhook/mpesa', middleware_1.passwordResetRateLimiter, controllers_1.PaymentController.processMpesaWebhook);
router.get('/success/:transactionId', middleware_1.authRateLimiter, controllers_1.PaymentController.getPaymentSuccessPage);
router.get('/failed/:transactionId', middleware_1.authRateLimiter, controllers_1.PaymentController.getPaymentFailedPage);
// Payment verification routes - public but rate limited
router.get('/verify/:reference', middleware_1.authRateLimiter, controllers_1.PaymentController.verifyPayment);
router.post('/verify/:reference', middleware_1.authRateLimiter, controllers_1.PaymentController.confirmPayment);
// Protected payment routes
router.use(middleware_1.authenticate);
// User payment routes
router.get('/', middleware_1.authRateLimiter, controllers_1.PaymentController.getPaymentsByUser);
router.get('/:id', controllers_1.PaymentController.getPayment);
router.post('/', middleware_1.authRateLimiter, controllers_1.PaymentController.createPayment);
router.put('/:id/status', middleware_1.authRateLimiter, controllers_1.PaymentController.updatePaymentStatus);
router.post('/:id/complete', middleware_1.authRateLimiter, controllers_1.PaymentController.completePayment);
router.post('/:id/fail', middleware_1.authRateLimiter, controllers_1.PaymentController.failPayment);
// Admin payment routes
router.use(middleware_1.requireAdmin);
router.get('/admin/all', middleware_1.apiRateLimiter, controllers_1.PaymentController.getPayments);
router.get('/admin/stats', middleware_1.apiRateLimiter, controllers_1.PaymentController.getPaymentStats);
router.get('/admin/mpesa', middleware_1.apiRateLimiter, controllers_1.PaymentController.getMpesaPayments);
router.get('/admin/order/:orderId', middleware_1.apiRateLimiter, controllers_1.PaymentController.getPaymentsByOrder);
// Payment verification routes
router.get('/verify/:reference', controllers_1.PaymentController.verifyPayment);
router.post('/verify/:reference', controllers_1.PaymentController.confirmPayment);
exports.default = router;
//# sourceMappingURL=payments.js.map