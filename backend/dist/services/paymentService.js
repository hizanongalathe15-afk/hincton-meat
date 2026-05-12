"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentService = void 0;
// @ts-nocheck
const database_1 = require("../database");
const emailService_1 = require("./emailService");
class PaymentService {
    async createPayment(paymentData) {
        try {
            // Create payment record
            const payment = await database_1.prisma.payment.create({
                data: {
                    orderId: paymentData.orderId,
                    userId: paymentData.userId,
                    amount: paymentData.amount,
                    currency: paymentData.currency,
                    paymentMethod: paymentData.paymentMethod,
                    status: 'PENDING',
                    paymentDetails: paymentData.paymentDetails
                }
            });
            // Process payment based on method
            let result;
            switch (paymentData.paymentMethod) {
                case 'mpesa':
                    result = await this.processMpesaPayment(paymentData, payment.id);
                    break;
                case 'card':
                    result = await this.processCardPayment(paymentData, payment.id);
                    break;
                case 'cash':
                    result = await this.processCashPayment(paymentData, payment.id);
                    break;
                default:
                    result = {
                        success: false,
                        status: 'FAILED',
                        message: 'Unsupported payment method'
                    };
            }
            // Update payment status
            await database_1.prisma.payment.update({
                where: { id: payment.id },
                data: {
                    status: result.status,
                    transactionId: result.transactionId,
                    gatewayResponse: result.data
                }
            });
            // If payment successful, update order status
            if (result.success && result.status === 'completed') {
                await database_1.prisma.order.update({
                    where: { id: paymentData.orderId },
                    data: {
                        paymentStatus: 'paid',
                        status: 'confirmed'
                    }
                });
                // Send confirmation email
                await this.sendPaymentConfirmationEmail(paymentData.orderId);
            }
            return result;
        }
        catch (error) {
            console.error('Payment creation error:', error);
            return {
                success: false,
                status: 'FAILED',
                message: 'Payment processing failed'
            };
        }
    }
    async processMpesaPayment(paymentData, paymentId) {
        try {
            // Import M-Pesa service dynamically to avoid circular dependencies
            const { mpesaService } = await Promise.resolve().then(() => __importStar(require('./mpesaService')));
            const mpesaResult = await mpesaService.initiatePayment({
                phoneNumber: paymentData.paymentDetails.phoneNumber,
                amount: paymentData.amount,
                orderId: paymentData.orderId,
                accountReference: `HINCTON-${paymentData.orderId}`
            });
            if (mpesaResult.success) {
                return {
                    success: true,
                    transactionId: mpesaResult.transactionId,
                    status: 'PENDING',
                    message: 'M-Pesa payment initiated successfully',
                    data: mpesaResult.data
                };
            }
            else {
                return {
                    success: false,
                    status: 'FAILED',
                    message: mpesaResult.message || 'M-Pesa payment failed'
                };
            }
        }
        catch (error) {
            console.error('M-Pesa processing error:', error);
            return {
                success: false,
                status: 'FAILED',
                message: 'M-Pesa payment processing failed'
            };
        }
    }
    async processCardPayment(paymentData, paymentId) {
        try {
            // Simulate card payment processing
            // In production, integrate with actual payment gateway (Stripe, PayPal, etc.)
            const cardNumber = paymentData.paymentDetails.cardNumber;
            if (!cardNumber || cardNumber.length < 16) {
                return {
                    success: false,
                    status: 'FAILED',
                    message: 'Invalid card details'
                };
            }
            // Simulate processing delay
            await new Promise(resolve => setTimeout(resolve, 2000));
            // Generate mock transaction ID
            const transactionId = `CARD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            return {
                success: true,
                transactionId,
                status: 'COMPLETED',
                message: 'Card payment processed successfully',
                data: {
                    authCode: Math.random().toString(36).substr(2, 6).toUpperCase(),
                    last4: cardNumber.slice(-4)
                }
            };
        }
        catch (error) {
            console.error('Card payment processing error:', error);
            return {
                success: false,
                status: 'FAILED',
                message: 'Card payment processing failed'
            };
        }
    }
    async processCashPayment(paymentData, paymentId) {
        try {
            // Cash on delivery - mark as pending until delivery
            const transactionId = `COD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            return {
                success: true,
                transactionId,
                status: 'PENDING',
                message: 'Cash on delivery order placed successfully',
                data: {
                    paymentType: 'cash_on_delivery',
                    collectionRequired: true
                }
            };
        }
        catch (error) {
            console.error('Cash payment processing error:', error);
            return {
                success: false,
                status: 'FAILED',
                message: 'Cash payment processing failed'
            };
        }
    }
    async verifyPayment(transactionId) {
        try {
            const payment = await database_1.prisma.payment.findUnique({
                where: { transactionId },
                include: {
                    order: true
                }
            });
            if (!payment) {
                return {
                    success: false,
                    status: 'FAILED',
                    message: 'Payment not found'
                };
            }
            // For M-Pesa, check transaction status
            if (payment.paymentMethod === 'mpesa' && payment.status !== 'COMPLETED') {
                const { mpesaService } = await Promise.resolve().then(() => __importStar(require('./mpesaService')));
                const status = await mpesaService.checkTransactionStatus(transactionId);
                if (status.success) {
                    // Update payment status
                    await database_1.prisma.payment.update({
                        where: { id: payment.id },
                        data: {
                            status: 'COMPLETED',
                            gatewayResponse: status.data
                        }
                    });
                    // Update order status
                    if (payment.order) {
                        await database_1.prisma.order.update({
                            where: { id: payment.orderId },
                            data: {
                                paymentStatus: 'paid',
                                status: 'confirmed'
                            }
                        });
                        // Send confirmation email
                        await this.sendPaymentConfirmationEmail(payment.orderId);
                    }
                    return {
                        success: true,
                        transactionId,
                        status: 'COMPLETED',
                        message: 'Payment verified successfully',
                        data: status.data
                    };
                }
            }
            return {
                success: payment.status === 'completed',
                transactionId,
                status: payment.status,
                message: `Payment status: ${payment.status}`
            };
        }
        catch (error) {
            console.error('Payment verification error:', error);
            return {
                success: false,
                status: 'FAILED',
                message: 'Payment verification failed'
            };
        }
    }
    async processRefund(refundData) {
        try {
            const payment = await database_1.prisma.payment.findUnique({
                where: { id: refundData.paymentId },
                include: {
                    order: true
                }
            });
            if (!payment) {
                return {
                    success: false,
                    status: 'FAILED',
                    message: 'Payment not found'
                };
            }
            const refundAmount = refundData.amount || payment.amount;
            if (refundAmount > payment.amount) {
                return {
                    success: false,
                    status: 'FAILED',
                    message: 'Refund amount cannot exceed payment amount'
                };
            }
            // Create refund record
            const refund = await database_1.prisma.refund.create({
                data: {
                    paymentId: refundData.paymentId,
                    amount: refundAmount,
                    reason: refundData.reason,
                    processedBy: refundData.processedBy,
                    status: 'processing'
                }
            });
            // Process refund based on payment method
            let refundResult;
            switch (payment.paymentMethod) {
                case 'mpesa':
                    refundResult = await this.processMpesaRefund(payment, refundAmount);
                    break;
                case 'card':
                    refundResult = await this.processCardRefund(payment, refundAmount);
                    break;
                default:
                    refundResult = {
                        success: false,
                        status: 'FAILED',
                        message: 'Refund not supported for this payment method'
                    };
            }
            // Update refund status
            await database_1.prisma.refund.update({
                where: { id: refund.id },
                data: {
                    status: refundResult.status,
                    transactionId: refundResult.transactionId,
                    gatewayResponse: refundResult.data
                }
            });
            // If refund successful, update payment status
            if (refundResult.success) {
                await database_1.prisma.payment.update({
                    where: { id: payment.id },
                    data: {
                        status: 'REFUNDED'
                    }
                });
            }
            return refundResult;
        }
        catch (error) {
            console.error('Refund processing error:', error);
            return {
                success: false,
                status: 'FAILED',
                message: 'Refund processing failed'
            };
        }
    }
    async processMpesaRefund(payment, amount) {
        try {
            // Simulate M-Pesa refund processing
            // In production, integrate with actual M-Pesa refund API
            await new Promise(resolve => setTimeout(resolve, 3000));
            const transactionId = `REFUND_MPESA_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            return {
                success: true,
                transactionId,
                status: 'COMPLETED',
                message: 'M-Pesa refund processed successfully',
                data: {
                    refundType: 'mpesa',
                    processingTime: '2-3 business days'
                }
            };
        }
        catch (error) {
            console.error('M-Pesa refund error:', error);
            return {
                success: false,
                status: 'FAILED',
                message: 'M-Pesa refund failed'
            };
        }
    }
    async processCardRefund(payment, amount) {
        try {
            // Simulate card refund processing
            // In production, integrate with actual payment gateway refund API
            await new Promise(resolve => setTimeout(resolve, 2000));
            const transactionId = `REFUND_CARD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            return {
                success: true,
                transactionId,
                status: 'COMPLETED',
                message: 'Card refund processed successfully',
                data: {
                    refundType: 'card',
                    processingTime: '5-7 business days'
                }
            };
        }
        catch (error) {
            console.error('Card refund error:', error);
            return {
                success: false,
                status: 'FAILED',
                message: 'Card refund failed'
            };
        }
    }
    async sendPaymentConfirmationEmail(orderId) {
        try {
            const order = await database_1.prisma.order.findUnique({
                where: { id: orderId },
                include: {
                    user: true
                }
            });
            if (order && order.user) {
                await emailService_1.emailService.sendOrderConfirmationEmail(order.user.email, {
                    orderNumber: order.orderNumber,
                    totalAmount: order.totalAmount,
                    estimatedDelivery: order.estimatedDeliveryTime || '2-3 business days'
                });
            }
        }
        catch (error) {
            console.error('Payment confirmation email error:', error);
        }
    }
    async getPaymentHistory(userId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [payments, total] = await Promise.all([
            database_1.prisma.payment.findMany({
                where: { userId },
                include: {
                    order: {
                        select: {
                            orderNumber: true,
                            createdAt: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            database_1.prisma.payment.count({ where: { userId } })
        ]);
        return {
            payments,
            total,
            page,
            pages: Math.ceil(total / limit)
        };
    }
    async getPaymentStats(dateRange) {
        const where = dateRange ? {
            createdAt: {
                gte: dateRange.from,
                lte: dateRange.to
            }
        } : {};
        const [totalRevenue, totalTransactions, successfulTransactions, failedTransactions, refunds, refundAmount] = await Promise.all([
            database_1.prisma.payment.aggregate({
                where: { ...where, status: 'COMPLETED' },
                _sum: { amount: true }
            }),
            database_1.prisma.payment.count({ where }),
            database_1.prisma.payment.count({ where: { ...where, status: 'COMPLETED' } }),
            database_1.prisma.payment.count({ where: { ...where, status: 'FAILED' } }),
            database_1.prisma.refund.count({ where }),
            database_1.prisma.refund.aggregate({
                where,
                _sum: { amount: true }
            })
        ]);
        return {
            totalRevenue: totalRevenue._sum.amount || 0,
            totalTransactions,
            successfulTransactions,
            failedTransactions,
            refunds,
            refundAmount: refundAmount._sum.amount || 0
        };
    }
}
exports.paymentService = new PaymentService();
exports.default = exports.paymentService;
//# sourceMappingURL=paymentService.js.map