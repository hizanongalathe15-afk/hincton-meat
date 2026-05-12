import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
export declare const requireAdmin: (req: AuthRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
//# sourceMappingURL=admin.d.ts.map