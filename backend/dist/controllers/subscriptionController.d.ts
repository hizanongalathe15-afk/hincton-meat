import { Request, Response, NextFunction } from 'express';
export declare const getSubscriptions: (req: Request, res: Response, next: NextFunction) => void;
export declare const getSubscription: (req: Request, res: Response, next: NextFunction) => void;
export declare const getUserSubscription: (req: Request, res: Response, next: NextFunction) => void;
export declare const createSubscription: ((req: Request, res: Response, next: NextFunction) => void)[];
export declare const updateSubscription: ((req: Request, res: Response, next: NextFunction) => void)[];
export declare const cancelSubscription: (req: Request, res: Response, next: NextFunction) => void;
export declare const pauseSubscription: (req: Request, res: Response, next: NextFunction) => void;
export declare const resumeSubscription: (req: Request, res: Response, next: NextFunction) => void;
export declare const createDelivery: (req: Request, res: Response, next: NextFunction) => void;
export declare const updateDelivery: (req: Request, res: Response, next: NextFunction) => void;
export declare const markDeliveryDelivered: (req: Request, res: Response, next: NextFunction) => void;
export declare const getSubscriptionStats: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=subscriptionController.d.ts.map