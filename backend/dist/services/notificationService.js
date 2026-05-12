"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = void 0;
// @ts-nocheck
const database_1 = require("../database");
class NotificationService {
    async createNotification(notificationData) {
        try {
            const notification = await database_1.prisma.notification.create({
                data: {
                    userId: notificationData.userId,
                    title: notificationData.title,
                    message: notificationData.message,
                    type: notificationData.type.toUpperCase(),
                    category: notificationData.category.toUpperCase(),
                    data: notificationData.data || {},
                    isRead: notificationData.isRead || false,
                    expiresAt: notificationData.expiresAt
                }
            });
            // Send push notification if user has device tokens
            if (notificationData.userId) {
                await this.sendPushNotification({
                    userId: notificationData.userId,
                    title: notificationData.title,
                    body: notificationData.message,
                    url: this.getNotificationUrl(notificationData.category, notificationData.data)
                });
            }
            return {
                success: true,
                notification
            };
        }
        catch (error) {
            console.error('Notification creation error:', error);
            return {
                success: false,
                error: 'Failed to create notification'
            };
        }
    }
    async sendBulkNotifications(userIds, notificationData) {
        try {
            const notifications = userIds.map(userId => ({
                userId,
                title: notificationData.title,
                message: notificationData.message,
                type: notificationData.type.toUpperCase(),
                category: notificationData.category.toUpperCase(),
                data: notificationData.data || {},
                isRead: false,
                expiresAt: notificationData.expiresAt
            }));
            const result = await database_1.prisma.notification.createMany({
                data: notifications
            });
            // Send push notifications
            for (const userId of userIds) {
                await this.sendPushNotification({
                    userId,
                    title: notificationData.title,
                    body: notificationData.message,
                    url: this.getNotificationUrl(notificationData.category, notificationData.data)
                });
            }
            return {
                success: true,
                sent: result.count,
                failed: 0
            };
        }
        catch (error) {
            console.error('Bulk notification error:', error);
            return {
                success: false,
                sent: 0,
                failed: userIds.length,
                error: 'Failed to send bulk notifications'
            };
        }
    }
    async getUserNotifications(userId, page = 1, limit = 20, filters) {
        const skip = (page - 1) * limit;
        const where = { userId };
        if (filters?.type) {
            where.type = filters.type.toUpperCase();
        }
        if (filters?.category) {
            where.category = filters.category.toUpperCase();
        }
        if (filters?.isRead !== undefined) {
            where.isRead = filters.isRead;
        }
        if (filters?.dateFrom || filters?.dateTo) {
            where.createdAt = {};
            if (filters.dateFrom) {
                where.createdAt.gte = filters.dateFrom;
            }
            if (filters.dateTo) {
                where.createdAt.lte = filters.dateTo;
            }
        }
        const [notifications, total, unreadCount] = await Promise.all([
            database_1.prisma.notification.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            database_1.prisma.notification.count({ where }),
            database_1.prisma.notification.count({
                where: { ...where, isRead: false }
            })
        ]);
        return {
            notifications,
            total,
            unreadCount,
            page,
            pages: Math.ceil(total / limit)
        };
    }
    async markAsRead(notificationId, userId) {
        try {
            const result = await database_1.prisma.notification.updateMany({
                where: {
                    id: notificationId,
                    userId
                },
                data: {
                    isRead: true,
                    readAt: new Date()
                }
            });
            if (result.count === 0) {
                return {
                    success: false,
                    error: 'Notification not found or unauthorized'
                };
            }
            return {
                success: true
            };
        }
        catch (error) {
            console.error('Mark notification as read error:', error);
            return {
                success: false,
                error: 'Failed to mark notification as read'
            };
        }
    }
    async markAllAsRead(userId) {
        try {
            const result = await database_1.prisma.notification.updateMany({
                where: {
                    userId,
                    isRead: false
                },
                data: {
                    isRead: true,
                    readAt: new Date()
                }
            });
            return {
                success: true,
                markedCount: result.count
            };
        }
        catch (error) {
            console.error('Mark all notifications as read error:', error);
            return {
                success: false,
                markedCount: 0,
                error: 'Failed to mark all notifications as read'
            };
        }
    }
    async deleteNotification(notificationId, userId) {
        try {
            const result = await database_1.prisma.notification.deleteMany({
                where: {
                    id: notificationId,
                    userId
                }
            });
            if (result.count === 0) {
                return {
                    success: false,
                    error: 'Notification not found or unauthorized'
                };
            }
            return {
                success: true
            };
        }
        catch (error) {
            console.error('Delete notification error:', error);
            return {
                success: false,
                error: 'Failed to delete notification'
            };
        }
    }
    async sendPushNotification(pushData) {
        try {
            // Get user device tokens
            if (!pushData.userId) {
                return false;
            }
            const deviceTokens = await database_1.prisma.deviceToken.findMany({
                where: {
                    userId: pushData.userId,
                    isActive: true
                },
                select: {
                    token: true,
                    platform: true
                }
            });
            if (deviceTokens.length === 0) {
                return false;
            }
            // Group tokens by platform
            const tokensByPlatform = deviceTokens.reduce((acc, token) => {
                if (!acc[token.platform]) {
                    acc[token.platform] = [];
                }
                acc[token.platform].push(token.token);
                return acc;
            }, {});
            // Send push notifications based on platform
            for (const [platform, tokens] of Object.entries(tokensByPlatform)) {
                if (platform === 'ios') {
                    await this.sendIOSPush(tokens, pushData);
                }
                else if (platform === 'android') {
                    await this.sendAndroidPush(tokens, pushData);
                }
            }
            return true;
        }
        catch (error) {
            console.error('Push notification error:', error);
            return false;
        }
    }
    async sendIOSPush(tokens, data) {
        try {
            // iOS push notification using APNs
            // This would require libraries like 'apn' or 'node-apn'
            const payload = {
                aps: {
                    alert: {
                        title: data.title,
                        body: data.body
                    },
                    sound: 'default',
                    badge: 1,
                    data: data.data || {}
                }
            };
            // Mock implementation - integrate with actual APNs service
            console.log('iOS Push to tokens:', tokens.length, 'Payload:', payload);
        }
        catch (error) {
            console.error('iOS push error:', error);
        }
    }
    async sendAndroidPush(tokens, data) {
        try {
            // Android push notification using Firebase Cloud Messaging (FCM)
            // This would require libraries like 'firebase-admin'
            const payload = {
                notification: {
                    title: data.title,
                    body: data.body,
                    icon: data.icon || 'ic_notification',
                    image: data.image,
                    click_action: data.url
                },
                data: data.data || {},
                registration_ids: tokens
            };
            // Mock implementation - integrate with actual FCM service
            console.log('Android Push to tokens:', tokens.length, 'Payload:', payload);
        }
        catch (error) {
            console.error('Android push error:', error);
        }
    }
    getNotificationUrl(category, data) {
        const baseUrl = process.env.FRONTEND_URL || 'https://hinctonmeat.com';
        switch (category) {
            case 'order':
                return `${baseUrl}/order-tracking/${data.orderId || ''}`;
            case 'payment':
                return `${baseUrl}/profile?tab=orders`;
            case 'delivery':
                return `${baseUrl}/order-tracking/${data.orderId || ''}`;
            case 'inventory':
                return `${baseUrl}/admin/inventory`;
            case 'system':
                return `${baseUrl}/notifications`;
            case 'marketing':
                return `${baseUrl}/shop`;
            default:
                return `${baseUrl}/notifications`;
        }
    }
    async createOrderNotifications(order) {
        try {
            // Order confirmation
            await this.createNotification({
                userId: order.userId,
                title: 'Order Confirmed',
                message: `Your order ${order.orderNumber} has been confirmed and is being prepared.`,
                type: 'success',
                category: 'order',
                data: {
                    orderId: order.id,
                    orderNumber: order.orderNumber
                }
            });
            // Order status updates would be handled by order service
        }
        catch (error) {
            console.error('Order notifications error:', error);
        }
    }
    async createPaymentNotifications(payment) {
        try {
            await this.createNotification({
                userId: payment.userId,
                title: 'Payment Received',
                message: `Payment of KSh ${payment.amount} has been received for order ${payment.orderNumber}.`,
                type: 'success',
                category: 'payment',
                data: {
                    paymentId: payment.id,
                    orderId: payment.orderId,
                    amount: payment.amount
                }
            });
        }
        catch (error) {
            console.error('Payment notifications error:', error);
        }
    }
    async createDeliveryNotifications(delivery) {
        try {
            await this.createNotification({
                userId: delivery.userId,
                title: 'Order Out for Delivery',
                message: `Your order ${delivery.orderNumber} is out for delivery with tracking number ${delivery.trackingNumber}.`,
                type: 'info',
                category: 'delivery',
                data: {
                    deliveryId: delivery.id,
                    orderNumber: delivery.orderNumber,
                    trackingNumber: delivery.trackingNumber
                }
            });
        }
        catch (error) {
            console.error('Delivery notifications error:', error);
        }
    }
    async createLowStockAlerts(alerts) {
        try {
            // Get admin users
            const adminUsers = await database_1.prisma.user.findMany({
                where: {
                    roles: {
                        has: 'ADMIN'
                    }
                },
                select: {
                    id: true
                }
            });
            for (const alert of alerts) {
                const message = `Low stock alert: ${alert.productName} has ${alert.currentStock} units remaining (threshold: ${alert.lowStockThreshold}).`;
                for (const admin of adminUsers) {
                    await this.createNotification({
                        userId: admin.id,
                        title: 'Low Stock Alert',
                        message,
                        type: 'warning',
                        category: 'inventory',
                        data: {
                            productId: alert.productId,
                            productName: alert.productName,
                            currentStock: alert.currentStock,
                            lowStockThreshold: alert.lowStockThreshold
                        }
                    });
                }
            }
        }
        catch (error) {
            console.error('Low stock alerts error:', error);
        }
    }
    async getNotificationStats(userId) {
        try {
            const where = userId ? { userId } : {};
            const [totalNotifications, unreadNotifications, typeData, categoryData] = await Promise.all([
                database_1.prisma.notification.count({ where }),
                database_1.prisma.notification.count({
                    where: { ...where, isRead: false }
                }),
                database_1.prisma.notification.groupBy({
                    by: ['type'],
                    where,
                    _count: { id: true }
                }),
                database_1.prisma.notification.groupBy({
                    by: ['category'],
                    where,
                    _count: { id: true }
                })
            ]);
            const notificationsByType = typeData.reduce((acc, item) => {
                acc[item.type] = item._count.id;
                return acc;
            }, {});
            const notificationsByCategory = categoryData.reduce((acc, item) => {
                acc[item.category] = item._count.id;
                return acc;
            }, {});
            return {
                totalNotifications,
                unreadNotifications,
                notificationsByType,
                notificationsByCategory
            };
        }
        catch (error) {
            console.error('Notification stats error:', error);
            return {
                totalNotifications: 0,
                unreadNotifications: 0,
                notificationsByType: {},
                notificationsByCategory: {}
            };
        }
    }
    async cleanupExpiredNotifications() {
        try {
            const result = await database_1.prisma.notification.deleteMany({
                where: {
                    expiresAt: {
                        lte: new Date()
                    }
                }
            });
            return result.count;
        }
        catch (error) {
            console.error('Cleanup expired notifications error:', error);
            return 0;
        }
    }
}
exports.notificationService = new NotificationService();
exports.default = exports.notificationService;
//# sourceMappingURL=notificationService.js.map