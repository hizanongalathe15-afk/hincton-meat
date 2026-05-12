"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlashSaleModel = void 0;
const database_1 = require("../database");
const library_1 = require("@prisma/client/runtime/library");
exports.FlashSaleModel = {
    findById: async (id) => {
        const flashSale = await database_1.prisma.flashSale.findUnique({
            where: { id },
            include: {
                products: {
                    include: {
                        product: {
                            include: {
                                productImages: {
                                    where: { isPrimary: true },
                                    take: 1
                                }
                            }
                        },
                        variant: true
                    }
                }
            }
        });
        return flashSale;
    },
    findBySlug: async (slug) => {
        const flashSale = await database_1.prisma.flashSale.findUnique({
            where: { slug },
            include: {
                products: {
                    include: {
                        product: {
                            include: {
                                productImages: {
                                    where: { isPrimary: true },
                                    take: 1
                                }
                            }
                        },
                        variant: true
                    }
                }
            }
        });
        return flashSale;
    },
    findAll: async (params = {}) => {
        const { page = 1, limit = 20, status } = params;
        const skip = (page - 1) * limit;
        const where = {};
        if (status)
            where.status = status;
        const [flashSales, total] = await Promise.all([
            database_1.prisma.flashSale.findMany({
                where,
                include: {
                    products: {
                        include: {
                            product: {
                                include: {
                                    productImages: {
                                        where: { isPrimary: true },
                                        take: 1
                                    }
                                }
                            }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            database_1.prisma.flashSale.count({ where })
        ]);
        return { flashSales, total };
    },
    getActiveFlashSales: async () => {
        const now = new Date();
        const flashSales = await database_1.prisma.flashSale.findMany({
            where: {
                status: { not: 'archived' },
                startTime: { lte: now },
                endTime: { gte: now }
            },
            include: {
                products: {
                    include: {
                        product: {
                            include: {
                                productImages: {
                                    where: { isPrimary: true },
                                    take: 1
                                }
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        return flashSales;
    },
    create: async (data) => {
        const flashSale = await database_1.prisma.flashSale.create({
            data: {
                name: data.name,
                slug: data.slug,
                description: data.description,
                bannerImage: data.bannerImage,
                discountType: data.discountType,
                discountValue: new library_1.Decimal(String(data.discountValue)),
                startTime: data.startTime,
                endTime: data.endTime,
                stockLimit: data.stockLimit,
                perUserLimit: data.perUserLimit,
                status: data.status,
                createdBy: data.createdBy
            },
            include: {
                products: true
            }
        });
        return flashSale;
    },
    update: async (id, data) => {
        const updateData = {};
        if (data.name)
            updateData.name = data.name;
        if (data.slug)
            updateData.slug = data.slug;
        if (data.description !== undefined)
            updateData.description = data.description;
        if (data.bannerImage !== undefined)
            updateData.bannerImage = data.bannerImage;
        if (data.discountType)
            updateData.discountType = data.discountType;
        if (data.discountValue !== undefined)
            updateData.discountValue = new library_1.Decimal(String(data.discountValue));
        if (data.startTime)
            updateData.startTime = data.startTime;
        if (data.endTime)
            updateData.endTime = data.endTime;
        if (data.stockLimit !== undefined)
            updateData.stockLimit = data.stockLimit;
        if (data.perUserLimit)
            updateData.perUserLimit = data.perUserLimit;
        if (data.status)
            updateData.status = data.status;
        const flashSale = await database_1.prisma.flashSale.update({
            where: { id },
            data: updateData,
            include: {
                products: true
            }
        });
        return flashSale;
    },
    delete: async (id) => {
        await database_1.prisma.flashSale.update({
            where: { id },
            data: { status: 'archived' }
        });
    },
    addProduct: async (flashSaleId, productId, variantId, salePrice, originalPrice, stockAllocated) => {
        const flashSaleProduct = await database_1.prisma.flashSaleProduct.create({
            data: {
                flashSaleId,
                productId,
                variantId,
                salePrice: new library_1.Decimal(String(salePrice)),
                originalPrice: new library_1.Decimal(String(originalPrice)),
                stockAllocated
            },
            include: {
                product: {
                    include: {
                        productImages: {
                            where: { isPrimary: true },
                            take: 1
                        }
                    }
                },
                variant: true
            }
        });
        return flashSaleProduct;
    },
    removeProduct: async (id) => {
        await database_1.prisma.flashSaleProduct.delete({
            where: { id }
        });
    },
    recordPurchase: async (data) => {
        const purchase = await database_1.prisma.flashSalePurchase.create({
            data: {
                flashSaleId: data.flashSaleId,
                productId: data.productId,
                userId: data.userId,
                orderId: data.orderId,
                quantity: data.quantity,
                pricePaid: new library_1.Decimal(String(data.pricePaid))
            },
            include: {
                flashSale: true,
                order: true,
                product: true,
                user: {
                    include: {
                        profile: true
                    }
                }
            }
        });
        // Update stock sold count
        await database_1.prisma.flashSaleProduct.updateMany({
            where: {
                flashSaleId: data.flashSaleId,
                productId: data.productId
            },
            data: {
                stockSold: { increment: data.quantity }
            }
        });
        return purchase;
    },
    getFlashSaleStats: async (flashSaleId) => {
        const [totalPurchases, totalRevenue, topProducts] = await Promise.all([
            database_1.prisma.flashSalePurchase.count({
                where: { flashSaleId }
            }),
            database_1.prisma.flashSalePurchase.aggregate({
                where: { flashSaleId },
                _sum: { pricePaid: true }
            }),
            database_1.prisma.flashSalePurchase.groupBy({
                by: ['productId'],
                where: { flashSaleId },
                _count: { productId: true },
                _sum: { pricePaid: true },
                orderBy: { _sum: { pricePaid: 'desc' } },
                take: 5
            })
        ]);
        return {
            totalPurchases,
            totalRevenue: totalRevenue._sum.pricePaid || 0,
            topProducts
        };
    }
};
//# sourceMappingURL=FlashSale.js.map