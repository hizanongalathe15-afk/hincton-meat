import { NotificationType } from '@prisma/client';
export interface INotification {
    id: string;
    userId: string;
    type: NotificationType;
    title?: string;
    message?: string;
    data?: any;
    image?: string;
    actionUrl?: string;
    isRead: boolean;
    channel?: string;
    sentAt?: Date;
    readAt?: Date;
    createdAt: Date;
    user?: any;
}
export declare const NotificationModel: {
    findById: (id: string) => Promise<INotification | null>;
    findByUserId: (userId: string, params?: {
        page?: number;
        limit?: number;
        isRead?: boolean;
        type?: string;
    }) => Promise<{
        notifications: INotification[];
        total: number;
        unreadCount: number;
    }>;
    create: (data: Omit<INotification, "id" | "createdAt" | "user">) => Promise<INotification>;
    markAsRead: (id: string) => Promise<INotification>;
    markAllAsRead: (userId: string) => Promise<void>;
    delete: (id: string) => Promise<void>;
    deleteByUserId: (userId: string) => Promise<void>;
    sendBulkNotifications: (userIds: string[], notificationData: Omit<INotification, "id" | "userId" | "createdAt" | "user">) => Promise<void>;
    getUnreadCount: (userId: string) => Promise<number>;
    getRecentNotifications: (userId: string, limit?: number) => Promise<INotification[]>;
};
//# sourceMappingURL=Notification.d.ts.map