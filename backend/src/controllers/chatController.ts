import { Request, Response } from 'express'
import { asyncHandler, AppError, NotFoundError, ValidationError } from '../middleware'
import { prisma } from '../database'

// IMPORTANT: this project schema only defines `LiveChatMessage` (room-based chat).
// There is no `Conversation` / `Message` model in Prisma.

export const getConversations = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id

  if (!userId) {
    throw new AppError('User authentication required', 401, 'UNAUTHORIZED')
  }

  // Get all messages for this user, group by roomId, pick latest per room.
  const messages = await prisma.liveChatMessage.findMany({
    where: { userId },
    select: {
      id: true,
      roomId: true,
      message: true,
      createdAt: true,
      isFromUser: true,
      isRead: true,
      adminId: true,
      admin: {
        select: {
          id: true,
          email: true,
          profile: {
            select: { fullName: true, firstName: true, lastName: true, avatar: true }
          }
        }
      },
      user: {
        select: {
          id: true,
          email: true,
          profile: {
            select: { fullName: true, firstName: true, lastName: true, avatar: true }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  const byRoom = new Map<
    string,
    {
      id: string
      participantId: string
      participantName: string
      participantAvatar?: string
      participantType: 'admin' | 'support'
      lastMessage: string
      lastMessageTime: Date
      unreadCount: number
      isStarred: boolean
      messages: any[]
    }
  >()

  for (const msg of messages) {
    if (!byRoom.has(msg.roomId)) {
      const otherParticipant = msg.isFromUser ? msg.admin : msg.user

      byRoom.set(msg.roomId, {
        id: msg.roomId,
        participantId: otherParticipant?.id ?? '',
        participantName:
          otherParticipant?.profile?.fullName ??
          (otherParticipant?.profile?.firstName || otherParticipant?.profile?.lastName
            ? `${otherParticipant?.profile?.firstName ?? ''} ${otherParticipant?.profile?.lastName ?? ''}`.trim()
            : otherParticipant?.email ?? ''),
        participantAvatar: otherParticipant?.profile?.avatar,
        // Schema doesn't carry explicit support/farmer types for chat; treat admin presence as 'admin'.
        participantType: msg.adminId ? 'admin' : 'support',
        lastMessage: msg.message ?? '',
        lastMessageTime: msg.createdAt,
        unreadCount: 0,
        isStarred: false,
        messages: []
      })
    }

    const entry = byRoom.get(msg.roomId)!
    // Count unread where the message is NOT from user (i.e., from admin)
    if (!msg.isFromUser && !msg.isRead) entry.unreadCount += 1
  }

  const formattedConversations = Array.from(byRoom.values())
    .sort((a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime())
    .map((c) => ({
      id: c.id,
      participantId: c.participantId,
      participantName: c.participantName,
      participantAvatar: c.participantAvatar,
      participantType: c.participantType,
      lastMessage: c.lastMessage,
      lastMessageTime: c.lastMessageTime.toISOString(),
      unreadCount: c.unreadCount,
      isStarred: c.isStarred,
      messages: []
    }))

  res.json({
    success: true,
    conversations: formattedConversations
  })
})

export const getConversationMessages = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id
  const { conversationId } = req.params

  if (!userId) {
    throw new AppError('User authentication required', 401, 'UNAUTHORIZED')
  }

  // Ensure user has access by checking at least one message in that room.
  const exists = await prisma.liveChatMessage.findFirst({
    where: { roomId: conversationId, userId },
    select: { id: true }
  })

  if (!exists) {
    throw new NotFoundError('Conversation', conversationId)
  }

  const messages = await prisma.liveChatMessage.findMany({
    where: { roomId: conversationId, userId },
    select: {
      id: true,
      roomId: true,
      message: true,
      createdAt: true,
      isFromUser: true,
      isRead: true,
      adminId: true,
      admin: {
        select: {
          id: true,
          profile: { select: { fullName: true, firstName: true, lastName: true, avatar: true } }
        }
      },
      user: {
        select: {
          id: true,
          profile: { select: { fullName: true, firstName: true, lastName: true, avatar: true } }
        }
      }
    },
    orderBy: { createdAt: 'asc' }
  })

  const formattedMessages = messages.map((m) => {
    const sender = m.isFromUser ? m.user : m.admin

    return {
      id: m.id,
      senderId: sender?.id ?? '',
      senderName:
        sender?.profile?.fullName ??
        (sender?.profile?.firstName || sender?.profile?.lastName
          ? `${sender?.profile?.firstName ?? ''} ${sender?.profile?.lastName ?? ''}`.trim()
          : ''),
      senderAvatar: sender?.profile?.avatar,
      receiverId: '',
      content: m.message ?? '',
      timestamp: m.createdAt.toISOString(),
      isRead: m.isRead,
      isStarred: false,
      type: 'text',
      orderId: null,
      orderNumber: ''
    }
  })

  res.json({
    success: true,
    messages: formattedMessages
  })
})

/*
export const markConversationAsRead = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id
  const { conversationId } = req.params
  
  if (!userId) {
    throw new AppError('User authentication required', 401, 'UNAUTHORIZED')
  }

  // Verify user is part of conversation
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      participants: {
        some: { userId }
      }
    }
  })

  if (!conversation) {
    throw new NotFoundError('Conversation', conversationId)
  }

  // Mark all messages in conversation as read for this user
  await prisma.message.updateMany({
    where: {
      conversationId,
      senderId: { not: userId }, // Only mark messages from others as read
      isRead: false
    },
    data: { isRead: true }
  })

  res.json({
    success: true,
    message: 'Conversation marked as read'
  })
})
*/

/*
export const starMessage = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id
  const { messageId } = req.params
  
  if (!userId) {
    throw new AppError('User authentication required', 401, 'UNAUTHORIZED')
  }

  // Verify message exists and user has access
  const message = await prisma.message.findFirst({
    where: {
      id: messageId,
      conversation: {
        participants: {
          some: { userId }
        }
      }
    }
  })

  if (!message) {
    throw new NotFoundError('Message', messageId)
  }

  // Toggle star status (you might need a separate table for starred messages)
  // For now, we'll just return success
  res.json({
    success: true,
    message: 'Message starred status updated'
  })
})

export const deleteMessage = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id
  const { messageId } = req.params
  
  if (!userId) {
    throw new AppError('User authentication required', 401, 'UNAUTHORIZED')
  }

  // Verify message exists and user is the sender
  const message = await prisma.message.findFirst({
    where: {
      id: messageId,
      senderId: userId
    }
  })

  if (!message) {
    throw new NotFoundError('Message', messageId)
  }

  await prisma.message.delete({
    where: { id: messageId }
  })

  res.json({
    success: true,
    message: 'Message deleted successfully'
  })
})

export const starConversation = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id
  const { conversationId } = req.params
  
  if (!userId) {
    throw new AppError('User authentication required', 401, 'UNAUTHORIZED')
  }

  // Verify conversation exists and user has access
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      participants: {
        some: { userId }
      }
    }
  })

  if (!conversation) {
    throw new NotFoundError('Conversation', conversationId)
  }

  // Toggle star status (you might need a separate table for starred conversations)
  // For now, we'll just return success
  res.json({
    success: true,
    message: 'Conversation starred status updated'
  })
})

export const deleteConversation = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id
  const { conversationId } = req.params
  
  if (!userId) {
    throw new AppError('User authentication required', 401, 'UNAUTHORIZED')
  }

  // Verify conversation exists and user has access
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      participants: {
        some: { userId }
      }
    }
  })

  if (!conversation) {
    throw new NotFoundError('Conversation', conversationId)
  }

  // Delete all messages and the conversation
  await prisma.message.deleteMany({
    where: { conversationId }
  })

  await prisma.conversation.delete({
    where: { id: conversationId }
  })

  res.json({
    success: true,
    message: 'Conversation deleted successfully'
  })
})
*/
