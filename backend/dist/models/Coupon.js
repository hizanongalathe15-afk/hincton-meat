"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CouponModel = void 0;
const database_1 = require("../database");
exports.CouponModel = {
    findById: async (id) => {
        const coupon = await database_1.prisma.coupon.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        usages: true,
                        couponProducts: true,
                        couponCategories: true
                    }
                }
            }
        });
        return coupon;
    },
    findByCode: async (code) => {
        const coupon = await database_1.prisma.coupon.findUnique({
            where: { code: code.toUpperCase() },
            include: {
                _count: {
                    select: {
                        usages: true,
                        couponProducts: true,
                        couponCategories: true
                    }
                }
            }
        });
        return coupon;
    },
    findAll: async (params = {}) => {
        const { page = 1, limit = 20, isActive, search } = params;
        const skip = (page - 1) * limit;
        const where = {};
        if (isActive !== undefined)
            where.isActive = isActive;
        if (search) {
            where.OR = [
                { code: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ];
        }
        const [coupons, total] = await Promise.all([
            database_1.prisma.coupon.findMany({
                where,
                include: {
                    _count: {
                        select: {
                            usages: true,
                            couponProducts: true,
                            couponCategories: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            database_1.prisma.coupon.count({ where })
        ]);
        return { coupons: coupons, total };
    },
    getActiveCoupons: async () => {
        const now = new Date();
        const coupons = await database_1.prisma.coupon.findMany({
            where: {
                isActive: true,
                OR: [
                    { validFrom: null, validUntil: null },
                    { validFrom: null, validUntil: { gte: now } },
                    { validFrom: { lte: now }, validUntil: null },
                    { validFrom: { lte: now }, validUntil: { gte: now } }
                ]
            },
            include: {
                _count: {
                    select: {
                        usages: true,
                        couponProducts: true,
                        couponCategories: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        return coupons;
    },
    create: async (data) => {
        const coupon = await database_1.prisma.coupon.create({
            data: {
                code: data.code.toUpperCase(),
                description: data.description,
                discountType: data.discountType,
                // Assign directly; let Prisma coerce if Decimal type exists in schema.
                discountValue: data.discountValue,
                minimumSpend: data.minimumSpend ?? null,
                maximumDiscount: data.maximumDiscount ?? null,
                usageLimit: data.usageLimit,
                usageLimitPerUser: data.usageLimitPerUser,
                usedCount: data.usedCount,
                validFrom: data.validFrom,
                validUntil: data.validUntil,
                isActive: data.isActive,
                stackable: data.stackable,
                firstOrderOnly: data.firstOrderOnly
            },
            include: {
                _count: {
                    select: {
                        usages: true,
                        couponProducts: true,
                        couponCategories: true
                    }
                }
            }
        });
        return coupon;
    },
    update: async (id, data) => {
        const updateData = {};
        // Manually assign fields to avoid type errors
        if (data.code)
            updateData.code = data.code.toUpperCase();
        if (data.description !== undefined)
            updateData.description = data.description;
        if (data.discountType)
            updateData.discountType = data.discountType;
        if (data.discountValue !== undefined)
            updateData.discountValue = data.discountValue;
        if (data.minimumSpend !== undefined)
            updateData.minimumSpend = data.minimumSpend;
        if (data.maximumDiscount !== undefined)
            updateData.maximumDiscount = data.maximumDiscount;
        if (data.usageLimit !== undefined)
            updateData.usageLimit = data.usageLimit;
        if (data.usageLimitPerUser !== undefined)
            updateData.usageLimitPerUser = data.usageLimitPerUser;
        if (data.usedCount !== undefined)
            updateData.usedCount = data.usedCount;
        if (data.validFrom !== undefined)
            updateData.validFrom = data.validFrom;
        if (data.validUntil !== undefined)
            updateData.validUntil = data.validUntil;
        if (data.isActive !== undefined)
            updateData.isActive = data.isActive;
        if (data.stackable !== undefined)
            updateData.stackable = data.stackable;
        if (data.firstOrderOnly !== undefined)
            updateData.firstOrderOnly = data.firstOrderOnly;
        const coupon = await database_1.prisma.coupon.update({
            where: { id },
            data: updateData,
            include: {
                _count: {
                    select: {
                        usages: true,
                        couponProducts: true,
                        couponCategories: true
                    }
                }
            }
        });
        return coupon;
    },
    delete: async (id) => {
        await database_1.prisma.coupon.delete({
            where: { id }
        });
    },
    validateCoupon: async (code, userId, cartTotal) => {
        const coupon = await exports.CouponModel.findByCode(code);
        if (!coupon) {
            return { valid: false, error: 'Coupon not found' };
        }
        if (!coupon.isActive) {
            return { valid: false, error: 'Coupon is inactive' };
        }
        const now = new Date();
        if (coupon.validFrom && coupon.validFrom > now) {
            return { valid: false, error: 'Coupon is not yet valid' };
        }
        if (coupon.validUntil && coupon.validUntil < now) {
            return { valid: false, error: 'Coupon has expired' };
        }
        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
            return { valid: false, error: 'Coupon usage limit reached' };
        }
        if (cartTotal && coupon.minimumSpend && Number(cartTotal) < Number(coupon.minimumSpend)) {
            return { valid: false, error: `Minimum spend of ${coupon.minimumSpend} required` };
        }
        if (userId) {
            const userUsageCount = await database_1.prisma.couponUsage.count({
                where: {
                    couponId: coupon.id,
                    userId
                }
            });
            if (userUsageCount >= coupon.usageLimitPerUser) {
                return { valid: false, error: 'Coupon usage limit per user reached' };
            }
        }
        return { valid: true, coupon };
    },
    incrementUsage: async (id) => {
        await database_1.prisma.coupon.update({
            where: { id },
            data: { usedCount: { increment: 1 } }
        });
    },
    getCouponStats: async (params = {}) => {
        const { startDate, endDate } = params;
        const where = {};
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate)
                where.createdAt.gte = startDate;
            if (endDate)
                where.createdAt.lte = endDate;
        }
        const [totalCoupons, activeCoupons, totalUsage, topCoupons] = await Promise.all([
            database_1.prisma.coupon.count({ where }),
            database_1.prisma.coupon.count({ where: { ...where, isActive: true } }),
            database_1.prisma.coupon.aggregate({
                where,
                _sum: { usedCount: true }
            }),
            database_1.prisma.coupon.findMany({
                where,
                orderBy: { usedCount: 'desc' },
                take: 10,
                select: {
                    id: true,
                    code: true,
                    usedCount: true,
                    discountType: true,
                    discountValue: true
                }
            })
        ]);
        return {
            totalCoupons,
            activeCoupons,
            totalUsage: totalUsage._sum.usedCount || 0,
            topCoupons: topCoupons.map(c => ({
                ...c,
                discountValue: Number(c.discountValue)
            }))
        };
    }
};
//# sourceMappingURL=Coupon.js.map