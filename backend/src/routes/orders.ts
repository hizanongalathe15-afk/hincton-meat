import express from 'express'
import rateLimit from 'express-rate-limit'
import { prisma } from '../config/prisma'
import { z } from 'zod'
import { notifyOrderCustomer, notifyRecipients } from '../utils/notificationService'
import { meatShopMessages, resolveMessage } from '../messages/meatShopMessages'

const router = express.Router()

const apiMessage = (message: Parameters<typeof resolveMessage>[0], values?: Parameters<typeof resolveMessage>[1]) => {
  const resolved = resolveMessage(message, values)
  return { ...resolved, error: resolved.message }
}

const updateOrderStatusSchema = z.object({
  status: z.enum([
    'PENDING',
    'CONFIRMED',
    'PROCESSING',
    'SHIPPED',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'CANCELLED',
    'REFUNDED',
    'RETURNED',
    'PARTIALLY_SHIPPED',
    'ON_HOLD',
    'AWAITING_PAYMENT',
    'PAYMENT_FAILED',
  ]),
  notes: z.string().optional(),
})

const createOrderSchema = z.object({
  customer: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(6),
  }),
  shippingAddress: z.object({
    address: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    zipCode: z.string().min(1),
    country: z.string().default('Kenya'),
    latitude: z.string().optional(),
    longitude: z.string().optional(),
  }),
  paymentMethod: z.enum(['mpesa', 'card', 'cash']),
  mpesaPhone: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().min(1).max(64),
    quantity: z.number().int().positive().max(999),
  })).min(1).max(100),
})

import type { AuthRequest } from '../middleware/auth'

const generateOrderNumber = () => {
  const stamp = Date.now().toString(36).toUpperCase()
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `HMP-${stamp}-${suffix}`
}

type CartReservation = {
  productId: string
  variantId?: string | null
  quantity: number
  expiresAt: string
}

const parseCartNotes = (notes?: string | null): { reservations?: CartReservation[]; [key: string]: any } => {
  if (!notes) return {}
  try {
    const parsed = JSON.parse(notes)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

const getActiveReservations = (notes?: string | null) => {
  const now = Date.now()
  return (parseCartNotes(notes).reservations || []).filter((reservation) => {
    return reservation.quantity > 0 && new Date(reservation.expiresAt).getTime() > now
  })
}

const reservationQuantityFor = (reservations: CartReservation[], productId: string, variantId?: string | null) => {
  return reservations
    .filter((reservation) => reservation.productId === productId && (reservation.variantId || null) === (variantId || null))
    .reduce((sum, reservation) => sum + reservation.quantity, 0)
}

const getGuestSessionId = (req: AuthRequest): string | null => {
  const value = req.header('X-Guest-Session-Id')
  if (typeof value !== 'string') return null
  const trimmed = value.trim().slice(0, 128)
  return trimmed.length >= 12 ? trimmed : null
}

const getIdempotencyKey = (req: AuthRequest): string | null => {
  const value = req.header('Idempotency-Key')
  return typeof value === 'string' && value.trim().length >= 12 ? value.trim().slice(0, 128) : null
}

const orderStatusMessage = (order: any) => {
  const orderNumber = order.orderNumber || order.id
  if (order.status === 'OUT_FOR_DELIVERY') return resolveMessage(meatShopMessages.order.outForDelivery, { driverName: 'your driver', eta: 45 }).message
  if (order.status === 'SHIPPED') return resolveMessage(meatShopMessages.order.packed).message
  if (order.status === 'DELIVERED') return resolveMessage(meatShopMessages.order.delivered).message
  if (order.status === 'PROCESSING') return resolveMessage(meatShopMessages.order.processing).message
  if (order.status === 'CONFIRMED') return resolveMessage(meatShopMessages.payment.paymentReceived, { orderNumber }).message
  if (order.status === 'CANCELLED') return `Your Hincton order ${orderNumber} has been cancelled. Contact support if this was unexpected.`
  return `Your Hincton order ${orderNumber} status is now ${String(order.status).replace(/_/g, ' ').toLowerCase()}.`
}

const allowedOrderTransitions: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'AWAITING_PAYMENT', 'ON_HOLD', 'CANCELLED', 'PAYMENT_FAILED'],
  AWAITING_PAYMENT: ['CONFIRMED', 'PAYMENT_FAILED', 'CANCELLED', 'ON_HOLD'],
  PAYMENT_FAILED: ['AWAITING_PAYMENT', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'ON_HOLD', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'PARTIALLY_SHIPPED', 'ON_HOLD', 'CANCELLED'],
  PARTIALLY_SHIPPED: ['SHIPPED', 'OUT_FOR_DELIVERY', 'RETURNED'],
  SHIPPED: ['OUT_FOR_DELIVERY', 'DELIVERED', 'RETURNED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'RETURNED'],
  ON_HOLD: ['CONFIRMED', 'PROCESSING', 'CANCELLED'],
  DELIVERED: ['RETURNED', 'REFUNDED'],
  CANCELLED: ['REFUNDED'],
  RETURNED: ['REFUNDED'],
  REFUNDED: [],
}

const assertOrderTransition = (from: string, to: string) => {
  if (from === to) return
  if (!allowedOrderTransitions[from]?.includes(to)) {
    throw new Error(`Illegal order status change from ${from} to ${to}`)
  }
}

router.post('/', async (req: AuthRequest, res) => {
  try {
    const payload = createOrderSchema.parse(req.body)
    const productIds = payload.items.map((item) => item.productId)
    const userId = req.user?.id
    const guestSessionId = userId ? null : getGuestSessionId(req)
    const idempotencyKey = getIdempotencyKey(req)

    if (idempotencyKey) {
      const existingOrder = await prisma.order.findUnique({
        where: { idempotencyKey },
        include: {
          orderItems: true,
          payments: true,
        },
      } as any)
      if (existingOrder) {
        return res.status(200).json({ ...resolveMessage(meatShopMessages.order.created, { orderNumber: existingOrder.orderNumber }), order: existingOrder, idempotent: true })
      }
    }

    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isPublished: true, deletedAt: null },
      include: { productImages: { orderBy: { sortOrder: 'asc' }, take: 1 } },
    })

    if (products.length !== productIds.length) {
      return res.status(400).json(apiMessage(meatShopMessages.stock.unavailable))
    }

    const cart = userId
      ? await prisma.cart.findUnique({ where: { userId }, include: { items: true } })
      : guestSessionId
        ? await prisma.cart.findUnique({ where: { sessionId: guestSessionId }, include: { items: true } })
        : null
    const activeReservations = getActiveReservations(cart?.notes)

    const productById = new Map(products.map((product) => [product.id, product]))
    const orderItems = payload.items.map((item) => {
      const product = productById.get(item.productId)!
      const available = product.stockQuantity + reservationQuantityFor(activeReservations, item.productId)
      if (available < item.quantity) {
        throw new Error(resolveMessage(meatShopMessages.cart.stockRemaining, { quantity: available }).message)
      }
      const unitPrice = Number(product.price)
      return {
        product,
        quantity: item.quantity,
        unitPrice,
        totalPrice: unitPrice * item.quantity,
      }
    })

    const subtotal = orderItems.reduce((sum, item) => sum + item.totalPrice, 0)
    const shippingCost = 200
    const totalAmount = subtotal + shippingCost
    const paymentStatus = payload.paymentMethod === 'cash' ? 'PENDING' : 'UNPAID'
    const orderNumber = generateOrderNumber()

    const order = await prisma.$transaction(async (tx) => {
      for (const item of orderItems) {
        const reservedQuantity = reservationQuantityFor(activeReservations, item.product.id)
        const unreservedQuantity = Math.max(0, item.quantity - reservedQuantity)
        if (unreservedQuantity === 0) continue

        const stockUpdate = await tx.product.updateMany({
          where: { id: item.product.id, stockQuantity: { gte: unreservedQuantity } },
          data: { stockQuantity: { decrement: unreservedQuantity } },
        })
        if (stockUpdate.count !== 1) {
          throw new Error(resolveMessage(meatShopMessages.cart.stockRemaining, { quantity: item.product.stockQuantity }).message)
        }
      }

      const created = await tx.order.create({
        data: {
          orderNumber,
          idempotencyKey: idempotencyKey || undefined,
          userId,
          guestEmail: userId ? undefined : payload.customer.email,
          guestPhone: userId ? undefined : payload.customer.phone,
          guestSessionId: guestSessionId || undefined,
          status: 'PENDING',
          paymentStatus: paymentStatus as any,
          subtotal: subtotal as any,
          shippingCost: shippingCost as any,
          totalAmount: totalAmount as any,
          currency: 'KES',
          shippingAddress: {
            ...payload.shippingAddress,
            firstName: payload.customer.firstName,
            lastName: payload.customer.lastName,
            email: payload.customer.email,
            phone: payload.customer.phone,
          },
          billingAddress: {
            firstName: payload.customer.firstName,
            lastName: payload.customer.lastName,
            email: payload.customer.email,
            phone: payload.customer.phone,
          },
          shippingMethod: 'standard',
          notes: payload.notes,
          orderItems: {
            create: orderItems.map((item) => ({
              productId: item.product.id,
              productName: item.product.name,
              productImage: item.product.productImages[0]?.url,
              sku: item.product.sku,
              quantity: item.quantity,
              unitPrice: item.unitPrice as any,
              totalPrice: item.totalPrice as any,
            })),
          },
          payments: {
            create: {
              userId,
              amount: totalAmount as any,
              currency: 'KES',
              paymentMethod: payload.paymentMethod,
              status: paymentStatus as any,
              mpesaPhone: payload.mpesaPhone,
              metadata: { customer: payload.customer },
            },
          },
          trackingHistory: {
            create: {
              trackingNumber: orderNumber,
              status: 'PENDING',
              location: 'Online order',
              description: `Thank you ${payload.customer.firstName}. Your order has been received and is waiting for confirmation.`,
            },
          },
        } as any,
        include: {
          orderItems: true,
          payments: true,
        },
      })

      if (cart) {
        await tx.cartItem.deleteMany({ where: { cartId: cart.id } })
        await tx.cart.update({
          where: { id: cart.id },
          data: {
            notes: JSON.stringify({
              ...parseCartNotes(cart.notes),
              reservations: [],
              reservationConsumedByOrderId: created.id,
              reservationConsumedAt: new Date().toISOString(),
            }),
          },
        })
      }

      return created
    })

    notifyRecipients({
      type: 'ORDER',
      title: `New order ${order.orderNumber}`,
      message: `A new order worth KES ${Number(order.totalAmount).toLocaleString()} has been placed.`,
      actionUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/orders`,
      channels: ['inApp', 'email'],
      recipients: await prisma.user.findMany({
        where: { roles: { has: 'ADMIN' } as any },
        select: { id: true, email: true, phone: true },
      }),
      data: { orderId: order.id, orderNumber: order.orderNumber },
    }).catch((error) => console.error('Admin new order notification error:', error))

    notifyOrderCustomer(order, `Order received ${order.orderNumber}`, `Thank you. Your order ${order.orderNumber} has been received and is waiting for confirmation.`, ['email', 'sms', 'whatsapp'])
      .catch((error) => console.error('Customer order notification error:', error))

    res.status(201).json({ ...resolveMessage(meatShopMessages.order.created, { orderNumber: order.orderNumber }), order })
  } catch (error) {
    console.error('Create order error:', error)
    const message = error instanceof Error ? error.message : 'Failed to create order'
    res.status(400).json({ ...apiMessage(meatShopMessages.system.unknownError), error: message, message })
  }
})

router.get('/mine', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json(apiMessage(meatShopMessages.system.sessionExpired))

    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    res.json({ orders })
  } catch (error) {
    console.error('Get my orders error:', error)
    res.status(500).json(apiMessage(meatShopMessages.system.serverBusy))
  }
})

// Public cross-device tracking: order number + the email or phone used at checkout.
// Guests can track from any device (e.g. after scanning the confirmation QR on a phone)
// without logging in, while order details stay protected behind contact verification.
const trackOrderSchema = z
  .object({
    orderNumber: z.string().trim().min(4).max(64),
    email: z.string().trim().email().optional(),
    phone: z.string().trim().min(6).max(20).optional(),
  })
  .refine((value) => value.email || value.phone, {
    message: 'Enter the email or phone number used on the order',
  })

const normalizePhoneDigits = (value?: string | null) => (value || '').replace(/\D/g, '').slice(-9)

const trackOrderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.ORDER_TRACK_RATE_LIMIT_MAX || 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many tracking attempts. Please try again in 15 minutes.' },
})

router.post('/track', trackOrderLimiter, async (req: AuthRequest, res) => {
  try {
    const payload = trackOrderSchema.parse(req.body)

    const order = await prisma.order.findFirst({
      where: {
        deletedAt: null,
        OR: [{ orderNumber: payload.orderNumber }, { trackingNumber: payload.orderNumber }],
      },
      include: {
        orderItems: true,
        trackingHistory: { orderBy: { timestamp: 'asc' } },
        payments: { orderBy: { createdAt: 'desc' }, take: 1 },
        user: { select: { email: true, phone: true } },
      },
    })

    // Same 404 for "not found" and "wrong contact details" so order numbers can't be probed.
    if (!order) return res.status(404).json(apiMessage(meatShopMessages.order.failedAttempt))

    const shipping = (order.shippingAddress || {}) as Record<string, any>
    const candidateEmails = [order.guestEmail, shipping.email, order.user?.email]
      .filter(Boolean)
      .map((value) => String(value).toLowerCase())
    const candidatePhones = [order.guestPhone, shipping.phone, order.user?.phone]
      .map(normalizePhoneDigits)
      .filter((value) => value.length >= 9)

    const emailMatches = Boolean(payload.email && candidateEmails.includes(payload.email.toLowerCase()))
    const phoneMatches = Boolean(payload.phone && candidatePhones.includes(normalizePhoneDigits(payload.phone)))

    if (!emailMatches && !phoneMatches) {
      return res.status(404).json(apiMessage(meatShopMessages.order.failedAttempt))
    }

    const { user: _user, ...safeOrder } = order
    res.json({ order: safeOrder })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ ...apiMessage(meatShopMessages.system.unknownError), details: error.issues })
    }
    console.error('Track order error:', error)
    res.status(500).json(apiMessage(meatShopMessages.system.serverBusy))
  }
})

router.get('/admin/cancelled/recent', async (req: AuthRequest, res) => {
  try {
    const isAdmin = req.user?.roles?.some((role) => ['ADMIN', 'SUPER_ADMIN', 'SUPPORT'].includes(role))
    if (!isAdmin) return res.status(403).json({ error: 'Admin access required' })

    const orders = await prisma.order.findMany({
      where: { status: 'CANCELLED', deletedAt: null },
      include: {
        user: { select: { id: true, email: true, phone: true, profile: { select: { fullName: true } } } },
        statusHistory: { orderBy: { createdAt: 'desc' }, take: 3 },
      },
      orderBy: { cancelledAt: 'desc' },
      take: 50,
    })

    res.json({ orders })
  } catch (error) {
    console.error('Recent cancelled orders error:', error)
    res.status(500).json(apiMessage(meatShopMessages.system.serverBusy))
  }
})

router.get('/:orderId', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id
    const guestSessionId = userId ? null : getGuestSessionId(req)

    const { orderId } = req.params
    const isAdmin = req.user?.roles?.some((role) => ['ADMIN', 'SUPER_ADMIN', 'SUPPORT'].includes(role))

    if (!isAdmin && !userId && !guestSessionId) {
      return res.status(400).json(apiMessage(meatShopMessages.system.sessionExpired))
    }

    const order = await prisma.order.findFirst({
      where: {
        deletedAt: null,
        OR: [
          { id: orderId },
          { orderNumber: orderId },
          { trackingNumber: orderId },
        ],
        ...(isAdmin ? {} : userId ? { userId } : { guestSessionId }),
      },
      include: {
        orderItems: true,
        trackingHistory: { orderBy: { timestamp: 'asc' } },
        payments: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    })

    if (!order) return res.status(404).json(apiMessage(meatShopMessages.order.failedAttempt))

    res.json({ order })
  } catch (error) {
    console.error('Get order error:', error)
    res.status(500).json(apiMessage(meatShopMessages.system.serverBusy))
  }
})

const canCancelOrder = (order: any) => {
  return ['PENDING', 'CONFIRMED', 'AWAITING_PAYMENT', 'ON_HOLD'].includes(order.status)
}

router.patch('/:orderId/cancel', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id
    const guestSessionId = userId ? null : getGuestSessionId(req)
    const isAdmin = req.user?.roles?.some((role) => ['ADMIN', 'SUPER_ADMIN', 'SUPPORT'].includes(role))
    const { orderId } = req.params
    const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim().slice(0, 500) : ''

    if (!isAdmin && !userId && !guestSessionId) {
      return res.status(400).json(apiMessage(meatShopMessages.system.sessionExpired))
    }

    const order = await prisma.order.findFirst({
      where: {
        deletedAt: null,
        OR: [{ id: orderId }, { orderNumber: orderId }],
        ...(isAdmin ? {} : userId ? { userId } : { guestSessionId }),
      },
      include: {
        orderItems: true,
        user: { select: { id: true, email: true, phone: true, profile: { select: { fullName: true } } } },
      },
    })

    if (!order) return res.status(404).json(apiMessage(meatShopMessages.order.failedAttempt))
    if (!canCancelOrder(order)) {
      return res.status(400).json({ message: 'Order cannot be cancelled at this stage', error: 'Order cannot be cancelled at this stage' })
    }

    const cancelled = await prisma.$transaction(async (tx) => {
      for (const item of order.orderItems) {
        if (!item.productId) continue
        if (item.variantId) {
          await tx.productVariant.update({ where: { id: item.variantId }, data: { stockQuantity: { increment: item.quantity } } })
        } else {
          await tx.product.update({ where: { id: item.productId }, data: { stockQuantity: { increment: item.quantity } } })
        }
      }

      const updated = await tx.order.update({
        where: { id: order.id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          notes: reason ? `${order.notes || ''}\nCancellation reason: ${reason}`.trim() : order.notes,
        },
        include: {
          user: { select: { id: true, email: true, phone: true, profile: { select: { fullName: true } } } },
          orderItems: true,
          statusHistory: { orderBy: { createdAt: 'desc' } },
        },
      })

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: 'CANCELLED',
          notes: reason || 'Order cancelled',
          createdBy: isAdmin ? userId || 'admin' : userId || guestSessionId || 'guest',
        },
      })

      await tx.trackingHistory.create({
        data: {
          orderId: order.id,
          trackingNumber: order.trackingNumber || order.orderNumber,
          status: 'CANCELLED',
          location: 'Hincton Meat Products',
          description: reason ? `Order cancelled. Reason: ${reason}` : 'Order cancelled.',
        },
      })

      return updated
    })

    const admins = await prisma.user.findMany({
      where: { roles: { hasSome: ['ADMIN', 'SUPER_ADMIN', 'SUPPORT'] as any } },
      select: { id: true, email: true, phone: true },
    })

    notifyRecipients({
      type: 'ORDER',
      title: `Order cancelled ${cancelled.orderNumber}`,
      message: `${cancelled.user?.profile?.fullName || cancelled.user?.email || cancelled.guestEmail || 'A customer'} cancelled order ${cancelled.orderNumber}.`,
      actionUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/orders`,
      channels: ['inApp', 'email'],
      recipients: admins,
      data: {
        orderId: cancelled.id,
        orderNumber: cancelled.orderNumber,
        cancelledBy: isAdmin ? 'admin' : 'customer',
        customerEmail: cancelled.user?.email || cancelled.guestEmail,
        customerPhone: cancelled.user?.phone || cancelled.guestPhone,
        reason,
      },
    }).catch((error) => console.error('Admin cancelled order notification error:', error))

    notifyOrderCustomer(cancelled, `Order cancelled ${cancelled.orderNumber}`, orderStatusMessage(cancelled), ['inApp', 'email', 'sms', 'whatsapp'])
      .catch((error) => console.error('Customer cancellation notification error:', error))

    res.json({ message: 'Order cancelled successfully', order: cancelled })
  } catch (error) {
    console.error('Cancel order error:', error)
    res.status(500).json(apiMessage(meatShopMessages.system.serverBusy))
  }
})

// Admin update order status
router.put('/:orderId/status', async (req, res) => {
  try {
    const authReq = req as AuthRequest
    const isAdmin = authReq.user?.roles?.some((role) => ['ADMIN', 'SUPER_ADMIN', 'SUPPORT'].includes(role))
    if (!isAdmin) return res.status(403).json({ error: 'Admin access required' })

    const { orderId } = req.params
    const data = updateOrderStatusSchema.parse(req.body)

    const current = await prisma.order.findUnique({ where: { id: orderId } })
    if (!current) return res.status(404).json({ error: 'Order not found' })
    assertOrderTransition(current.status, data.status)

    const updated = await prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id: orderId },
        data: {
          status: data.status,
          notes: data.notes,
          deliveredAt: data.status === 'DELIVERED' ? new Date() : undefined,
          cancelledAt: data.status === 'CANCELLED' ? new Date() : undefined,
        },
        include: {
          user: { select: { id: true, email: true, phone: true } },
        },
      })

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: data.status,
          notes: data.notes || `Status changed from ${current.status} to ${data.status}`,
          createdBy: authReq.user?.id || 'admin',
        },
      })

      await tx.trackingHistory.create({
        data: {
          orderId,
          trackingNumber: order.trackingNumber || order.orderNumber,
          status: data.status,
          location: data.status === 'OUT_FOR_DELIVERY' ? 'Delivery route' : 'Hincton Meat Products',
          description: data.notes || orderStatusMessage(order),
        },
      })

      await tx.auditLog.create({
        data: {
          userId: authReq.user?.id,
          action: 'ORDER_STATUS_UPDATE',
          entityType: 'Order',
          entityId: orderId,
          oldValues: { status: current.status } as any,
          newValues: { status: data.status, notes: data.notes } as any,
        },
      })

      return order
    })

    notifyOrderCustomer(updated, `Order update ${updated.orderNumber}`, orderStatusMessage(updated), ['inApp', 'email', 'sms', 'whatsapp'])
      .catch((error) => console.error('Order status notification error:', error))

    res.json({ ...resolveMessage(meatShopMessages.order.statusUpdated), order: updated })
  } catch (error) {
    console.error('Update order status error:', error)
    const message = error instanceof Error ? error.message : meatShopMessages.system.serverBusy.text
    res.status(message.startsWith('Illegal order status change') ? 400 : 500).json({ message, error: message })
  }
})

export default router
