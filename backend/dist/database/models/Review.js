"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewModel = void 0;
const index_1 = require("../index");
exports.ReviewModel = {
    findById: async (id) => {
        const review = await index_1.prisma.review.findUnique({
            where: { id }
        });
        return review;
    },
    findByProductId: async (productId) => {
        const reviews = await index_1.prisma.review.findMany({
            where: { productId },
            orderBy: { createdAt: 'desc' }
        });
        return reviews;
    },
    findByUserId: async (userId) => {
        const reviews = await index_1.prisma.review.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
        return reviews;
    },
    create: async (reviewData) => {
        const review = await index_1.prisma.review.create({
            data: reviewData
        });
        return review;
    },
    update: async (id, reviewData) => {
        const review = await index_1.prisma.review.update({
            where: { id },
            data: reviewData
        });
        return review;
    },
    delete: async (id) => {
        await index_1.prisma.review.delete({
            where: { id }
        });
    }
};
//# sourceMappingURL=Review.js.map