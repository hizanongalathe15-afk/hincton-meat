import { Decimal } from '@prisma/client/runtime/library';
export interface IFlashSale {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    bannerImage?: string | null;
    discountType: string;
    discountValue: Decimal | string | number;
    startTime: Date;
    endTime: Date;
    stockLimit?: number | null;
    perUserLimit: number;
    status: string;
    createdBy?: string | null;
    createdAt: Date;
    updatedAt: Date;
}
export interface IFlashSaleProduct {
    id: string;
    flashSaleId: string;
    productId: string;
    variantId?: string | null;
    salePrice: Decimal | string | number;
    originalPrice: Decimal | string | number;
    stockAllocated: number;
    stockSold: number;
    product?: any;
    variant?: any;
}
export interface IFlashSalePurchase {
    id: string;
    flashSaleId: string;
    productId: string;
    userId: string;
    orderId: string;
    quantity: number;
    pricePaid: Decimal | string | number;
    purchasedAt: Date;
    flashSale?: any;
    order?: any;
    product?: any;
    user?: any;
}
export declare const FlashSaleModel: {
    findById: (id: string) => Promise<IFlashSale | null>;
    findBySlug: (slug: string) => Promise<IFlashSale | null>;
    findAll: (params?: {
        page?: number;
        limit?: number;
        status?: string;
    }) => Promise<{
        flashSales: IFlashSale[];
        total: number;
    }>;
    getActiveFlashSales: () => Promise<IFlashSale[]>;
    create: (data: Omit<IFlashSale, "id" | "createdAt" | "updatedAt">) => Promise<IFlashSale>;
    update: (id: string, data: Partial<Omit<IFlashSale, "id" | "createdAt" | "updatedAt">>) => Promise<IFlashSale>;
    delete: (id: string) => Promise<void>;
    addProduct: (flashSaleId: string, productId: string, variantId: string | null, salePrice: number | string, originalPrice: number | string, stockAllocated: number) => Promise<IFlashSaleProduct>;
    removeProduct: (id: string) => Promise<void>;
    recordPurchase: (data: Omit<IFlashSalePurchase, "id" | "purchasedAt" | "flashSale" | "order" | "product" | "user">) => Promise<IFlashSalePurchase>;
    getFlashSaleStats: (flashSaleId: string) => Promise<any>;
};
//# sourceMappingURL=FlashSale.d.ts.map