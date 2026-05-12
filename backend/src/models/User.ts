import { prisma } from '../database'

export interface IUser {
  id: string
  email: string
  phone?: string | null
  username?: string | null
  roles: ('ADMIN' | 'BUYER' | 'AFFILIATE')[]
  walletBalance?: number | string | null
  voucherBalance?: number | string | null
  loyaltyPoints?: number | null
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date | null
  profile?: {
    fullName?: string
    firstName?: string
    lastName?: string
    avatar?: string
    bio?: string
  }
  security?: {
    password_hash?: string | null
    isEmailVerified: boolean
    isPhoneVerified: boolean
    is_active: boolean
    is_locked: boolean
    lock_reason?: string | null
    lastPasswordChange?: Date | null
  }
}

export const UserModel = {
  findById: async (id: string): Promise<IUser | null> => {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        security: true
      }
    })
    return user ? {
      ...user,
      walletBalance: user.walletBalance ? Number(user.walletBalance) : undefined,
      voucherBalance: user.voucherBalance ? Number(user.voucherBalance) : undefined,
      roles: user.roles as ('ADMIN' | 'BUYER' | 'AFFILIATE')[]
    } : null
  },

  findByEmail: async (email: string): Promise<IUser | null> => {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
        security: true
      }
    })
    return user ? {
      ...user,
      walletBalance: user.walletBalance ? Number(user.walletBalance) : undefined,
      voucherBalance: user.voucherBalance ? Number(user.voucherBalance) : undefined,
      roles: user.roles as ('ADMIN' | 'BUYER' | 'AFFILIATE')[]
    } : null
  },

  create: async (userData: Omit<IUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<IUser> => {
    const user = await prisma.user.create({
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
    })
    return {
      ...user,
      walletBalance: user.walletBalance ? Number(user.walletBalance) : undefined,
      voucherBalance: user.voucherBalance ? Number(user.voucherBalance) : undefined,
      roles: user.roles as ('ADMIN' | 'BUYER' | 'AFFILIATE')[]
    }
  },

  update: async (id: string, userData: Partial<IUser>): Promise<IUser> => {
    const updateData: any = {}
    
    if (userData.email) updateData.email = userData.email
    if (userData.phone !== undefined) updateData.phone = userData.phone
    if (userData.username !== undefined) updateData.username = userData.username
    if (userData.roles) updateData.roles = userData.roles

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        profile: true,
        security: true
      }
    })
    return {
      ...user,
      walletBalance: user.walletBalance ? Number(user.walletBalance) : undefined,
      voucherBalance: user.voucherBalance ? Number(user.voucherBalance) : undefined,
      roles: user.roles as ('ADMIN' | 'BUYER' | 'AFFILIATE')[]
    }
  },

  delete: async (id: string): Promise<void> => {
    // Perform cascade delete with all related data
    await prisma.$transaction(async (tx) => {
      // Delete user addresses
      await tx.address.deleteMany({ where: { userId: id } })
      
      // Delete payment methods
      await tx.paymentMethod.deleteMany({ where: { userId: id } })
      
      // Delete user settings
      await tx.userSettings.deleteMany({ where: { userId: id } })
      
      // Delete user sessions
      await tx.userSession.deleteMany({ where: { userId: id } })
      
      // Delete user profile
      await tx.userProfile.deleteMany({ where: { userId: id } })
      
      // Delete security settings
      await tx.userSecurity.deleteMany({ where: { userId: id } })
      
      // Delete cart items
      const userCart = await tx.cart.findUnique({ where: { userId: id } })
      if (userCart) {
        await tx.cartItem.deleteMany({ where: { cartId: userCart.id } })
        await tx.cart.delete({ where: { id: userCart.id } })
      }
      
      // Delete wishlist items
      const userWishlist = await tx.wishlist.findUnique({ where: { userId: id } })
      if (userWishlist) {
        await tx.wishlistItem.deleteMany({ where: { wishlistId: userWishlist.id } })
        await tx.wishlist.delete({ where: { id: userWishlist.id } })
      }
      
      // Delete affiliate data
      await tx.affiliate.deleteMany({ where: { userId: id } })
      
      // Delete subscriptions
      await tx.subscription.deleteMany({ where: { userId: id } })
      
      // Delete orders (set to null instead of deleting for audit)
      // Mark orders as deleted for audit instead of actually deleting them.
      // updateMany requires both `where` and `data`.
      await tx.order.updateMany({
        where: { userId: id },
        data: { deletedAt: new Date() }
      })
      
      // Finally delete the user
      await tx.user.delete({
        where: { id }
      })
    })
  },

  // Admin user management methods
  blockUser: async (id: string, reason?: string): Promise<IUser> => {
    const user = await prisma.user.update({
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
    })
    return {
      ...user,
      walletBalance: user.walletBalance ? Number(user.walletBalance) : undefined,
      voucherBalance: user.voucherBalance ? Number(user.voucherBalance) : undefined,
      roles: user.roles as ('ADMIN' | 'BUYER' | 'AFFILIATE')[]
    }
  },

  unblockUser: async (id: string): Promise<IUser> => {
    const user = await prisma.user.update({
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
    })
    return {
      ...user,
      walletBalance: user.walletBalance ? Number(user.walletBalance) : undefined,
      voucherBalance: user.voucherBalance ? Number(user.voucherBalance) : undefined,
      roles: user.roles as ('ADMIN' | 'BUYER' | 'AFFILIATE')[]
    }
  },

  changeUserPassword: async (id: string, newPassword: string): Promise<IUser> => {
    const bcrypt = require('bcryptjs')
    const hashedPassword = await bcrypt.hash(newPassword, 12)
    
    const user = await prisma.user.update({
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
    })
    return {
      ...user,
      walletBalance: user.walletBalance ? Number(user.walletBalance) : undefined,
      voucherBalance: user.voucherBalance ? Number(user.voucherBalance) : undefined,
      roles: user.roles as ('ADMIN' | 'BUYER' | 'AFFILIATE')[]
    }
  },

  createAdmin: async (userData: Omit<IUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<IUser> => {
    const user = await prisma.user.create({
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
    })
    return {
      ...user,
      walletBalance: user.walletBalance ? Number(user.walletBalance) : undefined,
      voucherBalance: user.voucherBalance ? Number(user.voucherBalance) : undefined,
      roles: user.roles as ('ADMIN' | 'BUYER' | 'AFFILIATE')[]
    }
  },

  findAll: async (params?: {
    page?: number
    limit?: number
    search?: string
    role?: string
  }): Promise<{ users: IUser[]; total: number }> => {
    const { page = 1, limit = 20, search, role } = params || {}
    const skip = (page - 1) * limit

    const where: any = {}
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { profile: { fullName: { contains: search, mode: 'insensitive' } } }
      ]
    }
    if (role) {
      where.roles = { has: role }
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          profile: true,
          security: true
        }
      }),
      prisma.user.count({ where })
    ])

    return {
      users: users.map(user => ({
        ...user,
        walletBalance: user.walletBalance ? Number(user.walletBalance) : undefined,
        voucherBalance: user.voucherBalance ? Number(user.voucherBalance) : undefined,
        roles: user.roles as ('ADMIN' | 'BUYER' | 'AFFILIATE')[]
      })),
      total
    }
  },

  verifyPassword: async (userId: string, password: string): Promise<boolean> => {
    const bcrypt = require('bcryptjs')
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { security: { select: { password_hash: true } } }
    })

    const hash = user?.security?.password_hash
    if (!hash) return false
    return bcrypt.compare(password, hash)
  },

  updatePassword: async (userId: string, newPassword: string): Promise<IUser> => {
    const bcrypt = require('bcryptjs')
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    const user = await prisma.user.update({
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
    })

    return {
      ...user,
      walletBalance: user.walletBalance ? Number(user.walletBalance) : undefined,
      voucherBalance: user.voucherBalance ? Number(user.voucherBalance) : undefined,
      roles: user.roles as ('ADMIN' | 'BUYER' | 'AFFILIATE')[]
    }
  },

  deactivate: async (userId: string): Promise<IUser> => {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        security: {
          update: { is_active: false }
        }
      },
      include: { profile: true, security: true }
    })

    return {
      ...user,
      walletBalance: user.walletBalance ? Number(user.walletBalance) : undefined,
      voucherBalance: user.voucherBalance ? Number(user.voucherBalance) : undefined,
      roles: user.roles as ('ADMIN' | 'BUYER' | 'AFFILIATE')[]
    }
  },

  activate: async (userId: string): Promise<IUser> => {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        security: {
          update: { is_active: true }
        }
      },
      include: { profile: true, security: true }
    })

    return {
      ...user,
      walletBalance: user.walletBalance ? Number(user.walletBalance) : undefined,
      voucherBalance: user.voucherBalance ? Number(user.voucherBalance) : undefined,
      roles: user.roles as ('ADMIN' | 'BUYER' | 'AFFILIATE')[]
    }
  },

  getUserStats: async (params: { startDate?: Date; endDate?: Date } = {}): Promise<{
    totalUsers: number
    newUsers: number
    activeUsers: number
    growthRate: number
  }> => {
    const { startDate, endDate } = params
    const where: any = {}
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = startDate
      if (endDate) where.createdAt.lte = endDate
    }

    const [totalUsers, newUsers] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.count({ where })
    ])

    const activeUsers = await prisma.user.count({
      where: {
        ...(where || {}),
        security: { is_active: true }
      }
    })

    const previousUsers = Math.max(0, totalUsers - newUsers)
    const growthRate = previousUsers === 0 ? 0 : (newUsers / previousUsers) * 100

    return {
      totalUsers,
      newUsers,
      activeUsers,
      growthRate
    }
  },

  // Address management methods
  getAddresses: async (userId: string) => {
    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: { isDefault: 'desc' }
    })
    return addresses
  },

  addAddress: async (userId: string, addressData: {
    street: string
    city: string
    postalCode: string
    country: string
    isDefault: boolean
  }) => {
    // If this is set as default, unset other default addresses
    if (addressData.isDefault) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false }
      })
    }

    const address = await prisma.address.create({
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
    })
    return address
  },

  updateAddress: async (userId: string, addressId: string, addressData: {
    street?: string
    city?: string
    postalCode?: string
    country?: string
    isDefault?: boolean
  }) => {
    // If this is set as default, unset other default addresses
    if (addressData.isDefault) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false }
      })
    }

    const address = await prisma.address.update({
      where: { id: addressId, userId },
      data: addressData
    })
    return address
  },

  deleteAddress: async (userId: string, addressId: string) => {
    await prisma.address.delete({
      where: { id: addressId, userId }
    })
  },

  setDefaultAddress: async (userId: string, addressId: string) => {
    // Unset all default addresses
    await prisma.address.updateMany({
      where: { userId },
      data: { isDefault: false }
    })

    // Set new default
    const address = await prisma.address.update({
      where: { id: addressId, userId },
      data: { isDefault: true }
    })
    return address
  },

  // Payment method management methods
  getPaymentMethods: async (userId: string) => {
    const paymentMethods = await prisma.paymentMethod.findMany({
      where: { userId },
      orderBy: { isDefault: 'desc' }
    })
    return paymentMethods
  },

  addPaymentMethod: async (userId: string, paymentData: {
    type: string
    phoneNumber?: string
    last4?: string
    accountName?: string
    isDefault: boolean
  }) => {
    // If this is set as default, unset other default payment methods
    if (paymentData.isDefault) {
      await prisma.paymentMethod.updateMany({
        where: { userId },
        data: { isDefault: false }
      })
    }

    const paymentMethod = await prisma.paymentMethod.create({
      data: {
        userId,
        ...paymentData
      }
    })
    return paymentMethod
  },

  deletePaymentMethod: async (userId: string, paymentMethodId: string) => {
    await prisma.paymentMethod.delete({
      where: { id: paymentMethodId, userId }
    })
  },

  // Notification settings methods
  getNotificationSettings: async (userId: string) => {
    const settings = await prisma.userSettings.findUnique({
      where: { userId }
    })
    return settings
  },

  updateNotificationSettings: async (userId: string, settingsData: {
    email: boolean
    sms: boolean
    push: boolean
    orderUpdates: boolean
    promotions: boolean
    newsletter: boolean
  }) => {
    const settings = await prisma.userSettings.upsert({
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
    })
    return settings
  },

  // Avatar update method
  updateAvatar: async (userId: string, avatarUrl: string) => {
    const user = await prisma.user.update({
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
    })
    return {
      ...user,
      walletBalance: user.walletBalance ? Number(user.walletBalance) : undefined,
      voucherBalance: user.voucherBalance ? Number(user.voucherBalance) : undefined,
      roles: user.roles as ('ADMIN' | 'BUYER' | 'AFFILIATE')[]
    }
  }
}

