"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewModel = void 0;
const database_1 = require("../database");
exports.ReviewModel = {
    findById: async (id) => {
        const review = await database_1.prisma.review.findUnique({
            where: { id }
        });
        return review;
    },
    findByProductId: async (productId) => {
        const reviews = await database_1.prisma.review.findMany({
            where: { productId },
            orderBy: { createdAt: 'desc' }
        });
        return reviews;
    },
    findByUserId: async (userId) => {
        const reviews = await database_1.prisma.review.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
        return reviews;
    },
    create: async (reviewData) => {
        const review = await database_1.prisma.review.create({
            data: reviewData
        });
        return review;
    },
    update: async (id, reviewData) => {
        const review = await database_1.prisma.review.update({
            where: { id },
            data: reviewData
        });
        return review;
    },
    delete: async (id) => {
        await database_1.prisma.review.delete({
            where: { id }
        });
    }
};
//# sourceMappingURL=Review.js.map