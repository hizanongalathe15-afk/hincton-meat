"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const prisma_1 = require("../config/prisma");
const zod_1 = require("zod");
const notificationService_1 = require("../utils/notificationService");
const meatShopMessages_1 = require("../messages/meatShopMessages");
const router = express_1.default.Router();
const apiMessage = (message, values) => {
    const resolved = (0, meatShopMessages_1.resolveMessage)(message, values);
    return { ...resolved, error: resolved.message };
};
const updateOrderStatusSchema = zod_1.z.object({
    status: zod_1.z.enum([
        'PENDING',
        'CONFIRMED',
        'PROCESSING',
        'SHIPPED',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'CANCELLED',
        'REFUNDED',
        'RETURNED',
        'PARTIALLY_SHIPPED',
        'ON_HOLD',
        'AWAITING_PAYMENT',
        'PAYMENT_FAILED',
    ]),
    notes: zod_1.z.string().optional(),
});
const createOrderSchema = zod_1.z.object({
    customer: zod_1.z.object({
        firstName: zod_1.z.string().min(1),
        lastName: zod_1.z.string().min(1),
        email: zod_1.z.string().email(),
        phone: zod_1.z.string().min(6),
    }),
    shippingAddress: zod_1.z.object({
        address: zod_1.z.string().min(1),
        city: zod_1.z.string().min(1),
        state: zod_1.z.string().min(1),
        zipCode: zod_1.z.string().min(1),
        country: zod_1.z.string().default('Kenya'),
        latitude: zod_1.z.string().optional(),
        longitude: zod_1.z.string().optional(),
    }),
    paymentMethod: zod_1.z.enum(['mpesa', 'card', 'cash']),
    mpesaPhone: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
    items: zod_1.z.array(zod_1.z.object({
        productId: zod_1.z.string().min(1),
        quantity: zod_1.z.number().int().positive(),
    })).min(1),
});
const generateOrderNumber = () => {
    const stamp = Date.now().toString(36).toUpperCase();
    const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `HMP-${stamp}-${suffix}`;
};
const getGuestSessionId = (req) => {
    const value = req.header('X-Guest-Session-Id');
    return typeof value === 'string' && value.trim().length >= 12 ? value.trim() : null;
};
const orderStatusMessage = (order) => {
    const orderNumber = order.orderNumber || order.id;
    if (order.status === 'OUT_FOR_DELIVERY')
        return (0, meatShopMessages_1.resolveMessage)(meatShopMessages_1.meatShopMessages.order.outForDelivery, { driverName: 'your driver', eta: 45 }).message;
    if (order.status === 'SHIPPED')
        return (0, meatShopMessages_1.resolveMessage)(meatShopMessages_1.meatShopMessages.order.packed).message;
    if (order.status === 'DELIVERED')
        return (0, meatShopMessages_1.resolveMessage)(meatShopMessages_1.meatShopMessages.order.delivered).message;
    if (order.status === 'PROCESSING')
        return (0, meatShopMessages_1.resolveMessage)(meatShopMessages_1.meatShopMessages.order.processing).message;
    if (order.status === 'CONFIRMED')
        return (0, meatShopMessages_1.resolveMessage)(meatShopMessages_1.meatShopMessages.payment.paymentReceived, { orderNumber }).message;
    if (order.status === 'CANCELLED')
        return `Your Hincton order ${orderNumber} has been cancelled. Contact support if this was unexpected.`;
    return `Your Hincton order ${orderNumber} status is now ${String(order.status).replace(/_/g, ' ').toLowerCase()}.`;
};
router.post('/', async (req, res) => {
    try {
        const payload = createOrderSchema.parse(req.body);
        const productIds = payload.items.map((item) => item.productId);
        const products = await prisma_1.prisma.product.findMany({
            where: { id: { in: productIds }, isPublished: true, deletedAt: null },
            include: { productImages: { orderBy: { sortOrder: 'asc' }, take: 1 } },
        });
        if (products.length !== productIds.length) {
            return res.status(400).json(apiMessage(meatShopMessages_1.meatShopMessages.stock.unavailable));
        }
        const productById = new Map(products.map((product) => [product.id, product]));
        const orderItems = payload.items.map((item) => {
            const product = productById.get(item.productId);
            if (product.stockQuantity < item.quantity) {
                throw new Error((0, meatShopMessages_1.resolveMessage)(meatShopMessages_1.meatShopMessages.cart.stockRemaining, { quantity: product.stockQuantity }).message);
            }
            const unitPrice = Number(product.price);
            return {
                product,
                quantity: item.quantity,
                unitPrice,
                totalPrice: unitPrice * item.quantity,
            };
        });
        const subtotal = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
        const shippingCost = 200;
        const totalAmount = subtotal + shippingCost;
        const userId = req.user?.id;
        const guestSessionId = userId ? null : getGuestSessionId(req);
        const paymentStatus = payload.paymentMethod === 'cash' ? 'PENDING' : 'UNPAID';
        const order = await prisma_1.prisma.$transaction(async (tx) => {
            for (const item of orderItems) {
                await tx.product.update({
                    where: { id: item.product.id },
                    data: { stockQuantity: { decrement: item.quantity } },
                });
            }
            const created = await tx.order.create({
                data: {
                    orderNumber: generateOrderNumber(),
                    userId,
                    guestEmail: userId ? undefined : payload.customer.email,
                    guestPhone: userId ? undefined : payload.customer.phone,
                    guestSessionId: guestSessionId || undefined,
                    status: 'PENDING',
                    paymentStatus: paymentStatus,
                    subtotal: subtotal,
                    shippingCost: shippingCost,
                    totalAmount: totalAmount,
                    currency: 'KES',
                    shippingAddress: {
                        ...payload.shippingAddress,
                        firstName: payload.customer.firstName,
                        lastName: payload.customer.lastName,
                        email: payload.customer.email,
                        phone: payload.customer.phone,
                    },
                    billingAddress: {
                        firstName: payload.customer.firstName,
                        lastName: payload.customer.lastName,
                        email: payload.customer.email,
                        phone: payload.customer.phone,
                    },
                    shippingMethod: 'standard',
                    notes: payload.notes,
                    orderItems: {
                        create: orderItems.map((item) => ({
                            productId: item.product.id,
                            productName: item.product.name,
                            productImage: item.product.productImages[0]?.url,
                            sku: item.product.sku,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                            totalPrice: item.totalPrice,
                        })),
                    },
                    payments: {
                        create: {
                            userId,
                            amount: totalAmount,
                            currency: 'KES',
                            paymentMethod: payload.paymentMethod,
                            status: paymentStatus,
                            mpesaPhone: payload.mpesaPhone,
                            metadata: { customer: payload.customer },
                        },
                    },
                },
                include: {
                    orderItems: true,
                    payments: true,
                },
            });
            if (userId) {
                const cart = await tx.cart.findUnique({ where: { userId } });
                if (cart)
                    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
            }
            else if (guestSessionId) {
                const cart = await tx.cart.findUnique({ where: { sessionId: guestSessionId } });
                if (cart)
                    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
            }
            return created;
        });
        (0, notificationService_1.notifyRecipients)({
            type: 'ORDER',
            title: `New order ${order.orderNumber}`,
            message: `A new order worth KES ${Number(order.totalAmount).toLocaleString()} has been placed.`,
            actionUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/orders`,
            channels: ['inApp', 'email'],
            recipients: await prisma_1.prisma.user.findMany({
                where: { roles: { has: 'ADMIN' } },
                select: { id: true, email: true, phone: true },
            }),
            data: { orderId: order.id, orderNumber: order.orderNumber },
        }).catch((error) => console.error('Admin new order notification error:', error));
        (0, notificationService_1.notifyOrderCustomer)(order, `Order received ${order.orderNumber}`, `Thank you. Your order ${order.orderNumber} has been received and is waiting for confirmation.`, ['email', 'sms', 'whatsapp'])
            .catch((error) => console.error('Customer order notification error:', error));
        res.status(201).json({ ...(0, meatShopMessages_1.resolveMessage)(meatShopMessages_1.meatShopMessages.order.created, { orderNumber: order.orderNumber }), order });
    }
    catch (error) {
        console.error('Create order error:', error);
        const message = error instanceof Error ? error.message : 'Failed to create order';
        res.status(400).json({ ...apiMessage(meatShopMessages_1.meatShopMessages.system.unknownError), error: message, message });
    }
});
router.get('/mine', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json(apiMessage(meatShopMessages_1.meatShopMessages.system.sessionExpired));
        const orders = await prisma_1.prisma.order.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ orders });
    }
    catch (error) {
        console.error('Get my orders error:', error);
        res.status(500).json(apiMessage(meatShopMessages_1.meatShopMessages.system.serverBusy));
    }
});
router.get('/:orderId', async (req, res) => {
    try {
        const userId = req.user?.id;
        const guestSessionId = userId ? null : getGuestSessionId(req);
        const { orderId } = req.params;
        const isAdmin = req.user?.roles?.some((role) => ['ADMIN', 'SUPER_ADMIN', 'SUPPORT'].includes(role));
        if (!isAdmin && !userId && !guestSessionId) {
            return res.status(400).json(apiMessage(meatShopMessages_1.meatShopMessages.system.sessionExpired));
        }
        const order = await prisma_1.prisma.order.findFirst({
            where: {
                deletedAt: null,
                OR: [
                    { id: orderId },
                    { orderNumber: orderId },
                    { trackingNumber: orderId },
                ],
                ...(isAdmin ? {} : userId ? { userId } : { guestSessionId }),
            },
            include: {
                orderItems: true,
                trackingHistory: { orderBy: { timestamp: 'asc' } },
                payments: { orderBy: { createdAt: 'desc' }, take: 1 },
            },
        });
        if (!order)
            return res.status(404).json(apiMessage(meatShopMessages_1.meatShopMessages.order.failedAttempt));
        res.json({ order });
    }
    catch (error) {
        console.error('Get order error:', error);
        res.status(500).json(apiMessage(meatShopMessages_1.meatShopMessages.system.serverBusy));
    }
});
// Admin update order status
router.put('/:orderId/status', async (req, res) => {
    try {
        const { orderId } = req.params;
        const data = updateOrderStatusSchema.parse(req.body);
        const updated = await prisma_1.prisma.order.update({
            where: { id: orderId },
            data: {
                status: data.status,
                notes: data.notes,
            },
            include: {
                user: { select: { id: true, email: true, phone: true } },
            },
        });
        await prisma_1.prisma.trackingHistory.create({
            data: {
                orderId,
                trackingNumber: updated.trackingNumber || updated.orderNumber,
                status: data.status,
                location: data.status === 'OUT_FOR_DELIVERY' ? 'Delivery route' : 'Hincton Meat Products',
                description: data.notes || orderStatusMessage(updated),
            },
        });
        (0, notificationService_1.notifyOrderCustomer)(updated, `Order update ${updated.orderNumber}`, orderStatusMessage(updated), ['inApp', 'email', 'sms', 'whatsapp'])
            .catch((error) => console.error('Order status notification error:', error));
        res.json({ ...(0, meatShopMessages_1.resolveMessage)(meatShopMessages_1.meatShopMessages.order.statusUpdated), order: updated });
    }
    catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json(apiMessage(meatShopMessages_1.meatShopMessages.system.serverBusy));
    }
});
exports.default = router;
//# sourceMappingURL=orders.js.map