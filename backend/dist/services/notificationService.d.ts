export interface NotificationData {
    userId?: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    category: 'order' | 'payment' | 'delivery' | 'inventory' | 'system' | 'marketing';
    data?: any;
    isRead?: boolean;
    expiresAt?: Date;
}
export interface PushNotificationData {
    userId?: string;
    title: string;
    body: string;
    icon?: string;
    image?: string;
    url?: string;
    actions?: Array<{
        action: string;
        title: string;
    }>;
}
export interface EmailNotificationData {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
    attachments?: Array<{
        filename: string;
        path?: string;
        content?: Buffer;
    }>;
}
declare class NotificationService {
    createNotification(notificationData: NotificationData): Promise<{
        success: boolean;
        notification?: any;
        error?: string;
    }>;
    sendBulkNotifications(userIds: string[], notificationData: Omit<NotificationData, 'userId'>): Promise<{
        success: boolean;
        sent: number;
        failed: number;
        error?: string;
    }>;
    getUserNotifications(userId: string, page?: number, limit?: number, filters?: {
        type?: string;
        category?: string;
        isRead?: boolean;
        dateFrom?: Date;
        dateTo?: Date;
    }): Promise<{
        notifications: any[];
        total: number;
        unreadCount: number;
        page: number;
        pages: number;
    }>;
    markAsRead(notificationId: string, userId: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    markAllAsRead(userId: string): Promise<{
        success: boolean;
        markedCount: number;
        error?: string;
    }>;
    deleteNotification(notificationId: string, userId: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    sendPushNotification(pushData: PushNotificationData): Promise<boolean>;
    private sendIOSPush;
    private sendAndroidPush;
    private getNotificationUrl;
    createOrderNotifications(order: any): Promise<void>;
    createPaymentNotifications(payment: any): Promise<void>;
    createDeliveryNotifications(delivery: any): Promise<void>;
    createLowStockAlerts(alerts: Array<{
        productId: string;
        productName: string;
        currentStock: number;
        lowStockThreshold: number;
    }>): Promise<void>;
    getNotificationStats(userId?: string): Promise<{
        totalNotifications: number;
        unreadNotifications: number;
        notificationsByType: Record<string, number>;
        notificationsByCategory: Record<string, number>;
    }>;
    cleanupExpiredNotifications(): Promise<number>;
}
export declare const notificationService: NotificationService;
export default notificationService;
//# sourceMappingURL=notificationService.d.ts.map