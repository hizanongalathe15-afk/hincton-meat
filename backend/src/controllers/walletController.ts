import { Request, Response, NextFunction } from 'express'
import { asyncHandler, AppError, NotFoundError, ValidationError } from '../middleware'
import { prisma } from '../database'

export const getBalance = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id
  
  if (!userId) {
    throw new AppError('User authentication required', 401, 'UNAUTHORIZED')
  }

  // Get user with wallet balance
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      walletBalance: true,
      voucherBalance: true,
      loyaltyPoints: true
    }
  })

  if (!user) {
    throw new NotFoundError('User', userId)
  }

  // Calculate total spent and saved (mock data for now)
  const totalSpent = 0
  const totalSaved = 0

  const balance = {
    walletBalance: user.walletBalance ? Number(user.walletBalance) : 0,
    voucherBalance: user.voucherBalance ? Number(user.voucherBalance) : 0,
    loyaltyPoints: user.loyaltyPoints || 0,
    totalSpent,
    totalSaved,
    lastUpdated: new Date().toISOString()
  }

  res.json({
    success: true,
    balance
  })
})

export const getTransactions = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id
  
  if (!userId) {
    throw new AppError('User authentication required', 401, 'UNAUTHORIZED')
  }

  const transactions = await prisma.walletTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  })

  const formattedTransactions = transactions.map(transaction => ({
    id: transaction.id,
    type: transaction.type.toLowerCase(),
    amount: Number(transaction.amount),
    description: transaction.reason || 'Transaction',
    category: transaction.type.toLowerCase(),
    status: 'completed',
    createdAt: transaction.createdAt.toISOString(),
    orderId: null,
    orderNumber: null,
    balanceAfter: Number(transaction.balanceAfter)
  }))

  res.json({
    success: true,
    transactions: formattedTransactions
  })
})

export const topup = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id
  const { amount, paymentMethodId, description } = req.body
  
  if (!userId) {
    throw new AppError('User authentication required', 401, 'UNAUTHORIZED')
  }

  if (!amount || amount <= 0) {
    throw new ValidationError('Invalid amount')
  }

  if (!paymentMethodId) {
    throw new ValidationError('Payment method is required')
  }

  // Get current user balance
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { walletBalance: true }
  })

  if (!user) {
    throw new NotFoundError('User', userId)
  }

  // Update wallet balance
  const currentBalance = user.walletBalance ? Number(user.walletBalance) : 0
  const newBalance = currentBalance + amount

  await prisma.user.update({
    where: { id: userId },
    data: { walletBalance: newBalance }
  })

  // Create transaction record
  const transaction = await prisma.walletTransaction.create({
    data: {
      userId,
      amount: amount,
      type: 'CREDIT',
      reason: description || 'Wallet top-up',
      balanceAfter: newBalance
    }
  })

  const formattedTransaction = {
    id: transaction.id,
    type: 'credit',
    amount: Number(transaction.amount),
    description: transaction.reason || 'Wallet top-up',
    category: 'topup',
    status: 'completed',
    createdAt: transaction.createdAt.toISOString(),
    orderId: null,
    orderNumber: null,
    balanceAfter: Number(transaction.balanceAfter)
  }

  res.json({
    success: true,
    transaction: formattedTransaction,
    message: 'Top-up successful'
  })
})

export const withdraw = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id
  const { amount, paymentMethodId, description } = req.body
  
  if (!userId) {
    throw new AppError('User authentication required', 401, 'UNAUTHORIZED')
  }

  if (!amount || amount <= 0) {
    throw new ValidationError('Invalid amount')
  }

  if (!paymentMethodId) {
    throw new ValidationError('Payment method is required')
  }

  // Get current user balance
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { walletBalance: true }
  })

  if (!user) {
    throw new NotFoundError('User', userId)
  }

  const currentBalance = user.walletBalance ? Number(user.walletBalance) : 0

  if (currentBalance < amount) {
    throw new ValidationError('Insufficient balance')
  }

  // Update wallet balance
  const newBalance = currentBalance - amount

  await prisma.user.update({
    where: { id: userId },
    data: { walletBalance: newBalance }
  })

  // Create transaction record
  const transaction = await prisma.walletTransaction.create({
    data: {
      userId,
      amount: amount,
      type: 'DEBIT',
      reason: description || 'Wallet withdrawal',
      balanceAfter: newBalance
    }
  })

  const formattedTransaction = {
    id: transaction.id,
    type: 'debit',
    amount: Number(transaction.amount),
    description: transaction.reason || 'Wallet withdrawal',
    category: 'withdrawal',
    status: 'completed',
    createdAt: transaction.createdAt.toISOString(),
    orderId: null,
    orderNumber: null,
    balanceAfter: Number(transaction.balanceAfter)
  }

  res.json({
    success: true,
    transaction: formattedTransaction,
    message: 'Withdrawal successful'
  })
})

export const getPaymentMethods = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id
  
  if (!userId) {
    throw new AppError('User authentication required', 401, 'UNAUTHORIZED')
  }

  const paymentMethods = await prisma.paymentMethod.findMany({
    where: { userId },
    orderBy: { isDefault: 'desc' }
  })

  const formattedPaymentMethods = paymentMethods.map(method => ({
    id: method.id,
    type: method.type,
    last4: method.last4 || '',
    isDefault: method.isDefault,
    provider: method.type === 'mpesa' ? 'M-PESA' : method.type.toUpperCase()
  }))

  res.json({
    success: true,
    paymentMethods: formattedPaymentMethods
  })
})
