import { Request, Response, NextFunction } from 'express'
import { UserModel } from '../models'
import { asyncHandler, AppError, NotFoundError, ValidationError } from '../middleware'
import { validateBody } from '../middleware'
import { userUpdateSchema, passwordChangeSchema } from '../middleware/validationSchemas'

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id
  
  if (!userId) {
    throw new AppError('User authentication required', 401, 'UNAUTHORIZED')
  }
  
  const user = await UserModel.findById(userId)
  if (!user) {
    throw new NotFoundError('User', userId)
  }
  
  res.json({
    success: true,
    data: user
  })
})

export const updateProfile = [
  validateBody(userUpdateSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id
    const updateData = req.body
    
    if (!userId) {
      throw new AppError('User authentication required', 401, 'UNAUTHORIZED')
    }
    
    // Check if user exists
    const existingUser = await UserModel.findById(userId)
    if (!existingUser) {
      throw new NotFoundError('User', userId)
    }
    
    // If email is being updated, check for uniqueness
    if (updateData.email && updateData.email !== existingUser.email) {
      const emailExists = await UserModel.findByEmail(updateData.email)
      if (emailExists) {
        throw new ValidationError('Email already exists')
      }
    }
    
    const updatedUser = await UserModel.update(userId, updateData)
    
    res.json({
      success: true,
      data: updatedUser,
      message: 'Profile updated successfully'
    })
  })
]

export const changePassword = [
  validateBody(passwordChangeSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id
    const { currentPassword, newPassword } = req.body
    
    if (!userId) {
      throw new AppError('User authentication required', 401, 'UNAUTHORIZED')
    }
    
    // Check if user exists
    const user = await UserModel.findById(userId)
    if (!user) {
      throw new NotFoundError('User', userId)
    }
    
    // Verify current password
    const isCurrentPasswordValid = await UserModel.verifyPassword(userId, currentPassword)
    if (!isCurrentPasswordValid) {
      throw new ValidationError('Current password is incorrect')
    }
    
    // Update password
    await UserModel.updatePassword(userId, newPassword)
    
    res.json({
      success: true,
      message: 'Password changed successfully'
    })
  })
]

export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 20, search, role, isActive } = req.query
  
  const result = await UserModel.findAll({
    page: Number(page),
    limit: Number(limit),
    search: search as string,
    role: role as string
  } as any)
  
  res.json({
    success: true,
    data: result.users,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: result.total,
      pages: Math.ceil(result.total / Number(limit))
    }
  })
})

export const getUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  
  const user = await UserModel.findById(id)
  if (!user) {
    throw new NotFoundError('User', id)
  }
  
  res.json({
    success: true,
    data: user
  })
})

export const updateUser = [
  validateBody(userUpdateSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const updateData = req.body
    
    const user = await UserModel.findById(id)
    if (!user) {
      throw new NotFoundError('User', id)
    }
    
    // If email is being updated, check for uniqueness
    if (updateData.email && updateData.email !== user.email) {
      const emailExists = await UserModel.findByEmail(updateData.email)
      if (emailExists) {
        throw new ValidationError('Email already exists')
      }
    }
    
    const updatedUser = await UserModel.update(id, updateData)
    
    res.json({
      success: true,
      data: updatedUser,
      message: 'User updated successfully'
    })
  })
]

// Address management
export const getAddresses = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id
  
  if (!userId) {
    throw new AppError('User authentication required', 401, 'UNAUTHORIZED')
  }

  const addresses = await UserModel.getAddresses(userId)
  
  res.json({
    success: true,
    data: addresses
  })
})

export const addAddress = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id
  const { street, city, postalCode, country, isDefault } = req.body
  
  if (!userId) {
    throw new AppError('User authentication required', 401, 'UNAUTHORIZED')
  }

  const address = await UserModel.addAddress(userId, {
    street,
    city,
    postalCode,
    country,
    isDefault
  })
  
  res.status(201).json({
    success: true,
    data: address,
    message: 'Address added successfully'
  })
})

export const updateAddress = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id
  const { id } = req.params
  const updateData = req.body
  
  if (!userId) {
    throw new AppError('User authentication required', 401, 'UNAUTHORIZED')
  }

  const address = await UserModel.updateAddress(id, userId, updateData)
  
  res.json({
    success: true,
    data: address,
    message: 'Address updated successfully'
  })
})

export const deleteAddress = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id
  const { id } = req.params
  
  if (!userId) {
    throw new AppError('User authentication required', 401, 'UNAUTHORIZED')
  }

  await UserModel.deleteAddress(id, userId)
  
  res.json({
    success: true,
    message: 'Address deleted successfully'
  })
})

export const setDefaultAddress = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id
  const { id } = req.params
  
  if (!userId) {
    throw new AppError('User authentication required', 401, 'UNAUTHORIZED')
  }

  await UserModel.setDefaultAddress(id, userId)
  
  res.json({
    success: true,
    message: 'Default address updated successfully'
  })
})

// Payment method management
export const getPaymentMethods = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id
  
  if (!userId) {
    throw new AppError('User authentication required', 401, 'UNAUTHORIZED')
  }

  const paymentMethods = await UserModel.getPaymentMethods(userId)
  
  res.json({
    success: true,
    data: paymentMethods
  })
})

export const addPaymentMethod = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id
  const { type, phoneNumber, accountName, isDefault } = req.body
  
  if (!userId) {
    throw new AppError('User authentication required', 401, 'UNAUTHORIZED')
  }

  // Validate M-PESA phone number
  if (!phoneNumber || !phoneNumber.match(/^(07|01)\d{8}$/)) {
    throw new ValidationError('Please enter a valid M-PESA phone number (07XXXXXXXX or 01XXXXXXXX)')
  }

  // Mask phone number (store only last 4 digits)
  const last4 = phoneNumber.slice(-4)

  const paymentMethod = await UserModel.addPaymentMethod(userId, {
    type: 'mpesa',
    phoneNumber,
    last4,
    accountName,
    isDefault
  })
  
  res.status(201).json({
    success: true,
    data: paymentMethod,
    message: 'M-PESA payment method added successfully'
  })
})

export const deletePaymentMethod = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id
  const { id } = req.params
  
  if (!userId) {
    throw new AppError('User authentication required', 401, 'UNAUTHORIZED')
  }

  await UserModel.deletePaymentMethod(id, userId)
  
  res.json({
    success: true,
    message: 'Payment method deleted successfully'
  })
})

// Notification settings
export const getNotificationSettings = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id
  
  if (!userId) {
    throw new AppError('User authentication required', 401, 'UNAUTHORIZED')
  }

  const settings = await UserModel.getNotificationSettings(userId)
  
  res.json({
    success: true,
    data: settings
  })
})

export const updateNotificationSettings = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id
  const notificationSettings = req.body
  
  if (!userId) {
    throw new AppError('User authentication required', 401, 'UNAUTHORIZED')
  }

  const updatedSettings = await UserModel.updateNotificationSettings(userId, notificationSettings)
  
  res.json({
    success: true,
    data: updatedSettings,
    message: 'Notification settings updated successfully'
  })
})

export const updateAvatar = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id
  
  if (!userId) {
    throw new AppError('User authentication required', 401, 'UNAUTHORIZED')
  }
  
  if (!req.file) {
    throw new ValidationError('No file uploaded')
  }

  // In a real implementation, you would upload to a cloud service
  // For now, we'll use the file path
  const avatarUrl = `/uploads/avatars/${req.file.filename}`

  const updatedUser = await UserModel.updateAvatar(userId, avatarUrl)

  res.json({
    success: true,
    data: { avatar: avatarUrl },
    message: 'Avatar updated successfully'
  })
})

export const deactivateUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  
  const user = await UserModel.findById(id)
  if (!user) {
    throw new NotFoundError('User', id)
  }
  
  await UserModel.deactivate(id)
  
  res.json({
    success: true,
    message: 'User deactivated successfully'
  })
})

export const activateUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  
  const user = await UserModel.findById(id)
  if (!user) {
    throw new NotFoundError('User', id)
  }
  
  await UserModel.activate(id)
  
  res.json({
    success: true,
    message: 'User activated successfully'
  })
})

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  
  const user = await UserModel.findById(id)
  if (!user) {
    throw new NotFoundError('User', id)
  }
  
  await UserModel.delete(id)
  
  res.json({
    success: true,
    message: 'User deleted successfully'
  })
})

export const getUserStats = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query
  
  const stats = await UserModel.getUserStats({
    startDate: startDate ? new Date(startDate as string) : undefined,
    endDate: endDate ? new Date(endDate as string) : undefined
  })
  
  res.json({
    success: true,
    data: stats
  })
})

// Admin user management endpoints
export const createAdminUser = asyncHandler(async (req: Request, res: Response) => {
  const adminUserId = (req as any).user?.id
  const userData = req.body
  
  if (!adminUserId) {
    throw new AppError('Admin authentication required', 401, 'UNAUTHORIZED')
  }
  
  // Check if user is admin
  const adminUser = await UserModel.findById(adminUserId)
  if (!adminUser || !adminUser.roles.includes('ADMIN')) {
    throw new AppError('Admin access required', 403, 'FORBIDDEN')
  }
  
  // Check if email already exists
  const existingUser = await UserModel.findByEmail(userData.email)
  if (existingUser) {
    throw new ValidationError('Email already exists')
  }
  
  const newAdmin = await UserModel.createAdmin({
    email: userData.email,
    username: userData.username,
    phone: userData.phone,
    profile: userData.profile,
    security: userData.security,
    roles: ['ADMIN']
  } as any)
  
  res.status(201).json({
    success: true,
    data: newAdmin,
    message: 'Admin user created successfully'
  })
})

export const blockUser = asyncHandler(async (req: Request, res: Response) => {
  const adminUserId = (req as any).user?.id
  const { id } = req.params
  const { reason } = req.body
  
  if (!adminUserId) {
    throw new AppError('Admin authentication required', 401, 'UNAUTHORIZED')
  }
  
  // Check if user is admin
  const adminUser = await UserModel.findById(adminUserId)
  if (!adminUser || !adminUser.roles.includes('ADMIN')) {
    throw new AppError('Admin access required', 403, 'FORBIDDEN')
  }
  
  // Cannot block yourself
  if (id === adminUserId) {
    throw new ValidationError('Cannot block yourself')
  }
  
  const blockedUser = await (UserModel as any).blockUser(id, reason)
  
  res.json({
    success: true,
    data: blockedUser,
    message: 'User blocked successfully'
  })
})

export const unblockUser = asyncHandler(async (req: Request, res: Response) => {
  const adminUserId = (req as any).user?.id
  const { id } = req.params
  
  if (!adminUserId) {
    throw new AppError('Admin authentication required', 401, 'UNAUTHORIZED')
  }
  
  // Check if user is admin
  const adminUser = await UserModel.findById(adminUserId)
  if (!adminUser || !adminUser.roles.includes('ADMIN')) {
    throw new AppError('Admin access required', 403, 'FORBIDDEN')
  }
  
  const unblockedUser = await UserModel.unblockUser(id)
  
  res.json({
    success: true,
    data: unblockedUser,
    message: 'User unblocked successfully'
  })
})

export const changeUserPassword = asyncHandler(async (req: Request, res: Response) => {
  const adminUserId = (req as any).user?.id
  const { id } = req.params
  const { newPassword } = req.body
  
  if (!adminUserId) {
    throw new AppError('Admin authentication required', 401, 'UNAUTHORIZED')
  }
  
  // Check if user is admin
  const adminUser = await UserModel.findById(adminUserId)
  if (!adminUser || !adminUser.roles.includes('ADMIN')) {
    throw new AppError('Admin access required', 403, 'FORBIDDEN')
  }
  
  if (!newPassword || newPassword.length < 6) {
    throw new ValidationError('Password must be at least 6 characters long')
  }
  
  const updatedUser = await UserModel.changeUserPassword(id, newPassword)
  
  res.json({
    success: true,
    data: updatedUser,
    message: 'User password changed successfully'
  })
})

export const deleteUserAccount = asyncHandler(async (req: Request, res: Response) => {
  const adminUserId = (req as any).user?.id
  const { id } = req.params
  
  if (!adminUserId) {
    throw new AppError('Admin authentication required', 401, 'UNAUTHORIZED')
  }
  
  // Check if user is admin
  const adminUser = await UserModel.findById(adminUserId)
  if (!adminUser || !adminUser.roles.includes('ADMIN')) {
    throw new AppError('Admin access required', 403, 'FORBIDDEN')
  }
  
  // Cannot delete yourself
  if (id === adminUserId) {
    throw new ValidationError('Cannot delete yourself')
  }
  
  await UserModel.delete(id)
  
  res.json({
    success: true,
    message: 'User account deleted successfully'
  })
})
