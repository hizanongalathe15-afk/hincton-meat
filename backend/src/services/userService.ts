// @ts-nocheck
import { prisma } from '../database'
import bcrypt from 'bcryptjs'

export interface UserProfile {
  firstName?: string
  lastName?: string
  phone?: string
  address?: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  preferences?: {
    emailNotifications: boolean
    smsNotifications: boolean
    marketingEmails: boolean
  }
}

export interface CreateUserData {
  email: string
  username: string
  password: string
  firstName?: string
  lastName?: string
  phone?: string
  role?: 'ADMIN' | 'BUYER' | 'AFFILIATE'
}

export interface UpdateUserData {
  firstName?: string
  lastName?: string
  phone?: string
  address?: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  preferences?: {
    emailNotifications?: boolean
    smsNotifications?: boolean
    marketingEmails?: boolean
  }
}

class UserService {
  async createUser(userData: CreateUserData): Promise<{
    success: boolean
    user?: any
    error?: string
  }> {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: userData.email },
            { username: userData.username }
          ]
        }
      })

      if (existingUser) {
        return {
          success: false,
          error: 'User with this email or username already exists'
        }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 12)

      // Create user
      const user = await prisma.user.create({
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
      })

      return {
        success: true,
        user
      }

    } catch (error) {
      console.error('User creation error:', error)
      return {
        success: false,
        error: 'Failed to create user'
      }
    }
  }

  async updateUser(userId: string, updateData: UpdateUserData): Promise<{
    success: boolean
    user?: any
    error?: string
  }> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })

      if (!user) {
        return {
          success: false,
          error: 'User not found'
        }
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          firstName: updateData.firstName,
          lastName: updateData.lastName,
          phone: updateData.phone,
          address: updateData.address as any,
          updatedAt: new Date()
        }
      })

      return {
        success: true,
        user: updatedUser
      }

    } catch (error) {
      console.error('User update error:', error)
      return {
        success: false,
        error: 'Failed to update user'
      }
    }
  }

  async getUserProfile(userId: string): Promise<{
    user?: any
    error?: string
  }> {
    try {
      const user = await prisma.user.findUnique({
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
      })

      if (!user) {
        return {
          error: 'User not found'
        }
      }

      return {
        user
      }

    } catch (error) {
      console.error('Get user profile error:', error)
      return {
        error: 'Failed to get user profile'
      }
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          passwordHash: true
        }
      })

      if (!user) {
        return {
          success: false,
          error: 'User not found'
        }
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash)
      if (!isCurrentPasswordValid) {
        return {
          success: false,
          error: 'Current password is incorrect'
        }
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 12)

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: {
          passwordHash: hashedNewPassword,
          lastPasswordChange: new Date()
        }
      })

      return {
        success: true
      }

    } catch (error) {
      console.error('Change password error:', error)
      return {
        success: false,
        error: 'Failed to change password'
      }
    }
  }

  async blockUser(userId: string, reason: string, blockedBy: string): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })

      if (!user) {
        return {
          success: false,
          error: 'User not found'
        }
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          isBlocked: true,
          blockedAt: new Date(),
          blockedBy,
          blockReason: reason,
          isActive: false
        }
      })

      return {
        success: true
      }

    } catch (error) {
      console.error('Block user error:', error)
      return {
        success: false,
        error: 'Failed to block user'
      }
    }
  }

  async unblockUser(userId: string): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })

      if (!user) {
        return {
          success: false,
          error: 'User not found'
        }
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          isBlocked: false,
          blockedAt: null,
          blockedBy: null,
          blockReason: null,
          isActive: true
        }
      })

      return {
        success: true
      }

    } catch (error) {
      console.error('Unblock user error:', error)
      return {
        success: false,
        error: 'Failed to unblock user'
      }
    }
  }

  async deleteUser(userId: string): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })

      if (!user) {
        return {
          success: false,
          error: 'User not found'
        }
      }

      // Soft delete (set isActive to false)
      await prisma.user.update({
        where: { id: userId },
        data: {
          isActive: false,
          deletedAt: new Date()
        }
      })

      return {
        success: true
      }

    } catch (error) {
      console.error('Delete user error:', error)
      return {
        success: false,
        error: 'Failed to delete user'
      }
    }
  }

  async createAdminUser(userData: CreateUserData): Promise<{
    success: boolean
    user?: any
    error?: string
  }> {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: userData.email },
            { username: userData.username }
          ]
        }
      })

      if (existingUser) {
        return {
          success: false,
          error: 'User with this email or username already exists'
        }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 12)

      // Create admin user
      const user = await prisma.user.create({
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
      })

      return {
        success: true,
        user
      }

    } catch (error) {
      console.error('Admin user creation error:', error)
      return {
        success: false,
        error: 'Failed to create admin user'
      }
    }
  }

  async getUserStats(dateRange?: { from: Date; to: Date }): Promise<{
    totalUsers: number
    activeUsers: number
    newUsers: number
    blockedUsers: number
    usersByRole: Record<string, number>
  }> {
    try {
      const where = dateRange ? {
        createdAt: {
          gte: dateRange.from,
          lte: dateRange.to
        }
      } : {}

      const [
        totalUsers,
        activeUsers,
        blockedUsers,
        roleData
      ] = await Promise.all([
        prisma.user.count({ where }),
        prisma.user.count({ 
          where: { ...where, isActive: true, isBlocked: false }
        }),
        prisma.user.count({ 
          where: { ...where, isBlocked: true }
        }),
        prisma.user.groupBy({
          by: ['roles'],
          where,
          _count: { id: true }
        })
      ])

      // Count new users (created in last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      const newUsers = await prisma.user.count({
        where: {
          ...where,
          createdAt: { gte: thirtyDaysAgo }
        }
      })

      const usersByRole = roleData.reduce((acc, item) => {
        const role = Array.isArray(item.roles) ? item.roles[0] : 'BUYER'
        acc[role] = (acc[role] || 0) + item._count.id
        return acc
      }, {} as Record<string, number>)

      return {
        totalUsers,
        activeUsers,
        newUsers,
        blockedUsers,
        usersByRole
      }

    } catch (error) {
      console.error('User stats error:', error)
      return {
        totalUsers: 0,
        activeUsers: 0,
        newUsers: 0,
        blockedUsers: 0,
        usersByRole: {}
      }
    }
  }

  async searchUsers(query: string, page: number = 1, limit: number = 20): Promise<{
    users: any[]
    total: number
    page: number
    pages: number
  }> {
    try {
      const skip = (page - 1) * limit

      const where = {
        isActive: true,
        isBlocked: false,
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { username: { contains: query, mode: 'insensitive' } }
        ]
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
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
        prisma.user.count({ where })
      ])

      return {
        users,
        total,
        page,
        pages: Math.ceil(total / limit)
      }

    } catch (error) {
      console.error('User search error:', error)
      return {
        users: [],
        total: 0,
        page: 1,
        pages: 0
      }
    }
  }

  async updateUserRole(userId: string, role: 'ADMIN' | 'BUYER' | 'AFFILIATE'): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })

      if (!user) {
        return {
          success: false,
          error: 'User not found'
        }
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          roles: [role]
        }
      })

      return {
        success: true
      }

    } catch (error) {
      console.error('Update user role error:', error)
      return {
        success: false,
        error: 'Failed to update user role'
      }
    }
  }

  async updateUserPreferences(userId: string, preferences: UserProfile['preferences']): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })

      if (!user) {
        return {
          success: false,
          error: 'User not found'
        }
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          preferences: preferences as any
        }
      })

      return {
        success: true
      }

    } catch (error) {
      console.error('Update user preferences error:', error)
      return {
        success: false,
        error: 'Failed to update user preferences'
      }
    }
  }

  async getUserActivity(userId: string, days: number = 30): Promise<{
    loginCount: number
    lastLogin: Date | null
    averageSessionDuration: number
  }> {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

      const [loginCount, lastLogin] = await Promise.all([
        prisma.userActivity.count({
          where: {
            userId,
            activityType: 'LOGIN',
            timestamp: { gte: startDate }
          }
        }),
        prisma.userActivity.findFirst({
          where: {
            userId,
            activityType: 'LOGIN'
          },
          orderBy: { timestamp: 'desc' },
          select: { timestamp: true }
        })
      ])

      // Calculate average session duration (mock data)
      const averageSessionDuration = Math.floor(Math.random() * 30) + 10 // 10-40 minutes

      return {
        loginCount,
        lastLogin,
        averageSessionDuration
      }

    } catch (error) {
      console.error('User activity error:', error)
      return {
        loginCount: 0,
        lastLogin: null,
        averageSessionDuration: 0
      }
    }
  }
}

export const userService = new UserService()
export default userService
