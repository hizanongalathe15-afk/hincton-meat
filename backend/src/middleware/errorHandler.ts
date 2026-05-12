import { Request, Response, NextFunction } from 'express'
import { prisma } from '../database'

export interface ApiError extends Error {
  statusCode?: number
  code?: string
  details?: any
  isOperational?: boolean
}

export class AppError extends Error implements ApiError {
  public statusCode: number
  public code: string
  public details?: any
  public isOperational: boolean

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR', details?: any) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.details = details
    this.isOperational = true
    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details)
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(`${resource}${id ? ` with ID ${id}` : ''} not found`, 404, 'NOT_FOUND')
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 401, 'UNAUTHORIZED')
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden access') {
    super(message, 403, 'FORBIDDEN')
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 409, 'CONFLICT', details)
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED')
  }
}

// Error logging utility
const logError = async (error: ApiError, req: Request) => {
  try {
    await prisma.errorLog.create({
      data: {
        message: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method,
        statusCode: error.statusCode ?? 500,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),

      }
    })
  } catch (logError) {
    console.error('Failed to log error:', logError)
  }
}

// Main error handler middleware
export const errorHandler = (
  error: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log the error
  logError(error, req)

  // Default error values
  const statusCode = error.statusCode || 500
  const code = error.code || 'INTERNAL_ERROR'
  const message = error.message || 'Internal server error'

  // Handle specific error types
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message,
      details: error.details
    })
  }

  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: 'INVALID_DATA_TYPE',
      message: 'Invalid data type provided'
    })
  }

  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'INVALID_TOKEN',
      message: 'Invalid or expired token'
    })
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'TOKEN_EXPIRED',
      message: 'Token has expired'
    })
  }

  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      error: 'FILE_TOO_LARGE',
      message: 'File size exceeds limit'
    })
  }

  if (error.code === 'LIMIT_FILE_COUNT') {
    return res.status(413).json({
      success: false,
      error: 'TOO_MANY_FILES',
      message: 'Too many files uploaded'
    })
  }

  // Handle Prisma errors
  if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any
    switch (prismaError.code) {
      case 'P2002':
        return res.status(400).json({
          success: false,
          error: 'UNIQUE_CONSTRAINT',
          message: 'A record with this value already exists',
          details: prismaError.meta
        })
      case 'P2025':
        return res.status(400).json({
          success: false,
          error: 'FOREIGN_KEY_CONSTRAINT',
          message: 'Related record does not exist',
          details: prismaError.meta
        })
      case 'P2003':
        return res.status(400).json({
          success: false,
          error: 'NULL_CONSTRAINT',
          message: 'A required field is null',
          details: prismaError.meta
        })
      default:
        return res.status(400).json({
          success: false,
          error: 'DATABASE_ERROR',
          message: 'Database operation failed',
          details: prismaError.meta
        })
    }
  }

   if (process.env.NODE_ENV === 'development') {
    return res.status(statusCode).json({
      success: false,
      error: code,
      message,
      stack: error.stack,
      details: error.details
    })
  }

  // Production error response
  return res.status(statusCode).json({
    success: false,
    error: code,
    message: statusCode === 500 ? 'Internal server error' : message
  })
}

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

// 404 handler
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: `Route ${req.method} ${req.path} not found`
  })
}
