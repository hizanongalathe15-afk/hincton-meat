import { prisma } from '../database'

export interface ICategory {
  id: string
  name: string
  slug: string
  description?: string
  image?: string
  bannerImage?: string
  icon?: string
  parentId?: string
  sortOrder: number
  isActive: boolean
  isFeatured: boolean
  seoTitle?: string
  seoDescription?: string
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
  parent?: ICategory
  children?: ICategory[]
  products?: any[]
}

export const CategoryModel = {
  findById: async (id: string): Promise<ICategory | null> => {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        products: {
          where: { isPublished: true, deletedAt: null },
          take: 10
        }
      }
    })
    return category
  },

  findBySlug: async (slug: string): Promise<ICategory | null> => {
    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        parent: true,
        children: true,
        products: {
          where: { isPublished: true, deletedAt: null },
          take: 10
        }
      }
    })
    return category
  },

  findAll: async (params: {
    page?: number
    limit?: number
    parentId?: string
    isActive?: boolean
    isFeatured?: boolean
  } = {}): Promise<{ categories: ICategory[]; total: number }> => {
    const { page = 1, limit = 50, parentId, isActive, isFeatured } = params
    const skip = (page - 1) * limit

    const where: any = {}
    if (parentId !== undefined) where.parentId = parentId
    if (isActive !== undefined) where.isActive = isActive
    if (isFeatured !== undefined) where.isFeatured = isFeatured
    where.deletedAt = null

    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        where,
        include: {
          parent: true,
          children: true,
          _count: {
            select: { products: { where: { isPublished: true, deletedAt: null } } }
          }
        },
        orderBy: { sortOrder: 'asc' },
        skip,
        take: limit
      }),
      prisma.category.count({ where })
    ])

    return { categories, total }
  },

  create: async (data: Omit<ICategory, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'parent' | 'children' | 'products'>): Promise<ICategory> => {
    const category = await prisma.category.create({
      data,
      include: {
        parent: true,
        children: true
      }
    })
    return category
  },

  update: async (id: string, data: Partial<Omit<ICategory, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'parent' | 'children' | 'products'>>): Promise<ICategory> => {
    const category = await prisma.category.update({
      where: { id },
      data,
      include: {
        parent: true,
        children: true
      }
    })
    return category
  },

  delete: async (id: string): Promise<void> => {
    await prisma.category.delete({
      where: { id }
    })
  },

  getRootCategories: async (): Promise<ICategory[]> => {
    const categories = await prisma.category.findMany({
      where: { parentId: null, isActive: true, deletedAt: null },
      include: {
        children: {
          where: { isActive: true, deletedAt: null },
          include: {
            _count: {
              select: { products: { where: { isPublished: true, deletedAt: null } } }
            }
          }
        },
        _count: {
          select: { products: { where: { isPublished: true, deletedAt: null } } }
        }
      },
      orderBy: { sortOrder: 'asc' }
    })
    return categories
  },

  getFeaturedCategories: async (limit: number = 6): Promise<ICategory[]> => {
    const categories = await prisma.category.findMany({
      where: { isFeatured: true, isActive: true, deletedAt: null },
      include: {
        _count: {
          select: { products: { where: { isPublished: true, deletedAt: null } } }
        }
      },
      orderBy: { sortOrder: 'asc' },
      take: limit
    })
    return categories
  },

  // Search methods
  findAllSearch: async (params?: {
    search?: string
    isActive?: boolean
    isFeatured?: boolean
    page?: number
    limit?: number
    parentId?: string
  }) => {
    const { search, isActive, isFeatured, page = 1, limit = 50, parentId } = params || {}
    const skip = (page - 1) * limit

    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (isActive !== undefined) where.isActive = isActive
    if (isFeatured !== undefined) where.isFeatured = isFeatured
    if (parentId) where.parentId = parentId

    where.deletedAt = null

    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        where,
        skip,
        take: limit,
        orderBy: { sortOrder: 'asc' },
        include: {
          parent: true,
          children: true
        }
      }),
      prisma.category.count({ where })
    ])

    return {
      categories,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  },

  getAutocompleteSuggestions: async (query: string, limit: number = 5) => {
    const categories = await prisma.category.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { slug: { contains: query, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        slug: true,
        image: true
      },
      orderBy: { sortOrder: 'asc' },
      take: limit
    })

    return categories.map(category => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      image: category.image,
      type: 'category'
    }))
  },

  getCategoryProducts: async (
    categoryId: string,
    params: {
      page?: number
      limit?: number
      sortBy?: string
      sortOrder?: 'asc' | 'desc' | string
    } = {}
  ): Promise<{ products: any[]; total: number }> => {
    const { page = 1, limit = 20, sortBy = 'name', sortOrder } = params
    const normalizedSortOrder: 'asc' | 'desc' = sortOrder === 'desc' ? 'desc' : 'asc'
    const skip = (page - 1) * limit

    const where: any = {
      categoryId,
      isPublished: true,
      deletedAt: null
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          ...(sortBy === 'price' ? { price: normalizedSortOrder } : { [sortBy]: normalizedSortOrder })
        } as any,
        include: {
          productImages: true,
          category: true,
          vendor: true
        }
      }),
      prisma.product.count({ where })
    ])

    return {
      products: products.map(p => ({
        ...p,
        price: Number((p as any).price),
        comparePrice: (p as any).comparePrice != null ? Number((p as any).comparePrice) : undefined,
        costPrice: (p as any).costPrice != null ? Number((p as any).costPrice) : undefined,
        wholesalePrice: (p as any).wholesalePrice != null ? Number((p as any).wholesalePrice) : undefined
      })),
      total
    }
  },

  searchCategories: async (params?: {
    query?: string
    isActive?: boolean
    page?: number
    limit?: number
  }) => {
    const { query, isActive, page = 1, limit = 20 } = params || {}
    const skip = (page - 1) * limit

    const where: any = {}
    
    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { slug: { contains: query, mode: 'insensitive' } }
      ]
    }

    if (isActive !== undefined) {
      where.isActive = isActive
    }

    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        where,
        skip,
        take: limit,
        orderBy: { sortOrder: 'asc' },
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
        }
      }),
      prisma.category.count({ where })
    ])

    return {
      categories: categories.map(category => ({
        ...category,
        productCount: category._count.products
      })),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  }
}
