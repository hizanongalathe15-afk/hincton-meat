"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearFailedAttempts = exports.recordFailedAttempt = exports.accountLockout = exports.validatePasswordStrength = exports.sessionMiddleware = exports.securityHeaders = exports.csrfProtection = exports.validateInput = exports.rateLimit = exports.requireAdmin = exports.requireRole = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../config/prisma");
// Enhanced JWT verification with security checks
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Access token required' });
        }
        // Verify JWT token
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        // Check if user still exists and is active
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                roles: true,
                username: true,
                security: { select: { isEmailVerified: true } }
            }
        });
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }
        if (!user.security.isEmailVerified) {
            return res.status(401).json({ message: 'Account not verified' });
        }
        // Add user info to request
        req.user = {
            id: user.id,
            email: user.email,
            role: user.roles.includes('ADMIN') || user.roles.includes('SUPER_ADMIN') ? 'admin' : 'user',
            name: user.username,
            phone: user.phone || undefined,
            isVerified: user.security.isEmailVerified
        };
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            return res.status(403).json({ message: 'Invalid token' });
        }
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            return res.status(403).json({ message: 'Token expired' });
        }
        console.error('Authentication error:', error);
        return res.status(500).json({ message: 'Authentication error' });
    }
};
exports.authenticateToken = authenticateToken;
// Role-based access control
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Insufficient permissions' });
        }
        next();
    };
};
exports.requireRole = requireRole;
// Admin-only access
exports.requireAdmin = (0, exports.requireRole)(['ADMIN']);
// Rate limiting for sensitive endpoints
const requestCounts = new Map();
const rateLimit = (maxRequests, windowMs) => {
    return (req, res, next) => {
        const key = req.ip + ':' + req.path;
        const now = Date.now();
        const windowStart = now - windowMs;
        // Clean old entries
        for (const [k, v] of requestCounts.entries()) {
            if (v.timestamp < windowStart) {
                requestCounts.delete(k);
            }
        }
        // Check current count
        const current = requestCounts.get(key);
        if (current && current.count >= maxRequests && current.timestamp > windowStart) {
            return res.status(429).json({
                message: 'Too many requests',
                retryAfter: Math.ceil((current.timestamp + windowMs - now) / 1000)
            });
        }
        // Update count
        if (current && current.timestamp > windowStart) {
            requestCounts.set(key, { count: current.count + 1, timestamp: now });
        }
        else {
            requestCounts.set(key, { count: 1, timestamp: now });
        }
        next();
    };
};
exports.rateLimit = rateLimit;
// Input validation and sanitization
const validateInput = (req, res, next) => {
    // Check for common attack patterns
    const suspiciousPatterns = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /eval\s*\(/gi,
        /exec\s*\(/gi
    ];
    const checkValue = (value) => {
        if (typeof value === 'string') {
            return suspiciousPatterns.some(pattern => pattern.test(value));
        }
        if (typeof value === 'object' && value !== null) {
            return Object.values(value).some(v => checkValue(v));
        }
        return false;
    };
    // Check body, query, and params
    if (checkValue(req.body) || checkValue(req.query) || checkValue(req.params)) {
        return res.status(400).json({ message: 'Invalid input detected' });
    }
    next();
};
exports.validateInput = validateInput;
// CSRF protection for state-changing requests
const csrfProtection = (req, res, next) => {
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
        const csrfToken = req.headers['x-csrf-token'];
        const sessionToken = req.session?.csrfToken;
        if (!csrfToken || csrfToken !== sessionToken) {
            return res.status(403).json({ message: 'CSRF token mismatch' });
        }
    }
    next();
};
exports.csrfProtection = csrfProtection;
// Security headers middleware
const securityHeaders = (req, res, next) => {
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // Enable XSS protection
    res.setHeader('X-XSS-Protection', '1; mode=block');
    // Force HTTPS
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    // Content Security Policy
    res.setHeader('Content-Security-Policy', "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: https:; " +
        "font-src 'self' data:; " +
        "connect-src 'self' https:; " +
        "frame-ancestors 'none';");
    next();
};
exports.securityHeaders = securityHeaders;
// Session management
const sessionMiddleware = (req, res, next) => {
    // Generate session ID if not exists
    if (!req.sessionID) {
        req.sessionID = Math.random().toString(36).substring(2, 15);
    }
    // Set session cookie with security flags
    res.cookie('sessionId', req.sessionID, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
    next();
};
exports.sessionMiddleware = sessionMiddleware;
// Password strength validation
const validatePasswordStrength = (password) => {
    const errors = [];
    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }
    if (!/\d/.test(password)) {
        errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push('Password must contain at least one special character');
    }
    // Check for common passwords
    const commonPasswords = ['password', '12345678', 'qwerty', 'admin', 'letmein'];
    if (commonPasswords.includes(password.toLowerCase())) {
        errors.push('Password is too common');
    }
    return {
        isValid: errors.length === 0,
        errors
    };
};
exports.validatePasswordStrength = validatePasswordStrength;
// Account lockout after failed attempts
const failedAttempts = new Map();
const accountLockout = (maxAttempts = 5, lockoutDuration = 15 * 60 * 1000) => {
    return (req, res, next) => {
        const email = req.body.email || req.query.email;
        if (!email) {
            return next();
        }
        const now = Date.now();
        const attempts = failedAttempts.get(email);
        if (attempts && attempts.lockUntil > now) {
            const remainingTime = Math.ceil((attempts.lockUntil - now) / 1000 / 60);
            return res.status(429).json({
                message: `Account locked. Try again in ${remainingTime} minutes`
            });
        }
        next();
    };
};
exports.accountLockout = accountLockout;
const recordFailedAttempt = (email) => {
    const now = Date.now();
    const attempts = failedAttempts.get(email) || { count: 0, lockUntil: 0 };
    attempts.count++;
    if (attempts.count >= 5) {
        attempts.lockUntil = now + (15 * 60 * 1000); // 15 minutes
    }
    failedAttempts.set(email, attempts);
};
exports.recordFailedAttempt = recordFailedAttempt;
const clearFailedAttempts = (email) => {
    failedAttempts.delete(email);
};
exports.clearFailedAttempts = clearFailedAttempts;
//# sourceMappingURL=securityEnhanced.js.map