import { prisma } from '../database'
import { PaymentStatus, Currency } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

export interface IPayment {
  id: string
  orderId: string
  userId?: string
  amount: Decimal | string | number
  currency: Currency
  paymentMethod: string
  paymentReference?: string
  status: PaymentStatus
  metadata?: any
  errorMessage?: string
  mpesaReceipt?: string
  mpesaPhone?: string
  mpesaTransactionDate?: Date
  createdAt: Date
  completedAt?: Date
  order?: any
  user?: any
  refunds?: any[]
}

export const PaymentModel = {
  findById: async (id: string): Promise<IPayment | null> => {
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            user: {
              include: {
                profile: true
              }
            }
          }
        },
        user: {
          include: {
            profile: true
          }
        },
        refunds: true
      }
    })
    return payment
  },

  findByOrderId: async (orderId: string): Promise<IPayment[]> => {
    const payments = await prisma.payment.findMany({
      where: { orderId },
      include: {
        order: true,
        user: {
          include: {
            profile: true
          }
        },
        refunds: true
      },
      orderBy: { createdAt: 'desc' }
    })
    return payments
  },

  findByUserId: async (userId: string, params: {
    page?: number
    limit?: number
    status?: PaymentStatus
  } = {}): Promise<{ payments: IPayment[]; total: number }> => {
    const { page = 1, limit = 20, status } = params
    const skip = (page - 1) * limit

    const where: any = { userId }
    if (status) where.status = status

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          order: true,
          refunds: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.payment.count({ where })
    ])

    return { payments, total }
  },

  create: async (data: Omit<IPayment, 'id' | 'createdAt' | 'completedAt' | 'order' | 'user' | 'refunds'>): Promise<IPayment> => {
    const payment = await prisma.payment.create({
      data: {
        orderId: data.orderId,
        userId: data.userId,
        amount: data.amount,
        currency: data.currency,
        paymentMethod: data.paymentMethod,
        paymentReference: data.paymentReference,
        status: data.status,
        metadata: data.metadata,
        errorMessage: data.errorMessage,
        mpesaReceipt: data.mpesaReceipt,
        mpesaPhone: data.mpesaPhone,
        mpesaTransactionDate: data.mpesaTransactionDate
      },
      include: {
        order: true,
        user: {
          include: {
            profile: true
          }
        },
        refunds: true
      }
    })
    return payment
  },

  update: async (id: string, data: Partial<Omit<IPayment, 'id' | 'createdAt' | 'completedAt' | 'order' | 'user' | 'refunds'>>): Promise<IPayment> => {
    const payment = await prisma.payment.update({
      where: { id },
      data,
      include: {
        order: true,
        user: {
          include: {
            profile: true
          }
        },
        refunds: true
      }
    })
    return payment
  },

  updateStatus: async (id: string, status: PaymentStatus, metadata?: any): Promise<IPayment> => {
    const payment = await prisma.payment.update({
      where: { id },
      data: { 
        status,
        ...(metadata && { metadata }),
        ...(status === PaymentStatus.PAID && { completedAt: new Date() })
      },
      include: {
        order: true,
        user: {
          include: {
            profile: true
          }
        },
        refunds: true
      }
    })
    return payment
  },

  completePayment: async (id: string, paymentReference?: string, metadata?: any): Promise<IPayment> => {
    const payment = await prisma.payment.update({
      where: { id },
      data: { 
        status: PaymentStatus.PAID,
        paymentReference,
        completedAt: new Date(),
        ...(metadata && { metadata })
      },
      include: {
        order: true,
        user: {
          include: {
            profile: true
          }
        },
        refunds: true
      }
    })
    return payment
  },

  failPayment: async (id: string, errorMessage: string, metadata?: any): Promise<IPayment> => {
    const payment = await prisma.payment.update({
      where: { id },
      data: { 
        status: PaymentStatus.FAILED,
        errorMessage,
        ...(metadata && { metadata })
      },
      include: {
        order: true,
        user: {
          include: {
            profile: true
          }
        },
        refunds: true
      }
    })
    return payment
  },

  getPaymentStats: async (params: { startDate?: Date; endDate?: Date } = {}): Promise<any> => {
    const { startDate, endDate } = params

    const where: any = {}
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = startDate
      if (endDate) where.createdAt.lte = endDate
    }

    const [
      totalPayments,
      totalRevenue,
      paymentsByStatus,
      paymentsByMethod
    ] = await Promise.all([
      prisma.payment.count({ where }),
      prisma.payment.aggregate({
        where: { ...where, status: PaymentStatus.PAID },
        _sum: { amount: true }
      }),
      prisma.payment.groupBy({
        by: ['status'],
        where,
        _count: { status: true },
        _sum: { amount: true }
      }),
      prisma.payment.groupBy({
        by: ['paymentMethod'],
        where: { ...where, status: PaymentStatus.PAID },
        _count: { paymentMethod: true },
        _sum: { amount: true }
      })
    ])

    return {
      totalPayments,
      totalRevenue: totalRevenue._sum.amount || 0,
      paymentsByStatus,
      paymentsByMethod
    }
  },

  getMpesaPayments: async (params: {
    page?: number
    limit?: number
    startDate?: Date
    endDate?: Date
  } = {}): Promise<{ payments: IPayment[]; total: number }> => {
    const { page = 1, limit = 20, startDate, endDate } = params
    const skip = (page - 1) * limit

    const where: any = { paymentMethod: 'MPESA' }
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = startDate
      if (endDate) where.createdAt.lte = endDate
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          order: true,
          user: {
            include: {
              profile: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.payment.count({ where })
    ])

    return { payments, total }
  }
}
