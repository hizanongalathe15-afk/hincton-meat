import express from 'express'
import {
  addToWishlist,
  clearWishlist,
  checkWishlistStatus,
  getWishlist,
  moveWishlistToCart,
  removeFromWishlist,
} from '../controllers/wishlistController'

const router = express.Router()

// List wishlist items
router.get('/', getWishlist)

// Add product to wishlist
router.post('/add', addToWishlist)

// Remove product from wishlist
router.delete('/:productId', removeFromWishlist)

// Move multiple wishlist items to cart
router.post('/move-to-cart', moveWishlistToCart)

// Optional helpers
router.post('/check-status', checkWishlistStatus)
router.delete('/clear', clearWishlist)

export default router

