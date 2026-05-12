"use strict";
// Placeholder to satisfy routes compilation until models/controllers are aligned.
// Review routes currently reference these handlers.
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReviewStats = exports.reportReview = exports.markReviewHelpful = exports.deleteReview = exports.updateReview = exports.createReview = exports.getReview = exports.getProductReviews = exports.getUserReviews = exports.getReviews = void 0;
const middleware_1 = require("../middleware");
exports.getReviews = (0, middleware_1.asyncHandler)(async (_req, res) => {
    res.json({ success: true, data: [] });
});
exports.getUserReviews = (0, middleware_1.asyncHandler)(async (_req, res) => {
    res.json({ success: true, data: [] });
});
exports.getProductReviews = (0, middleware_1.asyncHandler)(async (_req, res) => {
    res.json({ success: true, data: [] });
});
exports.getReview = (0, middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    if (!id)
        throw new middleware_1.NotFoundError('Review', id);
    res.json({ success: true, data: null });
});
exports.createReview = (0, middleware_1.asyncHandler)(async (_req, res) => {
    res.status(201).json({ success: true, data: {} });
});
exports.updateReview = (0, middleware_1.asyncHandler)(async (_req, res) => {
    res.json({ success: true, data: {} });
});
exports.deleteReview = (0, middleware_1.asyncHandler)(async (_req, res) => {
    res.json({ success: true, data: {} });
});
exports.markReviewHelpful = (0, middleware_1.asyncHandler)(async (_req, res) => {
    res.json({ success: true, data: { helpful: true } });
});
exports.reportReview = (0, middleware_1.asyncHandler)(async (_req, res) => {
    res.json({ success: true, data: { reported: true } });
});
exports.getReviewStats = (0, middleware_1.asyncHandler)(async (_req, res) => {
    res.json({ success: true, data: {} });
});
//# sourceMappingURL=reviewController.js.map