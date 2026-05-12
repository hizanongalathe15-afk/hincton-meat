"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const prisma_1 = require("../config/prisma");
const zod_1 = require("zod");
const meatShopMessages_1 = require("../messages/meatShopMessages");
const router = express_1.default.Router();
// Prisma models:
// - Cart: userId is optional, unique
// - CartItem: cartId + productId (+ variantId optional)
const addToCartSchema = zod_1.z.object({
    productId: zod_1.z.string().min(1),
    quantity: zod_1.z.number().int().positive(),
});
const updateCartItemSchema = zod_1.z.object({
    quantity: zod_1.z.number().int().positive(),
});
const getAuthUserId = (req) => {
    return req.user?.id ?? null;
};
const getGuestSessionId = (req) => {
    const value = req.header('X-Guest-Session-Id');
    return typeof value === 'string' && value.trim().length >= 12 ? value.trim() : null;
};
const getCartScope = (req) => {
    const userId = getAuthUserId(req);
    if (userId)
        return { userId };
    const sessionId = getGuestSessionId(req);
    if (sessionId)
        return { sessionId };
    return null;
};
const getCartWhere = (scope) => {
    return scope.userId ? { userId: scope.userId } : { sessionId: scope.sessionId };
};
const getOrCreateCart = async (scope) => {
    if (scope.userId) {
        return prisma_1.prisma.cart.upsert({
            where: { userId: scope.userId },
            create: { userId: scope.userId },
            update: {},
        });
    }
    return prisma_1.prisma.cart.upsert({
        where: { sessionId: scope.sessionId },
        create: { sessionId: scope.sessionId },
        update: {},
    });
};
const toMoneyNumber = (v) => {
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) ? n : 0;
};
const apiMessage = (message, values) => {
    const resolved = (0, meatShopMessages_1.resolveMessage)(message, values);
    return { ...resolved, error: resolved.message };
};
// GET /api/cart
router.get('/', async (req, res) => {
    try {
        const scope = getCartScope(req);
        if (!scope)
            return res.status(400).json(apiMessage(meatShopMessages_1.meatShopMessages.system.sessionExpired));
        const cart = await prisma_1.prisma.cart.findUnique({
            where: getCartWhere(scope),
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                price: true,
                                stockQuantity: true,
                                isPublished: true,
                                isFeatured: true,
                                category: { select: { id: true, name: true, slug: true } },
                                productImages: { select: { url: true } },
                            },
                        },
                    },
                },
            },
        });
        const items = (cart?.items ?? []).map((item) => {
            const price = toMoneyNumber(item.product?.price);
            const totalPrice = price * item.quantity;
            const images = item.product?.productImages?.map((img) => img.url) ?? [];
            return {
                id: item.id,
                productId: item.productId,
                variantId: item.variantId,
                quantity: item.quantity,
                product: {
                    id: item.product?.id,
                    name: item.product?.name,
                    price: price,
                    stockQuantity: item.product?.stockQuantity,
                    category: item.product?.category,
                    images,
                },
                totalPrice,
            };
        });
        const subtotal = items.reduce((sum, i) => sum + i.totalPrice, 0);
        res.json({
            cart: {
                items,
                summary: {
                    totalItems: items.reduce((s, i) => s + i.quantity, 0),
                    subtotal,
                },
            },
        });
    }
    catch (error) {
        console.error('Get cart error:', error);
        res.status(500).json(apiMessage(meatShopMessages_1.meatShopMessages.system.serverBusy));
    }
});
// POST /api/cart/add
router.post('/add', async (req, res) => {
    try {
        const scope = getCartScope(req);
        if (!scope)
            return res.status(400).json(apiMessage(meatShopMessages_1.meatShopMessages.system.sessionExpired));
        const { productId, quantity } = addToCartSchema.parse(req.body);
        const product = await prisma_1.prisma.product.findUnique({
            where: { id: productId },
            select: { id: true, name: true, price: true, stockQuantity: true },
        });
        if (!product)
            return res.status(404).json(apiMessage(meatShopMessages_1.meatShopMessages.stock.unavailable));
        if (product.stockQuantity < quantity) {
            return res.status(400).json(apiMessage(meatShopMessages_1.meatShopMessages.cart.stockRemaining, { quantity: product.stockQuantity }));
        }
        const cart = await getOrCreateCart(scope);
        // if CartItem exists for (cartId, productId, variantId=null)
        const existing = await prisma_1.prisma.cartItem.findFirst({
            where: {
                cartId: cart.id,
                productId,
                variantId: null,
            },
        });
        const nextQty = (existing?.quantity ?? 0) + quantity;
        if (product.stockQuantity < nextQty) {
            return res.status(400).json(apiMessage(meatShopMessages_1.meatShopMessages.cart.stockRemaining, { quantity: product.stockQuantity }));
        }
        const item = existing
            ? await prisma_1.prisma.cartItem.update({
                where: { id: existing.id },
                data: { quantity: nextQty },
            })
            : await prisma_1.prisma.cartItem.create({
                data: {
                    cartId: cart.id,
                    productId,
                    quantity,
                },
            });
        res.status(201).json({
            ...(0, meatShopMessages_1.resolveMessage)(meatShopMessages_1.meatShopMessages.cart.itemAddedNamed, { quantity, name: product.name }),
            itemId: item.id,
        });
    }
    catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json(apiMessage(meatShopMessages_1.meatShopMessages.system.serverBusy));
    }
});
// PUT /api/cart/item/:itemId
router.put('/item/:itemId', async (req, res) => {
    try {
        const scope = getCartScope(req);
        if (!scope)
            return res.status(400).json(apiMessage(meatShopMessages_1.meatShopMessages.system.sessionExpired));
        const { itemId } = req.params;
        const { quantity } = updateCartItemSchema.parse(req.body);
        const cart = await prisma_1.prisma.cart.findUnique({ where: getCartWhere(scope) });
        if (!cart)
            return res.status(404).json(apiMessage(meatShopMessages_1.meatShopMessages.cart.restored));
        const existing = await prisma_1.prisma.cartItem.findFirst({
            where: { id: itemId, cartId: cart.id },
            include: { product: { select: { stockQuantity: true } } },
        });
        if (!existing)
            return res.status(404).json(apiMessage(meatShopMessages_1.meatShopMessages.stock.unavailable));
        if (existing.product.stockQuantity < quantity) {
            return res.status(400).json(apiMessage(meatShopMessages_1.meatShopMessages.cart.stockRemaining, { quantity: existing.product.stockQuantity }));
        }
        const updated = await prisma_1.prisma.cartItem.update({
            where: { id: existing.id },
            data: { quantity },
        });
        res.json({ ...(0, meatShopMessages_1.resolveMessage)(meatShopMessages_1.meatShopMessages.cart.updated), item: updated });
    }
    catch (error) {
        console.error('Update cart item error:', error);
        res.status(500).json(apiMessage(meatShopMessages_1.meatShopMessages.system.serverBusy));
    }
});
// DELETE /api/cart/item/:itemId
router.delete('/item/:itemId', async (req, res) => {
    try {
        const scope = getCartScope(req);
        if (!scope)
            return res.status(400).json(apiMessage(meatShopMessages_1.meatShopMessages.system.sessionExpired));
        const { itemId } = req.params;
        const cart = await prisma_1.prisma.cart.findUnique({ where: getCartWhere(scope) });
        if (!cart)
            return res.status(404).json(apiMessage(meatShopMessages_1.meatShopMessages.cart.restored));
        const item = await prisma_1.prisma.cartItem.findFirst({ where: { id: itemId, cartId: cart.id } });
        if (!item)
            return res.status(404).json(apiMessage(meatShopMessages_1.meatShopMessages.stock.unavailable));
        await prisma_1.prisma.cartItem.delete({ where: { id: item.id } });
        res.json((0, meatShopMessages_1.resolveMessage)(meatShopMessages_1.meatShopMessages.cart.itemRemoved));
    }
    catch (error) {
        console.error('Remove cart item error:', error);
        res.status(500).json(apiMessage(meatShopMessages_1.meatShopMessages.system.serverBusy));
    }
});
// DELETE /api/cart/clear
router.delete('/clear', async (req, res) => {
    try {
        const scope = getCartScope(req);
        if (!scope)
            return res.status(400).json(apiMessage(meatShopMessages_1.meatShopMessages.system.sessionExpired));
        const cart = await prisma_1.prisma.cart.findUnique({ where: getCartWhere(scope) });
        if (!cart)
            return res.status(200).json((0, meatShopMessages_1.resolveMessage)(meatShopMessages_1.meatShopMessages.cart.cleared));
        await prisma_1.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
        res.json((0, meatShopMessages_1.resolveMessage)(meatShopMessages_1.meatShopMessages.cart.cleared));
    }
    catch (error) {
        console.error('Clear cart error:', error);
        res.status(500).json(apiMessage(meatShopMessages_1.meatShopMessages.system.serverBusy));
    }
});
exports.default = router;
//# sourceMappingURL=cart.js.map