"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbLogger = exports.performanceLogger = exports.securityLogger = exports.requestLogger = void 0;
const database_1 = require("../database");
const requestLogger = (options = {}) => {
    const { excludePaths = ['/health', '/ping'], excludeHealthCheck = true, logBody = false, logHeaders = false } = options;
    return (req, res, next) => {
        const startTime = Date.now();
        const timestamp = new Date().toISOString();
        // Skip logging for excluded paths
        if (excludeHealthCheck && (req.path === '/health' || req.path === '/ping')) {
            return next();
        }
        if (excludePaths.some(path => req.path.startsWith(path))) {
            return next();
        }
        // Store original res.json to capture response
        const originalJson = res.json;
        let responseData;
        let statusCode = 200;
        res.json = function (data) {
            responseData = data;
            if (data && typeof data === 'object' && data.statusCode) {
                statusCode = data.statusCode;
            }
            return originalJson.call(this, data);
        };
        // Capture response status
        const originalSend = res.status;
        res.status = function (code) {
            statusCode = code;
            return originalSend.call(this, code);
        };
        // Log on response finish
        res.on('finish', async () => {
            const responseTime = Date.now() - startTime;
            const endTime = new Date().toISOString();
            const logEntry = {
                timestamp,
                method: req.method,
                url: req.url,
                ip: req.ip || req.connection.remoteAddress || 'unknown',
                userAgent: req.get('User-Agent'),
                statusCode,
                responseTime,
                userId: req.user?.id,
                error: undefined,
                ...(logBody && { body: req.body }),
                ...(logHeaders && { headers: req.headers })
            };
            try {
                // Log to database for permanent storage
                await database_1.prisma.pageView.create({
                    data: {
                        sessionId: req.sessionId ?? 'unknown',
                        userId: logEntry.userId,
                        path: req.path,
                        url: req.originalUrl,
                        referrer: req.get('Referrer')
                    }
                });
                // Console log for development
                if (process.env.NODE_ENV === 'development') {
                    console.log(`[${timestamp}] ${req.method} ${req.url} - ${statusCode} - ${responseTime}ms`, {
                        ip: logEntry.ip,
                        userAgent: logEntry.userAgent,
                        ...(logEntry.userId && { userId: logEntry.userId }),
                        ...(logBody && { body: req.body })
                    });
                }
            }
            catch (error) {
                console.error('Failed to log request:', error);
            }
        });
        next();
    };
};
exports.requestLogger = requestLogger;
// Error logger for security events
const securityLogger = (event, details, req) => {
    const logEntry = {
        timestamp: new Date().toISOString(),
        event,
        details,
        ip: req?.ip,
        userAgent: req?.get('User-Agent'),
        path: req?.path,
        userId: req.user?.id
    };
    // Log security events
    console.warn(`[SECURITY] ${event}:`, logEntry);
    // Store in database if needed
    if (event.includes('FAILED_LOGIN') || event.includes('UNAUTHORIZED_ACCESS')) {
        // This would be stored in a security logs table
        database_1.prisma.auditLog.create({
            data: {
                userId: logEntry.userId,
                action: event,
                entityType: 'security',
                entityId: null,
                oldValues: null,
                newValues: details ?? null,
                ipAddress: logEntry.ip,
                userAgent: logEntry.userAgent
            }
        }).catch(error => {
            console.error('Failed to store security log:', error);
        });
    }
};
exports.securityLogger = securityLogger;
// Performance logger
const performanceLogger = (req, res, next) => {
    const startTime = process.hrtime.bigint();
    res.on('finish', () => {
        const endTime = process.hrtime.bigint();
        const responseTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds
        // Log slow requests (> 1 second)
        if (responseTime > 1000) {
            console.warn(`[PERFORMANCE] Slow request: ${req.method} ${req.path} - ${responseTime.toFixed(2)}ms`);
        }
    });
    next();
};
exports.performanceLogger = performanceLogger;
// Database query logger
const dbLogger = (query, params, duration) => {
    if (process.env.NODE_ENV === 'development') {
        console.log(`[DB] Query: ${query}`, {
            params,
            duration: `${duration}ms`
        });
    }
    // Log slow queries (> 100ms)
    if (duration > 100) {
        console.warn(`[DB] Slow query: ${query} - ${duration}ms`);
    }
};
exports.dbLogger = dbLogger;
//# sourceMappingURL=logger.js.map