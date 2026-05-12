"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupOldSessions = exports.updateLastSeen = exports.getUserSessionDetails = exports.getRealTimeUserStats = exports.trackUserActivity = exports.markUserOffline = exports.markOffline = exports.updateUserOnlineStatus = exports.updateOnlineStatus = exports.getOnlineUserCount = exports.getUserStats = exports.getOfflineUsers = exports.getOnlineUsers = void 0;
const middleware_1 = require("../middleware");
const prisma_1 = require("../config/prisma");
// Placeholder to satisfy router/type checks until the model/controller contracts are aligned.
exports.getOnlineUsers = (0, middleware_1.asyncHandler)(async (_req, res) => {
    res.json({ success: true, data: [], count: 0 });
});
exports.getOfflineUsers = (0, middleware_1.asyncHandler)(async (_req, res) => {
    res.json({ success: true, data: [], count: 0 });
});
exports.getUserStats = (0, middleware_1.asyncHandler)(async (_req, res) => {
    res.json({ success: true, data: {} });
});
exports.getOnlineUserCount = (0, middleware_1.asyncHandler)(async (_req, res) => {
    res.json({ success: true, data: { onlineUsers: 0 } });
});
exports.updateOnlineStatus = (0, middleware_1.asyncHandler)(async (_req, res) => {
    res.json({ success: true, data: {} });
});
// Named exports expected by `src/controllers/index.ts`
exports.updateUserOnlineStatus = exports.updateOnlineStatus;
exports.markOffline = (0, middleware_1.asyncHandler)(async (_req, res) => {
    res.json({ success: true, data: {} });
});
exports.markUserOffline = exports.markOffline;
exports.trackUserActivity = (0, middleware_1.asyncHandler)(async (_req, res) => {
    res.json({ success: true, data: {} });
});
exports.getRealTimeUserStats = (0, middleware_1.asyncHandler)(async (_req, res) => {
    const cutoff = new Date(Date.now() - 15 * 60 * 1000);
    const sessions = await prisma_1.prisma.userSession.findMany({
        where: {
            user: {
                roles: { hasSome: ['ADMIN', 'SUPER_ADMIN'] },
                deletedAt: null,
            },
        },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    username: true,
                    profile: {
                        select: {
                            firstName: true,
                            lastName: true,
                            fullName: true,
                            avatar: true,
                        },
                    },
                },
            },
        },
        orderBy: { lastActivity: 'desc' },
        take: 50,
    });
    res.json({
        success: true,
        sessions: sessions.map((session) => ({
            id: session.id,
            userId: session.userId,
            user: session.user,
            deviceInfo: {
                userAgent: session.userAgent || '',
                ipAddress: session.ipAddress || '',
                deviceType: session.deviceType || 'UNKNOWN',
                browser: session.deviceName || 'Browser',
                os: session.deviceType || 'Unknown OS',
                location: session.ipAddress || '',
            },
            isOnline: !session.isRevoked && session.expiresAt > new Date() && session.lastActivity >= cutoff,
            lastActivity: session.lastActivity,
            sessionStart: session.createdAt,
            duration: Math.max(0, Date.now() - session.createdAt.getTime()),
        })),
    });
});
exports.getUserSessionDetails = (0, middleware_1.asyncHandler)(async (_req, res) => {
    res.json({ success: true, data: {} });
});
exports.updateLastSeen = (0, middleware_1.asyncHandler)(async (_req, res) => {
    res.json({ success: true, data: {} });
});
exports.cleanupOldSessions = (0, middleware_1.asyncHandler)(async (_req, res) => {
    res.json({ success: true, data: { deletedCount: 0 } });
});
//# sourceMappingURL=userSessionController.js.map