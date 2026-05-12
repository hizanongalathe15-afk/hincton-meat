"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.confirmPayment = exports.verifyPayment = exports.getPaymentFailedPage = exports.getPaymentSuccessPage = exports.getPaymentStats = exports.getMpesaPayments = exports.failPayment = exports.completePayment = exports.updatePaymentStatus = exports.createPayment = exports.getPaymentsByUser = exports.getPaymentsByOrder = exports.getPayment = exports.getPayments = exports.processMpesaWebhook = void 0;
// NOTE: This file is currently failing TypeScript compilation because the router expects
// handlers that are not exported consistently.
//
// This placeholder exports the missing handlers referenced by `src/routes/payments.ts`.
// Replace with real implementations aligned to `PaymentModel`.
const middleware_1 = require("../middleware");
exports.processMpesaWebhook = (0, middleware_1.asyncHandler)(async (_req, res) => {
    res.json({ success: true, data: { received: true } });
});
// Named exports expected by `src/controllers/index.ts`
exports.getPayments = (0, middleware_1.asyncHandler)(async (_req, res) => {
    res.json({ success: true, data: [] });
});
exports.getPayment = (0, middleware_1.asyncHandler)(async (_req, res) => {
    res.json({ success: true, data: null });
});
exports.getPaymentsByOrder = (0, middleware_1.asyncHandler)(async (_req, res) => {
    res.json({ success: true, data: [] });
});
exports.getPaymentsByUser = (0, middleware_1.asyncHandler)(async (_req, res) => {
    res.json({ success: true, data: [] });
});
exports.createPayment = (0, middleware_1.asyncHandler)(async (_req, res) => {
    res.status(201).json({ success: true, data: {} });
});
exports.updatePaymentStatus = (0, middleware_1.asyncHandler)(async (_req, res) => {
    res.json({ success: true, data: {} });
});
exports.completePayment = (0, middleware_1.asyncHandler)(async (_req, res) => {
    res.json({ success: true, data: {} });
});
exports.failPayment = (0, middleware_1.asyncHandler)(async (_req, res) => {
    res.json({ success: true, data: {} });
});
exports.getMpesaPayments = (0, middleware_1.asyncHandler)(async (_req, res) => {
    res.json({ success: true, data: [], pagination: { total: 0, pages: 0, page: 1, limit: 20 } });
});
exports.getPaymentStats = (0, middleware_1.asyncHandler)(async (_req, res) => {
    res.json({ success: true, data: {} });
});
exports.getPaymentSuccessPage = (0, middleware_1.asyncHandler)(async (_req, res) => {
    res.json({ success: true, data: { status: 'success' } });
});
exports.getPaymentFailedPage = (0, middleware_1.asyncHandler)(async (_req, res) => {
    res.json({ success: true, data: { status: 'failed' } });
});
exports.verifyPayment = (0, middleware_1.asyncHandler)(async (_req, res) => {
    res.json({ success: true, data: { verified: true } });
});
exports.confirmPayment = (0, middleware_1.asyncHandler)(async (_req, res) => {
    res.json({ success: true, data: { confirmed: true } });
});
//# sourceMappingURL=paymentController.js.map