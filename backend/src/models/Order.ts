import { prisma } from '../database'
import { OrderStatus, PaymentStatus, DeliveryStatus, VerificationMethod, Currency } from '@prisma/client'

export interface IOrder {
  id: string
  orderNumber: string
  userId?: string
  guestEmail?: string
  guestPhone?: string
  guestSessionId?: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  deliveryStatus: DeliveryStatus
  subtotal: number | string
  shippingCost: number | string
  taxAmount: number | string
  discountAmount: number | string
  totalAmount: number | string
  currency: Currency
  couponCode?: string
  couponDiscount: number | string
  shippingAddress: any
  billingAddress?: any
  shippingMethod?: string
  trackingNumber?: string
  courier?: string
  trackingUrl?: string
  pickupStationId?: string
  pickupCode?: string
  pickupCodeExpiresAt?: Date
  qrSecret?: string
  qrSecretExpiresAt?: Date
  verificationMethod: VerificationMethod
  idVerified: boolean
  idLast4?: string
  pickedAt?: Date
  pickedByAgentId?: string
  verificationAttempts: number
  failedVerificationAttempts: number
  lockedUntil?: Date
  estimatedDelivery?: Date
  deliveredAt?: Date
  notes?: string
  adminNotes?: string
  ipAddress?: string
  userAgent?: string
  createdAt: Date
  updatedAt: Date
  cancelledAt?: Date
  refundedAt?: Date
  deletedAt?: Date
  orderItems?: {
    id: string
    orderId: string
    productId?: string
    variantId?: string
    productName: string
    productImage?: string
    sku?: string
    quantity: number
    unitPrice: number | string
    totalPrice: number | string
    discount: number | string
    taxAmount: number | string
    isDigital: boolean
    downloadUrl?: string
    createdAt: Date
  }[]
  user?: {
    id: string
    email: string
    profile?: {
      fullName?: string
    }
  }
  payments?: {
    id: string
    amount: number | string
    paymentMethod: string
    paymentReference?: string
    status: PaymentStatus
    createdAt: Date
  }[]
}

export const OrderModel = {
  findById: async (id: string): Promise<IOrder | null> => {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: true,
        user: {
          include: {
            profile: true
          }
        },
        payments: true
      }
    })
    if (!order) return null
    
    return {
      ...order,
      subtotal: Number(order.subtotal),
      shippingCost: Number(order.shippingCost),
      taxAmount: Number(order.taxAmount),
      discountAmount: Number(order.discountAmount),
      totalAmount: Number(order.totalAmount),
      couponDiscount: Number(order.couponDiscount),
      orderItems: order.orderItems.map(item => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
        discount: Number(item.discount),
        taxAmount: Number(item.taxAmount)
      })),
      payments: order.payments.map(payment => ({
        ...payment,
        amount: Number(payment.amount)
      }))
    }
  },

  findByUserId: async (userId: string): Promise<IOrder[]> => {
    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        orderItems: true,
        user: {
          include: {
            profile: true
          }
        },
        payments: true
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return orders.map(order => ({
      ...order,
      subtotal: Number(order.subtotal),
      shippingCost: Number(order.shippingCost),
      taxAmount: Number(order.taxAmount),
      discountAmount: Number(order.discountAmount),
      totalAmount: Number(order.totalAmount),
      couponDiscount: Number(order.couponDiscount),
      orderItems: order.orderItems.map(item => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
        discount: Number(item.discount),
        taxAmount: Number(item.taxAmount)
      })),
      payments: order.payments.map(payment => ({
        ...payment,
        amount: Number(payment.amount)
      }))
    }))
  },

  findAll: async (filters?: any): Promise<IOrder[]> => {
    const orders = await prisma.order.findMany({
      where: {
        deletedAt: null,
        ...filters
      },
      include: {
        orderItems: true,
        user: {
          include: {
            profile: true
          }
        },
        payments: true
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return orders.map(order => ({
      ...order,
      subtotal: Number(order.subtotal),
      shippingCost: Number(order.shippingCost),
      taxAmount: Number(order.taxAmount),
      discountAmount: Number(order.discountAmount),
      totalAmount: Number(order.totalAmount),
      couponDiscount: Number(order.couponDiscount),
      orderItems: order.orderItems.map(item => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
        discount: Number(item.discount),
        taxAmount: Number(item.taxAmount)
      })),
      payments: order.payments.map(payment => ({
        ...payment,
        amount: Number(payment.amount)
      }))
    }))
  },

  create: async (orderData: Omit<IOrder, 'id' | 'createdAt' | 'updatedAt'>): Promise<IOrder> => {
    const order = await prisma.order.create({
      data: {
        orderNumber: orderData.orderNumber || `ORD-${Date.now()}`,
        userId: orderData.userId,
        guestEmail: orderData.guestEmail,
        guestPhone: orderData.guestPhone,
        guestSessionId: orderData.guestSessionId,
        status: orderData.status,
        paymentStatus: orderData.paymentStatus,
        deliveryStatus: orderData.deliveryStatus,
        subtotal: orderData.subtotal || 0,
        shippingCost: orderData.shippingCost || 0,
        taxAmount: orderData.taxAmount || 0,
        discountAmount: orderData.discountAmount || 0,
        totalAmount: orderData.totalAmount,
        currency: orderData.currency || Currency.USD,
        couponCode: orderData.couponCode,
        couponDiscount: orderData.couponDiscount || 0,
        shippingAddress: orderData.shippingAddress,
        billingAddress: orderData.billingAddress,
        shippingMethod: orderData.shippingMethod,
        trackingNumber: orderData.trackingNumber,
        courier: orderData.courier,
        trackingUrl: orderData.trackingUrl,
        pickupStationId: orderData.pickupStationId,
        pickupCode: orderData.pickupCode,
        pickupCodeExpiresAt: orderData.pickupCodeExpiresAt,
        qrSecret: orderData.qrSecret,
        qrSecretExpiresAt: orderData.qrSecretExpiresAt,
        verificationMethod: orderData.verificationMethod || 'HYBRID',
        idVerified: orderData.idVerified || false,
        idLast4: orderData.idLast4,
        pickedAt: orderData.pickedAt,
        pickedByAgentId: orderData.pickedByAgentId,
        verificationAttempts: orderData.verificationAttempts || 0,
        failedVerificationAttempts: orderData.failedVerificationAttempts || 0,
        lockedUntil: orderData.lockedUntil,
        estimatedDelivery: orderData.estimatedDelivery,
        deliveredAt: orderData.deliveredAt,
        notes: orderData.notes,
        adminNotes: orderData.adminNotes,
        ipAddress: orderData.ipAddress,
        userAgent: orderData.userAgent
      },
      include: {
        orderItems: true,
        user: {
          include: {
            profile: true
          }
        },
        payments: true
      }
    })
    
    return {
      ...order,
      subtotal: Number(order.subtotal),
      shippingCost: Number(order.shippingCost),
      taxAmount: Number(order.taxAmount),
      discountAmount: Number(order.discountAmount),
      totalAmount: Number(order.totalAmount),
      couponDiscount: Number(order.couponDiscount),
      orderItems: order.orderItems.map(item => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
        discount: Number(item.discount),
        taxAmount: Number(item.taxAmount)
      })),
      payments: order.payments.map(payment => ({
        ...payment,
        amount: Number(payment.amount)
      }))
    }
  },

  update: async (id: string, orderData: Partial<IOrder>): Promise<IOrder> => {
    const order = await prisma.order.update({
      where: { id },
      data: {
        status: orderData.status,
        paymentStatus: orderData.paymentStatus,
        deliveryStatus: orderData.deliveryStatus,
        subtotal: orderData.subtotal,
        shippingCost: orderData.shippingCost,
        taxAmount: orderData.taxAmount,
        discountAmount: orderData.discountAmount,
        totalAmount: orderData.totalAmount,
        currency: orderData.currency,
        couponCode: orderData.couponCode,
        couponDiscount: orderData.couponDiscount,
        shippingAddress: orderData.shippingAddress,
        billingAddress: orderData.billingAddress,
        shippingMethod: orderData.shippingMethod,
        trackingNumber: orderData.trackingNumber,
        courier: orderData.courier,
        trackingUrl: orderData.trackingUrl,
        pickupStationId: orderData.pickupStationId,
        pickupCode: orderData.pickupCode,
        pickupCodeExpiresAt: orderData.pickupCodeExpiresAt,
        qrSecret: orderData.qrSecret,
        qrSecretExpiresAt: orderData.qrSecretExpiresAt,
        verificationMethod: orderData.verificationMethod,
        idVerified: orderData.idVerified,
        idLast4: orderData.idLast4,
        pickedAt: orderData.pickedAt,
        pickedByAgentId: orderData.pickedByAgentId,
        verificationAttempts: orderData.verificationAttempts,
        failedVerificationAttempts: orderData.failedVerificationAttempts,
        lockedUntil: orderData.lockedUntil,
        estimatedDelivery: orderData.estimatedDelivery,
        deliveredAt: orderData.deliveredAt,
        notes: orderData.notes,
        adminNotes: orderData.adminNotes,
        ipAddress: orderData.ipAddress,
        userAgent: orderData.userAgent,
        cancelledAt: orderData.cancelledAt,
        refundedAt: orderData.refundedAt
      },
      include: {
        orderItems: true,
        user: {
          include: {
            profile: true
          }
        },
        payments: true
      }
    })
    
    return {
      ...order,
      subtotal: Number(order.subtotal),
      shippingCost: Number(order.shippingCost),
      taxAmount: Number(order.taxAmount),
      discountAmount: Number(order.discountAmount),
      totalAmount: Number(order.totalAmount),
      couponDiscount: Number(order.couponDiscount),
      orderItems: order.orderItems.map(item => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
        discount: Number(item.discount),
        taxAmount: Number(item.taxAmount)
      })),
      payments: order.payments.map(payment => ({
        ...payment,
        amount: Number(payment.amount)
      }))
    }
  },

  getOrderStats: async (params: { startDate?: Date; endDate?: Date } = {}): Promise<{
    totalOrders: number
    totalRevenue: number
    ordersByStatus: Array<{ status: string; count: number }>
  }> => {
    const { startDate, endDate } = params

    const where: any = { deletedAt: null }
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = startDate
      if (endDate) where.createdAt.lte = endDate
    }

    const [totalOrders, totalRevenue, ordersByStatus] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.aggregate({
        where,
        _sum: { totalAmount: true }
      }),
      prisma.order.groupBy({
        by: ['status'],
        where,
        _count: { status: true },
        orderBy: { _count: { status: 'desc' } }
      })
    ])

    return {
      totalOrders,
      totalRevenue: Number(totalRevenue._sum.totalAmount || 0),
      ordersByStatus: ordersByStatus.map(o => ({ status: o.status as any, count: o._count.status }))
    }
  },

  getSalesByMonth: async (): Promise<{ monthlyData: Array<{ month: string; revenue: number; orders: number }> }> => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth() - 11, 1)

    const where: any = { deletedAt: null, createdAt: { gte: start } }

    const orders = await prisma.order.findMany({
      where,
      select: { createdAt: true, totalAmount: true, status: true }
    })

    const buckets = new Map<string, { revenue: number; orders: number }>()

    for (let i = 0; i < 12; i++) {
      const d = new Date(start.getFullYear(), start.getMonth() + i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      buckets.set(key, { revenue: 0, orders: 0 })
    }

    for (const o of orders) {
      const d = o.createdAt
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const b = buckets.get(key)
      if (!b) continue
      b.orders += 1
      b.revenue += Number(o.totalAmount)
    }

    return {
      monthlyData: Array.from(buckets.entries()).map(([month, v]) => ({
        month,
        revenue: v.revenue,
        orders: v.orders
      }))
    }
  },

  delete: async (id: string): Promise<void> => {
    await prisma.order.delete({
      where: { id }
    })
  }
}
