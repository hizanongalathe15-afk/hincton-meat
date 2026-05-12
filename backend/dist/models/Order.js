"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderModel = void 0;
const database_1 = require("../database");
const client_1 = require("@prisma/client");
exports.OrderModel = {
    findById: async (id) => {
        const order = await database_1.prisma.order.findUnique({
            where: { id },
            include: {
                orderItems: true,
                user: {
                    include: {
                        profile: true
                    }
                },
                payments: true
            }
        });
        if (!order)
            return null;
        return {
            ...order,
            subtotal: Number(order.subtotal),
            shippingCost: Number(order.shippingCost),
            taxAmount: Number(order.taxAmount),
            discountAmount: Number(order.discountAmount),
            totalAmount: Number(order.totalAmount),
            couponDiscount: Number(order.couponDiscount),
            orderItems: order.orderItems.map(item => ({
                ...item,
                unitPrice: Number(item.unitPrice),
                totalPrice: Number(item.totalPrice),
                discount: Number(item.discount),
                taxAmount: Number(item.taxAmount)
            })),
            payments: order.payments.map(payment => ({
                ...payment,
                amount: Number(payment.amount)
            }))
        };
    },
    findByUserId: async (userId) => {
        const orders = await database_1.prisma.order.findMany({
            where: { userId },
            include: {
                orderItems: true,
                user: {
                    include: {
                        profile: true
                    }
                },
                payments: true
            },
            orderBy: { createdAt: 'desc' }
        });
        return orders.map(order => ({
            ...order,
            subtotal: Number(order.subtotal),
            shippingCost: Number(order.shippingCost),
            taxAmount: Number(order.taxAmount),
            discountAmount: Number(order.discountAmount),
            totalAmount: Number(order.totalAmount),
            couponDiscount: Number(order.couponDiscount),
            orderItems: order.orderItems.map(item => ({
                ...item,
                unitPrice: Number(item.unitPrice),
                totalPrice: Number(item.totalPrice),
                discount: Number(item.discount),
                taxAmount: Number(item.taxAmount)
            })),
            payments: order.payments.map(payment => ({
                ...payment,
                amount: Number(payment.amount)
            }))
        }));
    },
    findAll: async (filters) => {
        const orders = await database_1.prisma.order.findMany({
            where: {
                deletedAt: null,
                ...filters
            },
            include: {
                orderItems: true,
                user: {
                    include: {
                        profile: true
                    }
                },
                payments: true
            },
            orderBy: { createdAt: 'desc' }
        });
        return orders.map(order => ({
            ...order,
            subtotal: Number(order.subtotal),
            shippingCost: Number(order.shippingCost),
            taxAmount: Number(order.taxAmount),
            discountAmount: Number(order.discountAmount),
            totalAmount: Number(order.totalAmount),
            couponDiscount: Number(order.couponDiscount),
            orderItems: order.orderItems.map(item => ({
                ...item,
                unitPrice: Number(item.unitPrice),
                totalPrice: Number(item.totalPrice),
                discount: Number(item.discount),
                taxAmount: Number(item.taxAmount)
            })),
            payments: order.payments.map(payment => ({
                ...payment,
                amount: Number(payment.amount)
            }))
        }));
    },
    create: async (orderData) => {
        const order = await database_1.prisma.order.create({
            data: {
                orderNumber: orderData.orderNumber || `ORD-${Date.now()}`,
                userId: orderData.userId,
                guestEmail: orderData.guestEmail,
                guestPhone: orderData.guestPhone,
                guestSessionId: orderData.guestSessionId,
                status: orderData.status,
                paymentStatus: orderData.paymentStatus,
                deliveryStatus: orderData.deliveryStatus,
                subtotal: orderData.subtotal || 0,
                shippingCost: orderData.shippingCost || 0,
                taxAmount: orderData.taxAmount || 0,
                discountAmount: orderData.discountAmount || 0,
                totalAmount: orderData.totalAmount,
                currency: orderData.currency || client_1.Currency.USD,
                couponCode: orderData.couponCode,
                couponDiscount: orderData.couponDiscount || 0,
                shippingAddress: orderData.shippingAddress,
                billingAddress: orderData.billingAddress,
                shippingMethod: orderData.shippingMethod,
                trackingNumber: orderData.trackingNumber,
                courier: orderData.courier,
                trackingUrl: orderData.trackingUrl,
                pickupStationId: orderData.pickupStationId,
                pickupCode: orderData.pickupCode,
                pickupCodeExpiresAt: orderData.pickupCodeExpiresAt,
                qrSecret: orderData.qrSecret,
                qrSecretExpiresAt: orderData.qrSecretExpiresAt,
                verificationMethod: orderData.verificationMethod || 'HYBRID',
                idVerified: orderData.idVerified || false,
                idLast4: orderData.idLast4,
                pickedAt: orderData.pickedAt,
                pickedByAgentId: orderData.pickedByAgentId,
                verificationAttempts: orderData.verificationAttempts || 0,
                failedVerificationAttempts: orderData.failedVerificationAttempts || 0,
                lockedUntil: orderData.lockedUntil,
                estimatedDelivery: orderData.estimatedDelivery,
                deliveredAt: orderData.deliveredAt,
                notes: orderData.notes,
                adminNotes: orderData.adminNotes,
                ipAddress: orderData.ipAddress,
                userAgent: orderData.userAgent
            },
            include: {
                orderItems: true,
                user: {
                    include: {
                        profile: true
                    }
                },
                payments: true
            }
        });
        return {
            ...order,
            subtotal: Number(order.subtotal),
            shippingCost: Number(order.shippingCost),
            taxAmount: Number(order.taxAmount),
            discountAmount: Number(order.discountAmount),
            totalAmount: Number(order.totalAmount),
            couponDiscount: Number(order.couponDiscount),
            orderItems: order.orderItems.map(item => ({
                ...item,
                unitPrice: Number(item.unitPrice),
                totalPrice: Number(item.totalPrice),
                discount: Number(item.discount),
                taxAmount: Number(item.taxAmount)
            })),
            payments: order.payments.map(payment => ({
                ...payment,
                amount: Number(payment.amount)
            }))
        };
    },
    update: async (id, orderData) => {
        const order = await database_1.prisma.order.update({
            where: { id },
            data: {
                status: orderData.status,
                paymentStatus: orderData.paymentStatus,
                deliveryStatus: orderData.deliveryStatus,
                subtotal: orderData.subtotal,
                shippingCost: orderData.shippingCost,
                taxAmount: orderData.taxAmount,
                discountAmount: orderData.discountAmount,
                totalAmount: orderData.totalAmount,
                currency: orderData.currency,
                couponCode: orderData.couponCode,
                couponDiscount: orderData.couponDiscount,
                shippingAddress: orderData.shippingAddress,
                billingAddress: orderData.billingAddress,
                shippingMethod: orderData.shippingMethod,
                trackingNumber: orderData.trackingNumber,
                courier: orderData.courier,
                trackingUrl: orderData.trackingUrl,
                pickupStationId: orderData.pickupStationId,
                pickupCode: orderData.pickupCode,
                pickupCodeExpiresAt: orderData.pickupCodeExpiresAt,
                qrSecret: orderData.qrSecret,
                qrSecretExpiresAt: orderData.qrSecretExpiresAt,
                verificationMethod: orderData.verificationMethod,
                idVerified: orderData.idVerified,
                idLast4: orderData.idLast4,
                pickedAt: orderData.pickedAt,
                pickedByAgentId: orderData.pickedByAgentId,
                verificationAttempts: orderData.verificationAttempts,
                failedVerificationAttempts: orderData.failedVerificationAttempts,
                lockedUntil: orderData.lockedUntil,
                estimatedDelivery: orderData.estimatedDelivery,
                deliveredAt: orderData.deliveredAt,
                notes: orderData.notes,
                adminNotes: orderData.adminNotes,
                ipAddress: orderData.ipAddress,
                userAgent: orderData.userAgent,
                cancelledAt: orderData.cancelledAt,
                refundedAt: orderData.refundedAt
            },
            include: {
                orderItems: true,
                user: {
                    include: {
                        profile: true
                    }
                },
                payments: true
            }
        });
        return {
            ...order,
            subtotal: Number(order.subtotal),
            shippingCost: Number(order.shippingCost),
            taxAmount: Number(order.taxAmount),
            discountAmount: Number(order.discountAmount),
            totalAmount: Number(order.totalAmount),
            couponDiscount: Number(order.couponDiscount),
            orderItems: order.orderItems.map(item => ({
                ...item,
                unitPrice: Number(item.unitPrice),
                totalPrice: Number(item.totalPrice),
                discount: Number(item.discount),
                taxAmount: Number(item.taxAmount)
            })),
            payments: order.payments.map(payment => ({
                ...payment,
                amount: Number(payment.amount)
            }))
        };
    },
    getOrderStats: async (params = {}) => {
        const { startDate, endDate } = params;
        const where = { deletedAt: null };
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate)
                where.createdAt.gte = startDate;
            if (endDate)
                where.createdAt.lte = endDate;
        }
        const [totalOrders, totalRevenue, ordersByStatus] = await Promise.all([
            database_1.prisma.order.count({ where }),
            database_1.prisma.order.aggregate({
                where,
                _sum: { totalAmount: true }
            }),
            database_1.prisma.order.groupBy({
                by: ['status'],
                where,
                _count: { status: true },
                orderBy: { _count: { status: 'desc' } }
            })
        ]);
        return {
            totalOrders,
            totalRevenue: Number(totalRevenue._sum.totalAmount || 0),
            ordersByStatus: ordersByStatus.map(o => ({ status: o.status, count: o._count.status }))
        };
    },
    getSalesByMonth: async () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth() - 11, 1);
        const where = { deletedAt: null, createdAt: { gte: start } };
        const orders = await database_1.prisma.order.findMany({
            where,
            select: { createdAt: true, totalAmount: true, status: true }
        });
        const buckets = new Map();
        for (let i = 0; i < 12; i++) {
            const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            buckets.set(key, { revenue: 0, orders: 0 });
        }
        for (const o of orders) {
            const d = o.createdAt;
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const b = buckets.get(key);
            if (!b)
                continue;
            b.orders += 1;
            b.revenue += Number(o.totalAmount);
        }
        return {
            monthlyData: Array.from(buckets.entries()).map(([month, v]) => ({
                month,
                revenue: v.revenue,
                orders: v.orders
            }))
        };
    },
    delete: async (id) => {
        await database_1.prisma.order.delete({
            where: { id }
        });
    }
};
//# sourceMappingURL=Order.js.map