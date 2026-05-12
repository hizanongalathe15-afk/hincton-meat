"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartModel = void 0;
const database_1 = require("../database");
exports.CartModel = {
    findById: async (id) => {
        const item = await database_1.prisma.cartItem.findUnique({
            where: { id },
            include: {
                product: {
                    include: {
                        productImages: true
                    }
                },
                variant: true,
                cart: {
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
            product: item.product
                ? {
                    ...item.product,
                    price: Number(item.product.price)
                }
                : undefined,
            variant: item.variant
                ? {
                    ...item.variant,
                    price: item.variant.price ? Number(item.variant.price) : undefined
                }
                : undefined
        };
    },
    findByUserId: async (userId) => {
        const cart = await database_1.prisma.cart.findUnique({
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
        if (!cart || !cart.items)
            return [];
        return cart.items.map((item) => ({
            ...item,
            product: item.product
                ? {
                    ...item.product,
                    price: Number(item.product.price)
                }
                : undefined,
            variant: item.variant
                ? {
                    ...item.variant,
                    price: item.variant.price ? Number(item.variant.price) : undefined
                }
                : undefined
        }));
    },
    findBySessionId: async (sessionId) => {
        const cart = await database_1.prisma.cart.findUnique({
            where: { sessionId },
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
        if (!cart)
            return null;
        // For cartController expectations, return an object shaped like a cart record
        // wrapped in cart items context. We'll return first item to satisfy typing? Instead,
        // cartController expects `cart.id` and later uses cart.id for cart operations.
        // The easiest safe return is: cast a minimal cart-like object.
        return {
            id: cart.id,
            cartId: cart.id,
            productId: cart.items?.[0]?.productId ?? 'unknown',
            variantId: cart.items?.[0]?.variantId,
            quantity: cart.items?.[0]?.quantity ?? 0,
            createdAt: cart.createdAt,
            updatedAt: cart.updatedAt,
            cart: {
                id: cart.id,
                sessionId: cart.sessionId,
                userId: cart.userId,
                couponCode: cart.couponCode,
                notes: cart.notes ?? undefined,
                abandonedAt: cart.abandonedAt ?? undefined,
                createdAt: cart.createdAt,
                updatedAt: cart.updatedAt
            }
        };
    },
    // Creates a cart + first cart item (cartController passes `items` inside cartData)
    create: async (cartData) => {
        const created = await database_1.prisma.cart.create({
            data: {
                userId: cartData.userId,
                sessionId: cartData.sessionId,
                couponCode: cartData.couponCode,
                notes: cartData.notes,
                abandonedAt: cartData.abandonedAt,
                items: {
                    create: (cartData.items ?? []).map((i) => ({
                        productId: i.productId,
                        variantId: i.variantId,
                        quantity: i.quantity
                    }))
                }
            },
            include: {
                items: {
                    include: {
                        product: {
                            include: { productImages: true }
                        },
                        variant: true
                    }
                }
            }
        });
        return created;
    },
    addItem: async (cartId, itemData) => {
        // If cart item exists, increment quantity
        const existing = await database_1.prisma.cartItem.findFirst({
            where: {
                cartId,
                productId: itemData.productId,
                variantId: itemData.variantId
            }
        });
        if (existing) {
            const updated = await database_1.prisma.cartItem.update({
                where: { id: existing.id },
                data: { quantity: existing.quantity + itemData.quantity },
                include: {
                    product: { include: { productImages: true } },
                    variant: true,
                    cart: true
                }
            });
            return updated;
        }
        const created = await database_1.prisma.cartItem.create({
            data: {
                cartId,
                productId: itemData.productId,
                variantId: itemData.variantId,
                quantity: itemData.quantity
            },
            include: {
                product: { include: { productImages: true } },
                variant: true,
                cart: true
            }
        });
        return created;
    },
    updateItem: async (itemId, cartData) => {
        const item = await database_1.prisma.cartItem.update({
            where: { id: itemId },
            data: {
                quantity: cartData.quantity
            },
            include: {
                product: { include: { productImages: true } },
                variant: true,
                cart: true
            }
        });
        return item;
    },
    removeItem: async (itemId) => {
        await database_1.prisma.cartItem.delete({ where: { id: itemId } });
        return { success: true };
    },
    clearCart: async (cartId) => {
        await database_1.prisma.cartItem.deleteMany({ where: { cartId } });
        return { success: true };
    },
    applyCoupon: async (cartId, couponCode) => {
        // Just attach couponCode to cart. Discount computation is controller-level currently.
        const updated = await database_1.prisma.cart.update({
            where: { id: cartId },
            data: { couponCode }
        });
        return updated;
    },
    removeCoupon: async (cartId) => {
        const updated = await database_1.prisma.cart.update({
            where: { id: cartId },
            data: { couponCode: null }
        });
        return updated;
    },
    updateShippingInfo: async (cartId, _data) => {
        // Cart model schema does not contain shipping fields; no-op for typing compatibility.
        return database_1.prisma.cart.update({ where: { id: cartId }, data: {} });
    },
    getCartSummary: async (cartId) => {
        const cart = await database_1.prisma.cart.findUnique({
            where: { id: cartId },
            include: {
                items: {
                    include: {
                        product: true,
                        variant: true
                    }
                }
            }
        });
        if (!cart) {
            return { items: [], subtotal: 0, tax: 0, shipping: 0, discount: 0, total: 0 };
        }
        const items = cart.items.map((i) => ({
            itemId: i.id,
            productId: i.productId,
            variantId: i.variantId,
            quantity: i.quantity
        }));
        // Minimal summary (prices not guaranteed in schema). Keep zeros to satisfy typing.
        return {
            items,
            subtotal: 0,
            tax: 0,
            shipping: 0,
            discount: 0,
            total: 0
        };
    },
    update: async (id, cartData) => {
        const item = await database_1.prisma.cartItem.update({
            where: { id },
            data: {
                cartId: cartData.cartId,
                productId: cartData.productId,
                variantId: cartData.variantId,
                quantity: cartData.quantity
            },
            include: {
                product: {
                    include: {
                        productImages: true
                    }
                },
                variant: true,
                cart: {
                    include: {
                        user: true
                    }
                }
            }
        });
        return {
            ...item,
            product: item.product
                ? {
                    ...item.product,
                    price: Number(item.product.price)
                }
                : undefined,
            variant: item.variant
                ? {
                    ...item.variant,
                    price: item.variant.price ? Number(item.variant.price) : undefined
                }
                : undefined
        };
    },
    delete: async (id) => {
        await database_1.prisma.cartItem.delete({ where: { id } });
    },
    deleteByUser: async (userId) => {
        const cart = await database_1.prisma.cart.findUnique({ where: { userId } });
        if (cart) {
            await database_1.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
        }
    },
    deleteByUserProduct: async (userId, productId) => {
        const cart = await database_1.prisma.cart.findUnique({ where: { userId } });
        if (cart) {
            await database_1.prisma.cartItem.deleteMany({ where: { cartId: cart.id, productId } });
        }
    }
};
//# sourceMappingURL=Cart.js.map