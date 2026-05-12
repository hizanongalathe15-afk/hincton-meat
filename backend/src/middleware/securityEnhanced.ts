import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../config/prisma'

interface AuthRequest extends Request {
  user?: {
    id: string
    name: string
    email: string
    role: string
    phone?: string
    isVerified: boolean
  }
}

// Enhanced JWT verification with security checks
export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
      return res.status(401).json({ message: 'Access token required' })
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    
    // Check if user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        roles: true,
        username: true,
        security: { select: { isEmailVerified: true } }
      }
    })

    if (!user) {
      return res.status(401).json({ message: 'User not found' })
    }

    if (!user.security.isEmailVerified) {
      return res.status(401).json({ message: 'Account not verified' })
    }

    // Add user info to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.roles.includes('ADMIN') || user.roles.includes('SUPER_ADMIN') ? 'admin' : 'user',
      name: user.username,
      phone: (user as any).phone || undefined,
      isVerified: user.security.isEmailVerified
    }

    next()
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(403).json({ message: 'Invalid token' })
    }
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(403).json({ message: 'Token expired' })
    }
    console.error('Authentication error:', error)
    return res.status(500).json({ message: 'Authentication error' })
  }
}

// Role-based access control
export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' })
    }

    next()
  }
}

// Admin-only access
export const requireAdmin = requireRole(['ADMIN'])

// Rate limiting for sensitive endpoints
const requestCounts = new Map()

export const rateLimit = (maxRequests: number, windowMs: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip + ':' + req.path
    const now = Date.now()
    const windowStart = now - windowMs

    // Clean old entries
    for (const [k, v] of requestCounts.entries()) {
      if (v.timestamp < windowStart) {
        requestCounts.delete(k)
      }
    }

    // Check current count
    const current = requestCounts.get(key)
    if (current && current.count >= maxRequests && current.timestamp > windowStart) {
      return res.status(429).json({ 
        message: 'Too many requests',
        retryAfter: Math.ceil((current.timestamp + windowMs - now) / 1000)
      })
    }

    // Update count
    if (current && current.timestamp > windowStart) {
      requestCounts.set(key, { count: current.count + 1, timestamp: now })
    } else {
      requestCounts.set(key, { count: 1, timestamp: now })
    }

    next()
  }
}

// Input validation and sanitization
export const validateInput = (req: Request, res: Response, next: NextFunction) => {
  // Check for common attack patterns
  const suspiciousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /eval\s*\(/gi,
    /exec\s*\(/gi
  ]

  const checkValue = (value: any): boolean => {
    if (typeof value === 'string') {
      return suspiciousPatterns.some(pattern => pattern.test(value))
    }
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(v => checkValue(v))
    }
    return false
  }

  // Check body, query, and params
  if (checkValue(req.body) || checkValue(req.query) || checkValue(req.params)) {
    return res.status(400).json({ message: 'Invalid input detected' })
  }

  next()
}

// CSRF protection for state-changing requests
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const csrfToken = req.headers['x-csrf-token']
    const sessionToken = (req as any).session?.csrfToken

    if (!csrfToken || csrfToken !== sessionToken) {
      return res.status(403).json({ message: 'CSRF token mismatch' })
    }
  }

  next()
}

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY')
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff')
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block')
  
  // Force HTTPS
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  
  // Content Security Policy
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' data:; " +
    "connect-src 'self' https:; " +
    "frame-ancestors 'none';"
  )

  next()
}

// Session management
export const sessionMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Generate session ID if not exists
  if (!(req as any).sessionID) {
    (req as any).sessionID = Math.random().toString(36).substring(2, 15)
  }

  // Set session cookie with security flags
  res.cookie('sessionId', (req as any).sessionID, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  })

  next()
}

// Password strength validation
export const validatePasswordStrength = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }

  // Check for common passwords
  const commonPasswords = ['password', '12345678', 'qwerty', 'admin', 'letmein']
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Account lockout after failed attempts
const failedAttempts = new Map<string, { count: number; lockUntil: number }>()

export const accountLockout = (maxAttempts: number = 5, lockoutDuration: number = 15 * 60 * 1000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const email = req.body.email || req.query.email
    
    if (!email) {
      return next()
    }

    const now = Date.now()
    const attempts = failedAttempts.get(email)

    if (attempts && attempts.lockUntil > now) {
      const remainingTime = Math.ceil((attempts.lockUntil - now) / 1000 / 60)
      return res.status(429).json({ 
        message: `Account locked. Try again in ${remainingTime} minutes` 
      })
    }

    next()
  }
}

export const recordFailedAttempt = (email: string) => {
  const now = Date.now()
  const attempts = failedAttempts.get(email) || { count: 0, lockUntil: 0 }
  
  attempts.count++
  
  if (attempts.count >= 5) {
    attempts.lockUntil = now + (15 * 60 * 1000) // 15 minutes
  }
  
  failedAttempts.set(email, attempts)
}

export const clearFailedAttempts = (email: string) => {
  failedAttempts.delete(email)
}
