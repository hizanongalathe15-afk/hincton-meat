"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderModel = void 0;
const index_1 = require("../index");
exports.OrderModel = {
    findById: async (id) => {
        const order = await index_1.prisma.order.findUnique({
            where: { id },
            include: {
                items: true
            }
        });
        return order ? {
            ...order,
            status: order.status,
            paymentStatus: order.paymentStatus,
            refundStatus: order.refundStatus
        } : null;
    },
    findByUserId: async (userId) => {
        const orders = await index_1.prisma.order.findMany({
            where: { userId },
            include: {
                items: true
            },
            orderBy: { createdAt: 'desc' }
        });
        return orders.map(order => ({
            ...order,
            status: order.status,
            paymentStatus: order.paymentStatus,
            refundStatus: order.refundStatus,
            items: order.items || []
        }));
    },
    findAll: async (filters) => {
        const orders = await index_1.prisma.order.findMany({
            where: filters,
            orderBy: { createdAt: 'desc' }
        });
        return orders.map(order => ({
            ...order,
            status: order.status,
            paymentStatus: order.paymentStatus,
            refundStatus: order.refundStatus,
            items: order.items || []
        }));
    },
    create: async (orderData) => {
        const order = await index_1.prisma.order.create({
            data: {
                userId: orderData.userId,
                totalAmount: orderData.totalAmount,
                status: orderData.status,
                paymentStatus: orderData.paymentStatus,
                paymentMethod: orderData.paymentMethod,
                paymentId: orderData.paymentId,
                deliveryAddress: orderData.deliveryAddress,
                deliveryFee: orderData.deliveryFee,
                estimatedDeliveryTime: orderData.estimatedDeliveryTime,
                actualDeliveryTime: orderData.actualDeliveryTime,
                specialInstructions: orderData.specialInstructions,
                orderNotes: orderData.orderNotes,
                refundAmount: orderData.refundAmount,
                refundStatus: orderData.refundStatus
            },
            include: {
                items: true
            }
        });
        return {
            ...order,
            status: order.status,
            paymentStatus: order.paymentStatus,
            refundStatus: order.refundStatus,
            items: order.items || []
        };
    },
    update: async (id, orderData) => {
        const order = await index_1.prisma.order.update({
            where: { id },
            data: {
                totalAmount: orderData.totalAmount,
                status: orderData.status,
                paymentStatus: orderData.paymentStatus,
                paymentMethod: orderData.paymentMethod,
                paymentId: orderData.paymentId,
                deliveryAddress: orderData.deliveryAddress,
                deliveryFee: orderData.deliveryFee,
                estimatedDeliveryTime: orderData.estimatedDeliveryTime,
                actualDeliveryTime: orderData.actualDeliveryTime,
                specialInstructions: orderData.specialInstructions,
                orderNotes: orderData.orderNotes,
                refundAmount: orderData.refundAmount,
                refundStatus: orderData.refundStatus
            },
            include: {
                items: true
            }
        });
        return {
            ...order,
            status: order.status,
            paymentStatus: order.paymentStatus,
            refundStatus: order.refundStatus,
            items: order.items || []
        };
    },
    delete: async (id) => {
        await index_1.prisma.order.delete({
            where: { id }
        });
    }
};
//# sourceMappingURL=Order.js.map