import { Request, Response } from 'express';
export declare const getOnlineUsers: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const getOfflineUsers: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const getUserStats: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const getOnlineUserCount: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const updateOnlineStatus: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const updateUserOnlineStatus: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const markOffline: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const markUserOffline: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const trackUserActivity: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const getRealTimeUserStats: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const getUserSessionDetails: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const updateLastSeen: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const cleanupOldSessions: (req: Request, res: Response, next: import("express").NextFunction) => void;
//# sourceMappingURL=userSessionController.d.ts.map