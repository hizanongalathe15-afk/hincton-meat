// @ts-nocheck
import { prisma } from '../database'

export interface StockUpdateData {
  productId: string
  quantity: number
  operation: 'increase' | 'decrease' | 'set'
  reason?: string
  userId?: string
}

export interface LowStockAlert {
  productId: string
  productName: string
  currentStock: number
  lowStockThreshold: number
  recommendedOrderQuantity: number
}

export interface InventoryStats {
  totalProducts: number
  inStockProducts: number
  outOfStockProducts: number
  lowStockProducts: number
  totalValue: number
  categories: Array<{
    name: string
    productCount: number
    totalValue: number
  }>
}

class InventoryService {
  async updateStock(updateData: StockUpdateData): Promise<{
    success: boolean
    error?: string
    previousStock?: number
    newStock?: number
  }> {
    try {
      const product = await prisma.product.findUnique({
        where: { id: updateData.productId }
      })

      if (!product) {
        return {
          success: false,
          error: 'Product not found'
        }
      }

      const previousStock = product.stockQuantity
      let newStock = previousStock

      switch (updateData.operation) {
        case 'increase':
          newStock = previousStock + updateData.quantity
          break
        case 'decrease':
          newStock = Math.max(0, previousStock - updateData.quantity)
          break
        case 'set':
          newStock = Math.max(0, updateData.quantity)
          break
        default:
          return {
            success: false,
            error: 'Invalid stock operation'
          }
      }

      // Update product stock
      await prisma.product.update({
        where: { id: updateData.productId },
        data: {
          stockQuantity: newStock,
          stockStatus: this.getStockStatus(newStock, product.lowStockThreshold)
        }
      })

      // Create stock movement record
      await prisma.stockMovement.create({
        data: {
          productId: updateData.productId,
          quantity: updateData.quantity,
          operation: updateData.operation.toUpperCase(),
          previousStock,
          newStock,
          reason: updateData.reason || 'Manual update',
          userId: updateData.userId || 'system'
        }
      })

      // Check for low stock alert
      if (newStock <= product.lowStockThreshold) {
        await this.createLowStockAlert({
          productId: updateData.productId,
          productName: product.name,
          currentStock: newStock,
          lowStockThreshold: product.lowStockThreshold,
          recommendedOrderQuantity: product.lowStockThreshold * 2 // Recommended to order double the threshold
        })
      }

      return {
        success: true,
        previousStock,
        newStock
      }

    } catch (error) {
      console.error('Stock update error:', error)
      return {
        success: false,
        error: 'Failed to update stock'
      }
    }
  }

  async bulkUpdateStock(updates: StockUpdateData[]): Promise<{
    success: boolean
    results: Array<{
      productId: string
      success: boolean
      error?: string
    }>
    error?: string
  }> {
    const results = []

    for (const update of updates) {
      const result = await this.updateStock(update)
      results.push({
        productId: update.productId,
        success: result.success,
        error: result.error
      })
    }

    return {
      success: true,
      results
    }
  }

  async getStockMovements(
    productId: string,
    page: number = 1,
    limit: number = 20,
    filters?: {
      operation?: string
      dateFrom?: Date
      dateTo?: Date
    }
  ): Promise<{
    movements: any[]
    total: number
    page: number
    pages: number
  }> {
    const skip = (page - 1) * limit

    const where: any = { productId }

    if (filters?.operation) {
      where.operation = filters.operation.toUpperCase()
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {}
      if (filters.dateFrom) {
        where.createdAt.gte = filters.dateFrom
      }
      if (filters.dateTo) {
        where.createdAt.lte = filters.dateTo
      }
    }

    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }),
      prisma.stockMovement.count({ where })
    ])

    return {
      movements,
      total,
      page,
      pages: Math.ceil(total / limit)
    }
  }

  async getLowStockAlerts(): Promise<LowStockAlert[]> {
    try {
      const products = await prisma.product.findMany({
        where: {
          isPublished: true,
          stockQuantity: {
            lte: prisma.product.fields.lowStockThreshold
          }
        },
        select: {
          id: true,
          name: true,
          stockQuantity: true,
          lowStockThreshold: true
        },
        orderBy: { stockQuantity: 'asc' }
      })

      return products.map(product => ({
        productId: product.id,
        productName: product.name,
        currentStock: product.stockQuantity,
        lowStockThreshold: product.lowStockThreshold,
        recommendedOrderQuantity: product.lowStockThreshold * 2
      }))

    } catch (error) {
      console.error('Low stock alerts error:', error)
      return []
    }
  }

  async getInventoryStats(categoryId?: string): Promise<InventoryStats> {
    try {
      const where = categoryId ? { categoryId } : {}

      const [
        totalProducts,
        inStockProducts,
        outOfStockProducts,
        lowStockProducts,
        valueData,
        categoryData
      ] = await Promise.all([
        prisma.product.count({ where: { ...where, isPublished: true } }),
        prisma.product.count({ 
          where: { ...where, isPublished: true, stockQuantity: { gt: 0 } }
        }),
        prisma.product.count({ 
          where: { ...where, isPublished: true, stockQuantity: { lte: 0 } }
        }),
        prisma.product.count({ 
          where: { 
            ...where, 
            isPublished: true, 
            stockQuantity: { 
              lte: prisma.product.fields.lowStockThreshold 
            } 
          } 
        }),
        prisma.product.aggregate({
          where: { ...where, isPublished: true },
          _sum: { 
            stockQuantity: true,
            price: true 
          }
        }),
        prisma.product.groupBy({
          by: ['category'],
          where: { ...where, isPublished: true },
          _count: { id: true },
          _sum: { price: true }
        })
      ])

      // Get category details
      const categories = await prisma.category.findMany({
        where: categoryId ? { id: categoryId } : {},
        select: {
          id: true,
          name: true
        }
      })

      const categoryMap = categories.reduce((acc, cat) => {
        acc[cat.id] = cat.name
        return acc
      }, {} as Record<string, string>)

      const categoryStats = categoryData.map(cat => ({
        name: categoryMap[cat.category] || 'Unknown',
        productCount: cat._count.id,
        totalValue: Number(cat._sum.price || 0)
      }))

      const totalValue = Number(valueData._sum.stockQuantity || 0) * 
                      Number(valueData._sum.price || 0)

      return {
        totalProducts,
        inStockProducts,
        outOfStockProducts,
        lowStockProducts,
        totalValue,
        categories: categoryStats
      }

    } catch (error) {
      console.error('Inventory stats error:', error)
      return {
        totalProducts: 0,
        inStockProducts: 0,
        outOfStockProducts: 0,
        lowStockProducts: 0,
        totalValue: 0,
        categories: []
      }
    }
  }

  async getReorderSuggestions(): Promise<Array<{
    productId: string
    productName: string
    currentStock: number
    reorderPoint: number
    suggestedOrderQuantity: number
    estimatedCost: number
    supplier?: string
  }>> {
    try {
      const products = await prisma.product.findMany({
        where: {
          isPublished: true,
          stockQuantity: {
            lte: prisma.product.fields.lowStockThreshold
          }
        },
        include: {
          vendor: true
        },
        orderBy: { stockQuantity: 'asc' }
      })

      return products.map(product => {
        const suggestedOrderQuantity = product.lowStockThreshold * 2
        const estimatedCost = suggestedOrderQuantity * Number(product.price)

        return {
          productId: product.id,
          productName: product.name,
          currentStock: product.stockQuantity,
          reorderPoint: product.lowStockThreshold,
          suggestedOrderQuantity,
          estimatedCost,
          supplier: product.vendor?.name || 'Unknown'
        }
      })

    } catch (error) {
      console.error('Reorder suggestions error:', error)
      return []
    }
  }

  async getTopSellingProducts(limit: number = 10): Promise<Array<{
    productId: string
    productName: string
    totalSold: number
    revenue: number
    currentStock: number
    stockStatus: string
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
          price: true,
          stockQuantity: true,
          stockStatus: true
        }
      })

      return products.map(product => ({
        productId: product.id,
        productName: product.name,
        totalSold: product.totalSold,
        revenue: product.totalSold * Number(product.price),
        currentStock: product.stockQuantity,
        stockStatus: product.stockStatus
      }))

    } catch (error) {
      console.error('Top selling products error:', error)
      return []
    }
  }

  async getInventoryValueReport(dateRange?: { from: Date; to: Date }): Promise<{
    totalValue: number
    categories: Array<{
      categoryId: string
      categoryName: string
      productCount: number
      totalValue: number
      averageValue: number
    }>
    }> {
    try {
      const where = dateRange ? {
        updatedAt: {
          gte: dateRange.from,
          lte: dateRange.to
        }
      } : {}

      const products = await prisma.product.findMany({
        where: { ...where, isPublished: true },
        include: {
          category: true
        }
      })

      const categoryMap = new Map()

      let totalValue = 0

      for (const product of products) {
        const productValue = product.stockQuantity * Number(product.price)
        totalValue += productValue

        const categoryId = product.categoryId || 'uncategorized'
        const categoryName = product.category?.name || 'Uncategorized'

        if (!categoryMap.has(categoryId)) {
          categoryMap.set(categoryId, {
            categoryId,
            categoryName,
            productCount: 0,
            totalValue: 0
          })
        }

        const category = categoryMap.get(categoryId)!
        category.productCount++
        category.totalValue += productValue
      }

      const categories = Array.from(categoryMap.values()).map(cat => ({
        ...cat,
        averageValue: cat.productCount > 0 ? cat.totalValue / cat.productCount : 0
      }))

      return {
        totalValue,
        categories
      }

    } catch (error) {
      console.error('Inventory value report error:', error)
      return {
        totalValue: 0,
        categories: []
      }
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

  private async createLowStockAlert(alert: LowStockAlert): Promise<void> {
    try {
      await prisma.lowStockAlert.create({
        data: {
          productId: alert.productId,
          productName: alert.productName,
          currentStock: alert.currentStock,
          lowStockThreshold: alert.lowStockThreshold,
          recommendedOrderQuantity: alert.recommendedOrderQuantity,
          status: 'ACTIVE',
          createdAt: new Date()
        }
      })

      // Here you could also send notification to admin
      // await notificationService.sendLowStockAlert(alert)

    } catch (error) {
      console.error('Low stock alert creation error:', error)
    }
  }

  async clearLowStockAlerts(): Promise<number> {
    try {
      const result = await prisma.lowStockAlert.updateMany({
        where: { status: 'ACTIVE' },
        data: {
          status: 'RESOLVED',
          resolvedAt: new Date()
        }
      })

      return result.count

    } catch (error) {
      console.error('Clear low stock alerts error:', error)
      return 0
    }
  }

  async getStockAdjustmentHistory(
    page: number = 1,
    limit: number = 20,
    filters?: {
      userId?: string
      operation?: string
      dateFrom?: Date
      dateTo?: Date
    }
  ): Promise<{
    adjustments: any[]
    total: number
    page: number
    pages: number
  }> {
    const skip = (page - 1) * limit

    const where: any = {}

    if (filters?.userId) {
      where.userId = filters.userId
    }

    if (filters?.operation) {
      where.operation = filters.operation.toUpperCase()
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {}
      if (filters.dateFrom) {
        where.createdAt.gte = filters.dateFrom
      }
      if (filters.dateTo) {
        where.createdAt.lte = filters.dateTo
      }
    }

    const [adjustments, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          product: {
            select: {
              id: true,
              name: true,
              sku: true
            }
          }
        }
      }),
      prisma.stockMovement.count({ where })
    ])

    return {
      adjustments,
      total,
      page,
      pages: Math.ceil(total / limit)
    }
  }
}

export const inventoryService = new InventoryService()
export default inventoryService
