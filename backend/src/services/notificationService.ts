// @ts-nocheck
import { prisma } from '../database'

export interface NotificationData {
  userId?: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  category: 'order' | 'payment' | 'delivery' | 'inventory' | 'system' | 'marketing'
  data?: any
  isRead?: boolean
  expiresAt?: Date
}

export interface PushNotificationData {
  userId?: string
  title: string
  body: string
  icon?: string
  image?: string
  url?: string
  actions?: Array<{
    action: string
    title: string
  }>
}

export interface EmailNotificationData {
  to: string | string[]
  subject: string
  html: string
  text?: string
  attachments?: Array<{
    filename: string
    path?: string
    content?: Buffer
  }>
}

class NotificationService {
  async createNotification(notificationData: NotificationData): Promise<{
    success: boolean
    notification?: any
    error?: string
  }> {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: notificationData.userId,
          title: notificationData.title,
          message: notificationData.message,
          type: notificationData.type.toUpperCase(),
          category: notificationData.category.toUpperCase(),
          data: notificationData.data || {},
          isRead: notificationData.isRead || false,
          expiresAt: notificationData.expiresAt
        }
      })

      // Send push notification if user has device tokens
      if (notificationData.userId) {
        await this.sendPushNotification({
          userId: notificationData.userId,
          title: notificationData.title,
          body: notificationData.message,
          url: this.getNotificationUrl(notificationData.category, notificationData.data)
        })
      }

      return {
        success: true,
        notification
      }

    } catch (error) {
      console.error('Notification creation error:', error)
      return {
        success: false,
        error: 'Failed to create notification'
      }
    }
  }

  async sendBulkNotifications(
    userIds: string[],
    notificationData: Omit<NotificationData, 'userId'>
  ): Promise<{
    success: boolean
    sent: number
    failed: number
    error?: string
  }> {
    try {
      const notifications = userIds.map(userId => ({
        userId,
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type.toUpperCase(),
        category: notificationData.category.toUpperCase(),
        data: notificationData.data || {},
        isRead: false,
        expiresAt: notificationData.expiresAt
      }))

      const result = await prisma.notification.createMany({
        data: notifications
      })

      // Send push notifications
      for (const userId of userIds) {
        await this.sendPushNotification({
          userId,
          title: notificationData.title,
          body: notificationData.message,
          url: this.getNotificationUrl(notificationData.category, notificationData.data)
        })
      }

      return {
        success: true,
        sent: result.count,
        failed: 0
      }

    } catch (error) {
      console.error('Bulk notification error:', error)
      return {
        success: false,
        sent: 0,
        failed: userIds.length,
        error: 'Failed to send bulk notifications'
      }
    }
  }

  async getUserNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20,
    filters?: {
      type?: string
      category?: string
      isRead?: boolean
      dateFrom?: Date
      dateTo?: Date
    }
  ): Promise<{
    notifications: any[]
    total: number
    unreadCount: number
    page: number
    pages: number
  }> {
    const skip = (page - 1) * limit

    const where: any = { userId }

    if (filters?.type) {
      where.type = filters.type.toUpperCase()
    }

    if (filters?.category) {
      where.category = filters.category.toUpperCase()
    }

    if (filters?.isRead !== undefined) {
      where.isRead = filters.isRead
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

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { ...where, isRead: false }
      })
    ])

    return {
      notifications,
      total,
      unreadCount,
      page,
      pages: Math.ceil(total / limit)
    }
  }

  async markAsRead(notificationId: string, userId: string): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const result = await prisma.notification.updateMany({
        where: {
          id: notificationId,
          userId
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      })

      if (result.count === 0) {
        return {
          success: false,
          error: 'Notification not found or unauthorized'
        }
      }

      return {
        success: true
      }

    } catch (error) {
      console.error('Mark notification as read error:', error)
      return {
        success: false,
        error: 'Failed to mark notification as read'
      }
    }
  }

  async markAllAsRead(userId: string): Promise<{
    success: boolean
    markedCount: number
    error?: string
  }> {
    try {
      const result = await prisma.notification.updateMany({
        where: {
          userId,
          isRead: false
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      })

      return {
        success: true,
        markedCount: result.count
      }

    } catch (error) {
      console.error('Mark all notifications as read error:', error)
      return {
        success: false,
        markedCount: 0,
        error: 'Failed to mark all notifications as read'
      }
    }
  }

  async deleteNotification(notificationId: string, userId: string): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const result = await prisma.notification.deleteMany({
        where: {
          id: notificationId,
          userId
        }
      })

      if (result.count === 0) {
        return {
          success: false,
          error: 'Notification not found or unauthorized'
        }
      }

      return {
        success: true
      }

    } catch (error) {
      console.error('Delete notification error:', error)
      return {
        success: false,
        error: 'Failed to delete notification'
      }
    }
  }

  async sendPushNotification(pushData: PushNotificationData): Promise<boolean> {
    try {
      // Get user device tokens
      if (!pushData.userId) {
        return false
      }

      const deviceTokens = await prisma.deviceToken.findMany({
        where: {
          userId: pushData.userId,
          isActive: true
        },
        select: {
          token: true,
          platform: true
        }
      })

      if (deviceTokens.length === 0) {
        return false
      }

      // Group tokens by platform
      const tokensByPlatform = deviceTokens.reduce((acc, token) => {
        if (!acc[token.platform]) {
          acc[token.platform] = []
        }
        acc[token.platform].push(token.token)
        return acc
      }, {} as Record<string, string[]>)

      // Send push notifications based on platform
      for (const [platform, tokens] of Object.entries(tokensByPlatform)) {
        if (platform === 'ios') {
          await this.sendIOSPush(tokens, pushData)
        } else if (platform === 'android') {
          await this.sendAndroidPush(tokens, pushData)
        }
      }

      return true

    } catch (error) {
      console.error('Push notification error:', error)
      return false
    }
  }

  private async sendIOSPush(tokens: string[], data: PushNotificationData): Promise<void> {
    try {
      // iOS push notification using APNs
      // This would require libraries like 'apn' or 'node-apn'
      
      const payload = {
        aps: {
          alert: {
            title: data.title,
            body: data.body
          },
          sound: 'default',
          badge: 1,
          data: data.data || {}
        }
      }

      // Mock implementation - integrate with actual APNs service
      console.log('iOS Push to tokens:', tokens.length, 'Payload:', payload)

    } catch (error) {
      console.error('iOS push error:', error)
    }
  }

  private async sendAndroidPush(tokens: string[], data: PushNotificationData): Promise<void> {
    try {
      // Android push notification using Firebase Cloud Messaging (FCM)
      // This would require libraries like 'firebase-admin'
      
      const payload = {
        notification: {
          title: data.title,
          body: data.body,
          icon: data.icon || 'ic_notification',
          image: data.image,
          click_action: data.url
        },
        data: data.data || {},
        registration_ids: tokens
      }

      // Mock implementation - integrate with actual FCM service
      console.log('Android Push to tokens:', tokens.length, 'Payload:', payload)

    } catch (error) {
      console.error('Android push error:', error)
    }
  }

  private getNotificationUrl(category: string, data: any): string {
    const baseUrl = process.env.FRONTEND_URL || 'https://hinctonmeat.com'
    
    switch (category) {
      case 'order':
        return `${baseUrl}/order-tracking/${data.orderId || ''}`
      case 'payment':
        return `${baseUrl}/profile?tab=orders`
      case 'delivery':
        return `${baseUrl}/order-tracking/${data.orderId || ''}`
      case 'inventory':
        return `${baseUrl}/admin/inventory`
      case 'system':
        return `${baseUrl}/notifications`
      case 'marketing':
        return `${baseUrl}/shop`
      default:
        return `${baseUrl}/notifications`
    }
  }

  async createOrderNotifications(order: any): Promise<void> {
    try {
      // Order confirmation
      await this.createNotification({
        userId: order.userId,
        title: 'Order Confirmed',
        message: `Your order ${order.orderNumber} has been confirmed and is being prepared.`,
        type: 'success',
        category: 'order',
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber
        }
      })

      // Order status updates would be handled by order service

    } catch (error) {
      console.error('Order notifications error:', error)
    }
  }

  async createPaymentNotifications(payment: any): Promise<void> {
    try {
      await this.createNotification({
        userId: payment.userId,
        title: 'Payment Received',
        message: `Payment of KSh ${payment.amount} has been received for order ${payment.orderNumber}.`,
        type: 'success',
        category: 'payment',
        data: {
          paymentId: payment.id,
          orderId: payment.orderId,
          amount: payment.amount
        }
      })

    } catch (error) {
      console.error('Payment notifications error:', error)
    }
  }

  async createDeliveryNotifications(delivery: any): Promise<void> {
    try {
      await this.createNotification({
        userId: delivery.userId,
        title: 'Order Out for Delivery',
        message: `Your order ${delivery.orderNumber} is out for delivery with tracking number ${delivery.trackingNumber}.`,
        type: 'info',
        category: 'delivery',
        data: {
          deliveryId: delivery.id,
          orderNumber: delivery.orderNumber,
          trackingNumber: delivery.trackingNumber
        }
      })

    } catch (error) {
      console.error('Delivery notifications error:', error)
    }
  }

  async createLowStockAlerts(alerts: Array<{
    productId: string
    productName: string
    currentStock: number
    lowStockThreshold: number
  }>): Promise<void> {
    try {
      // Get admin users
      const adminUsers = await prisma.user.findMany({
        where: {
          roles: {
            has: 'ADMIN'
          }
        },
        select: {
          id: true
        }
      })

      for (const alert of alerts) {
        const message = `Low stock alert: ${alert.productName} has ${alert.currentStock} units remaining (threshold: ${alert.lowStockThreshold}).`

        for (const admin of adminUsers) {
          await this.createNotification({
            userId: admin.id,
            title: 'Low Stock Alert',
            message,
            type: 'warning',
            category: 'inventory',
            data: {
              productId: alert.productId,
              productName: alert.productName,
              currentStock: alert.currentStock,
              lowStockThreshold: alert.lowStockThreshold
            }
          })
        }
      }

    } catch (error) {
      console.error('Low stock alerts error:', error)
    }
  }

  async getNotificationStats(userId?: string): Promise<{
    totalNotifications: number
    unreadNotifications: number
    notificationsByType: Record<string, number>
    notificationsByCategory: Record<string, number>
  }> {
    try {
      const where = userId ? { userId } : {}

      const [
        totalNotifications,
        unreadNotifications,
        typeData,
        categoryData
      ] = await Promise.all([
        prisma.notification.count({ where }),
        prisma.notification.count({ 
          where: { ...where, isRead: false }
        }),
        prisma.notification.groupBy({
          by: ['type'],
          where,
          _count: { id: true }
        }),
        prisma.notification.groupBy({
          by: ['category'],
          where,
          _count: { id: true }
        })
      ])

      const notificationsByType = typeData.reduce((acc, item) => {
        acc[item.type] = item._count.id
        return acc
      }, {} as Record<string, number>)

      const notificationsByCategory = categoryData.reduce((acc, item) => {
        acc[item.category] = item._count.id
        return acc
      }, {} as Record<string, number>)

      return {
        totalNotifications,
        unreadNotifications,
        notificationsByType,
        notificationsByCategory
      }

    } catch (error) {
      console.error('Notification stats error:', error)
      return {
        totalNotifications: 0,
        unreadNotifications: 0,
        notificationsByType: {},
        notificationsByCategory: {}
      }
    }
  }

  async cleanupExpiredNotifications(): Promise<number> {
    try {
      const result = await prisma.notification.deleteMany({
        where: {
          expiresAt: {
            lte: new Date()
          }
        }
      })

      return result.count

    } catch (error) {
      console.error('Cleanup expired notifications error:', error)
      return 0
    }
  }
}

export const notificationService = new NotificationService()
export default notificationService
