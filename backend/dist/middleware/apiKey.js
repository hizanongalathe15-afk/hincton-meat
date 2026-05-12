"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPermission = exports.API_PERMISSIONS = exports.revokeApiKey = exports.generateApiKey = exports.requireApiKeyPermission = exports.authenticateApiKey = void 0;
const database_1 = require("../database");
const crypto_1 = __importDefault(require("crypto"));
const authenticateApiKey = async (req, res, next) => {
    try {
        const authHeader = req.headers['x-api-key'];
        const apiKey = Array.isArray(authHeader) ? authHeader[0] : authHeader;
        if (typeof apiKey !== 'string' || !apiKey) {
            return res.status(401).json({
                success: false,
                error: 'API_KEY_MISSING',
                message: 'API key is required'
            });
        }
        if (!apiKey) {
            return res.status(401).json({
                success: false,
                error: 'API_KEY_MISSING',
                message: 'API key is required'
            });
        }
        // Find API key in database
        const keyRecord = await database_1.prisma.apiKey.findFirst({
            where: {
                key: apiKey,
                isActive: true,
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: new Date() } }
                ]
            },
            include: {
                user: {
                    include: {
                        profile: true
                    }
                }
            }
        });
        if (!keyRecord) {
            return res.status(401).json({
                success: false,
                error: 'INVALID_API_KEY',
                message: 'Invalid or expired API key'
            });
        }
        // Check if key is expired
        if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
            return res.status(401).json({
                success: false,
                error: 'API_KEY_EXPIRED',
                message: 'API key has expired'
            });
        }
        // Permissions are stored as Json in Prisma; normalize to string[]
        const permissions = Array.isArray(keyRecord.permissions)
            ? keyRecord.permissions.filter((p) => typeof p === 'string')
            : [];
        // Attach API key info to request
        req.apiKey = {
            id: keyRecord.id,
            name: keyRecord.name ?? 'API_KEY',
            permissions,
            userId: keyRecord.userId,
            isActive: keyRecord.isActive
        };
        next();
    }
    catch (error) {
        console.error('API key authentication error:', error);
        return res.status(500).json({
            success: false,
            error: 'INTERNAL_ERROR',
            message: 'Internal server error'
        });
    }
};
exports.authenticateApiKey = authenticateApiKey;
const requireApiKeyPermission = (permission) => {
    return (req, res, next) => {
        if (!req.apiKey) {
            return res.status(401).json({
                success: false,
                error: 'API_KEY_REQUIRED',
                message: 'API key authentication required'
            });
        }
        if (!req.apiKey.permissions.includes(permission)) {
            return res.status(403).json({
                success: false,
                error: 'INSUFFICIENT_PERMISSIONS',
                message: `Permission '${permission}' is required for this endpoint`
            });
        }
        next();
    };
};
exports.requireApiKeyPermission = requireApiKeyPermission;
const generateApiKey = async (userId, name, permissions, expiresInDays) => {
    try {
        const apiKey = crypto_1.default.randomBytes(32).toString('hex');
        const expiresAt = expiresInDays ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000) : null;
        const keyRecord = await database_1.prisma.apiKey.create({
            data: {
                userId,
                name,
                key: apiKey,
                permissions,
                expiresAt
            }
        });
        // Prisma stores permissions as Json
        const normalizedPermissions = Array.isArray(keyRecord.permissions)
            ? keyRecord.permissions.filter((p) => typeof p === 'string')
            : [];
        return {
            id: keyRecord.id,
            key: apiKey,
            name: keyRecord.name ?? undefined,
            permissions: normalizedPermissions,
            expiresAt: keyRecord.expiresAt,
            createdAt: keyRecord.createdAt
        };
    }
    catch (error) {
        console.error('Failed to generate API key:', error);
        throw new Error('Failed to generate API key');
    }
};
exports.generateApiKey = generateApiKey;
const revokeApiKey = async (apiKeyId, userId) => {
    try {
        // Verify user owns the API key
        const keyRecord = await database_1.prisma.apiKey.findFirst({
            where: {
                id: apiKeyId,
                userId,
                isActive: true
            }
        });
        if (!keyRecord) {
            throw new Error('API key not found or access denied');
        }
        // Deactivate the API key
        await database_1.prisma.apiKey.update({
            where: { id: apiKeyId },
            data: {
                isActive: false
            }
        });
        return true;
    }
    catch (error) {
        console.error('Failed to revoke API key:', error);
        throw new Error('Failed to revoke API key');
    }
};
exports.revokeApiKey = revokeApiKey;
// Permission constants
exports.API_PERMISSIONS = {
    READ_PRODUCTS: 'read:products',
    WRITE_PRODUCTS: 'write:products',
    READ_ORDERS: 'read:orders',
    WRITE_ORDERS: 'write:orders',
    READ_USERS: 'read:users',
    WRITE_USERS: 'write:users',
    READ_ANALYTICS: 'read:analytics',
    WRITE_ANALYTICS: 'write:analytics',
    ADMIN_FULL: 'admin:full'
};
const checkPermission = (req, permission) => {
    return req.apiKey?.permissions.includes(permission) || false;
};
exports.checkPermission = checkPermission;
//# sourceMappingURL=apiKey.js.map