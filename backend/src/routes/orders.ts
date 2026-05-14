import express from 'express'
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
    productId: z.string().min(1),
    quantity: z.number().int().positive(),
  })).min(1),
})

import type { AuthRequest } from '../middleware/auth'

const generateOrderNumber = () => {
  const stamp = Date.now().toString(36).toUpperCase()
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `HMP-${stamp}-${suffix}`
}

const getGuestSessionId = (req: AuthRequest): string | null => {
  const value = req.header('X-Guest-Session-Id')
  return typeof value === 'string' && value.trim().length >= 12 ? value.trim() : null
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

router.post('/', async (req: AuthRequest, res) => {
  try {
    const payload = createOrderSchema.parse(req.body)
    const productIds = payload.items.map((item) => item.productId)

    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isPublished: true, deletedAt: null },
      include: { productImages: { orderBy: { sortOrder: 'asc' }, take: 1 } },
    })

    if (products.length !== productIds.length) {
      return res.status(400).json(apiMessage(meatShopMessages.stock.unavailable))
    }

    const productById = new Map(products.map((product) => [product.id, product]))
    const orderItems = payload.items.map((item) => {
      const product = productById.get(item.productId)!
      if (product.stockQuantity < item.quantity) {
        throw new Error(resolveMessage(meatShopMessages.cart.stockRemaining, { quantity: product.stockQuantity }).message)
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
    const userId = req.user?.id
    const guestSessionId = userId ? null : getGuestSessionId(req)
    const paymentStatus = payload.paymentMethod === 'cash' ? 'PENDING' : 'UNPAID'
    const orderNumber = generateOrderNumber()

    const order = await prisma.$transaction(async (tx) => {
      for (const item of orderItems) {
        const stockUpdate = await tx.product.updateMany({
          where: { id: item.product.id, stockQuantity: { gte: item.quantity } },
          data: { stockQuantity: { decrement: item.quantity } },
        })
        if (stockUpdate.count !== 1) {
          throw new Error(resolveMessage(meatShopMessages.cart.stockRemaining, { quantity: item.product.stockQuantity }).message)
        }
      }

      const created = await tx.order.create({
        data: {
          orderNumber,
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

      if (userId) {
        const cart = await tx.cart.findUnique({ where: { userId } })
        if (cart) await tx.cartItem.deleteMany({ where: { cartId: cart.id } })
      } else if (guestSessionId) {
        const cart = await tx.cart.findUnique({ where: { sessionId: guestSessionId } })
        if (cart) await tx.cartItem.deleteMany({ where: { cartId: cart.id } })
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

// Admin update order status
router.put('/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params
    const data = updateOrderStatusSchema.parse(req.body)

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: data.status,
        notes: data.notes,
      },
      include: {
        user: { select: { id: true, email: true, phone: true } },
      },
    })

    await prisma.trackingHistory.create({
      data: {
        orderId,
        trackingNumber: updated.trackingNumber || updated.orderNumber,
        status: data.status,
        location: data.status === 'OUT_FOR_DELIVERY' ? 'Delivery route' : 'Hincton Meat Products',
        description: data.notes || orderStatusMessage(updated),
      },
    })

    notifyOrderCustomer(updated, `Order update ${updated.orderNumber}`, orderStatusMessage(updated), ['inApp', 'email', 'sms', 'whatsapp'])
      .catch((error) => console.error('Order status notification error:', error))

    res.json({ ...resolveMessage(meatShopMessages.order.statusUpdated), order: updated })
  } catch (error) {
    console.error('Update order status error:', error)
    res.status(500).json(apiMessage(meatShopMessages.system.serverBusy))
  }
})

export default router
