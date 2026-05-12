import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const getNotifications: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const createNotification: (req: Request, res: Response, next: any) => Promise<void>;
export declare const markAsRead: (req: AuthRequest, res: Response, next: any) => Promise<Response<any, Record<string, any>>>;
export declare const markAllAsRead: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const deleteNotification: (req: AuthRequest, res: Response, next: any) => Promise<Response<any, Record<string, any>>>;
export declare const getUnreadCount: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const createOrderNotification: (userId: string, orderId: string, status: string) => Promise<void>;
export declare const createPaymentNotification: (userId: string, paymentId: string, status: string) => Promise<void>;
export declare const createProductNotification: (userId: string, productId: string, action: string) => Promise<void>;
export declare const createMessageNotification: (userId: string, senderId: string, senderName: string) => Promise<void>;
export declare const createSystemNotification: (userId: string, title: string, message: string) => Promise<void>;
//# sourceMappingURL=notificationController.d.ts.map