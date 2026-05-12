export interface IUserSession {
    id: string;
    userId: string;
    sessionToken: string;
    refreshToken?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    deviceName?: string | null;
    deviceType?: string | null;
    expiresAt: Date;
    lastActivity: Date;
    isRevoked: boolean;
    createdAt: Date;
}
export declare const UserSessionModel: {
    create: (sessionData: Omit<IUserSession, "id" | "createdAt">) => Promise<IUserSession>;
    findByUserId: (userId: string) => Promise<IUserSession | null>;
    findBySessionToken: (sessionToken: string) => Promise<IUserSession | null>;
    updateLastActivity: (sessionToken: string) => Promise<IUserSession | null>;
    revokeSession: (sessionToken: string) => Promise<IUserSession | null>;
    revokeAllUserSessions: (userId: string) => Promise<number>;
    findActiveSession: (sessionToken: string) => Promise<IUserSession | null>;
    getUserSessions: (userId: string) => Promise<IUserSession[]>;
    getActiveSessions: (userId: string) => Promise<IUserSession[]>;
    cleanupExpiredSessions: () => Promise<number>;
    getSessionStats: () => Promise<{
        totalActiveSessions: number;
        totalRevokedSessions: number;
        expiredSessions: number;
    }>;
    deleteUserSession: (userId: string) => Promise<void>;
};
//# sourceMappingURL=UserSession.d.ts.map