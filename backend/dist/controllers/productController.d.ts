import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const getAllProducts: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const getProductById: (req: AuthRequest, res: Response, next: any) => Promise<Response<any, Record<string, any>>>;
export declare const createProduct: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const updateProduct: (req: AuthRequest, res: Response, next: any) => Promise<Response<any, Record<string, any>>>;
export declare const deleteProduct: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const getFeaturedProducts: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const getProductsByCategory: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const updateStock: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
export declare const searchProducts: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=productController.d.ts.map