"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentModel = void 0;
const database_1 = require("../database");
const client_1 = require("@prisma/client");
exports.PaymentModel = {
    findById: async (id) => {
        const payment = await database_1.prisma.payment.findUnique({
            where: { id },
            include: {
                order: {
                    include: {
                        user: {
                            include: {
                                profile: true
                            }
                        }
                    }
                },
                user: {
                    include: {
                        profile: true
                    }
                },
                refunds: true
            }
        });
        return payment;
    },
    findByOrderId: async (orderId) => {
        const payments = await database_1.prisma.payment.findMany({
            where: { orderId },
            include: {
                order: true,
                user: {
                    include: {
                        profile: true
                    }
                },
                refunds: true
            },
            orderBy: { createdAt: 'desc' }
        });
        return payments;
    },
    findByUserId: async (userId, params = {}) => {
        const { page = 1, limit = 20, status } = params;
        const skip = (page - 1) * limit;
        const where = { userId };
        if (status)
            where.status = status;
        const [payments, total] = await Promise.all([
            database_1.prisma.payment.findMany({
                where,
                include: {
                    order: true,
                    refunds: true
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            database_1.prisma.payment.count({ where })
        ]);
        return { payments, total };
    },
    create: async (data) => {
        const payment = await database_1.prisma.payment.create({
            data: {
                orderId: data.orderId,
                userId: data.userId,
                amount: data.amount,
                currency: data.currency,
                paymentMethod: data.paymentMethod,
                paymentReference: data.paymentReference,
                status: data.status,
                metadata: data.metadata,
                errorMessage: data.errorMessage,
                mpesaReceipt: data.mpesaReceipt,
                mpesaPhone: data.mpesaPhone,
                mpesaTransactionDate: data.mpesaTransactionDate
            },
            include: {
                order: true,
                user: {
                    include: {
                        profile: true
                    }
                },
                refunds: true
            }
        });
        return payment;
    },
    update: async (id, data) => {
        const payment = await database_1.prisma.payment.update({
            where: { id },
            data,
            include: {
                order: true,
                user: {
                    include: {
                        profile: true
                    }
                },
                refunds: true
            }
        });
        return payment;
    },
    updateStatus: async (id, status, metadata) => {
        const payment = await database_1.prisma.payment.update({
            where: { id },
            data: {
                status,
                ...(metadata && { metadata }),
                ...(status === client_1.PaymentStatus.PAID && { completedAt: new Date() })
            },
            include: {
                order: true,
                user: {
                    include: {
                        profile: true
                    }
                },
                refunds: true
            }
        });
        return payment;
    },
    completePayment: async (id, paymentReference, metadata) => {
        const payment = await database_1.prisma.payment.update({
            where: { id },
            data: {
                status: client_1.PaymentStatus.PAID,
                paymentReference,
                completedAt: new Date(),
                ...(metadata && { metadata })
            },
            include: {
                order: true,
                user: {
                    include: {
                        profile: true
                    }
                },
                refunds: true
            }
        });
        return payment;
    },
    failPayment: async (id, errorMessage, metadata) => {
        const payment = await database_1.prisma.payment.update({
            where: { id },
            data: {
                status: client_1.PaymentStatus.FAILED,
                errorMessage,
                ...(metadata && { metadata })
            },
            include: {
                order: true,
                user: {
                    include: {
                        profile: true
                    }
                },
                refunds: true
            }
        });
        return payment;
    },
    getPaymentStats: async (params = {}) => {
        const { startDate, endDate } = params;
        const where = {};
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate)
                where.createdAt.gte = startDate;
            if (endDate)
                where.createdAt.lte = endDate;
        }
        const [totalPayments, totalRevenue, paymentsByStatus, paymentsByMethod] = await Promise.all([
            database_1.prisma.payment.count({ where }),
            database_1.prisma.payment.aggregate({
                where: { ...where, status: client_1.PaymentStatus.PAID },
                _sum: { amount: true }
            }),
            database_1.prisma.payment.groupBy({
                by: ['status'],
                where,
                _count: { status: true },
                _sum: { amount: true }
            }),
            database_1.prisma.payment.groupBy({
                by: ['paymentMethod'],
                where: { ...where, status: client_1.PaymentStatus.PAID },
                _count: { paymentMethod: true },
                _sum: { amount: true }
            })
        ]);
        return {
            totalPayments,
            totalRevenue: totalRevenue._sum.amount || 0,
            paymentsByStatus,
            paymentsByMethod
        };
    },
    getMpesaPayments: async (params = {}) => {
        const { page = 1, limit = 20, startDate, endDate } = params;
        const skip = (page - 1) * limit;
        const where = { paymentMethod: 'MPESA' };
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate)
                where.createdAt.gte = startDate;
            if (endDate)
                where.createdAt.lte = endDate;
        }
        const [payments, total] = await Promise.all([
            database_1.prisma.payment.findMany({
                where,
                include: {
                    order: true,
                    user: {
                        include: {
                            profile: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            database_1.prisma.payment.count({ where })
        ]);
        return { payments, total };
    }
};
//# sourceMappingURL=Payment.js.map