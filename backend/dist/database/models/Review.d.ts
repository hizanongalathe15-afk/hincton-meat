export interface IReview {
    id: string;
    userId: string;
    productId: string;
    rating: number;
    comment: string;
    helpful?: number;
    createdAt: Date;
    updatedAt: Date;
}
export declare const ReviewModel: {
    findById: (id: string) => Promise<IReview | null>;
    findByProductId: (productId: string) => Promise<IReview[]>;
    findByUserId: (userId: string) => Promise<IReview[]>;
    create: (reviewData: Omit<IReview, "id" | "createdAt" | "updatedAt">) => Promise<IReview>;
    update: (id: string, reviewData: Partial<IReview>) => Promise<IReview>;
    delete: (id: string) => Promise<void>;
};
//# sourceMappingURL=Review.d.ts.map