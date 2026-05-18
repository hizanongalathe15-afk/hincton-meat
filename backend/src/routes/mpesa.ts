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
  consumerKey: process.env.MPESA_CONSUMER_KEY || process.env.MPESA_CONSUMER_KEY_SANDBOX || '',
  consumerSecret: process.env.MPESA_CONSUMER_SECRET || process.env.MPESA_CONSUMER_SECRET_SANDBOX || '',
  shortcode: process.env.MPESA_SHORTCODE || process.env.MPESA_SHORT_CODE || '174379',
  passkey: process.env.MPESA_PASSKEY || 'your_passkey',
  callbackUrl: process.env.MPESA_CALLBACK_URL || `${process.env.BACKEND_URL || process.env.API_URL || 'https://hincton-meat.onrender.com'}/api/mpesa/callback`,
  environment: process.env.MPESA_ENV || 'sandbox',
}

const isMpesaConfigured = () =>
  Boolean(MPESA_CONFIG.consumerKey && MPESA_CONFIG.consumerSecret && MPESA_CONFIG.passkey && MPESA_CONFIG.passkey !== 'your_passkey')

let mpesaTokenCache: { token: string; expiresAt: number } = {
  token: '',
  expiresAt: 0,
}

async function getMpesaToken() {
  const now = Date.now()
  if (mpesaTokenCache.token && mpesaTokenCache.expiresAt > now + 10_000) {
    return mpesaTokenCache.token
  }

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

  const accessToken = response.data.access_token
  const expiresIn = Number(response.data.expires_in) || 3500
  mpesaTokenCache = {
    token: accessToken,
    expiresAt: Date.now() + Math.max(0, expiresIn - 30) * 1000,
  }

  return accessToken
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

    if (!isMpesaConfigured()) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED', errorMessage: 'M-Pesa credentials are not configured on the server' },
      })
      return res.status(503).json({
        ...apiMessage(meatShopMessages.payment.mpesaUnavailable),
        detail: 'M-Pesa sandbox credentials are missing. Set MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_PASSKEY, MPESA_SHORTCODE, and MPESA_CALLBACK_URL.',
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
        data: { mpesaReceipt: checkoutRequestID, metadata: response.data },
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
    const metadataItems = stkCallback?.CallbackMetadata?.Item || []
    const metadataValue = (name: string) => metadataItems.find((item: any) => item.Name === name)?.Value
    const receipt = metadataValue('MpesaReceiptNumber')
    const phone = metadataValue('PhoneNumber')
    const transactionDate = String(metadataValue('TransactionDate') || '')
    const parsedTransactionDate = transactionDate.length === 14
      ? new Date(`${transactionDate.slice(0, 4)}-${transactionDate.slice(4, 6)}-${transactionDate.slice(6, 8)}T${transactionDate.slice(8, 10)}:${transactionDate.slice(10, 12)}:${transactionDate.slice(12, 14)}+03:00`)
      : new Date()

    // Try match by paymentReference/accountReference if available, else skip order update
    const payment = checkoutRequestId
      ? await prisma.payment.findFirst({ where: { mpesaReceipt: checkoutRequestId } })
      : await prisma.payment.findFirst({ where: { status: 'PENDING' } })

    if (!payment) return res.status(404).json(apiMessage(meatShopMessages.payment.mpesaTimeout))

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: resultCode === 0 ? 'PAID' : 'FAILED',
        mpesaReceipt: receipt || checkoutRequestId,
        mpesaPhone: phone ? String(phone) : payment.mpesaPhone,
        mpesaTransactionDate: parsedTransactionDate,
        errorMessage: resultCode === 0 ? null : resultDesc || 'M-Pesa payment failed',
        metadata: stkCallback,

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
    let payment = await prisma.payment.findFirst({
      where: {
        OR: [
          { id: checkoutRequestID },
          { mpesaReceipt: checkoutRequestID },
        ],
      },
    })

    if (!payment) return res.status(404).json(apiMessage(meatShopMessages.payment.mpesaTimeout))

    if (payment.status === 'PENDING' && isMpesaConfigured() && payment.mpesaReceipt && payment.mpesaReceipt === checkoutRequestID) {
      try {
        const token = await getMpesaToken()
        const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14)
        const password = Buffer.from(`${MPESA_CONFIG.shortcode}${MPESA_CONFIG.passkey}${timestamp}`).toString('base64')
        const queryResponse = await axios.post(
          MPESA_CONFIG.environment === 'production'
            ? 'https://api.safaricom.co.ke/mpesa/stkpushquery/v1/query'
            : 'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query',
          {
            BusinessShortCode: MPESA_CONFIG.shortcode,
            Password: password,
            Timestamp: timestamp,
            CheckoutRequestID: checkoutRequestID,
          },
          { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } },
        )
        const resultCode = queryResponse.data?.ResultCode
        if (String(resultCode) === '0') {
          payment = await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: 'PAID',
              completedAt: new Date(),
              metadata: queryResponse.data,
            },
          })
          await prisma.order.update({
            where: { id: payment.orderId },
            data: { paymentStatus: 'PAID', status: 'CONFIRMED' },
          })
        } else if (resultCode !== undefined && String(resultCode) !== '1032') {
          payment = await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: 'FAILED',
              errorMessage: queryResponse.data?.ResultDesc || 'M-Pesa payment failed',
              metadata: queryResponse.data,
            },
          })
        }
      } catch (queryError: any) {
        console.warn('M-PESA status query warning:', queryError?.response?.data || queryError?.message || queryError)
      }
    }

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
