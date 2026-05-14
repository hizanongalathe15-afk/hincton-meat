import express from 'express'
import { prisma } from '../config/prisma'
import { z } from 'zod'

const router = express.Router()

const sendMessageSchema = z.object({
  sessionId: z.string().min(1),
  message: z.string().min(1),
  attachments: z.array(z.object({
    url: z.string().min(1),
    name: z.string().optional(),
    type: z.string().optional(),
    size: z.number().optional(),
  })).optional(),
  // sender: user or admin
  from: z.enum(['user', 'admin']).default('user'),
})

const getAuthUserId = (req: any): string | null => req.user?.id ?? null
const isAdmin = (req: any) => req.user?.roles?.some((role: string) => ['ADMIN', 'SUPER_ADMIN', 'SUPPORT'].includes(role))
const getGuestSessionId = (req: any): string | null => {
  const value = req.header('X-Guest-Session-Id')
  return typeof value === 'string' && value.trim().length >= 12 ? value.trim() : null
}

const CHAT_EDIT_DELETE_WINDOW_MS = 15 * 60 * 1000

const displayName = (user: any) => {
  return user?.profile?.fullName ||
    [user?.profile?.firstName, user?.profile?.lastName].filter(Boolean).join(' ') ||
    user?.username ||
    user?.email ||
    'Unknown user'
}

const serializeChatMessage = (message: any, viewerId?: string | null) => {
  const sender = message.isFromUser ? message.user : message.admin
  const receiver = message.isFromUser ? message.admin : message.user
  const age = Date.now() - new Date(message.createdAt).getTime()
  const isOwn = message.isFromUser ? message.userId === viewerId : message.adminId === viewerId

  return {
    id: message.id,
    roomId: message.roomId,
    sessionId: message.sessionId,
    senderId: sender?.id || '',
    senderName: displayName(sender),
    senderAvatar: sender?.profile?.avatar || null,
    senderEmail: sender?.email || null,
    senderPhone: sender?.phone || sender?.profile?.mpesaPhone || null,
    receiverId: receiver?.id || '',
    receiverName: displayName(receiver),
    receiverAvatar: receiver?.profile?.avatar || null,
    content: message.message || '',
    attachments: message.attachments || [],
    timestamp: message.createdAt,
    editedAt: message.editedAt,
    isRead: message.isRead,
    isFromUser: message.isFromUser,
    canEdit: isOwn && age <= CHAT_EDIT_DELETE_WINDOW_MS,
    canDelete: isOwn && age <= CHAT_EDIT_DELETE_WINDOW_MS,
    type: message.attachments ? 'attachment' : 'text',
  }
}

const notifyAdminsOfCustomerMessage = async (sessionId: string, userId: string, message: string) => {
  const admins = await prisma.user.findMany({
    where: { roles: { hasSome: ['ADMIN', 'SUPER_ADMIN', 'SUPPORT'] as any } },
    select: { id: true },
  })

  if (admins.length === 0) return

  await prisma.notification.createMany({
    data: admins.map((admin) => ({
      userId: admin.id,
      type: 'SYSTEM' as any,
      title: 'New customer message',
      message: message.slice(0, 180),
      data: { sessionId, userId },
      actionUrl: '/admin/communications',
      channel: 'inApp',
    })),
  })
}

const notifyCustomerOfAdminReply = async (sessionId: string, userId: string, message: string) => {
  await prisma.notification.create({
    data: {
      userId,
      type: 'SYSTEM' as any,
      title: 'Support replied',
      message: message.slice(0, 180),
      data: { sessionId },
      actionUrl: '/profile',
      channel: 'inApp',
    },
  })
}

const getOrCreateGuestChatUser = async (sessionId: string) => {
  const safeSession = sessionId.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 48)
  const email = `guest-${safeSession}@guest.hincton.local`

  return prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      roles: ['BUYER'] as any,
      profile: { create: { fullName: 'Guest Customer' } },
      security: { create: { is_active: true, isEmailVerified: false } },
    },
  })
}

router.post('/messages', async (req, res) => {
  try {
    const { sessionId, message, attachments, from } = sendMessageSchema.parse(req.body)

    const authUserId = getAuthUserId(req)
    const guestSessionId = getGuestSessionId(req)
    if (!authUserId && !guestSessionId) return res.status(400).json({ error: 'Missing guest session id' })

    if (from === 'admin' && !isAdmin(req)) {
      return res.status(403).json({ error: 'Admin access required' })
    }

    const existingSessionMessage = from === 'admin'
      ? await prisma.liveChatMessage.findFirst({
          where: { sessionId, isFromUser: true },
          orderBy: { createdAt: 'asc' },
          select: { userId: true },
        })
      : null

    const guestUser = !authUserId && from === 'user' && guestSessionId ? await getOrCreateGuestChatUser(guestSessionId) : null
    const finalUserId = from === 'admin' ? existingSessionMessage?.userId : authUserId || guestUser?.id
    if (!finalUserId) return res.status(404).json({ error: 'Customer chat session not found' })

    const msg = await prisma.liveChatMessage.create({
      data: {
        sessionId,
        roomId: sessionId, // simple 1:1 mapping
        isFromUser: from === 'user',
        isRead: false,
        userId: finalUserId,
        adminId: from === 'admin' ? authUserId : null,
        message,
        attachments: attachments || undefined,
      },
      include: {
        user: { select: { id: true, username: true, email: true, phone: true, profile: { select: { fullName: true, firstName: true, lastName: true, avatar: true, mpesaPhone: true } } } },
        admin: { select: { id: true, username: true, email: true, phone: true, profile: { select: { fullName: true, firstName: true, lastName: true, avatar: true, mpesaPhone: true } } } },
      },
    })

    if (from === 'user') {
      notifyAdminsOfCustomerMessage(sessionId, finalUserId, message).catch((error) => {
        console.error('Admin chat notification error:', error)
      })
    } else if (from === 'admin') {
      notifyCustomerOfAdminReply(sessionId, finalUserId, message).catch((error) => {
        console.error('Customer chat notification error:', error)
      })
    }

    res.status(201).json({ message: 'Message sent', msg: serializeChatMessage(msg, authUserId) })
  } catch (error) {
    console.error('Send chat message error:', error)
    res.status(500).json({ error: 'Failed to send message' })
  }
})

// Get messages by session
router.get('/sessions/:sessionId/messages', async (req, res) => {
  try {
    const { sessionId } = req.params

    const messages = await prisma.liveChatMessage.findMany({
      where: { sessionId, roomId: sessionId },
      include: {
        user: { select: { id: true, username: true, email: true, phone: true, profile: { select: { fullName: true, firstName: true, lastName: true, avatar: true, mpesaPhone: true } } } },
        admin: { select: { id: true, username: true, email: true, phone: true, profile: { select: { fullName: true, firstName: true, lastName: true, avatar: true, mpesaPhone: true } } } },
      },
      orderBy: { createdAt: 'asc' },
    })

    res.json({ sessionId, messages: messages.map((message) => serializeChatMessage(message, getAuthUserId(req))) })
  } catch (error) {
    console.error('Get chat messages error:', error)
    res.status(500).json({ error: 'Failed to get messages' })
  }
})

// Get all chat sessions for admin
router.get('/admin/sessions', async (req, res) => {
  try {
    const userId = getAuthUserId(req)
    if (!userId) return res.status(401).json({ error: 'Invalid token' })
    if (!isAdmin(req)) return res.status(403).json({ error: 'Admin access required' })

    const messages = await prisma.liveChatMessage.findMany({
      where: { sessionId: { not: null } },
      include: {
        user: { select: { id: true, username: true, email: true, phone: true, profile: { select: { fullName: true, firstName: true, lastName: true, avatar: true, mpesaPhone: true } } } },
        admin: { select: { id: true, username: true, email: true, phone: true, profile: { select: { fullName: true, firstName: true, lastName: true, avatar: true, mpesaPhone: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const seen = new Set<string>()
    const sessions = messages
      .filter((message) => {
        if (!message.sessionId || seen.has(message.sessionId)) return false
        seen.add(message.sessionId)
        return true
      })
      .map((message) => ({
        sessionId: message.sessionId,
        createdAt: message.createdAt,
        lastMessage: message,
        user: message.user,
        unreadCount: messages.filter((item) => item.sessionId === message.sessionId && item.isFromUser && !item.isRead).length,
      }))

    res.json({ sessions })
  } catch (error) {
    console.error('Get admin chat sessions error:', error)
    res.status(500).json({ error: 'Failed to get sessions' })
  }
})

// Get user's chat sessions
router.get('/user/sessions', async (req, res) => {
  try {
    const userId = getAuthUserId(req)
    if (!userId) return res.status(401).json({ error: 'Invalid token' })

    const sessions = await prisma.liveChatMessage.findMany({
      where: { userId },
      select: {
        sessionId: true,
        createdAt: true,
        isRead: true,
      },
      distinct: ['sessionId'],
      orderBy: { createdAt: 'desc' },
    })

    res.json({ sessions })
  } catch (error) {
    console.error('Get user chat sessions error:', error)
    res.status(500).json({ error: 'Failed to get sessions' })
  }
})

// Mark messages as read
router.put('/sessions/:sessionId/read', async (req, res) => {
  try {
    const { sessionId } = req.params
    const userId = getAuthUserId(req)
    if (!userId) return res.status(401).json({ error: 'Invalid token' })

    await prisma.liveChatMessage.updateMany({
      where: { 
        sessionId,
        ...(isAdmin(req)
          ? { isFromUser: true }
          : { userId, isFromUser: false }),
      },
      data: { isRead: true },
    })

    res.json({ message: 'Messages marked as read' })
  } catch (error) {
    console.error('Mark messages as read error:', error)
    res.status(500).json({ error: 'Failed to mark messages as read' })
  }
})

// Edit message (users can edit their own messages within 15 minutes)
router.put('/messages/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params
    const { newMessage } = z.object({ newMessage: z.string().min(1).max(1000) }).parse(req.body)
    const userId = getAuthUserId(req)
    if (!userId) return res.status(401).json({ error: 'Invalid token' })

    const message = await prisma.liveChatMessage.findUnique({
      where: { id: messageId },
    })

    if (!message) return res.status(404).json({ error: 'Message not found' })

    // Check if user can edit this message
    const editWindowStart = new Date(Date.now() - CHAT_EDIT_DELETE_WINDOW_MS)
    
    if (message.isFromUser) {
      // User editing their own message
      if (message.userId !== userId) {
        return res.status(403).json({ error: 'Not authorized to edit this message' })
      }
      if (message.createdAt < editWindowStart) {
        return res.status(403).json({ error: 'Can only edit messages within 15 minutes' })
      }
    } else {
      // Admin editing their own message
      if (!isAdmin(req) || message.adminId !== userId) {
        return res.status(403).json({ error: 'Not authorized to edit this message' })
      }
      if (message.createdAt < editWindowStart) {
        return res.status(403).json({ error: 'Can only edit messages within 15 minutes' })
      }
    }

    // Store original message for audit
    const originalMessage = message.message || ''
    
    const updatedMessage = await prisma.liveChatMessage.update({
      where: { id: messageId },
      data: {
        message: newMessage,
        editedAt: new Date(),
        originalMessage: originalMessage
      }
    })

    res.json({ 
      message: 'Message updated successfully', 
      updatedMessage: {
        id: updatedMessage.id,
        message: updatedMessage.message,
        editedAt: updatedMessage.editedAt
      }
    })
  } catch (error: any) {
    console.error('Edit message error:', error)
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid message content', details: error.issues })
    }
    res.status(500).json({ error: 'Failed to edit message' })
  }
})

// Delete message (sender can delete within 15 minutes)
router.delete('/messages/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params
    const userId = getAuthUserId(req)
    if (!userId) return res.status(401).json({ error: 'Invalid token' })

    const message = await prisma.liveChatMessage.findUnique({
      where: { id: messageId },
    })

    if (!message) return res.status(404).json({ error: 'Message not found' })

    const ownsMessage = message.isFromUser ? message.userId === userId : message.adminId === userId
    if (!ownsMessage) {
      return res.status(403).json({ error: 'Not authorized to delete this message' })
    }
    if (message.createdAt < new Date(Date.now() - CHAT_EDIT_DELETE_WINDOW_MS)) {
      return res.status(403).json({ error: 'Can only delete messages within 15 minutes' })
    }

    await prisma.liveChatMessage.delete({
      where: { id: messageId },
    })

    res.json({ message: 'Message deleted successfully' })
  } catch (error) {
    console.error('Delete message error:', error)
    res.status(500).json({ error: 'Failed to delete message' })
  }
})

// New conversation endpoints
router.get('/conversations', async (req, res) => {
  try {
    const userId = getAuthUserId(req)
    if (!userId) return res.status(401).json({ error: 'Invalid token' })

    const adminView = isAdmin(req)
    const messages = await prisma.liveChatMessage.findMany({
      where: adminView ? {} : { userId },
      include: {
        user: { select: { id: true, username: true, email: true, phone: true, profile: { select: { fullName: true, firstName: true, lastName: true, avatar: true, mpesaPhone: true } } } },
        admin: { select: { id: true, username: true, email: true, phone: true, profile: { select: { fullName: true, firstName: true, lastName: true, avatar: true, mpesaPhone: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const byRoom = new Map<string, any>()
    for (const message of messages) {
      if (!byRoom.has(message.roomId)) {
        const participant = adminView ? message.user : (message.isFromUser ? message.admin : message.user)
        byRoom.set(message.roomId, {
          id: message.roomId,
          participantId: participant?.id || '',
          participantName: displayName(participant),
          participantAvatar: participant?.profile?.avatar || null,
          participantEmail: participant?.email || null,
          participantPhone: participant?.phone || participant?.profile?.mpesaPhone || null,
          participantType: adminView ? 'buyer' : 'support',
          lastMessage: message.message || '',
          lastMessageTime: message.createdAt,
          unreadCount: 0,
          isStarred: false,
          messages: [],
        })
      }

      const row = byRoom.get(message.roomId)
      if (adminView && message.isFromUser && !message.isRead) row.unreadCount += 1
      if (!adminView && !message.isFromUser && !message.isRead) row.unreadCount += 1
    }

    res.json({ success: true, conversations: Array.from(byRoom.values()) })
  } catch (error) {
    console.error('Get conversations error:', error)
    res.status(500).json({ error: 'Failed to fetch conversations' })
  }
})

router.get('/conversations/:conversationId/messages', async (req, res) => {
  try {
    const userId = getAuthUserId(req)
    const { conversationId } = req.params
    if (!userId) return res.status(401).json({ error: 'Invalid token' })

    const adminView = isAdmin(req)
    const messages = await prisma.liveChatMessage.findMany({
      where: {
        roomId: conversationId,
        ...(adminView ? {} : { userId }),
      },
      include: {
        user: { select: { id: true, username: true, email: true, phone: true, profile: { select: { fullName: true, firstName: true, lastName: true, avatar: true, mpesaPhone: true } } } },
        admin: { select: { id: true, username: true, email: true, phone: true, profile: { select: { fullName: true, firstName: true, lastName: true, avatar: true, mpesaPhone: true } } } },
      },
      orderBy: { createdAt: 'asc' },
    })

    res.json({ success: true, messages: messages.map((message) => serializeChatMessage(message, userId)) })
  } catch (error) {
    console.error('Get messages error:', error)
    res.status(500).json({ error: 'Failed to fetch messages' })
  }
})

router.post('/conversations/message', async (req, res) => {
  try {
    const userId = getAuthUserId(req)
    if (!userId) return res.status(401).json({ error: 'Invalid token' })

    const { conversationId, content, type } = req.body
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Message content is required' })
    }

    const existing = await prisma.liveChatMessage.findFirst({
      where: { roomId: conversationId },
      orderBy: { createdAt: 'asc' },
      select: { userId: true },
    })
    const finalUserId = isAdmin(req) ? existing?.userId : userId
    if (!finalUserId) return res.status(404).json({ error: 'Conversation not found' })

    const message = await prisma.liveChatMessage.create({
      data: {
        sessionId: conversationId,
        roomId: conversationId,
        userId: finalUserId,
        adminId: isAdmin(req) ? userId : null,
        isFromUser: !isAdmin(req),
        message: content.trim(),
      },
      include: {
        user: { select: { id: true, username: true, email: true, phone: true, profile: { select: { fullName: true, firstName: true, lastName: true, avatar: true, mpesaPhone: true } } } },
        admin: { select: { id: true, username: true, email: true, phone: true, profile: { select: { fullName: true, firstName: true, lastName: true, avatar: true, mpesaPhone: true } } } },
      },
    })

    res.status(201).json({ success: true, message: serializeChatMessage(message, userId) })
  } catch (error) {
    console.error('Send message error:', error)
    res.status(500).json({ error: 'Failed to send message' })
  }
})

router.put('/conversations/:conversationId/read', async (req, res) => {
  try {
    const userId = getAuthUserId(req)
    const { conversationId } = req.params
    if (!userId) return res.status(401).json({ error: 'Invalid token' })

    await prisma.liveChatMessage.updateMany({
      where: {
        roomId: conversationId,
        ...(isAdmin(req) ? { isFromUser: true } : { userId, isFromUser: false }),
      },
      data: { isRead: true },
    })

    res.json({ success: true, message: 'Conversation marked as read' })
  } catch (error) {
    console.error('Mark as read error:', error)
    res.status(500).json({ error: 'Failed to mark as read' })
  }
})

router.put('/messages/:messageId/star', async (req, res) => {
  try {
    const userId = getAuthUserId(req)
    const { messageId } = req.params
    if (!userId) return res.status(401).json({ error: 'Invalid token' })

    res.json({ success: true, message: 'Message starred status updated' })
  } catch (error) {
    console.error('Star message error:', error)
    res.status(500).json({ error: 'Failed to star message' })
  }
})

router.put('/conversations/:conversationId/star', async (req, res) => {
  try {
    const userId = getAuthUserId(req)
    const { conversationId } = req.params
    if (!userId) return res.status(401).json({ error: 'Invalid token' })

    res.json({ success: true, message: 'Conversation starred status updated' })
  } catch (error) {
    console.error('Star conversation error:', error)
    res.status(500).json({ error: 'Failed to star conversation' })
  }
})

router.delete('/conversations/:conversationId', async (req, res) => {
  try {
    const userId = getAuthUserId(req)
    const { conversationId } = req.params
    if (!userId) return res.status(401).json({ error: 'Invalid token' })

    res.json({ success: true, message: 'Conversation deleted successfully' })
  } catch (error) {
    console.error('Delete conversation error:', error)
    res.status(500).json({ error: 'Failed to delete conversation' })
  }
})

export default router
