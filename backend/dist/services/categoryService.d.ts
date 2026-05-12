export interface CreateCategoryData {
    name: string;
    slug?: string;
    description?: string;
    image?: string;
    bannerImage?: string;
    icon?: string;
    parentId?: string;
    sortOrder?: number;
    isActive?: boolean;
    isFeatured?: boolean;
    seoTitle?: string;
    seoDescription?: string;
}
export interface UpdateCategoryData {
    name?: string;
    slug?: string;
    description?: string;
    image?: string;
    bannerImage?: string;
    icon?: string;
    parentId?: string;
    sortOrder?: number;
    isActive?: boolean;
    isFeatured?: boolean;
    seoTitle?: string;
    seoDescription?: string;
}
declare class CategoryService {
    createCategory(categoryData: CreateCategoryData): Promise<{
        success: boolean;
        category?: any;
        error?: string;
    }>;
    updateCategory(categoryId: string, updateData: UpdateCategoryData): Promise<{
        success: boolean;
        category?: any;
        error?: string;
    }>;
    deleteCategory(categoryId: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    getCategory(categoryId: string, includeProducts?: boolean): Promise<{
        category?: any;
        error?: string;
    }>;
    getCategories(page?: number, limit?: number, filters?: {
        parentId?: string;
        isActive?: boolean;
        isFeatured?: boolean;
        search?: string;
    }, sortBy?: string, sortOrder?: 'asc' | 'desc'): Promise<{
        categories: any[];
        total: number;
        page: number;
        pages: number;
    }>;
    getRootCategories(): Promise<{
        categories: any[];
        total: number;
    }>;
    getFeaturedCategories(limit?: number): Promise<any[]>;
    getCategoryTree(): Promise<any[]>;
    private buildCategoryTree;
    updateCategoryOrder(categoryOrders: Array<{
        id: string;
        sortOrder: number;
    }>): Promise<{
        success: boolean;
        error?: string;
    }>;
    private generateSlug;
    private generateUniqueSlug;
    getCategoryStats(): Promise<{
        totalCategories: number;
        activeCategories: number;
        featuredCategories: number;
        categoriesWithProducts: number;
        averageProductsPerCategory: number;
    }>;
}
export declare const categoryService: CategoryService;
export default categoryService;
//# sourceMappingURL=categoryService.d.ts.map