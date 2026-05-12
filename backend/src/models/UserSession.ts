import { prisma } from '../database'

export interface IUserSession {
  id: string
  userId: string
  sessionToken: string
  refreshToken?: string | null
  ipAddress?: string | null
  userAgent?: string | null
  deviceName?: string | null
  deviceType?: string | null
  expiresAt: Date
  lastActivity: Date
  isRevoked: boolean
  createdAt: Date
}

export const UserSessionModel = {
  create: async (sessionData: Omit<IUserSession, 'id' | 'createdAt'>): Promise<IUserSession> => {
    const session = await prisma.userSession.create({
      data: {
        userId: sessionData.userId,
        sessionToken: sessionData.sessionToken,
        refreshToken: sessionData.refreshToken,
        ipAddress: sessionData.ipAddress,
        userAgent: sessionData.userAgent,
        deviceName: sessionData.deviceName,
        deviceType: sessionData.deviceType as any,
        expiresAt: sessionData.expiresAt,
        lastActivity: sessionData.lastActivity,
        isRevoked: sessionData.isRevoked ?? false
      }
    })
    return session
  },

  findByUserId: async (userId: string): Promise<IUserSession | null> => {
    const session = await prisma.userSession.findFirst({
      where: { userId },
      orderBy: { lastActivity: 'desc' }
    })
    return session
  },

  findBySessionToken: async (sessionToken: string): Promise<IUserSession | null> => {
    const session = await prisma.userSession.findUnique({
      where: { sessionToken }
    })
    return session
  },

  updateLastActivity: async (sessionToken: string): Promise<IUserSession | null> => {
    const session = await prisma.userSession.update({
      where: { sessionToken },
      data: { lastActivity: new Date() }
    })
    return session
  },

  revokeSession: async (sessionToken: string): Promise<IUserSession | null> => {
    const session = await prisma.userSession.update({
      where: { sessionToken },
      data: { isRevoked: true }
    })
    return session
  },

  revokeAllUserSessions: async (userId: string): Promise<number> => {
    const result = await prisma.userSession.updateMany({
      where: { userId },
      data: { isRevoked: true }
    })
    return result.count
  },

  findActiveSession: async (sessionToken: string): Promise<IUserSession | null> => {
    const session = await prisma.userSession.findUnique({
      where: { sessionToken }
    })
    
    // Check if session is not revoked and not expired
    if (session && !session.isRevoked && new Date() < session.expiresAt) {
      return session
    }
    return null
  },

  getUserSessions: async (userId: string): Promise<IUserSession[]> => {
    const sessions = await prisma.userSession.findMany({
      where: { userId },
      orderBy: { lastActivity: 'desc' }
    })
    return sessions
  },

  getActiveSessions: async (userId: string): Promise<IUserSession[]> => {
    const now = new Date()
    const sessions = await prisma.userSession.findMany({
      where: {
        userId,
        isRevoked: false,
        expiresAt: { gt: now }
      },
      orderBy: { lastActivity: 'desc' }
    })
    return sessions
  },

  cleanupExpiredSessions: async (): Promise<number> => {
    const result = await prisma.userSession.deleteMany({
      where: {
        expiresAt: { lt: new Date() }
      }
    })
    return result.count
  },

  getSessionStats: async (): Promise<{
    totalActiveSessions: number
    totalRevokedSessions: number
    expiredSessions: number
  }> => {
    const now = new Date()
    const [activeSessions, revokedSessions, expiredSessions] = await Promise.all([
      prisma.userSession.count({
        where: {
          isRevoked: false,
          expiresAt: { gt: now }
        }
      }),
      prisma.userSession.count({
        where: { isRevoked: true }
      }),
      prisma.userSession.count({
        where: { expiresAt: { lt: now } }
      })
    ])

    return {
      totalActiveSessions: activeSessions,
      totalRevokedSessions: revokedSessions,
      expiredSessions: expiredSessions
    }
  },

  deleteUserSession: async (userId: string): Promise<void> => {
    await prisma.userSession.deleteMany({
      where: { userId }
    })
  }
}
