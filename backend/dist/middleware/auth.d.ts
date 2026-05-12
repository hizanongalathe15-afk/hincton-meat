import { Request, Response, NextFunction } from 'express';
declare const Role: {
    readonly BUYER: "BUYER";
    readonly ADMIN: "ADMIN";
    readonly SUPER_ADMIN: "SUPER_ADMIN";
    readonly AGENT: "AGENT";
    readonly VENDOR: "VENDOR";
    readonly AFFILIATE: "AFFILIATE";
    readonly SUPPORT: "SUPPORT";
    readonly CONTENT_MANAGER: "CONTENT_MANAGER";
    readonly ANALYTICS_VIEWER: "ANALYTICS_VIEWER";
    readonly MODERATOR: "MODERATOR";
};
type RoleValue = typeof Role[keyof typeof Role];
export interface AuthRequest extends Request {
    user?: {
        id: string;
        name: string;
        email: string;
        role: 'admin' | 'buyer';
        roles: RoleValue[];
        phone?: string;
        isVerified: boolean;
    };
}
export declare const authenticate: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
export declare const optionalAuthenticate: (req: AuthRequest, _res: Response, next: NextFunction) => Promise<void>;
export declare const authorize: (...roles: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
export {};
//# sourceMappingURL=auth.d.ts.map