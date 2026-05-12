import { Request, Response, NextFunction } from 'express';
export interface LogEntry {
    timestamp: string;
    method: string;
    url: string;
    ip: string;
    userAgent?: string;
    statusCode?: number;
    responseTime: number;
    userId?: string;
    error?: string;
    body?: any;
    headers?: any;
}
export declare const requestLogger: (options?: {
    excludePaths?: string[];
    excludeHealthCheck?: boolean;
    logBody?: boolean;
    logHeaders?: boolean;
}) => (req: Request, res: Response, next: NextFunction) => void;
export declare const securityLogger: (event: string, details: any, req?: Request) => void;
export declare const performanceLogger: (req: Request, res: Response, next: NextFunction) => void;
export declare const dbLogger: (query: string, params: any, duration: number) => void;
//# sourceMappingURL=logger.d.ts.map