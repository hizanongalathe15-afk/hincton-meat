import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const initiateSTKPush: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
export declare const mpesaCallback: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const checkTransactionStatus: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
export declare const getUserTransactions: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=mpesaController.d.ts.map