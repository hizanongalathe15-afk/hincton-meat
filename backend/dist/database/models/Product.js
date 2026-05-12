"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductModel = void 0;
const index_1 = require("../index");
exports.ProductModel = {
    findById: async (id) => {
        const product = await index_1.prisma.product.findUnique({
            where: { id }
        });
        return product;
    },
    findAll: async (filters) => {
        const products = await index_1.prisma.product.findMany({
            where: filters,
            orderBy: { createdAt: 'desc' }
        });
        return products;
    },
    create: async (productData) => {
        const product = await index_1.prisma.product.create({
            data: {
                name: productData.name,
                category: productData.category,
                subCategory: productData.subCategory,
                description: productData.description,
                price: productData.price,
                originalPrice: productData.originalPrice,
                images: productData.images,
                weightMin: productData.weightMin,
                weightMax: productData.weightMax,
                weightUnit: productData.weightUnit,
                inStock: productData.inStock,
                featured: productData.featured,
                tags: '[]',
                storageInstructions: 'Store in refrigerator',
                shelfLife: '7 days',
                calories: 0,
                protein: 0,
                fat: 0,
                carbs: 0,
                origin: 'Local',
                isHalal: false,
                isOrganic: false
            }
        });
        return product;
    },
    update: async (id, productData) => {
        const product = await index_1.prisma.product.update({
            where: { id },
            data: {
                name: productData.name,
                category: productData.category,
                subCategory: productData.subCategory,
                description: productData.description,
                price: productData.price,
                originalPrice: productData.originalPrice,
                images: productData.images,
                weightMin: productData.weightMin,
                weightMax: productData.weightMax,
                weightUnit: productData.weightUnit,
                inStock: productData.inStock,
                featured: productData.featured
            }
        });
        return product;
    },
    delete: async (id) => {
        await index_1.prisma.product.delete({
            where: { id }
        });
    }
};
//# sourceMappingURL=Product.js.map