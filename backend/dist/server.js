"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const client_1 = require("@prisma/client");
// Routes
const auth_1 = __importDefault(require("./routes/auth"));
const products_1 = __importDefault(require("./routes/products"));
const orders_1 = __importDefault(require("./routes/orders"));
const cart_1 = __importDefault(require("./routes/cart"));
const mpesa_1 = __importDefault(require("./routes/mpesa"));
const admin_1 = __importDefault(require("./routes/admin"));
const contentManagement_1 = __importDefault(require("./routes/contentManagement"));
const subscriptions_1 = __importDefault(require("./routes/subscriptions"));
const returns_1 = __importDefault(require("./routes/returns"));
const promotions_1 = __importDefault(require("./routes/promotions"));
const affiliates_1 = __importDefault(require("./routes/affiliates"));
const blog_1 = __importDefault(require("./routes/blog"));
const chat_1 = __importDefault(require("./routes/chat"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const wishlist_1 = __importDefault(require("./routes/wishlist"));
const qrCodes_1 = __importDefault(require("./routes/qrCodes"));
const upload_1 = __importDefault(require("./routes/upload"));
const systemMetrics_1 = __importDefault(require("./routes/systemMetrics"));
const ads_1 = __importDefault(require("./routes/ads"));
const messages_1 = __importDefault(require("./routes/messages"));
const wallet_1 = __importDefault(require("./routes/wallet"));
const reviews_1 = __importDefault(require("./routes/reviews"));
const userSessions_1 = __importDefault(require("./routes/userSessions"));
const analyticsRoutes_1 = __importDefault(require("./routes/analyticsRoutes"));
// Middleware
const auth_2 = require("./middleware/auth");
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const localOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
];
const configuredOrigins = [
    process.env.FRONTEND_URL,
    ...(process.env.ALLOWED_ORIGINS?.split(',') || []),
]
    .map((origin) => origin?.trim())
    .filter(Boolean);
const allowedOrigins = Array.from(new Set([...configuredOrigins, ...localOrigins]));
const corsOptions = {
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
            return;
        }
        callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Guest-Session-Id'],
};
const io = new socket_io_1.Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true,
    }
});
// Initialize Prisma
const prisma = new client_1.PrismaClient();
// Test database connection
prisma.$connect()
    .then(() => console.log('Database connected successfully'))
    .catch((error) => console.error('Database connection failed:', error));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs (increased from 100)
    skip: (req) => {
        // Skip rate limiting for CORS preflight requests
        return req.method === 'OPTIONS';
    }
});
// Middleware
app.use((0, helmet_1.default)());
app.use(limiter);
app.use((0, cors_1.default)(corsOptions));
app.options('*', (0, cors_1.default)(corsOptions));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Static files
app.use('/uploads', express_1.default.static('uploads'));
// API Routes
app.use('/api/auth', auth_1.default);
app.use('/api/products', products_1.default);
app.use('/api/orders', auth_2.optionalAuthenticate, orders_1.default);
app.use('/api/cart', auth_2.optionalAuthenticate, cart_1.default);
app.use('/api/mpesa', auth_2.optionalAuthenticate, mpesa_1.default);
app.use('/api/admin', auth_2.authenticate, (0, auth_2.authorize)('ADMIN'), admin_1.default);
app.use('/api/admin/content', auth_2.authenticate, (0, auth_2.authorize)('ADMIN'), contentManagement_1.default);
app.use('/api/subscriptions', auth_2.authenticate, subscriptions_1.default);
app.use('/api/returns', auth_2.authenticate, returns_1.default);
app.use('/api/promotions', promotions_1.default);
app.use('/api/affiliate', auth_2.authenticate, affiliates_1.default);
app.use('/api/blog', blog_1.default);
app.use('/api/chat', auth_2.optionalAuthenticate, chat_1.default);
app.use('/api/notifications', auth_2.authenticate, notifications_1.default);
app.use('/api/wishlist', auth_2.authenticate, wishlist_1.default);
app.use('/api/wallet', auth_2.authenticate, wallet_1.default);
app.use('/api/reviews', reviews_1.default);
app.use('/api/user-sessions', userSessions_1.default);
app.use('/api/messages', messages_1.default);
app.use('/api/upload', upload_1.default);
app.use('/api', auth_2.optionalAuthenticate, qrCodes_1.default);
app.use('/api/admin/system', auth_2.authenticate, (0, auth_2.authorize)('ADMIN'), systemMetrics_1.default);
app.use('/api/ads', ads_1.default);
app.use('/api/analytics', analyticsRoutes_1.default);
app.get('/api/content/site-profile', async (_req, res) => {
    try {
        const setting = await prisma.systemSetting.findUnique({ where: { key: 'site_profile' } });
        res.json({ profile: setting ? JSON.parse(setting.value) : null });
    }
    catch (error) {
        console.error('Public site profile error:', error);
        res.status(500).json({ error: 'Failed to get site profile' });
    }
});
app.get('/api/content/web-profile', async (_req, res) => {
    try {
        const [setting, products, categories, featuredProducts, inStockProducts] = await Promise.all([
            prisma.systemSetting.findUnique({ where: { key: 'site_profile' } }),
            prisma.product.count({ where: { isPublished: true, deletedAt: null } }),
            prisma.category.count({ where: { isActive: true, deletedAt: null } }),
            prisma.product.count({ where: { isPublished: true, isFeatured: true, deletedAt: null } }),
            prisma.product.count({ where: { isPublished: true, deletedAt: null, stockQuantity: { gt: 0 } } }),
        ]);
        const featuredCatalog = await prisma.product.findMany({
            where: { isPublished: true, isFeatured: true, deletedAt: null },
            take: 3,
            orderBy: [{ updatedAt: 'desc' }],
            include: {
                category: { select: { name: true, slug: true } },
                productImages: {
                    orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
                    take: 1,
                    select: { url: true, alt: true },
                },
            },
        });
        res.json({
            profile: setting ? JSON.parse(setting.value) : null,
            stats: {
                products,
                categories,
                featuredProducts,
                inStockProducts,
            },
            featuredProducts: featuredCatalog,
        });
    }
    catch (error) {
        console.error('Public web profile error:', error);
        res.status(500).json({ error: 'Failed to get web profile' });
    }
});
app.get('/api/content/commerce-settings', async (_req, res) => {
    try {
        const setting = await prisma.systemSetting.findUnique({ where: { key: 'commerce_settings' } });
        const defaults = {
            shipping: {
                standardShippingFee: 200,
                expressShippingFee: 450,
                deliveryTimeframe: 'Today before 5 PM',
                expressDeliveryTimeframe: 'Within 2 hours',
                coldChainCutoffHour: 10,
                sameDayDeliveryBy: '5:00 PM',
                insulatedBoxText: 'Delivered cold in an insulated box',
            },
            inventory: {
                lowStockThreshold: 10,
            },
            shop: {
                priceRanges: [
                    { id: '0-1000', name: 'Under KSh 1,000', min: 0, max: 1000 },
                    { id: '1000-3000', name: 'KSh 1,000 - KSh 3,000', min: 1000, max: 3000 },
                    { id: '3000-6000', name: 'KSh 3,000 - KSh 6,000', min: 3000, max: 6000 },
                    { id: '6000-13000', name: 'KSh 6,000 - KSh 13,000', min: 6000, max: 13000 },
                    { id: '13000-plus', name: 'Over KSh 13,000', min: 13000, max: null },
                ],
            },
            notifications: {
                emailNotifications: true,
                smsNotifications: true,
                whatsappNotifications: true,
                orderNotifications: true,
                lowStockAlerts: true,
            },
        };
        res.json({ settings: setting ? { ...defaults, ...JSON.parse(setting.value) } : defaults });
    }
    catch (error) {
        console.error('Public commerce settings error:', error);
        res.status(500).json({ error: 'Failed to get commerce settings' });
    }
});
app.get('/api/categories', async (_req, res) => {
    try {
        const categories = await prisma.category.findMany({
            where: { isActive: true, deletedAt: null },
            orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        });
        res.json({ categories });
    }
    catch (error) {
        console.error('Public categories error:', error);
        res.status(500).json({ error: 'Failed to get categories' });
    }
});
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
// Socket.io for real-time delivery tracking
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    socket.on('join-order', (orderId) => {
        socket.join(`order-${orderId}`);
    });
    socket.on('delivery-location-update', (data) => {
        socket.to(`order-${data.orderId}`).emit('location-update', data);
    });
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ message: 'Route not found' });
});
const preferredPort = Number(process.env.PORT || 5000);
function listenOnFreePort(fromPort) {
    const attemptPort = Number.isFinite(fromPort) ? fromPort : 5000;
    const tryListen = (port) => {
        const handleError = (err) => {
            if (err?.code === 'EADDRINUSE') {
                console.warn(`Port ${port} is in use; trying ${port + 1}...`);
                server.removeListener('listening', handleListening);
                tryListen(port + 1);
                return;
            }
            throw err;
        };
        const handleListening = () => {
            server.removeListener('error', handleError);
            console.log(`Server running on port ${port}`);
            console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
        };
        server.once('error', handleError);
        server.once('listening', handleListening);
        server.listen(port);
    };
    tryListen(attemptPort);
}
listenOnFreePort(preferredPort);
exports.default = app;
//# sourceMappingURL=server.js.map