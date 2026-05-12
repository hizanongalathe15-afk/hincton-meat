import { Request, Response } from 'express'
import { asyncHandler } from '../middleware'
import { prisma } from '../config/prisma'

// Placeholder to satisfy router/type checks until the model/controller contracts are aligned.

export const getOnlineUsers = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ success: true, data: [], count: 0 })
})

export const getOfflineUsers = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ success: true, data: [], count: 0 })
})

export const getUserStats = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ success: true, data: {} })
})

export const getOnlineUserCount = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ success: true, data: { onlineUsers: 0 } })
})

export const updateOnlineStatus = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ success: true, data: {} })
})

// Named exports expected by `src/controllers/index.ts`
export const updateUserOnlineStatus = updateOnlineStatus

export const markOffline = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ success: true, data: {} })
})

export const markUserOffline = markOffline

export const trackUserActivity = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ success: true, data: {} })
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

  res.json({
    success: true,
    sessions: sessions.map((session) => ({
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
      isOnline: !session.isRevoked && session.expiresAt > new Date() && session.lastActivity >= cutoff,
      lastActivity: session.lastActivity,
      sessionStart: session.createdAt,
      duration: Math.max(0, Date.now() - session.createdAt.getTime()),
    })),
  })
})

export const getUserSessionDetails = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ success: true, data: {} })
})

export const updateLastSeen = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ success: true, data: {} })
})

export const cleanupOldSessions = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ success: true, data: { deletedCount: 0 } })
})

