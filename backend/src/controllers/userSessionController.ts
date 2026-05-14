import { Request, Response } from 'express'
import { asyncHandler } from '../middleware'
import { prisma } from '../config/prisma'

const ONLINE_WINDOW_MS = 5 * 60 * 1000
const AWAY_WINDOW_MS = 15 * 60 * 1000

const statusFor = (session: any) => {
  if (session.isRevoked || session.expiresAt <= new Date()) return 'offline'
  const age = Date.now() - session.lastActivity.getTime()
  if (age <= ONLINE_WINDOW_MS) return 'online'
  if (age <= AWAY_WINDOW_MS) return 'away'
  return 'offline'
}

const serializeSession = (session: any) => ({
  id: session.id,
  userId: session.userId,
  user: session.user,
  deviceInfo: {
    userAgent: session.userAgent || '',
    ipAddress: session.ipAddress || '',
    deviceType: session.deviceType || 'UNKNOWN',
    browser: session.deviceName || 'Browser',
    os: session.deviceType || 'Unknown OS',
    location: session.ipAddress || '',
  },
  status: statusFor(session),
  isOnline: statusFor(session) === 'online',
  isAway: statusFor(session) === 'away',
  isRevoked: session.isRevoked,
  lastActivity: session.lastActivity,
  sessionStart: session.createdAt,
  expiresAt: session.expiresAt,
  duration: Math.max(0, Date.now() - session.createdAt.getTime()),
})

const sessionInclude = {
  user: {
    select: {
      id: true,
      email: true,
      phone: true,
      username: true,
      roles: true,
      profile: {
        select: {
          firstName: true,
          lastName: true,
          fullName: true,
          avatar: true,
          mpesaPhone: true,
        },
      },
    },
  },
} as const

export const getOnlineUsers = asyncHandler(async (_req: Request, res: Response) => {
  const sessions = await prisma.userSession.findMany({
    where: {
      isRevoked: false,
      expiresAt: { gt: new Date() },
      lastActivity: { gte: new Date(Date.now() - ONLINE_WINDOW_MS) },
    },
    include: sessionInclude,
    orderBy: { lastActivity: 'desc' },
    take: 100,
  })
  res.json({ success: true, data: sessions.map(serializeSession), count: sessions.length })
})

export const getOfflineUsers = asyncHandler(async (_req: Request, res: Response) => {
  const sessions = await prisma.userSession.findMany({
    where: {
      OR: [
        { isRevoked: true },
        { expiresAt: { lte: new Date() } },
        { lastActivity: { lt: new Date(Date.now() - AWAY_WINDOW_MS) } },
      ],
    },
    include: sessionInclude,
    orderBy: { lastActivity: 'desc' },
    take: 100,
  })
  res.json({ success: true, data: sessions.map(serializeSession), count: sessions.length })
})

export const getUserStats = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id
  if (!userId) return res.status(401).json({ success: false, error: 'Authentication required' })

  const [total, active, online] = await Promise.all([
    prisma.userSession.count({ where: { userId } }),
    prisma.userSession.count({ where: { userId, isRevoked: false, expiresAt: { gt: new Date() } } }),
    prisma.userSession.count({ where: { userId, isRevoked: false, expiresAt: { gt: new Date() }, lastActivity: { gte: new Date(Date.now() - ONLINE_WINDOW_MS) } } }),
  ])
  res.json({ success: true, data: { totalDevices: total, activeDevices: active, onlineDevices: online } })
})

export const getOnlineUserCount = asyncHandler(async (_req: Request, res: Response) => {
  const onlineUsers = await prisma.userSession.groupBy({
    by: ['userId'],
    where: {
      isRevoked: false,
      expiresAt: { gt: new Date() },
      lastActivity: { gte: new Date(Date.now() - ONLINE_WINDOW_MS) },
    },
  })
  res.json({ success: true, data: { onlineUsers: onlineUsers.length } })
})

export const updateOnlineStatus = asyncHandler(async (req: Request, res: Response) => {
  const { userId, sessionId } = req.body || {}
  if (!userId && !sessionId) return res.status(400).json({ success: false, error: 'userId or sessionId is required' })

  await prisma.userSession.updateMany({
    where: {
      ...(sessionId ? { id: String(sessionId) } : { userId: String(userId) }),
      isRevoked: false,
      expiresAt: { gt: new Date() },
    },
    data: { lastActivity: new Date() },
  })
  res.json({ success: true, data: { status: 'online' } })
})

// Named exports expected by `src/controllers/index.ts`
export const updateUserOnlineStatus = updateOnlineStatus

export const markOffline = asyncHandler(async (req: Request, res: Response) => {
  const { userId, sessionId } = req.body || {}
  if (!userId && !sessionId) return res.status(400).json({ success: false, error: 'userId or sessionId is required' })

  await prisma.userSession.updateMany({
    where: sessionId ? { id: String(sessionId) } : { userId: String(userId) },
    data: { lastActivity: new Date(Date.now() - AWAY_WINDOW_MS - 1000) },
  })
  res.json({ success: true, data: { status: 'offline' } })
})

export const markUserOffline = markOffline

export const trackUserActivity = asyncHandler(async (req: Request, res: Response) => {
  const { userId, sessionId } = req.body || {}
  if (!userId && !sessionId) return res.status(400).json({ success: false, error: 'userId or sessionId is required' })

  const result = await prisma.userSession.updateMany({
    where: {
      ...(sessionId ? { id: String(sessionId) } : { userId: String(userId) }),
      isRevoked: false,
      expiresAt: { gt: new Date() },
    },
    data: { lastActivity: new Date() },
  })
  res.json({ success: true, data: { updated: result.count } })
})

export const getRealTimeUserStats = asyncHandler(async (_req: Request, res: Response) => {
  const cutoff = new Date(Date.now() - 15 * 60 * 1000)
  const sessions = await prisma.userSession.findMany({
    where: {
      user: {
        roles: { hasSome: ['ADMIN', 'SUPER_ADMIN'] as any },
        deletedAt: null,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          username: true,
          profile: {
            select: {
              firstName: true,
              lastName: true,
              fullName: true,
              avatar: true,
            },
          },
        },
      },
    },
    orderBy: { lastActivity: 'desc' },
    take: 50,
  })

  res.json({ success: true, sessions: sessions.map(serializeSession) })
})

export const getUserSessionDetails = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params
  const sessions = await prisma.userSession.findMany({
    where: { userId },
    include: sessionInclude,
    orderBy: { lastActivity: 'desc' },
    take: 50,
  })
  res.json({
    success: true,
    data: {
      userId,
      activeCount: sessions.filter((session) => !session.isRevoked && session.expiresAt > new Date()).length,
      sessions: sessions.map(serializeSession),
    },
  })
})

export const updateLastSeen = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id || req.body?.userId
  if (!userId) return res.status(400).json({ success: false, error: 'userId is required' })
  await prisma.userSession.updateMany({
    where: { userId, isRevoked: false, expiresAt: { gt: new Date() } },
    data: { lastActivity: new Date() },
  })
  res.json({ success: true, data: { userId, lastSeen: new Date() } })
})

export const cleanupOldSessions = asyncHandler(async (_req: Request, res: Response) => {
  const result = await prisma.userSession.updateMany({
    where: {
      isRevoked: false,
      OR: [
        { expiresAt: { lte: new Date() } },
        { lastActivity: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      ],
    },
    data: { isRevoked: true },
  })
  res.json({ success: true, data: { deletedCount: result.count } })
})
