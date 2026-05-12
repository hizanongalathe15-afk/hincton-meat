"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSystemNotification = exports.createMessageNotification = exports.createProductNotification = exports.createPaymentNotification = exports.createOrderNotification = exports.getUnreadCount = exports.deleteNotification = exports.markAllAsRead = exports.markAsRead = exports.createNotification = exports.getNotifications = void 0;
// Simple in-memory notification storage since notification model doesn't exist in schema
const notifications = [];
const getNotifications = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const { page = 1, limit = 10, type, unreadOnly = false } = req.query;
        // Filter notifications for user
        let userNotifications = notifications.filter(n => n.userId === userId);
        if (type)
            userNotifications = userNotifications.filter(n => n.type === type);
        if (unreadOnly === 'true')
            userNotifications = userNotifications.filter(n => !n.isRead);
        const total = userNotifications.length;
        const unreadCount = userNotifications.filter(n => !n.isRead).length;
        // Pagination
        const startIndex = (Number(page) - 1) * Number(limit);
        const paginatedNotifications = userNotifications.slice(startIndex, startIndex + Number(limit));
        res.json({
            notifications: paginatedNotifications,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            },
            unreadCount
        });
    }
    catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ message: 'Server error while fetching notifications' });
    }
};
exports.getNotifications = getNotifications;
const createNotification = async (req, res, next) => {
    try {
        const { userId, title, message, type, metadata } = req.body;
        const notification = {
            id: `notif_${Date.now()}`,
            userId,
            title,
            message,
            type,
            metadata: metadata || {},
            isRead: false,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        // Add to in-memory storage
        notifications.push(notification);
        res.status(201).json({ notification });
    }
    catch (error) {
        console.error('Create notification error:', error);
        res.status(500).json({ message: 'Server error while creating notification' });
    }
};
exports.createNotification = createNotification;
const markAsRead = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const { notificationId } = req.params;
        const notificationIndex = notifications.findIndex(n => n.id === notificationId && n.userId === userId);
        if (notificationIndex === -1) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        notifications[notificationIndex].isRead = true;
        notifications[notificationIndex].updatedAt = new Date();
        res.json({ message: 'Notification marked as read' });
    }
    catch (error) {
        console.error('Mark notification as read error:', error);
        res.status(500).json({ message: 'Server error while marking notification as read' });
    }
};
exports.markAsRead = markAsRead;
const markAllAsRead = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const userNotifications = notifications.filter(n => n.userId === userId);
        userNotifications.forEach(notification => {
            notification.isRead = true;
            notification.updatedAt = new Date();
        });
        res.json({ message: 'All notifications marked as read' });
    }
    catch (error) {
        console.error('Mark all notifications as read error:', error);
        res.status(500).json({ message: 'Server error while marking all notifications as read' });
    }
};
exports.markAllAsRead = markAllAsRead;
const deleteNotification = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const { notificationId } = req.params;
        const notificationIndex = notifications.findIndex(n => n.id === notificationId && n.userId === userId);
        if (notificationIndex === -1) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        notifications.splice(notificationIndex, 1);
        res.json({ message: 'Notification deleted successfully' });
    }
    catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({ message: 'Server error while deleting notification' });
    }
};
exports.deleteNotification = deleteNotification;
const getUnreadCount = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const unreadCount = notifications.filter(n => n.userId === userId && !n.isRead).length;
        res.json({ unreadCount });
    }
    catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({ message: 'Server error while fetching unread count' });
    }
};
exports.getUnreadCount = getUnreadCount;
// Helper function to create notifications for different events
const createOrderNotification = async (userId, orderId, status) => {
    const title = `Order ${status}`;
    const message = `Your order #${orderId} has been ${status.toLowerCase()}`;
    const type = 'ORDER';
    const metadata = { orderId, status };
    const notification = {
        id: `notif_${Date.now()}`,
        userId,
        title,
        message,
        type,
        metadata,
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date()
    };
    notifications.push(notification);
};
exports.createOrderNotification = createOrderNotification;
const createPaymentNotification = async (userId, paymentId, status) => {
    const title = `Payment ${status}`;
    const message = `Your payment has been ${status.toLowerCase()}`;
    const type = 'PAYMENT';
    const metadata = { paymentId, status };
    const notification = {
        id: `notif_${Date.now()}`,
        userId,
        title,
        message,
        type,
        metadata,
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date()
    };
    notifications.push(notification);
};
exports.createPaymentNotification = createPaymentNotification;
const createProductNotification = async (userId, productId, action) => {
    const title = `Product ${action}`;
    const message = `A product you're interested in has been ${action.toLowerCase()}`;
    const type = 'PRODUCT';
    const metadata = { productId, action };
    const notification = {
        id: `notif_${Date.now()}`,
        userId,
        title,
        message,
        type,
        metadata,
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date()
    };
    notifications.push(notification);
};
exports.createProductNotification = createProductNotification;
const createMessageNotification = async (userId, senderId, senderName) => {
    const title = 'New Message';
    const message = `You have a new message from ${senderName}`;
    const type = 'MESSAGE';
    const metadata = { senderId, senderName };
    const notification = {
        id: `notif_${Date.now()}`,
        userId,
        title,
        message,
        type,
        metadata,
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date()
    };
    notifications.push(notification);
};
exports.createMessageNotification = createMessageNotification;
const createSystemNotification = async (userId, title, message) => {
    const type = 'SYSTEM';
    const notification = {
        id: `notif_${Date.now()}`,
        userId,
        title,
        message,
        type,
        metadata: {},
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date()
    };
    notifications.push(notification);
};
exports.createSystemNotification = createSystemNotification;
//# sourceMappingURL=notificationController.js.map