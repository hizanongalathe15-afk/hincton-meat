"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserSessionModel = void 0;
const database_1 = require("../database");
exports.UserSessionModel = {
    create: async (sessionData) => {
        const session = await database_1.prisma.userSession.create({
            data: {
                userId: sessionData.userId,
                sessionToken: sessionData.sessionToken,
                refreshToken: sessionData.refreshToken,
                ipAddress: sessionData.ipAddress,
                userAgent: sessionData.userAgent,
                deviceName: sessionData.deviceName,
                deviceType: sessionData.deviceType,
                expiresAt: sessionData.expiresAt,
                lastActivity: sessionData.lastActivity,
                isRevoked: sessionData.isRevoked ?? false
            }
        });
        return session;
    },
    findByUserId: async (userId) => {
        const session = await database_1.prisma.userSession.findFirst({
            where: { userId },
            orderBy: { lastActivity: 'desc' }
        });
        return session;
    },
    findBySessionToken: async (sessionToken) => {
        const session = await database_1.prisma.userSession.findUnique({
            where: { sessionToken }
        });
        return session;
    },
    updateLastActivity: async (sessionToken) => {
        const session = await database_1.prisma.userSession.update({
            where: { sessionToken },
            data: { lastActivity: new Date() }
        });
        return session;
    },
    revokeSession: async (sessionToken) => {
        const session = await database_1.prisma.userSession.update({
            where: { sessionToken },
            data: { isRevoked: true }
        });
        return session;
    },
    revokeAllUserSessions: async (userId) => {
        const result = await database_1.prisma.userSession.updateMany({
            where: { userId },
            data: { isRevoked: true }
        });
        return result.count;
    },
    findActiveSession: async (sessionToken) => {
        const session = await database_1.prisma.userSession.findUnique({
            where: { sessionToken }
        });
        // Check if session is not revoked and not expired
        if (session && !session.isRevoked && new Date() < session.expiresAt) {
            return session;
        }
        return null;
    },
    getUserSessions: async (userId) => {
        const sessions = await database_1.prisma.userSession.findMany({
            where: { userId },
            orderBy: { lastActivity: 'desc' }
        });
        return sessions;
    },
    getActiveSessions: async (userId) => {
        const now = new Date();
        const sessions = await database_1.prisma.userSession.findMany({
            where: {
                userId,
                isRevoked: false,
                expiresAt: { gt: now }
            },
            orderBy: { lastActivity: 'desc' }
        });
        return sessions;
    },
    cleanupExpiredSessions: async () => {
        const result = await database_1.prisma.userSession.deleteMany({
            where: {
                expiresAt: { lt: new Date() }
            }
        });
        return result.count;
    },
    getSessionStats: async () => {
        const now = new Date();
        const [activeSessions, revokedSessions, expiredSessions] = await Promise.all([
            database_1.prisma.userSession.count({
                where: {
                    isRevoked: false,
                    expiresAt: { gt: now }
                }
            }),
            database_1.prisma.userSession.count({
                where: { isRevoked: true }
            }),
            database_1.prisma.userSession.count({
                where: { expiresAt: { lt: now } }
            })
        ]);
        return {
            totalActiveSessions: activeSessions,
            totalRevokedSessions: revokedSessions,
            expiredSessions: expiredSessions
        };
    },
    deleteUserSession: async (userId) => {
        await database_1.prisma.userSession.deleteMany({
            where: { userId }
        });
    }
};
//# sourceMappingURL=UserSession.js.map