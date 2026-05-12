export interface IWishlistItem {
    id: string;
    wishlistId: string;
    productId: string;
    variantId?: string;
    quantity: number;
    notes?: string;
    createdAt: Date;
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
    wishlist?: {
        id: string;
        userId: string;
        name: string;
        isPublic: boolean;
        shareToken?: string;
        createdAt: Date;
        updatedAt: Date;
    };
}
export declare const WishlistModel: {
    findById: (id: string) => Promise<IWishlistItem | null>;
    findByUserId: (userId: string) => Promise<IWishlistItem[]>;
    create: (wishlistData: Omit<IWishlistItem, "id" | "createdAt">) => Promise<IWishlistItem>;
    delete: (id: string) => Promise<void>;
    deleteByUserProduct: (userId: string, productId: string) => Promise<void>;
};
//# sourceMappingURL=Wishlist.d.ts.map