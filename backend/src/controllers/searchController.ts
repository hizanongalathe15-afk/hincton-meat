import { Request, Response, NextFunction } from 'express'
import { ProductModel, CategoryModel } from '../models'
import { asyncHandler, AppError, ValidationError } from '../middleware'
import { validateBody } from '../middleware'
import { searchSchema } from '../middleware/validationSchemas'

export const searchProducts = [
  validateBody(searchSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { query, category, minPrice, maxPrice, brand, sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 20 } = req.body
    
    const searchResults = await ProductModel.search({
      query,
      categoryId: category,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      brand,
      sortBy,
      sortOrder: sortOrder as 'asc' | 'desc',
      page: Number(page),
      limit: Number(limit)
    })
    
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
    })
  })
]

export const searchCategories = asyncHandler(async (req: Request, res: Response) => {
  const { query, isActive = true } = req.query
  
  const categories = await CategoryModel.findAll({
    // CategoryModel likely doesn't support `search` in TS typing; call without it.
    isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined
  } as any)

  
  res.json({
    success: true,
    data: categories.categories,
    pagination: {
      page: 1,
      limit: categories.total,
      total: categories.total,
      pages: Math.ceil(categories.total / categories.total)
    }
  })
})

export const getSearchSuggestions = asyncHandler(async (req: Request, res: Response) => {
  const { query, limit = 10 } = req.query
  
  if (!query || (query as string).length < 2) {
    return res.json({
      success: true,
      data: []
    })
  }
  
  const suggestions = await ProductModel.getSearchSuggestions(query as string, Number(limit))
  
  res.json({
    success: true,
    data: suggestions
  })
})

export const getPopularSearches = asyncHandler(async (req: Request, res: Response) => {
  const { limit = 10 } = req.query
  
  const popularSearches = await ProductModel.getPopularSearches(Number(limit))
  
  res.json({
    success: true,
    data: popularSearches
  })
})

export const getFilteredProducts = asyncHandler(async (req: Request, res: Response) => {
  const { 
    category, 
    minPrice, 
    maxPrice, 
    brand, 
    tags, 
    inStock, 
    isFeatured,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = 1,
    limit = 20 
  } = req.query
  
  const filters: any = {}
  if (category) filters.categoryId = category
  if (minPrice) filters.minPrice = Number(minPrice)
  if (maxPrice) filters.maxPrice = Number(maxPrice)
  if (brand) filters.brand = brand
  if (tags) filters.tags = Array.isArray(tags) ? tags : [tags]
  if (inStock === 'true') filters.inStock = true
  if (isFeatured === 'true') filters.isFeatured = true
  
  const result = await ProductModel.findAll({
    ...filters,
    sortBy,
    sortOrder: sortOrder as 'asc' | 'desc',
    page: Number(page),
    limit: Number(limit)
  })
  
  res.json({
      success: true,
      data: (result as any).products ?? result,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: (result as any).total ?? (Array.isArray(result) ? result.length : 0),
        pages: Math.ceil(((result as any).total ?? (Array.isArray(result) ? result.length : 0)) / Number(limit))
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
  })
})

export const getAutocompleteSuggestions = asyncHandler(async (req: Request, res: Response) => {
  const { query, type = 'products', limit = 5 } = req.query
  
  if (!query || (query as string).length < 2) {
    return res.json({
      success: true,
      data: []
    })
  }
  
  let suggestions = []
  
  switch (type) {
    case 'products':
      suggestions = await ProductModel.getAutocompleteSuggestions(query as string, Number(limit))
      break
    case 'categories':
      suggestions = await CategoryModel.getAutocompleteSuggestions(query as string, Number(limit))
      break
    case 'brands':
      suggestions = await ProductModel.getBrandSuggestions(query as string, Number(limit))
      break
    default:
      suggestions = await ProductModel.getAutocompleteSuggestions(query as string, Number(limit))
  }
  
  res.json({
    success: true,
    data: suggestions,
    type
  })
})

export const advancedSearch = asyncHandler(async (req: Request, res: Response) => {
  const { 
    query,
    categories,
    brands,
    priceRange,
    tags,
    rating,
    inStock,
    freeShipping,
    onSale,
    sortBy = 'relevance',
    sortOrder = 'desc',
    page = 1,
    limit = 20 
  } = req.body
  
  const searchFilters: any = {
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
  }
  
  const result = await ProductModel.advancedSearch({
    ...searchFilters,
    sortBy,
    sortOrder: sortOrder as 'asc' | 'desc',
    page: Number(page),
    limit: Number(limit)
  })
  
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
  })
})
