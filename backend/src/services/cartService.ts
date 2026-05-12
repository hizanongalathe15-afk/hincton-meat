// @ts-nocheck
import { prisma } from '../database'

export interface CartItem {
  productId: string
  quantity: number
  variantId?: string
  addedAt: Date
}

export interface CartData {
  items: CartItem[]
  subtotal: number
  tax: number
  deliveryFee: number
  total: number
  itemCount: number
}

export interface AddToCartData {
  productId: string
  quantity: number
  variantId?: string
  userId?: string
  guestSessionId?: string
}

export interface UpdateCartData {
  itemId: string
  quantity: number
  userId?: string
  guestSessionId?: string
}

class CartService {
  async getCart(userId?: string, guestSessionId?: string): Promise<CartData> {
    try {
      const where = userId 
        ? { userId, isActive: true }
        : { guestSessionId, isActive: true }

      const cartItems = await prisma.cartItem.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              images: true,
              stockQuantity: true,
              isPublished: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      // Filter out unavailable products
      const availableItems = cartItems.filter(item => 
        item.product.isPublished && item.product.stockQuantity > 0
      )

      let subtotal = 0
      let itemCount = 0

      for (const item of availableItems) {
        const itemTotal = Number(item.product.price) * item.quantity
        subtotal += itemTotal
        itemCount += item.quantity
      }

      // Calculate tax (16% VAT in Kenya)
      const tax = Math.round(subtotal * 0.16)
      
      // Calculate delivery fee
      const deliveryFee = subtotal >= 2000 ? 0 : 150
      const total = subtotal + tax + deliveryFee

      return {
        items: availableItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          variantId: item.variantId || undefined,
          addedAt: item.createdAt
        })),
        subtotal,
        tax,
        deliveryFee,
        total,
        itemCount
      }

    } catch (error) {
      console.error('Get cart error:', error)
      return {
        items: [],
        subtotal: 0,
        tax: 0,
        deliveryFee: 0,
        total: 0,
        itemCount: 0
      }
    }
  }

  async addToCart(data: AddToCartData): Promise<{
    success: boolean
    cart?: CartData
    error?: string
  }> {
    try {
      // Check if product exists and is available
      const product = await prisma.product.findUnique({
        where: { id: data.productId }
      })

      if (!product) {
        return {
          success: false,
          error: 'Product not found'
        }
      }

      if (!product.isPublished) {
        return {
          success: false,
          error: 'Product is not available'
        }
      }

      if (product.stockQuantity < data.quantity) {
        return {
          success: false,
          error: `Insufficient stock. Only ${product.stockQuantity} available`
        }
      }

      // Get or create cart
      const where = data.userId 
        ? { userId, isActive: true }
        : { guestSessionId: data.guestSessionId, isActive: true }

      let cart = await prisma.cart.findFirst({ where })

      if (!cart) {
        cart = await prisma.cart.create({
          data: {
            userId: data.userId || null,
            guestSessionId: data.guestSessionId || null,
            isActive: true
          }
        })
      }

      // Check if item already exists in cart
      const existingItem = await prisma.cartItem.findFirst({
        where: {
          cartId: cart.id,
          productId: data.productId,
          variantId: data.variantId || null
        }
      })

      if (existingItem) {
        // Update quantity
        const newQuantity = existingItem.quantity + data.quantity
        
        if (product.stockQuantity < newQuantity) {
          return {
            success: false,
            error: `Insufficient stock. Only ${product.stockQuantity} available`
          }
        }

        await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: newQuantity }
        })
      } else {
        // Add new item
        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId: data.productId,
            variantId: data.variantId || null,
            quantity: data.quantity,
            price: product.price
          }
        })
      }

      // Get updated cart
      const updatedCart = await this.getCart(data.userId, data.guestSessionId)

      return {
        success: true,
        cart: updatedCart
      }

    } catch (error) {
      console.error('Add to cart error:', error)
      return {
        success: false,
        error: 'Failed to add item to cart'
      }
    }
  }

  async updateCartItem(data: UpdateCartData): Promise<{
    success: boolean
    cart?: CartData
    error?: string
  }> {
    try {
      const cartItem = await prisma.cartItem.findFirst({
        where: {
          id: data.itemId,
          cart: {
            isActive: true,
            ...(data.userId && { userId: data.userId }),
            ...(data.guestSessionId && { guestSessionId: data.guestSessionId })
          }
        },
        include: {
          product: true
        }
      })

      if (!cartItem) {
        return {
          success: false,
          error: 'Cart item not found'
        }
      }

      // Check stock availability
      if (cartItem.product.stockQuantity < data.quantity) {
        return {
          success: false,
          error: `Insufficient stock. Only ${cartItem.product.stockQuantity} available`
        }
      }

      // Update quantity
      await prisma.cartItem.update({
        where: { id: data.itemId },
        data: { quantity: data.quantity }
      })

      // Get updated cart
      const where = data.userId 
        ? { userId: data.userId, isActive: true }
        : { guestSessionId: data.guestSessionId, isActive: true }

      const updatedCart = await this.getCart(data.userId, data.guestSessionId)

      return {
        success: true,
        cart: updatedCart
      }

    } catch (error) {
      console.error('Update cart item error:', error)
      return {
        success: false,
        error: 'Failed to update cart item'
      }
    }
  }

  async removeFromCart(itemId: string, userId?: string, guestSessionId?: string): Promise<{
    success: boolean
    cart?: CartData
    error?: string
  }> {
    try {
      const cartItem = await prisma.cartItem.findFirst({
        where: {
          id: itemId,
          cart: {
            isActive: true,
            ...(userId && { userId }),
            ...(guestSessionId && { guestSessionId })
          }
        }
      })

      if (!cartItem) {
        return {
          success: false,
          error: 'Cart item not found'
        }
      }

      // Remove item
      await prisma.cartItem.delete({
        where: { id: itemId }
      })

      // Get updated cart
      const where = userId 
        ? { userId, isActive: true }
        : { guestSessionId, isActive: true }

      const updatedCart = await this.getCart(userId, guestSessionId)

      return {
        success: true,
        cart: updatedCart
      }

    } catch (error) {
      console.error('Remove from cart error:', error)
      return {
        success: false,
        error: 'Failed to remove item from cart'
      }
    }
  }

  async clearCart(userId?: string, guestSessionId?: string): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const where = userId 
        ? { userId, isActive: true }
        : { guestSessionId, isActive: true }

      // Deactivate cart (keep for order history)
      await prisma.cart.updateMany({
        where,
        data: { isActive: false }
      })

      return {
        success: true
      }

    } catch (error) {
      console.error('Clear cart error:', error)
      return {
        success: false,
        error: 'Failed to clear cart'
      }
    }
  }

  async mergeCart(fromGuestSessionId: string, toUserId: string): Promise<{
    success: boolean
    cart?: CartData
    error?: string
  }> {
    try {
      // Get guest cart
      const guestCart = await this.getCart(undefined, fromGuestSessionId)
      
      if (guestCart.items.length === 0) {
        return {
          success: true,
          cart: await this.getCart(toUserId)
        }
      }

      // Get or create user cart
      let userCart = await this.getCart(toUserId)
      
      // Add all guest cart items to user cart
      for (const guestItem of guestCart.items) {
        await this.addToCart({
          productId: guestItem.productId,
          quantity: guestItem.quantity,
          variantId: guestItem.variantId,
          userId: toUserId
        })
      }

      // Clear guest cart
      await this.clearCart(undefined, fromGuestSessionId)

      // Get final merged cart
      userCart = await this.getCart(toUserId)

      return {
        success: true,
        cart: userCart
      }

    } catch (error) {
      console.error('Merge cart error:', error)
      return {
        success: false,
        error: 'Failed to merge carts'
      }
    }
  }

  async getCartSummary(userId?: string, guestSessionId?: string): Promise<{
    itemCount: number
    subtotal: number
    tax: number
    deliveryFee: number
    total: number
    savings: number
  }> {
    try {
      const cart = await this.getCart(userId, guestSessionId)
      
      // Calculate potential savings (compare with original prices)
      let savings = 0
      
      for (const item of cart.items) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { comparePrice: true }
        })
        
        if (product?.comparePrice) {
          const originalTotal = Number(product.comparePrice) * item.quantity
          const currentTotal = Number(product.price) * item.quantity
          savings += Math.max(0, originalTotal - currentTotal)
        }
      }

      return {
        itemCount: cart.itemCount,
        subtotal: cart.subtotal,
        tax: cart.tax,
        deliveryFee: cart.deliveryFee,
        total: cart.total,
        savings
      }

    } catch (error) {
      console.error('Cart summary error:', error)
      return {
        itemCount: 0,
        subtotal: 0,
        tax: 0,
        deliveryFee: 0,
        total: 0,
        savings: 0
      }
    }
  }

  async validateCart(userId?: string, guestSessionId?: string): Promise<{
    isValid: boolean
    invalidItems: Array<{
      itemId: string
      productId: string
      productName: string
      issue: string
    }>
  }> {
    try {
      const cart = await this.getCart(userId, guestSessionId)
      const invalidItems = []

      for (const item of cart.items) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId }
        })

        if (!product) {
          invalidItems.push({
            itemId: item.productId,
            productId: item.productId,
            productName: 'Unknown Product',
            issue: 'Product no longer exists'
          })
          continue
        }

        if (!product.isPublished) {
          invalidItems.push({
            itemId: item.productId,
            productId: item.productId,
            productName: product.name,
            issue: 'Product is no longer available'
          })
          continue
        }

        if (product.stockQuantity < item.quantity) {
          invalidItems.push({
            itemId: item.productId,
            productId: item.productId,
            productName: product.name,
            issue: `Insufficient stock. Only ${product.stockQuantity} available`
          })
          continue
        }
      }

      return {
        isValid: invalidItems.length === 0,
        invalidItems
      }

    } catch (error) {
      console.error('Cart validation error:', error)
      return {
        isValid: false,
        invalidItems: []
      }
    }
  }

  async getAbandonedCarts(hoursOld: number = 24): Promise<Array<{
    id: string
    userId?: string
    guestSessionId?: string
    itemCount: number
    total: number
    lastActivity: Date
    abandonedAt: Date
  }>> {
    try {
      const cutoffTime = new Date(Date.now() - hoursOld * 60 * 60 * 1000)

      const abandonedCarts = await prisma.cart.findMany({
        where: {
          isActive: true,
          updatedAt: {
            lt: cutoffTime
          }
        },
        include: {
          cartItems: {
            select: {
              quantity: true
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { updatedAt: 'desc' }
      })

      return abandonedCarts.map(cart => {
        const itemCount = cart.cartItems.reduce((sum, item) => sum + item.quantity, 0)
        
        return {
          id: cart.id,
          userId: cart.userId || undefined,
          guestSessionId: cart.guestSessionId || undefined,
          itemCount,
          total: 0, // Would need to calculate from product prices
          lastActivity: cart.updatedAt,
          abandonedAt: cutoffTime
        }
      })

    } catch (error) {
      console.error('Abandoned carts error:', error)
      return []
    }
  }

  async recoverCart(cartId: string, userId?: string): Promise<{
    success: boolean
    cart?: CartData
    error?: string
  }> {
    try {
      const cart = await prisma.cart.findFirst({
        where: {
          id: cartId,
          isActive: false,
          ...(userId && { userId })
        }
      })

      if (!cart) {
        return {
          success: false,
          error: 'Cart not found'
        }
      }

      // Reactivate cart
      await prisma.cart.update({
        where: { id: cartId },
        data: { isActive: true }
      })

      const recoveredCart = await this.getCart(userId)

      return {
        success: true,
        cart: recoveredCart
      }

    } catch (error) {
      console.error('Cart recovery error:', error)
      return {
        success: false,
        error: 'Failed to recover cart'
      }
    }
  }
}

export const cartService = new CartService()
export default cartService
