export interface ICategory {
    id: string;
    name: string;
    slug: string;
    description?: string;
    image?: string;
    bannerImage?: string;
    icon?: string;
    parentId?: string;
    sortOrder: number;
    isActive: boolean;
    isFeatured: boolean;
    seoTitle?: string;
    seoDescription?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
    parent?: ICategory;
    children?: ICategory[];
    products?: any[];
}
export declare const CategoryModel: {
    findById: (id: string) => Promise<ICategory | null>;
    findBySlug: (slug: string) => Promise<ICategory | null>;
    findAll: (params?: {
        page?: number;
        limit?: number;
        parentId?: string;
        isActive?: boolean;
        isFeatured?: boolean;
    }) => Promise<{
        categories: ICategory[];
        total: number;
    }>;
    create: (data: Omit<ICategory, "id" | "createdAt" | "updatedAt" | "deletedAt" | "parent" | "children" | "products">) => Promise<ICategory>;
    update: (id: string, data: Partial<Omit<ICategory, "id" | "createdAt" | "updatedAt" | "deletedAt" | "parent" | "children" | "products">>) => Promise<ICategory>;
    delete: (id: string) => Promise<void>;
    getRootCategories: () => Promise<ICategory[]>;
    getFeaturedCategories: (limit?: number) => Promise<ICategory[]>;
    findAllSearch: (params?: {
        search?: string;
        isActive?: boolean;
        isFeatured?: boolean;
        page?: number;
        limit?: number;
        parentId?: string;
    }) => Promise<{
        categories: ({
            parent: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                deletedAt: Date | null;
                slug: string;
                description: string | null;
                isFeatured: boolean;
                seoTitle: string | null;
                seoDescription: string | null;
                image: string | null;
                bannerImage: string | null;
                icon: string | null;
                parentId: string | null;
                sortOrder: number;
                isActive: boolean;
            };
            children: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                deletedAt: Date | null;
                slug: string;
                description: string | null;
                isFeatured: boolean;
                seoTitle: string | null;
                seoDescription: string | null;
                image: string | null;
                bannerImage: string | null;
                icon: string | null;
                parentId: string | null;
                sortOrder: number;
                isActive: boolean;
            }[];
        } & {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            slug: string;
            description: string | null;
            isFeatured: boolean;
            seoTitle: string | null;
            seoDescription: string | null;
            image: string | null;
            bannerImage: string | null;
            icon: string | null;
            parentId: string | null;
            sortOrder: number;
            isActive: boolean;
        })[];
        total: number;
        page: number;
        limit: number;
        pages: number;
    }>;
    getAutocompleteSuggestions: (query: string, limit?: number) => Promise<{
        id: string;
        name: string;
        slug: string;
        image: string;
        type: string;
    }[]>;
    getCategoryProducts: (categoryId: string, params?: {
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: "asc" | "desc" | string;
    }) => Promise<{
        products: any[];
        total: number;
    }>;
    searchCategories: (params?: {
        query?: string;
        isActive?: boolean;
        page?: number;
        limit?: number;
    }) => Promise<{
        categories: {
            productCount: number;
            _count: {
                products: number;
            };
            parent: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                deletedAt: Date | null;
                slug: string;
                description: string | null;
                isFeatured: boolean;
                seoTitle: string | null;
                seoDescription: string | null;
                image: string | null;
                bannerImage: string | null;
                icon: string | null;
                parentId: string | null;
                sortOrder: number;
                isActive: boolean;
            };
            children: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                deletedAt: Date | null;
                slug: string;
                description: string | null;
                isFeatured: boolean;
                seoTitle: string | null;
                seoDescription: string | null;
                image: string | null;
                bannerImage: string | null;
                icon: string | null;
                parentId: string | null;
                sortOrder: number;
                isActive: boolean;
            }[];
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            slug: string;
            description: string | null;
            isFeatured: boolean;
            seoTitle: string | null;
            seoDescription: string | null;
            image: string | null;
            bannerImage: string | null;
            icon: string | null;
            parentId: string | null;
            sortOrder: number;
            isActive: boolean;
        }[];
        total: number;
        page: number;
        limit: number;
        pages: number;
    }>;
};
//# sourceMappingURL=Category.d.ts.map