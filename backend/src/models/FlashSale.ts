import { prisma } from '../database'
import { Decimal } from '@prisma/client/runtime/library'

export interface IFlashSale {
  id: string
  name: string
  slug: string
  description?: string | null
  bannerImage?: string | null
  discountType: string
  discountValue: Decimal | string | number
  startTime: Date
  endTime: Date
  stockLimit?: number | null
  perUserLimit: number
  status: string
  createdBy?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface IFlashSaleProduct {
  id: string
  flashSaleId: string
  productId: string
  variantId?: string | null
  salePrice: Decimal | string | number
  originalPrice: Decimal | string | number
  stockAllocated: number
  stockSold: number
  product?: any
  variant?: any
}

export interface IFlashSalePurchase {
  id: string
  flashSaleId: string
  productId: string
  userId: string
  orderId: string
  quantity: number
  pricePaid: Decimal | string | number
  purchasedAt: Date
  flashSale?: any
  order?: any
  product?: any
  user?: any
}

export const FlashSaleModel = {
  findById: async (id: string): Promise<IFlashSale | null> => {
    const flashSale = await prisma.flashSale.findUnique({
      where: { id },
      include: {
        products: {
          include: {
            product: {
              include: {
                productImages: {
                  where: { isPrimary: true },
                  take: 1
                }
              }
            },
            variant: true
          }
        }
      }
    })
    return flashSale
  },

  findBySlug: async (slug: string): Promise<IFlashSale | null> => {
    const flashSale = await prisma.flashSale.findUnique({
      where: { slug },
      include: {
        products: {
          include: {
            product: {
              include: {
                productImages: {
                  where: { isPrimary: true },
                  take: 1
                }
              }
            },
            variant: true
          }
        }
      }
    })
    return flashSale
  },

  findAll: async (params: {
    page?: number
    limit?: number
    status?: string
  } = {}): Promise<{ flashSales: IFlashSale[]; total: number }> => {
    const { page = 1, limit = 20, status } = params
    const skip = (page - 1) * limit

    const where: any = {}
    if (status) where.status = status

    const [flashSales, total] = await Promise.all([
      prisma.flashSale.findMany({
        where,
        include: {
          products: {
            include: {
              product: {
                include: {
                  productImages: {
                    where: { isPrimary: true },
                    take: 1
                  }
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.flashSale.count({ where })
    ])

    return { flashSales, total }
  },

  getActiveFlashSales: async (): Promise<IFlashSale[]> => {
    const now = new Date()
    const flashSales = await prisma.flashSale.findMany({
      where: {
        status: { not: 'archived' },
        startTime: { lte: now },
        endTime: { gte: now }
      },
      include: {
        products: {
          include: {
            product: {
              include: {
                productImages: {
                  where: { isPrimary: true },
                  take: 1
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    return flashSales
  },

  create: async (data: Omit<IFlashSale, 'id' | 'createdAt' | 'updatedAt'>): Promise<IFlashSale> => {
    const flashSale = await prisma.flashSale.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        bannerImage: data.bannerImage,
        discountType: data.discountType,
        discountValue: new Decimal(String(data.discountValue)),
        startTime: data.startTime,
        endTime: data.endTime,
        stockLimit: data.stockLimit,
        perUserLimit: data.perUserLimit,
        status: data.status,
        createdBy: data.createdBy
      },
      include: {
        products: true
      }
    })
    return flashSale
  },

  update: async (id: string, data: Partial<Omit<IFlashSale, 'id' | 'createdAt' | 'updatedAt'>>): Promise<IFlashSale> => {
    const updateData: any = {}
    
    if (data.name) updateData.name = data.name
    if (data.slug) updateData.slug = data.slug
    if (data.description !== undefined) updateData.description = data.description
    if (data.bannerImage !== undefined) updateData.bannerImage = data.bannerImage
    if (data.discountType) updateData.discountType = data.discountType
    if (data.discountValue !== undefined) updateData.discountValue = new Decimal(String(data.discountValue))
    if (data.startTime) updateData.startTime = data.startTime
    if (data.endTime) updateData.endTime = data.endTime
    if (data.stockLimit !== undefined) updateData.stockLimit = data.stockLimit
    if (data.perUserLimit) updateData.perUserLimit = data.perUserLimit
    if (data.status) updateData.status = data.status

    const flashSale = await prisma.flashSale.update({
      where: { id },
      data: updateData,
      include: {
        products: true
      }
    })
    return flashSale
  },

  delete: async (id: string): Promise<void> => {
    await prisma.flashSale.update({
      where: { id },
      data: { status: 'archived' }
    })
  },

  addProduct: async (flashSaleId: string, productId: string, variantId: string | null, salePrice: number | string, originalPrice: number | string, stockAllocated: number): Promise<IFlashSaleProduct> => {
    const flashSaleProduct = await prisma.flashSaleProduct.create({
      data: {
        flashSaleId,
        productId,
        variantId,
        salePrice: new Decimal(String(salePrice)),
        originalPrice: new Decimal(String(originalPrice)),
        stockAllocated
      },
      include: {
        product: {
          include: {
            productImages: {
              where: { isPrimary: true },
              take: 1
            }
          }
        },
        variant: true
      }
    })
    return flashSaleProduct
  },

  removeProduct: async (id: string): Promise<void> => {
    await prisma.flashSaleProduct.delete({
      where: { id }
    })
  },

  recordPurchase: async (data: Omit<IFlashSalePurchase, 'id' | 'purchasedAt' | 'flashSale' | 'order' | 'product' | 'user'>): Promise<IFlashSalePurchase> => {
    const purchase = await prisma.flashSalePurchase.create({
      data: {
        flashSaleId: data.flashSaleId,
        productId: data.productId,
        userId: data.userId,
        orderId: data.orderId,
        quantity: data.quantity,
        pricePaid: new Decimal(String(data.pricePaid))
      },
      include: {
        flashSale: true,
        order: true,
        product: true,
        user: {
          include: {
            profile: true
          }
        }
      }
    })

    // Update stock sold count
    await prisma.flashSaleProduct.updateMany({
      where: { 
        flashSaleId: data.flashSaleId,
        productId: data.productId
      },
      data: {
        stockSold: { increment: data.quantity }
      }
    })

    return purchase
  },

  getFlashSaleStats: async (flashSaleId: string): Promise<any> => {
    const [totalPurchases, totalRevenue, topProducts] = await Promise.all([
      prisma.flashSalePurchase.count({
        where: { flashSaleId }
      }),
      prisma.flashSalePurchase.aggregate({
        where: { flashSaleId },
        _sum: { pricePaid: true }
      }),
      prisma.flashSalePurchase.groupBy({
        by: ['productId'],
        where: { flashSaleId },
        _count: { productId: true },
        _sum: { pricePaid: true },
        orderBy: { _sum: { pricePaid: 'desc' } },
        take: 5
      })
    ])

    return {
      totalPurchases,
      totalRevenue: totalRevenue._sum.pricePaid || 0,
      topProducts
    }
  }
}
