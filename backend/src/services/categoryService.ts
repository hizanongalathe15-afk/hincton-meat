// @ts-nocheck
import { prisma } from '../database'

export interface CreateCategoryData {
  name: string
  slug?: string
  description?: string
  image?: string
  bannerImage?: string
  icon?: string
  parentId?: string
  sortOrder?: number
  isActive?: boolean
  isFeatured?: boolean
  seoTitle?: string
  seoDescription?: string
}

export interface UpdateCategoryData {
  name?: string
  slug?: string
  description?: string
  image?: string
  bannerImage?: string
  icon?: string
  parentId?: string
  sortOrder?: number
  isActive?: boolean
  isFeatured?: boolean
  seoTitle?: string
  seoDescription?: string
}

class CategoryService {
  async createCategory(categoryData: CreateCategoryData): Promise<{
    success: boolean
    category?: any
    error?: string
  }> {
    try {
      // Check if slug already exists or generate from name
      let slug = categoryData.slug || this.generateSlug(categoryData.name)
      
      const existingCategory = await prisma.category.findFirst({
        where: { slug }
      })

      if (existingCategory) {
        slug = this.generateUniqueSlug(categoryData.name)
      }

      // If parent is provided, verify it exists
      if (categoryData.parentId) {
        const parentCategory = await prisma.category.findUnique({
          where: { id: categoryData.parentId }
        })

        if (!parentCategory) {
          return {
            success: false,
            error: 'Parent category not found'
          }
        }
      }

      const category = await prisma.category.create({
        data: {
          name: categoryData.name,
          slug,
          description: categoryData.description || '',
          image: categoryData.image || '',
          bannerImage: categoryData.bannerImage || '',
          icon: categoryData.icon || '',
          parentId: categoryData.parentId || null,
          sortOrder: categoryData.sortOrder || 0,
          isActive: categoryData.isActive !== undefined ? categoryData.isActive : true,
          isFeatured: categoryData.isFeatured || false,
          seoTitle: categoryData.seoTitle || '',
          seoDescription: categoryData.seoDescription || ''
        }
      })

      return {
        success: true,
        category
      }

    } catch (error) {
      console.error('Category creation error:', error)
      return {
        success: false,
        error: 'Failed to create category'
      }
    }
  }

  async updateCategory(categoryId: string, updateData: UpdateCategoryData): Promise<{
    success: boolean
    category?: any
    error?: string
  }> {
    try {
      const existingCategory = await prisma.category.findUnique({
        where: { id: categoryId }
      })

      if (!existingCategory) {
        return {
          success: false,
          error: 'Category not found'
        }
      }

      // Check slug uniqueness if changed
      if (updateData.slug && updateData.slug !== existingCategory.slug) {
        const slugExists = await prisma.category.findFirst({
          where: { 
            slug: updateData.slug,
            id: { not: categoryId }
          }
        })

        if (slugExists) {
          return {
            success: false,
            error: 'Category with this slug already exists'
          }
        }
      }

      // If parent is provided, verify it exists
      if (updateData.parentId) {
        const parentCategory = await prisma.category.findUnique({
          where: { id: updateData.parentId }
        })

        if (!parentCategory) {
          return {
            success: false,
            error: 'Parent category not found'
          }
        }

        // Prevent circular reference
        if (updateData.parentId === categoryId) {
          return {
            success: false,
            error: 'Category cannot be its own parent'
          }
        }
      }

      const category = await prisma.category.update({
        where: { id: categoryId },
        data: {
          ...updateData,
          slug: updateData.slug || existingCategory.slug,
          updatedAt: new Date()
        }
      })

      return {
        success: true,
        category
      }

    } catch (error) {
      console.error('Category update error:', error)
      return {
        success: false,
        error: 'Failed to update category'
      }
    }
  }

  async deleteCategory(categoryId: string): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
        include: {
          children: true,
          products: true
        }
      })

      if (!category) {
        return {
          success: false,
          error: 'Category not found'
        }
      }

      // Check if category has children
      if (category.children && category.children.length > 0) {
        return {
          success: false,
          error: 'Cannot delete category with subcategories. Delete subcategories first.'
        }
      }

      // Check if category has products
      if (category.products && category.products.length > 0) {
        return {
          success: false,
          error: 'Cannot delete category with products. Move products to another category first.'
        }
      }

      // Soft delete
      await prisma.category.update({
        where: { id: categoryId },
        data: {
          isActive: false,
          deletedAt: new Date()
        }
      })

      return {
        success: true
      }

    } catch (error) {
      console.error('Category deletion error:', error)
      return {
        success: false,
        error: 'Failed to delete category'
      }
    }
  }

  async getCategory(categoryId: string, includeProducts: boolean = false): Promise<{
    category?: any
    error?: string
  }> {
    try {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
        include: {
          parent: true,
          children: true,
          products: includeProducts ? {
            where: { isPublished: true },
            take: 10,
            orderBy: { createdAt: 'desc' }
          } : false
        }
      })

      if (!category) {
        return {
          error: 'Category not found'
        }
      }

      return {
        category
      }

    } catch (error) {
      console.error('Get category error:', error)
      return {
        error: 'Failed to get category'
      }
    }
  }

  async getCategories(
    page: number = 1,
    limit: number = 50,
    filters?: {
      parentId?: string
      isActive?: boolean
      isFeatured?: boolean
      search?: string
    },
    sortBy: string = 'sortOrder',
    sortOrder: 'asc' | 'desc' = 'asc'
  ): Promise<{
    categories: any[]
    total: number
    page: number
    pages: number
  }> {
    try {
      const skip = (page - 1) * limit

      const where: any = {}

      if (filters?.parentId !== undefined) {
        where.parentId = filters.parentId
      }

      if (filters?.isActive !== undefined) {
        where.isActive = filters.isActive
      }

      if (filters?.isFeatured !== undefined) {
        where.isFeatured = filters.isFeatured
      }

      if (filters?.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
          { slug: { contains: filters.search, mode: 'insensitive' } }
        ]
      }

      const [categories, total] = await Promise.all([
        prisma.category.findMany({
          where,
          include: {
            parent: true,
            children: true,
            _count: {
              select: {
                products: {
                  where: { isPublished: true }
                }
              }
            }
          },
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit
        }),
        prisma.category.count({ where })
      ])

      return {
        categories,
        total,
        page,
        pages: Math.ceil(total / limit)
      }

    } catch (error) {
      console.error('Get categories error:', error)
      return {
        categories: [],
        total: 0,
        page: 1,
        pages: 0
      }
    }
  }

  async getRootCategories(): Promise<{
    categories: any[]
    total: number
  }> {
    try {
      const categories = await prisma.category.findMany({
        where: {
          parentId: null,
          isActive: true
        },
        include: {
          children: {
            where: { isActive: true },
            include: {
              children: {
                where: { isActive: true }
              }
            }
          },
          _count: {
            select: {
              products: {
                where: { isPublished: true }
              }
            }
          }
        },
        orderBy: { sortOrder: 'asc' }
      })

      return {
        categories,
        total: categories.length
      }

    } catch (error) {
      console.error('Get root categories error:', error)
      return {
        categories: [],
        total: 0
      }
    }
  }

  async getFeaturedCategories(limit: number = 6): Promise<any[]> {
    try {
      const categories = await prisma.category.findMany({
        where: {
          isFeatured: true,
          isActive: true
        },
        include: {
          _count: {
            select: {
              products: {
                where: { isPublished: true }
              }
            }
          }
        },
        orderBy: { sortOrder: 'asc' },
        take: limit
      })

      return categories

    } catch (error) {
      console.error('Get featured categories error:', error)
      return []
    }
  }

  async getCategoryTree(): Promise<any[]> {
    try {
      const categories = await prisma.category.findMany({
        where: { isActive: true },
        include: {
          children: {
            where: { isActive: true },
            include: {
              children: {
                where: { isActive: true }
              }
            }
          },
          _count: {
            select: {
              products: {
                where: { isPublished: true }
              }
            }
          }
        },
        orderBy: { sortOrder: 'asc' }
      })

      return this.buildCategoryTree(categories)

    } catch (error) {
      console.error('Get category tree error:', error)
      return []
    }
  }

  private buildCategoryTree(categories: any[]): any[] {
    const categoryMap = new Map()
    const rootCategories: any[] = []

    // Create map of all categories
    categories.forEach(category => {
      categoryMap.set(category.id, { ...category, children: [] })
    })

    // Build tree structure
    categories.forEach(category => {
      if (category.parentId) {
        const parent = categoryMap.get(category.parentId)
        if (parent) {
          parent.children.push(categoryMap.get(category.id))
        }
      } else {
        rootCategories.push(categoryMap.get(category.id))
      }
    })

    return rootCategories
  }

  async updateCategoryOrder(categoryOrders: Array<{
    id: string
    sortOrder: number
  }>): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      for (const { id, sortOrder } of categoryOrders) {
        await prisma.category.update({
          where: { id },
          data: { sortOrder }
        })
      }

      return {
        success: true
      }

    } catch (error) {
      console.error('Update category order error:', error)
      return {
        success: false,
        error: 'Failed to update category order'
      }
    }
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  private generateUniqueSlug(name: string): string {
    let slug = this.generateSlug(name)
    let counter = 1
    let uniqueSlug = slug

    while (true) {
      const existing = await prisma.category.findFirst({
        where: { slug: uniqueSlug }
      })

      if (!existing) {
        break
      }

      uniqueSlug = `${slug}-${counter}`
      counter++
    }

    return uniqueSlug
  }

  async getCategoryStats(): Promise<{
    totalCategories: number
    activeCategories: number
    featuredCategories: number
    categoriesWithProducts: number
    averageProductsPerCategory: number
  }> {
    try {
      const [
        totalCategories,
        activeCategories,
        featuredCategories,
        categoryData
      ] = await Promise.all([
        prisma.category.count(),
        prisma.category.count({ where: { isActive: true } }),
        prisma.category.count({ where: { isFeatured: true } }),
        prisma.category.groupBy({
          by: ['id'],
          include: {
            products: {
              where: { isPublished: true }
            }
          }
        })
      ])

      const categoriesWithProducts = categoryData.filter(cat => 
        cat.products && cat.products.length > 0
      ).length

      const totalProducts = categoryData.reduce((sum, cat) => 
        sum + (cat.products?.length || 0), 0
      )

      const averageProductsPerCategory = totalCategories > 0 
        ? totalProducts / totalCategories 
        : 0

      return {
        totalCategories,
        activeCategories,
        featuredCategories,
        categoriesWithProducts,
        averageProductsPerCategory
      }

    } catch (error) {
      console.error('Category stats error:', error)
      return {
        totalCategories: 0,
        activeCategories: 0,
        featuredCategories: 0,
        categoriesWithProducts: 0,
        averageProductsPerCategory: 0
      }
    }
  }
}

export const categoryService = new CategoryService()
export default categoryService
