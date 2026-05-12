"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
// Import all routes
const auth_1 = __importDefault(require("./auth"));
const products_1 = __importDefault(require("./products"));
const orders_1 = __importDefault(require("./orders"));
const cart_1 = __importDefault(require("./cart"));
const wishlist_1 = __importDefault(require("./wishlist"));
const notifications_1 = __importDefault(require("./notifications"));
const analyticsRoutes_1 = __importDefault(require("./analyticsRoutes"));
const subscriptions_1 = __importDefault(require("./subscriptions"));
const mpesa_1 = __importDefault(require("./mpesa"));
const affiliates_1 = __importDefault(require("./affiliates"));
const promotions_1 = __importDefault(require("./promotions"));
const qrCodes_1 = __importDefault(require("./qrCodes"));
const returns_1 = __importDefault(require("./returns"));
const blog_1 = __importDefault(require("./blog"));
const chat_1 = __importDefault(require("./chat"));
const contentManagement_1 = __importDefault(require("./contentManagement"));
const adminDashboard_1 = __importDefault(require("./adminDashboard"));
const deliveryRoutes_1 = __importDefault(require("./deliveryRoutes"));
const messages_1 = __importDefault(require("./messages"));
// import messageRoutes from './message'
// import helpRoutes from './help'
// New routes we created
const categories_1 = __importDefault(require("./categories"));
const payments_1 = __importDefault(require("./payments"));
const coupons_1 = __importDefault(require("./coupons"));
const users_1 = __importDefault(require("./users"));
const search_1 = __importDefault(require("./search"));
const fileUpload_1 = __importDefault(require("./fileUpload"));
const dashboard_1 = __importDefault(require("./dashboard"));
const reviews_1 = __importDefault(require("./reviews"));
const userSessions_1 = __importDefault(require("./userSessions"));
const router = (0, express_1.Router)();
// API versioning
router.use('/api/v1', (req, res, next) => {
    ;
    req.apiVersion = 'v1';
    next();
});
// Route groups
router.use('/auth', auth_1.default);
router.use('/products', products_1.default);
router.use('/orders', orders_1.default);
router.use('/cart', cart_1.default);
router.use('/wishlist', wishlist_1.default);
router.use('/notifications', notifications_1.default);
router.use('/analytics', analyticsRoutes_1.default);
router.use('/subscriptions', subscriptions_1.default);
router.use('/payments/mpesa', mpesa_1.default);
router.use('/affiliates', affiliates_1.default);
router.use('/promotions', promotions_1.default);
router.use('/qr-codes', qrCodes_1.default);
router.use('/returns', returns_1.default);
router.use('/blog', blog_1.default);
router.use('/chat', chat_1.default);
router.use('/content', contentManagement_1.default);
router.use('/admin/dashboard', adminDashboard_1.default);
router.use('/deliveries', deliveryRoutes_1.default);
router.use('/messages', messages_1.default);
// router.use('/messages', messageRoutes)
// router.use('/help', helpRoutes)
// New route groups
router.use('/categories', categories_1.default);
router.use('/payments', payments_1.default);
router.use('/coupons', coupons_1.default);
router.use('/users', users_1.default);
router.use('/search', search_1.default);
router.use('/files', fileUpload_1.default);
router.use('/dashboard', dashboard_1.default);
router.use('/reviews', reviews_1.default);
router.use('/user-sessions', userSessions_1.default);
// Health check
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});
// API documentation
router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Hincton Meat API',
        version: '1.0.0',
        endpoints: {
            auth: '/api/v1/auth',
            products: '/api/v1/products',
            categories: '/api/v1/categories',
            orders: '/api/v1/orders',
            cart: '/api/v1/cart',
            wishlist: '/api/v1/wishlist',
            payments: '/api/v1/payments',
            coupons: '/api/v1/coupons',
            users: '/api/v1/users',
            search: '/api/v1/search',
            files: '/api/v1/files',
            dashboard: '/api/v1/dashboard',
            analytics: '/api/v1/analytics',
            subscriptions: '/api/v1/subscriptions',
            reviews: '/api/v1/reviews',
            notifications: '/api/v1/notifications',
            deliveries: '/api/v1/deliveries',
            messages: '/api/v1/messages',
            help: '/api/v1/help',
            blog: '/api/v1/blog',
            chat: '/api/v1/chat',
            content: '/api/v1/content',
            affiliates: '/api/v1/affiliates',
            promotions: '/api/v1/promotions',
            'qr-codes': '/api/v1/qr-codes',
            returns: '/api/v1/returns',
            health: '/api/v1/health'
        }
    });
});
exports.default = router;
//# sourceMappingURL=index.js.map