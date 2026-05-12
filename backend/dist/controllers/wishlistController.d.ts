import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const getWishlist: (req: AuthRequest, res: Response, next: any) => Promise<Response<any, Record<string, any>>>;
export declare const addToWishlist: (req: AuthRequest, res: Response, next: any) => Promise<Response<any, Record<string, any>>>;
export declare const removeFromWishlist: (req: AuthRequest, res: Response, next: any) => Promise<Response<any, Record<string, any>>>;
export declare const checkWishlistStatus: (req: AuthRequest, res: Response, next: any) => Promise<Response<any, Record<string, any>>>;
export declare const clearWishlist: (req: AuthRequest, res: Response, next: any) => Promise<void>;
export declare const moveWishlistToCart: (req: AuthRequest, res: Response, next: any) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=wishlistController.d.ts.map