import { prisma } from '../config/prisma'
import { sendEmail } from './emailService'

type DeliveryChannel = 'inApp' | 'email' | 'sms' | 'whatsapp'

type Recipient = {
  id?: string | null
  email?: string | null
  phone?: string | null
}

type NotificationPayload = {
  type?: 'ORDER' | 'PAYMENT' | 'SHIPPING' | 'PROMOTION' | 'SYSTEM' | 'ACCOUNT' | 'REVIEW' | 'WISHLIST'
  title: string
  message: string
  actionUrl?: string
  data?: Record<string, unknown>
  channels: DeliveryChannel[]
  recipients: Recipient[]
}

const normalizePhone = (phone?: string | null) => {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  if (!digits) return null
  if (digits.startsWith('254')) return `+${digits}`
  if (digits.startsWith('0')) return `+254${digits.slice(1)}`
  if (phone.trim().startsWith('+')) return phone.trim()
  return `+${digits}`
}

const postWebhook = async (url: string | undefined, token: string | undefined, body: Record<string, unknown>) => {
  if (!url) return { sent: false, skipped: true }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`Notification webhook failed with ${response.status}`)
  }

  return { sent: true }
}

const sendSms = (to: string, message: string) =>
  postWebhook(process.env.SMS_WEBHOOK_URL, process.env.SMS_WEBHOOK_TOKEN, {
    to,
    message,
    provider: process.env.SMS_PROVIDER || 'webhook',
  })

const sendWhatsApp = (to: string, message: string, actionUrl?: string) =>
  postWebhook(process.env.WHATSAPP_WEBHOOK_URL, process.env.WHATSAPP_WEBHOOK_TOKEN, {
    to,
    message,
    actionUrl,
    provider: process.env.WHATSAPP_PROVIDER || 'webhook',
  })

export const notifyRecipients = async (payload: NotificationPayload) => {
  const uniqueRecipients = payload.recipients.filter((recipient, index, all) => {
    const key = recipient.id || recipient.email || recipient.phone
    return Boolean(key) && all.findIndex((item) => (item.id || item.email || item.phone) === key) === index
  })

  const summary = {
    inApp: 0,
    email: 0,
    sms: 0,
    whatsapp: 0,
    skipped: 0,
    failed: 0,
  }

  if (payload.channels.includes('inApp')) {
    const inAppRecipients = uniqueRecipients.filter((recipient) => recipient.id)
    if (inAppRecipients.length) {
      await prisma.notification.createMany({
        data: inAppRecipients.map((recipient) => ({
          userId: recipient.id!,
          type: (payload.type || 'SYSTEM') as any,
          title: payload.title,
          message: payload.message,
          actionUrl: payload.actionUrl,
          data: (payload.data || {}) as any,
          isRead: false,
          channel: 'IN_APP',
          sentAt: new Date(),
        })),
      })
      summary.inApp = inAppRecipients.length
    }
  }

  for (const recipient of uniqueRecipients) {
    if (payload.channels.includes('email') && recipient.email) {
      try {
        const result = await sendEmail({
          to: recipient.email,
          subject: payload.title,
          text: payload.message,
          html: `<p>${payload.message.replace(/\n/g, '<br>')}</p>${payload.actionUrl ? `<p><a href="${payload.actionUrl}">Open details</a></p>` : ''}`,
        })
        result.skipped ? summary.skipped++ : summary.email++
      } catch {
        summary.failed++
      }
    }

    const phone = normalizePhone(recipient.phone)
    if (payload.channels.includes('sms') && phone) {
      try {
        const result = await sendSms(phone, payload.message)
        result.skipped ? summary.skipped++ : summary.sms++
      } catch {
        summary.failed++
      }
    }

    if (payload.channels.includes('whatsapp') && phone) {
      try {
        const result = await sendWhatsApp(phone, payload.message, payload.actionUrl)
        result.skipped ? summary.skipped++ : summary.whatsapp++
      } catch {
        summary.failed++
      }
    }
  }

  return summary
}

export const notifyOrderCustomer = async (order: any, title: string, message: string, channels: DeliveryChannel[] = ['inApp', 'email', 'sms']) => {
  const address = order.shippingAddress || {}
  return notifyRecipients({
    type: order.status === 'OUT_FOR_DELIVERY' || order.status === 'SHIPPED' ? 'SHIPPING' : 'ORDER',
    title,
    message,
    actionUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/order-tracking/${order.orderNumber || order.id}`,
    data: { orderId: order.id, orderNumber: order.orderNumber, status: order.status },
    channels,
    recipients: [{
      id: order.userId,
      email: order.user?.email || order.guestEmail || address.email,
      phone: order.user?.phone || order.guestPhone || address.phone,
    }],
  })
}
