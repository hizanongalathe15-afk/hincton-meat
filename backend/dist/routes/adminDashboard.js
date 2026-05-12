"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const prisma_1 = require("../config/prisma");
const zod_1 = require("zod");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const cloudinary_1 = require("../config/cloudinary");
const notificationService_1 = require("../utils/notificationService");
const router = express_1.default.Router();
fs_1.default.mkdirSync('uploads/products', { recursive: true });
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => file.mimetype.startsWith('image/') ? cb(null, true) : cb(new Error('Only image files are allowed')),
});
const slugify = (input) => input.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const toBool = (value, fallback = false) => {
    if (typeof value === 'boolean')
        return value;
    if (typeof value === 'string')
        return value === 'true';
    return fallback;
};
const storeUploadedImages = async (files, folder = 'hincton/products') => {
    const urls = [];
    for (const file of files) {
        try {
            const uploaded = await (0, cloudinary_1.uploadImage)(file.buffer, folder);
            urls.push(uploaded.url);
        }
        catch (error) {
            const filename = `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e9)}${path_1.default.extname(file.originalname)}`;
            const localPath = path_1.default.join('uploads/products', filename);
            fs_1.default.writeFileSync(localPath, file.buffer);
            urls.push(`/${localPath.replace(/\\/g, '/')}`);
        }
    }
    return urls;
};
const statusLocation = (status) => {
    if (status === 'OUT_FOR_DELIVERY')
        return 'Delivery route';
    if (status === 'SHIPPED')
        return 'Dispatch';
    if (status === 'DELIVERED')
        return 'Customer location';
    if (status === 'PROCESSING')
        return 'Hincton Meat Products preparation';
    return 'Hincton Meat Products';
};
const statusDescription = (status) => {
    if (status === 'OUT_FOR_DELIVERY')
        return 'The order is with the rider and heading to the customer.';
    if (status === 'SHIPPED')
        return 'The order has left dispatch.';
    if (status === 'DELIVERED')
        return 'The order was delivered successfully.';
    if (status === 'PROCESSING')
        return 'The order is being prepared and packed.';
    if (status === 'CONFIRMED')
        return 'The order has been confirmed.';
    return `Order status changed to ${status.replace(/_/g, ' ').toLowerCase()}.`;
};
const notifyAdmins = async (title, message, data) => {
    const admins = await prisma_1.prisma.user.findMany({
        where: { roles: { has: 'ADMIN' } },
        select: { id: true, email: true, phone: true },
    });
    return (0, notificationService_1.notifyRecipients)({
        type: 'SYSTEM',
        title,
        message,
        actionUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/dashboard`,
        data,
        channels: ['inApp', 'email'],
        recipients: admins,
    });
};
const maybeNotifyLowStock = async (product) => {
    const threshold = Number(product.lowStockThreshold || 5);
    const stock = Number(product.stockQuantity || 0);
    if (stock > threshold)
        return;
    await notifyAdmins(`Low stock: ${product.name}`, `${product.name} is at ${stock} ${product.weightUnit || 'units'} left. Threshold is ${threshold}.`, { productId: product.id, stockQuantity: stock, lowStockThreshold: threshold });
};
// Middleware to check admin permissions
const requireAdmin = (req, res, next) => {
    const user = req.user;
    if (!user || !user.roles.includes('ADMIN')) {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};
// Apply admin middleware to all routes
router.use(requireAdmin);
// === DASHBOARD OVERVIEW ===
router.get('/dashboard', async (req, res) => {
    try {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        const [totalSalesToday, totalSalesWeek, totalSalesMonth, previousMonthSales, ordersCount, currentMonthOrders, previousMonthOrders, ordersByStatus, topProducts, lowStockProducts, totalProducts, totalUsers, newCustomers, recentOrders] = await Promise.all([
            // Total sales today
            prisma_1.prisma.order.aggregate({
                where: {
                    createdAt: { gte: today },
                    status: { not: 'CANCELLED' }
                },
                _sum: { totalAmount: true }
            }),
            // Total sales this week
            prisma_1.prisma.order.aggregate({
                where: {
                    createdAt: { gte: weekAgo },
                    status: { not: 'CANCELLED' }
                },
                _sum: { totalAmount: true }
            }),
            // Total sales this month
            prisma_1.prisma.order.aggregate({
                where: {
                    createdAt: { gte: monthAgo },
                    status: { not: 'CANCELLED' }
                },
                _sum: { totalAmount: true }
            }),
            prisma_1.prisma.order.aggregate({
                where: {
                    createdAt: { gte: new Date(monthAgo.getTime() - 30 * 24 * 60 * 60 * 1000), lt: monthAgo },
                    status: { not: 'CANCELLED' }
                },
                _sum: { totalAmount: true }
            }),
            // Total orders count
            prisma_1.prisma.order.count(),
            prisma_1.prisma.order.count({
                where: {
                    createdAt: { gte: monthAgo },
                }
            }),
            prisma_1.prisma.order.count({
                where: {
                    createdAt: { gte: new Date(monthAgo.getTime() - 30 * 24 * 60 * 60 * 1000), lt: monthAgo },
                }
            }),
            // Orders by status
            prisma_1.prisma.order.groupBy({
                by: ['status'],
                _count: true
            }),
            // Top selling products
            prisma_1.prisma.orderItem.groupBy({
                by: ['productId'],
                _sum: { quantity: true },
                orderBy: { _sum: { quantity: 'desc' } },
                take: 5
            }),
            // Low stock products
            prisma_1.prisma.product.findMany({
                where: { stockQuantity: { lte: 10 } },
                select: { id: true, name: true, stockQuantity: true },
                orderBy: { stockQuantity: 'asc' },
                take: 10
            }),
            prisma_1.prisma.product.count({ where: { deletedAt: null } }),
            prisma_1.prisma.user.count({ where: { deletedAt: null } }),
            // New customers this month
            prisma_1.prisma.user.count({
                where: { createdAt: { gte: monthAgo } }
            }),
            // Recent orders
            prisma_1.prisma.order.findMany({
                take: 10,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: { select: { email: true, username: true } }
                }
            })
        ]);
        // Get product details for top products
        const topProductIds = topProducts.map(p => p.productId);
        const topProductsDetails = await prisma_1.prisma.product.findMany({
            where: { id: { in: topProductIds } },
            select: { id: true, name: true, price: true, stockQuantity: true }
        });
        const topProductsWithDetails = topProducts.map(p => {
            const details = topProductsDetails.find(d => d.id === p.productId);
            return {
                ...p,
                product: details
            };
        });
        const currentMonthSales = Number(totalSalesMonth._sum.totalAmount || 0);
        const previousSales = Number(previousMonthSales._sum.totalAmount || 0);
        const percentChange = (current, previous) => previous > 0 ? ((current - previous) / previous) * 100 : current > 0 ? 100 : 0;
        res.json({
            overview: {
                totalSalesToday: totalSalesToday._sum.totalAmount || 0,
                totalSalesWeek: totalSalesWeek._sum.totalAmount || 0,
                totalSalesMonth: totalSalesMonth._sum.totalAmount || 0,
                totalOrders: ordersCount,
                totalProducts,
                totalUsers,
                newCustomersThisMonth: newCustomers,
                ordersByStatus,
                changes: {
                    revenue: percentChange(currentMonthSales, previousSales),
                    orders: percentChange(currentMonthOrders, previousMonthOrders),
                    products: 0,
                    users: 0
                }
            },
            topProducts: topProductsWithDetails,
            lowStockProducts,
            recentOrders,
            generatedAt: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ error: 'Failed to load dashboard data' });
    }
});
// === ORDER MANAGEMENT ===
router.get('/orders', async (req, res) => {
    try {
        const { page = '1', limit = '20', status, search, dateFrom, dateTo } = req.query;
        const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
        const limitNum = Math.max(1, parseInt(String(limit), 10) || 20);
        const skip = (pageNum - 1) * limitNum;
        const where = {};
        if (status)
            where.status = status;
        if (search) {
            where.OR = [
                { orderNumber: { contains: String(search), mode: 'insensitive' } },
                { user: { email: { contains: String(search), mode: 'insensitive' } } },
                { guestEmail: { contains: String(search), mode: 'insensitive' } }
            ];
        }
        if (dateFrom || dateTo) {
            where.createdAt = {};
            if (dateFrom)
                where.createdAt.gte = new Date(String(dateFrom));
            if (dateTo)
                where.createdAt.lte = new Date(String(dateTo));
        }
        const [orders, total] = await Promise.all([
            prisma_1.prisma.order.findMany({
                where,
                skip,
                take: limitNum,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: { select: { id: true, email: true, username: true } },
                    orderItems: {
                        include: {
                            product: { select: { id: true, name: true, price: true } }
                        }
                    }
                }
            }),
            prisma_1.prisma.order.count({ where })
        ]);
        res.json({
            orders,
            pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) }
        });
    }
    catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ error: 'Failed to get orders' });
    }
});
router.get('/orders/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const order = await prisma_1.prisma.order.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true, email: true, username: true,
                        profile: { select: { firstName: true, lastName: true, mpesaPhone: true } }
                    }
                },
                orderItems: {
                    include: {
                        product: { select: { id: true, name: true, price: true, productImages: { select: { url: true } } } },
                        variant: { select: { id: true, name: true } }
                    }
                },
                payments: true,
                returnRequests: true
            }
        });
        if (!order)
            return res.status(404).json({ error: 'Order not found' });
        res.json({ order });
    }
    catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({ error: 'Failed to get order' });
    }
});
router.put('/orders/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes, trackingNumber, courier } = zod_1.z.object({
            status: zod_1.z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REFUNDED']),
            notes: zod_1.z.string().optional(),
            trackingNumber: zod_1.z.string().optional(),
            courier: zod_1.z.string().optional()
        }).parse(req.body);
        const order = await prisma_1.prisma.order.update({
            where: { id },
            data: {
                status,
                deliveryStatus: status === 'OUT_FOR_DELIVERY' ? 'OUT_FOR_DELIVERY' : status === 'DELIVERED' ? 'DELIVERED' : status === 'SHIPPED' ? 'IN_TRANSIT' : undefined,
                notes,
                trackingNumber,
                courier,
                ...(status === 'DELIVERED' && { deliveredAt: new Date() }),
                ...(status === 'CANCELLED' && { cancelledAt: new Date() }),
                ...(status === 'REFUNDED' && { refundedAt: new Date() })
            },
            include: {
                user: { select: { id: true, email: true, phone: true } },
            },
        });
        // Create status history entry
        await prisma_1.prisma.orderStatusHistory.create({
            data: {
                orderId: id,
                status,
                notes,
                createdBy: req.user.id
            }
        });
        await prisma_1.prisma.trackingHistory.create({
            data: {
                orderId: id,
                trackingNumber: trackingNumber || order.trackingNumber || order.orderNumber,
                status,
                location: statusLocation(status),
                description: notes || statusDescription(status),
                rawData: { courier: courier || order.courier || null },
            },
        });
        (0, notificationService_1.notifyOrderCustomer)(order, `Order update ${order.orderNumber}`, notes || statusDescription(status), ['inApp', 'email', 'sms', 'whatsapp']).catch((error) => console.error('Order status notification error:', error));
        res.json({ message: 'Order status updated', order });
    }
    catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({ error: 'Failed to update order status' });
    }
});
// === PRODUCT MANAGEMENT ===
router.get('/products', async (req, res) => {
    try {
        const { page = '1', limit = '20', search, category, status } = req.query;
        const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
        const limitNum = Math.max(1, parseInt(String(limit), 10) || 20);
        const skip = (pageNum - 1) * limitNum;
        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: String(search), mode: 'insensitive' } },
                { description: { contains: String(search), mode: 'insensitive' } },
                { sku: { contains: String(search), mode: 'insensitive' } }
            ];
        }
        if (category)
            where.categoryId = category;
        if (status === 'published')
            where.isPublished = true;
        if (status === 'draft')
            where.isPublished = false;
        const [products, total] = await Promise.all([
            prisma_1.prisma.product.findMany({
                where,
                skip,
                take: limitNum,
                orderBy: { createdAt: 'desc' },
                include: {
                    category: { select: { id: true, name: true } },
                    productImages: { select: { id: true, url: true, alt: true } },
                    _count: { select: { orderItems: true } }
                }
            }),
            prisma_1.prisma.product.count({ where })
        ]);
        res.json({
            products,
            pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) }
        });
    }
    catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ error: 'Failed to get products' });
    }
});
router.get('/products/:id', async (req, res) => {
    try {
        const product = await prisma_1.prisma.product.findUnique({
            where: { id: req.params.id },
            include: {
                category: true,
                productImages: true,
                _count: { select: { orderItems: true } },
            },
        });
        if (!product)
            return res.status(404).json({ error: 'Product not found' });
        res.json({ product });
    }
    catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({ error: 'Failed to get product' });
    }
});
router.post('/products', upload.array('images', 8), async (req, res) => {
    try {
        const productData = zod_1.z.object({
            name: zod_1.z.string().min(1),
            description: zod_1.z.string().optional(),
            price: zod_1.z.coerce.number().positive(),
            comparePrice: zod_1.z.coerce.number().positive().optional(),
            sku: zod_1.z.string().optional(),
            stockQuantity: zod_1.z.coerce.number().int().default(0),
            categoryId: zod_1.z.string().optional(),
            isPublished: zod_1.z.preprocess((v) => toBool(v, false), zod_1.z.boolean()).default(false),
            isFeatured: zod_1.z.preprocess((v) => toBool(v, false), zod_1.z.boolean()).default(false),
            weight: zod_1.z.coerce.number().optional(),
            unit: zod_1.z.string().optional(),
        }).parse(req.body);
        const files = (req.files ?? []);
        const imageUrls = await storeUploadedImages(files);
        const sku = productData.sku?.trim() || `HMP-${Date.now()}`;
        const product = await prisma_1.prisma.product.create({
            data: {
                name: productData.name,
                slug: `${slugify(productData.name)}-${Date.now()}`,
                description: productData.description,
                price: productData.price,
                comparePrice: productData.comparePrice,
                sku,
                stockQuantity: productData.stockQuantity,
                categoryId: productData.categoryId || undefined,
                isPublished: productData.isPublished,
                isFeatured: productData.isFeatured,
                weight: productData.weight,
                weightUnit: productData.unit,
                brand: undefined,
                productImages: { create: imageUrls.map((url, index) => ({ url, sortOrder: index, isPrimary: index === 0 })) },
            },
            include: {
                category: true,
                productImages: true
            }
        });
        maybeNotifyLowStock(product).catch((error) => console.error('Low stock notification error:', error));
        res.status(201).json({ message: 'Product created', product });
    }
    catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({ error: 'Failed to create product' });
    }
});
router.put('/products/:id', upload.array('images', 8), async (req, res) => {
    try {
        const { id } = req.params;
        const productData = zod_1.z.object({
            name: zod_1.z.string().min(1).optional(),
            description: zod_1.z.string().optional(),
            price: zod_1.z.coerce.number().positive().optional(),
            comparePrice: zod_1.z.coerce.number().positive().optional(),
            sku: zod_1.z.string().optional(),
            stockQuantity: zod_1.z.coerce.number().int().optional(),
            categoryId: zod_1.z.string().optional(),
            isPublished: zod_1.z.preprocess((v) => v === undefined ? undefined : toBool(v), zod_1.z.boolean().optional()),
            isFeatured: zod_1.z.preprocess((v) => v === undefined ? undefined : toBool(v), zod_1.z.boolean().optional()),
            weight: zod_1.z.coerce.number().optional(),
            unit: zod_1.z.string().optional(),
            existingImages: zod_1.z.string().optional(),
        }).parse(req.body);
        const files = (req.files ?? []);
        const imageUrls = await storeUploadedImages(files);
        const existingImages = productData.existingImages ? JSON.parse(productData.existingImages) : undefined;
        if (existingImages) {
            await prisma_1.prisma.productImage.deleteMany({ where: { productId: id, url: { notIn: existingImages } } });
        }
        const product = await prisma_1.prisma.product.update({
            where: { id },
            data: {
                name: productData.name,
                slug: productData.name ? `${slugify(productData.name)}-${Date.now()}` : undefined,
                description: productData.description,
                price: productData.price,
                comparePrice: productData.comparePrice,
                sku: productData.sku,
                stockQuantity: productData.stockQuantity,
                categoryId: productData.categoryId || undefined,
                isPublished: productData.isPublished,
                isFeatured: productData.isFeatured,
                weight: productData.weight,
                weightUnit: productData.unit,
                ...(imageUrls.length ? { productImages: { create: imageUrls.map((url, index) => ({ url, sortOrder: index, isPrimary: index === 0 && !existingImages?.length })) } } : {}),
            },
            include: {
                category: true,
                productImages: true
            }
        });
        maybeNotifyLowStock(product).catch((error) => console.error('Low stock notification error:', error));
        res.json({ message: 'Product updated', product });
    }
    catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({ error: 'Failed to update product' });
    }
});
router.delete('/products/:id', async (req, res) => {
    try {
        await prisma_1.prisma.product.delete({ where: { id: req.params.id } });
        res.json({ message: 'Product deleted' });
    }
    catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({ error: 'Failed to delete product' });
    }
});
// === CUSTOMER MANAGEMENT ===
router.get('/customers', async (req, res) => {
    try {
        const { page = '1', limit = '20', search } = req.query;
        const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
        const limitNum = Math.max(1, parseInt(String(limit), 10) || 20);
        const skip = (pageNum - 1) * limitNum;
        const where = {};
        if (search) {
            where.OR = [
                { email: { contains: String(search), mode: 'insensitive' } },
                { username: { contains: String(search), mode: 'insensitive' } },
                { profile: {
                        OR: [
                            { firstName: { contains: String(search), mode: 'insensitive' } },
                            { lastName: { contains: String(search), mode: 'insensitive' } }
                        ]
                    } }
            ];
        }
        const [customers, total] = await Promise.all([
            prisma_1.prisma.user.findMany({
                where,
                skip,
                take: limitNum,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    email: true,
                    username: true,
                    createdAt: true,
                    profile: {
                        select: {
                            firstName: true,
                            lastName: true,
                            mpesaPhone: true
                        }
                    },
                    _count: {
                        select: {
                            orders: true
                        }
                    }
                }
            }),
            prisma_1.prisma.user.count({ where })
        ]);
        // Get total spent for each customer
        const customerIds = customers.map(c => c.id);
        const orderTotals = await prisma_1.prisma.order.groupBy({
            by: ['userId'],
            where: {
                userId: { in: customerIds },
                status: { not: 'CANCELLED' }
            },
            _sum: { totalAmount: true }
        });
        const customersWithSpending = customers.map(customer => {
            const orderTotal = orderTotals.find(ot => ot.userId === customer.id);
            return {
                ...customer,
                totalSpent: orderTotal?._sum.totalAmount || 0
            };
        });
        res.json({
            customers: customersWithSpending,
            pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) }
        });
    }
    catch (error) {
        console.error('Get customers error:', error);
        res.status(500).json({ error: 'Failed to get customers' });
    }
});
router.get('/customers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const customer = await prisma_1.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                username: true,
                createdAt: true,
                profile: true,
                addresses: true,
                orders: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                    select: {
                        id: true,
                        orderNumber: true,
                        totalAmount: true,
                        status: true,
                        createdAt: true
                    }
                },
                _count: {
                    select: {
                        orders: true,
                        reviews: true,
                        returnRequests: true
                    }
                }
            }
        });
        if (!customer)
            return res.status(404).json({ error: 'Customer not found' });
        // Get total spent
        const totalSpent = await prisma_1.prisma.order.aggregate({
            where: {
                userId: id,
                status: { not: 'CANCELLED' }
            },
            _sum: { totalAmount: true }
        });
        res.json({
            customer: {
                ...customer,
                totalSpent: totalSpent._sum.totalAmount || 0
            }
        });
    }
    catch (error) {
        console.error('Get customer error:', error);
        res.status(500).json({ error: 'Failed to get customer' });
    }
});
// === ANALYTICS & REPORTS ===
router.get('/analytics/sales', async (req, res) => {
    try {
        const { period = '30' } = req.query;
        const days = Math.max(1, parseInt(String(period), 10) || 30);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const salesData = await prisma_1.prisma.order.groupBy({
            by: ['createdAt'],
            where: {
                createdAt: { gte: startDate },
                status: { not: 'CANCELLED' }
            },
            _sum: { totalAmount: true },
            _count: true
        });
        // Group by date
        const dailySales = salesData.reduce((acc, sale) => {
            const date = sale.createdAt.toISOString().split('T')[0];
            if (!acc[date]) {
                acc[date] = { date, revenue: 0, orders: 0 };
            }
            acc[date].revenue += Number(sale._sum.totalAmount || 0);
            acc[date].orders += sale._count;
            return acc;
        }, {});
        res.json({ salesData: Object.values(dailySales) });
    }
    catch (error) {
        console.error('Sales analytics error:', error);
        res.status(500).json({ error: 'Failed to get sales analytics' });
    }
});
router.get('/analytics/products', async (req, res) => {
    try {
        const topProducts = await prisma_1.prisma.orderItem.groupBy({
            by: ['productId'],
            _sum: { quantity: true },
            orderBy: { _sum: { quantity: 'desc' } },
            take: 10
        });
        const productIds = topProducts.map(p => p.productId);
        const products = await prisma_1.prisma.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, name: true, price: true }
        });
        const topProductsWithDetails = topProducts.map(p => {
            const product = products.find(pr => pr.id === p.productId);
            return {
                ...p,
                product
            };
        });
        res.json({ topProducts: topProductsWithDetails });
    }
    catch (error) {
        console.error('Product analytics error:', error);
        res.status(500).json({ error: 'Failed to get product analytics' });
    }
});
// === NOTIFICATIONS MANAGEMENT ===
router.get('/notifications', async (req, res) => {
    try {
        const { page = '1', limit = '50', unread = 'false' } = req.query;
        const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
        const limitNum = Math.max(1, parseInt(String(limit), 10) || 50);
        const skip = (pageNum - 1) * limitNum;
        const showUnreadOnly = unread === 'true';
        const where = {};
        if (showUnreadOnly) {
            where.isRead = false;
        }
        const [notifications, total, unreadCount] = await Promise.all([
            prisma_1.prisma.notification.findMany({
                where,
                skip,
                take: limitNum,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            profile: {
                                select: {
                                    firstName: true,
                                    lastName: true
                                }
                            }
                        }
                    }
                }
            }),
            prisma_1.prisma.notification.count({ where }),
            prisma_1.prisma.notification.count({ where: { isRead: false } })
        ]);
        res.json({
            notifications,
            pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
            unreadCount
        });
    }
    catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: 'Failed to get notifications' });
    }
});
router.put('/notifications/:id/read', async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await prisma_1.prisma.notification.update({
            where: { id },
            data: { isRead: true, readAt: new Date() }
        });
        res.json({ message: 'Notification marked as read', notification });
    }
    catch (error) {
        console.error('Mark notification read error:', error);
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
});
router.put('/notifications/mark-all-read', async (req, res) => {
    try {
        await prisma_1.prisma.notification.updateMany({
            where: { isRead: false },
            data: { isRead: true, readAt: new Date() }
        });
        res.json({ message: 'All notifications marked as read' });
    }
    catch (error) {
        console.error('Mark all notifications read error:', error);
        res.status(500).json({ error: 'Failed to mark all notifications as read' });
    }
});
router.delete('/notifications/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_1.prisma.notification.delete({
            where: { id }
        });
        res.json({ message: 'Notification deleted successfully' });
    }
    catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({ error: 'Failed to delete notification' });
    }
});
// === USER MANAGEMENT ===
router.get('/users', async (req, res) => {
    try {
        const { page = '1', limit = '20', search, role } = req.query;
        const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
        const limitNum = Math.max(1, parseInt(String(limit), 10) || 20);
        const skip = (pageNum - 1) * limitNum;
        const where = { deletedAt: null };
        if (search) {
            where.OR = [
                { email: { contains: String(search), mode: 'insensitive' } },
                { username: { contains: String(search), mode: 'insensitive' } },
                { profile: {
                        OR: [
                            { firstName: { contains: String(search), mode: 'insensitive' } },
                            { lastName: { contains: String(search), mode: 'insensitive' } },
                            { fullName: { contains: String(search), mode: 'insensitive' } }
                        ]
                    } }
            ];
        }
        if (role) {
            where.roles = { has: String(role).toUpperCase() };
        }
        const [users, total] = await Promise.all([
            prisma_1.prisma.user.findMany({
                where,
                skip,
                take: limitNum,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    email: true,
                    username: true,
                    phone: true,
                    roles: true,
                    createdAt: true,
                    updatedAt: true,
                    profile: {
                        select: {
                            firstName: true,
                            lastName: true,
                            fullName: true,
                            avatar: true,
                            mpesaPhone: true
                        }
                    },
                    security: {
                        select: {
                            isEmailVerified: true,
                            isPhoneVerified: true,
                            is_active: true,
                            is_locked: true,
                            last_login_at: true
                        }
                    },
                    _count: {
                        select: {
                            orders: true,
                            reviews: true
                        }
                    }
                }
            }),
            prisma_1.prisma.user.count({ where })
        ]);
        res.json({
            users,
            pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) }
        });
    }
    catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Failed to get users' });
    }
});
router.get('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const user = await prisma_1.prisma.user.findUnique({
            where: { id, deletedAt: null },
            select: {
                id: true,
                email: true,
                username: true,
                phone: true,
                roles: true,
                createdAt: true,
                updatedAt: true,
                profile: true,
                security: true,
                addresses: true,
                orders: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                    select: {
                        id: true,
                        orderNumber: true,
                        totalAmount: true,
                        status: true,
                        paymentStatus: true,
                        createdAt: true
                    }
                },
                _count: {
                    select: {
                        orders: true,
                        reviews: true,
                        addresses: true
                    }
                }
            }
        });
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        // Get total spent
        const totalSpent = await prisma_1.prisma.order.aggregate({
            where: {
                userId: id,
                status: { not: 'CANCELLED' }
            },
            _sum: { totalAmount: true }
        });
        res.json({
            user: {
                ...user,
                totalSpent: Number(totalSpent._sum.totalAmount || 0)
            }
        });
    }
    catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user' });
    }
});
router.put('/users/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { action } = zod_1.z.object({
            action: zod_1.z.enum(['activate', 'deactivate', 'lock', 'unlock', 'verify_email', 'verify_phone'])
        }).parse(req.body);
        const updateData = {};
        switch (action) {
            case 'activate':
                updateData.security = { update: { is_active: true, is_locked: false } };
                break;
            case 'deactivate':
                updateData.security = { update: { is_active: false } };
                break;
            case 'lock':
                updateData.security = { update: { is_locked: true, locked_until: new Date(Date.now() + 24 * 60 * 60 * 1000) } };
                break;
            case 'unlock':
                updateData.security = { update: { is_locked: false, locked_until: null, login_attempts: 0 } };
                break;
            case 'verify_email':
                updateData.security = { update: { isEmailVerified: true } };
                break;
            case 'verify_phone':
                updateData.security = { update: { isPhoneVerified: true } };
                break;
        }
        const user = await prisma_1.prisma.user.update({
            where: { id },
            data: updateData,
            include: {
                security: true,
                profile: true
            }
        });
        res.json({ message: `User ${action}d successfully`, user });
    }
    catch (error) {
        console.error('Update user status error:', error);
        res.status(500).json({ error: 'Failed to update user status' });
    }
});
// === CONTENT MANAGEMENT ===
router.get('/content/banners', async (req, res) => {
    try {
        const banners = await prisma_1.prisma.banner?.findMany({
            orderBy: { sortOrder: 'asc' }
        }) || [];
        res.json({ banners });
    }
    catch (error) {
        console.error('Get banners error:', error);
        res.status(500).json({ error: 'Failed to get banners' });
    }
});
router.post('/content/banners', async (req, res) => {
    try {
        const bannerData = zod_1.z.object({
            title: zod_1.z.string(),
            subtitle: zod_1.z.string().optional(),
            imageUrl: zod_1.z.string().url(),
            linkUrl: zod_1.z.string().url().optional(),
            isActive: zod_1.z.boolean().default(true),
            sortOrder: zod_1.z.number().default(0)
        }).parse(req.body);
        const banner = await prisma_1.prisma.banner?.create({
            data: bannerData
        });
        res.json({ message: 'Banner created successfully', banner });
    }
    catch (error) {
        console.error('Create banner error:', error);
        res.status(500).json({ error: 'Failed to create banner' });
    }
});
router.put('/content/banners/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const bannerData = zod_1.z.object({
            title: zod_1.z.string().optional(),
            subtitle: zod_1.z.string().optional(),
            imageUrl: zod_1.z.string().url().optional(),
            linkUrl: zod_1.z.string().url().optional(),
            isActive: zod_1.z.boolean().optional(),
            sortOrder: zod_1.z.number().optional()
        }).parse(req.body);
        const banner = await prisma_1.prisma.banner?.update({
            where: { id },
            data: bannerData
        });
        res.json({ message: 'Banner updated successfully', banner });
    }
    catch (error) {
        console.error('Update banner error:', error);
        res.status(500).json({ error: 'Failed to update banner' });
    }
});
router.delete('/content/banners/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_1.prisma.banner?.delete({
            where: { id }
        });
        res.json({ message: 'Banner deleted successfully' });
    }
    catch (error) {
        console.error('Delete banner error:', error);
        res.status(500).json({ error: 'Failed to delete banner' });
    }
});
// === QR CODE MANAGEMENT ===
router.get('/qr-codes', async (req, res) => {
    try {
        const qrCodes = await prisma_1.prisma.qrCode?.findMany({
            orderBy: { createdAt: 'desc' }
        }) || [];
        res.json({ qrCodes });
    }
    catch (error) {
        console.error('Get QR codes error:', error);
        res.status(500).json({ error: 'Failed to get QR codes' });
    }
});
router.post('/qr-codes', async (req, res) => {
    try {
        const qrData = zod_1.z.object({
            name: zod_1.z.string(),
            type: zod_1.z.enum(['PRODUCT', 'ORDER', 'URL', 'CUSTOM']),
            referenceId: zod_1.z.string().optional(),
            url: zod_1.z.string().url().optional(),
            description: zod_1.z.string().optional(),
            discountCode: zod_1.z.string().optional(),
            welcomeTitle: zod_1.z.string().optional(),
            welcomeMessage: zod_1.z.string().optional(),
            welcomeColor: zod_1.z.string().optional(),
            autoRedirect: zod_1.z.boolean().optional(),
            redirectDelay: zod_1.z.number().optional(),
            imageUrl: zod_1.z.string().optional(),
            data: zod_1.z.any().optional(),
            isActive: zod_1.z.boolean().default(true)
        }).parse(req.body);
        // Generate QR code (simplified - in production you'd use a QR library)
        const qrCode = await prisma_1.prisma.qrCode?.create({
            data: {
                name: qrData.name,
                code: `https://hincton.meat/${qrData.type.toLowerCase()}/${qrData.referenceId || qrData.url}`,
                description: qrData.description,
                targetUrl: qrData.url || '/',
                discountCode: qrData.discountCode,
                welcomeTitle: qrData.welcomeTitle,
                welcomeMessage: qrData.welcomeMessage,
                welcomeColor: qrData.welcomeColor,
                autoRedirect: qrData.autoRedirect,
                redirectDelay: qrData.redirectDelay,
                imageUrl: qrData.imageUrl,
                isActive: qrData.isActive
            }
        });
        res.json({ message: 'QR code created successfully', qrCode });
    }
    catch (error) {
        console.error('Create QR code error:', error);
        res.status(500).json({ error: 'Failed to create QR code' });
    }
});
// === SYSTEM METRICS ===
router.get('/system-metrics', async (req, res) => {
    try {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const [totalUsers, activeUsersToday, totalOrders, ordersToday, totalProducts, lowStockProducts, systemHealth] = await Promise.all([
            prisma_1.prisma.user.count({ where: { deletedAt: null } }),
            prisma_1.prisma.user.count({
                where: {
                    deletedAt: null,
                    security: {
                        last_login_at: { gte: today }
                    }
                }
            }),
            prisma_1.prisma.order.count(),
            prisma_1.prisma.order.count({
                where: {
                    createdAt: { gte: today }
                }
            }),
            prisma_1.prisma.product.count({ where: { deletedAt: null } }),
            prisma_1.prisma.product.count({
                where: {
                    deletedAt: null,
                    stockQuantity: { lte: 10 }
                }
            }),
            {
                database: 'connected',
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                nodeVersion: process.version
            }
        ]);
        res.json({
            metrics: {
                users: {
                    total: totalUsers,
                    activeToday: activeUsersToday
                },
                orders: {
                    total: totalOrders,
                    today: ordersToday
                },
                products: {
                    total: totalProducts,
                    lowStock: lowStockProducts
                },
                system: systemHealth
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Get system metrics error:', error);
        res.status(500).json({ error: 'Failed to get system metrics' });
    }
});
exports.default = router;
//# sourceMappingURL=adminDashboard.js.map