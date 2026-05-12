import express from 'express'
import { prisma } from '../config/prisma'
import { z } from 'zod'
import axios from 'axios'
import type { AuthRequest } from '../middleware/auth'
import { meatShopMessages, resolveMessage } from '../messages/meatShopMessages'

const router = express.Router()

const apiMessage = (message: Parameters<typeof resolveMessage>[0], values?: Parameters<typeof resolveMessage>[1]) => {
  const resolved = resolveMessage(message, values)
  return { ...resolved, error: resolved.message }
}

// Prisma model is Payment (not mpesaTransaction)
// We'll store mpesa details in Payment.

const initiatePaymentSchema = z.object({
  phoneNumber: z.string().min(8),
  amount: z.number().positive(),
  orderId: z.string().min(1),
  accountReference: z.string().optional(),
})

const MPESA_CONFIG = {
  consumerKey: process.env.MPESA_CONSUMER_KEY || 'your_consumer_key',
  consumerSecret: process.env.MPESA_CONSUMER_SECRET || 'your_consumer_secret',
  shortcode: process.env.MPESA_SHORTCODE || '174379',
  passkey: process.env.MPESA_PASSKEY || 'your_passkey',
  callbackUrl: process.env.MPESA_CALLBACK_URL || 'https://your-domain.com/api/mpesa/callback',
  environment: process.env.MPESA_ENV || 'sandbox',
}

async function getMpesaToken() {
  const auth = Buffer.from(`${MPESA_CONFIG.consumerKey}:${MPESA_CONFIG.consumerSecret}`).toString('base64')
  const url =
    MPESA_CONFIG.environment === 'production'
      ? 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
      : 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'

  const response = await axios.get(url, {
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
  })

  return response.data.access_token
}

const getGuestSessionId = (req: AuthRequest): string | null => {
  const value = req.header('X-Guest-Session-Id')
  return typeof value === 'string' && value.trim().length >= 12 ? value.trim() : null
}

const normalizeMpesaPhone = (phone: string) => {
  const digits = phone.replace(/\D/g, '')
  if (/^0[17]\d{8}$/.test(digits)) return `254${digits.slice(1)}`
  if (/^254[17]\d{8}$/.test(digits)) return digits
  if (/^[17]\d{8}$/.test(digits)) return `254${digits}`
  return null
}

const initiateMpesaPayment = async (req: AuthRequest, res: any) => {
  try {
    const { phoneNumber, amount, orderId, accountReference } = initiatePaymentSchema.parse(req.body)
    const normalizedPhone = normalizeMpesaPhone(phoneNumber)
    if (!normalizedPhone) {
      return res.status(400).json(apiMessage(meatShopMessages.payment.invalidMpesaPhone))
    }

    const userId = req.user?.id
    const guestSessionId = userId ? null : getGuestSessionId(req)

    if (!userId && !guestSessionId) {
      return res.status(400).json(apiMessage(meatShopMessages.system.sessionExpired))
    }

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        deletedAt: null,
        ...(userId ? { userId } : guestSessionId ? { guestSessionId } : {}),
      },
      include: { payments: { orderBy: { createdAt: 'desc' }, take: 1 } },
    })

    if (!order) return res.status(404).json(apiMessage(meatShopMessages.order.failedAttempt))
    if (Math.round(Number(order.totalAmount)) !== Math.round(amount)) {
      return res.status(400).json(apiMessage(meatShopMessages.payment.transactionLimit))
    }

    const existingPayment = order.payments[0]
    const payment = existingPayment
      ? await prisma.payment.update({
          where: { id: existingPayment.id },
          data: {
            amount: amount as any,
            currency: 'KES' as any,
            paymentMethod: 'MPESA',
            paymentReference: accountReference || order.orderNumber,
            status: 'PENDING',
            mpesaPhone: normalizedPhone,
          },
        })
      : await prisma.payment.create({
          data: {
            orderId,
            userId,
            amount: amount as any,
            currency: 'KES' as any,
            paymentMethod: 'MPESA',
            paymentReference: accountReference || order.orderNumber,
            status: 'PENDING',
            mpesaPhone: normalizedPhone,
          },
        })

    // If sandbox keys are not configured, return early (still API-valid)
    if (MPESA_CONFIG.consumerKey === 'your_consumer_key') {
      return res.json({
        ...resolveMessage(meatShopMessages.payment.stkSent, { phone: phoneNumber }),
        checkoutRequestID: payment.id,
        payment: { id: payment.id, status: payment.status, paymentReference: payment.paymentReference },
      })
    }

    const token = await getMpesaToken()
    const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14)
    const password = Buffer.from(`${MPESA_CONFIG.shortcode}${MPESA_CONFIG.passkey}${timestamp}`).toString('base64')

    const stkRequest = {
      BusinessShortCode: MPESA_CONFIG.shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount),
      PartyA: normalizedPhone,
      PartyB: MPESA_CONFIG.shortcode,
      PhoneNumber: normalizedPhone,
      CallBackURL: MPESA_CONFIG.callbackUrl,
      AccountReference: accountReference || `ORDER-${orderId}`,
      TransactionDesc: `Payment for order ${orderId}`,
      Remark: 'Hincton Meat Products',
    }

    const response = await axios.post(
      MPESA_CONFIG.environment === 'production'
        ? 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
        : 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      stkRequest,
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } },
    )

    const checkoutRequestID = response.data?.CheckoutRequestID
    if (checkoutRequestID) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { mpesaReceipt: checkoutRequestID },
      })
    }

    res.json({
      ...resolveMessage(meatShopMessages.payment.stkSent, { phone: phoneNumber }),
      checkoutRequestID,
      merchantRequestID: response.data?.MerchantRequestID,
      payment: { id: payment.id, status: payment.status, mpesaResponse: response.data },
    })
  } catch (error) {
    console.error('M-PESA initiate error:', error)
    res.status(500).json(apiMessage(meatShopMessages.payment.mpesaUnavailable))
  }
}

router.post('/initiate', initiateMpesaPayment)
router.post('/stk-push', initiateMpesaPayment)

router.post('/callback', async (req, res) => {
  try {
    const body = req.body
    const stkCallback = body?.Body?.stkCallback
    const checkoutRequestId = stkCallback?.CheckoutRequestID
    const resultCode = stkCallback?.ResultCode
    const resultDesc = stkCallback?.ResultDesc

    // Try match by paymentReference/accountReference if available, else skip order update
    const payment = checkoutRequestId
      ? await prisma.payment.findFirst({ where: { mpesaReceipt: checkoutRequestId } })
      : await prisma.payment.findFirst({ where: { status: 'PENDING' } })

    if (!payment) return res.status(404).json(apiMessage(meatShopMessages.payment.mpesaTimeout))

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: resultCode === 0 ? 'PAID' : 'FAILED',
        mpesaReceipt: checkoutRequestId,
        mpesaTransactionDate: new Date(),

        completedAt: resultCode === 0 ? new Date() : null,
      },
    })

    if (resultCode === 0) {
      await prisma.order.update({
        where: { id: payment.orderId },
        data: { paymentStatus: 'PAID', status: 'CONFIRMED' },
      })
    }

    res.json({ ResultCode: 0, ResultDesc: resolveMessage(meatShopMessages.payment.paymentSuccessful).message })
  } catch (error) {
    console.error('M-PESA callback error:', error)
    res.status(500).json(apiMessage(meatShopMessages.payment.mpesaUnavailable))
  }
})

router.get('/transaction/:checkoutRequestID', async (req, res) => {
  try {
    const { checkoutRequestID } = req.params
    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          { id: checkoutRequestID },
          { mpesaReceipt: checkoutRequestID },
        ],
      },
    })

    if (!payment) return res.status(404).json(apiMessage(meatShopMessages.payment.mpesaTimeout))

    const status = payment.status === 'PAID' ? 'COMPLETED' : payment.status
    res.json({
      ...resolveMessage(status === 'COMPLETED' ? meatShopMessages.payment.paymentSuccessful : meatShopMessages.payment.waitingConfirmation),
      status,
      transaction: payment,
    })
  } catch (error) {
    console.error('M-PESA transaction status error:', error)
    res.status(500).json(apiMessage(meatShopMessages.payment.mpesaUnavailable))
  }
})

export default router
