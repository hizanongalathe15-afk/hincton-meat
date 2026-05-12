import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const getMessages: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const sendMessage: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const getConversations: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const markAsRead: (req: AuthRequest, res: Response, next: any) => Promise<Response<any, Record<string, any>>>;
export declare const deleteMessage: (req: AuthRequest, res: Response, next: any) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=messageController.d.ts.map