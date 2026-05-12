"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../controllers");
const middleware_1 = require("../middleware");
const router = (0, express_1.Router)();
// Public endpoints for user session tracking
router.post('/track', middleware_1.authRateLimiter, controllers_1.UserSessionController.trackUserActivity);
router.post('/status', middleware_1.authRateLimiter, controllers_1.UserSessionController.updateUserOnlineStatus);
router.post('/offline', middleware_1.authRateLimiter, controllers_1.UserSessionController.markUserOffline);
// Protected endpoints - require authentication
router.use(middleware_1.authenticate);
router.get('/stats', middleware_1.apiRateLimiter, controllers_1.UserSessionController.getUserStats);
router.get('/online/count', middleware_1.apiRateLimiter, controllers_1.UserSessionController.getOnlineUserCount);
router.get('/online', middleware_1.apiRateLimiter, controllers_1.UserSessionController.getOnlineUsers);
router.get('/offline', middleware_1.apiRateLimiter, controllers_1.UserSessionController.getOfflineUsers);
// Admin only endpoints
router.use(middleware_1.requireAdmin);
router.get('/admin/realtime', middleware_1.apiRateLimiter, controllers_1.UserSessionController.getRealTimeUserStats);
router.get('/admin/session/:userId', middleware_1.apiRateLimiter, controllers_1.UserSessionController.getUserSessionDetails);
router.post('/admin/cleanup', middleware_1.authRateLimiter, controllers_1.UserSessionController.cleanupOldSessions);
exports.default = router;
//# sourceMappingURL=userSessions.js.map