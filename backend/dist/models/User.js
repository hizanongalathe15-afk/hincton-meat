"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const database_1 = require("../database");
exports.UserModel = {
    findById: async (id) => {
        const user = await database_1.prisma.user.findUnique({
            where: { id },
            include: {
                profile: true,
                security: true
            }
        });
        return user ? {
            ...user,
            walletBalance: user.walletBalance ? Number(user.walletBalance) : undefined,
            voucherBalance: user.voucherBalance ? Number(user.voucherBalance) : undefined,
            roles: user.roles
        } : null;
    },
    findByEmail: async (email) => {
        const user = await database_1.prisma.user.findUnique({
            where: { email },
            include: {
                profile: true,
                security: true
            }
        });
        return user ? {
            ...user,
            walletBalance: user.walletBalance ? Number(user.walletBalance) : undefined,
            voucherBalance: user.voucherBalance ? Number(user.voucherBalance) : undefined,
            roles: user.roles
        } : null;
    },
    create: async (userData) => {
        const user = await database_1.prisma.user.create({
            data: {
                email: userData.email,
                phone: userData.phone,
                username: userData.username,
                roles: userData.roles || ['BUYER'],
                profile: userData.profile ? {
                    create: userData.profile
                } : undefined,
                security: userData.security ? {
                    create: userData.security
                } : {
                    create: {
                        isEmailVerified: false,
                        isPhoneVerified: false,
                        is_active: true,
                        is_locked: false
                    }
                }
            },
            include: {
                profile: true,
                security: true
            }
        });
        return {
            ...user,
            walletBalance: user.walletBalance ? Number(user.walletBalance) : undefined,
            voucherBalance: user.voucherBalance ? Number(user.voucherBalance) : undefined,
            roles: user.roles
        };
    },
    update: async (id, userData) => {
        const updateData = {};
        if (userData.email)
            updateData.email = userData.email;
        if (userData.phone !== undefined)
            updateData.phone = userData.phone;
        if (userData.username !== undefined)
            updateData.username = userData.username;
        if (userData.roles)
            updateData.roles = userData.roles;
        const user = await database_1.prisma.user.update({
            where: { id },
            data: updateData,
            include: {
                profile: true,
                security: true
            }
        });
        return {
            ...user,
            walletBalance: user.walletBalance ? Number(user.walletBalance) : undefined,
            voucherBalance: user.voucherBalance ? Number(user.voucherBalance) : undefined,
            roles: user.roles
        };
    },
    delete: async (id) => {
        // Perform cascade delete with all related data
        await database_1.prisma.$transaction(async (tx) => {
            // Delete user addresses
            await tx.address.deleteMany({ where: { userId: id } });
            // Delete payment methods
            await tx.paymentMethod.deleteMany({ where: { userId: id } });
            // Delete user settings
            await tx.userSettings.deleteMany({ where: { userId: id } });
            // Delete user sessions
            await tx.userSession.deleteMany({ where: { userId: id } });
            // Delete user profile
            await tx.userProfile.deleteMany({ where: { userId: id } });
            // Delete security settings
            await tx.userSecurity.deleteMany({ where: { userId: id } });
            // Delete cart items
            const userCart = await tx.cart.findUnique({ where: { userId: id } });
            if (userCart) {
                await tx.cartItem.deleteMany({ where: { cartId: userCart.id } });
                await tx.cart.delete({ where: { id: userCart.id } });
            }
            // Delete wishlist items
            const userWishlist = await tx.wishlist.findUnique({ where: { userId: id } });
            if (userWishlist) {
                await tx.wishlistItem.deleteMany({ where: { wishlistId: userWishlist.id } });
                await tx.wishlist.delete({ where: { id: userWishlist.id } });
            }
            // Delete affiliate data
            await tx.affiliate.deleteMany({ where: { userId: id } });
            // Delete subscriptions
            await tx.subscription.deleteMany({ where: { userId: id } });
            // Delete orders (set to null instead of deleting for audit)
            // Mark orders as deleted for audit instead of actually deleting them.
            // updateMany requires both `where` and `data`.
            await tx.order.updateMany({
                where: { userId: id },
                data: { deletedAt: new Date() }
            });
            // Finally delete the user
            await tx.user.delete({
                where: { id }
            });
        });
    },
    // Admin user management methods
    blockUser: async (id, reason) => {
        const user = await database_1.prisma.user.update({
            where: { id },
            data: {
                security: {
                    update: {
                        is_locked: true,
                        lock_reason: reason
                    }
                }
            },
            include: {
                profile: true,
                security: true
            }
        });
        return {
            ...user,
            walletBalance: user.walletBalance ? Number(user.walletBalance) : undefined,
            voucherBalance: user.voucherBalance ? Number(user.voucherBalance) : undefined,
            roles: user.roles
        };
    },
    unblockUser: async (id) => {
        const user = await database_1.prisma.user.update({
            where: { id },
            data: {
                security: {
                    update: {
                        is_locked: false,
                        lock_reason: null
                    }
                }
            },
            include: {
                profile: true,
                security: true
            }
        });
        return {
            ...user,
            walletBalance: user.walletBalance ? Number(user.walletBalance) : undefined,
            voucherBalance: user.voucherBalance ? Number(user.voucherBalance) : undefined,
            roles: user.roles
        };
    },
    changeUserPassword: async (id, newPassword) => {
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        const user = await database_1.prisma.user.update({
            where: { id },
            data: {
                security: {
                    update: {
                        password_hash: hashedPassword
                    }
                }
            },
            include: {
                profile: true,
                security: true
            }
        });
        return {
            ...user,
            walletBalance: user.walletBalance ? Number(user.walletBalance) : undefined,
            voucherBalance: user.voucherBalance ? Number(user.voucherBalance) : undefined,
            roles: user.roles
        };
    },
    createAdmin: async (userData) => {
        const user = await database_1.prisma.user.create({
            data: {
                email: userData.email,
                phone: userData.phone,
                username: userData.username,
                roles: ['ADMIN'],
                profile: userData.profile ? {
                    create: userData.profile
                } : undefined,
                security: userData.security ? {
                    create: userData.security
                } : {
                    create: {
                        isEmailVerified: false,
                        isPhoneVerified: false,
                        is_active: true,
                        is_locked: false
                    }
                }
            },
            include: {
                profile: true,
                security: true
            }
        });
        return {
            ...user,
            walletBalance: user.walletBalance ? Number(user.walletBalance) : undefined,
            voucherBalance: user.voucherBalance ? Number(user.voucherBalance) : undefined,
            roles: user.roles
        };
    },
    findAll: async (params) => {
        const { page = 1, limit = 20, search, role } = params || {};
        const skip = (page - 1) * limit;
        const where = {};
        if (search) {
            where.OR = [
                { email: { contains: search, mode: 'insensitive' } },
                { username: { contains: search, mode: 'insensitive' } },
                { profile: { fullName: { contains: search, mode: 'insensitive' } } }
            ];
        }
        if (role) {
            where.roles = { has: role };
        }
        const [users, total] = await Promise.all([
            database_1.prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    profile: true,
                    security: true
                }
            }),
            database_1.prisma.user.count({ where })
        ]);
        return {
            users: users.map(user => ({
                ...user,
                walletBalance: user.walletBalance ? Number(user.walletBalance) : undefined,
                voucherBalance: user.voucherBalance ? Number(user.voucherBalance) : undefined,
                roles: user.roles
            })),
            total
        };
    },
    verifyPassword: async (userId, password) => {
        const bcrypt = require('bcryptjs');
        const user = await database_1.prisma.user.findUnique({
            where: { id: userId },
            select: { security: { select: { password_hash: true } } }
        });
        const hash = user?.security?.password_hash;
        if (!hash)
            return false;
        return bcrypt.compare(password, hash);
    },
    updatePassword: async (userId, newPassword) => {
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        const user = await database_1.prisma.user.update({
            where: { id: userId },
            data: {
                security: {
                    update: {
                        password_hash: hashedPassword
                    }
                }
            },
            include: {
                profile: true,
                security: true
            }
        });
        return {
            ...user,
            walletBalance: user.walletBalance ? Number(user.walletBalance) : undefined,
            voucherBalance: user.voucherBalance ? Number(user.voucherBalance) : undefined,
            roles: user.roles
        };
    },
    deactivate: async (userId) => {
        const user = await database_1.prisma.user.update({
            where: { id: userId },
            data: {
                security: {
                    update: { is_active: false }
                }
            },
            include: { profile: true, security: true }
        });
        return {
            ...user,
            walletBalance: user.walletBalance ? Number(user.walletBalance) : undefined,
            voucherBalance: user.voucherBalance ? Number(user.voucherBalance) : undefined,
            roles: user.roles
        };
    },
    activate: async (userId) => {
        const user = await database_1.prisma.user.update({
            where: { id: userId },
            data: {
                security: {
                    update: { is_active: true }
                }
            },
            include: { profile: true, security: true }
        });
        return {
            ...user,
            walletBalance: user.walletBalance ? Number(user.walletBalance) : undefined,
            voucherBalance: user.voucherBalance ? Number(user.voucherBalance) : undefined,
            roles: user.roles
        };
    },
    getUserStats: async (params = {}) => {
        const { startDate, endDate } = params;
        const where = {};
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate)
                where.createdAt.gte = startDate;
            if (endDate)
                where.createdAt.lte = endDate;
        }
        const [totalUsers, newUsers] = await Promise.all([
            database_1.prisma.user.count({ where }),
            database_1.prisma.user.count({ where })
        ]);
        const activeUsers = await database_1.prisma.user.count({
            where: {
                ...(where || {}),
                security: { is_active: true }
            }
        });
        const previousUsers = Math.max(0, totalUsers - newUsers);
        const growthRate = previousUsers === 0 ? 0 : (newUsers / previousUsers) * 100;
        return {
            totalUsers,
            newUsers,
            activeUsers,
            growthRate
        };
    },
    // Address management methods
    getAddresses: async (userId) => {
        const addresses = await database_1.prisma.address.findMany({
            where: { userId },
            orderBy: { isDefault: 'desc' }
        });
        return addresses;
    },
    addAddress: async (userId, addressData) => {
        // If this is set as default, unset other default addresses
        if (addressData.isDefault) {
            await database_1.prisma.address.updateMany({
                where: { userId },
                data: { isDefault: false }
            });
        }
        const address = await database_1.prisma.address.create({
            data: {
                userId,
                addressLine1: addressData.street,
                city: addressData.city,
                postalCode: addressData.postalCode,
                country: addressData.country,
                isDefault: addressData.isDefault,
                firstName: '', // TODO: Add proper fields
                lastName: '',
                state: ''
            }
        });
        return address;
    },
    updateAddress: async (userId, addressId, addressData) => {
        // If this is set as default, unset other default addresses
        if (addressData.isDefault) {
            await database_1.prisma.address.updateMany({
                where: { userId },
                data: { isDefault: false }
            });
        }
        const address = await database_1.prisma.address.update({
            where: { id: addressId, userId },
            data: addressData
        });
        return address;
    },
    deleteAddress: async (userId, addressId) => {
        await database_1.prisma.address.delete({
            where: { id: addressId, userId }
        });
    },
    setDefaultAddress: async (userId, addressId) => {
        // Unset all default addresses
        await database_1.prisma.address.updateMany({
            where: { userId },
            data: { isDefault: false }
        });
        // Set new default
        const address = await database_1.prisma.address.update({
            where: { id: addressId, userId },
            data: { isDefault: true }
        });
        return address;
    },
    // Payment method management methods
    getPaymentMethods: async (userId) => {
        const paymentMethods = await database_1.prisma.paymentMethod.findMany({
            where: { userId },
            orderBy: { isDefault: 'desc' }
        });
        return paymentMethods;
    },
    addPaymentMethod: async (userId, paymentData) => {
        // If this is set as default, unset other default payment methods
        if (paymentData.isDefault) {
            await database_1.prisma.paymentMethod.updateMany({
                where: { userId },
                data: { isDefault: false }
            });
        }
        const paymentMethod = await database_1.prisma.paymentMethod.create({
            data: {
                userId,
                ...paymentData
            }
        });
        return paymentMethod;
    },
    deletePaymentMethod: async (userId, paymentMethodId) => {
        await database_1.prisma.paymentMethod.delete({
            where: { id: paymentMethodId, userId }
        });
    },
    // Notification settings methods
    getNotificationSettings: async (userId) => {
        const settings = await database_1.prisma.userSettings.findUnique({
            where: { userId }
        });
        return settings;
    },
    updateNotificationSettings: async (userId, settingsData) => {
        const settings = await database_1.prisma.userSettings.upsert({
            where: { userId },
            update: {
                emailOrder: settingsData.orderUpdates,
                emailPromotion: settingsData.promotions,
                emailNewsletter: settingsData.newsletter,
                smsOrder: settingsData.orderUpdates,
                smsPromotion: settingsData.promotions,
                pushOrder: settingsData.orderUpdates,
                pushPromotion: settingsData.promotions
            },
            create: {
                userId,
                emailOrder: settingsData.orderUpdates,
                emailPromotion: settingsData.promotions,
                emailNewsletter: settingsData.newsletter,
                smsOrder: settingsData.orderUpdates,
                smsPromotion: settingsData.promotions,
                pushOrder: settingsData.orderUpdates,
                pushPromotion: settingsData.promotions
            }
        });
        return settings;
    },
    // Avatar update method
    updateAvatar: async (userId, avatarUrl) => {
        const user = await database_1.prisma.user.update({
            where: { id: userId },
            data: {
                profile: {
                    update: { avatar: avatarUrl }
                }
            },
            include: {
                profile: true,
                security: true
            }
        });
        return {
            ...user,
            walletBalance: user.walletBalance ? Number(user.walletBalance) : undefined,
            voucherBalance: user.voucherBalance ? Number(user.voucherBalance) : undefined,
            roles: user.roles
        };
    }
};
//# sourceMappingURL=User.js.map