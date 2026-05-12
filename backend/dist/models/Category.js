"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryModel = void 0;
const database_1 = require("../database");
exports.CategoryModel = {
    findById: async (id) => {
        const category = await database_1.prisma.category.findUnique({
            where: { id },
            include: {
                parent: true,
                children: true,
                products: {
                    where: { isPublished: true, deletedAt: null },
                    take: 10
                }
            }
        });
        return category;
    },
    findBySlug: async (slug) => {
        const category = await database_1.prisma.category.findUnique({
            where: { slug },
            include: {
                parent: true,
                children: true,
                products: {
                    where: { isPublished: true, deletedAt: null },
                    take: 10
                }
            }
        });
        return category;
    },
    findAll: async (params = {}) => {
        const { page = 1, limit = 50, parentId, isActive, isFeatured } = params;
        const skip = (page - 1) * limit;
        const where = {};
        if (parentId !== undefined)
            where.parentId = parentId;
        if (isActive !== undefined)
            where.isActive = isActive;
        if (isFeatured !== undefined)
            where.isFeatured = isFeatured;
        where.deletedAt = null;
        const [categories, total] = await Promise.all([
            database_1.prisma.category.findMany({
                where,
                include: {
                    parent: true,
                    children: true,
                    _count: {
                        select: { products: { where: { isPublished: true, deletedAt: null } } }
                    }
                },
                orderBy: { sortOrder: 'asc' },
                skip,
                take: limit
            }),
            database_1.prisma.category.count({ where })
        ]);
        return { categories, total };
    },
    create: async (data) => {
        const category = await database_1.prisma.category.create({
            data,
            include: {
                parent: true,
                children: true
            }
        });
        return category;
    },
    update: async (id, data) => {
        const category = await database_1.prisma.category.update({
            where: { id },
            data,
            include: {
                parent: true,
                children: true
            }
        });
        return category;
    },
    delete: async (id) => {
        await database_1.prisma.category.delete({
            where: { id }
        });
    },
    getRootCategories: async () => {
        const categories = await database_1.prisma.category.findMany({
            where: { parentId: null, isActive: true, deletedAt: null },
            include: {
                children: {
                    where: { isActive: true, deletedAt: null },
                    include: {
                        _count: {
                            select: { products: { where: { isPublished: true, deletedAt: null } } }
                        }
                    }
                },
                _count: {
                    select: { products: { where: { isPublished: true, deletedAt: null } } }
                }
            },
            orderBy: { sortOrder: 'asc' }
        });
        return categories;
    },
    getFeaturedCategories: async (limit = 6) => {
        const categories = await database_1.prisma.category.findMany({
            where: { isFeatured: true, isActive: true, deletedAt: null },
            include: {
                _count: {
                    select: { products: { where: { isPublished: true, deletedAt: null } } }
                }
            },
            orderBy: { sortOrder: 'asc' },
            take: limit
        });
        return categories;
    },
    // Search methods
    findAllSearch: async (params) => {
        const { search, isActive, isFeatured, page = 1, limit = 50, parentId } = params || {};
        const skip = (page - 1) * limit;
        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { slug: { contains: search, mode: 'insensitive' } }
            ];
        }
        if (isActive !== undefined)
            where.isActive = isActive;
        if (isFeatured !== undefined)
            where.isFeatured = isFeatured;
        if (parentId)
            where.parentId = parentId;
        where.deletedAt = null;
        const [categories, total] = await Promise.all([
            database_1.prisma.category.findMany({
                where,
                skip,
                take: limit,
                orderBy: { sortOrder: 'asc' },
                include: {
                    parent: true,
                    children: true
                }
            }),
            database_1.prisma.category.count({ where })
        ]);
        return {
            categories,
            total,
            page,
            limit,
            pages: Math.ceil(total / limit)
        };
    },
    getAutocompleteSuggestions: async (query, limit = 5) => {
        const categories = await database_1.prisma.category.findMany({
            where: {
                isActive: true,
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { slug: { contains: query, mode: 'insensitive' } }
                ]
            },
            select: {
                id: true,
                name: true,
                slug: true,
                image: true
            },
            orderBy: { sortOrder: 'asc' },
            take: limit
        });
        return categories.map(category => ({
            id: category.id,
            name: category.name,
            slug: category.slug,
            image: category.image,
            type: 'category'
        }));
    },
    getCategoryProducts: async (categoryId, params = {}) => {
        const { page = 1, limit = 20, sortBy = 'name', sortOrder } = params;
        const normalizedSortOrder = sortOrder === 'desc' ? 'desc' : 'asc';
        const skip = (page - 1) * limit;
        const where = {
            categoryId,
            isPublished: true,
            deletedAt: null
        };
        const [products, total] = await Promise.all([
            database_1.prisma.product.findMany({
                where,
                skip,
                take: limit,
                orderBy: {
                    ...(sortBy === 'price' ? { price: normalizedSortOrder } : { [sortBy]: normalizedSortOrder })
                },
                include: {
                    productImages: true,
                    category: true,
                    vendor: true
                }
            }),
            database_1.prisma.product.count({ where })
        ]);
        return {
            products: products.map(p => ({
                ...p,
                price: Number(p.price),
                comparePrice: p.comparePrice != null ? Number(p.comparePrice) : undefined,
                costPrice: p.costPrice != null ? Number(p.costPrice) : undefined,
                wholesalePrice: p.wholesalePrice != null ? Number(p.wholesalePrice) : undefined
            })),
            total
        };
    },
    searchCategories: async (params) => {
        const { query, isActive, page = 1, limit = 20 } = params || {};
        const skip = (page - 1) * limit;
        const where = {};
        if (query) {
            where.OR = [
                { name: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
                { slug: { contains: query, mode: 'insensitive' } }
            ];
        }
        if (isActive !== undefined) {
            where.isActive = isActive;
        }
        const [categories, total] = await Promise.all([
            database_1.prisma.category.findMany({
                where,
                skip,
                take: limit,
                orderBy: { sortOrder: 'asc' },
                include: {
                    parent: true,
                    children: true,
                    _count: {
                        select: {
                            products: {
                                where: { isPublished: true }
                            }
                        }
                    }
                }
            }),
            database_1.prisma.category.count({ where })
        ]);
        return {
            categories: categories.map(category => ({
                ...category,
                productCount: category._count.products
            })),
            total,
            page,
            limit,
            pages: Math.ceil(total / limit)
        };
    }
};
//# sourceMappingURL=Category.js.map