import { Request, Response, NextFunction } from 'express';
export declare const sanitizeInput: (req: Request, res: Response, next: NextFunction) => void;
export declare const preventSqlInjection: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
export declare const preventNoSqlInjection: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
export declare const securityMiddleware: ((req: Request, res: Response, next: NextFunction) => void)[];
//# sourceMappingURL=sanitizer.d.ts.map