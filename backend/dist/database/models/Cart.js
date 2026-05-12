"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartModel = void 0;
const index_1 = require("../index");
exports.CartModel = {
    findById: async (id) => {
        const item = await index_1.prisma.cartItem.findUnique({
            where: { id },
            include: {
                product: true
            }
        });
        return item;
    },
    findByUserId: async (userId) => {
        const items = await index_1.prisma.cartItem.findMany({
            where: { userId },
            include: {
                product: true
            },
            orderBy: { createdAt: 'desc' }
        });
        return items;
    },
    create: async (cartData) => {
        const item = await index_1.prisma.cartItem.create({
            data: {
                productId: cartData.productId,
                quantity: cartData.quantity,
                weight: cartData.weight,
                unit: cartData.unit
            },
            include: {
                product: true
            }
        });
        return item;
    },
    update: async (id, cartData) => {
        const item = await index_1.prisma.cartItem.update({
            where: { id },
            data: cartData,
            include: {
                product: true
            }
        });
        return item;
    },
    delete: async (id) => {
        await index_1.prisma.cartItem.delete({
            where: { id }
        });
    },
    deleteByUser: async (userId) => {
        await index_1.prisma.cartItem.deleteMany({
            where: { userId }
        });
    },
    deleteByUserProduct: async (userId, productId) => {
        await index_1.prisma.cartItem.deleteMany({
            where: {
                userId,
                productId
            }
        });
    }
};
//# sourceMappingURL=Cart.js.map