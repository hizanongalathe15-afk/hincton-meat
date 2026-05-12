import { prisma } from '../database'
import { Decimal } from '@prisma/client/runtime/library'

export interface ISubscription {
  id: string
  userId: string
  planId?: string
  plan: string
  status: string
  startDate: Date
  endDate?: Date
  trialEndsAt?: Date
  autoRenew: boolean
  paymentMethod?: string
  lastPaymentDate?: Date
  nextPaymentDate?: Date
  cancelledAt?: Date
  cancelReason?: string
  deliveryFrequency?: string
  deliveryAddress?: string
  deliveryInstructions?: string
  nextDeliveryDate?: Date
  pauseUntil?: Date
  customizations?: any
  cancellationReason?: string
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
  user?: any
  deliveries?: ISubscriptionDelivery[]
  payments?: ISubscriptionPayment[]
}

export interface ISubscriptionDelivery {
  id: string
  subscriptionId: string
  scheduledDate: Date
  deliveredDate?: Date
  status: string
  address?: string
  instructions?: string
  trackingNumber?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
  items?: ISubscriptionDeliveryItem[]
}

export interface ISubscriptionDeliveryItem {
  id: string
  deliveryId: string
  productId: string
  quantity: number
  notes?: string
  createdAt: Date
  product?: any
}

export interface ISubscriptionPayment {
  id: string
  subscriptionId: string
  amount: Decimal | string | number
  status: string
  paymentId?: string
  period: string
  periodStart: Date
  periodEnd: Date
  invoiceUrl?: string
  createdAt: Date
}

export const SubscriptionModel = {
  findById: async (id: string): Promise<ISubscription | null> => {
    const subscription = await prisma.subscription.findUnique({
      where: { id, deletedAt: null },
      include: {
        user: {
          include: {
            profile: true
          }
        },
        deliveries: {
          include: {
            items: {
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
          orderBy: { scheduledDate: 'desc' }
        },
        payments: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })
    return subscription
  },

  findByUserId: async (userId: string): Promise<ISubscription | null> => {
    const subscription = await prisma.subscription.findFirst({
      where: { userId, deletedAt: null },
      include: {
        user: {
          include: {
            profile: true
          }
        },
        deliveries: {
          include: {
            items: {
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
          orderBy: { scheduledDate: 'desc' }
        },
        payments: {
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    return subscription
  },

  findAll: async (params: {
    page?: number
    limit?: number
    status?: string
    userId?: string
  } = {}): Promise<{ subscriptions: ISubscription[]; total: number }> => {
    const { page = 1, limit = 20, status, userId } = params
    const skip = (page - 1) * limit

    const where: any = { deletedAt: null }
    if (status) where.status = status
    if (userId) where.userId = userId

    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        include: {
          user: {
            include: {
              profile: true
            }
          },
          deliveries: {
            include: {
              items: true
            },
            orderBy: { scheduledDate: 'desc' }
          },
          payments: {
            orderBy: { createdAt: 'desc' }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.subscription.count({ where })
    ])

    return { subscriptions, total }
  },

  create: async (data: Omit<ISubscription, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'user' | 'deliveries' | 'payments'>): Promise<ISubscription> => {
    const subscription = await prisma.subscription.create({
      data,
      include: {
        user: true,
        deliveries: true,
        payments: true
      }
    })
    return subscription
  },

  update: async (id: string, data: Partial<Omit<ISubscription, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'user' | 'deliveries' | 'payments'>>): Promise<ISubscription> => {
    const subscription = await prisma.subscription.update({
      where: { id },
      data,
      include: {
        user: true,
        deliveries: true,
        payments: true
      }
    })
    return subscription
  },

  cancel: async (id: string, reason?: string): Promise<ISubscription> => {
    const subscription = await prisma.subscription.update({
      where: { id },
      data: { 
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelReason: reason,
        autoRenew: false
      },
      include: {
        user: true,
        deliveries: true,
        payments: true
      }
    })
    return subscription
  },

  pause: async (id: string, pauseUntil: Date): Promise<ISubscription> => {
    const subscription = await prisma.subscription.update({
      where: { id },
      data: { 
        status: 'PAUSED',
        pauseUntil
      },
      include: {
        user: true,
        deliveries: true,
        payments: true
      }
    })
    return subscription
  },

  resume: async (id: string): Promise<ISubscription> => {
    const subscription = await prisma.subscription.update({
      where: { id },
      data: { 
        status: 'ACTIVE',
        pauseUntil: null
      },
      include: {
        user: true,
        deliveries: true,
        payments: true
      }
    })
    return subscription
  },

  createDelivery: async (subscriptionId: string, deliveryData: Omit<ISubscriptionDelivery, 'id' | 'subscriptionId' | 'createdAt' | 'updatedAt' | 'items'>): Promise<ISubscriptionDelivery> => {
    const delivery = await prisma.subscriptionDelivery.create({
      data: {
        ...deliveryData,
        subscriptionId
      },
      include: {
        items: {
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
      }
    })
    return delivery
  },

  updateDelivery: async (id: string, data: Partial<Omit<ISubscriptionDelivery, 'id' | 'subscriptionId' | 'createdAt' | 'updatedAt' | 'items'>>): Promise<ISubscriptionDelivery> => {
    const delivery = await prisma.subscriptionDelivery.update({
      where: { id },
      data,
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    })
    return delivery
  },

  markDeliveryDelivered: async (id: string, trackingNumber?: string): Promise<ISubscriptionDelivery> => {
    const delivery = await prisma.subscriptionDelivery.update({
      where: { id },
      data: { 
        status: 'DELIVERED',
        deliveredDate: new Date(),
        ...(trackingNumber && { trackingNumber })
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    })
    return delivery
  },

  getSubscriptionStats: async (params: { startDate?: Date; endDate?: Date } = {}): Promise<any> => {
    const { startDate, endDate } = params

    const where: any = { deletedAt: null }
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = startDate
      if (endDate) where.createdAt.lte = endDate
    }

    const [
      totalSubscriptions,
      activeSubscriptions,
      subscriptionsByStatus
    ] = await Promise.all([
      prisma.subscription.count({ where }),
      prisma.subscription.count({ where: { ...where, status: 'ACTIVE' } }),
      prisma.subscription.groupBy({
        by: ['status'],
        where,
        _count: { status: true }
      })
    ])

    return {
      totalSubscriptions,
      activeSubscriptions,
      subscriptionsByStatus
    }
  }
}
