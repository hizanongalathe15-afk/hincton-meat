"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUserAccount = exports.changeUserPassword = exports.unblockUser = exports.blockUser = exports.createAdminUser = exports.getUserStats = exports.deleteUser = exports.activateUser = exports.deactivateUser = exports.updateAvatar = exports.updateNotificationSettings = exports.getNotificationSettings = exports.deletePaymentMethod = exports.addPaymentMethod = exports.getPaymentMethods = exports.setDefaultAddress = exports.deleteAddress = exports.updateAddress = exports.addAddress = exports.getAddresses = exports.updateUser = exports.getUser = exports.getUsers = exports.changePassword = exports.updateProfile = exports.getProfile = void 0;
const models_1 = require("../models");
const middleware_1 = require("../middleware");
const middleware_2 = require("../middleware");
const validationSchemas_1 = require("../middleware/validationSchemas");
exports.getProfile = (0, middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new middleware_1.AppError('User authentication required', 401, 'UNAUTHORIZED');
    }
    const user = await models_1.UserModel.findById(userId);
    if (!user) {
        throw new middleware_1.NotFoundError('User', userId);
    }
    res.json({
        success: true,
        data: user
    });
});
exports.updateProfile = [
    (0, middleware_2.validateBody)(validationSchemas_1.userUpdateSchema),
    (0, middleware_1.asyncHandler)(async (req, res) => {
        const userId = req.user?.id;
        const updateData = req.body;
        if (!userId) {
            throw new middleware_1.AppError('User authentication required', 401, 'UNAUTHORIZED');
        }
        // Check if user exists
        const existingUser = await models_1.UserModel.findById(userId);
        if (!existingUser) {
            throw new middleware_1.NotFoundError('User', userId);
        }
        // If email is being updated, check for uniqueness
        if (updateData.email && updateData.email !== existingUser.email) {
            const emailExists = await models_1.UserModel.findByEmail(updateData.email);
            if (emailExists) {
                throw new middleware_1.ValidationError('Email already exists');
            }
        }
        const updatedUser = await models_1.UserModel.update(userId, updateData);
        res.json({
            success: true,
            data: updatedUser,
            message: 'Profile updated successfully'
        });
    })
];
exports.changePassword = [
    (0, middleware_2.validateBody)(validationSchemas_1.passwordChangeSchema),
    (0, middleware_1.asyncHandler)(async (req, res) => {
        const userId = req.user?.id;
        const { currentPassword, newPassword } = req.body;
        if (!userId) {
            throw new middleware_1.AppError('User authentication required', 401, 'UNAUTHORIZED');
        }
        // Check if user exists
        const user = await models_1.UserModel.findById(userId);
        if (!user) {
            throw new middleware_1.NotFoundError('User', userId);
        }
        // Verify current password
        const isCurrentPasswordValid = await models_1.UserModel.verifyPassword(userId, currentPassword);
        if (!isCurrentPasswordValid) {
            throw new middleware_1.ValidationError('Current password is incorrect');
        }
        // Update password
        await models_1.UserModel.updatePassword(userId, newPassword);
        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    })
];
exports.getUsers = (0, middleware_1.asyncHandler)(async (req, res) => {
    const { page = 1, limit = 20, search, role, isActive } = req.query;
    const result = await models_1.UserModel.findAll({
        page: Number(page),
        limit: Number(limit),
        search: search,
        role: role
    });
    res.json({
        success: true,
        data: result.users,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total: result.total,
            pages: Math.ceil(result.total / Number(limit))
        }
    });
});
exports.getUser = (0, middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const user = await models_1.UserModel.findById(id);
    if (!user) {
        throw new middleware_1.NotFoundError('User', id);
    }
    res.json({
        success: true,
        data: user
    });
});
exports.updateUser = [
    (0, middleware_2.validateBody)(validationSchemas_1.userUpdateSchema),
    (0, middleware_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        const updateData = req.body;
        const user = await models_1.UserModel.findById(id);
        if (!user) {
            throw new middleware_1.NotFoundError('User', id);
        }
        // If email is being updated, check for uniqueness
        if (updateData.email && updateData.email !== user.email) {
            const emailExists = await models_1.UserModel.findByEmail(updateData.email);
            if (emailExists) {
                throw new middleware_1.ValidationError('Email already exists');
            }
        }
        const updatedUser = await models_1.UserModel.update(id, updateData);
        res.json({
            success: true,
            data: updatedUser,
            message: 'User updated successfully'
        });
    })
];
// Address management
exports.getAddresses = (0, middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new middleware_1.AppError('User authentication required', 401, 'UNAUTHORIZED');
    }
    const addresses = await models_1.UserModel.getAddresses(userId);
    res.json({
        success: true,
        data: addresses
    });
});
exports.addAddress = (0, middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    const { street, city, postalCode, country, isDefault } = req.body;
    if (!userId) {
        throw new middleware_1.AppError('User authentication required', 401, 'UNAUTHORIZED');
    }
    const address = await models_1.UserModel.addAddress(userId, {
        street,
        city,
        postalCode,
        country,
        isDefault
    });
    res.status(201).json({
        success: true,
        data: address,
        message: 'Address added successfully'
    });
});
exports.updateAddress = (0, middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    const { id } = req.params;
    const updateData = req.body;
    if (!userId) {
        throw new middleware_1.AppError('User authentication required', 401, 'UNAUTHORIZED');
    }
    const address = await models_1.UserModel.updateAddress(id, userId, updateData);
    res.json({
        success: true,
        data: address,
        message: 'Address updated successfully'
    });
});
exports.deleteAddress = (0, middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) {
        throw new middleware_1.AppError('User authentication required', 401, 'UNAUTHORIZED');
    }
    await models_1.UserModel.deleteAddress(id, userId);
    res.json({
        success: true,
        message: 'Address deleted successfully'
    });
});
exports.setDefaultAddress = (0, middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) {
        throw new middleware_1.AppError('User authentication required', 401, 'UNAUTHORIZED');
    }
    await models_1.UserModel.setDefaultAddress(id, userId);
    res.json({
        success: true,
        message: 'Default address updated successfully'
    });
});
// Payment method management
exports.getPaymentMethods = (0, middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new middleware_1.AppError('User authentication required', 401, 'UNAUTHORIZED');
    }
    const paymentMethods = await models_1.UserModel.getPaymentMethods(userId);
    res.json({
        success: true,
        data: paymentMethods
    });
});
exports.addPaymentMethod = (0, middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    const { type, phoneNumber, accountName, isDefault } = req.body;
    if (!userId) {
        throw new middleware_1.AppError('User authentication required', 401, 'UNAUTHORIZED');
    }
    // Validate M-PESA phone number
    if (!phoneNumber || !phoneNumber.match(/^(07|01)\d{8}$/)) {
        throw new middleware_1.ValidationError('Please enter a valid M-PESA phone number (07XXXXXXXX or 01XXXXXXXX)');
    }
    // Mask phone number (store only last 4 digits)
    const last4 = phoneNumber.slice(-4);
    const paymentMethod = await models_1.UserModel.addPaymentMethod(userId, {
        type: 'mpesa',
        phoneNumber,
        last4,
        accountName,
        isDefault
    });
    res.status(201).json({
        success: true,
        data: paymentMethod,
        message: 'M-PESA payment method added successfully'
    });
});
exports.deletePaymentMethod = (0, middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) {
        throw new middleware_1.AppError('User authentication required', 401, 'UNAUTHORIZED');
    }
    await models_1.UserModel.deletePaymentMethod(id, userId);
    res.json({
        success: true,
        message: 'Payment method deleted successfully'
    });
});
// Notification settings
exports.getNotificationSettings = (0, middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new middleware_1.AppError('User authentication required', 401, 'UNAUTHORIZED');
    }
    const settings = await models_1.UserModel.getNotificationSettings(userId);
    res.json({
        success: true,
        data: settings
    });
});
exports.updateNotificationSettings = (0, middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    const notificationSettings = req.body;
    if (!userId) {
        throw new middleware_1.AppError('User authentication required', 401, 'UNAUTHORIZED');
    }
    const updatedSettings = await models_1.UserModel.updateNotificationSettings(userId, notificationSettings);
    res.json({
        success: true,
        data: updatedSettings,
        message: 'Notification settings updated successfully'
    });
});
exports.updateAvatar = (0, middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new middleware_1.AppError('User authentication required', 401, 'UNAUTHORIZED');
    }
    if (!req.file) {
        throw new middleware_1.ValidationError('No file uploaded');
    }
    // In a real implementation, you would upload to a cloud service
    // For now, we'll use the file path
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    const updatedUser = await models_1.UserModel.updateAvatar(userId, avatarUrl);
    res.json({
        success: true,
        data: { avatar: avatarUrl },
        message: 'Avatar updated successfully'
    });
});
exports.deactivateUser = (0, middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const user = await models_1.UserModel.findById(id);
    if (!user) {
        throw new middleware_1.NotFoundError('User', id);
    }
    await models_1.UserModel.deactivate(id);
    res.json({
        success: true,
        message: 'User deactivated successfully'
    });
});
exports.activateUser = (0, middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const user = await models_1.UserModel.findById(id);
    if (!user) {
        throw new middleware_1.NotFoundError('User', id);
    }
    await models_1.UserModel.activate(id);
    res.json({
        success: true,
        message: 'User activated successfully'
    });
});
exports.deleteUser = (0, middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const user = await models_1.UserModel.findById(id);
    if (!user) {
        throw new middleware_1.NotFoundError('User', id);
    }
    await models_1.UserModel.delete(id);
    res.json({
        success: true,
        message: 'User deleted successfully'
    });
});
exports.getUserStats = (0, middleware_1.asyncHandler)(async (req, res) => {
    const { startDate, endDate } = req.query;
    const stats = await models_1.UserModel.getUserStats({
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined
    });
    res.json({
        success: true,
        data: stats
    });
});
// Admin user management endpoints
exports.createAdminUser = (0, middleware_1.asyncHandler)(async (req, res) => {
    const adminUserId = req.user?.id;
    const userData = req.body;
    if (!adminUserId) {
        throw new middleware_1.AppError('Admin authentication required', 401, 'UNAUTHORIZED');
    }
    // Check if user is admin
    const adminUser = await models_1.UserModel.findById(adminUserId);
    if (!adminUser || !adminUser.roles.includes('ADMIN')) {
        throw new middleware_1.AppError('Admin access required', 403, 'FORBIDDEN');
    }
    // Check if email already exists
    const existingUser = await models_1.UserModel.findByEmail(userData.email);
    if (existingUser) {
        throw new middleware_1.ValidationError('Email already exists');
    }
    const newAdmin = await models_1.UserModel.createAdmin({
        email: userData.email,
        username: userData.username,
        phone: userData.phone,
        profile: userData.profile,
        security: userData.security,
        roles: ['ADMIN']
    });
    res.status(201).json({
        success: true,
        data: newAdmin,
        message: 'Admin user created successfully'
    });
});
exports.blockUser = (0, middleware_1.asyncHandler)(async (req, res) => {
    const adminUserId = req.user?.id;
    const { id } = req.params;
    const { reason } = req.body;
    if (!adminUserId) {
        throw new middleware_1.AppError('Admin authentication required', 401, 'UNAUTHORIZED');
    }
    // Check if user is admin
    const adminUser = await models_1.UserModel.findById(adminUserId);
    if (!adminUser || !adminUser.roles.includes('ADMIN')) {
        throw new middleware_1.AppError('Admin access required', 403, 'FORBIDDEN');
    }
    // Cannot block yourself
    if (id === adminUserId) {
        throw new middleware_1.ValidationError('Cannot block yourself');
    }
    const blockedUser = await models_1.UserModel.blockUser(id, reason);
    res.json({
        success: true,
        data: blockedUser,
        message: 'User blocked successfully'
    });
});
exports.unblockUser = (0, middleware_1.asyncHandler)(async (req, res) => {
    const adminUserId = req.user?.id;
    const { id } = req.params;
    if (!adminUserId) {
        throw new middleware_1.AppError('Admin authentication required', 401, 'UNAUTHORIZED');
    }
    // Check if user is admin
    const adminUser = await models_1.UserModel.findById(adminUserId);
    if (!adminUser || !adminUser.roles.includes('ADMIN')) {
        throw new middleware_1.AppError('Admin access required', 403, 'FORBIDDEN');
    }
    const unblockedUser = await models_1.UserModel.unblockUser(id);
    res.json({
        success: true,
        data: unblockedUser,
        message: 'User unblocked successfully'
    });
});
exports.changeUserPassword = (0, middleware_1.asyncHandler)(async (req, res) => {
    const adminUserId = req.user?.id;
    const { id } = req.params;
    const { newPassword } = req.body;
    if (!adminUserId) {
        throw new middleware_1.AppError('Admin authentication required', 401, 'UNAUTHORIZED');
    }
    // Check if user is admin
    const adminUser = await models_1.UserModel.findById(adminUserId);
    if (!adminUser || !adminUser.roles.includes('ADMIN')) {
        throw new middleware_1.AppError('Admin access required', 403, 'FORBIDDEN');
    }
    if (!newPassword || newPassword.length < 6) {
        throw new middleware_1.ValidationError('Password must be at least 6 characters long');
    }
    const updatedUser = await models_1.UserModel.changeUserPassword(id, newPassword);
    res.json({
        success: true,
        data: updatedUser,
        message: 'User password changed successfully'
    });
});
exports.deleteUserAccount = (0, middleware_1.asyncHandler)(async (req, res) => {
    const adminUserId = req.user?.id;
    const { id } = req.params;
    if (!adminUserId) {
        throw new middleware_1.AppError('Admin authentication required', 401, 'UNAUTHORIZED');
    }
    // Check if user is admin
    const adminUser = await models_1.UserModel.findById(adminUserId);
    if (!adminUser || !adminUser.roles.includes('ADMIN')) {
        throw new middleware_1.AppError('Admin access required', 403, 'FORBIDDEN');
    }
    // Cannot delete yourself
    if (id === adminUserId) {
        throw new middleware_1.ValidationError('Cannot delete yourself');
    }
    await models_1.UserModel.delete(id);
    res.json({
        success: true,
        message: 'User account deleted successfully'
    });
});
//# sourceMappingURL=userController.js.map