// @ts-nocheck
import { prisma } from '../database'
import { paymentService } from './paymentService'
import { emailService } from './emailService'
import { inventoryService } from './inventoryService'

export interface OrderItem {
  productId: string
  quantity: number
  price: number
  weight: number
  unit: 'kg' | 'g' | 'lbs'
}

export interface CreateOrderData {
  userId: string
  items: OrderItem[]
  deliveryAddress: {
    street: string
    city: string
    state: string
    zipCode: string
    country?: string
    coordinates?: {
      lat: number
      lng: number
    }
  }
  paymentMethod: 'mpesa' | 'card' | 'cash'
  deliveryOption: 'standard' | 'express'
  specialInstructions?: string
  orderNotes?: string
  couponCode?: string
}

export interface OrderUpdateData {
  status?: string
  paymentStatus?: string
  trackingNumber?: string
  courier?: string
  estimatedDelivery?: string
  actualDelivery?: string
  notes?: string
}

class OrderService {
  async createOrder(orderData: CreateOrderData): Promise<{
    success: boolean
    order?: any
    error?: string
  }> {
    try {
      // Validate stock availability
      const stockCheck = await this.validateStockAvailability(orderData.items)
      if (!stockCheck.available) {
        return {
          success: false,
          error: `Insufficient stock for: ${stockCheck.unavailableItems.join(', ')}`
        }
      }

      // Calculate totals
      const { subtotal, deliveryFee, tax, total, discount } = await this.calculateOrderTotals(orderData)

      // Generate order number
      const orderNumber = this.generateOrderNumber()

      // Create order
      const order = await prisma.order.create({
        data: {
          orderNumber,
          userId: orderData.userId,
          totalAmount: total,
          subtotal,
          deliveryFee,
          tax,
          discount,
          status: 'PENDING',
          paymentStatus: 'PENDING',
          paymentMethod: orderData.paymentMethod,
          deliveryAddress: orderData.deliveryAddress as any,
          deliveryOption: orderData.deliveryOption,
          specialInstructions: orderData.specialInstructions,
          orderNotes: orderData.orderNotes,
          estimatedDeliveryTime: this.calculateEstimatedDelivery(orderData.deliveryOption),
          orderItems: {
            create: await Promise.all(orderData.items.map(async (item) => {
              const product = await prisma.product.findUnique({
                where: { id: item.productId }
              })

              return {
                productId: item.productId,
                quantity: item.quantity,
                price: item.price,
                weight: item.weight,
                unit: item.unit,
                subtotal: item.price * item.quantity
              }
            }))
          }
        },
        include: {
          orderItems: {
            include: {
              product: true
            }
          },
          user: true
        }
      })

      // Update stock
      await this.updateStockAfterOrder(orderData.items, 'decrease')

      // Process payment
      const paymentResult = await paymentService.createPayment({
        orderId: order.id,
        userId: orderData.userId,
        amount: total,
        currency: 'KES',
        paymentMethod: orderData.paymentMethod,
        paymentDetails: {}
      })

      if (!paymentResult.success) {
        // Rollback stock if payment fails
        await this.updateStockAfterOrder(orderData.items, 'increase')
        
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: 'CANCELLED',
            paymentStatus: 'FAILED'
          }
        })

        return {
          success: false,
          error: paymentResult.message
        }
      }

      // Send confirmation email
      await emailService.sendOrderConfirmationEmail(order.user.email, {
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        estimatedDelivery: order.estimatedDeliveryTime
      })

      return {
        success: true,
        order
      }

    } catch (error) {
      console.error('Order creation error:', error)
      return {
        success: false,
        error: 'Failed to create order'
      }
    }
  }

  async updateOrder(orderId: string, updateData: OrderUpdateData): Promise<{
    success: boolean
    order?: any
    error?: string
  }> {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          orderItems: true,
          user: true
        }
      })

      if (!order) {
        return {
          success: false,
          error: 'Order not found'
        }
      }

      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: updateData,
        include: {
          orderItems: {
            include: {
              product: true
            }
          },
          user: true
        }
      })

      // Send status update email if status changed
      if (updateData.status && updateData.status !== order.status) {
        await this.sendStatusUpdateEmail(updatedOrder, updateData.status)
      }

      return {
        success: true,
        order: updatedOrder
      }

    } catch (error) {
      console.error('Order update error:', error)
      return {
        success: false,
        error: 'Failed to update order'
      }
    }
  }

  async cancelOrder(orderId: string, reason: string, userId: string): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          orderItems: true
        }
      })

      if (!order) {
        return {
          success: false,
          error: 'Order not found'
        }
      }

      if (order.userId !== userId) {
        return {
          success: false,
          error: 'Unauthorized to cancel this order'
        }
      }

      if (order.status === 'DELIVERED') {
        return {
          success: false,
          error: 'Cannot cancel delivered order'
        }
      }

      if (order.status === 'CANCELLED') {
        return {
          success: false,
          error: 'Order already cancelled'
        }
      }

      // Update order status
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'CANCELLED',
          cancellationReason: reason,
          cancelledAt: new Date()
        }
      })

      // Restore stock
      await this.updateStockAfterOrder(order.orderItems as any, 'increase')

      // Process refund if payment was made
      if (order.paymentStatus === 'PAID') {
        const payment = await prisma.payment.findFirst({
          where: { orderId }
        })

        if (payment) {
          await paymentService.processRefund({
            paymentId: payment.id,
            reason: `Order cancelled: ${reason}`,
            processedBy: 'system'
          })
        }
      }

      return {
        success: true
      }

    } catch (error) {
      console.error('Order cancellation error:', error)
      return {
        success: false,
        error: 'Failed to cancel order'
      }
    }
  }

  async getUserOrders(
    userId: string,
    page: number = 1,
    limit: number = 20,
    filters?: {
      status?: string
      dateFrom?: Date
      dateTo?: Date
    }
  ): Promise<{
    orders: any[]
    total: number
    page: number
    pages: number
  }> {
    const skip = (page - 1) * limit

    const where: any = { userId }

    if (filters?.status) {
      where.status = filters.status
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

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          orderItems: {
            include: {
              product: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.order.count({ where })
    ])

    return {
      orders,
      total,
      page,
      pages: Math.ceil(total / limit)
    }
  }

  async getOrderDetails(orderId: string, userId?: string): Promise<{
    order?: any
    error?: string
  }> {
    try {
      const where: any = { id: orderId }
      if (userId) {
        where.userId = userId
      }

      const order = await prisma.order.findUnique({
        where,
        include: {
          orderItems: {
            include: {
              product: true
            }
          },
          user: true,
          payment: true,
          delivery: true
        }
      })

      if (!order) {
        return {
          error: 'Order not found'
        }
      }

      return {
        order
      }

    } catch (error) {
      console.error('Order details error:', error)
      return {
        error: 'Failed to get order details'
      }
    }
  }

  async getAllOrders(
    page: number = 1,
    limit: number = 20,
    filters?: {
      status?: string
      paymentStatus?: string
      dateFrom?: Date
      dateTo?: Date
      userId?: string
    }
  ): Promise<{
    orders: any[]
    total: number
    page: number
    pages: number
  }> {
    const skip = (page - 1) * limit

    const where: any = {}

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.paymentStatus) {
      where.paymentStatus = filters.paymentStatus
    }

    if (filters?.userId) {
      where.userId = filters.userId
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

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          orderItems: {
            include: {
              product: true
            }
          },
          user: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.order.count({ where })
    ])

    return {
      orders,
      total,
      page,
      pages: Math.ceil(total / limit)
    }
  }

  private async validateStockAvailability(items: OrderItem[]): Promise<{
    available: boolean
    unavailableItems: string[]
  }> {
    const unavailableItems: string[] = []

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId }
      })

      if (!product) {
        unavailableItems.push(`Product ${item.productId} not found`)
        continue
      }

      if (product.stockQuantity < item.quantity) {
        unavailableItems.push(`${product.name} (requested: ${item.quantity}, available: ${product.stockQuantity})`)
      }
    }

    return {
      available: unavailableItems.length === 0,
      unavailableItems
    }
  }

  private async calculateOrderTotals(orderData: CreateOrderData): Promise<{
    subtotal: number
    deliveryFee: number
    tax: number
    discount: number
    total: number
  }> {
    let subtotal = 0

    for (const item of orderData.items) {
      subtotal += item.price * item.quantity
    }

    // Apply coupon discount if provided
    let discount = 0
    if (orderData.couponCode) {
      discount = await this.applyCoupon(orderData.couponCode, subtotal)
    }

    const discountedSubtotal = subtotal - discount

    // Calculate delivery fee
    const deliveryFee = orderData.deliveryOption === 'express' ? 300 : 150
    const freeDeliveryThreshold = 2000

    const finalDeliveryFee = discountedSubtotal >= freeDeliveryThreshold ? 0 : deliveryFee

    // Calculate tax (16% VAT in Kenya)
    const tax = Math.round((discountedSubtotal + finalDeliveryFee) * 0.16)

    const total = discountedSubtotal + finalDeliveryFee + tax

    return {
      subtotal,
      deliveryFee: finalDeliveryFee,
      tax,
      discount,
      total
    }
  }

  private async applyCoupon(couponCode: string, subtotal: number): Promise<number> {
    try {
      const coupon = await prisma.coupon.findUnique({
        where: { 
          code: couponCode.toUpperCase(),
          isActive: true,
          startDate: { lte: new Date() },
          endDate: { gte: new Date() }
        }
      })

      if (!coupon) {
        return 0
      }

      if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
        return 0
      }

      let discount = 0
      if (coupon.discountType === 'PERCENTAGE') {
        discount = Math.round(subtotal * (coupon.discountValue / 100))
        if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
          discount = coupon.maxDiscountAmount
        }
      } else {
        discount = coupon.discountValue
      }

      return Math.min(discount, subtotal)

    } catch (error) {
      console.error('Coupon application error:', error)
      return 0
    }
  }

  private generateOrderNumber(): string {
    const timestamp = Date.now().toString().slice(-6)
    const random = Math.random().toString(36).substr(2, 4).toUpperCase()
    return `HMT${timestamp}${random}`
  }

  private calculateEstimatedDelivery(deliveryOption: 'standard' | 'express'): string {
    const now = new Date()
    
    if (deliveryOption === 'express') {
      // Express delivery: 1-2 business days
      const deliveryDate = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)
      return deliveryDate.toISOString().split('T')[0]
    } else {
      // Standard delivery: 2-3 business days
      const deliveryDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
      return deliveryDate.toISOString().split('T')[0]
    }
  }

  private async updateStockAfterOrder(items: any[], operation: 'increase' | 'decrease'): Promise<void> {
    for (const item of items) {
      const quantityChange = operation === 'increase' ? item.quantity : -item.quantity
      
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stockQuantity: {
            increment: quantityChange
          }
        }
      })
    }
  }

  private async sendStatusUpdateEmail(order: any, newStatus: string): Promise<void> {
    try {
      const statusMessages = {
        'CONFIRMED': 'Your order has been confirmed and is being prepared',
        'PREPARING': 'Your order is being prepared with care',
        'READY': 'Your order is ready for delivery',
        'OUT_FOR_DELIVERY': 'Your order is out for delivery',
        'DELIVERED': 'Your order has been delivered successfully',
        'CANCELLED': 'Your order has been cancelled'
      }

      const message = statusMessages[newStatus as keyof typeof statusMessages]
      if (message) {
        await emailService.sendEmail({
          to: order.user.email,
          subject: `Order ${order.orderNumber} Status Update`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #e74c3c; color: white; padding: 20px; text-align: center;">
                <h1>Order Status Update</h1>
              </div>
              <div style="padding: 20px; background: #f9f9f9;">
                <p>Order Number: <strong>${order.orderNumber}</strong></p>
                <p>Status: <strong>${newStatus}</strong></p>
                <p>${message}</p>
                <a href="${process.env.FRONTEND_URL}/order-tracking/${order.id}" 
                   style="background: #e74c3c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                  Track Your Order
                </a>
              </div>
            </div>
          `
        })
      }
    } catch (error) {
      console.error('Status update email error:', error)
    }
  }

  async getOrderStats(dateRange?: { from: Date; to: Date }): Promise<{
    totalOrders: number
    totalRevenue: number
    averageOrderValue: number
    ordersByStatus: Record<string, number>
    ordersByPaymentMethod: Record<string, number>
  }> {
    const where = dateRange ? {
      createdAt: {
        gte: dateRange.from,
        lte: dateRange.to
      }
    } : {}

    const [
      totalOrders,
      revenueData,
      statusData,
      paymentData
    ] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.aggregate({
        where: { ...where, paymentStatus: 'PAID' },
        _sum: { totalAmount: true }
      }),
      prisma.order.groupBy({
        by: ['status'],
        where,
        _count: { id: true }
      }),
      prisma.order.groupBy({
        by: ['paymentMethod'],
        where,
        _count: { id: true }
      })
    ])

    const totalRevenue = revenueData._sum.totalAmount || 0
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    const ordersByStatus = statusData.reduce((acc, item) => {
      acc[item.status] = item._count.id
      return acc
    }, {} as Record<string, number>)

    const ordersByPaymentMethod = paymentData.reduce((acc, item) => {
      acc[item.paymentMethod] = item._count.id
      return acc
    }, {} as Record<string, number>)

    return {
      totalOrders,
      totalRevenue: Number(totalRevenue),
      averageOrderValue,
      ordersByStatus,
      ordersByPaymentMethod
    }
  }
}

export const orderService = new OrderService()
export default orderService
