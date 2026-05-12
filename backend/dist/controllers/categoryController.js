"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCategoryProducts = exports.deleteCategory = exports.updateCategory = exports.createCategory = exports.getFeaturedCategories = exports.getRootCategories = exports.getCategoryBySlug = exports.getCategory = exports.getCategories = void 0;
const models_1 = require("../models");
const middleware_1 = require("../middleware");
const middleware_2 = require("../middleware");
const validationSchemas_1 = require("../middleware/validationSchemas");
exports.getCategories = (0, middleware_1.asyncHandler)(async (req, res) => {
    const { page = 1, limit = 50, parentId, isActive, isFeatured } = req.query;
    const result = await models_1.CategoryModel.findAll({
        page: Number(page),
        limit: Number(limit),
        parentId: parentId,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        isFeatured: isFeatured === 'true' ? true : isFeatured === 'false' ? false : undefined
    });
    res.json({
        success: true,
        data: result.categories,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total: result.total,
            pages: Math.ceil(result.total / Number(limit))
        }
    });
});
exports.getCategory = (0, middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const category = await models_1.CategoryModel.findById(id);
    if (!category) {
        throw new middleware_1.NotFoundError('Category', id);
    }
    res.json({
        success: true,
        data: category
    });
});
exports.getCategoryBySlug = (0, middleware_1.asyncHandler)(async (req, res) => {
    const { slug } = req.params;
    const category = await models_1.CategoryModel.findBySlug(slug);
    if (!category) {
        throw new middleware_1.NotFoundError('Category', slug);
    }
    res.json({
        success: true,
        data: category
    });
});
exports.getRootCategories = (0, middleware_1.asyncHandler)(async (req, res) => {
    const categories = await models_1.CategoryModel.getRootCategories();
    res.json({
        success: true,
        data: categories
    });
});
exports.getFeaturedCategories = (0, middleware_1.asyncHandler)(async (req, res) => {
    const { limit = 6 } = req.query;
    const categories = await models_1.CategoryModel.getFeaturedCategories(Number(limit));
    res.json({
        success: true,
        data: categories
    });
});
exports.createCategory = [
    (0, middleware_2.validateBody)(validationSchemas_1.categoryCreateSchema),
    (0, middleware_1.asyncHandler)(async (req, res) => {
        const categoryData = req.body;
        // Check if category with same slug exists
        const existingCategory = await models_1.CategoryModel.findBySlug(categoryData.slug);
        if (existingCategory) {
            throw new middleware_1.ValidationError('Category with this slug already exists');
        }
        const category = await models_1.CategoryModel.create(categoryData);
        res.status(201).json({
            success: true,
            data: category,
            message: 'Category created successfully'
        });
    })
];
exports.updateCategory = [
    (0, middleware_2.validateBody)(validationSchemas_1.categoryUpdateSchema),
    (0, middleware_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        const updateData = req.body;
        // Check if category exists
        const existingCategory = await models_1.CategoryModel.findById(id);
        if (!existingCategory) {
            throw new middleware_1.NotFoundError('Category', id);
        }
        // If slug is being updated, check for uniqueness
        if (updateData.slug && updateData.slug !== existingCategory.slug) {
            const slugExists = await models_1.CategoryModel.findBySlug(updateData.slug);
            if (slugExists) {
                throw new middleware_1.ValidationError('Category with this slug already exists');
            }
        }
        const category = await models_1.CategoryModel.update(id, updateData);
        res.json({
            success: true,
            data: category,
            message: 'Category updated successfully'
        });
    })
];
exports.deleteCategory = (0, middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    // Check if category exists
    const existingCategory = await models_1.CategoryModel.findById(id);
    if (!existingCategory) {
        throw new middleware_1.NotFoundError('Category', id);
    }
    // Check if category has products
    if (existingCategory.products && existingCategory.products.length > 0) {
        throw new middleware_1.ValidationError('Cannot delete category with existing products. Please move or delete products first.');
    }
    // Check if category has children
    if (existingCategory.children && existingCategory.children.length > 0) {
        throw new middleware_1.ValidationError('Cannot delete category with subcategories. Please delete subcategories first.');
    }
    await models_1.CategoryModel.delete(id);
    res.json({
        success: true,
        message: 'Category deleted successfully'
    });
});
exports.getCategoryProducts = (0, middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { page = 1, limit = 20, sortBy = 'name', sortOrder = 'asc' } = req.query;
    const category = await models_1.CategoryModel.findById(id);
    if (!category) {
        throw new middleware_1.NotFoundError('Category', id);
    }
    // Get products in this category (this would need to be implemented in CategoryModel)
    const products = await models_1.CategoryModel.getCategoryProducts(id, {
        page: Number(page),
        limit: Number(limit),
        sortBy: sortBy,
        sortOrder: sortOrder
    });
    res.json({
        success: true,
        data: products,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total: products.total,
            pages: Math.ceil(products.total / Number(limit))
        }
    });
});
//# sourceMappingURL=categoryController.js.map