"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../controllers");
const middleware_1 = require("../middleware");
const reviewsController = __importStar(require("../controllers/reviewsController"));
const router = (0, express_1.Router)();
// Public review routes
router.get('/product/:productId', middleware_1.apiRateLimiter, controllers_1.ReviewController.getProductReviews);
// Protected review routes
router.use(middleware_1.authenticate);
// New buyer-specific review endpoints
router.get('/my', middleware_1.apiRateLimiter, reviewsController.getMyReviews);
router.get('/to-review', middleware_1.apiRateLimiter, reviewsController.getProductsToReview);
router.post('/', middleware_1.authRateLimiter, reviewsController.createReview);
router.put('/:id', middleware_1.authRateLimiter, reviewsController.updateReview);
router.delete('/:id', middleware_1.authRateLimiter, reviewsController.deleteReview);
router.post('/:id/helpful', middleware_1.authRateLimiter, reviewsController.markHelpful);
router.get('/user', middleware_1.apiRateLimiter, controllers_1.ReviewController.getUserReviews);
router.get('/', middleware_1.apiRateLimiter, controllers_1.ReviewController.getReviews);
router.get('/:id', middleware_1.apiRateLimiter, controllers_1.ReviewController.getReview);
router.post('/', middleware_1.authRateLimiter, controllers_1.ReviewController.createReview);
router.put('/:id', middleware_1.authRateLimiter, controllers_1.ReviewController.updateReview);
router.delete('/:id', middleware_1.authRateLimiter, controllers_1.ReviewController.deleteReview);
router.post('/:id/report', middleware_1.authRateLimiter, controllers_1.ReviewController.reportReview);
// Admin review routes
router.use(middleware_1.requireAdmin);
router.get('/stats/overview', middleware_1.apiRateLimiter, controllers_1.ReviewController.getReviewStats);
exports.default = router;
//# sourceMappingURL=reviews.js.map