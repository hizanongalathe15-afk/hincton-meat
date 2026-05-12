export interface ICartItem {
    id: string;
    userId: string;
    productId: string;
    quantity: number;
    createdAt: Date;
    updatedAt: Date;
}
export declare const CartModel: {
    findById: (id: string) => Promise<ICartItem | null>;
    findByUserId: (userId: string) => Promise<ICartItem[]>;
    create: (cartData: Omit<ICartItem, "id" | "createdAt" | "updatedAt">) => Promise<ICartItem>;
    update: (id: string, cartData: Partial<ICartItem>) => Promise<ICartItem>;
    delete: (id: string) => Promise<void>;
    deleteByUser: (userId: string) => Promise<void>;
    deleteByUserProduct: (userId: string, productId: string) => Promise<void>;
};
//# sourceMappingURL=Cart.d.ts.map