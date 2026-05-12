"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const wishlistController_1 = require("../controllers/wishlistController");
const router = express_1.default.Router();
// List wishlist items
router.get('/', wishlistController_1.getWishlist);
// Add product to wishlist
router.post('/add', wishlistController_1.addToWishlist);
// Remove product from wishlist
router.delete('/:productId', wishlistController_1.removeFromWishlist);
// Move multiple wishlist items to cart
router.post('/move-to-cart', wishlistController_1.moveWishlistToCart);
// Optional helpers
router.post('/check-status', wishlistController_1.checkWishlistStatus);
router.delete('/clear', wishlistController_1.clearWishlist);
exports.default = router;
//# sourceMappingURL=wishlist.js.map