"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WishlistModel = void 0;
const index_1 = require("../index");
exports.WishlistModel = {
    findById: async (id) => {
        const item = await index_1.prisma.wishlistItem.findUnique({
            where: { id },
            include: {
                product: true
            }
        });
        return item ? {
            ...item,
            updatedAt: item.updatedAt
        } : null;
    },
    findByUserId: async (userId) => {
        const items = await index_1.prisma.wishlistItem.findMany({
            where: { userId },
            include: {
                product: true
            },
            orderBy: { createdAt: 'desc' }
        });
        return items.map(item => ({
            ...item,
            updatedAt: item.updatedAt
        }));
    },
    create: async (wishlistData) => {
        const item = await index_1.prisma.wishlistItem.create({
            data: {
                userId: wishlistData.userId,
                productId: wishlistData.productId
            },
            include: {
                product: true
            }
        });
        return {
            ...item,
            updatedAt: item.updatedAt
        };
    },
    delete: async (id) => {
        await index_1.prisma.wishlistItem.delete({
            where: { id }
        });
    },
    deleteByUserProduct: async (userId, productId) => {
        await index_1.prisma.wishlistItem.deleteMany({
            where: {
                userId,
                productId
            }
        });
    }
};
//# sourceMappingURL=Wishlist.js.map