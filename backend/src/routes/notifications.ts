import express from 'express'

import { AuthRequest } from '../middleware/auth'
import { prisma } from '../config/prisma'

const router = express.Router()

router.get('/', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    })
    const unreadCount = await prisma.notification.count({ where: { userId, isRead: false } })

    res.json({
      notifications: notifications.map((notification) => ({
        ...notification,
        metadata: notification.data,
      })),
      unreadCount,
    })
  } catch (error) {
    console.error('Get notifications error:', error)
    res.status(500).json({ error: 'Failed to get notifications' })
  }
})

router.get('/unread-count', async (req: AuthRequest, res) => {
  try {
    const unreadCount = await prisma.notification.count({ where: { userId: req.user?.id, isRead: false } })
    res.json({ unreadCount })
  } catch (error) {
    console.error('Get unread count error:', error)
    res.status(500).json({ error: 'Failed to get unread count' })
  }
})

router.put('/mark-all-read', async (req: AuthRequest, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user?.id, isRead: false },
      data: { isRead: true, readAt: new Date() },
    })
    res.json({ message: 'Notifications marked as read' })
  } catch (error) {
    console.error('Mark all notifications error:', error)
    res.status(500).json({ error: 'Failed to mark notifications as read' })
  }
})

router.put('/:id/read', async (req: AuthRequest, res) => {
  try {
    const notification = await prisma.notification.findFirst({
      where: { id: req.params.id, userId: req.user?.id },
    })

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' })
    }

    await prisma.notification.update({
      where: { id: notification.id },
      data: { isRead: true, readAt: new Date() },
    })
    res.json({ message: 'Notification marked as read' })
  } catch (error) {
    console.error('Mark notification error:', error)
    res.status(500).json({ error: 'Failed to mark notification as read' })
  }
})

router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const notification = await prisma.notification.findFirst({
      where: { id: req.params.id, userId: req.user?.id },
    })

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' })
    }

    await prisma.notification.delete({ where: { id: notification.id } })
    res.json({ message: 'Notification deleted' })
  } catch (error) {
    console.error('Delete notification error:', error)
    res.status(500).json({ error: 'Failed to delete notification' })
  }
})

export default router
