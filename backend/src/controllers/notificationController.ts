import { Request, Response } from 'express'
import { prisma } from '../config/prisma'
import { AuthRequest } from '../middleware/auth'

// Simple in-memory notification storage since notification model doesn't exist in schema
const notifications: any[] = []

export const getNotifications = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const userId = req.user?.id
    const { page = 1, limit = 10, type, unreadOnly = false } = req.query

    // Filter notifications for user
    let userNotifications = notifications.filter(n => n.userId === userId)
    
    if (type) userNotifications = userNotifications.filter(n => n.type === type)
    if (unreadOnly === 'true') userNotifications = userNotifications.filter(n => !n.isRead)

    const total = userNotifications.length
    const unreadCount = userNotifications.filter(n => !n.isRead).length

    // Pagination
    const startIndex = (Number(page) - 1) * Number(limit)
    const paginatedNotifications = userNotifications.slice(startIndex, startIndex + Number(limit))

    res.json({
      notifications: paginatedNotifications,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      },
      unreadCount
    })
  } catch (error) {
    console.error('Get notifications error:', error)
    res.status(500).json({ message: 'Server error while fetching notifications' })
  }
}

export const createNotification = async (req: Request, res: Response, next: any) => {
  try {
    const { userId, title, message, type, metadata } = req.body

    const notification = {
      id: `notif_${Date.now()}`,
      userId,
      title,
      message,
      type,
      metadata: metadata || {},
      isRead: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Add to in-memory storage
    notifications.push(notification)

    res.status(201).json({ notification })
  } catch (error) {
    console.error('Create notification error:', error)
    res.status(500).json({ message: 'Server error while creating notification' })
  }
}

export const markAsRead = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const userId = req.user?.id
    const { notificationId } = req.params

    const notificationIndex = notifications.findIndex(n => n.id === notificationId && n.userId === userId)
    
    if (notificationIndex === -1) {
      return res.status(404).json({ message: 'Notification not found' })
    }

    notifications[notificationIndex].isRead = true
    notifications[notificationIndex].updatedAt = new Date()

    res.json({ message: 'Notification marked as read' })
  } catch (error) {
    console.error('Mark notification as read error:', error)
    res.status(500).json({ message: 'Server error while marking notification as read' })
  }
}

export const markAllAsRead = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const userId = req.user?.id

    const userNotifications = notifications.filter(n => n.userId === userId)
    userNotifications.forEach(notification => {
      notification.isRead = true
      notification.updatedAt = new Date()
    })

    res.json({ message: 'All notifications marked as read' })
  } catch (error) {
    console.error('Mark all notifications as read error:', error)
    res.status(500).json({ message: 'Server error while marking all notifications as read' })
  }
}

export const deleteNotification = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const userId = req.user?.id
    const { notificationId } = req.params

    const notificationIndex = notifications.findIndex(n => n.id === notificationId && n.userId === userId)
    
    if (notificationIndex === -1) {
      return res.status(404).json({ message: 'Notification not found' })
    }

    notifications.splice(notificationIndex, 1)

    res.json({ message: 'Notification deleted successfully' })
  } catch (error) {
    console.error('Delete notification error:', error)
    res.status(500).json({ message: 'Server error while deleting notification' })
  }
}

export const getUnreadCount = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const userId = req.user?.id

    const unreadCount = notifications.filter(n => n.userId === userId && !n.isRead).length

    res.json({ unreadCount })
  } catch (error) {
    console.error('Get unread count error:', error)
    res.status(500).json({ message: 'Server error while fetching unread count' })
  }
}

// Helper function to create notifications for different events
export const createOrderNotification = async (userId: string, orderId: string, status: string) => {
  const title = `Order ${status}`
  const message = `Your order #${orderId} has been ${status.toLowerCase()}`
  const type = 'ORDER'
  const metadata = { orderId, status }

  const notification = {
    id: `notif_${Date.now()}`,
    userId,
    title,
    message,
    type,
    metadata,
    isRead: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  notifications.push(notification)
}

export const createPaymentNotification = async (userId: string, paymentId: string, status: string) => {
  const title = `Payment ${status}`
  const message = `Your payment has been ${status.toLowerCase()}`
  const type = 'PAYMENT'
  const metadata = { paymentId, status }

  const notification = {
    id: `notif_${Date.now()}`,
    userId,
    title,
    message,
    type,
    metadata,
    isRead: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  notifications.push(notification)
}

export const createProductNotification = async (userId: string, productId: string, action: string) => {
  const title = `Product ${action}`
  const message = `A product you're interested in has been ${action.toLowerCase()}`
  const type = 'PRODUCT'
  const metadata = { productId, action }

  const notification = {
    id: `notif_${Date.now()}`,
    userId,
    title,
    message,
    type,
    metadata,
    isRead: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  notifications.push(notification)
}

export const createMessageNotification = async (userId: string, senderId: string, senderName: string) => {
  const title = 'New Message'
  const message = `You have a new message from ${senderName}`
  const type = 'MESSAGE'
  const metadata = { senderId, senderName }

  const notification = {
    id: `notif_${Date.now()}`,
    userId,
    title,
    message,
    type,
    metadata,
    isRead: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  notifications.push(notification)
}

export const createSystemNotification = async (userId: string, title: string, message: string) => {
  const type = 'SYSTEM'

  const notification = {
    id: `notif_${Date.now()}`,
    userId,
    title,
    message,
    type,
    metadata: {},
    isRead: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  notifications.push(notification)
}
