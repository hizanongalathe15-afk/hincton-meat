import { Request, Response } from 'express';
export declare const processMpesaWebhook: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const getPayments: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const getPayment: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const getPaymentsByOrder: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const getPaymentsByUser: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const createPayment: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const updatePaymentStatus: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const completePayment: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const failPayment: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const getMpesaPayments: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const getPaymentStats: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const getPaymentSuccessPage: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const getPaymentFailedPage: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const verifyPayment: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const confirmPayment: (req: Request, res: Response, next: import("express").NextFunction) => void;
//# sourceMappingURL=paymentController.d.ts.map