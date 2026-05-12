"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSubscriptionStats = exports.markDeliveryDelivered = exports.updateDelivery = exports.createDelivery = exports.resumeSubscription = exports.pauseSubscription = exports.cancelSubscription = exports.updateSubscription = exports.createSubscription = exports.getUserSubscription = exports.getSubscription = exports.getSubscriptions = void 0;
const models_1 = require("../models");
const middleware_1 = require("../middleware");
const middleware_2 = require("../middleware");
const validationSchemas_1 = require("../middleware/validationSchemas");
exports.getSubscriptions = (0, middleware_1.asyncHandler)(async (req, res) => {
    const { page = 1, limit = 20, status, userId } = req.query;
    const result = await models_1.SubscriptionModel.findAll({
        page: Number(page),
        limit: Number(limit),
        status: status,
        userId: userId
    });
    res.json({
        success: true,
        data: result.subscriptions,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total: result.total,
            pages: Math.ceil(result.total / Number(limit))
        }
    });
});
exports.getSubscription = (0, middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const subscription = await models_1.SubscriptionModel.findById(id);
    if (!subscription) {
        throw new middleware_1.NotFoundError('Subscription', id);
    }
    res.json({
        success: true,
        data: subscription
    });
});
exports.getUserSubscription = (0, middleware_1.asyncHandler)(async (req, res) => {
    const { userId } = req.params;
    const subscription = await models_1.SubscriptionModel.findByUserId(userId);
    if (!subscription) {
        return res.json({
            success: true,
            data: null,
            message: 'No active subscription found'
        });
    }
    res.json({
        success: true,
        data: subscription
    });
});
exports.createSubscription = [
    (0, middleware_2.validateBody)(validationSchemas_1.subscriptionCreateSchema),
    (0, middleware_1.asyncHandler)(async (req, res) => {
        const subscriptionData = req.body;
        const userId = req.user?.id;
        if (!userId) {
            throw new middleware_1.AppError('User authentication required', 401, 'UNAUTHORIZED');
        }
        // Check if user already has active subscription
        const existingSubscription = await models_1.SubscriptionModel.findByUserId(userId);
        if (existingSubscription && existingSubscription.status === 'ACTIVE') {
            throw new middleware_1.ValidationError('User already has an active subscription');
        }
        const subscription = await models_1.SubscriptionModel.create({
            ...subscriptionData,
            userId
        });
        res.status(201).json({
            success: true,
            data: subscription,
            message: 'Subscription created successfully'
        });
    })
];
exports.updateSubscription = [
    (0, middleware_2.validateBody)(validationSchemas_1.subscriptionUpdateSchema),
    (0, middleware_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        const updateData = req.body;
        const subscription = await models_1.SubscriptionModel.findById(id);
        if (!subscription) {
            throw new middleware_1.NotFoundError('Subscription', id);
        }
        const updatedSubscription = await models_1.SubscriptionModel.update(id, updateData);
        res.json({
            success: true,
            data: updatedSubscription,
            message: 'Subscription updated successfully'
        });
    })
];
exports.cancelSubscription = (0, middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const subscription = await models_1.SubscriptionModel.findById(id);
    if (!subscription) {
        throw new middleware_1.NotFoundError('Subscription', id);
    }
    const cancelledSubscription = await models_1.SubscriptionModel.cancel(id, reason);
    res.json({
        success: true,
        data: cancelledSubscription,
        message: 'Subscription cancelled successfully'
    });
});
exports.pauseSubscription = (0, middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { pauseUntil } = req.body;
    const subscription = await models_1.SubscriptionModel.findById(id);
    if (!subscription) {
        throw new middleware_1.NotFoundError('Subscription', id);
    }
    if (subscription.status !== 'ACTIVE') {
        throw new middleware_1.ValidationError('Cannot pause subscription that is not active');
    }
    const pausedSubscription = await models_1.SubscriptionModel.pause(id, new Date(pauseUntil));
    res.json({
        success: true,
        data: pausedSubscription,
        message: 'Subscription paused successfully'
    });
});
exports.resumeSubscription = (0, middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const subscription = await models_1.SubscriptionModel.findById(id);
    if (!subscription) {
        throw new middleware_1.NotFoundError('Subscription', id);
    }
    if (subscription.status !== 'PAUSED') {
        throw new middleware_1.ValidationError('Cannot resume subscription that is not paused');
    }
    const resumedSubscription = await models_1.SubscriptionModel.resume(id);
    res.json({
        success: true,
        data: resumedSubscription,
        message: 'Subscription resumed successfully'
    });
});
exports.createDelivery = (0, middleware_1.asyncHandler)(async (req, res) => {
    const { subscriptionId } = req.params;
    const deliveryData = req.body;
    const subscription = await models_1.SubscriptionModel.findById(subscriptionId);
    if (!subscription) {
        throw new middleware_1.NotFoundError('Subscription', subscriptionId);
    }
    if (subscription.status !== 'ACTIVE') {
        throw new middleware_1.ValidationError('Cannot create delivery for inactive subscription');
    }
    const delivery = await models_1.SubscriptionModel.createDelivery(subscriptionId, deliveryData);
    res.status(201).json({
        success: true,
        data: delivery,
        message: 'Delivery created successfully'
    });
});
exports.updateDelivery = (0, middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const delivery = await models_1.SubscriptionModel.updateDelivery(id, updateData);
    res.json({
        success: true,
        data: delivery,
        message: 'Delivery updated successfully'
    });
});
exports.markDeliveryDelivered = (0, middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { trackingNumber } = req.body;
    const deliveredDelivery = await models_1.SubscriptionModel.markDeliveryDelivered(id, trackingNumber);
    res.json({
        success: true,
        data: deliveredDelivery,
        message: 'Delivery marked as delivered'
    });
});
exports.getSubscriptionStats = (0, middleware_1.asyncHandler)(async (req, res) => {
    const { startDate, endDate } = req.query;
    const stats = await models_1.SubscriptionModel.getSubscriptionStats({
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined
    });
    res.json({
        success: true,
        data: stats
    });
});
//# sourceMappingURL=subscriptionController.js.map