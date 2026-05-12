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
exports.getCart = exports.getOrderStats = exports.cancelOrder = exports.updateOrderStatus = exports.createOrder = exports.getOrderById = exports.getOrders = exports.getCategoryProducts = exports.deleteCategory = exports.updateCategory = exports.createCategory = exports.getFeaturedCategories = exports.getRootCategories = exports.getCategoryBySlug = exports.getCategory = exports.getCategories = exports.searchProductsController = exports.updateStock = exports.getProductsByCategory = exports.getFeaturedProducts = exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.getProductById = exports.getAllProducts = exports.getSessionStats = exports.getOnlineUserCount = exports.getUserSessionDetails = exports.cleanupOldSessions = exports.getRealTimeUserStats = exports.trackUserActivity = exports.markUserOffline = exports.updateUserOnlineStatus = exports.getOfflineUsers = exports.getOnlineUsers = exports.deleteUserAccount = exports.changeUserPassword = exports.unblockUser = exports.blockUser = exports.createAdminUser = exports.getUserStats = exports.deleteUser = exports.activateUser = exports.deactivateUser = exports.updateUser = exports.getUser = exports.getUsers = exports.changePassword = exports.updateProfile = exports.getProfile = void 0;
exports.searchCategories = exports.searchProducts = exports.getCouponStats = exports.applyCoupon = exports.validateCoupon = exports.deleteCoupon = exports.updateCoupon = exports.createCoupon = exports.getActiveCoupons = exports.getCouponByCode = exports.getCoupon = exports.getCoupons = exports.UserSessionController = exports.UserController = exports.SearchController = exports.ReviewController = exports.PaymentController = exports.FileUploadController = exports.DashboardController = exports.CouponController = exports.getSubscriptionStats = exports.markDeliveryDelivered = exports.updateDelivery = exports.createDelivery = exports.resumeSubscription = exports.pauseSubscription = exports.cancelSubscription = exports.updateSubscription = exports.createSubscription = exports.getUserSubscription = exports.getSubscription = exports.getSubscriptions = exports.getPaymentStats = exports.getMpesaPayments = exports.failPayment = exports.completePayment = exports.updatePaymentStatus = exports.createPayment = exports.getPaymentsByUser = exports.getPaymentsByOrder = exports.getPayment = exports.getPayments = exports.getCartSummary = exports.updateShippingInfo = exports.removeCoupon = exports.applyCartCoupon = exports.clearCart = exports.removeFromCart = exports.updateCartItem = exports.addToCart = void 0;
exports.getCustomerAnalytics = exports.getProductAnalytics = exports.getSalesAnalytics = exports.getAnalyticsDashboardStats = exports.createSystemNotification = exports.createMessageNotification = exports.createProductNotification = exports.createPaymentNotification = exports.createOrderNotification = exports.getUnreadCount = exports.deleteNotification = exports.markAllAsRead = exports.markNotificationRead = exports.createNotification = exports.getNotifications = exports.moveWishlistToCart = exports.clearWishlist = exports.checkWishlistStatus = exports.removeFromWishlist = exports.addToWishlist = exports.getWishlist = exports.getUserReviews = exports.markReviewHelpful = exports.deleteReview = exports.updateReview = exports.createReview = exports.getProductReviews = exports.changeAuthPassword = exports.updateAuthProfile = exports.getAuthProfile = exports.login = exports.register = exports.getFile = exports.deleteFile = exports.validateDocument = exports.validateImage = exports.uploadProductImages = exports.uploadDocuments = exports.uploadImages = exports.getFinancialSummary = exports.getRecentActivity = exports.getProductPerformance = exports.getUserGrowth = exports.getSalesOverview = exports.getDashboardStats = exports.advancedSearch = exports.getAutocompleteSuggestions = exports.getFilteredProducts = exports.getPopularSearches = exports.getSearchSuggestions = void 0;
exports.updateTicketStatus = exports.assignHelpTicket = exports.getAllHelpTickets = exports.closeHelpTicket = exports.updateHelpTicket = exports.getHelpTicket = exports.getHelpTickets = exports.createHelpTicket = exports.getUserTransactions = exports.checkTransactionStatus = exports.mpesaCallback = exports.initiateSTKPush = exports.deleteMessage = exports.markMessageRead = exports.getConversations = exports.sendMessage = exports.getMessages = exports.addCustomerRating = exports.getDeliveryById = exports.getDeliveries = exports.updateLocation = exports.updateDeliveryStatus = exports.createOrderDelivery = exports.getOrderAnalytics = void 0;
// User Controllers
var userController_1 = require("./userController");
Object.defineProperty(exports, "getProfile", { enumerable: true, get: function () { return userController_1.getProfile; } });
Object.defineProperty(exports, "updateProfile", { enumerable: true, get: function () { return userController_1.updateProfile; } });
Object.defineProperty(exports, "changePassword", { enumerable: true, get: function () { return userController_1.changePassword; } });
Object.defineProperty(exports, "getUsers", { enumerable: true, get: function () { return userController_1.getUsers; } });
Object.defineProperty(exports, "getUser", { enumerable: true, get: function () { return userController_1.getUser; } });
Object.defineProperty(exports, "updateUser", { enumerable: true, get: function () { return userController_1.updateUser; } });
Object.defineProperty(exports, "deactivateUser", { enumerable: true, get: function () { return userController_1.deactivateUser; } });
Object.defineProperty(exports, "activateUser", { enumerable: true, get: function () { return userController_1.activateUser; } });
Object.defineProperty(exports, "deleteUser", { enumerable: true, get: function () { return userController_1.deleteUser; } });
Object.defineProperty(exports, "getUserStats", { enumerable: true, get: function () { return userController_1.getUserStats; } });
Object.defineProperty(exports, "createAdminUser", { enumerable: true, get: function () { return userController_1.createAdminUser; } });
Object.defineProperty(exports, "blockUser", { enumerable: true, get: function () { return userController_1.blockUser; } });
Object.defineProperty(exports, "unblockUser", { enumerable: true, get: function () { return userController_1.unblockUser; } });
Object.defineProperty(exports, "changeUserPassword", { enumerable: true, get: function () { return userController_1.changeUserPassword; } });
Object.defineProperty(exports, "deleteUserAccount", { enumerable: true, get: function () { return userController_1.deleteUserAccount; } });
// User Session Controllers
var userSessionController_1 = require("./userSessionController");
Object.defineProperty(exports, "getOnlineUsers", { enumerable: true, get: function () { return userSessionController_1.getOnlineUsers; } });
Object.defineProperty(exports, "getOfflineUsers", { enumerable: true, get: function () { return userSessionController_1.getOfflineUsers; } });
Object.defineProperty(exports, "updateUserOnlineStatus", { enumerable: true, get: function () { return userSessionController_1.updateUserOnlineStatus; } });
Object.defineProperty(exports, "markUserOffline", { enumerable: true, get: function () { return userSessionController_1.markUserOffline; } });
Object.defineProperty(exports, "trackUserActivity", { enumerable: true, get: function () { return userSessionController_1.trackUserActivity; } });
Object.defineProperty(exports, "getRealTimeUserStats", { enumerable: true, get: function () { return userSessionController_1.getRealTimeUserStats; } });
Object.defineProperty(exports, "cleanupOldSessions", { enumerable: true, get: function () { return userSessionController_1.cleanupOldSessions; } });
Object.defineProperty(exports, "getUserSessionDetails", { enumerable: true, get: function () { return userSessionController_1.getUserSessionDetails; } });
Object.defineProperty(exports, "getOnlineUserCount", { enumerable: true, get: function () { return userSessionController_1.getOnlineUserCount; } });
Object.defineProperty(exports, "getSessionStats", { enumerable: true, get: function () { return userSessionController_1.getUserStats; } });
// Product Controllers
var productController_1 = require("./productController");
Object.defineProperty(exports, "getAllProducts", { enumerable: true, get: function () { return productController_1.getAllProducts; } });
Object.defineProperty(exports, "getProductById", { enumerable: true, get: function () { return productController_1.getProductById; } });
Object.defineProperty(exports, "createProduct", { enumerable: true, get: function () { return productController_1.createProduct; } });
Object.defineProperty(exports, "updateProduct", { enumerable: true, get: function () { return productController_1.updateProduct; } });
Object.defineProperty(exports, "deleteProduct", { enumerable: true, get: function () { return productController_1.deleteProduct; } });
Object.defineProperty(exports, "getFeaturedProducts", { enumerable: true, get: function () { return productController_1.getFeaturedProducts; } });
Object.defineProperty(exports, "getProductsByCategory", { enumerable: true, get: function () { return productController_1.getProductsByCategory; } });
Object.defineProperty(exports, "updateStock", { enumerable: true, get: function () { return productController_1.updateStock; } });
Object.defineProperty(exports, "searchProductsController", { enumerable: true, get: function () { return productController_1.searchProducts; } });
// Category Controllers
var categoryController_1 = require("./categoryController");
Object.defineProperty(exports, "getCategories", { enumerable: true, get: function () { return categoryController_1.getCategories; } });
Object.defineProperty(exports, "getCategory", { enumerable: true, get: function () { return categoryController_1.getCategory; } });
Object.defineProperty(exports, "getCategoryBySlug", { enumerable: true, get: function () { return categoryController_1.getCategoryBySlug; } });
Object.defineProperty(exports, "getRootCategories", { enumerable: true, get: function () { return categoryController_1.getRootCategories; } });
Object.defineProperty(exports, "getFeaturedCategories", { enumerable: true, get: function () { return categoryController_1.getFeaturedCategories; } });
Object.defineProperty(exports, "createCategory", { enumerable: true, get: function () { return categoryController_1.createCategory; } });
Object.defineProperty(exports, "updateCategory", { enumerable: true, get: function () { return categoryController_1.updateCategory; } });
Object.defineProperty(exports, "deleteCategory", { enumerable: true, get: function () { return categoryController_1.deleteCategory; } });
Object.defineProperty(exports, "getCategoryProducts", { enumerable: true, get: function () { return categoryController_1.getCategoryProducts; } });
// Order Controllers
var orderController_1 = require("./orderController");
Object.defineProperty(exports, "getOrders", { enumerable: true, get: function () { return orderController_1.getOrders; } });
Object.defineProperty(exports, "getOrderById", { enumerable: true, get: function () { return orderController_1.getOrderById; } });
Object.defineProperty(exports, "createOrder", { enumerable: true, get: function () { return orderController_1.createOrder; } });
Object.defineProperty(exports, "updateOrderStatus", { enumerable: true, get: function () { return orderController_1.updateOrderStatus; } });
Object.defineProperty(exports, "cancelOrder", { enumerable: true, get: function () { return orderController_1.cancelOrder; } });
Object.defineProperty(exports, "getOrderStats", { enumerable: true, get: function () { return orderController_1.getOrderStats; } });
// Cart Controllers
var cartController_1 = require("./cartController");
Object.defineProperty(exports, "getCart", { enumerable: true, get: function () { return cartController_1.getCart; } });
Object.defineProperty(exports, "addToCart", { enumerable: true, get: function () { return cartController_1.addToCart; } });
Object.defineProperty(exports, "updateCartItem", { enumerable: true, get: function () { return cartController_1.updateCartItem; } });
Object.defineProperty(exports, "removeFromCart", { enumerable: true, get: function () { return cartController_1.removeFromCart; } });
Object.defineProperty(exports, "clearCart", { enumerable: true, get: function () { return cartController_1.clearCart; } });
Object.defineProperty(exports, "applyCartCoupon", { enumerable: true, get: function () { return cartController_1.applyCoupon; } });
Object.defineProperty(exports, "removeCoupon", { enumerable: true, get: function () { return cartController_1.removeCoupon; } });
Object.defineProperty(exports, "updateShippingInfo", { enumerable: true, get: function () { return cartController_1.updateShippingInfo; } });
Object.defineProperty(exports, "getCartSummary", { enumerable: true, get: function () { return cartController_1.getCartSummary; } });
// Payment Controllers
var paymentController_1 = require("./paymentController");
Object.defineProperty(exports, "getPayments", { enumerable: true, get: function () { return paymentController_1.getPayments; } });
Object.defineProperty(exports, "getPayment", { enumerable: true, get: function () { return paymentController_1.getPayment; } });
Object.defineProperty(exports, "getPaymentsByOrder", { enumerable: true, get: function () { return paymentController_1.getPaymentsByOrder; } });
Object.defineProperty(exports, "getPaymentsByUser", { enumerable: true, get: function () { return paymentController_1.getPaymentsByUser; } });
Object.defineProperty(exports, "createPayment", { enumerable: true, get: function () { return paymentController_1.createPayment; } });
Object.defineProperty(exports, "updatePaymentStatus", { enumerable: true, get: function () { return paymentController_1.updatePaymentStatus; } });
Object.defineProperty(exports, "completePayment", { enumerable: true, get: function () { return paymentController_1.completePayment; } });
Object.defineProperty(exports, "failPayment", { enumerable: true, get: function () { return paymentController_1.failPayment; } });
Object.defineProperty(exports, "getMpesaPayments", { enumerable: true, get: function () { return paymentController_1.getMpesaPayments; } });
Object.defineProperty(exports, "getPaymentStats", { enumerable: true, get: function () { return paymentController_1.getPaymentStats; } });
// Subscription Controllers
var subscriptionController_1 = require("./subscriptionController");
Object.defineProperty(exports, "getSubscriptions", { enumerable: true, get: function () { return subscriptionController_1.getSubscriptions; } });
Object.defineProperty(exports, "getSubscription", { enumerable: true, get: function () { return subscriptionController_1.getSubscription; } });
Object.defineProperty(exports, "getUserSubscription", { enumerable: true, get: function () { return subscriptionController_1.getUserSubscription; } });
Object.defineProperty(exports, "createSubscription", { enumerable: true, get: function () { return subscriptionController_1.createSubscription; } });
Object.defineProperty(exports, "updateSubscription", { enumerable: true, get: function () { return subscriptionController_1.updateSubscription; } });
Object.defineProperty(exports, "cancelSubscription", { enumerable: true, get: function () { return subscriptionController_1.cancelSubscription; } });
Object.defineProperty(exports, "pauseSubscription", { enumerable: true, get: function () { return subscriptionController_1.pauseSubscription; } });
Object.defineProperty(exports, "resumeSubscription", { enumerable: true, get: function () { return subscriptionController_1.resumeSubscription; } });
Object.defineProperty(exports, "createDelivery", { enumerable: true, get: function () { return subscriptionController_1.createDelivery; } });
Object.defineProperty(exports, "updateDelivery", { enumerable: true, get: function () { return subscriptionController_1.updateDelivery; } });
Object.defineProperty(exports, "markDeliveryDelivered", { enumerable: true, get: function () { return subscriptionController_1.markDeliveryDelivered; } });
Object.defineProperty(exports, "getSubscriptionStats", { enumerable: true, get: function () { return subscriptionController_1.getSubscriptionStats; } });
// Build namespace-style exports expected by routes: `CouponController.getCoupons`, etc.
// These are re-exported as named constants to match `import { CouponController } from '../controllers'`.
const CouponController = __importStar(require("./couponController"));
exports.CouponController = CouponController;
const DashboardController = __importStar(require("./dashboardController"));
exports.DashboardController = DashboardController;
const FileUploadController = __importStar(require("./fileUploadController"));
exports.FileUploadController = FileUploadController;
const PaymentController = __importStar(require("./paymentController"));
exports.PaymentController = PaymentController;
const ReviewController = __importStar(require("./reviewController"));
exports.ReviewController = ReviewController;
const SearchController = __importStar(require("./searchController"));
exports.SearchController = SearchController;
const UserController = __importStar(require("./userController"));
exports.UserController = UserController;
const UserSessionController = __importStar(require("./userSessionController"));
exports.UserSessionController = UserSessionController;
// Keep existing granular exports for any parts of the codebase that use them.
// Coupon Controllers
var couponController_1 = require("./couponController");
Object.defineProperty(exports, "getCoupons", { enumerable: true, get: function () { return couponController_1.getCoupons; } });
Object.defineProperty(exports, "getCoupon", { enumerable: true, get: function () { return couponController_1.getCoupon; } });
Object.defineProperty(exports, "getCouponByCode", { enumerable: true, get: function () { return couponController_1.getCouponByCode; } });
Object.defineProperty(exports, "getActiveCoupons", { enumerable: true, get: function () { return couponController_1.getActiveCoupons; } });
Object.defineProperty(exports, "createCoupon", { enumerable: true, get: function () { return couponController_1.createCoupon; } });
Object.defineProperty(exports, "updateCoupon", { enumerable: true, get: function () { return couponController_1.updateCoupon; } });
Object.defineProperty(exports, "deleteCoupon", { enumerable: true, get: function () { return couponController_1.deleteCoupon; } });
Object.defineProperty(exports, "validateCoupon", { enumerable: true, get: function () { return couponController_1.validateCoupon; } });
Object.defineProperty(exports, "applyCoupon", { enumerable: true, get: function () { return couponController_1.applyCoupon; } });
Object.defineProperty(exports, "getCouponStats", { enumerable: true, get: function () { return couponController_1.getCouponStats; } });
// Search Controllers
var searchController_1 = require("./searchController");
Object.defineProperty(exports, "searchProducts", { enumerable: true, get: function () { return searchController_1.searchProducts; } });
Object.defineProperty(exports, "searchCategories", { enumerable: true, get: function () { return searchController_1.searchCategories; } });
Object.defineProperty(exports, "getSearchSuggestions", { enumerable: true, get: function () { return searchController_1.getSearchSuggestions; } });
Object.defineProperty(exports, "getPopularSearches", { enumerable: true, get: function () { return searchController_1.getPopularSearches; } });
Object.defineProperty(exports, "getFilteredProducts", { enumerable: true, get: function () { return searchController_1.getFilteredProducts; } });
Object.defineProperty(exports, "getAutocompleteSuggestions", { enumerable: true, get: function () { return searchController_1.getAutocompleteSuggestions; } });
Object.defineProperty(exports, "advancedSearch", { enumerable: true, get: function () { return searchController_1.advancedSearch; } });
// Dashboard Controllers
var dashboardController_1 = require("./dashboardController");
Object.defineProperty(exports, "getDashboardStats", { enumerable: true, get: function () { return dashboardController_1.getDashboardStats; } });
Object.defineProperty(exports, "getSalesOverview", { enumerable: true, get: function () { return dashboardController_1.getSalesOverview; } });
Object.defineProperty(exports, "getUserGrowth", { enumerable: true, get: function () { return dashboardController_1.getUserGrowth; } });
Object.defineProperty(exports, "getProductPerformance", { enumerable: true, get: function () { return dashboardController_1.getProductPerformance; } });
Object.defineProperty(exports, "getRecentActivity", { enumerable: true, get: function () { return dashboardController_1.getRecentActivity; } });
Object.defineProperty(exports, "getFinancialSummary", { enumerable: true, get: function () { return dashboardController_1.getFinancialSummary; } });
// File Upload Controllers
var fileUploadController_1 = require("./fileUploadController");
Object.defineProperty(exports, "uploadImages", { enumerable: true, get: function () { return fileUploadController_1.uploadImages; } });
Object.defineProperty(exports, "uploadDocuments", { enumerable: true, get: function () { return fileUploadController_1.uploadDocuments; } });
Object.defineProperty(exports, "uploadProductImages", { enumerable: true, get: function () { return fileUploadController_1.uploadProductImages; } });
Object.defineProperty(exports, "validateImage", { enumerable: true, get: function () { return fileUploadController_1.validateImage; } });
Object.defineProperty(exports, "validateDocument", { enumerable: true, get: function () { return fileUploadController_1.validateDocument; } });
Object.defineProperty(exports, "deleteFile", { enumerable: true, get: function () { return fileUploadController_1.deleteFile; } });
Object.defineProperty(exports, "getFile", { enumerable: true, get: function () { return fileUploadController_1.getFile; } });
// Auth Controllers
var authController_1 = require("./authController");
Object.defineProperty(exports, "register", { enumerable: true, get: function () { return authController_1.register; } });
Object.defineProperty(exports, "login", { enumerable: true, get: function () { return authController_1.login; } });
Object.defineProperty(exports, "getAuthProfile", { enumerable: true, get: function () { return authController_1.getProfile; } });
Object.defineProperty(exports, "updateAuthProfile", { enumerable: true, get: function () { return authController_1.updateProfile; } });
Object.defineProperty(exports, "changeAuthPassword", { enumerable: true, get: function () { return authController_1.changePassword; } });
// Review Controllers
var reviewController_1 = require("./reviewController");
Object.defineProperty(exports, "getProductReviews", { enumerable: true, get: function () { return reviewController_1.getProductReviews; } });
Object.defineProperty(exports, "createReview", { enumerable: true, get: function () { return reviewController_1.createReview; } });
Object.defineProperty(exports, "updateReview", { enumerable: true, get: function () { return reviewController_1.updateReview; } });
Object.defineProperty(exports, "deleteReview", { enumerable: true, get: function () { return reviewController_1.deleteReview; } });
Object.defineProperty(exports, "markReviewHelpful", { enumerable: true, get: function () { return reviewController_1.markReviewHelpful; } });
Object.defineProperty(exports, "getUserReviews", { enumerable: true, get: function () { return reviewController_1.getUserReviews; } });
// Wishlist Controllers
var wishlistController_1 = require("./wishlistController");
Object.defineProperty(exports, "getWishlist", { enumerable: true, get: function () { return wishlistController_1.getWishlist; } });
Object.defineProperty(exports, "addToWishlist", { enumerable: true, get: function () { return wishlistController_1.addToWishlist; } });
Object.defineProperty(exports, "removeFromWishlist", { enumerable: true, get: function () { return wishlistController_1.removeFromWishlist; } });
Object.defineProperty(exports, "checkWishlistStatus", { enumerable: true, get: function () { return wishlistController_1.checkWishlistStatus; } });
Object.defineProperty(exports, "clearWishlist", { enumerable: true, get: function () { return wishlistController_1.clearWishlist; } });
Object.defineProperty(exports, "moveWishlistToCart", { enumerable: true, get: function () { return wishlistController_1.moveWishlistToCart; } });
// Notification Controllers
var notificationController_1 = require("./notificationController");
Object.defineProperty(exports, "getNotifications", { enumerable: true, get: function () { return notificationController_1.getNotifications; } });
Object.defineProperty(exports, "createNotification", { enumerable: true, get: function () { return notificationController_1.createNotification; } });
Object.defineProperty(exports, "markNotificationRead", { enumerable: true, get: function () { return notificationController_1.markAsRead; } });
Object.defineProperty(exports, "markAllAsRead", { enumerable: true, get: function () { return notificationController_1.markAllAsRead; } });
Object.defineProperty(exports, "deleteNotification", { enumerable: true, get: function () { return notificationController_1.deleteNotification; } });
Object.defineProperty(exports, "getUnreadCount", { enumerable: true, get: function () { return notificationController_1.getUnreadCount; } });
Object.defineProperty(exports, "createOrderNotification", { enumerable: true, get: function () { return notificationController_1.createOrderNotification; } });
Object.defineProperty(exports, "createPaymentNotification", { enumerable: true, get: function () { return notificationController_1.createPaymentNotification; } });
Object.defineProperty(exports, "createProductNotification", { enumerable: true, get: function () { return notificationController_1.createProductNotification; } });
Object.defineProperty(exports, "createMessageNotification", { enumerable: true, get: function () { return notificationController_1.createMessageNotification; } });
Object.defineProperty(exports, "createSystemNotification", { enumerable: true, get: function () { return notificationController_1.createSystemNotification; } });
// Analytics Controllers
var analyticsController_1 = require("./analyticsController");
Object.defineProperty(exports, "getAnalyticsDashboardStats", { enumerable: true, get: function () { return analyticsController_1.getDashboardStats; } });
Object.defineProperty(exports, "getSalesAnalytics", { enumerable: true, get: function () { return analyticsController_1.getSalesAnalytics; } });
Object.defineProperty(exports, "getProductAnalytics", { enumerable: true, get: function () { return analyticsController_1.getProductAnalytics; } });
Object.defineProperty(exports, "getCustomerAnalytics", { enumerable: true, get: function () { return analyticsController_1.getCustomerAnalytics; } });
Object.defineProperty(exports, "getOrderAnalytics", { enumerable: true, get: function () { return analyticsController_1.getOrderAnalytics; } });
// Delivery Controllers
var deliveryController_1 = require("./deliveryController");
Object.defineProperty(exports, "createOrderDelivery", { enumerable: true, get: function () { return deliveryController_1.createDelivery; } });
Object.defineProperty(exports, "updateDeliveryStatus", { enumerable: true, get: function () { return deliveryController_1.updateDeliveryStatus; } });
Object.defineProperty(exports, "updateLocation", { enumerable: true, get: function () { return deliveryController_1.updateLocation; } });
Object.defineProperty(exports, "getDeliveries", { enumerable: true, get: function () { return deliveryController_1.getDeliveries; } });
Object.defineProperty(exports, "getDeliveryById", { enumerable: true, get: function () { return deliveryController_1.getDeliveryById; } });
Object.defineProperty(exports, "addCustomerRating", { enumerable: true, get: function () { return deliveryController_1.addCustomerRating; } });
// Message Controllers
var messageController_1 = require("./messageController");
Object.defineProperty(exports, "getMessages", { enumerable: true, get: function () { return messageController_1.getMessages; } });
Object.defineProperty(exports, "sendMessage", { enumerable: true, get: function () { return messageController_1.sendMessage; } });
Object.defineProperty(exports, "getConversations", { enumerable: true, get: function () { return messageController_1.getConversations; } });
Object.defineProperty(exports, "markMessageRead", { enumerable: true, get: function () { return messageController_1.markAsRead; } });
Object.defineProperty(exports, "deleteMessage", { enumerable: true, get: function () { return messageController_1.deleteMessage; } });
// M-Pesa Controllers
var mpesaController_1 = require("./mpesaController");
Object.defineProperty(exports, "initiateSTKPush", { enumerable: true, get: function () { return mpesaController_1.initiateSTKPush; } });
Object.defineProperty(exports, "mpesaCallback", { enumerable: true, get: function () { return mpesaController_1.mpesaCallback; } });
Object.defineProperty(exports, "checkTransactionStatus", { enumerable: true, get: function () { return mpesaController_1.checkTransactionStatus; } });
Object.defineProperty(exports, "getUserTransactions", { enumerable: true, get: function () { return mpesaController_1.getUserTransactions; } });
// Help/Support Controllers
var helpController_1 = require("./helpController");
Object.defineProperty(exports, "createHelpTicket", { enumerable: true, get: function () { return helpController_1.createHelpTicket; } });
Object.defineProperty(exports, "getHelpTickets", { enumerable: true, get: function () { return helpController_1.getHelpTickets; } });
Object.defineProperty(exports, "getHelpTicket", { enumerable: true, get: function () { return helpController_1.getHelpTicket; } });
Object.defineProperty(exports, "updateHelpTicket", { enumerable: true, get: function () { return helpController_1.updateHelpTicket; } });
Object.defineProperty(exports, "closeHelpTicket", { enumerable: true, get: function () { return helpController_1.closeHelpTicket; } });
Object.defineProperty(exports, "getAllHelpTickets", { enumerable: true, get: function () { return helpController_1.getAllHelpTickets; } });
Object.defineProperty(exports, "assignHelpTicket", { enumerable: true, get: function () { return helpController_1.assignHelpTicket; } });
Object.defineProperty(exports, "updateTicketStatus", { enumerable: true, get: function () { return helpController_1.updateTicketStatus; } });
//# sourceMappingURL=index.js.map