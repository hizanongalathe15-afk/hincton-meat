import { Request, Response, NextFunction } from 'express';
export interface ApiKeyRequest extends Request {
    apiKey?: {
        id: string;
        name: string;
        permissions: string[];
        userId: string;
        isActive: boolean;
    };
}
export declare const authenticateApiKey: (req: ApiKeyRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
export declare const requireApiKeyPermission: (permission: string) => (req: ApiKeyRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
export declare const generateApiKey: (userId: string, name: string, permissions: string[], expiresInDays?: number) => Promise<{
    id: string;
    key: string;
    name: string;
    permissions: string[];
    expiresAt: Date;
    createdAt: Date;
}>;
export declare const revokeApiKey: (apiKeyId: string, userId: string) => Promise<boolean>;
export declare const API_PERMISSIONS: {
    readonly READ_PRODUCTS: "read:products";
    readonly WRITE_PRODUCTS: "write:products";
    readonly READ_ORDERS: "read:orders";
    readonly WRITE_ORDERS: "write:orders";
    readonly READ_USERS: "read:users";
    readonly WRITE_USERS: "write:users";
    readonly READ_ANALYTICS: "read:analytics";
    readonly WRITE_ANALYTICS: "write:analytics";
    readonly ADMIN_FULL: "admin:full";
};
export declare const checkPermission: (req: ApiKeyRequest, permission: string) => boolean;
//# sourceMappingURL=apiKey.d.ts.map