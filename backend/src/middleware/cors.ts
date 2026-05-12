import { Request, Response, NextFunction } from 'express'

export interface CorsOptions {
  origin?: string | string[] | boolean
  methods?: string[]
  allowedHeaders?: string[]
  exposedHeaders?: string[]
  credentials?: boolean
  maxAge?: number
}

const defaultOptions: CorsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3002', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-Guest-Session-Id',
    'X-Device-ID',
    'X-App-Version'
  ],
  exposedHeaders: [
    'X-Total-Count',
    'X-Page-Count',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset'
  ],
  credentials: true,
  maxAge: 86400 // 24 hours
}

export const cors = (options: Partial<CorsOptions> = {}) => {
  const config = { ...defaultOptions, ...options }
  
  return (req: Request, res: Response, next: NextFunction) => {
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      setCorsHeaders(req, res, config)
      return res.status(204).end()
    }
    
    setCorsHeaders(req, res, config)
    next()
  }
}

const setCorsHeaders = (req: Request, res: Response, config: CorsOptions) => {
  const origin = req.headers.origin
  const allowedOrigins = Array.isArray(config.origin) ? config.origin : [config.origin]
  
  // Set Origin header
  if (config.origin === true || (origin && allowedOrigins.includes(origin))) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*')
  } else if (typeof config.origin === 'string') {
    res.setHeader('Access-Control-Allow-Origin', config.origin)
  }
  
  // Set methods
  if (config.methods) {
    res.setHeader('Access-Control-Allow-Methods', config.methods.join(', '))
  }
  
  // Set allowed headers
  if (config.allowedHeaders) {
    res.setHeader('Access-Control-Allow-Headers', config.allowedHeaders.join(', '))
  }
  
  // Set exposed headers
  if (config.exposedHeaders) {
    res.setHeader('Access-Control-Expose-Headers', config.exposedHeaders.join(', '))
  }
  
  // Set credentials
  if (config.credentials) {
    res.setHeader('Access-Control-Allow-Credentials', 'true')
  }
  
  // Set max age
  if (config.maxAge) {
    res.setHeader('Access-Control-Max-Age', config.maxAge.toString())
  }
}

// Environment-specific CORS configurations
export const developmentCors = cors({
  origin: true,
  credentials: true
})

export const productionCors = cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || [
    'https://hinctonmeat.com',
    'https://www.hinctonmeat.com'
  ],
  credentials: true
})

export const apiCors = cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || [
    'https://hinctonmeat.com',
    'https://www.hinctonmeat.com',
    'https://admin.hinctonmeat.com'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true
})
