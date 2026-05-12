"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const prisma_1 = require("../config/prisma");
const router = express_1.default.Router();
// Minimal schema-aligned subscription delivery endpoint
// Prisma models: Subscription, SubscriptionDelivery, SubscriptionDeliveryItem
router.get('/mine', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ error: 'Invalid token' });
        const subscriptions = await prisma_1.prisma.subscription.findMany({
            where: { userId },
            orderBy: { startDate: 'desc' },
            include: {
                subscriptionPlan: true,
                deliveries: {
                    orderBy: { scheduledDate: 'asc' },
                    take: 20,
                    include: {
                        items: {
                            include: {
                                product: {
                                    select: {
                                        id: true,
                                        name: true,
                                        price: true,
                                        productImages: {
                                            select: { url: true }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
        });
        res.json({ subscriptions });
    }
    catch (error) {
        console.error('Get subscriptions error:', error);
        res.status(500).json({ error: 'Failed to get subscriptions' });
    }
});
router.post('/', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ error: 'Invalid token' });
        const { planId, startDate } = req.body;
        if (!planId) {
            return res.status(400).json({ error: 'Plan ID is required' });
        }
        // Check if user already has an active subscription
        const existingSubscription = await prisma_1.prisma.subscription.findFirst({
            where: {
                userId,
                status: 'ACTIVE'
            }
        });
        if (existingSubscription) {
            return res.status(400).json({ error: 'User already has an active subscription' });
        }
        // Get the subscription plan
        const plan = await prisma_1.prisma.subscriptionPlan.findUnique({
            where: { code: planId }
        });
        if (!plan) {
            return res.status(404).json({ error: 'Subscription plan not found' });
        }
        // Create the subscription
        const subscription = await prisma_1.prisma.subscription.create({
            data: {
                userId,
                planId: plan.id,
                plan: plan.name,
                status: 'active',
                startDate: new Date(startDate || Date.now()),
                nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
                deliveryFrequency: plan.interval || 'monthly',
                paymentMethod: 'MPESA'
            }
        });
        res.status(201).json({
            message: 'Subscription created successfully',
            subscription
        });
    }
    catch (error) {
        console.error('Create subscription error:', error);
        res.status(500).json({ error: 'Failed to create subscription' });
    }
});
exports.default = router;
//# sourceMappingURL=subscriptions.js.map