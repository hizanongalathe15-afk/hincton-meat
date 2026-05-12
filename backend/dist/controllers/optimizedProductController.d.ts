import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const getOptimizedProducts: (req: AuthRequest, res: Response, next: any) => Promise<Response<any, Record<string, any>>>;
export declare const invalidateProductCache: (productId?: string) => Promise<void>;
export declare const getProductCounts: (req: AuthRequest, res: Response, next: any) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=optimizedProductController.d.ts.map