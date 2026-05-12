import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const register: (req: AuthRequest, res: Response, next: any) => Promise<Response<any, Record<string, any>>>;
export declare const login: (req: AuthRequest, res: Response, next: any) => Promise<Response<any, Record<string, any>>>;
export declare const getProfile: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const updateProfile: (req: AuthRequest, res: Response, next: any) => Promise<Response<any, Record<string, any>>>;
export declare const changePassword: (req: AuthRequest, res: Response, next: any) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=authController.d.ts.map