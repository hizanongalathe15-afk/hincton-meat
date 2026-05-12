import { prisma } from '../database'
import { NotificationType } from '@prisma/client'

export interface INotification {
  id: string
  userId: string
  type: NotificationType
  title?: string
  message?: string
  data?: any
  image?: string
  actionUrl?: string
  isRead: boolean
  channel?: string
  sentAt?: Date
  readAt?: Date
  createdAt: Date
  user?: any
}

export const NotificationModel = {
  findById: async (id: string): Promise<INotification | null> => {
    const notification = await prisma.notification.findUnique({
      where: { id },
      include: {
        user: {
          include: {
            profile: true
          }
        }
      }
    })
    return notification
  },

  findByUserId: async (userId: string, params: {
    page?: number
    limit?: number
    isRead?: boolean
    type?: string
  } = {}): Promise<{ notifications: INotification[]; total: number; unreadCount: number }> => {
    const { page = 1, limit = 20, isRead, type } = params
    const skip = (page - 1) * limit

    const where: any = { userId }
    if (isRead !== undefined) where.isRead = isRead
    if (type) where.type = type

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                  fullName: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, isRead: false } })
    ])

    return { notifications, total, unreadCount }
  },

  create: async (data: Omit<INotification, 'id' | 'createdAt' | 'user'>): Promise<INotification> => {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data,
        image: data.image,
        actionUrl: data.actionUrl,
        isRead: data.isRead,
        channel: data.channel,
        sentAt: data.sentAt,
        readAt: data.readAt
      },
      include: {
        user: {
          include: {
            profile: true
          }
        }
      }
    })
    return notification
  },

  markAsRead: async (id: string): Promise<INotification> => {
    const notification = await prisma.notification.update({
      where: { id },
      data: { 
        isRead: true,
        readAt: new Date()
      },
      include: {
        user: {
          include: {
            profile: true
          }
        }
      }
    })
    return notification
  },

  markAllAsRead: async (userId: string): Promise<void> => {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { 
        isRead: true,
        readAt: new Date()
      }
    })
  },

  delete: async (id: string): Promise<void> => {
    await prisma.notification.delete({
      where: { id }
    })
  },

  deleteByUserId: async (userId: string): Promise<void> => {
    await prisma.notification.deleteMany({
      where: { userId }
    })
  },

  sendBulkNotifications: async (userIds: string[], notificationData: Omit<INotification, 'id' | 'userId' | 'createdAt' | 'user'>): Promise<void> => {
    const notifications = userIds.map(userId => ({
      userId,
      type: notificationData.type,
      title: notificationData.title,
      message: notificationData.message,
      data: notificationData.data,
      image: notificationData.image,
      actionUrl: notificationData.actionUrl,
      isRead: notificationData.isRead,
      channel: notificationData.channel,
      sentAt: notificationData.sentAt,
      readAt: notificationData.readAt
    }))

    await prisma.notification.createMany({
      data: notifications
    })
  },

  getUnreadCount: async (userId: string): Promise<number> => {
    const count = await prisma.notification.count({
      where: { userId, isRead: false }
    })
    return count
  },

  getRecentNotifications: async (userId: string, limit: number = 5): Promise<INotification[]> => {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    })
    return notifications
  }
}
