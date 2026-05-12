import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const Role = {
  BUYER: 'BUYER',
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
  AGENT: 'AGENT',
  VENDOR: 'VENDOR',
  AFFILIATE: 'AFFILIATE',
  SUPPORT: 'SUPPORT',
  CONTENT_MANAGER: 'CONTENT_MANAGER',
  ANALYTICS_VIEWER: 'ANALYTICS_VIEWER',
  MODERATOR: 'MODERATOR',
} as const
type RoleValue = typeof Role[keyof typeof Role]

export interface AuthRequest extends Request {
  user?: {
    id: string
    name: string
    email: string
    role: 'admin' | 'buyer'
    roles: RoleValue[]
    phone?: string
    isVerified: boolean
  }
}

const primaryRole = (roles: RoleValue[]) => {
  if (roles.includes(Role.SUPER_ADMIN) || roles.includes(Role.ADMIN)) return 'admin'
  return 'buyer'
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '')

    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as {
      userId: string
      email: string
      role: string
      roles?: RoleValue[]
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        profile: true,
        security: true,
      },
    })

    if (!user || user.deletedAt || !user.security?.is_active) {
      return res.status(401).json({ error: 'Invalid token. User not found.' })
    }

    req.user = {
      id: user.id,
      name: user.profile?.fullName || [user.profile?.firstName, user.profile?.lastName].filter(Boolean).join(' ') || user.email,
      email: user.email,
      role: primaryRole(user.roles),
      roles: user.roles as RoleValue[],
      phone: user.phone || undefined,
      isVerified: Boolean(user.security?.isEmailVerified),
    }

    next()
  } catch (error) {
    res.status(401).json({ error: 'Invalid token.' })
  }
}

export const optionalAuthenticate = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '')
    if (!token) return next()

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as {
      userId: string
      email: string
      role: string
      roles?: RoleValue[]
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        profile: true,
        security: true,
      },
    })

    if (user && !user.deletedAt && user.security?.is_active) {
      req.user = {
        id: user.id,
        name: user.profile?.fullName || [user.profile?.firstName, user.profile?.lastName].filter(Boolean).join(' ') || user.email,
        email: user.email,
        role: primaryRole(user.roles),
        roles: user.roles as RoleValue[],
        phone: user.phone || undefined,
        isVerified: Boolean(user.security?.isEmailVerified),
      }
    }

    next()
  } catch {
    next()
  }
}

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Access denied. User not authenticated.' })
    }

    const allowed = roles.map((role) => role.toUpperCase())
    const userRoles = req.user.roles.map((role) => role.toUpperCase())

    if (!userRoles.some((role) => allowed.includes(role))) {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' })
    }

    next()
  }
}
