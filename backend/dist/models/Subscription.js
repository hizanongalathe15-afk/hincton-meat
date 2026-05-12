"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionModel = void 0;
const database_1 = require("../database");
exports.SubscriptionModel = {
    findById: async (id) => {
        const subscription = await database_1.prisma.subscription.findUnique({
            where: { id, deletedAt: null },
            include: {
                user: {
                    include: {
                        profile: true
                    }
                },
                deliveries: {
                    include: {
                        items: {
                            include: {
                                product: {
                                    include: {
                                        productImages: {
                                            where: { isPrimary: true },
                                            take: 1
                                        }
                                    }
                                }
                            }
                        }
                    },
                    orderBy: { scheduledDate: 'desc' }
                },
                payments: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        });
        return subscription;
    },
    findByUserId: async (userId) => {
        const subscription = await database_1.prisma.subscription.findFirst({
            where: { userId, deletedAt: null },
            include: {
                user: {
                    include: {
                        profile: true
                    }
                },
                deliveries: {
                    include: {
                        items: {
                            include: {
                                product: {
                                    include: {
                                        productImages: {
                                            where: { isPrimary: true },
                                            take: 1
                                        }
                                    }
                                }
                            }
                        }
                    },
                    orderBy: { scheduledDate: 'desc' }
                },
                payments: {
                    orderBy: { createdAt: 'desc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        return subscription;
    },
    findAll: async (params = {}) => {
        const { page = 1, limit = 20, status, userId } = params;
        const skip = (page - 1) * limit;
        const where = { deletedAt: null };
        if (status)
            where.status = status;
        if (userId)
            where.userId = userId;
        const [subscriptions, total] = await Promise.all([
            database_1.prisma.subscription.findMany({
                where,
                include: {
                    user: {
                        include: {
                            profile: true
                        }
                    },
                    deliveries: {
                        include: {
                            items: true
                        },
                        orderBy: { scheduledDate: 'desc' }
                    },
                    payments: {
                        orderBy: { createdAt: 'desc' }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            database_1.prisma.subscription.count({ where })
        ]);
        return { subscriptions, total };
    },
    create: async (data) => {
        const subscription = await database_1.prisma.subscription.create({
            data,
            include: {
                user: true,
                deliveries: true,
                payments: true
            }
        });
        return subscription;
    },
    update: async (id, data) => {
        const subscription = await database_1.prisma.subscription.update({
            where: { id },
            data,
            include: {
                user: true,
                deliveries: true,
                payments: true
            }
        });
        return subscription;
    },
    cancel: async (id, reason) => {
        const subscription = await database_1.prisma.subscription.update({
            where: { id },
            data: {
                status: 'CANCELLED',
                cancelledAt: new Date(),
                cancelReason: reason,
                autoRenew: false
            },
            include: {
                user: true,
                deliveries: true,
                payments: true
            }
        });
        return subscription;
    },
    pause: async (id, pauseUntil) => {
        const subscription = await database_1.prisma.subscription.update({
            where: { id },
            data: {
                status: 'PAUSED',
                pauseUntil
            },
            include: {
                user: true,
                deliveries: true,
                payments: true
            }
        });
        return subscription;
    },
    resume: async (id) => {
        const subscription = await database_1.prisma.subscription.update({
            where: { id },
            data: {
                status: 'ACTIVE',
                pauseUntil: null
            },
            include: {
                user: true,
                deliveries: true,
                payments: true
            }
        });
        return subscription;
    },
    createDelivery: async (subscriptionId, deliveryData) => {
        const delivery = await database_1.prisma.subscriptionDelivery.create({
            data: {
                ...deliveryData,
                subscriptionId
            },
            include: {
                items: {
                    include: {
                        product: {
                            include: {
                                productImages: {
                                    where: { isPrimary: true },
                                    take: 1
                                }
                            }
                        }
                    }
                }
            }
        });
        return delivery;
    },
    updateDelivery: async (id, data) => {
        const delivery = await database_1.prisma.subscriptionDelivery.update({
            where: { id },
            data,
            include: {
                items: {
                    include: {
                        product: true
                    }
                }
            }
        });
        return delivery;
    },
    markDeliveryDelivered: async (id, trackingNumber) => {
        const delivery = await database_1.prisma.subscriptionDelivery.update({
            where: { id },
            data: {
                status: 'DELIVERED',
                deliveredDate: new Date(),
                ...(trackingNumber && { trackingNumber })
            },
            include: {
                items: {
                    include: {
                        product: true
                    }
                }
            }
        });
        return delivery;
    },
    getSubscriptionStats: async (params = {}) => {
        const { startDate, endDate } = params;
        const where = { deletedAt: null };
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate)
                where.createdAt.gte = startDate;
            if (endDate)
                where.createdAt.lte = endDate;
        }
        const [totalSubscriptions, activeSubscriptions, subscriptionsByStatus] = await Promise.all([
            database_1.prisma.subscription.count({ where }),
            database_1.prisma.subscription.count({ where: { ...where, status: 'ACTIVE' } }),
            database_1.prisma.subscription.groupBy({
                by: ['status'],
                where,
                _count: { status: true }
            })
        ]);
        return {
            totalSubscriptions,
            activeSubscriptions,
            subscriptionsByStatus
        };
    }
};
//# sourceMappingURL=Subscription.js.map