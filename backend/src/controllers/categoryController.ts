import { Request, Response, NextFunction } from 'express'
import { CategoryModel } from '../models'
import { asyncHandler, AppError, NotFoundError, ValidationError } from '../middleware'
import { validateBody } from '../middleware'
import { categoryCreateSchema, categoryUpdateSchema } from '../middleware/validationSchemas'

const isDatabaseUnavailable = (error: unknown) => {
  const code = (error as any)?.code
  return code === 'P1001' || code === 'P2021' || code === 'P2022'
}

export const getCategories = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 50, parentId, isActive, isFeatured } = req.query

  let result: { categories: any[]; total: number }
  try {
    result = await CategoryModel.findAll({
      page: Number(page),
      limit: Number(limit),
      parentId: parentId as string,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      isFeatured: isFeatured === 'true' ? true : isFeatured === 'false' ? false : undefined
    })
  } catch (error) {
    if (!isDatabaseUnavailable(error)) throw error
    console.error('Get categories database unavailable:', error)
    result = { categories: [], total: 0 }
  }
  
  res.json({
    success: true,
    data: result.categories,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: result.total,
      pages: Math.ceil(result.total / Number(limit))
    }
  })
})

export const getCategory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const category = await CategoryModel.findById(id)
  
  if (!category) {
    throw new NotFoundError('Category', id)
  }
  
  res.json({
    success: true,
    data: category
  })
})

export const getCategoryBySlug = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params
  const category = await CategoryModel.findBySlug(slug)
  
  if (!category) {
    throw new NotFoundError('Category', slug)
  }
  
  res.json({
    success: true,
    data: category
  })
})

export const getRootCategories = asyncHandler(async (req: Request, res: Response) => {
  let categories: any[] = []
  try {
    categories = await CategoryModel.getRootCategories()
  } catch (error) {
    if (!isDatabaseUnavailable(error)) throw error
    console.error('Get root categories database unavailable:', error)
  }
  
  res.json({
    success: true,
    data: categories
  })
})

export const getFeaturedCategories = asyncHandler(async (req: Request, res: Response) => {
  const { limit = 6 } = req.query
  let categories: any[] = []
  try {
    categories = await CategoryModel.getFeaturedCategories(Number(limit))
  } catch (error) {
    if (!isDatabaseUnavailable(error)) throw error
    console.error('Get featured categories database unavailable:', error)
  }
  
  res.json({
    success: true,
    data: categories
  })
})

export const createCategory = [
  validateBody(categoryCreateSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const categoryData = req.body
    
    // Check if category with same slug exists
    const existingCategory = await CategoryModel.findBySlug(categoryData.slug)
    if (existingCategory) {
      throw new ValidationError('Category with this slug already exists')
    }
    
    const category = await CategoryModel.create(categoryData)
    
    res.status(201).json({
      success: true,
      data: category,
      message: 'Category created successfully'
    })
  })
]

export const updateCategory = [
  validateBody(categoryUpdateSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const updateData = req.body
    
    // Check if category exists
    const existingCategory = await CategoryModel.findById(id)
    if (!existingCategory) {
      throw new NotFoundError('Category', id)
    }
    
    // If slug is being updated, check for uniqueness
    if (updateData.slug && updateData.slug !== existingCategory.slug) {
      const slugExists = await CategoryModel.findBySlug(updateData.slug)
      if (slugExists) {
        throw new ValidationError('Category with this slug already exists')
      }
    }
    
    const category = await CategoryModel.update(id, updateData)
    
    res.json({
      success: true,
      data: category,
      message: 'Category updated successfully'
    })
  })
]

export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  
  // Check if category exists
  const existingCategory = await CategoryModel.findById(id)
  if (!existingCategory) {
    throw new NotFoundError('Category', id)
  }
  
  // Check if category has products
  if (existingCategory.products && existingCategory.products.length > 0) {
    throw new ValidationError('Cannot delete category with existing products. Please move or delete products first.')
  }
  
  // Check if category has children
  if (existingCategory.children && existingCategory.children.length > 0) {
    throw new ValidationError('Cannot delete category with subcategories. Please delete subcategories first.')
  }
  
  await CategoryModel.delete(id)
  
  res.json({
    success: true,
    message: 'Category deleted successfully'
  })
})

export const getCategoryProducts = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const { page = 1, limit = 20, sortBy = 'name', sortOrder = 'asc' } = req.query
  
  const category = await CategoryModel.findById(id)
  if (!category) {
    throw new NotFoundError('Category', id)
  }
  
  // Get products in this category (this would need to be implemented in CategoryModel)
  const products = await CategoryModel.getCategoryProducts(id, {
    page: Number(page),
    limit: Number(limit),
    sortBy: sortBy as string,
    sortOrder: sortOrder as string
  })
  
  res.json({
    success: true,
    data: products,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: products.total,
      pages: Math.ceil(products.total / Number(limit))
    }
  })
})
