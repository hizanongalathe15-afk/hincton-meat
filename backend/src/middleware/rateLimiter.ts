import { Request, Response, NextFunction } from 'express'
import { prisma } from '../database'

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
    requests: Array<{ timestamp: number; ip: string; path: string }>
  }
}

class MemoryRateLimitStore {
  private store: RateLimitStore = {}

  get(key: string) {
    return this.store[key] || { count: 0, resetTime: Date.now(), requests: [] }
  }

  set(key: string, value: RateLimitStore[string]) {
    this.store[key] = value
  }

  cleanup() {
    const now = Date.now()
    Object.keys(this.store).forEach(key => {
      if (this.store[key].resetTime < now) {
        delete this.store[key]
      }
    })
  }
}

const store = new MemoryRateLimitStore()

export interface RateLimitOptions {
  windowMs?: number
  maxRequests?: number
  message?: string
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  keyGenerator?: (req: Request) => string
}

export const createRateLimiter = (options: RateLimitOptions = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    maxRequests = 100,
    message = 'Too many requests, please try again later.',
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    keyGenerator = (req) => `rate_limit:${req.ip}:${req.path}`
  } = options

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = keyGenerator(req)
      const now = Date.now()
      
      // Cleanup expired entries
      store.cleanup()
      
      let record = store.get(key)
      
      // Reset if window expired
      if (now > record.resetTime) {
        record = {
          count: 0,
          resetTime: now + windowMs,
          requests: []
        }
      }
      
      // Filter requests based on success/failure if specified
      let filteredRequests = record.requests
      if (skipSuccessfulRequests || skipFailedRequests) {
        filteredRequests = record.requests.filter(req => {
          // This would need to be enhanced with actual response tracking
          return true // For now, include all requests
        })
      }
      
      // Count requests in current window
      const requestsInWindow = filteredRequests.filter(req => 
        req.timestamp > now - windowMs
      ).length
      
      // Update record
      record.requests.push({ timestamp: now, ip: req.ip || '', path: req.path })
      record.count = requestsInWindow + 1
      
      store.set(key, record)
      
      // Set rate limit headers
      const resetTime = record.resetTime
      res.set({
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': Math.max(0, maxRequests - record.count).toString(),
        'X-RateLimit-Reset': new Date(resetTime).toISOString()
      })
      
      // Check if limit exceeded
      if (record.count > maxRequests) {
        // Log rate limit violation
        await prisma.rateLimitLog.create({
          data: {
            ipAddress: req.ip,
            path: req.path,
            limitType: 'general',
            retryAfter: resetTime,
            blocked: true
          }
        })
        
        return res.status(429).json({
          error: 'Rate limit exceeded',
          message,
          retryAfter: resetTime
        })
      }
      
      next()
    } catch (error) {
      console.error('Rate limiter error:', error)
      next()
    }
  }
}

// Specific rate limiters for different endpoints
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 login attempts per 15 minutes
  message: 'Too many authentication attempts, please try again later.',
  keyGenerator: (req) => `auth:${req.ip}`
})

export const passwordResetRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 3, // 3 password resets per hour
  message: 'Too many password reset attempts, please try again later.',
  keyGenerator: (req) => `password_reset:${req.ip}`
})

export const registrationRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 3, // 3 registrations per hour
  message: 'Too many registration attempts, please try again later.',
  keyGenerator: (req) => `registration:${req.ip}`
})

export const apiRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 1000, // 1000 API calls per 15 minutes
  message: 'API rate limit exceeded, please try again later.',
  keyGenerator: (req) => `api:${req.ip}`
})

// Cleanup old rate limit logs periodically
setInterval(async () => {
  try {
    const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago
    await prisma.rateLimitLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate }
      }
    })
  } catch (error) {
    console.error('Error cleaning up rate limit logs:', error)
  }
}, 60 * 60 * 1000) // Run every hour
