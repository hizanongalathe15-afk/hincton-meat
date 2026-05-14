import { prisma } from '../config/prisma'
import { notifyRecipients } from '../utils/notificationService'

const toNumber = (value: unknown) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const reminderMessage = (itemCount: number, lowStockNames: string[]) => {
  const stockLine = lowStockNames.length
    ? ` Some items are moving quickly: ${lowStockNames.slice(0, 3).join(', ')}.`
    : ''

  return `A quick polite reminder: you still have ${itemCount} item${itemCount === 1 ? '' : 's'} in your Hincton cart.${stockLine} Checkout when ready so stock can be confirmed for you.`
}

export const runCartReminderSweep = async (options: {
  olderThanMinutes?: number
  lowStockOnly?: boolean
  limit?: number
} = {}) => {
  const olderThanMinutes = options.olderThanMinutes ?? 30
  const limit = Math.min(Math.max(options.limit ?? 100, 1), 500)
  const cutoff = new Date(Date.now() - olderThanMinutes * 60 * 1000)

  const carts = await prisma.cart.findMany({
    where: {
      updatedAt: { lte: cutoff },
      items: { some: {} },
    },
    take: limit,
    orderBy: { updatedAt: 'asc' },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          phone: true,
          profile: { select: { mpesaPhone: true, fullName: true } },
        },
      },
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              stockQuantity: true,
              lowStockThreshold: true,
            },
          },
        },
      },
    },
  })

  let scanned = carts.length
  let reminded = 0
  let skipped = 0

  for (const cart of carts) {
    const notes = (() => {
      try {
        return cart.notes ? JSON.parse(cart.notes) : {}
      } catch {
        return {}
      }
    })()

    const lastReminderAt = notes.stockReminderSentAt ? new Date(notes.stockReminderSentAt).getTime() : 0
    if (lastReminderAt && Date.now() - lastReminderAt < 60 * 60 * 1000) {
      skipped++
      continue
    }

    const lowStockItems = cart.items.filter((item) => {
      const available = item.product.stockQuantity
      const threshold = Math.max(item.product.lowStockThreshold || 0, item.quantity)
      return available <= threshold
    })

    if (options.lowStockOnly && lowStockItems.length === 0) {
      skipped++
      continue
    }

    const cartValue = cart.items.reduce((sum, item) => sum + toNumber(item.product.price) * item.quantity, 0)
    const message = reminderMessage(cart.items.length, lowStockItems.map((item) => item.product.name))
    const title = lowStockItems.length ? 'Your cart items are selling fast' : 'You still have items in your cart'

    const abandonedCart = await prisma.abandonedCart.upsert({
      where: cart.userId
        ? { id: `cart-${cart.id}` }
        : { id: `cart-${cart.id}` },
      create: {
        id: `cart-${cart.id}`,
        userId: cart.userId,
        guestSessionId: cart.sessionId,
        cartItems: cart.items.map((item) => ({
          productId: item.productId,
          name: item.product.name,
          quantity: item.quantity,
          stockQuantity: item.product.stockQuantity,
        })) as any,
        cartValue: cartValue as any,
        recoveryStatus: 'reminder_sent',
        reminderCount: 1,
        firstReminderSentAt: new Date(),
      },
      update: {
        cartItems: cart.items.map((item) => ({
          productId: item.productId,
          name: item.product.name,
          quantity: item.quantity,
          stockQuantity: item.product.stockQuantity,
        })) as any,
        cartValue: cartValue as any,
        recoveryStatus: 'reminder_sent',
        reminderCount: { increment: 1 },
        firstReminderSentAt: notes.stockReminderSentAt ? undefined : new Date(),
        secondReminderSentAt: notes.stockReminderSentAt ? new Date() : undefined,
      },
    })

    const recipient = cart.user
      ? {
          id: cart.user.id,
          email: cart.user.email,
          phone: cart.user.phone || cart.user.profile?.mpesaPhone,
        }
      : null

    if (recipient) {
      await notifyRecipients({
        type: 'SYSTEM',
        title,
        message,
        actionUrl: '/cart',
        channels: ['inApp', 'email', 'sms', 'whatsapp'],
        recipients: [recipient],
        data: {
          cartId: cart.id,
          lowStockProductIds: lowStockItems.map((item) => item.productId),
        },
      })
    }

    await prisma.abandonedCartReminder.create({
      data: {
        abandonedCartId: abandonedCart.id,
        reminderType: lowStockItems.length ? 'stock_pressure' : 'cart_waiting',
        message,
        recipientEmail: cart.user?.email,
        recipientPhone: cart.user?.phone || cart.user?.profile?.mpesaPhone,
        recipientUserId: cart.user?.id,
      },
    })

    await prisma.cart.update({
      where: { id: cart.id },
      data: {
        abandonedAt: cart.abandonedAt || new Date(),
        notes: JSON.stringify({
          ...notes,
          stockReminderSentAt: new Date().toISOString(),
          stockReminderMessage: message,
          stockReminderLowStockProductIds: lowStockItems.map((item) => item.productId),
        }),
      },
    })

    reminded++
  }

  return { scanned, reminded, skipped, cutoff }
}
