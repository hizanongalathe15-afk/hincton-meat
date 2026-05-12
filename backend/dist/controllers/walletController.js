"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPaymentMethods = exports.withdraw = exports.topup = exports.getTransactions = exports.getBalance = void 0;
const middleware_1 = require("../middleware");
const database_1 = require("../database");
exports.getBalance = (0, middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new middleware_1.AppError('User authentication required', 401, 'UNAUTHORIZED');
    }
    // Get user with wallet balance
    const user = await database_1.prisma.user.findUnique({
        where: { id: userId },
        select: {
            walletBalance: true,
            voucherBalance: true,
            loyaltyPoints: true
        }
    });
    if (!user) {
        throw new middleware_1.NotFoundError('User', userId);
    }
    // Calculate total spent and saved (mock data for now)
    const totalSpent = 0;
    const totalSaved = 0;
    const balance = {
        walletBalance: user.walletBalance ? Number(user.walletBalance) : 0,
        voucherBalance: user.voucherBalance ? Number(user.voucherBalance) : 0,
        loyaltyPoints: user.loyaltyPoints || 0,
        totalSpent,
        totalSaved,
        lastUpdated: new Date().toISOString()
    };
    res.json({
        success: true,
        balance
    });
});
exports.getTransactions = (0, middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new middleware_1.AppError('User authentication required', 401, 'UNAUTHORIZED');
    }
    const transactions = await database_1.prisma.walletTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
    });
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
    }));
    res.json({
        success: true,
        transactions: formattedTransactions
    });
});
exports.topup = (0, middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    const { amount, paymentMethodId, description } = req.body;
    if (!userId) {
        throw new middleware_1.AppError('User authentication required', 401, 'UNAUTHORIZED');
    }
    if (!amount || amount <= 0) {
        throw new middleware_1.ValidationError('Invalid amount');
    }
    if (!paymentMethodId) {
        throw new middleware_1.ValidationError('Payment method is required');
    }
    // Get current user balance
    const user = await database_1.prisma.user.findUnique({
        where: { id: userId },
        select: { walletBalance: true }
    });
    if (!user) {
        throw new middleware_1.NotFoundError('User', userId);
    }
    // Update wallet balance
    const currentBalance = user.walletBalance ? Number(user.walletBalance) : 0;
    const newBalance = currentBalance + amount;
    await database_1.prisma.user.update({
        where: { id: userId },
        data: { walletBalance: newBalance }
    });
    // Create transaction record
    const transaction = await database_1.prisma.walletTransaction.create({
        data: {
            userId,
            amount: amount,
            type: 'CREDIT',
            reason: description || 'Wallet top-up',
            balanceAfter: newBalance
        }
    });
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
    };
    res.json({
        success: true,
        transaction: formattedTransaction,
        message: 'Top-up successful'
    });
});
exports.withdraw = (0, middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    const { amount, paymentMethodId, description } = req.body;
    if (!userId) {
        throw new middleware_1.AppError('User authentication required', 401, 'UNAUTHORIZED');
    }
    if (!amount || amount <= 0) {
        throw new middleware_1.ValidationError('Invalid amount');
    }
    if (!paymentMethodId) {
        throw new middleware_1.ValidationError('Payment method is required');
    }
    // Get current user balance
    const user = await database_1.prisma.user.findUnique({
        where: { id: userId },
        select: { walletBalance: true }
    });
    if (!user) {
        throw new middleware_1.NotFoundError('User', userId);
    }
    const currentBalance = user.walletBalance ? Number(user.walletBalance) : 0;
    if (currentBalance < amount) {
        throw new middleware_1.ValidationError('Insufficient balance');
    }
    // Update wallet balance
    const newBalance = currentBalance - amount;
    await database_1.prisma.user.update({
        where: { id: userId },
        data: { walletBalance: newBalance }
    });
    // Create transaction record
    const transaction = await database_1.prisma.walletTransaction.create({
        data: {
            userId,
            amount: amount,
            type: 'DEBIT',
            reason: description || 'Wallet withdrawal',
            balanceAfter: newBalance
        }
    });
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
    };
    res.json({
        success: true,
        transaction: formattedTransaction,
        message: 'Withdrawal successful'
    });
});
exports.getPaymentMethods = (0, middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new middleware_1.AppError('User authentication required', 401, 'UNAUTHORIZED');
    }
    const paymentMethods = await database_1.prisma.paymentMethod.findMany({
        where: { userId },
        orderBy: { isDefault: 'desc' }
    });
    const formattedPaymentMethods = paymentMethods.map(method => ({
        id: method.id,
        type: method.type,
        last4: method.last4 || '',
        isDefault: method.isDefault,
        provider: method.type === 'mpesa' ? 'M-PESA' : method.type.toUpperCase()
    }));
    res.json({
        success: true,
        paymentMethods: formattedPaymentMethods
    });
});
//# sourceMappingURL=walletController.js.map