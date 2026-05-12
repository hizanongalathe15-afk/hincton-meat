import { Request, Response, NextFunction } from 'express';
export declare const getCoupons: (req: Request, res: Response, next: NextFunction) => void;
export declare const getCoupon: (req: Request, res: Response, next: NextFunction) => void;
export declare const getCouponByCode: (req: Request, res: Response, next: NextFunction) => void;
export declare const getActiveCoupons: (req: Request, res: Response, next: NextFunction) => void;
export declare const createCoupon: ((req: Request, res: Response, next: NextFunction) => void)[];
export declare const updateCoupon: ((req: Request, res: Response, next: NextFunction) => void)[];
export declare const deleteCoupon: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateCoupon: (req: Request, res: Response, next: NextFunction) => void;
export declare const applyCoupon: (req: Request, res: Response, next: NextFunction) => void;
export declare const getCouponStats: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=couponController.d.ts.map