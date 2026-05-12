export interface ICartItem {
    id: string;
    cartId: string;
    productId: string;
    variantId?: string;
    quantity: number;
    createdAt: Date;
    updatedAt: Date;
    product?: {
        id: string;
        name: string;
        slug: string;
        price: number | string;
        isPublished: boolean;
        productImages?: {
            id: string;
            url: string;
            alt?: string;
            sortOrder: number;
            isPrimary: boolean;
        }[];
    };
    variant?: {
        id: string;
        name: string;
        sku: string;
        price: number | string;
        stockQuantity: number;
    };
    cart?: {
        id: string;
        userId?: string;
        sessionId?: string;
        couponCode?: string;
        notes?: string;
        abandonedAt?: Date;
        createdAt: Date;
        updatedAt: Date;
    };
}
export declare const CartModel: {
    findById: (id: string) => Promise<ICartItem | null>;
    findByUserId: (userId: string) => Promise<ICartItem[]>;
    findBySessionId: (sessionId: string) => Promise<ICartItem | null>;
    create: (cartData: any) => Promise<any>;
    addItem: (cartId: string, itemData: {
        productId: string;
        variantId?: string;
        quantity: number;
    }) => Promise<{
        cart: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string | null;
            sessionId: string | null;
            couponCode: string | null;
            notes: string | null;
            abandonedAt: Date | null;
        };
        product: {
            productImages: {
                url: string;
                id: string;
                createdAt: Date;
                sortOrder: number;
                productId: string;
                alt: string | null;
                isPrimary: boolean;
            }[];
        } & {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            slug: string;
            description: string | null;
            shortDescription: string | null;
            price: import("@prisma/client/runtime/library").Decimal;
            comparePrice: import("@prisma/client/runtime/library").Decimal | null;
            costPrice: import("@prisma/client/runtime/library").Decimal | null;
            wholesalePrice: import("@prisma/client/runtime/library").Decimal | null;
            sku: string;
            barcode: string | null;
            mpn: string | null;
            gtin: string | null;
            stockQuantity: number;
            lowStockThreshold: number;
            stockStatus: string;
            weightUnit: string | null;
            weight: number | null;
            length: number | null;
            width: number | null;
            height: number | null;
            brand: string | null;
            vendorId: string | null;
            categoryId: string | null;
            averageRating: number;
            totalReviews: number;
            totalSold: number;
            isPublished: boolean;
            isFeatured: boolean;
            isNew: boolean;
            isOnSale: boolean;
            isDigital: boolean;
            isPreorder: boolean;
            preorderDate: Date | null;
            seoTitle: string | null;
            seoDescription: string | null;
            metaKeywords: string | null;
            canonicalUrl: string | null;
            publishedAt: Date | null;
        };
        variant: {
            id: string;
            name: string | null;
            createdAt: Date;
            updatedAt: Date;
            price: import("@prisma/client/runtime/library").Decimal | null;
            comparePrice: import("@prisma/client/runtime/library").Decimal | null;
            costPrice: import("@prisma/client/runtime/library").Decimal | null;
            sku: string;
            barcode: string | null;
            stockQuantity: number;
            weight: number | null;
            length: number | null;
            width: number | null;
            height: number | null;
            isActive: boolean;
            isDefault: boolean;
            productId: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        productId: string;
        quantity: number;
        cartId: string;
        variantId: string | null;
    }>;
    updateItem: (itemId: string, cartData: Partial<ICartItem>) => Promise<{
        cart: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string | null;
            sessionId: string | null;
            couponCode: string | null;
            notes: string | null;
            abandonedAt: Date | null;
        };
        product: {
            productImages: {
                url: string;
                id: string;
                createdAt: Date;
                sortOrder: number;
                productId: string;
                alt: string | null;
                isPrimary: boolean;
            }[];
        } & {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            slug: string;
            description: string | null;
            shortDescription: string | null;
            price: import("@prisma/client/runtime/library").Decimal;
            comparePrice: import("@prisma/client/runtime/library").Decimal | null;
            costPrice: import("@prisma/client/runtime/library").Decimal | null;
            wholesalePrice: import("@prisma/client/runtime/library").Decimal | null;
            sku: string;
            barcode: string | null;
            mpn: string | null;
            gtin: string | null;
            stockQuantity: number;
            lowStockThreshold: number;
            stockStatus: string;
            weightUnit: string | null;
            weight: number | null;
            length: number | null;
            width: number | null;
            height: number | null;
            brand: string | null;
            vendorId: string | null;
            categoryId: string | null;
            averageRating: number;
            totalReviews: number;
            totalSold: number;
            isPublished: boolean;
            isFeatured: boolean;
            isNew: boolean;
            isOnSale: boolean;
            isDigital: boolean;
            isPreorder: boolean;
            preorderDate: Date | null;
            seoTitle: string | null;
            seoDescription: string | null;
            metaKeywords: string | null;
            canonicalUrl: string | null;
            publishedAt: Date | null;
        };
        variant: {
            id: string;
            name: string | null;
            createdAt: Date;
            updatedAt: Date;
            price: import("@prisma/client/runtime/library").Decimal | null;
            comparePrice: import("@prisma/client/runtime/library").Decimal | null;
            costPrice: import("@prisma/client/runtime/library").Decimal | null;
            sku: string;
            barcode: string | null;
            stockQuantity: number;
            weight: number | null;
            length: number | null;
            width: number | null;
            height: number | null;
            isActive: boolean;
            isDefault: boolean;
            productId: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        productId: string;
        quantity: number;
        cartId: string;
        variantId: string | null;
    }>;
    removeItem: (itemId: string) => Promise<{
        success: boolean;
    }>;
    clearCart: (cartId: string) => Promise<{
        success: boolean;
    }>;
    applyCoupon: (cartId: string, couponCode: string) => Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string | null;
        sessionId: string | null;
        couponCode: string | null;
        notes: string | null;
        abandonedAt: Date | null;
    }>;
    removeCoupon: (cartId: string) => Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string | null;
        sessionId: string | null;
        couponCode: string | null;
        notes: string | null;
        abandonedAt: Date | null;
    }>;
    updateShippingInfo: (cartId: string, _data: {
        shippingAddress?: any;
        shippingMethod?: any;
    }) => Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string | null;
        sessionId: string | null;
        couponCode: string | null;
        notes: string | null;
        abandonedAt: Date | null;
    }>;
    getCartSummary: (cartId: string) => Promise<{
        items: {
            itemId: string;
            productId: string;
            variantId: string;
            quantity: number;
        }[];
        subtotal: number;
        tax: number;
        shipping: number;
        discount: number;
        total: number;
    }>;
    update: (id: string, cartData: Partial<ICartItem>) => Promise<ICartItem>;
    delete: (id: string) => Promise<void>;
    deleteByUser: (userId: string) => Promise<void>;
    deleteByUserProduct: (userId: string, productId: string) => Promise<void>;
};
//# sourceMappingURL=Cart.d.ts.map