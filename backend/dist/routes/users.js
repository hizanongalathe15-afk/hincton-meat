"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../controllers");
const middleware_1 = require("../middleware");
const router = (0, express_1.Router)();
// Protected user routes - require authentication
router.use(middleware_1.authenticate);
// User profile routes - stricter rate limiting for sensitive operations
router.get('/profile', middleware_1.authRateLimiter, controllers_1.UserController.getProfile);
router.put('/profile', middleware_1.authRateLimiter, controllers_1.UserController.updateProfile);
router.put('/password', middleware_1.passwordResetRateLimiter, controllers_1.UserController.changePassword);
// Admin user routes
router.use(middleware_1.requireAdmin);
router.get('/', middleware_1.apiRateLimiter, controllers_1.UserController.getUsers);
router.get('/:id', middleware_1.apiRateLimiter, controllers_1.UserController.getUser);
router.put('/:id', middleware_1.authRateLimiter, controllers_1.UserController.updateUser);
router.post('/:id/deactivate', middleware_1.authRateLimiter, controllers_1.UserController.deactivateUser);
router.post('/:id/activate', middleware_1.authRateLimiter, controllers_1.UserController.activateUser);
router.delete('/:id', middleware_1.authRateLimiter, controllers_1.UserController.deleteUser);
router.get('/stats/overview', middleware_1.apiRateLimiter, controllers_1.UserController.getUserStats);
// Admin user management routes
router.post('/admin/create', middleware_1.authRateLimiter, controllers_1.UserController.createAdminUser);
router.post('/:id/block', middleware_1.authRateLimiter, controllers_1.UserController.blockUser);
router.post('/:id/unblock', middleware_1.authRateLimiter, controllers_1.UserController.unblockUser);
router.put('/:id/password', middleware_1.authRateLimiter, controllers_1.UserController.changeUserPassword);
router.delete('/:id', middleware_1.authRateLimiter, controllers_1.UserController.deleteUserAccount);
exports.default = router;
//# sourceMappingURL=users.js.map