"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductModel = void 0;
const database_1 = require("../database");
exports.ProductModel = {
    findById: async (id) => {
        const product = await database_1.prisma.product.findUnique({
            where: { id },
            include: {
                productImages: true,
                category: true,
                vendor: true
            }
        });
        if (!product)
            return null;
        return {
            ...product,
            price: Number(product.price),
            comparePrice: product.comparePrice ? Number(product.comparePrice) : undefined,
            costPrice: product.costPrice ? Number(product.costPrice) : undefined,
            wholesalePrice: product.wholesalePrice ? Number(product.wholesalePrice) : undefined
        };
    },
    findAll: async (filters) => {
        const products = await database_1.prisma.product.findMany({
            where: {
                isPublished: true,
                deletedAt: null,
                ...filters
            },
            include: {
                productImages: true,
                category: true,
                vendor: true
            },
            orderBy: { createdAt: 'desc' }
        });
        return products.map(product => ({
            ...product,
            price: Number(product.price),
            comparePrice: product.comparePrice ? Number(product.comparePrice) : undefined,
            costPrice: product.costPrice ? Number(product.costPrice) : undefined,
            wholesalePrice: product.wholesalePrice ? Number(product.wholesalePrice) : undefined
        }));
    },
    create: async (productData) => {
        const product = await database_1.prisma.product.create({
            data: {
                name: productData.name,
                slug: productData.slug || productData.name.toLowerCase().replace(/\s+/g, '-'),
                description: productData.description,
                shortDescription: productData.shortDescription,
                price: productData.price,
                comparePrice: productData.comparePrice,
                costPrice: productData.costPrice,
                wholesalePrice: productData.wholesalePrice,
                sku: productData.sku || `PROD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                barcode: productData.barcode,
                mpn: productData.mpn,
                gtin: productData.gtin,
                stockQuantity: productData.stockQuantity || 0,
                lowStockThreshold: productData.lowStockThreshold || 5,
                stockStatus: productData.stockStatus || 'in_stock',
                weight: productData.weight,
                length: productData.length,
                width: productData.width,
                height: productData.height,
                brand: productData.brand,
                vendorId: productData.vendorId,
                categoryId: productData.categoryId,
                averageRating: productData.averageRating || 0,
                totalReviews: productData.totalReviews || 0,
                totalSold: productData.totalSold || 0,
                isPublished: productData.isPublished || false,
                isFeatured: productData.isFeatured || false,
                isNew: productData.isNew || false,
                isOnSale: productData.isOnSale || false,
                isDigital: productData.isDigital || false,
                isPreorder: productData.isPreorder || false,
                preorderDate: productData.preorderDate,
                seoTitle: productData.seoTitle,
                seoDescription: productData.seoDescription,
                metaKeywords: productData.metaKeywords,
                canonicalUrl: productData.canonicalUrl,
                publishedAt: productData.isPublished ? new Date() : undefined
            },
            include: {
                productImages: true,
                category: true,
                vendor: true
            }
        });
        return {
            ...product,
            price: Number(product.price),
            comparePrice: product.comparePrice ? Number(product.comparePrice) : undefined,
            costPrice: product.costPrice ? Number(product.costPrice) : undefined,
            wholesalePrice: product.wholesalePrice ? Number(product.wholesalePrice) : undefined
        };
    },
    update: async (id, productData) => {
        const product = await database_1.prisma.product.update({
            where: { id },
            data: {
                name: productData.name,
                slug: productData.slug,
                description: productData.description,
                shortDescription: productData.shortDescription,
                price: productData.price,
                comparePrice: productData.comparePrice,
                costPrice: productData.costPrice,
                wholesalePrice: productData.wholesalePrice,
                sku: productData.sku,
                barcode: productData.barcode,
                mpn: productData.mpn,
                gtin: productData.gtin,
                stockQuantity: productData.stockQuantity,
                lowStockThreshold: productData.lowStockThreshold,
                stockStatus: productData.stockStatus,
                weight: productData.weight,
                length: productData.length,
                width: productData.width,
                height: productData.height,
                brand: productData.brand,
                vendorId: productData.vendorId,
                categoryId: productData.categoryId,
                averageRating: productData.averageRating,
                totalReviews: productData.totalReviews,
                totalSold: productData.totalSold,
                isPublished: productData.isPublished,
                isFeatured: productData.isFeatured,
                isNew: productData.isNew,
                isOnSale: productData.isOnSale,
                isDigital: productData.isDigital,
                isPreorder: productData.isPreorder,
                preorderDate: productData.preorderDate,
                seoTitle: productData.seoTitle,
                seoDescription: productData.seoDescription,
                metaKeywords: productData.metaKeywords,
                canonicalUrl: productData.canonicalUrl,
                publishedAt: productData.isPublished ? new Date() : undefined
            },
            include: {
                productImages: true,
                category: true,
                vendor: true
            }
        });
        return {
            ...product,
            price: Number(product.price),
            comparePrice: product.comparePrice ? Number(product.comparePrice) : undefined,
            costPrice: product.costPrice ? Number(product.costPrice) : undefined,
            wholesalePrice: product.wholesalePrice ? Number(product.wholesalePrice) : undefined
        };
    },
    delete: async (id) => {
        await database_1.prisma.product.delete({
            where: { id }
        });
    },
    getProductStats: async (params = {}) => {
        const { startDate, endDate } = params;
        const where = { deletedAt: null };
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate)
                where.createdAt.gte = startDate;
            if (endDate)
                where.createdAt.lte = endDate;
        }
        const totalProducts = await database_1.prisma.product.count({ where });
        return { totalProducts };
    },
    getTopSellingProducts: async (limit = 10) => {
        const products = await database_1.prisma.product.findMany({
            where: { isPublished: true, deletedAt: null },
            include: { productImages: true, category: true, vendor: true },
            orderBy: { totalSold: 'desc' },
            take: limit
        });
        return {
            products: products.map(product => ({
                ...product,
                price: Number(product.price),
                comparePrice: product.comparePrice ? Number(product.comparePrice) : undefined,
                costPrice: product.costPrice ? Number(product.costPrice) : undefined,
                wholesalePrice: product.wholesalePrice ? Number(product.wholesalePrice) : undefined
            }))
        };
    },
    getLowStockProducts: async (limit = 20) => {
        const products = await database_1.prisma.product.findMany({
            where: {
                isPublished: true,
                deletedAt: null,
                stockQuantity: { lte: 0 }
            },
            include: { productImages: true, category: true, vendor: true },
            orderBy: { stockQuantity: 'asc' },
            take: limit
        });
        return {
            products: products.map(product => ({
                ...product,
                price: Number(product.price),
                comparePrice: product.comparePrice ? Number(product.comparePrice) : undefined,
                costPrice: product.costPrice ? Number(product.costPrice) : undefined,
                wholesalePrice: product.wholesalePrice ? Number(product.wholesalePrice) : undefined
            }))
        };
    },
    // Search methods
    search: async (params) => {
        const { query, categoryId, minPrice, maxPrice, brand, sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 20 } = params;
        const skip = (page - 1) * limit;
        const where = {
            isPublished: true
        };
        if (query) {
            where.OR = [
                { name: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
                { shortDescription: { contains: query, mode: 'insensitive' } },
                { sku: { contains: query, mode: 'insensitive' } },
                { brand: { contains: query, mode: 'insensitive' } },
                { metaKeywords: { contains: query, mode: 'insensitive' } }
            ];
        }
        if (categoryId) {
            where.categoryId = categoryId;
        }
        if (brand) {
            where.brand = { contains: brand, mode: 'insensitive' };
        }
        if (minPrice !== undefined || maxPrice !== undefined) {
            where.price = {};
            if (minPrice !== undefined)
                where.price.gte = minPrice;
            if (maxPrice !== undefined)
                where.price.lte = maxPrice;
        }
        const [products, total] = await Promise.all([
            database_1.prisma.product.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
                include: {
                    productImages: true,
                    category: true,
                    vendor: true
                }
            }),
            database_1.prisma.product.count({ where })
        ]);
        return {
            products: products.map(product => ({
                ...product,
                price: Number(product.price),
                comparePrice: product.comparePrice ? Number(product.comparePrice) : undefined,
                costPrice: product.costPrice ? Number(product.costPrice) : undefined,
                wholesalePrice: product.wholesalePrice ? Number(product.wholesalePrice) : undefined
            })),
            total,
            page,
            limit,
            pages: Math.ceil(total / limit)
        };
    },
    getSearchSuggestions: async (query, limit = 10) => {
        const products = await database_1.prisma.product.findMany({
            where: {
                isPublished: true,
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { brand: { contains: query, mode: 'insensitive' } },
                    { sku: { contains: query, mode: 'insensitive' } }
                ]
            },
            select: {
                id: true,
                name: true,
                brand: true,
                sku: true,
                productImages: {
                    select: {
                        url: true,
                        isPrimary: true
                    },
                    orderBy: { sortOrder: 'asc' },
                    take: 1
                }
            },
            orderBy: { totalSold: 'desc' },
            take: limit
        });
        return products.map(product => ({
            id: product.id,
            name: product.name,
            brand: product.brand,
            sku: product.sku,
            image: product.productImages[0]?.url || null,
            type: 'product'
        }));
    },
    getPopularSearches: async (limit = 10) => {
        // Return popular search terms (you can implement this based on search analytics)
        return [
            { term: 'beef', count: 150 },
            { term: 'chicken', count: 120 },
            { term: 'goat meat', count: 80 },
            { term: 'sausage', count: 65 },
            { term: 'ribs', count: 45 },
            { term: 'steak', count: 40 },
            { term: 'mince', count: 35 },
            { term: 'fillet', count: 30 },
            { term: 'burgers', count: 25 },
            { term: 'grilled', count: 20 }
        ].slice(0, limit);
    },
    getAutocompleteSuggestions: async (query, limit = 5) => {
        const products = await database_1.prisma.product.findMany({
            where: {
                isPublished: true,
                name: { contains: query, mode: 'insensitive' }
            },
            select: {
                id: true,
                name: true,
                brand: true,
                productImages: {
                    select: {
                        url: true,
                        isPrimary: true
                    },
                    orderBy: { sortOrder: 'asc' },
                    take: 1
                }
            },
            orderBy: { totalSold: 'desc' },
            take: limit
        });
        return products.map(product => ({
            id: product.id,
            name: product.name,
            brand: product.brand,
            image: product.productImages[0]?.url || null,
            type: 'product'
        }));
    },
    getBrandSuggestions: async (query, limit = 5) => {
        const brands = await database_1.prisma.product.findMany({
            where: {
                isPublished: true,
                brand: { contains: query, mode: 'insensitive' }
            },
            select: {
                brand: true
            },
            distinct: ['brand'],
            orderBy: { totalSold: 'desc' },
            take: limit
        });
        return brands
            .filter(item => item.brand)
            .map(item => ({
            name: item.brand,
            type: 'brand'
        }));
    },
    advancedSearch: async (params) => {
        const { query, categories, brands, tags, minPrice, maxPrice, minRating, maxRating, inStock, onSale, sortBy = 'relevance', sortOrder = 'desc', page = 1, limit = 20 } = params;
        const skip = (page - 1) * limit;
        const startTime = Date.now();
        const where = {
            isPublished: true
        };
        if (query) {
            where.OR = [
                { name: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
                { shortDescription: { contains: query, mode: 'insensitive' } },
                { brand: { contains: query, mode: 'insensitive' } }
            ];
        }
        if (categories && categories.length > 0) {
            where.categoryId = { in: categories };
        }
        if (brands && brands.length > 0) {
            where.brand = { in: brands };
        }
        if (tags && tags.length > 0) {
            where.metaKeywords = { contains: tags.join(' '), mode: 'insensitive' };
        }
        if (minPrice !== undefined || maxPrice !== undefined) {
            where.price = {};
            if (minPrice !== undefined)
                where.price.gte = minPrice;
            if (maxPrice !== undefined)
                where.price.lte = maxPrice;
        }
        if (minRating !== undefined) {
            where.averageRating = { gte: minRating };
        }
        if (maxRating !== undefined) {
            where.averageRating = { ...where.averageRating, lte: maxRating };
        }
        if (inStock !== undefined) {
            where.stockQuantity = inStock ? { gt: 0 } : { lte: 0 };
        }
        if (onSale !== undefined) {
            where.isOnSale = onSale;
        }
        const orderBy = {};
        if (sortBy === 'relevance') {
            // For relevance, prioritize by totalSold and rating
            orderBy.totalSold = 'desc';
            orderBy.averageRating = 'desc';
        }
        else {
            orderBy[sortBy] = sortOrder;
        }
        const [products, total] = await Promise.all([
            database_1.prisma.product.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                include: {
                    productImages: true,
                    category: true,
                    vendor: true
                }
            }),
            database_1.prisma.product.count({ where })
        ]);
        const searchTime = Date.now() - startTime;
        return {
            products: products.map(product => ({
                ...product,
                price: Number(product.price),
                comparePrice: product.comparePrice ? Number(product.comparePrice) : undefined,
                costPrice: product.costPrice ? Number(product.costPrice) : undefined,
                wholesalePrice: product.wholesalePrice ? Number(product.wholesalePrice) : undefined
            })),
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
            searchTime,
            facets: {
                categories: await exports.ProductModel.getCategoryFacets(where),
                brands: await exports.ProductModel.getBrandFacets(where),
                priceRanges: await exports.ProductModel.getPriceRangeFacets(where)
            }
        };
    },
    // Helper methods for advanced search facets
    getCategoryFacets: async (where) => {
        const categories = await database_1.prisma.product.groupBy({
            by: ['categoryId'],
            where,
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } }
        });
        return categories.map(cat => ({
            id: cat.categoryId,
            count: cat._count.id
        }));
    },
    getBrandFacets: async (where) => {
        const brands = await database_1.prisma.product.groupBy({
            by: ['brand'],
            where,
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } }
        });
        return brands.filter(brand => brand.brand).map(brand => ({
            name: brand.brand,
            count: brand._count.id
        }));
    },
    getPriceRangeFacets: async (where) => {
        const products = await database_1.prisma.product.findMany({
            where,
            select: { price: true },
            orderBy: { price: 'asc' }
        });
        const prices = products.map(p => Number(p.price));
        if (prices.length === 0)
            return [];
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const range = max - min;
        const step = range / 5;
        return [
            { min: min, max: min + step, count: prices.filter(p => p >= min && p < min + step).length },
            { min: min + step, max: min + step * 2, count: prices.filter(p => p >= min + step && p < min + step * 2).length },
            { min: min + step * 2, max: min + step * 3, count: prices.filter(p => p >= min + step * 2 && p < min + step * 3).length },
            { min: min + step * 3, max: min + step * 4, count: prices.filter(p => p >= min + step * 3 && p < min + step * 4).length },
            { min: min + step * 4, max: max, count: prices.filter(p => p >= min + step * 4 && p <= max).length }
        ];
    }
};
//# sourceMappingURL=Product.js.map