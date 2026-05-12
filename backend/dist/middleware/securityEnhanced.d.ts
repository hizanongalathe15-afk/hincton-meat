import { Request, Response, NextFunction } from 'express';
interface AuthRequest extends Request {
    user?: {
        id: string;
        name: string;
        email: string;
        role: string;
        phone?: string;
        isVerified: boolean;
    };
}
export declare const authenticateToken: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
export declare const requireRole: (roles: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
export declare const requireAdmin: (req: AuthRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
export declare const rateLimit: (maxRequests: number, windowMs: number) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
export declare const validateInput: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
export declare const csrfProtection: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
export declare const securityHeaders: (req: Request, res: Response, next: NextFunction) => void;
export declare const sessionMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const validatePasswordStrength: (password: string) => {
    isValid: boolean;
    errors: string[];
};
export declare const accountLockout: (maxAttempts?: number, lockoutDuration?: number) => (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export declare const recordFailedAttempt: (email: string) => void;
export declare const clearFailedAttempts: (email: string) => void;
export {};
//# sourceMappingURL=securityEnhanced.d.ts.map