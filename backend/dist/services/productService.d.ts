export interface CreateProductData {
    name: string;
    description: string;
    shortDescription?: string;
    price: number;
    comparePrice?: number;
    costPrice?: number;
    wholesalePrice?: number;
    sku: string;
    stockQuantity: number;
    lowStockThreshold: number;
    categoryId: string;
    vendorId: string;
    brand?: string;
    tags?: string[];
    weight?: number;
    dimensions?: {
        length: number;
        width: number;
        height: number;
    };
    isPublished?: boolean;
    isFeatured?: boolean;
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string;
}
export interface UpdateProductData {
    name?: string;
    description?: string;
    shortDescription?: string;
    price?: number;
    comparePrice?: number;
    costPrice?: number;
    wholesalePrice?: number;
    sku?: string;
    stockQuantity?: number;
    lowStockThreshold?: number;
    categoryId?: string;
    vendorId?: string;
    brand?: string;
    tags?: string[];
    weight?: number;
    dimensions?: {
        length: number;
        width: number;
        height: number;
    };
    isPublished?: boolean;
    isFeatured?: boolean;
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string;
}
declare class ProductService {
    createProduct(productData: CreateProductData, images?: Express.Multer.File[]): Promise<{
        success: boolean;
        product?: any;
        error?: string;
    }>;
    updateProduct(productId: string, updateData: UpdateProductData, images?: Express.Multer.File[]): Promise<{
        success: boolean;
        product?: any;
        error?: string;
    }>;
    deleteProduct(productId: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    getProduct(productId: string, includeImages?: boolean): Promise<{
        product?: any;
        error?: string;
    }>;
    getProducts(page?: number, limit?: number, filters?: {
        categoryId?: string;
        vendorId?: string;
        brand?: string;
        isPublished?: boolean;
        isFeatured?: boolean;
        minPrice?: number;
        maxPrice?: number;
        inStock?: boolean;
        onSale?: boolean;
    }, sortBy?: string, sortOrder?: 'asc' | 'desc'): Promise<{
        products: any[];
        total: number;
        page: number;
        pages: number;
    }>;
    getVendorProducts(vendorId: string, page?: number, limit?: number): Promise<{
        products: any[];
        total: number;
        page: number;
        pages: number;
    }>;
    updateStock(productId: string, quantity: number, operation: 'increase' | 'decrease' | 'set'): Promise<{
        success: boolean;
        product?: any;
        error?: string;
    }>;
    getTopSellingProducts(limit?: number): Promise<Array<{
        productId: string;
        productName: string;
        totalSold: number;
        revenue: number;
    }>>;
    getFeaturedProducts(limit?: number): Promise<any[]>;
    getRelatedProducts(productId: string, limit?: number): Promise<any[]>;
    private uploadProductImages;
    private getStockStatus;
    getProductStats(dateRange?: {
        from: Date;
        to: Date;
    }): Promise<{
        totalProducts: number;
        publishedProducts: number;
        outOfStockProducts: number;
        lowStockProducts: number;
        totalValue: number;
        averagePrice: number;
    }>;
}
export declare const productService: ProductService;
export default productService;
//# sourceMappingURL=productService.d.ts.map