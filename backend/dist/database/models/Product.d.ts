export interface IProduct {
    id: string;
    name: string;
    description: string;
    price: number;
    originalPrice?: number;
    category: string;
    subCategory: string;
    images: string;
    weightMin: number;
    weightMax: number;
    weightUnit: string;
    inStock: boolean;
    featured: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const ProductModel: {
    findById: (id: string) => Promise<IProduct | null>;
    findAll: (filters?: {
        category?: string;
        subCategory?: string;
        featured?: boolean;
        inStock?: boolean;
    }) => Promise<IProduct[]>;
    create: (productData: Omit<IProduct, "id" | "createdAt" | "updatedAt">) => Promise<IProduct>;
    update: (id: string, productData: Partial<IProduct>) => Promise<IProduct>;
    delete: (id: string) => Promise<void>;
};
//# sourceMappingURL=Product.d.ts.map