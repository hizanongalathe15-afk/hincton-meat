import { prisma } from '../database'
import { Currency } from '@prisma/client'

export interface ITransaction {
  id: string
  orderId: string
  userId?: string
  amount: number | string
  currency: string
  paymentMethod: string
  paymentReference?: string
  status: string
  metadata?: any
  errorMessage?: string
  mpesaReceipt?: string
  mpesaPhone?: string
  mpesaTransactionDate?: Date
  createdAt: Date
  completedAt?: Date
  order?: {
    id: string
    orderNumber: string
    status: string
    totalAmount: number | string
  }
  user?: {
    id: string
    email: string
    profile?: {
      fullName?: string
    }
  }
}

export interface ICreateTransaction {
  orderId: string
  userId?: string
  amount: number | string
  currency?: string
  paymentMethod: string
  paymentReference?: string
  mpesaPhone?: string
  metadata?: any
}

export interface IUpdateTransaction {
  status?: string
  paymentReference?: string
  errorMessage?: string
  metadata?: any
  mpesaReceipt?: string
  mpesaPhone?: string
  mpesaTransactionDate?: Date
  completedAt?: Date
}

export const TransactionModel = {
  create: async (data: ICreateTransaction): Promise<ITransaction> => {
    const transaction = await prisma.payment.create({
      data: {
        orderId: data.orderId,
        userId: data.userId,
        amount: data.amount,
        currency: (data.currency || 'USD') as Currency,
        paymentMethod: data.paymentMethod,
        paymentReference: data.paymentReference,
        mpesaPhone: data.mpesaPhone,
        metadata: data.metadata,
        status: 'PENDING'
      },
      include: {
        order: true,
        user: {
          include: {
            profile: true
          }
        }
      }
    })
    
    return {
      ...transaction,
      amount: Number(transaction.amount),
      order: transaction.order ? {
        ...transaction.order,
        totalAmount: Number(transaction.order.totalAmount)
      } : undefined
    }
  },

  findById: async (id: string): Promise<ITransaction | null> => {
    const transaction = await prisma.payment.findUnique({
      where: { id },
      include: {
        order: true,
        user: {
          include: {
            profile: true
          }
        }
      }
    })
    
    if (!transaction) return null
    
    return {
      ...transaction,
      amount: Number(transaction.amount),
      order: transaction.order ? {
        ...transaction.order,
        totalAmount: Number(transaction.order.totalAmount)
      } : undefined
    }
  },

  findByOrderId: async (orderId: string): Promise<ITransaction[]> => {
    const transactions = await prisma.payment.findMany({
      where: { orderId },
      include: {
        order: true,
        user: {
          include: {
            profile: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return transactions.map(transaction => ({
      ...transaction,
      amount: Number(transaction.amount),
      order: transaction.order ? {
        ...transaction.order,
        totalAmount: Number(transaction.order.totalAmount)
      } : undefined
    }))
  },

  findByTransactionId: async (transactionId: string): Promise<ITransaction | null> => {
    const transaction = await prisma.payment.findFirst({
      where: { paymentReference: transactionId },
      include: {
        order: true,
        user: {
          include: {
            profile: true
          }
        }
      }
    })
    
    if (!transaction) return null
    
    return {
      ...transaction,
      amount: Number(transaction.amount),
      order: transaction.order ? {
        ...transaction.order,
        totalAmount: Number(transaction.order.totalAmount)
      } : undefined
    }
  },

  update: async (id: string, data: IUpdateTransaction): Promise<ITransaction | null> => {
    const transaction = await prisma.payment.update({
      where: { id },
      data: {
        status: data.status as any,
        paymentReference: data.paymentReference,
        errorMessage: data.errorMessage,
        metadata: data.metadata,
        mpesaReceipt: data.mpesaReceipt,
        mpesaPhone: data.mpesaPhone,
        mpesaTransactionDate: data.mpesaTransactionDate,
        completedAt: data.completedAt
      },
      include: {
        order: true,
        user: {
          include: {
            profile: true
          }
        }
      }
    })
    
    return {
      ...transaction,
      amount: Number(transaction.amount),
      order: transaction.order ? {
        ...transaction.order,
        totalAmount: Number(transaction.order.totalAmount)
      } : undefined
    }
  },

  findAll: async (query: any = {}): Promise<ITransaction[]> => {
    const transactions = await prisma.payment.findMany({
      where: query,
      include: {
        order: true,
        user: {
          include: {
            profile: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return transactions.map(transaction => ({
      ...transaction,
      amount: Number(transaction.amount),
      order: transaction.order ? {
        ...transaction.order,
        totalAmount: Number(transaction.order.totalAmount)
      } : undefined
    }))
  }
}
