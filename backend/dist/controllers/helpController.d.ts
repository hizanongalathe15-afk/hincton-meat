import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
/**
 * NOTE:
 * Your Prisma schema in this repo does NOT include `assignedTo` / `assignedToId`.
 * The previous helpController referenced those fields which caused TypeScript to fail.
 *
 * This version keeps help-ticket CRUD working (user, status, priority, category)
 * and removes unsupported admin assignment fields so the backend compiles.
 */
export declare const createHelpTicket: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getHelpTickets: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getHelpTicket: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateHelpTicket: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const closeHelpTicket: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getAllHelpTickets: (req: AuthRequest, res: Response) => Promise<void>;
export declare const assignHelpTicket: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateTicketStatus: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=helpController.d.ts.map