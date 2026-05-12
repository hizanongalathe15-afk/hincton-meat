// User Controllers
export {
  getProfile,
  updateProfile,
  changePassword,
  getUsers,
  getUser,
  updateUser,
  deactivateUser,
  activateUser,
  deleteUser,
  getUserStats,
  createAdminUser,
  blockUser,
  unblockUser,
  changeUserPassword,
  deleteUserAccount
} from './userController'

// User Session Controllers
export {
  getOnlineUsers,
  getOfflineUsers,
  updateUserOnlineStatus,
  markUserOffline,
  trackUserActivity,
  getRealTimeUserStats,
  cleanupOldSessions,
  getUserSessionDetails,
  getOnlineUserCount,
  getUserStats as getSessionStats
} from './userSessionController'

// Product Controllers
export {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getFeaturedProducts,
  getProductsByCategory,
  updateStock,
  searchProducts as searchProductsController
} from './productController'

// Category Controllers
export {
  getCategories,
  getCategory,
  getCategoryBySlug,
  getRootCategories,
  getFeaturedCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryProducts
} from './categoryController'

// Order Controllers
export {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  cancelOrder,
  getOrderStats
} from './orderController'

// Cart Controllers
export {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  applyCoupon as applyCartCoupon,
  removeCoupon,
  updateShippingInfo,
  getCartSummary
} from './cartController'

// Payment Controllers
export {
  getPayments,
  getPayment,
  getPaymentsByOrder,
  getPaymentsByUser,
  createPayment,
  updatePaymentStatus,
  completePayment,
  failPayment,
  getMpesaPayments,
  getPaymentStats
} from './paymentController'

// Subscription Controllers
export {
  getSubscriptions,
  getSubscription,
  getUserSubscription,
  createSubscription,
  updateSubscription,
  cancelSubscription,
  pauseSubscription,
  resumeSubscription,
  createDelivery,
  updateDelivery,
  markDeliveryDelivered,
  getSubscriptionStats
} from './subscriptionController'

// Build namespace-style exports expected by routes: `CouponController.getCoupons`, etc.
// These are re-exported as named constants to match `import { CouponController } from '../controllers'`.

import * as CouponController from './couponController'
import * as DashboardController from './dashboardController'
import * as FileUploadController from './fileUploadController'
import * as PaymentController from './paymentController'
import * as ReviewController from './reviewController'
import * as SearchController from './searchController'
import * as UserController from './userController'
import * as UserSessionController from './userSessionController'

export {
  CouponController,
  DashboardController,
  FileUploadController,
  PaymentController,
  ReviewController,
  SearchController,
  UserController,
  UserSessionController
}

// Keep existing granular exports for any parts of the codebase that use them.
// Coupon Controllers
export {
  getCoupons,
  getCoupon,
  getCouponByCode,
  getActiveCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
  applyCoupon,
  getCouponStats
} from './couponController'

// Search Controllers
export {
  searchProducts,
  searchCategories,
  getSearchSuggestions,
  getPopularSearches,
  getFilteredProducts,
  getAutocompleteSuggestions,
  advancedSearch
} from './searchController'

// Dashboard Controllers
export {
  getDashboardStats,
  getSalesOverview,
  getUserGrowth,
  getProductPerformance,
  getRecentActivity,
  getFinancialSummary
} from './dashboardController'

// File Upload Controllers
export {
  uploadImages,
  uploadDocuments,
  uploadProductImages,
  validateImage,
  validateDocument,
  deleteFile,
  getFile
} from './fileUploadController'

// Auth Controllers
export {
  register,
  login,
  getProfile as getAuthProfile,
  updateProfile as updateAuthProfile,
  changePassword as changeAuthPassword
} from './authController'

// Review Controllers
export {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  markReviewHelpful,
  getUserReviews
} from './reviewController'


// Wishlist Controllers
export {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  checkWishlistStatus,
  clearWishlist,
  moveWishlistToCart
} from './wishlistController'

// Notification Controllers
export {
  getNotifications,
  createNotification,
  markAsRead as markNotificationRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
  createOrderNotification,
  createPaymentNotification,
  createProductNotification,
  createMessageNotification,
  createSystemNotification
} from './notificationController'

// Analytics Controllers
export {
  getDashboardStats as getAnalyticsDashboardStats,
  getSalesAnalytics,
  getProductAnalytics,
  getCustomerAnalytics,
  getOrderAnalytics
} from './analyticsController'

// Delivery Controllers
export {
  createDelivery as createOrderDelivery,
  updateDeliveryStatus,
  updateLocation,
  getDeliveries,
  getDeliveryById,
  addCustomerRating
} from './deliveryController'

// Message Controllers
export {
  getMessages,
  sendMessage,
  getConversations,
  markAsRead as markMessageRead,
  deleteMessage
} from './messageController'

// M-Pesa Controllers
export {
  initiateSTKPush,
  mpesaCallback,
  checkTransactionStatus,
  getUserTransactions
} from './mpesaController'

// Help/Support Controllers
export {
  createHelpTicket,
  getHelpTickets,
  getHelpTicket,
  updateHelpTicket,
  closeHelpTicket,
  getAllHelpTickets,
  assignHelpTicket,
  updateTicketStatus
} from './helpController'
