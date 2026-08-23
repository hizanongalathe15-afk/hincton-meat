import express from 'express'
import { z } from 'zod'
import { prisma } from '../config/prisma'
import { getSocketIO } from '../utils/socketHolder'

const router = express.Router()

const DM_EDIT_DELETE_WINDOW_MS = 15 * 60 * 1000
const MESSAGE_MAX_LENGTH = 2000

const normalizePair = (a: string, b: string): [string, string] => (a < b ? [a, b] : [b, a])

const displayName = (user: any) => {
  return user?.profile?.fullName ||
    [user?.profile?.firstName, user?.profile?.lastName].filter(Boolean).join(' ') ||
    user?.username ||
    user?.email ||
    'Unknown user'
}

const userSelect = {
  id: true,
  username: true,
  email: true,
  phone: true,
  profile: {
    select: {
      fullName: true,
      firstName: true,
      lastName: true,
      avatar: true,
      locationLatitude: true,
      locationLongitude: true,
      locationLabel: true,
    },
  },
}

let officialCache: { id: string; email: string; at: number } | null = null

const getOfficialAccount = async () => {
  if (officialCache && Date.now() - officialCache.at < 60_000) return officialCache
  const email = process.env.OFFICIAL_ACCOUNT_EMAIL
  let user = email
    ? await prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } }, select: { id: true, email: true } })
    : null
  if (!user) {
    user = await prisma.user.findFirst({
      where: { roles: { has: 'ADMIN' }, deletedAt: null },
      orderBy: { createdAt: 'asc' },
      select: { id: true, email: true },
    })
  }
  officialCache = user ? { id: user.id, email: user.email, at: Date.now() } : null
  return officialCache
}

const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const toRad = (value: number) => (value * Math.PI) / 180
  const earthRadiusKm = 6371
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const serializeDirectMessage = (message: any) => ({
  id: message.id,
  conversationId: message.conversationId,
  senderId: message.senderId,
  senderName: displayName(message.sender),
  senderAvatar: message.sender?.profile?.avatar || null,
  text: message.deletedAt ? '' : message.text,
  deleted: Boolean(message.deletedAt),
  replyToId: message.replyToId,
  editedAt: message.editedAt,
  createdAt: message.createdAt,
})

const requireParticipant = async (conversationId: string, userId: string) => {
  const conversation = await prisma.directConversation.findUnique({
    where: { id: conversationId },
    include: { userA: { select: userSelect }, userB: { select: userSelect } },
  })
  if (!conversation || (conversation.userAId !== userId && conversation.userBId !== userId)) return null
  return conversation
}

router.get('/conversations', async (req: any, res) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ error: 'Authentication required' })

    const official = await getOfficialAccount()
    const conversations = await prisma.directConversation.findMany({
      where: { OR: [{ userAId: userId }, { userBId: userId }] },
      include: { userA: { select: userSelect }, userB: { select: userSelect } },
      orderBy: { lastMessageAt: 'desc' },
      take: 100,
    })

    const items = []
    for (const conversation of conversations) {
      const isUserA = conversation.userAId === userId
      const hiddenAt = isUserA ? conversation.userAHiddenAt : conversation.userBHiddenAt
      if (conversation.lastMessageAt && hiddenAt && conversation.lastMessageAt <= hiddenAt) continue

      const other = isUserA ? conversation.userB : conversation.userA
      const lastReadAt = isUserA ? conversation.userALastReadAt : conversation.userBLastReadAt

      const [unreadCount, lastMessage] = await Promise.all([
        prisma.directMessage.count({
          where: {
            conversationId: conversation.id,
            senderId: { not: userId },
            deletedAt: null,
            ...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {}),
            ...(hiddenAt ? { createdAt: { gt: hiddenAt } } : {}),
          },
        }),
        prisma.directMessage.findFirst({
          where: { conversationId: conversation.id, createdAt: hiddenAt ? { gt: hiddenAt } : undefined },
          orderBy: { createdAt: 'desc' },
          include: { sender: { select: userSelect } },
        }),
      ])

      items.push({
        id: conversation.id,
        participantId: other.id,
        participantName: displayName(other),
        participantAvatar: other.profile?.avatar || null,
        participantUsername: other.username || null,
        isOfficial: official?.id === other.id,
        unreadCount,
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              text: lastMessage.deletedAt ? '' : lastMessage.text,
              deleted: Boolean(lastMessage.deletedAt),
              senderId: lastMessage.senderId,
              createdAt: lastMessage.createdAt,
            }
          : null,
        updatedAt: conversation.lastMessageAt || conversation.createdAt,
      })
    }

    items.sort((a, b) => {
      if (a.isOfficial !== b.isOfficial) return a.isOfficial ? -1 : 1
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })

    res.json({ conversations: items, officialAccountId: official?.id || null })
  } catch (error) {
    console.error('List DM conversations error:', error)
    res.status(500).json({ error: 'Failed to load conversations' })
  }
})

router.post('/conversations', async (req: any, res) => {
  try {
    const userId = req.user?.id
    const { userId: targetId } = z.object({ userId: z.string().min(1) }).parse(req.body || {})
    if (!userId) return res.status(401).json({ error: 'Authentication required' })
    if (targetId === userId) return res.status(400).json({ error: 'You cannot message yourself' })

    const target = await prisma.user.findFirst({
      where: { id: targetId, deletedAt: null },
      select: userSelect,
    })
    if (!target) return res.status(404).json({ error: 'User not found' })

    const [userAId, userBId] = normalizePair(userId, targetId)
    const conversation = await prisma.directConversation.upsert({
      where: { userAId_userBId: { userAId, userBId } },
      update: {},
      create: { userAId, userBId },
    })

    const official = await getOfficialAccount()
    res.json({
      conversation: {
        id: conversation.id,
        participantId: target.id,
        participantName: displayName(target),
        participantAvatar: target.profile?.avatar || null,
        participantUsername: target.username || null,
        isOfficial: official?.id === target.id,
      },
    })
  } catch (error: any) {
    if (error?.name === 'ZodError') return res.status(400).json({ error: 'userId is required' })
    console.error('Open DM conversation error:', error)
    res.status(500).json({ error: 'Failed to open conversation' })
  }
})

router.get('/conversations/:id/messages', async (req: any, res) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ error: 'Authentication required' })

    const conversation = await requireParticipant(req.params.id, userId)
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' })

    const isUserA = conversation.userAId === userId
    const hiddenAt = isUserA ? conversation.userAHiddenAt : conversation.userBHiddenAt
    const before = typeof req.query.before === 'string' ? new Date(req.query.before) : null
    const limit = Math.min(Number(req.query.limit) || 50, 100)

    const messages = await prisma.directMessage.findMany({
      where: {
        conversationId: conversation.id,
        ...(before && !isNaN(before.getTime()) ? { createdAt: { lt: before } } : {}),
        ...(hiddenAt ? { createdAt: { gt: hiddenAt } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { sender: { select: userSelect } },
    })

    res.json({ messages: messages.reverse().map(serializeDirectMessage) })
  } catch (error) {
    console.error('List DM messages error:', error)
    res.status(500).json({ error: 'Failed to load messages' })
  }
})

router.post('/messages', async (req: any, res) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ error: 'Authentication required' })

    const { conversationId, text, replyToId } = z
      .object({
        conversationId: z.string().min(1),
        text: z.string().trim().min(1).max(MESSAGE_MAX_LENGTH),
        replyToId: z.string().optional(),
      })
      .parse(req.body || {})

    const conversation = await requireParticipant(conversationId, userId)
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' })

    const recipientId = conversation.userAId === userId ? conversation.userBId : conversation.userAId
    const message = await prisma.directMessage.create({
      data: {
        conversationId,
        senderId: userId,
        text,
        replyToId: replyToId || null,
      },
      include: { sender: { select: userSelect } },
    })

    await prisma.directConversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: message.createdAt, userAHiddenAt: null, userBHiddenAt: null },
    })

    const payload = serializeDirectMessage(message)
    const io = getSocketIO()
    io?.to(`dm-${conversationId}`).emit('dm:message', payload)
    io?.to(`user-${recipientId}`).emit('dm:new', {
      conversationId,
      senderId: userId,
      senderName: payload.senderName,
      text: payload.text,
      createdAt: payload.createdAt,
    })

    res.status(201).json({ message: payload })
  } catch (error: any) {
    if (error?.name === 'ZodError') return res.status(400).json({ error: 'A non-empty message is required' })
    console.error('Send DM error:', error)
    res.status(500).json({ error: 'Failed to send message' })
  }
})

router.put('/messages/:id', async (req: any, res) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ error: 'Authentication required' })
    const { text } = z.object({ text: z.string().trim().min(1).max(MESSAGE_MAX_LENGTH) }).parse(req.body || {})

    const message = await prisma.directMessage.findUnique({ where: { id: req.params.id } })
    if (!message || message.senderId !== userId) return res.status(404).json({ error: 'Message not found' })
    if (message.deletedAt) return res.status(400).json({ error: 'Cannot edit a deleted message' })
    if (Date.now() - new Date(message.createdAt).getTime() > DM_EDIT_DELETE_WINDOW_MS) {
      return res.status(400).json({ error: 'Messages can only be edited within 15 minutes' })
    }

    const updated = await prisma.directMessage.update({
      where: { id: message.id },
      data: { text, editedAt: new Date() },
      include: { sender: { select: userSelect } },
    })

    const payload = serializeDirectMessage(updated)
    getSocketIO()?.to(`dm-${message.conversationId}`).emit('dm:message-edited', payload)
    res.json({ message: payload })
  } catch (error: any) {
    if (error?.name === 'ZodError') return res.status(400).json({ error: 'A non-empty message is required' })
    console.error('Edit DM error:', error)
    res.status(500).json({ error: 'Failed to edit message' })
  }
})

router.delete('/messages/:id', async (req: any, res) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ error: 'Authentication required' })

    const message = await prisma.directMessage.findUnique({ where: { id: req.params.id } })
    if (!message || message.senderId !== userId) return res.status(404).json({ error: 'Message not found' })
    if (Date.now() - new Date(message.createdAt).getTime() > DM_EDIT_DELETE_WINDOW_MS) {
      return res.status(400).json({ error: 'Messages can only be deleted within 15 minutes' })
    }

    await prisma.directMessage.update({ where: { id: message.id }, data: { deletedAt: new Date() } })
    getSocketIO()?.to(`dm-${message.conversationId}`).emit('dm:message-deleted', {
      conversationId: message.conversationId,
      messageId: message.id,
    })
    res.json({ success: true })
  } catch (error) {
    console.error('Delete DM error:', error)
    res.status(500).json({ error: 'Failed to delete message' })
  }
})

router.put('/conversations/:id/read', async (req: any, res) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ error: 'Authentication required' })

    const conversation = await requireParticipant(req.params.id, userId)
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' })

    const isUserA = conversation.userAId === userId
    await prisma.directConversation.update({
      where: { id: conversation.id },
      data: isUserA ? { userALastReadAt: new Date() } : { userBLastReadAt: new Date() },
    })
    res.json({ success: true })
  } catch (error) {
    console.error('Mark DM read error:', error)
    res.status(500).json({ error: 'Failed to mark conversation read' })
  }
})

router.delete('/conversations/:id', async (req: any, res) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ error: 'Authentication required' })

    const conversation = await requireParticipant(req.params.id, userId)
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' })

    const isUserA = conversation.userAId === userId
    await prisma.directConversation.update({
      where: { id: conversation.id },
      data: isUserA ? { userAHiddenAt: new Date() } : { userBHiddenAt: new Date() },
    })
    res.json({ success: true })
  } catch (error) {
    console.error('Delete DM conversation error:', error)
    res.status(500).json({ error: 'Failed to delete conversation' })
  }
})

router.get('/users/search', async (req: any, res) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ error: 'Authentication required' })
    const query = String(req.query.q || '').trim()
    if (query.length < 2) return res.json({ users: [] })

    const phoneCandidate = query.replace(/[^\d+]/g, '')
    const isPhoneSearch = phoneCandidate.length >= 8 && /^[+\d]+$/.test(query)

    const users = await prisma.user.findMany({
      where: {
        id: { not: userId },
        deletedAt: null,
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { profile: { fullName: { contains: query, mode: 'insensitive' } } },
          { profile: { firstName: { contains: query, mode: 'insensitive' } } },
          { profile: { lastName: { contains: query, mode: 'insensitive' } } },
          ...(isPhoneSearch ? [{ phone: phoneCandidate }] : []),
        ],
      },
      select: userSelect,
      take: 20,
    })

    res.json({
      users: users.map((user) => ({
        id: user.id,
        username: user.username || null,
        name: displayName(user),
        avatar: user.profile?.avatar || null,
        phoneMatch: isPhoneSearch && user.phone === phoneCandidate,
      })),
    })
  } catch (error) {
    console.error('DM user search error:', error)
    res.status(500).json({ error: 'Search failed' })
  }
})

router.get('/users/suggestions', async (req: any, res) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ error: 'Authentication required' })
    const limit = Math.min(Number(req.query.limit) || 12, 30)

    const [myProfile, existing] = await Promise.all([
      prisma.userProfile.findUnique({ where: { userId }, select: { locationLatitude: true, locationLongitude: true } }),
      prisma.directConversation.findMany({
        where: { OR: [{ userAId: userId }, { userBId: userId }] },
        select: { userAId: true, userBId: true },
      }),
    ])

    const chattedWith = new Set(existing.flatMap((conversation) => [conversation.userAId, conversation.userBId]))
    chattedWith.add(userId)

    const candidates = await prisma.user.findMany({
      where: {
        id: { notIn: Array.from(chattedWith) },
        deletedAt: null,
        profile: { locationLatitude: { not: null }, locationLongitude: { not: null } },
      },
      select: userSelect,
      take: 100,
    })

    const withDistance = candidates.map((user) => ({
      id: user.id,
      username: user.username || null,
      name: displayName(user),
      avatar: user.profile?.avatar || null,
      locationLabel: user.profile?.locationLabel || null,
      distanceKm:
        myProfile?.locationLatitude != null && myProfile.locationLongitude != null
          ? Math.round(
              haversineKm(
                myProfile.locationLatitude,
                myProfile.locationLongitude,
                user.profile!.locationLatitude!,
                user.profile!.locationLongitude!,
              ) * 10,
            ) / 10
          : null,
    }))

    withDistance.sort((a, b) => {
      if (a.distanceKm === null && b.distanceKm === null) return 0
      if (a.distanceKm === null) return 1
      if (b.distanceKm === null) return -1
      return a.distanceKm - b.distanceKm
    })

    res.json({ users: withDistance.slice(0, limit) })
  } catch (error) {
    console.error('DM suggestions error:', error)
    res.status(500).json({ error: 'Failed to load suggestions' })
  }
})

router.get('/official', async (_req, res) => {
  try {
    const official = await getOfficialAccount()
    res.json({ officialAccountId: official?.id || null })
  } catch {
    res.json({ officialAccountId: null })
  }
})

export default router
