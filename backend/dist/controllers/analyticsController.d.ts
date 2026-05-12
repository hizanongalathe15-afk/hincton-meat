import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const getDashboardStats: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getSalesAnalytics: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getProductAnalytics: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getCustomerAnalytics: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getOrderAnalytics: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=analyticsController.d.ts.map