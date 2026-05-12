import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const createOrder: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
export declare const getOrders: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getOrderById: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
export declare const updateOrderStatus: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
export declare const cancelOrder: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
export declare const getOrderStats: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=orderController.d.ts.map