"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WishlistModel = void 0;
const database_1 = require("../database");
exports.WishlistModel = {
    findById: async (id) => {
        const item = await database_1.prisma.wishlistItem.findUnique({
            where: { id },
            include: {
                product: {
                    include: {
                        productImages: true
                    }
                },
                variant: true,
                wishlist: {
                    include: {
                        user: true
                    }
                }
            }
        });
        if (!item)
            return null;
        return {
            ...item,
            product: item.product ? {
                ...item.product,
                price: Number(item.product.price)
            } : undefined,
            variant: item.variant ? {
                ...item.variant,
                price: item.variant.price ? Number(item.variant.price) : undefined
            } : undefined
        };
    },
    findByUserId: async (userId) => {
        const wishlist = await database_1.prisma.wishlist.findUnique({
            where: { userId },
            include: {
                items: {
                    include: {
                        product: {
                            include: {
                                productImages: true
                            }
                        },
                        variant: true
                    }
                }
            }
        });
        if (!wishlist || !wishlist.items)
            return [];
        return wishlist.items.map(item => ({
            ...item,
            product: item.product ? {
                ...item.product,
                price: Number(item.product.price)
            } : undefined,
            variant: item.variant ? {
                ...item.variant,
                price: item.variant.price ? Number(item.variant.price) : undefined
            } : undefined
        }));
    },
    create: async (wishlistData) => {
        const item = await database_1.prisma.wishlistItem.create({
            data: {
                wishlistId: wishlistData.wishlistId,
                productId: wishlistData.productId,
                variantId: wishlistData.variantId,
                quantity: wishlistData.quantity || 1,
                notes: wishlistData.notes
            },
            include: {
                product: {
                    include: {
                        productImages: true
                    }
                },
                variant: true,
                wishlist: {
                    include: {
                        user: true
                    }
                }
            }
        });
        return {
            ...item,
            product: item.product ? {
                ...item.product,
                price: Number(item.product.price)
            } : undefined,
            variant: item.variant ? {
                ...item.variant,
                price: item.variant.price ? Number(item.variant.price) : undefined
            } : undefined
        };
    },
    delete: async (id) => {
        await database_1.prisma.wishlistItem.delete({
            where: { id }
        });
    },
    deleteByUserProduct: async (userId, productId) => {
        // First find the user's wishlist
        const wishlist = await database_1.prisma.wishlist.findUnique({
            where: { userId }
        });
        if (wishlist) {
            // Delete specific product from the wishlist
            await database_1.prisma.wishlistItem.deleteMany({
                where: {
                    wishlistId: wishlist.id,
                    productId
                }
            });
        }
    }
};
//# sourceMappingURL=Wishlist.js.map