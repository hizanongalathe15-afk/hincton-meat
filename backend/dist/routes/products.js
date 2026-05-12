"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const prisma_1 = require("../config/prisma");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, 'uploads/products/');
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path_1.default.extname(file.originalname));
    },
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith('image/'))
            return cb(null, true);
        cb(new Error('Only image files are allowed'));
    },
});
const slugify = (input) => input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
const parsePageInt = (value, fallback) => {
    const s = typeof value === 'string' ? value : undefined;
    const n = s ? parseInt(s, 10) : NaN;
    return Number.isFinite(n) ? n : fallback;
};
const getProductOrderBy = (sortBy, sortOrder) => {
    const direction = sortOrder === 'asc' ? 'asc' : 'desc';
    switch (sortBy) {
        case 'price':
            return [{ price: direction }, { createdAt: 'desc' }];
        case 'rating':
        case 'averageRating':
            return [{ averageRating: 'desc' }, { totalReviews: 'desc' }, { createdAt: 'desc' }];
        case 'newest':
        case 'createdAt':
            return [{ createdAt: direction }];
        case 'name':
            return [{ name: direction }];
        case 'featured':
        default:
            return [{ isFeatured: 'desc' }, { totalSold: 'desc' }, { createdAt: 'desc' }];
    }
};
const deriveRating = (reviews) => {
    const r = reviews ?? [];
    const reviewCount = r.length;
    const averageRating = reviewCount > 0 ? r.reduce((sum, x) => sum + x.rating, 0) / reviewCount : 0;
    return { averageRating, reviewCount };
};
const defaultSearchAliases = {
    grilling: ['steak', 't-bone', 'rib eye', 'rump', 'choma', 'kebab', 'sausages'],
    grill: ['steak', 't-bone', 'rib eye', 'rump', 'choma', 'kebab', 'sausages'],
    stew: ['cubes', 'beef cubes', 'goat', 'brisket', 'shin', 'chuck'],
    cheap: ['mince', 'bones', 'offal', 'liver', 'matumbo'],
    broth: ['bones', 'soup', 'stock'],
    quick: ['sausages', 'mince', 'strips', 'fillet'],
    dinner: ['sausages', 'mince', 'strips', 'fillet', 'chicken'],
};
const expandSearchTerms = async (query) => {
    const terms = [query];
    try {
        const setting = await prisma_1.prisma.systemSetting.findUnique({ where: { key: 'search_aliases' } });
        const aliases = (setting ? { ...defaultSearchAliases, ...JSON.parse(setting.value) } : defaultSearchAliases);
        const lower = query.toLowerCase();
        Object.entries(aliases).forEach(([key, values]) => {
            if (lower.includes(key))
                terms.push(...values);
        });
    }
    catch {
        Object.entries(defaultSearchAliases).forEach(([key, values]) => {
            if (query.toLowerCase().includes(key))
                terms.push(...values);
        });
    }
    return Array.from(new Set(terms.filter(Boolean)));
};
const createProductSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    description: zod_1.z.string().optional(),
    shortDescription: zod_1.z.string().optional(),
    price: zod_1.z.number().positive(),
    comparePrice: zod_1.z.number().positive().optional(),
    stockQuantity: zod_1.z.number().int().min(0),
    isFeatured: zod_1.z.boolean().optional().default(false),
    isPublished: zod_1.z.boolean().optional().default(true),
    categoryId: zod_1.z.string().optional(),
});
const updateProductSchema = createProductSchema.partial();
const productInclude = {
    category: { select: { id: true, name: true, slug: true } },
    reviews: { select: { rating: true } },
    productImages: { select: { url: true } },
};
const serializeProduct = (product) => {
    const { averageRating, reviewCount } = deriveRating(product.reviews);
    return {
        ...product,
        images: product.productImages?.map((img) => img.url) ?? [],
        averageRating,
        reviewCount,
    };
};
// GET /api/products/featured
router.get('/featured', async (req, res) => {
    try {
        const { limit = '8' } = req.query;
        const limitNum = parsePageInt(limit, 8);
        const products = await prisma_1.prisma.product.findMany({
            where: { isFeatured: true, isPublished: true, deletedAt: null, stockQuantity: { gt: 0 } },
            take: limitNum,
            orderBy: { createdAt: 'desc' },
            include: productInclude,
        });
        res.json({ products: products.map(serializeProduct) });
    }
    catch (error) {
        console.error('Get featured products error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /api/products
router.get('/', async (req, res) => {
    try {
        const { page = '1', limit = '20', category, categoryId, minPrice, maxPrice, search, sortBy = 'featured', sortOrder = 'desc' } = req.query;
        const pageNum = parsePageInt(page, 1);
        const limitNum = parsePageInt(limit, 20);
        const skip = (pageNum - 1) * limitNum;
        const orderBy = getProductOrderBy(sortBy, sortOrder);
        const where = { isPublished: true, deletedAt: null };
        const andFilters = [];
        if (categoryId)
            where.categoryId = String(categoryId);
        if (category) {
            const categoryValue = String(category);
            andFilters.push({
                OR: [
                    { categoryId: categoryValue },
                    { category: { is: { slug: categoryValue } } },
                    { category: { is: { name: { equals: categoryValue, mode: 'insensitive' } } } },
                ],
            });
        }
        if (minPrice || maxPrice) {
            where.price = {};
            if (minPrice)
                where.price.gte = parseFloat(String(minPrice));
            if (maxPrice)
                where.price.lte = parseFloat(String(maxPrice));
        }
        if (search) {
            const s = String(search);
            const searchTerms = await expandSearchTerms(s);
            andFilters.push({
                OR: searchTerms.flatMap((term) => [
                    { name: { contains: term, mode: 'insensitive' } },
                    { description: { contains: term, mode: 'insensitive' } },
                    { shortDescription: { contains: term, mode: 'insensitive' } },
                    { slug: { contains: term, mode: 'insensitive' } },
                    { category: { is: { name: { contains: term, mode: 'insensitive' } } } },
                ]),
            });
        }
        if (andFilters.length)
            where.AND = andFilters;
        const [products, total] = await Promise.all([
            prisma_1.prisma.product.findMany({
                where,
                skip,
                take: limitNum,
                orderBy,
                include: productInclude,
            }),
            prisma_1.prisma.product.count({ where }),
        ]);
        res.json({
            products: products.map(serializeProduct),
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum),
            },
        });
    }
    catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /api/products/:id
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const product = await prisma_1.prisma.product.findUnique({
            where: { id },
            include: {
                ...productInclude,
                reviews: { select: { rating: true, title: true, comment: true, createdAt: true, userId: true } },
            },
        });
        if (!product)
            return res.status(404).json({ error: 'Product not found' });
        res.json(serializeProduct(product));
    }
    catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /api/products (Admin)
router.post('/', auth_1.authenticate, (0, auth_1.authorize)('ADMIN'), upload.array('images', 5), async (req, res) => {
    try {
        const productData = createProductSchema.parse(req.body);
        const files = (req.files ?? []);
        const imageUrls = files.map((file) => `/uploads/products/${file.filename}`);
        const created = await prisma_1.prisma.product.create({
            data: {
                name: productData.name,
                slug: slugify(productData.name),
                description: productData.description,
                shortDescription: productData.shortDescription,
                price: productData.price,
                comparePrice: productData.comparePrice,
                stockQuantity: productData.stockQuantity,
                isFeatured: productData.isFeatured ?? false,
                isPublished: productData.isPublished ?? true,
                sku: `SKU-${Date.now()}`,
                // In this Prisma schema, Product.categoryId is optional; but strict Prisma types sometimes
                // infer it as `never` depending on relation usage. Use an unchecked create field via `as any`.
                productImages: { create: imageUrls.map((url) => ({ url })) },
            },
            include: { reviews: { select: { rating: true } }, productImages: { select: { url: true } } },
        });
        const { averageRating, reviewCount } = deriveRating(created.reviews);
        res.status(201).json({
            message: 'Product created successfully',
            product: {
                ...created,
                images: created.productImages?.map((img) => img.url) ?? [],
                averageRating,
                reviewCount,
            },
        });
    }
    catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// PUT /api/products/:id (Admin)
router.put('/:id', auth_1.authenticate, (0, auth_1.authorize)('ADMIN'), upload.array('images', 5), async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = updateProductSchema.parse(req.body);
        const files = (req.files ?? []);
        const imageUrls = files.map((file) => `/uploads/products/${file.filename}`);
        const existing = await prisma_1.prisma.product.findUnique({ where: { id } });
        if (!existing)
            return res.status(404).json({ error: 'Product not found' });
        const updated = await prisma_1.prisma.product.update({
            where: { id },
            data: {
                name: updateData.name,
                slug: updateData.name ? slugify(updateData.name) : undefined,
                description: updateData.description,
                shortDescription: updateData.shortDescription,
                price: updateData.price,
                comparePrice: updateData.comparePrice,
                stockQuantity: updateData.stockQuantity,
                isFeatured: updateData.isFeatured,
                isPublished: updateData.isPublished,
                categoryId: updateData.categoryId,
                ...(imageUrls.length
                    ? { productImages: { create: imageUrls.map((url) => ({ url })) } }
                    : {}),
            },
            include: { reviews: { select: { rating: true } }, productImages: { select: { url: true } } },
        });
        const { averageRating, reviewCount } = deriveRating(updated.reviews);
        res.json({
            message: 'Product updated successfully',
            product: {
                ...updated,
                images: updated.productImages?.map((img) => img.url) ?? [],
                averageRating,
                reviewCount,
            },
        });
    }
    catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// DELETE /api/products/:id (Admin)
router.delete('/:id', auth_1.authenticate, (0, auth_1.authorize)('ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await prisma_1.prisma.product.findFirst({ where: { id, deletedAt: null } });
        if (!existing)
            return res.status(404).json({ error: 'Product not found' });
        await prisma_1.prisma.product.update({
            where: { id },
            data: { deletedAt: new Date(), isPublished: false },
        });
        res.json({ message: 'Product deleted successfully' });
    }
    catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /api/products/featured/list
router.get('/featured/list', async (req, res) => {
    try {
        const { limit = '8' } = req.query;
        const limitNum = parsePageInt(limit, 8);
        const products = await prisma_1.prisma.product.findMany({
            where: { isFeatured: true, stockQuantity: { gt: 0 } },
            take: limitNum,
            orderBy: { createdAt: 'desc' },
            include: {
                reviews: { select: { rating: true } },
                productImages: { select: { url: true } },
            },
        });
        const productsWithDerived = products.map((product) => {
            const { averageRating, reviewCount } = deriveRating(product.reviews);
            return {
                ...product,
                images: product.productImages.map((img) => img.url),
                averageRating,
                reviewCount,
            };
        });
        res.json({ products: productsWithDerived });
    }
    catch (error) {
        console.error('Get featured products error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=products.js.map