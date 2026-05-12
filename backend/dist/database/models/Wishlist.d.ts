export interface IWishlistItem {
    id: string;
    userId: string;
    productId: string;
    createdAt: Date;
    updatedAt: Date;
    product?: any;
}
export declare const WishlistModel: {
    findById: (id: string) => Promise<IWishlistItem | null>;
    findByUserId: (userId: string) => Promise<IWishlistItem[]>;
    create: (wishlistData: Omit<IWishlistItem, "id" | "createdAt" | "updatedAt">) => Promise<IWishlistItem>;
    delete: (id: string) => Promise<void>;
    deleteByUserProduct: (userId: string, productId: string) => Promise<void>;
};
//# sourceMappingURL=Wishlist.d.ts.map