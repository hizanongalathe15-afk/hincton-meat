"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserOnlineStatus = exports.handleUserDisconnect = exports.trackUserActivity = void 0;
const models_1 = require("../models");
const trackUserActivity = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (userId) {
            // Update user's last seen and mark as online
            // update lastActivity for user's sessions (closest supported operation)
            const sessions = await models_1.UserSessionModel.findByUserId(userId);
            if (sessions) {
                await models_1.UserSessionModel.updateLastActivity(sessions.sessionToken);
            }
        }
    }
    catch (error) {
        // Don't block the request if tracking fails
        console.error('User activity tracking error:', error);
    }
    next();
};
exports.trackUserActivity = trackUserActivity;
const handleUserDisconnect = async (userId) => {
    try {
        if (userId) {
            // Closest supported operation: mark sessions revoked (no markOffline method in model)
            await models_1.UserSessionModel.revokeAllUserSessions(userId);
        }
    }
    catch (error) {
        console.error('User disconnect tracking error:', error);
    }
};
exports.handleUserDisconnect = handleUserDisconnect;
const updateUserOnlineStatus = async (userId, isOnline, socketId) => {
    try {
        // Closest supported operation: touch sessions when online; revoke when offline.
        if (isOnline) {
            const session = await models_1.UserSessionModel.findByUserId(userId);
            if (session) {
                await models_1.UserSessionModel.updateLastActivity(session.sessionToken);
            }
        }
        else {
            await models_1.UserSessionModel.revokeAllUserSessions(userId);
        }
    }
    catch (error) {
        console.error('User status update error:', error);
    }
};
exports.updateUserOnlineStatus = updateUserOnlineStatus;
//# sourceMappingURL=userActivityTracker.js.map