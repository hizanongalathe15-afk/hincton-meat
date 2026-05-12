import { Request, Response, NextFunction } from 'express';
export interface CorsOptions {
    origin?: string | string[] | boolean;
    methods?: string[];
    allowedHeaders?: string[];
    exposedHeaders?: string[];
    credentials?: boolean;
    maxAge?: number;
}
export declare const cors: (options?: Partial<CorsOptions>) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
export declare const developmentCors: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
export declare const productionCors: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
export declare const apiCors: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
//# sourceMappingURL=cors.d.ts.map