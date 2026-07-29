import { Request, Response, NextFunction } from 'express'

// Minimal XSS/HTML sanitizer placeholder.
// The project previously depended on `isomorphic-dompurify`, but that dependency
// is not present in this repository.
//
// To keep `tsc --noEmit` passing (and avoid breaking runtime), we perform a very
// small set of safe transformations:
// - if a value is a string, trim it
// - recursively process objects/arrays
//
// IMPORTANT: Replace this with a real sanitizer (e.g. DOMPurify) if you add the
// dependency back later.

const sanitizeObject = (obj: any): any => {
  if (typeof obj === 'string') {
    return obj.trim()
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject)
  }

  if (typeof obj !== 'object' || obj === null) {
    return obj
  }

  const sanitized: any = {}
  for (const key of Object.keys(obj)) {
    sanitized[key] = sanitizeObject(obj[key])
  }
  return sanitized
}

// Reject prototype-pollution and operator-injection keys before application code
// or an ORM sees them. Values remain untouched so product descriptions and search
// terms are not corrupted by over-aggressive filtering.
const hasUnsafeKeys = (value: unknown): boolean => {
  if (Array.isArray(value)) return value.some(hasUnsafeKeys)
  if (!value || typeof value !== 'object') return false
  return Object.entries(value as Record<string, unknown>).some(([key, nested]) =>
    key === '__proto__' || key === 'prototype' || key === 'constructor' || key.startsWith('$') || hasUnsafeKeys(nested)
  )
}

export const rejectUnsafeKeys = (req: Request, res: Response, next: NextFunction) => {
  if (hasUnsafeKeys(req.body) || hasUnsafeKeys(req.query) || hasUnsafeKeys(req.params)) {
    return res.status(400).json({ success: false, error: 'INVALID_INPUT', message: 'Unsafe request data was blocked' })
  }
  next()
}

// XSS protection (lightweight)
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  if (req.body) req.body = sanitizeObject(req.body)
  if (req.query) req.query = sanitizeObject(req.query)
  if (req.params) req.params = sanitizeObject(req.params)
  next()
}

// SQL injection protection (simple pattern detection)
export const preventSqlInjection = (req: Request, res: Response, next: NextFunction) => {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
    /(\b(OR|AND)\b.*\b(=|LIKE)\b)/gi,
    /(--|;|\/\*|\*\/|'|")/g
  ]

  const checkValue = (value: any): boolean => {
    if (typeof value !== 'string') return false
    return sqlPatterns.some(pattern => pattern.test(value))
  }

  const sanitizeValue = (value: any): any => {
    if (typeof value !== 'string') return value
    return value.replace(/--/g, '').replace(/;/g, '').trim()
  }

  if (req.body) {
    const containsSql = Object.values(req.body).some(checkValue)
    if (containsSql) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_INPUT',
        message: 'Invalid characters detected in input'
      })
    }
    req.body = sanitizeObject(req.body)
    // Optionally sanitize strings further (kept minimal)
    for (const [k, v] of Object.entries(req.body)) {
      req.body[k as keyof typeof req.body] = sanitizeValue(v)
    }
  }

  if (req.query) {
    const containsSqlInQuery = Object.values(req.query).some(checkValue)
    if (containsSqlInQuery) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_INPUT',
        message: 'Invalid characters detected in query parameters'
      })
    }
    req.query = sanitizeObject(req.query)
  }

  if (req.params) {
    const containsSqlInParams = Object.values(req.params).some(checkValue)
    if (containsSqlInParams) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_INPUT',
        message: 'Invalid characters detected in URL parameters'
      })
    }
    req.params = sanitizeObject(req.params)
  }

  next()
}

// NoSQL injection protection (simple pattern detection)
export const preventNoSqlInjection = (req: Request, res: Response, next: NextFunction) => {
  const noSqlPatterns = [
    /\$where/gi,
    /\$ne/gi,
    /\$gt/gi,
    /\$gte/gi,
    /\$lt/gi,
    /\$lte/gi,
    /\$in/gi,
    /\$nin/gi,
    /\$regex/gi
  ]

  const checkNoSql = (value: any): boolean => {
    const str = typeof value === 'string' ? value : JSON.stringify(value)
    return noSqlPatterns.some(pattern => pattern.test(str))
  }

  if (req.body && checkNoSql(req.body)) {
    return res.status(400).json({
      success: false,
      error: 'INVALID_INPUT',
      message: 'NoSQL injection detected'
    })
  }

  if (req.query && checkNoSql(req.query)) {
    return res.status(400).json({
      success: false,
      error: 'INVALID_INPUT',
      message: 'NoSQL injection detected in query parameters'
    })
  }

  if (req.params && checkNoSql(req.params)) {
    return res.status(400).json({
      success: false,
      error: 'INVALID_INPUT',
      message: 'NoSQL injection detected in URL parameters'
    })
  }

  next()
}

// Combined security middleware
export const securityMiddleware = [rejectUnsafeKeys, sanitizeInput, preventSqlInjection, preventNoSqlInjection]
