"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.optionalAuthenticate = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const Role = {
    BUYER: 'BUYER',
    ADMIN: 'ADMIN',
    SUPER_ADMIN: 'SUPER_ADMIN',
    AGENT: 'AGENT',
    VENDOR: 'VENDOR',
    AFFILIATE: 'AFFILIATE',
    SUPPORT: 'SUPPORT',
    CONTENT_MANAGER: 'CONTENT_MANAGER',
    ANALYTICS_VIEWER: 'ANALYTICS_VIEWER',
    MODERATOR: 'MODERATOR',
};
const primaryRole = (roles) => {
    if (roles.includes(Role.SUPER_ADMIN) || roles.includes(Role.ADMIN))
        return 'admin';
    return 'buyer';
};
const authenticate = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'Access denied. No token provided.' });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            include: {
                profile: true,
                security: true,
            },
        });
        if (!user || user.deletedAt || !user.security?.is_active) {
            return res.status(401).json({ error: 'Invalid token. User not found.' });
        }
        req.user = {
            id: user.id,
            name: user.profile?.fullName || [user.profile?.firstName, user.profile?.lastName].filter(Boolean).join(' ') || user.email,
            email: user.email,
            role: primaryRole(user.roles),
            roles: user.roles,
            phone: user.phone || undefined,
            isVerified: Boolean(user.security?.isEmailVerified),
        };
        next();
    }
    catch (error) {
        res.status(401).json({ error: 'Invalid token.' });
    }
};
exports.authenticate = authenticate;
const optionalAuthenticate = async (req, _res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token)
            return next();
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            include: {
                profile: true,
                security: true,
            },
        });
        if (user && !user.deletedAt && user.security?.is_active) {
            req.user = {
                id: user.id,
                name: user.profile?.fullName || [user.profile?.firstName, user.profile?.lastName].filter(Boolean).join(' ') || user.email,
                email: user.email,
                role: primaryRole(user.roles),
                roles: user.roles,
                phone: user.phone || undefined,
                isVerified: Boolean(user.security?.isEmailVerified),
            };
        }
        next();
    }
    catch {
        next();
    }
};
exports.optionalAuthenticate = optionalAuthenticate;
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Access denied. User not authenticated.' });
        }
        const allowed = roles.map((role) => role.toUpperCase());
        const userRoles = req.user.roles.map((role) => role.toUpperCase());
        if (!userRoles.some((role) => allowed.includes(role))) {
            return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
        }
        next();
    };
};
exports.authorize = authorize;
//# sourceMappingURL=auth.js.map