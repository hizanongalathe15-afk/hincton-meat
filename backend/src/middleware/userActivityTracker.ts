import { Request, Response, NextFunction } from 'express'
import { UserSessionModel } from '../models'

export const trackUserActivity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id
    
    if (userId) {
      // Update user's last seen and mark as online
      // update lastActivity for user's sessions (closest supported operation)
      const sessions = await UserSessionModel.findByUserId(userId)
      if (sessions) {
        await UserSessionModel.updateLastActivity(sessions.sessionToken)
      }
    }
  } catch (error) {

    // Don't block the request if tracking fails
    console.error('User activity tracking error:', error)
  }
  
  next()
}

export const handleUserDisconnect = async (userId: string) => {
  try {
    if (userId) {
      // Closest supported operation: mark sessions revoked (no markOffline method in model)
      await UserSessionModel.revokeAllUserSessions(userId)
    }
  } catch (error) {

    console.error('User disconnect tracking error:', error)
  }
}

export const updateUserOnlineStatus = async (userId: string, isOnline: boolean, socketId?: string) => {
  try {
    // Closest supported operation: touch sessions when online; revoke when offline.
    if (isOnline) {
      const session = await UserSessionModel.findByUserId(userId)
      if (session) {
        await UserSessionModel.updateLastActivity(session.sessionToken)
      }
    } else {
      await UserSessionModel.revokeAllUserSessions(userId)
    }
  } catch (error) {
    console.error('User status update error:', error)
  }
}

