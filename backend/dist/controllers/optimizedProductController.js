"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProductCounts = exports.invalidateProductCache = exports.getOptimizedProducts = void 0;
const prisma_1 = require("../config/prisma");
const ioredis_1 = __importDefault(require("ioredis"));
// Redis client for caching
const redis = new ioredis_1.default(process.env.REDIS_URL || 'redis://localhost:6379');
const CACHE_TTL = 300; // 5 minutes
const SEARCH_CACHE_TTL = 60; // 1 minute for searches
const getOptimizedProducts = async (req, res, next) => {
    try {
        const { category, subCategory, minPrice, maxPrice, minWeight, maxWeight, featured, inStock, search, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
        // Create cache key
        const cacheKey = `products:${JSON.stringify({
            category, subCategory, minPrice, maxPrice, minWeight, maxWeight,
            featured, inStock, search, page, limit, sortBy, sortOrder
        })}`;
        // Try to get from cache first
        const cached = await redis.get(cacheKey);
        if (cached) {
            return res.json(JSON.parse(cached));
        }
        const where = {
            published: true // Only show published products
        };
        // Apply filters
        if (category)
            where.category = category;
        if (subCategory)
            where.subCategory = subCategory;
        if (featured !== undefined)
            where.featured = featured === 'true';
        if (inStock !== undefined)
            where.inStock = inStock === 'true';
        if (minPrice || maxPrice) {
            where.price = {};
            if (minPrice)
                where.price.gte = parseFloat(minPrice);
            if (maxPrice)
                where.price.lte = parseFloat(maxPrice);
        }
        if (minWeight || maxWeight) {
            where.weight = {};
            if (minWeight)
                where.weight.gte = parseFloat(minWeight);
            if (maxWeight)
                where.weight.lte = parseFloat(maxWeight);
        }
        // Optimized search with full-text search
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { category: { contains: search, mode: 'insensitive' } },
                { subCategory: { contains: search, mode: 'insensitive' } }
            ];
        }
        // Optimized ordering
        const orderBy = {};
        const validSortFields = ['createdAt', 'price', 'name', 'averageRating', 'stockQuantity'];
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
        orderBy[sortField] = sortOrder;
        const skip = (Number(page) - 1) * Number(limit);
        // Optimized database query with minimal fields
        const [products, total] = await Promise.all([
            prisma_1.prisma.product.findMany({
                where,
                orderBy,
                skip,
                take: Math.min(Number(limit), 100), // Cap at 100 for performance
                select: {
                    id: true,
                    name: true,
                    price: true,
                    comparePrice: true,
                    category: true,
                    isFeatured: true,
                    stockStatus: true,
                    stockQuantity: true,
                    averageRating: true,
                    totalReviews: true,
                    weight: true,
                    weightUnit: true,
                    sku: true,
                    brand: true,
                    createdAt: true,
                    productImages: {
                        select: {
                            url: true,
                            sortOrder: true
                        },
                        orderBy: { sortOrder: 'asc' },
                        take: 3 // Only get first 3 images
                    }
                }
            }),
            prisma_1.prisma.product.count({ where })
        ]);
        const result = {
            products,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit)),
                hasMore: skip + products.length < total
            },
            filters: {
                category,
                subCategory,
                minPrice,
                maxPrice,
                featured,
                inStock,
                search,
                sortBy,
                sortOrder
            }
        };
        // Cache the result
        const ttl = search ? SEARCH_CACHE_TTL : CACHE_TTL;
        await redis.setex(cacheKey, ttl, JSON.stringify(result));
        res.json(result);
    }
    catch (error) {
        next(error);
    }
};
exports.getOptimizedProducts = getOptimizedProducts;
// Cache invalidation helper
const invalidateProductCache = async (productId) => {
    const pattern = productId ? `products:*${productId}*` : 'products:*';
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
        await redis.del(...keys);
    }
};
exports.invalidateProductCache = invalidateProductCache;
// Optimized product count by category
const getProductCounts = async (req, res, next) => {
    try {
        const cacheKey = 'product:category_counts';
        const cached = await redis.get(cacheKey);
        if (cached) {
            return res.json(JSON.parse(cached));
        }
        const counts = await prisma_1.prisma.product.groupBy({
            by: ['category'],
            where: { isPublished: true },
            _count: true
        });
        const result = counts.map(item => ({
            category: item.category,
            count: item._count
        }));
        await redis.setex(cacheKey, CACHE_TTL * 2, JSON.stringify(result)); // Longer cache for counts
        res.json({ categories: result });
    }
    catch (error) {
        next(error);
    }
};
exports.getProductCounts = getProductCounts;
//# sourceMappingURL=optimizedProductController.js.map