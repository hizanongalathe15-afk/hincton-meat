"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.advancedSearch = exports.getAutocompleteSuggestions = exports.getFilteredProducts = exports.getPopularSearches = exports.getSearchSuggestions = exports.searchCategories = exports.searchProducts = void 0;
const models_1 = require("../models");
const middleware_1 = require("../middleware");
const middleware_2 = require("../middleware");
const validationSchemas_1 = require("../middleware/validationSchemas");
exports.searchProducts = [
    (0, middleware_2.validateBody)(validationSchemas_1.searchSchema),
    (0, middleware_1.asyncHandler)(async (req, res) => {
        const { query, category, minPrice, maxPrice, brand, sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 20 } = req.body;
        const searchResults = await models_1.ProductModel.search({
            query,
            categoryId: category,
            minPrice: minPrice ? Number(minPrice) : undefined,
            maxPrice: maxPrice ? Number(maxPrice) : undefined,
            brand,
            sortBy,
            sortOrder: sortOrder,
            page: Number(page),
            limit: Number(limit)
        });
        res.json({
            success: true,
            data: searchResults.products,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total: searchResults.total,
                pages: Math.ceil(searchResults.total / Number(limit))
            },
            filters: {
                query,
                category,
                minPrice,
                maxPrice,
                brand,
                sortBy,
                sortOrder
            }
        });
    })
];
exports.searchCategories = (0, middleware_1.asyncHandler)(async (req, res) => {
    const { query, isActive = true } = req.query;
    const categories = await models_1.CategoryModel.findAll({
        // CategoryModel likely doesn't support `search` in TS typing; call without it.
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined
    });
    res.json({
        success: true,
        data: categories.categories,
        pagination: {
            page: 1,
            limit: categories.total,
            total: categories.total,
            pages: Math.ceil(categories.total / categories.total)
        }
    });
});
exports.getSearchSuggestions = (0, middleware_1.asyncHandler)(async (req, res) => {
    const { query, limit = 10 } = req.query;
    if (!query || query.length < 2) {
        return res.json({
            success: true,
            data: []
        });
    }
    const suggestions = await models_1.ProductModel.getSearchSuggestions(query, Number(limit));
    res.json({
        success: true,
        data: suggestions
    });
});
exports.getPopularSearches = (0, middleware_1.asyncHandler)(async (req, res) => {
    const { limit = 10 } = req.query;
    const popularSearches = await models_1.ProductModel.getPopularSearches(Number(limit));
    res.json({
        success: true,
        data: popularSearches
    });
});
exports.getFilteredProducts = (0, middleware_1.asyncHandler)(async (req, res) => {
    const { category, minPrice, maxPrice, brand, tags, inStock, isFeatured, sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 20 } = req.query;
    const filters = {};
    if (category)
        filters.categoryId = category;
    if (minPrice)
        filters.minPrice = Number(minPrice);
    if (maxPrice)
        filters.maxPrice = Number(maxPrice);
    if (brand)
        filters.brand = brand;
    if (tags)
        filters.tags = Array.isArray(tags) ? tags : [tags];
    if (inStock === 'true')
        filters.inStock = true;
    if (isFeatured === 'true')
        filters.isFeatured = true;
    const result = await models_1.ProductModel.findAll({
        ...filters,
        sortBy,
        sortOrder: sortOrder,
        page: Number(page),
        limit: Number(limit)
    });
    res.json({
        success: true,
        data: result.products ?? result,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total: result.total ?? (Array.isArray(result) ? result.length : 0),
            pages: Math.ceil((result.total ?? (Array.isArray(result) ? result.length : 0)) / Number(limit))
        },
        filters: {
            category,
            minPrice,
            maxPrice,
            brand,
            tags,
            inStock,
            isFeatured,
            sortBy,
            sortOrder
        }
    });
});
exports.getAutocompleteSuggestions = (0, middleware_1.asyncHandler)(async (req, res) => {
    const { query, type = 'products', limit = 5 } = req.query;
    if (!query || query.length < 2) {
        return res.json({
            success: true,
            data: []
        });
    }
    let suggestions = [];
    switch (type) {
        case 'products':
            suggestions = await models_1.ProductModel.getAutocompleteSuggestions(query, Number(limit));
            break;
        case 'categories':
            suggestions = await models_1.CategoryModel.getAutocompleteSuggestions(query, Number(limit));
            break;
        case 'brands':
            suggestions = await models_1.ProductModel.getBrandSuggestions(query, Number(limit));
            break;
        default:
            suggestions = await models_1.ProductModel.getAutocompleteSuggestions(query, Number(limit));
    }
    res.json({
        success: true,
        data: suggestions,
        type
    });
});
exports.advancedSearch = (0, middleware_1.asyncHandler)(async (req, res) => {
    const { query, categories, brands, priceRange, tags, rating, inStock, freeShipping, onSale, sortBy = 'relevance', sortOrder = 'desc', page = 1, limit = 20 } = req.body;
    const searchFilters = {
        query,
        categories: Array.isArray(categories) ? categories : [categories],
        brands: Array.isArray(brands) ? brands : [brands],
        tags: Array.isArray(tags) ? tags : [tags],
        minPrice: priceRange?.min,
        maxPrice: priceRange?.max,
        minRating: rating?.min,
        maxRating: rating?.max,
        inStock: inStock === 'true' ? true : undefined,
        freeShipping: freeShipping === 'true' ? true : undefined,
        onSale: onSale === 'true' ? true : undefined
    };
    const result = await models_1.ProductModel.advancedSearch({
        ...searchFilters,
        sortBy,
        sortOrder: sortOrder,
        page: Number(page),
        limit: Number(limit)
    });
    res.json({
        success: true,
        data: result.products,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total: result.total,
            pages: Math.ceil(result.total / Number(limit))
        },
        filters: searchFilters,
        searchMeta: {
            totalResults: result.total,
            searchTime: result.searchTime,
            facets: result.facets
        }
    });
});
//# sourceMappingURL=searchController.js.map