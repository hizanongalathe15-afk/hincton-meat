import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
/**
 * NOTE:
 * This repo is Prisma-based (OrderModel/ProductModel/etc.).
 * The previous deliveryController was written for a Mongoose-style model layer
 * (Delivery.find/populate/_id/new Delivery(...)), which doesn't exist here.
 *
 * This file provides Prisma-compatible stubs to unblock TypeScript compilation.
 */
export declare const createDelivery: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
export declare const updateDeliveryStatus: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
export declare const updateLocation: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
export declare const getDeliveries: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
export declare const getDeliveryById: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
export declare const addCustomerRating: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=deliveryController.d.ts.map