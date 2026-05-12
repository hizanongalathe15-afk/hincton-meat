// @ts-nocheck
import { prisma } from '../database'
import { fileUploadService } from './fileUploadService'

export interface CreateProductData {
  name: string
  description: string
  shortDescription?: string
  price: number
  comparePrice?: number
  costPrice?: number
  wholesalePrice?: number
  sku: string
  stockQuantity: number
  lowStockThreshold: number
  categoryId: string
  vendorId: string
  brand?: string
  tags?: string[]
  weight?: number
  dimensions?: {
    length: number
    width: number
    height: number
  }
  isPublished?: boolean
  isFeatured?: boolean
  metaTitle?: string
  metaDescription?: string
  metaKeywords?: string
}

export interface UpdateProductData {
  name?: string
  description?: string
  shortDescription?: string
  price?: number
  comparePrice?: number
  costPrice?: number
  wholesalePrice?: number
  sku?: string
  stockQuantity?: number
  lowStockThreshold?: number
  categoryId?: string
  vendorId?: string
  brand?: string
  tags?: string[]
  weight?: number
  dimensions?: {
    length: number
    width: number
    height: number
  }
  isPublished?: boolean
  isFeatured?: boolean
  metaTitle?: string
  metaDescription?: string
  metaKeywords?: string
}

class ProductService {
  async createProduct(productData: CreateProductData, images?: Express.Multer.File[]): Promise<{
    success: boolean
    product?: any
    error?: string
  }> {
    try {
      // Check if SKU already exists
      const existingProduct = await prisma.product.findFirst({
        where: { sku: productData.sku }
      })

      if (existingProduct) {
        return {
          success: false,
          error: 'Product with this SKU already exists'
        }
      }

      // Create product
      const product = await prisma.product.create({
        data: {
          name: productData.name,
          description: productData.description,
          shortDescription: productData.shortDescription || '',
          price: productData.price,
          comparePrice: productData.comparePrice || null,
          costPrice: productData.costPrice || null,
          wholesalePrice: productData.wholesalePrice || null,
          sku: productData.sku,
          stockQuantity: productData.stockQuantity,
          lowStockThreshold: productData.lowStockThreshold,
          categoryId: productData.categoryId,
          vendorId: productData.vendorId,
          brand: productData.brand || '',
          tags: productData.tags || [],
          weight: productData.weight || null,
          dimensions: productData.dimensions || null,
          isPublished: productData.isPublished || false,
          isFeatured: productData.isFeatured || false,
          metaTitle: productData.metaTitle || '',
          metaDescription: productData.metaDescription || '',
          metaKeywords: productData.metaKeywords || '',
          totalSold: 0,
          averageRating: 0,
          totalReviews: 0,
          isOnSale: productData.comparePrice ? productData.comparePrice > productData.price : false
        }
      })

      // Upload product images if provided
      if (images && images.length > 0) {
        await this.uploadProductImages(product.id, images)
      }

      return {
        success: true,
        product
      }

    } catch (error) {
      console.error('Product creation error:', error)
      return {
        success: false,
        error: 'Failed to create product'
      }
    }
  }

  async updateProduct(productId: string, updateData: UpdateProductData, images?: Express.Multer.File[]): Promise<{
    success: boolean
    product?: any
    error?: string
  }> {
    try {
      const existingProduct = await prisma.product.findUnique({
        where: { id: productId }
      })

      if (!existingProduct) {
        return {
          success: false,
          error: 'Product not found'
        }
      }

      // Check SKU uniqueness if changed
      if (updateData.sku && updateData.sku !== existingProduct.sku) {
        const skuExists = await prisma.product.findFirst({
          where: { sku: updateData.sku }
        })

        if (skuExists) {
          return {
            success: false,
            error: 'Product with this SKU already exists'
          }
        }
      }

      // Update product
      const product = await prisma.product.update({
        where: { id: productId },
        data: {
          ...updateData,
          isOnSale: updateData.comparePrice && updateData.price 
            ? updateData.comparePrice > updateData.price 
            : existingProduct.isOnSale,
          updatedAt: new Date()
        }
      })

      // Upload new images if provided
      if (images && images.length > 0) {
        await this.uploadProductImages(productId, images)
      }

      return {
        success: true,
        product
      }

    } catch (error) {
      console.error('Product update error:', error)
      return {
        success: false,
        error: 'Failed to update product'
      }
    }
  }

  async deleteProduct(productId: string): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const product = await prisma.product.findUnique({
        where: { id: productId }
      })

      if (!product) {
        return {
          success: false,
          error: 'Product not found'
        }
      }

      // Soft delete (set isPublished to false)
      await prisma.product.update({
        where: { id: productId },
        data: {
          isPublished: false,
          deletedAt: new Date()
        }
      })

      return {
        success: true
      }

    } catch (error) {
      console.error('Product deletion error:', error)
      return {
        success: false,
        error: 'Failed to delete product'
      }
    }
  }

  async getProduct(productId: string, includeImages: boolean = true): Promise<{
    product?: any
    error?: string
  }> {
    try {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          category: true,
          vendor: true,
          productImages: includeImages,
          reviews: {
            select: {
              id: true,
              rating: true,
              comment: true,
              createdAt: true,
              user: {
                select: {
                  id: true,
                  name: true
                }
              }
            },
            orderBy: { createdAt: 'desc' },
            take: 10
          }
        }
      })

      if (!product) {
        return {
          error: 'Product not found'
        }
      }

      return {
        product
      }

    } catch (error) {
      console.error('Get product error:', error)
      return {
        error: 'Failed to get product'
      }
    }
  }

  async getProducts(
    page: number = 1,
    limit: number = 20,
    filters?: {
      categoryId?: string
      vendorId?: string
      brand?: string
      isPublished?: boolean
      isFeatured?: boolean
      minPrice?: number
      maxPrice?: number
      inStock?: boolean
      onSale?: boolean
    },
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{
    products: any[]
    total: number
    page: number
    pages: number
  }> {
    try {
      const skip = (page - 1) * limit

      const where: any = {}

      if (filters?.categoryId) {
        where.categoryId = filters.categoryId
      }

      if (filters?.vendorId) {
        where.vendorId = filters.vendorId
      }

      if (filters?.brand) {
        where.brand = { contains: filters.brand, mode: 'insensitive' }
      }

      if (filters?.isPublished !== undefined) {
        where.isPublished = filters.isPublished
      }

      if (filters?.isFeatured !== undefined) {
        where.isFeatured = filters.isFeatured
      }

      if (filters?.minPrice || filters?.maxPrice) {
        where.price = {}
        if (filters.minPrice) {
          where.price.gte = filters.minPrice
        }
        if (filters.maxPrice) {
          where.price.lte = filters.maxPrice
        }
      }

      if (filters?.inStock) {
        where.stockQuantity = { gt: 0 }
      }

      if (filters?.onSale) {
        where.isOnSale = true
      }

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          include: {
            category: true,
            vendor: true,
            productImages: true
          },
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit
        }),
        prisma.product.count({ where })
      ])

      return {
        products,
        total,
        page,
        pages: Math.ceil(total / limit)
      }

    } catch (error) {
      console.error('Get products error:', error)
      return {
        products: [],
        total: 0,
        page: 1,
        pages: 0
      }
    }
  }

  async getVendorProducts(
    vendorId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    products: any[]
    total: number
    page: number
    pages: number
  }> {
    try {
      const skip = (page - 1) * limit

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where: { vendorId },
          include: {
            category: true,
            productImages: true
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.product.count({ where: { vendorId } })
      ])

      return {
        products,
        total,
        page,
        pages: Math.ceil(total / limit)
      }

    } catch (error) {
      console.error('Get vendor products error:', error)
      return {
        products: [],
        total: 0,
        page: 1,
        pages: 0
      }
    }
  }

  async updateStock(productId: string, quantity: number, operation: 'increase' | 'decrease' | 'set'): Promise<{
    success: boolean
    product?: any
    error?: string
  }> {
    try {
      const product = await prisma.product.findUnique({
        where: { id: productId }
      })

      if (!product) {
        return {
          success: false,
          error: 'Product not found'
        }
      }

      let newStock = product.stockQuantity

      switch (operation) {
        case 'increase':
          newStock += quantity
          break
        case 'decrease':
          newStock = Math.max(0, newStock - quantity)
          break
        case 'set':
          newStock = Math.max(0, quantity)
          break
      }

      const updatedProduct = await prisma.product.update({
        where: { id: productId },
        data: {
          stockQuantity: newStock,
          stockStatus: this.getStockStatus(newStock, product.lowStockThreshold)
        }
      })

      return {
        success: true,
        product: updatedProduct
      }

    } catch (error) {
      console.error('Update stock error:', error)
      return {
        success: false,
        error: 'Failed to update stock'
      }
    }
  }

  async getTopSellingProducts(limit: number = 10): Promise<Array<{
    productId: string
    productName: string
    totalSold: number
    revenue: number
  }>> {
    try {
      const products = await prisma.product.findMany({
        where: { isPublished: true },
        orderBy: { totalSold: 'desc' },
        take: limit,
        select: {
          id: true,
          name: true,
          totalSold: true,
          price: true
        }
      })

      return products.map(product => ({
        productId: product.id,
        productName: product.name,
        totalSold: product.totalSold,
        revenue: product.totalSold * Number(product.price)
      }))

    } catch (error) {
      console.error('Top selling products error:', error)
      return []
    }
  }

  async getFeaturedProducts(limit: number = 10): Promise<any[]> {
    try {
      const products = await prisma.product.findMany({
        where: { 
          isPublished: true,
          isFeatured: true
        },
        include: {
          category: true,
          productImages: true
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      })

      return products

    } catch (error) {
      console.error('Featured products error:', error)
      return []
    }
  }

  async getRelatedProducts(productId: string, limit: number = 6): Promise<any[]> {
    try {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: {
          categoryId: true,
          brand: true,
          tags: true
        }
      })

      if (!product) {
        return []
      }

      const where: any = {
        id: { not: productId },
        isPublished: true
      }

      // Find products in same category or with same brand or tags
      where.OR = [
        { categoryId: product.categoryId },
        { brand: product.brand },
        { tags: { hasSome: product.tags } }
      ]

      const relatedProducts = await prisma.product.findMany({
        where,
        include: {
          category: true,
          productImages: true
        },
        orderBy: { totalSold: 'desc' },
        take: limit
      })

      return relatedProducts

    } catch (error) {
      console.error('Related products error:', error)
      return []
    }
  }

  private async uploadProductImages(productId: string, images: Express.Multer.File[]): Promise<void> {
    try {
      for (let i = 0; i < images.length; i++) {
        const image = images[i]
        const uploadResult = await fileUploadService.uploadFile(image, {
          folder: 'products',
          generateThumbnails: true
        })

        if (uploadResult.success && uploadResult.url) {
          await prisma.productImage.create({
            data: {
              productId,
              url: uploadResult.url,
              isPrimary: i === 0, // First image is primary
              sortOrder: i
            }
          })
        }
      }
    } catch (error) {
      console.error('Product image upload error:', error)
    }
  }

  private getStockStatus(stockQuantity: number, lowStockThreshold: number): string {
    if (stockQuantity <= 0) {
      return 'OUT_OF_STOCK'
    } else if (stockQuantity <= lowStockThreshold) {
      return 'LOW_STOCK'
    } else {
      return 'IN_STOCK'
    }
  }

  async getProductStats(dateRange?: { from: Date; to: Date }): Promise<{
    totalProducts: number
    publishedProducts: number
    outOfStockProducts: number
    lowStockProducts: number
    totalValue: number
    averagePrice: number
  }> {
    try {
      const where = dateRange ? {
        createdAt: {
          gte: dateRange.from,
          lte: dateRange.to
        }
      } : {}

      const [
        totalProducts,
        publishedProducts,
        outOfStockProducts,
        lowStockProducts,
        valueData
      ] = await Promise.all([
        prisma.product.count({ where }),
        prisma.product.count({ 
          where: { ...where, isPublished: true }
        }),
        prisma.product.count({ 
          where: { ...where, stockQuantity: { lte: 0 } }
        }),
        prisma.product.count({ 
          where: { 
            ...where, 
            stockQuantity: { 
              lte: prisma.product.fields.lowStockThreshold 
            } 
          } 
        }),
        prisma.product.aggregate({
          where: { ...where, isPublished: true },
          _sum: { price: true },
          _avg: { price: true }
        })
      ])

      const totalValue = Number(valueData._sum.price || 0)
      const averagePrice = Number(valueData._avg.price || 0)

      return {
        totalProducts,
        publishedProducts,
        outOfStockProducts,
        lowStockProducts,
        totalValue,
        averagePrice
      }

    } catch (error) {
      console.error('Product stats error:', error)
      return {
        totalProducts: 0,
        publishedProducts: 0,
        outOfStockProducts: 0,
        lowStockProducts: 0,
        totalValue: 0,
        averagePrice: 0
      }
    }
  }
}

export const productService = new ProductService()
export default productService
