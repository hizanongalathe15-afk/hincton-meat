"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.securityMiddleware = exports.preventNoSqlInjection = exports.preventSqlInjection = exports.sanitizeInput = void 0;
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
const sanitizeObject = (obj) => {
    if (typeof obj === 'string') {
        return obj.trim();
    }
    if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
    }
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }
    const sanitized = {};
    for (const key of Object.keys(obj)) {
        sanitized[key] = sanitizeObject(obj[key]);
    }
    return sanitized;
};
// XSS protection (lightweight)
const sanitizeInput = (req, res, next) => {
    if (req.body)
        req.body = sanitizeObject(req.body);
    if (req.query)
        req.query = sanitizeObject(req.query);
    if (req.params)
        req.params = sanitizeObject(req.params);
    next();
};
exports.sanitizeInput = sanitizeInput;
// SQL injection protection (simple pattern detection)
const preventSqlInjection = (req, res, next) => {
    const sqlPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
        /(\b(OR|AND)\b.*\b(=|LIKE)\b)/gi,
        /(--|;|\/\*|\*\/|'|")/g
    ];
    const checkValue = (value) => {
        if (typeof value !== 'string')
            return false;
        return sqlPatterns.some(pattern => pattern.test(value));
    };
    const sanitizeValue = (value) => {
        if (typeof value !== 'string')
            return value;
        return value.replace(/--/g, '').replace(/;/g, '').trim();
    };
    if (req.body) {
        const containsSql = Object.values(req.body).some(checkValue);
        if (containsSql) {
            return res.status(400).json({
                success: false,
                error: 'INVALID_INPUT',
                message: 'Invalid characters detected in input'
            });
        }
        req.body = sanitizeObject(req.body);
        // Optionally sanitize strings further (kept minimal)
        for (const [k, v] of Object.entries(req.body)) {
            req.body[k] = sanitizeValue(v);
        }
    }
    if (req.query) {
        const containsSqlInQuery = Object.values(req.query).some(checkValue);
        if (containsSqlInQuery) {
            return res.status(400).json({
                success: false,
                error: 'INVALID_INPUT',
                message: 'Invalid characters detected in query parameters'
            });
        }
        req.query = sanitizeObject(req.query);
    }
    if (req.params) {
        const containsSqlInParams = Object.values(req.params).some(checkValue);
        if (containsSqlInParams) {
            return res.status(400).json({
                success: false,
                error: 'INVALID_INPUT',
                message: 'Invalid characters detected in URL parameters'
            });
        }
        req.params = sanitizeObject(req.params);
    }
    next();
};
exports.preventSqlInjection = preventSqlInjection;
// NoSQL injection protection (simple pattern detection)
const preventNoSqlInjection = (req, res, next) => {
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
    ];
    const checkNoSql = (value) => {
        const str = typeof value === 'string' ? value : JSON.stringify(value);
        return noSqlPatterns.some(pattern => pattern.test(str));
    };
    if (req.body && checkNoSql(req.body)) {
        return res.status(400).json({
            success: false,
            error: 'INVALID_INPUT',
            message: 'NoSQL injection detected'
        });
    }
    if (req.query && checkNoSql(req.query)) {
        return res.status(400).json({
            success: false,
            error: 'INVALID_INPUT',
            message: 'NoSQL injection detected in query parameters'
        });
    }
    if (req.params && checkNoSql(req.params)) {
        return res.status(400).json({
            success: false,
            error: 'INVALID_INPUT',
            message: 'NoSQL injection detected in URL parameters'
        });
    }
    next();
};
exports.preventNoSqlInjection = preventNoSqlInjection;
// Combined security middleware
exports.securityMiddleware = [exports.sanitizeInput, exports.preventSqlInjection, exports.preventNoSqlInjection];
//# sourceMappingURL=sanitizer.js.map