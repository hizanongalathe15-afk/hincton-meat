"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.asyncHandler = exports.errorHandler = exports.RateLimitError = exports.ConflictError = exports.ForbiddenError = exports.UnauthorizedError = exports.NotFoundError = exports.ValidationError = exports.AppError = void 0;
const database_1 = require("../database");
class AppError extends Error {
    constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
class ValidationError extends AppError {
    constructor(message, details) {
        super(message, 400, 'VALIDATION_ERROR', details);
    }
}
exports.ValidationError = ValidationError;
class NotFoundError extends AppError {
    constructor(resource, id) {
        super(`${resource}${id ? ` with ID ${id}` : ''} not found`, 404, 'NOT_FOUND');
    }
}
exports.NotFoundError = NotFoundError;
class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized access') {
        super(message, 401, 'UNAUTHORIZED');
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends AppError {
    constructor(message = 'Forbidden access') {
        super(message, 403, 'FORBIDDEN');
    }
}
exports.ForbiddenError = ForbiddenError;
class ConflictError extends AppError {
    constructor(message, details) {
        super(message, 409, 'CONFLICT', details);
    }
}
exports.ConflictError = ConflictError;
class RateLimitError extends AppError {
    constructor(message = 'Rate limit exceeded') {
        super(message, 429, 'RATE_LIMIT_EXCEEDED');
    }
}
exports.RateLimitError = RateLimitError;
// Error logging utility
const logError = async (error, req) => {
    try {
        await database_1.prisma.errorLog.create({
            data: {
                message: error.message,
                stack: error.stack,
                path: req.path,
                method: req.method,
                statusCode: error.statusCode ?? 500,
                ipAddress: req.ip,
                userAgent: req.get('User-Agent'),
            }
        });
    }
    catch (logError) {
        console.error('Failed to log error:', logError);
    }
};
// Main error handler middleware
const errorHandler = (error, req, res, next) => {
    // Log the error
    logError(error, req);
    // Default error values
    const statusCode = error.statusCode || 500;
    const code = error.code || 'INTERNAL_ERROR';
    const message = error.message || 'Internal server error';
    // Handle specific error types
    if (error.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            error: 'VALIDATION_ERROR',
            message,
            details: error.details
        });
    }
    if (error.name === 'CastError') {
        return res.status(400).json({
            success: false,
            error: 'INVALID_DATA_TYPE',
            message: 'Invalid data type provided'
        });
    }
    if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            error: 'INVALID_TOKEN',
            message: 'Invalid or expired token'
        });
    }
    if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            error: 'TOKEN_EXPIRED',
            message: 'Token has expired'
        });
    }
    if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
            success: false,
            error: 'FILE_TOO_LARGE',
            message: 'File size exceeds limit'
        });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
        return res.status(413).json({
            success: false,
            error: 'TOO_MANY_FILES',
            message: 'Too many files uploaded'
        });
    }
    // Handle Prisma errors
    if (error.name === 'PrismaClientKnownRequestError') {
        const prismaError = error;
        switch (prismaError.code) {
            case 'P2002':
                return res.status(400).json({
                    success: false,
                    error: 'UNIQUE_CONSTRAINT',
                    message: 'A record with this value already exists',
                    details: prismaError.meta
                });
            case 'P2025':
                return res.status(400).json({
                    success: false,
                    error: 'FOREIGN_KEY_CONSTRAINT',
                    message: 'Related record does not exist',
                    details: prismaError.meta
                });
            case 'P2003':
                return res.status(400).json({
                    success: false,
                    error: 'NULL_CONSTRAINT',
                    message: 'A required field is null',
                    details: prismaError.meta
                });
            default:
                return res.status(400).json({
                    success: false,
                    error: 'DATABASE_ERROR',
                    message: 'Database operation failed',
                    details: prismaError.meta
                });
        }
    }
    if (process.env.NODE_ENV === 'development') {
        return res.status(statusCode).json({
            success: false,
            error: code,
            message,
            stack: error.stack,
            details: error.details
        });
    }
    // Production error response
    return res.status(statusCode).json({
        success: false,
        error: code,
        message: statusCode === 500 ? 'Internal server error' : message
    });
};
exports.errorHandler = errorHandler;
// Async error wrapper
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
// 404 handler
const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: `Route ${req.method} ${req.path} not found`
    });
};
exports.notFoundHandler = notFoundHandler;
//# sourceMappingURL=errorHandler.js.map