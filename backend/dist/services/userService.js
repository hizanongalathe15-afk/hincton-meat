"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = void 0;
// @ts-nocheck
const database_1 = require("../database");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
class UserService {
    async createUser(userData) {
        try {
            // Check if user already exists
            const existingUser = await database_1.prisma.user.findFirst({
                where: {
                    OR: [
                        { email: userData.email },
                        { username: userData.username }
                    ]
                }
            });
            if (existingUser) {
                return {
                    success: false,
                    error: 'User with this email or username already exists'
                };
            }
            // Hash password
            const hashedPassword = await bcryptjs_1.default.hash(userData.password, 12);
            // Create user
            const user = await database_1.prisma.user.create({
                data: {
                    email: userData.email,
                    username: userData.username,
                    passwordHash: hashedPassword,
                    firstName: userData.firstName || '',
                    lastName: userData.lastName || '',
                    phone: userData.phone || '',
                    roles: [userData.role || 'BUYER'],
                    isActive: true,
                    isBlocked: false,
                    walletBalance: 0,
                    voucherBalance: 0,
                    loyaltyPoints: 0
                },
                select: {
                    id: true,
                    email: true,
                    username: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                    roles: true,
                    isActive: true,
                    createdAt: true
                }
            });
            return {
                success: true,
                user
            };
        }
        catch (error) {
            console.error('User creation error:', error);
            return {
                success: false,
                error: 'Failed to create user'
            };
        }
    }
    async updateUser(userId, updateData) {
        try {
            const user = await database_1.prisma.user.findUnique({
                where: { id: userId }
            });
            if (!user) {
                return {
                    success: false,
                    error: 'User not found'
                };
            }
            const updatedUser = await database_1.prisma.user.update({
                where: { id: userId },
                data: {
                    firstName: updateData.firstName,
                    lastName: updateData.lastName,
                    phone: updateData.phone,
                    address: updateData.address,
                    updatedAt: new Date()
                }
            });
            return {
                success: true,
                user: updatedUser
            };
        }
        catch (error) {
            console.error('User update error:', error);
            return {
                success: false,
                error: 'Failed to update user'
            };
        }
    }
    async getUserProfile(userId) {
        try {
            const user = await database_1.prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    email: true,
                    username: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                    address: true,
                    roles: true,
                    isActive: true,
                    isBlocked: true,
                    walletBalance: true,
                    voucherBalance: true,
                    loyaltyPoints: true,
                    createdAt: true,
                    lastLogin: true
                }
            });
            if (!user) {
                return {
                    error: 'User not found'
                };
            }
            return {
                user
            };
        }
        catch (error) {
            console.error('Get user profile error:', error);
            return {
                error: 'Failed to get user profile'
            };
        }
    }
    async changePassword(userId, currentPassword, newPassword) {
        try {
            const user = await database_1.prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    passwordHash: true
                }
            });
            if (!user) {
                return {
                    success: false,
                    error: 'User not found'
                };
            }
            // Verify current password
            const isCurrentPasswordValid = await bcryptjs_1.default.compare(currentPassword, user.passwordHash);
            if (!isCurrentPasswordValid) {
                return {
                    success: false,
                    error: 'Current password is incorrect'
                };
            }
            // Hash new password
            const hashedNewPassword = await bcryptjs_1.default.hash(newPassword, 12);
            // Update password
            await database_1.prisma.user.update({
                where: { id: userId },
                data: {
                    passwordHash: hashedNewPassword,
                    lastPasswordChange: new Date()
                }
            });
            return {
                success: true
            };
        }
        catch (error) {
            console.error('Change password error:', error);
            return {
                success: false,
                error: 'Failed to change password'
            };
        }
    }
    async blockUser(userId, reason, blockedBy) {
        try {
            const user = await database_1.prisma.user.findUnique({
                where: { id: userId }
            });
            if (!user) {
                return {
                    success: false,
                    error: 'User not found'
                };
            }
            await database_1.prisma.user.update({
                where: { id: userId },
                data: {
                    isBlocked: true,
                    blockedAt: new Date(),
                    blockedBy,
                    blockReason: reason,
                    isActive: false
                }
            });
            return {
                success: true
            };
        }
        catch (error) {
            console.error('Block user error:', error);
            return {
                success: false,
                error: 'Failed to block user'
            };
        }
    }
    async unblockUser(userId) {
        try {
            const user = await database_1.prisma.user.findUnique({
                where: { id: userId }
            });
            if (!user) {
                return {
                    success: false,
                    error: 'User not found'
                };
            }
            await database_1.prisma.user.update({
                where: { id: userId },
                data: {
                    isBlocked: false,
                    blockedAt: null,
                    blockedBy: null,
                    blockReason: null,
                    isActive: true
                }
            });
            return {
                success: true
            };
        }
        catch (error) {
            console.error('Unblock user error:', error);
            return {
                success: false,
                error: 'Failed to unblock user'
            };
        }
    }
    async deleteUser(userId) {
        try {
            const user = await database_1.prisma.user.findUnique({
                where: { id: userId }
            });
            if (!user) {
                return {
                    success: false,
                    error: 'User not found'
                };
            }
            // Soft delete (set isActive to false)
            await database_1.prisma.user.update({
                where: { id: userId },
                data: {
                    isActive: false,
                    deletedAt: new Date()
                }
            });
            return {
                success: true
            };
        }
        catch (error) {
            console.error('Delete user error:', error);
            return {
                success: false,
                error: 'Failed to delete user'
            };
        }
    }
    async createAdminUser(userData) {
        try {
            // Check if user already exists
            const existingUser = await database_1.prisma.user.findFirst({
                where: {
                    OR: [
                        { email: userData.email },
                        { username: userData.username }
                    ]
                }
            });
            if (existingUser) {
                return {
                    success: false,
                    error: 'User with this email or username already exists'
                };
            }
            // Hash password
            const hashedPassword = await bcryptjs_1.default.hash(userData.password, 12);
            // Create admin user
            const user = await database_1.prisma.user.create({
                data: {
                    email: userData.email,
                    username: userData.username,
                    passwordHash: hashedPassword,
                    firstName: userData.firstName || '',
                    lastName: userData.lastName || '',
                    phone: userData.phone || '',
                    roles: ['ADMIN'],
                    isActive: true,
                    isBlocked: false,
                    walletBalance: 0,
                    voucherBalance: 0,
                    loyaltyPoints: 0
                },
                select: {
                    id: true,
                    email: true,
                    username: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                    roles: true,
                    isActive: true,
                    createdAt: true
                }
            });
            return {
                success: true,
                user
            };
        }
        catch (error) {
            console.error('Admin user creation error:', error);
            return {
                success: false,
                error: 'Failed to create admin user'
            };
        }
    }
    async getUserStats(dateRange) {
        try {
            const where = dateRange ? {
                createdAt: {
                    gte: dateRange.from,
                    lte: dateRange.to
                }
            } : {};
            const [totalUsers, activeUsers, blockedUsers, roleData] = await Promise.all([
                database_1.prisma.user.count({ where }),
                database_1.prisma.user.count({
                    where: { ...where, isActive: true, isBlocked: false }
                }),
                database_1.prisma.user.count({
                    where: { ...where, isBlocked: true }
                }),
                database_1.prisma.user.groupBy({
                    by: ['roles'],
                    where,
                    _count: { id: true }
                })
            ]);
            // Count new users (created in last 30 days)
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const newUsers = await database_1.prisma.user.count({
                where: {
                    ...where,
                    createdAt: { gte: thirtyDaysAgo }
                }
            });
            const usersByRole = roleData.reduce((acc, item) => {
                const role = Array.isArray(item.roles) ? item.roles[0] : 'BUYER';
                acc[role] = (acc[role] || 0) + item._count.id;
                return acc;
            }, {});
            return {
                totalUsers,
                activeUsers,
                newUsers,
                blockedUsers,
                usersByRole
            };
        }
        catch (error) {
            console.error('User stats error:', error);
            return {
                totalUsers: 0,
                activeUsers: 0,
                newUsers: 0,
                blockedUsers: 0,
                usersByRole: {}
            };
        }
    }
    async searchUsers(query, page = 1, limit = 20) {
        try {
            const skip = (page - 1) * limit;
            const where = {
                isActive: true,
                isBlocked: false,
                OR: [
                    { firstName: { contains: query, mode: 'insensitive' } },
                    { lastName: { contains: query, mode: 'insensitive' } },
                    { email: { contains: query, mode: 'insensitive' } },
                    { username: { contains: query, mode: 'insensitive' } }
                ]
            };
            const [users, total] = await Promise.all([
                database_1.prisma.user.findMany({
                    where,
                    select: {
                        id: true,
                        email: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                        roles: true,
                        isActive: true,
                        isBlocked: true,
                        createdAt: true,
                        lastLogin: true
                    },
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: limit
                }),
                database_1.prisma.user.count({ where })
            ]);
            return {
                users,
                total,
                page,
                pages: Math.ceil(total / limit)
            };
        }
        catch (error) {
            console.error('User search error:', error);
            return {
                users: [],
                total: 0,
                page: 1,
                pages: 0
            };
        }
    }
    async updateUserRole(userId, role) {
        try {
            const user = await database_1.prisma.user.findUnique({
                where: { id: userId }
            });
            if (!user) {
                return {
                    success: false,
                    error: 'User not found'
                };
            }
            await database_1.prisma.user.update({
                where: { id: userId },
                data: {
                    roles: [role]
                }
            });
            return {
                success: true
            };
        }
        catch (error) {
            console.error('Update user role error:', error);
            return {
                success: false,
                error: 'Failed to update user role'
            };
        }
    }
    async updateUserPreferences(userId, preferences) {
        try {
            const user = await database_1.prisma.user.findUnique({
                where: { id: userId }
            });
            if (!user) {
                return {
                    success: false,
                    error: 'User not found'
                };
            }
            await database_1.prisma.user.update({
                where: { id: userId },
                data: {
                    preferences: preferences
                }
            });
            return {
                success: true
            };
        }
        catch (error) {
            console.error('Update user preferences error:', error);
            return {
                success: false,
                error: 'Failed to update user preferences'
            };
        }
    }
    async getUserActivity(userId, days = 30) {
        try {
            const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
            const [loginCount, lastLogin] = await Promise.all([
                database_1.prisma.userActivity.count({
                    where: {
                        userId,
                        activityType: 'LOGIN',
                        timestamp: { gte: startDate }
                    }
                }),
                database_1.prisma.userActivity.findFirst({
                    where: {
                        userId,
                        activityType: 'LOGIN'
                    },
                    orderBy: { timestamp: 'desc' },
                    select: { timestamp: true }
                })
            ]);
            // Calculate average session duration (mock data)
            const averageSessionDuration = Math.floor(Math.random() * 30) + 10; // 10-40 minutes
            return {
                loginCount,
                lastLogin,
                averageSessionDuration
            };
        }
        catch (error) {
            console.error('User activity error:', error);
            return {
                loginCount: 0,
                lastLogin: null,
                averageSessionDuration: 0
            };
        }
    }
}
exports.userService = new UserService();
exports.default = exports.userService;
//# sourceMappingURL=userService.js.map