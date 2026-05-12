import { Request, Response, NextFunction } from 'express';
export declare const trackUserActivity: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const handleUserDisconnect: (userId: string) => Promise<void>;
export declare const updateUserOnlineStatus: (userId: string, isOnline: boolean, socketId?: string) => Promise<void>;
//# sourceMappingURL=userActivityTracker.d.ts.map