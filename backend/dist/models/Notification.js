"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationModel = void 0;
const database_1 = require("../database");
exports.NotificationModel = {
    findById: async (id) => {
        const notification = await database_1.prisma.notification.findUnique({
            where: { id },
            include: {
                user: {
                    include: {
                        profile: true
                    }
                }
            }
        });
        return notification;
    },
    findByUserId: async (userId, params = {}) => {
        const { page = 1, limit = 20, isRead, type } = params;
        const skip = (page - 1) * limit;
        const where = { userId };
        if (isRead !== undefined)
            where.isRead = isRead;
        if (type)
            where.type = type;
        const [notifications, total, unreadCount] = await Promise.all([
            database_1.prisma.notification.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            profile: {
                                select: {
                                    firstName: true,
                                    lastName: true,
                                    fullName: true
                                }
                            }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            database_1.prisma.notification.count({ where }),
            database_1.prisma.notification.count({ where: { userId, isRead: false } })
        ]);
        return { notifications, total, unreadCount };
    },
    create: async (data) => {
        const notification = await database_1.prisma.notification.create({
            data: {
                userId: data.userId,
                type: data.type,
                title: data.title,
                message: data.message,
                data: data.data,
                image: data.image,
                actionUrl: data.actionUrl,
                isRead: data.isRead,
                channel: data.channel,
                sentAt: data.sentAt,
                readAt: data.readAt
            },
            include: {
                user: {
                    include: {
                        profile: true
                    }
                }
            }
        });
        return notification;
    },
    markAsRead: async (id) => {
        const notification = await database_1.prisma.notification.update({
            where: { id },
            data: {
                isRead: true,
                readAt: new Date()
            },
            include: {
                user: {
                    include: {
                        profile: true
                    }
                }
            }
        });
        return notification;
    },
    markAllAsRead: async (userId) => {
        await database_1.prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: {
                isRead: true,
                readAt: new Date()
            }
        });
    },
    delete: async (id) => {
        await database_1.prisma.notification.delete({
            where: { id }
        });
    },
    deleteByUserId: async (userId) => {
        await database_1.prisma.notification.deleteMany({
            where: { userId }
        });
    },
    sendBulkNotifications: async (userIds, notificationData) => {
        const notifications = userIds.map(userId => ({
            userId,
            type: notificationData.type,
            title: notificationData.title,
            message: notificationData.message,
            data: notificationData.data,
            image: notificationData.image,
            actionUrl: notificationData.actionUrl,
            isRead: notificationData.isRead,
            channel: notificationData.channel,
            sentAt: notificationData.sentAt,
            readAt: notificationData.readAt
        }));
        await database_1.prisma.notification.createMany({
            data: notifications
        });
    },
    getUnreadCount: async (userId) => {
        const count = await database_1.prisma.notification.count({
            where: { userId, isRead: false }
        });
        return count;
    },
    getRecentNotifications: async (userId, limit = 5) => {
        const notifications = await database_1.prisma.notification.findMany({
            where: { userId },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: limit
        });
        return notifications;
    }
};
//# sourceMappingURL=Notification.js.map