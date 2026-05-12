import { prisma } from '../database'

export interface IWishlistItem {
  id: string
  wishlistId: string
  productId: string
  variantId?: string
  quantity: number
  notes?: string
  createdAt: Date
  product?: {
    id: string
    name: string
    slug: string
    price: number | string
    isPublished: boolean
    productImages?: {
      id: string
      url: string
      alt?: string
      sortOrder: number
      isPrimary: boolean
    }[]
  }
  variant?: {
    id: string
    name: string
    sku: string
    price: number | string
    stockQuantity: number
  }
  wishlist?: {
    id: string
    userId: string
    name: string
    isPublic: boolean
    shareToken?: string
    createdAt: Date
    updatedAt: Date
  }
}

export const WishlistModel = {
  findById: async (id: string): Promise<IWishlistItem | null> => {
    const item = await prisma.wishlistItem.findUnique({
      where: { id },
      include: {
        product: {
          include: {
            productImages: true
          }
        },
        variant: true,
        wishlist: {
          include: {
            user: true
          }
        }
      }
    })
    if (!item) return null
    
    return {
      ...item,
      product: item.product ? {
        ...item.product,
        price: Number(item.product.price)
      } : undefined,
      variant: item.variant ? {
        ...item.variant,
        price: item.variant.price ? Number(item.variant.price) : undefined
      } : undefined
    }
  },

  findByUserId: async (userId: string): Promise<IWishlistItem[]> => {
    const wishlist = await prisma.wishlist.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                productImages: true
              }
            },
            variant: true
          }
        }
      }
    })
    
    if (!wishlist || !wishlist.items) return []
    
    return wishlist.items.map(item => ({
      ...item,
      product: item.product ? {
        ...item.product,
        price: Number(item.product.price)
      } : undefined,
      variant: item.variant ? {
        ...item.variant,
        price: item.variant.price ? Number(item.variant.price) : undefined
      } : undefined
    }))
  },

  create: async (wishlistData: Omit<IWishlistItem, 'id' | 'createdAt'>): Promise<IWishlistItem> => {
    const item = await prisma.wishlistItem.create({
      data: {
        wishlistId: wishlistData.wishlistId,
        productId: wishlistData.productId,
        variantId: wishlistData.variantId,
        quantity: wishlistData.quantity || 1,
        notes: wishlistData.notes
      },
      include: {
        product: {
          include: {
            productImages: true
          }
        },
        variant: true,
        wishlist: {
          include: {
            user: true
          }
        }
      }
    })
    
    return {
      ...item,
      product: item.product ? {
        ...item.product,
        price: Number(item.product.price)
      } : undefined,
      variant: item.variant ? {
        ...item.variant,
        price: item.variant.price ? Number(item.variant.price) : undefined
      } : undefined
    }
  },

  delete: async (id: string): Promise<void> => {
    await prisma.wishlistItem.delete({
      where: { id }
    })
  },

  deleteByUserProduct: async (userId: string, productId: string): Promise<void> => {
    // First find the user's wishlist
    const wishlist = await prisma.wishlist.findUnique({
      where: { userId }
    })
    
    if (wishlist) {
      // Delete specific product from the wishlist
      await prisma.wishlistItem.deleteMany({
        where: {
          wishlistId: wishlist.id,
          productId
        }
      })
    }
  }
}
