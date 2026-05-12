"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const prisma_1 = require("../config/prisma");
const zod_1 = require("zod");
const notificationService_1 = require("../utils/notificationService");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const router = express_1.default.Router();
// Admin middleware to check permissions
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
        const [totalSalesToday, totalSalesWeek, totalSalesMonth, previousMonthSales, ordersCount, currentMonthOrders, previousMonthOrders, ordersByStatus, topProducts, lowStockProducts, totalProducts, currentMonthProducts, previousMonthProducts, totalUsers, newCustomers, previousMonthUsers, recentOrders] = await Promise.all([
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
            prisma_1.prisma.product.count({
                where: { deletedAt: null, createdAt: { gte: monthAgo } }
            }),
            prisma_1.prisma.product.count({
                where: { deletedAt: null, createdAt: { gte: new Date(monthAgo.getTime() - 30 * 24 * 60 * 60 * 1000), lt: monthAgo } }
            }),
            prisma_1.prisma.user.count({ where: { deletedAt: null } }),
            // New customers this month
            prisma_1.prisma.user.count({
                where: { createdAt: { gte: monthAgo } }
            }),
            prisma_1.prisma.user.count({
                where: { deletedAt: null, createdAt: { gte: new Date(monthAgo.getTime() - 30 * 24 * 60 * 60 * 1000), lt: monthAgo } }
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
                    products: percentChange(currentMonthProducts, previousMonthProducts),
                    users: percentChange(newCustomers, previousMonthUsers)
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
// Very small, schema-aligned subset to keep admin API compiling.
fs_1.default.mkdirSync('uploads/products', { recursive: true });
const productImageUpload = (0, multer_1.default)({
    storage: multer_1.default.diskStorage({
        destination: (_req, _file, cb) => cb(null, 'uploads/products/'),
        filename: (_req, file, cb) => cb(null, `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e9)}${path_1.default.extname(file.originalname)}`),
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => file.mimetype.startsWith('image/') ? cb(null, true) : cb(new Error('Only image files are allowed')),
});
const slugify = (input) => input.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `product-${Date.now()}`;
const parseNumber = (value) => {
    if (value === '' || value === undefined || value === null)
        return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : value;
};
const parseBoolean = (value) => {
    if (typeof value === 'boolean')
        return value;
    if (value === 'true')
        return true;
    if (value === 'false')
        return false;
    return value;
};
const productPayloadSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    description: zod_1.z.string().optional().default(''),
    shortDescription: zod_1.z.string().optional(),
    categoryId: zod_1.z.string().optional().transform((value) => value || undefined),
    price: zod_1.z.preprocess(parseNumber, zod_1.z.number().positive()),
    comparePrice: zod_1.z.preprocess(parseNumber, zod_1.z.number().positive().optional()),
    stockQuantity: zod_1.z.preprocess(parseNumber, zod_1.z.number().int().min(0)),
    sku: zod_1.z.string().optional().transform((value) => value?.trim() || undefined),
    weight: zod_1.z.preprocess(parseNumber, zod_1.z.number().nonnegative().optional()),
    unit: zod_1.z.string().optional(),
    isPublished: zod_1.z.preprocess(parseBoolean, zod_1.z.boolean().default(true)),
    isFeatured: zod_1.z.preprocess(parseBoolean, zod_1.z.boolean().default(false)),
    existingImages: zod_1.z.string().optional(),
});
const productInclude = {
    category: { select: { id: true, name: true, slug: true } },
    productImages: { orderBy: { sortOrder: 'asc' } },
    reviews: { select: { rating: true } },
    _count: { select: { orderItems: true } },
};
const serializeProduct = (product) => {
    const reviews = product.reviews || [];
    const reviewCount = reviews.length;
    const averageRating = reviewCount ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviewCount : Number(product.averageRating || 0);
    return {
        ...product,
        price: Number(product.price),
        comparePrice: product.comparePrice ? Number(product.comparePrice) : null,
        images: product.productImages?.map((image) => image.url) || [],
        averageRating,
        reviewCount: reviewCount || Number(product.totalReviews || 0),
    };
};
const makeUniqueSlug = async (name, idToIgnore) => {
    const base = slugify(name);
    let slug = base;
    let suffix = 2;
    while (true) {
        const existing = await prisma_1.prisma.product.findUnique({ where: { slug }, select: { id: true } });
        if (!existing || existing.id === idToIgnore)
            return slug;
        slug = `${base}-${suffix++}`;
    }
};
router.get('/health', async (_req, res) => {
    res.json({ ok: true });
});
// GET /admin/orders - Get all orders with filtering
router.get('/orders', async (req, res) => {
    try {
        const page = Number(req.query.page || 1);
        const limit = Number(req.query.limit || 50);
        const status = req.query.status;
        const search = req.query.search;
        const dateFrom = req.query.dateFrom;
        const dateTo = req.query.dateTo;
        const skip = (page - 1) * limit;
        const where = {};
        if (status) {
            where.status = status;
        }
        if (dateFrom || dateTo) {
            where.createdAt = {};
            if (dateFrom)
                where.createdAt.gte = new Date(dateFrom);
            if (dateTo)
                where.createdAt.lte = new Date(dateTo);
        }
        if (search) {
            where.OR = [
                { orderNumber: { contains: search, mode: 'insensitive' } },
                { guestEmail: { contains: search, mode: 'insensitive' } },
                { user: { email: { contains: search, mode: 'insensitive' } } },
                { trackingNumber: { contains: search, mode: 'insensitive' } }
            ];
        }
        const [orders, total] = await Promise.all([
            prisma_1.prisma.order.findMany({
                where,
                include: {
                    user: { select: { id: true, email: true, username: true } },
                    orderItems: true,
                    payments: true
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma_1.prisma.order.count({ where })
        ]);
        res.json({
            orders: orders.map(order => ({
                ...order,
                totalAmount: Number(order.totalAmount),
                subtotal: Number(order.subtotal),
                shippingCost: Number(order.shippingCost)
            })),
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    }
    catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});
// GET /admin/orders/:id - Get single order
router.get('/orders/:id', async (req, res) => {
    try {
        const order = await prisma_1.prisma.order.findUnique({
            where: { id: req.params.id },
            include: {
                user: true,
                orderItems: { include: { product: true } },
                payments: true,
                trackingHistory: true
            }
        });
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        res.json({
            ...order,
            totalAmount: Number(order.totalAmount),
            subtotal: Number(order.subtotal),
            shippingCost: Number(order.shippingCost)
        });
    }
    catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({ error: 'Failed to fetch order' });
    }
});
router.get('/products', async (req, res) => {
    try {
        const page = Number(req.query.page || 1);
        const limit = Number(req.query.limit || 50);
        const search = String(req.query.search || '').trim();
        const category = String(req.query.category || '').trim();
        const status = String(req.query.status || '').trim();
        const where = { deletedAt: null };
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { sku: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (category) {
            where.OR = [
                ...(where.OR || []),
                { categoryId: category },
                { category: { is: { slug: category } } },
                { category: { is: { name: { equals: category, mode: 'insensitive' } } } },
            ];
        }
        if (status === 'active')
            where.isPublished = true;
        if (status === 'inactive')
            where.isPublished = false;
        if (status === 'out_of_stock')
            where.stockQuantity = 0;
        const [products, total] = await Promise.all([
            prisma_1.prisma.product.findMany({
                where,
                skip: Math.max(page - 1, 0) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: productInclude,
            }),
            prisma_1.prisma.product.count({ where }),
        ]);
        res.json({
            products: products.map(serializeProduct),
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        });
    }
    catch (error) {
        console.error('Admin get products error:', error);
        res.status(500).json({ error: 'Failed to get products' });
    }
});
// POST /admin/products/bulk-upload - Bulk upload products
router.post('/products/bulk-upload', productImageUpload.array('files', 100), async (req, res) => {
    try {
        const { products } = req.body;
        if (!products) {
            return res.status(400).json({ error: 'No products data provided' });
        }
        let productsArray = [];
        try {
            productsArray = typeof products === 'string' ? JSON.parse(products) : products;
        }
        catch (e) {
            return res.status(400).json({ error: 'Invalid products JSON format' });
        }
        if (!Array.isArray(productsArray)) {
            return res.status(400).json({ error: 'Products must be an array' });
        }
        const created = [];
        const failed = [];
        for (let i = 0; i < productsArray.length; i++) {
            try {
                const productData = productPayloadSchema.parse(productsArray[i]);
                const slug = await makeUniqueSlug(productData.name);
                const product = await prisma_1.prisma.product.create({
                    data: {
                        name: productData.name,
                        slug,
                        description: productData.description || '',
                        shortDescription: productData.shortDescription,
                        price: productData.price,
                        comparePrice: productData.comparePrice,
                        stockQuantity: productData.stockQuantity,
                        sku: productData.sku,
                        weight: productData.weight,
                        weightUnit: productData.unit,
                        isPublished: productData.isPublished,
                        isFeatured: productData.isFeatured,
                        categoryId: productData.categoryId,
                        createdAt: new Date()
                    }
                });
                created.push(product);
            }
            catch (error) {
                failed.push({
                    index: i,
                    data: productsArray[i],
                    error: error.message
                });
            }
        }
        res.json({
            success: true,
            message: `Bulk upload completed: ${created.length} created, ${failed.length} failed`,
            created: created.length,
            failed: failed.length,
            failedItems: failed
        });
    }
    catch (error) {
        console.error('Bulk upload error:', error);
        res.status(500).json({ error: 'Bulk upload failed' });
    }
});
// GET /admin/products/bulk-export - Export all products
router.get('/products/bulk-export', async (req, res) => {
    try {
        const products = await prisma_1.prisma.product.findMany({
            where: { deletedAt: null },
            include: {
                category: { select: { name: true } },
                productImages: { select: { url: true }, take: 1 }
            },
            orderBy: { createdAt: 'desc' }
        });
        const exportData = products.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            shortDescription: p.shortDescription,
            sku: p.sku,
            category: p.category?.name,
            price: Number(p.price),
            comparePrice: p.comparePrice ? Number(p.comparePrice) : null,
            stockQuantity: p.stockQuantity,
            weight: p.weight,
            unit: p.weightUnit,
            isPublished: p.isPublished,
            isFeatured: p.isFeatured,
            image: p.productImages[0]?.url,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt
        }));
        // Set headers for CSV download
        const csvHeaders = Object.keys(exportData[0] || {});
        const csvContent = [
            csvHeaders.join(','),
            ...exportData.map(item => csvHeaders.map(header => {
                const value = item[header];
                if (value === null || value === undefined)
                    return '';
                if (typeof value === 'string' && value.includes(','))
                    return `"${value}"`;
                return value;
            }).join(','))
        ].join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="products-export.csv"');
        res.send(csvContent);
    }
    catch (error) {
        console.error('Bulk export error:', error);
        res.status(500).json({ error: 'Bulk export failed' });
    }
});
router.get('/products/:id', async (req, res) => {
    try {
        const product = await prisma_1.prisma.product.findFirst({
            where: { id: req.params.id, deletedAt: null },
            include: productInclude,
        });
        if (!product)
            return res.status(404).json({ error: 'Product not found' });
        res.json({ product: serializeProduct(product) });
    }
    catch (error) {
        console.error('Admin get product error:', error);
        res.status(500).json({ error: 'Failed to get product' });
    }
});
router.post('/products', productImageUpload.array('images', 5), async (req, res) => {
    try {
        const data = productPayloadSchema.parse(req.body);
        const files = (req.files || []);
        const imageUrls = files.map((file) => `/uploads/products/${file.filename}`);
        const slug = await makeUniqueSlug(data.name);
        const sku = data.sku || `SKU-${Date.now()}`;
        const product = await prisma_1.prisma.product.create({
            data: {
                name: data.name,
                slug,
                sku,
                description: data.description,
                shortDescription: data.shortDescription,
                price: data.price,
                comparePrice: data.comparePrice,
                stockQuantity: data.stockQuantity,
                stockStatus: data.stockQuantity > 0 ? 'in_stock' : 'out_of_stock',
                categoryId: data.categoryId,
                weight: data.weight,
                weightUnit: data.unit,
                isPublished: data.isPublished,
                isFeatured: data.isFeatured,
                publishedAt: data.isPublished ? new Date() : null,
                productImages: {
                    create: imageUrls.map((url, index) => ({ url, sortOrder: index, isPrimary: index === 0 })),
                },
            },
            include: productInclude,
        });
        res.status(201).json({ message: 'Product created successfully', product: serializeProduct(product) });
    }
    catch (error) {
        console.error('Admin create product error:', error);
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Please check the product details and try again.', details: error.issues });
        }
        res.status(500).json({ error: 'Failed to create product' });
    }
});
router.put('/products/:id', productImageUpload.array('images', 5), async (req, res) => {
    try {
        const existing = await prisma_1.prisma.product.findFirst({ where: { id: req.params.id, deletedAt: null }, include: { productImages: true } });
        if (!existing)
            return res.status(404).json({ error: 'Product not found' });
        const data = productPayloadSchema.partial({ name: true, price: true, stockQuantity: true }).parse(req.body);
        const files = (req.files || []);
        const newImageUrls = files.map((file) => `/uploads/products/${file.filename}`);
        const keptImages = data.existingImages ? JSON.parse(data.existingImages) : existing.productImages.map((image) => image.url);
        const finalImageUrls = [...keptImages, ...newImageUrls];
        const product = await prisma_1.prisma.product.update({
            where: { id: req.params.id },
            data: {
                name: data.name,
                slug: data.name ? await makeUniqueSlug(data.name, req.params.id) : undefined,
                description: data.description,
                shortDescription: data.shortDescription,
                price: data.price,
                comparePrice: data.comparePrice,
                stockQuantity: data.stockQuantity,
                stockStatus: data.stockQuantity === undefined ? undefined : data.stockQuantity > 0 ? 'in_stock' : 'out_of_stock',
                categoryId: data.categoryId,
                weight: data.weight,
                weightUnit: data.unit,
                isPublished: data.isPublished,
                isFeatured: data.isFeatured,
                publishedAt: data.isPublished ? (existing.publishedAt || new Date()) : null,
                productImages: {
                    deleteMany: {},
                    create: finalImageUrls.map((url, index) => ({ url, sortOrder: index, isPrimary: index === 0 })),
                },
            },
            include: productInclude,
        });
        res.json({ message: 'Product updated successfully', product: serializeProduct(product) });
    }
    catch (error) {
        console.error('Admin update product error:', error);
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Please check the product details and try again.', details: error.issues });
        }
        res.status(500).json({ error: 'Failed to update product' });
    }
});
router.delete('/products/:id', async (req, res) => {
    try {
        const product = await prisma_1.prisma.product.findFirst({ where: { id: req.params.id, deletedAt: null } });
        if (!product)
            return res.status(404).json({ error: 'Product not found' });
        await prisma_1.prisma.product.update({
            where: { id: req.params.id },
            data: { deletedAt: new Date(), isPublished: false },
        });
        res.json({ message: 'Product deleted successfully' });
    }
    catch (error) {
        console.error('Admin delete product error:', error);
        res.status(500).json({ error: 'Failed to delete product' });
    }
});
router.get('/settings', async (_req, res) => {
    try {
        const settings = await prisma_1.prisma.systemSetting.findMany({
            orderBy: { group: 'asc' }
        });
        res.json({ settings });
    }
    catch (error) {
        console.error('Get admin settings error:', error);
        res.status(500).json({ error: 'Failed to get settings' });
    }
});
const updateSettingSchema = zod_1.z.object({
    key: zod_1.z.string().min(1),
    value: zod_1.z.string(),
    type: zod_1.z.enum(['string', 'number', 'boolean', 'json']).default('string'),
    description: zod_1.z.string().optional(),
    group: zod_1.z.string().default('general'),
    isPublic: zod_1.z.boolean().default(false),
});
router.post('/settings', async (req, res) => {
    try {
        const data = updateSettingSchema.parse(req.body);
        const setting = await prisma_1.prisma.systemSetting.upsert({
            where: { key: data.key },
            update: {
                value: data.value,
                type: data.type,
                description: data.description,
                group: data.group,
                isPublic: data.isPublic,
            },
            create: data,
        });
        res.json({ message: 'Setting updated successfully', setting });
    }
    catch (error) {
        console.error('Update admin settings error:', error);
        res.status(500).json({ error: 'Failed to update setting' });
    }
});
router.put('/settings/:key', async (req, res) => {
    try {
        const { key } = req.params;
        const { value } = zod_1.z.object({ value: zod_1.z.string() }).parse(req.body);
        const setting = await prisma_1.prisma.systemSetting.update({
            where: { key },
            data: { value },
        });
        res.json({ message: 'Setting updated successfully', setting });
    }
    catch (error) {
        console.error('Update admin setting error:', error);
        res.status(500).json({ error: 'Failed to update setting' });
    }
});
const communicationSchema = zod_1.z.object({
    target: zod_1.z.enum(['all', 'users', 'emails']),
    userIds: zod_1.z.array(zod_1.z.string()).optional().default([]),
    emails: zod_1.z.array(zod_1.z.string().email()).optional().default([]),
    channels: zod_1.z.array(zod_1.z.enum(['email', 'inApp', 'sms', 'whatsapp'])).min(1),
    type: zod_1.z.enum(['SYSTEM', 'PROMOTION', 'ACCOUNT']).default('SYSTEM'),
    subject: zod_1.z.string().min(3).max(160),
    message: zod_1.z.string().min(3).max(5000),
    actionUrl: zod_1.z.string().optional(),
});
router.post('/communications/send', async (req, res) => {
    try {
        const payload = communicationSchema.parse(req.body);
        const userWhere = payload.target === 'all'
            ? { deletedAt: null }
            : payload.target === 'users'
                ? { id: { in: payload.userIds } }
                : { email: { in: payload.emails } };
        const users = await prisma_1.prisma.user.findMany({
            where: userWhere,
            select: { id: true, email: true, phone: true, profile: { select: { mpesaPhone: true } } },
        });
        const existingEmails = new Set(users.map((user) => user.email));
        const rawEmailRecipients = payload.target === 'emails'
            ? payload.emails.filter((email) => !existingEmails.has(email)).map((email) => ({ email }))
            : [];
        const summary = await (0, notificationService_1.notifyRecipients)({
            type: payload.type,
            title: payload.subject,
            message: payload.message,
            actionUrl: payload.actionUrl,
            channels: payload.channels,
            recipients: [
                ...users.map((user) => ({
                    id: user.id,
                    email: user.email,
                    phone: user.phone || user.profile?.mpesaPhone,
                })),
                ...rawEmailRecipients,
            ],
        });
        res.json({ message: 'Communication processed', recipients: users.length + rawEmailRecipients.length, summary });
    }
    catch (error) {
        console.error('Admin communication error:', error);
        res.status(500).json({ error: 'Failed to send communication' });
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
        // Get total spent for each user
        const userIds = users.map(u => u.id);
        const orderTotals = await prisma_1.prisma.order.groupBy({
            by: ['userId'],
            where: {
                userId: { in: userIds },
                status: { not: 'CANCELLED' }
            },
            _sum: { totalAmount: true }
        });
        const usersWithSpending = users.map(user => {
            const orderTotal = orderTotals.find(ot => ot.userId === user.id);
            return {
                ...user,
                totalSpent: Number(orderTotal?._sum.totalAmount || 0)
            };
        });
        res.json({
            users: usersWithSpending,
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
        // Since Notification model might not exist, return mock data for now
        const notifications = [];
        const total = 0;
        const unreadCount = 0;
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
        // Mock implementation for now
        res.json({ message: 'Notification marked as read' });
    }
    catch (error) {
        console.error('Mark notification read error:', error);
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
});
router.put('/notifications/mark-all-read', async (req, res) => {
    try {
        // Mock implementation for now
        res.json({ message: 'All notifications marked as read' });
    }
    catch (error) {
        console.error('Mark all notifications read error:', error);
        res.status(500).json({ error: 'Failed to mark all notifications as read' });
    }
});
router.delete('/notifications/:id', async (req, res) => {
    try {
        // Mock implementation for now
        res.json({ message: 'Notification deleted successfully' });
    }
    catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({ error: 'Failed to delete notification' });
    }
});
// === SYSTEM METRICS ===
router.get('/system-metrics', async (req, res) => {
    try {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const [totalUsers, activeUsersToday, totalOrders, ordersToday, totalProducts, lowStockProducts] = await Promise.all([
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
            })
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
                system: {
                    database: 'connected',
                    uptime: process.uptime(),
                    memory: process.memoryUsage(),
                    nodeVersion: process.version
                }
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
//# sourceMappingURL=admin.js.map