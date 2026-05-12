// @ts-nocheck
import { prisma } from '../database'
import { emailService } from './emailService'

export interface PaymentData {
  orderId: string
  userId: string
  amount: number
  currency: string
  paymentMethod: 'mpesa' | 'card' | 'cash'
  paymentDetails: {
    phoneNumber?: string
    cardNumber?: string
    transactionId?: string
    reference?: string
  }
}

export interface PaymentResult {
  success: boolean
  transactionId?: string
  status: PaymentStatus
  message: string
  data?: any
}

export interface RefundData {
  paymentId: string
  amount?: number
  reason: string
  processedBy: string
}

class PaymentService {
  async createPayment(paymentData: PaymentData): Promise<PaymentResult> {
    try {
      // Create payment record
      const payment = await prisma.payment.create({
        data: {
          orderId: paymentData.orderId,
          userId: paymentData.userId,
          amount: paymentData.amount,
          currency: paymentData.currency,
          paymentMethod: paymentData.paymentMethod,
          status: 'PENDING',
          paymentDetails: paymentData.paymentDetails as any
        }
      })

      // Process payment based on method
      let result: PaymentResult

      switch (paymentData.paymentMethod) {
        case 'mpesa':
          result = await this.processMpesaPayment(paymentData, payment.id)
          break
        case 'card':
          result = await this.processCardPayment(paymentData, payment.id)
          break
        case 'cash':
          result = await this.processCashPayment(paymentData, payment.id)
          break
        default:
          result = {
            success: false,
            status: 'FAILED',
            message: 'Unsupported payment method'
          }
      }

      // Update payment status
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: result.status,
          transactionId: result.transactionId,
          gatewayResponse: result.data
        }
      })

      // If payment successful, update order status
      if (result.success && result.status === 'completed') {
        await prisma.order.update({
          where: { id: paymentData.orderId },
          data: {
            paymentStatus: 'paid',
            status: 'confirmed'
          }
        })

        // Send confirmation email
        await this.sendPaymentConfirmationEmail(paymentData.orderId)
      }

      return result

    } catch (error) {
      console.error('Payment creation error:', error)
      return {
        success: false,
        status: 'FAILED',
        message: 'Payment processing failed'
      }
    }
  }

  private async processMpesaPayment(paymentData: PaymentData, paymentId: string): Promise<PaymentResult> {
    try {
      // Import M-Pesa service dynamically to avoid circular dependencies
      const { mpesaService } = await import('./mpesaService')
      
      const mpesaResult = await mpesaService.initiatePayment({
        phoneNumber: paymentData.paymentDetails.phoneNumber!,
        amount: paymentData.amount,
        orderId: paymentData.orderId,
        accountReference: `HINCTON-${paymentData.orderId}`
      })

      if (mpesaResult.success) {
        return {
          success: true,
          transactionId: mpesaResult.transactionId,
          status: 'PENDING',
          message: 'M-Pesa payment initiated successfully',
          data: mpesaResult.data
        }
      } else {
        return {
          success: false,
          status: 'FAILED',
          message: mpesaResult.message || 'M-Pesa payment failed'
        }
      }
    } catch (error) {
      console.error('M-Pesa processing error:', error)
      return {
        success: false,
        status: 'FAILED',
        message: 'M-Pesa payment processing failed'
      }
    }
  }

  private async processCardPayment(paymentData: PaymentData, paymentId: string): Promise<PaymentResult> {
    try {
      // Simulate card payment processing
      // In production, integrate with actual payment gateway (Stripe, PayPal, etc.)
      
      const cardNumber = paymentData.paymentDetails.cardNumber
      if (!cardNumber || cardNumber.length < 16) {
        return {
          success: false,
          status: 'FAILED',
          message: 'Invalid card details'
        }
      }

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Generate mock transaction ID
      const transactionId = `CARD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      return {
        success: true,
        transactionId,
        status: 'COMPLETED',
        message: 'Card payment processed successfully',
        data: {
          authCode: Math.random().toString(36).substr(2, 6).toUpperCase(),
          last4: cardNumber.slice(-4)
        }
      }
    } catch (error) {
      console.error('Card payment processing error:', error)
      return {
        success: false,
        status: 'FAILED',
        message: 'Card payment processing failed'
      }
    }
  }

  private async processCashPayment(paymentData: PaymentData, paymentId: string): Promise<PaymentResult> {
    try {
      // Cash on delivery - mark as pending until delivery
      const transactionId = `COD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      return {
        success: true,
        transactionId,
        status: 'PENDING',
        message: 'Cash on delivery order placed successfully',
        data: {
          paymentType: 'cash_on_delivery',
          collectionRequired: true
        }
      }
    } catch (error) {
      console.error('Cash payment processing error:', error)
      return {
        success: false,
        status: 'FAILED',
        message: 'Cash payment processing failed'
      }
    }
  }

  async verifyPayment(transactionId: string): Promise<PaymentResult> {
    try {
      const payment = await prisma.payment.findUnique({
        where: { transactionId },
        include: {
          order: true
        }
      })

      if (!payment) {
        return {
          success: false,
          status: 'FAILED',
          message: 'Payment not found'
        }
      }

      // For M-Pesa, check transaction status
      if (payment.paymentMethod === 'mpesa' && payment.status !== 'COMPLETED') {
        const { mpesaService } = await import('./mpesaService')
        const status = await mpesaService.checkTransactionStatus(transactionId)

        if (status.success) {
          // Update payment status
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: 'COMPLETED',
              gatewayResponse: status.data
            }
          })

          // Update order status
          if (payment.order) {
            await prisma.order.update({
              where: { id: payment.orderId },
              data: {
                paymentStatus: 'paid',
                status: 'confirmed'
              }
            })

            // Send confirmation email
            await this.sendPaymentConfirmationEmail(payment.orderId)
          }

          return {
            success: true,
            transactionId,
            status: 'COMPLETED',
            message: 'Payment verified successfully',
            data: status.data
          }
        }
      }

      return {
        success: payment.status === 'completed',
        transactionId,
        status: payment.status as any,
        message: `Payment status: ${payment.status}`
      }

    } catch (error) {
      console.error('Payment verification error:', error)
      return {
        success: false,
        status: 'FAILED',
        message: 'Payment verification failed'
      }
    }
  }

  async processRefund(refundData: RefundData): Promise<PaymentResult> {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id: refundData.paymentId },
        include: {
          order: true
        }
      })

      if (!payment) {
        return {
          success: false,
          status: 'FAILED',
          message: 'Payment not found'
        }
      }

      const refundAmount = refundData.amount || payment.amount

      if (refundAmount > payment.amount) {
        return {
          success: false,
          status: 'FAILED',
          message: 'Refund amount cannot exceed payment amount'
        }
      }

      // Create refund record
      const refund = await prisma.refund.create({
        data: {
          paymentId: refundData.paymentId,
          amount: refundAmount,
          reason: refundData.reason,
          processedBy: refundData.processedBy,
          status: 'processing'
        }
      })

      // Process refund based on payment method
      let refundResult: PaymentResult

      switch (payment.paymentMethod) {
        case 'mpesa':
          refundResult = await this.processMpesaRefund(payment, refundAmount)
          break
        case 'card':
          refundResult = await this.processCardRefund(payment, refundAmount)
          break
        default:
          refundResult = {
            success: false,
            status: 'FAILED',
            message: 'Refund not supported for this payment method'
          }
      }

      // Update refund status
      await prisma.refund.update({
        where: { id: refund.id },
        data: {
          status: refundResult.status,
          transactionId: refundResult.transactionId,
          gatewayResponse: refundResult.data
        }
      })

      // If refund successful, update payment status
      if (refundResult.success) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'REFUNDED'
          }
        })
      }

      return refundResult

    } catch (error) {
      console.error('Refund processing error:', error)
      return {
        success: false,
        status: 'FAILED',
        message: 'Refund processing failed'
      }
    }
  }

  private async processMpesaRefund(payment: any, amount: number): Promise<PaymentResult> {
    try {
      // Simulate M-Pesa refund processing
      // In production, integrate with actual M-Pesa refund API
      
      await new Promise(resolve => setTimeout(resolve, 3000))

      const transactionId = `REFUND_MPESA_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      return {
        success: true,
        transactionId,
        status: 'COMPLETED',
        message: 'M-Pesa refund processed successfully',
        data: {
          refundType: 'mpesa',
          processingTime: '2-3 business days'
        }
      }
    } catch (error) {
      console.error('M-Pesa refund error:', error)
      return {
        success: false,
        status: 'FAILED',
        message: 'M-Pesa refund failed'
      }
    }
  }

  private async processCardRefund(payment: any, amount: number): Promise<PaymentResult> {
    try {
      // Simulate card refund processing
      // In production, integrate with actual payment gateway refund API
      
      await new Promise(resolve => setTimeout(resolve, 2000))

      const transactionId = `REFUND_CARD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      return {
        success: true,
        transactionId,
        status: 'COMPLETED',
        message: 'Card refund processed successfully',
        data: {
          refundType: 'card',
          processingTime: '5-7 business days'
        }
      }
    } catch (error) {
      console.error('Card refund error:', error)
      return {
        success: false,
        status: 'FAILED',
        message: 'Card refund failed'
      }
    }
  }

  private async sendPaymentConfirmationEmail(orderId: string): Promise<void> {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: true
        }
      })

      if (order && order.user) {
        await emailService.sendOrderConfirmationEmail(order.user.email, {
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
          estimatedDelivery: order.estimatedDeliveryTime || '2-3 business days'
        })
      }
    } catch (error) {
      console.error('Payment confirmation email error:', error)
    }
  }

  async getPaymentHistory(userId: string, page: number = 1, limit: number = 20): Promise<{
    payments: any[]
    total: number
    page: number
    pages: number
  }> {
    const skip = (page - 1) * limit

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
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
      prisma.payment.count({ where: { userId } })
    ])

    return {
      payments,
      total,
      page,
      pages: Math.ceil(total / limit)
    }
  }

  async getPaymentStats(dateRange?: { from: Date; to: Date }): Promise<{
    totalRevenue: number
    totalTransactions: number
    successfulTransactions: number
    failedTransactions: number
    refunds: number
    refundAmount: number
  }> {
    const where = dateRange ? {
      createdAt: {
        gte: dateRange.from,
        lte: dateRange.to
      }
    } : {}

    const [
      totalRevenue,
      totalTransactions,
      successfulTransactions,
      failedTransactions,
      refunds,
      refundAmount
    ] = await Promise.all([
      prisma.payment.aggregate({
        where: { ...where, status: 'COMPLETED' },
        _sum: { amount: true }
      }),
      prisma.payment.count({ where }),
      prisma.payment.count({ where: { ...where, status: 'COMPLETED' } }),
      prisma.payment.count({ where: { ...where, status: 'FAILED' } }),
      prisma.refund.count({ where }),
      prisma.refund.aggregate({
        where,
        _sum: { amount: true }
      })
    ])

    return {
      totalRevenue: totalRevenue._sum.amount || 0,
      totalTransactions,
      successfulTransactions,
      failedTransactions,
      refunds,
      refundAmount: refundAmount._sum.amount || 0
    }
  }
}

export const paymentService = new PaymentService()
export default paymentService
