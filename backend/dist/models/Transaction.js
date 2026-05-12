"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionModel = void 0;
const database_1 = require("../database");
exports.TransactionModel = {
    create: async (data) => {
        const transaction = await database_1.prisma.payment.create({
            data: {
                orderId: data.orderId,
                userId: data.userId,
                amount: data.amount,
                currency: (data.currency || 'USD'),
                paymentMethod: data.paymentMethod,
                paymentReference: data.paymentReference,
                mpesaPhone: data.mpesaPhone,
                metadata: data.metadata,
                status: 'PENDING'
            },
            include: {
                order: true,
                user: {
                    include: {
                        profile: true
                    }
                }
            }
        });
        return {
            ...transaction,
            amount: Number(transaction.amount),
            order: transaction.order ? {
                ...transaction.order,
                totalAmount: Number(transaction.order.totalAmount)
            } : undefined
        };
    },
    findById: async (id) => {
        const transaction = await database_1.prisma.payment.findUnique({
            where: { id },
            include: {
                order: true,
                user: {
                    include: {
                        profile: true
                    }
                }
            }
        });
        if (!transaction)
            return null;
        return {
            ...transaction,
            amount: Number(transaction.amount),
            order: transaction.order ? {
                ...transaction.order,
                totalAmount: Number(transaction.order.totalAmount)
            } : undefined
        };
    },
    findByOrderId: async (orderId) => {
        const transactions = await database_1.prisma.payment.findMany({
            where: { orderId },
            include: {
                order: true,
                user: {
                    include: {
                        profile: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        return transactions.map(transaction => ({
            ...transaction,
            amount: Number(transaction.amount),
            order: transaction.order ? {
                ...transaction.order,
                totalAmount: Number(transaction.order.totalAmount)
            } : undefined
        }));
    },
    findByTransactionId: async (transactionId) => {
        const transaction = await database_1.prisma.payment.findFirst({
            where: { paymentReference: transactionId },
            include: {
                order: true,
                user: {
                    include: {
                        profile: true
                    }
                }
            }
        });
        if (!transaction)
            return null;
        return {
            ...transaction,
            amount: Number(transaction.amount),
            order: transaction.order ? {
                ...transaction.order,
                totalAmount: Number(transaction.order.totalAmount)
            } : undefined
        };
    },
    update: async (id, data) => {
        const transaction = await database_1.prisma.payment.update({
            where: { id },
            data: {
                status: data.status,
                paymentReference: data.paymentReference,
                errorMessage: data.errorMessage,
                metadata: data.metadata,
                mpesaReceipt: data.mpesaReceipt,
                mpesaPhone: data.mpesaPhone,
                mpesaTransactionDate: data.mpesaTransactionDate,
                completedAt: data.completedAt
            },
            include: {
                order: true,
                user: {
                    include: {
                        profile: true
                    }
                }
            }
        });
        return {
            ...transaction,
            amount: Number(transaction.amount),
            order: transaction.order ? {
                ...transaction.order,
                totalAmount: Number(transaction.order.totalAmount)
            } : undefined
        };
    },
    findAll: async (query = {}) => {
        const transactions = await database_1.prisma.payment.findMany({
            where: query,
            include: {
                order: true,
                user: {
                    include: {
                        profile: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        return transactions.map(transaction => ({
            ...transaction,
            amount: Number(transaction.amount),
            order: transaction.order ? {
                ...transaction.order,
                totalAmount: Number(transaction.order.totalAmount)
            } : undefined
        }));
    }
};
//# sourceMappingURL=Transaction.js.map