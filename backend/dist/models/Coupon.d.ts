import { DiscountType } from '@prisma/client';
export interface ICoupon {
    id: string;
    code: string;
    description?: string | null;
    discountType: DiscountType;
    discountValue: any;
    minimumSpend?: any;
    maximumDiscount?: any;
    usageLimit?: number | null;
    usageLimitPerUser: number;
    usedCount: number;
    validFrom?: Date | null;
    validUntil?: Date | null;
    isActive: boolean;
    stackable: boolean;
    firstOrderOnly: boolean;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date | null;
}
export declare const CouponModel: {
    findById: (id: string) => Promise<ICoupon | null>;
    findByCode: (code: string) => Promise<ICoupon | null>;
    findAll: (params?: {
        page?: number;
        limit?: number;
        isActive?: boolean;
        search?: string;
    }) => Promise<{
        coupons: ICoupon[];
        total: number;
    }>;
    getActiveCoupons: () => Promise<ICoupon[]>;
    create: (data: Omit<ICoupon, "id" | "createdAt" | "updatedAt" | "deletedAt">) => Promise<ICoupon>;
    update: (id: string, data: Partial<Omit<ICoupon, "id" | "createdAt" | "updatedAt" | "deletedAt">>) => Promise<ICoupon>;
    delete: (id: string) => Promise<void>;
    validateCoupon: (code: string, userId?: string, cartTotal?: number) => Promise<{
        valid: boolean;
        coupon?: ICoupon;
        error?: string;
    }>;
    incrementUsage: (id: string) => Promise<void>;
    getCouponStats: (params?: {
        startDate?: Date;
        endDate?: Date;
    }) => Promise<any>;
};
//# sourceMappingURL=Coupon.d.ts.map