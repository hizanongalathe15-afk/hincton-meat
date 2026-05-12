// @ts-nocheck
import axios from 'axios'
import crypto from 'crypto'
import { prisma } from '../database'

export interface MpesaPaymentData {
  phoneNumber: string
  amount: number
  orderId: string
  accountReference?: string
  transactionDesc?: string
}

export interface MpesaResult {
  success: boolean
  transactionId?: string
  message: string
  data?: any
}

export interface MpesaTransactionStatus {
  success: boolean
  status: string
  transactionId?: string
  amount?: number
  message: string
  data?: any
}

class MpesaService {
  private baseUrl: string
  private consumerKey: string
  private consumerSecret: string
  private passKey: string
  private shortCode: string
  private callbackUrl: string
  private accessToken: string | null = null
  private tokenExpiry: number = 0

  constructor() {
    this.baseUrl = process.env.MPESA_ENV === 'production' 
      ? 'https://api.safaricom.co.ke' 
      : 'https://sandbox.safaricom.co.ke'
    
    this.consumerKey = process.env.MPESA_CONSUMER_KEY!
    this.consumerSecret = process.env.MPESA_CONSUMER_SECRET!
    this.passKey = process.env.MPESA_PASSKEY!
    this.shortCode = process.env.MPESA_SHORT_CODE!
    this.callbackUrl = process.env.MPESA_CALLBACK_URL || `${process.env.BACKEND_URL}/api/v1/mpesa/callback`
  }

  private async getAccessToken(): Promise<string> {
    // Check if token is still valid
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken
    }

    try {
      const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64')
      
      const response = await axios.get(
        `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          }
        }
      )

      this.accessToken = response.data.access_token
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000 // Refresh 1 minute before expiry

      return this.accessToken
    } catch (error) {
      console.error('M-Pesa token generation error:', error)
      throw new Error('Failed to generate M-Pesa access token')
    }
  }

  private generatePassword(): string {
    const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)
    const passwordString = `${this.shortCode}${this.passKey}${timestamp}`
    return crypto.createHash('sha256').update(passwordString).digest('base64')
  }

  private formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '')
    
    // Add country code if missing
    if (cleaned.startsWith('0')) {
      return `254${cleaned.slice(1)}`
    } else if (cleaned.startsWith('7')) {
      return `254${cleaned}`
    } else if (cleaned.startsWith('254')) {
      return cleaned
    }
    
    return cleaned
  }

  async initiatePayment(paymentData: MpesaPaymentData): Promise<MpesaResult> {
    try {
      const accessToken = await this.getAccessToken()
      const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)
      const password = this.generatePassword()

      const formattedPhone = this.formatPhoneNumber(paymentData.phoneNumber)
      
      const requestBody = {
        BusinessShortCode: this.shortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.round(paymentData.amount),
        PartyA: formattedPhone,
        PartyB: this.shortCode,
        PhoneNumber: formattedPhone,
        CallBackURL: this.callbackUrl,
        AccountReference: paymentData.accountReference || `HINCTON-${paymentData.orderId}`,
        TransactionDesc: paymentData.transactionDesc || `Payment for order ${paymentData.orderId}`
      }

      const response = await axios.post(
        `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (response.data.ResponseCode === '0') {
        // Store transaction details
        await prisma.mpesaTransaction.create({
          data: {
            merchantRequestID: response.data.MerchantRequestID,
            checkoutRequestID: response.data.CheckoutRequestID,
            phoneNumber: formattedPhone,
            amount: paymentData.amount,
            orderId: paymentData.orderId,
            accountReference: paymentData.accountReference || `HINCTON-${paymentData.orderId}`,
            status: 'PENDING',
            responseCode: response.data.ResponseCode,
            responseMessage: response.data.ResponseMessage,
            customerMessage: response.data.CustomerMessage
          }
        })

        return {
          success: true,
          transactionId: response.data.CheckoutRequestID,
          message: 'M-Pesa payment initiated successfully',
          data: {
            merchantRequestID: response.data.MerchantRequestID,
            checkoutRequestID: response.data.CheckoutRequestID,
            customerMessage: response.data.CustomerMessage
          }
        }
      } else {
        return {
          success: false,
          message: response.data.errorMessage || 'M-Pesa payment initiation failed',
          data: response.data
        }
      }

    } catch (error) {
      console.error('M-Pesa payment initiation error:', error)
      return {
        success: false,
        message: 'M-Pesa payment initiation failed',
        data: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async checkTransactionStatus(checkoutRequestID: string): Promise<MpesaTransactionStatus> {
    try {
      const accessToken = await this.getAccessToken()
      const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)
      const password = this.generatePassword()

      const requestBody = {
        BusinessShortCode: this.shortCode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestID
      }

      const response = await axios.post(
        `${this.baseUrl}/mpesa/stkpushquery/v1/query`,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )

      // Update transaction status in database
      const transaction = await prisma.mpesaTransaction.findFirst({
        where: { checkoutRequestID }
      })

      if (transaction) {
        await prisma.mpesaTransaction.update({
          where: { id: transaction.id },
          data: {
            status: response.data.ResultCode === '0' ? 'COMPLETED' : 'FAILED',
            resultCode: response.data.ResultCode,
            resultDesc: response.data.ResultDesc,
            callbackMetadata: response.data.CallbackMetadata
          }
        })
      }

      if (response.data.ResultCode === '0') {
        return {
          success: true,
          status: 'completed',
          transactionId: checkoutRequestID,
          amount: transaction?.amount,
          message: 'Payment completed successfully',
          data: {
            resultCode: response.data.ResultCode,
            resultDesc: response.data.ResultDesc,
            callbackMetadata: response.data.CallbackMetadata
          }
        }
      } else {
        return {
          success: false,
          status: 'failed',
          transactionId: checkoutRequestID,
          message: response.data.ResultDesc || 'Payment failed',
          data: {
            resultCode: response.data.ResultCode,
            resultDesc: response.data.ResultDesc
          }
        }
      }

    } catch (error) {
      console.error('M-Pesa transaction status check error:', error)
      return {
        success: false,
        status: 'failed',
        message: 'Failed to check transaction status',
        data: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async processCallback(callbackData: any): Promise<void> {
    try {
      const { Body } = callbackData
      
      if (Body.stkCallback) {
        const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = Body.stkCallback

        // Find and update transaction
        const transaction = await prisma.mpesaTransaction.findFirst({
          where: {
            merchantRequestID: MerchantRequestID,
            checkoutRequestID: CheckoutRequestID
          }
        })

        if (transaction) {
          const status = ResultCode === '0' ? 'COMPLETED' : 'FAILED'
          
          await prisma.mpesaTransaction.update({
            where: { id: transaction.id },
            data: {
              status,
              resultCode: ResultCode,
              resultDesc: ResultDesc,
              callbackMetadata: CallbackMetadata
            }
          })

          // If payment successful, update order status
          if (ResultCode === '0') {
            await prisma.order.update({
              where: { id: transaction.orderId },
              data: {
                paymentStatus: 'PAID',
                status: 'CONFIRMED'
              }
            })

            // Create payment record
            await prisma.payment.create({
              data: {
                orderId: transaction.orderId,
                userId: transaction.userId || '', // You may need to fetch this
                amount: transaction.amount,
                currency: 'KES',
                paymentMethod: 'mpesa',
                paymentReference: CheckoutRequestID,
                status: 'COMPLETED',
                metadata: {
                  mpesaTransactionId: CheckoutRequestID,
                  merchantRequestID: MerchantRequestID
                }
              }
            })
          }
        }
      }

    } catch (error) {
      console.error('M-Pesa callback processing error:', error)
    }
  }

  async getTransactionHistory(
    page: number = 1,
    limit: number = 20,
    filters?: {
      status?: string
      dateFrom?: Date
      dateTo?: Date
      phoneNumber?: string
    }
  ): Promise<{
    transactions: any[]
    total: number
    page: number
    pages: number
  }> {
    const skip = (page - 1) * limit

    const where: any = {}

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {}
      if (filters.dateFrom) {
        where.createdAt.gte = filters.dateFrom
      }
      if (filters.dateTo) {
        where.createdAt.lte = filters.dateTo
      }
    }

    if (filters?.phoneNumber) {
      where.phoneNumber = this.formatPhoneNumber(filters.phoneNumber)
    }

    const [transactions, total] = await Promise.all([
      prisma.mpesaTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.mpesaTransaction.count({ where })
    ])

    return {
      transactions,
      total,
      page,
      pages: Math.ceil(total / limit)
    }
  }

  async getTransactionStats(dateRange?: { from: Date; to: Date }): Promise<{
    totalTransactions: number
    successfulTransactions: number
    failedTransactions: number
    totalAmount: number
    successRate: number
  }> {
    const where = dateRange ? {
      createdAt: {
        gte: dateRange.from,
        lte: dateRange.to
      }
    } : {}

    const [
      totalTransactions,
      successfulTransactions,
      failedTransactions,
      amountData
    ] = await Promise.all([
      prisma.mpesaTransaction.count({ where }),
      prisma.mpesaTransaction.count({ 
        where: { ...where, status: 'COMPLETED' }
      }),
      prisma.mpesaTransaction.count({ 
        where: { ...where, status: 'FAILED' }
      }),
      prisma.mpesaTransaction.aggregate({
        where: { ...where, status: 'COMPLETED' },
        _sum: { amount: true }
      })
    ])

    const totalAmount = amountData._sum.amount || 0
    const successRate = totalTransactions > 0 ? (successfulTransactions / totalTransactions) * 100 : 0

    return {
      totalTransactions,
      successfulTransactions,
      failedTransactions,
      totalAmount: Number(totalAmount),
      successRate: Math.round(successRate * 100) / 100
    }
  }

  async reverseTransaction(transactionId: string, reason: string): Promise<MpesaResult> {
    try {
      const accessToken = await this.getAccessToken()
      const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)
      const password = this.generatePassword()

      const requestBody = {
        Initiator: process.env.MPESA_INITIATOR_NAME!,
        SecurityCredential: process.env.MPESA_SECURITY_CREDENTIAL!,
        CommandID: 'TransactionReversal',
        TransactionID: transactionId,
        Amount: 0, // Will be populated from transaction
        ReceiverParty: this.shortCode,
        RecieverIdentifierType: '4',
        ResultURL: `${this.callbackUrl}/reversal`,
        QueueTimeOutURL: `${this.callbackUrl}/reversal`,
        Remarks: reason,
        Occasion: 'Reversal'
      }

      // Get original transaction amount
      const transaction = await prisma.mpesaTransaction.findFirst({
        where: { checkoutRequestID: transactionId }
      })

      if (!transaction) {
        return {
          success: false,
          message: 'Transaction not found'
        }
      }

      requestBody.Amount = transaction.amount

      const response = await axios.post(
        `${this.baseUrl}/mpesa/reversal/v1/request`,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (response.data.ResponseCode === '0') {
        // Update transaction status
        await prisma.mpesaTransaction.update({
          where: { id: transaction.id },
          data: {
            status: 'REVERSED',
            reversalReason: reason,
            reversalId: response.data.TransactionID
          }
        })

        return {
          success: true,
          transactionId: response.data.TransactionID,
          message: 'Transaction reversed successfully',
          data: response.data
        }
      } else {
        return {
          success: false,
          message: response.data.errorMessage || 'Transaction reversal failed',
          data: response.data
        }
      }

    } catch (error) {
      console.error('M-Pesa transaction reversal error:', error)
      return {
        success: false,
        message: 'Transaction reversal failed',
        data: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  validatePhoneNumber(phoneNumber: string): boolean {
    const formatted = this.formatPhoneNumber(phoneNumber)
    return /^2547[0-9]{8}$/.test(formatted)
  }

  getPaymentLimits(): {
    minAmount: number
    maxAmount: number
    dailyLimit: number
  } {
    return {
      minAmount: 10, // Minimum KES 10
      maxAmount: 150000, // Maximum KES 150,000 per transaction
      dailyLimit: 300000 // Maximum KES 300,000 per day
    }
  }
}

export const mpesaService = new MpesaService()
export default mpesaService
