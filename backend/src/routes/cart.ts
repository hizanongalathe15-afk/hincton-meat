import express from 'express'
import { prisma } from '../config/prisma'
import { z } from 'zod'
import { meatShopMessages, resolveMessage } from '../messages/meatShopMessages'

const router = express.Router()

// Prisma models:
// - Cart: userId is optional, unique
// - CartItem: cartId + productId (+ variantId optional)

const addToCartSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
})

const updateCartItemSchema = z.object({
  quantity: z.number().int().positive(),
})

const getAuthUserId = (req: any): string | null => {
  return req.user?.id ?? null
}

const getGuestSessionId = (req: any): string | null => {
  const value = req.header('X-Guest-Session-Id')
  return typeof value === 'string' && value.trim().length >= 12 ? value.trim() : null
}

const getCartScope = (req: any): { userId?: string; sessionId?: string } | null => {
  const userId = getAuthUserId(req)
  if (userId) return { userId }

  const sessionId = getGuestSessionId(req)
  if (sessionId) return { sessionId }

  return null
}

const getCartWhere = (scope: { userId?: string; sessionId?: string }) => {
  return scope.userId ? { userId: scope.userId } : { sessionId: scope.sessionId! }
}

const getOrCreateCart = async (scope: { userId?: string; sessionId?: string }) => {
  if (scope.userId) {
    return prisma.cart.upsert({
      where: { userId: scope.userId },
      create: { userId: scope.userId },
      update: {},
    })
  }

  return prisma.cart.upsert({
    where: { sessionId: scope.sessionId! },
    create: { sessionId: scope.sessionId! },
    update: {},
  })
}

const toMoneyNumber = (v: any): number => {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : 0
}

const apiMessage = (message: Parameters<typeof resolveMessage>[0], values?: Parameters<typeof resolveMessage>[1]) => {
  const resolved = resolveMessage(message, values)
  return { ...resolved, error: resolved.message }
}

const emptyCart = {
  cart: {
    items: [],
    summary: {
      totalItems: 0,
      subtotal: 0,
    },
  },
}

type CartReservation = {
  productId: string
  variantId?: string | null
  quantity: number
  expiresAt: string
}

const RESERVATION_MINUTES = 15

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

const writeReservations = async (tx: any, cartId: string, notes: string | null | undefined, reservations: CartReservation[]) => {
  const existing = parseCartNotes(notes)
  await tx.cart.update({
    where: { id: cartId },
    data: {
      notes: JSON.stringify({
        ...existing,
        reservations,
        reservationUpdatedAt: new Date().toISOString(),
      }),
    },
  })
}

const releaseActiveReservations = async (tx: any, cart: { id: string; notes?: string | null }) => {
  const reservations = getActiveReservations(cart.notes)
  for (const reservation of reservations) {
    if (reservation.variantId) {
      await tx.productVariant.update({
        where: { id: reservation.variantId },
        data: { stockQuantity: { increment: reservation.quantity } },
      })
    } else {
      await tx.product.update({
        where: { id: reservation.productId },
        data: { stockQuantity: { increment: reservation.quantity } },
      })
    }
  }
  await writeReservations(tx, cart.id, cart.notes, [])
}

const isDatabaseUnavailable = (error: unknown) => {
  const code = (error as any)?.code
  return code === 'P1001' || code === 'P2021' || code === 'P2022'
}

// GET /api/cart
router.get('/', async (req, res) => {
  try {
    const scope = getCartScope(req)
    if (!scope) return res.status(400).json(apiMessage(meatShopMessages.system.sessionExpired))

    const cart = await prisma.cart.findUnique({
      where: getCartWhere(scope),
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                stockQuantity: true,
                isPublished: true,
                isFeatured: true,
                category: { select: { id: true, name: true, slug: true } },
                productImages: { select: { url: true } },
              },
            },
          },
        },
      },
    })

    const items = (cart?.items ?? []).map((item) => {
      const price = toMoneyNumber((item as any).product?.price)
      const totalPrice = price * item.quantity
      const images = (item as any).product?.productImages?.map((img: any) => img.url) ?? []
      return {
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        product: {
          id: (item as any).product?.id,
          name: (item as any).product?.name,
          price: price,
          stockQuantity: (item as any).product?.stockQuantity,
          category: (item as any).product?.category,
          images,
        },
        totalPrice,
      }
    })

    const subtotal = items.reduce((sum, i) => sum + i.totalPrice, 0)
    const reservations = getActiveReservations(cart?.notes)
    const reservationExpiresAt = reservations.length
      ? reservations.reduce((min, reservation) => Math.min(min, new Date(reservation.expiresAt).getTime()), Infinity)
      : null

    res.json({
      cart: {
        items,
        reservationExpiresAt: reservationExpiresAt ? new Date(reservationExpiresAt).toISOString() : null,
        summary: {
          totalItems: items.reduce((s, i) => s + i.quantity, 0),
          subtotal,
        },
      },
    })
  } catch (error) {
    console.error('Get cart error:', error)
    if (isDatabaseUnavailable(error)) {
      return res.json(emptyCart)
    }
    res.status(500).json(apiMessage(meatShopMessages.system.serverBusy))
  }
})

// POST /api/cart/add
router.post('/add', async (req, res) => {
  try {
    const scope = getCartScope(req)
    if (!scope) return res.status(400).json(apiMessage(meatShopMessages.system.sessionExpired))

    const { productId, quantity } = addToCartSchema.parse(req.body)

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true, price: true, stockQuantity: true },
    })

    if (!product) return res.status(404).json(apiMessage(meatShopMessages.stock.unavailable))
    if (product.stockQuantity < quantity) {
      return res.status(400).json(apiMessage(meatShopMessages.cart.stockRemaining, { quantity: product.stockQuantity }))
    }

    const cart = await getOrCreateCart(scope)

    // if CartItem exists for (cartId, productId, variantId=null)
    const existing = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId,
        variantId: null,
      },
    })

    const nextQty = (existing?.quantity ?? 0) + quantity
    if (product.stockQuantity < nextQty) {
      return res.status(400).json(apiMessage(meatShopMessages.cart.stockRemaining, { quantity: product.stockQuantity }))
    }

    const item = existing
      ? await prisma.cartItem.update({
          where: { id: existing.id },
          data: { quantity: nextQty },
        })
      : await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId,
            quantity,
          },
        })

    res.status(201).json({
      ...resolveMessage(meatShopMessages.cart.itemAddedNamed, { quantity, name: product.name }),
      itemId: item.id,
    })
  } catch (error) {
    console.error('Add to cart error:', error)
    res.status(500).json(apiMessage(meatShopMessages.system.serverBusy))
  }
})

// PUT /api/cart/item/:itemId
router.put('/item/:itemId', async (req, res) => {
  try {
    const scope = getCartScope(req)
    if (!scope) return res.status(400).json(apiMessage(meatShopMessages.system.sessionExpired))

    const { itemId } = req.params
    const { quantity } = updateCartItemSchema.parse(req.body)

    const cart = await prisma.cart.findUnique({ where: getCartWhere(scope) })
    if (!cart) return res.status(404).json(apiMessage(meatShopMessages.cart.restored))

    const existing = await prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
      include: { product: { select: { stockQuantity: true } } },
    })

    if (!existing) return res.status(404).json(apiMessage(meatShopMessages.stock.unavailable))

    const reservedQty = getActiveReservations(cart.notes).find((reservation) => reservation.productId === existing.productId && !reservation.variantId)?.quantity || 0
    const available = existing.product.stockQuantity + reservedQty
    if (available < quantity) {
      return res.status(400).json(apiMessage(meatShopMessages.cart.stockRemaining, { quantity: available }))
    }

    const updated = await prisma.$transaction(async (tx) => {
      await releaseActiveReservations(tx, cart)
      return tx.cartItem.update({
        where: { id: existing.id },
        data: { quantity },
      })
    })

    res.json({ ...resolveMessage(meatShopMessages.cart.updated), item: updated })
  } catch (error) {
    console.error('Update cart item error:', error)
    res.status(500).json(apiMessage(meatShopMessages.system.serverBusy))
  }
})

// DELETE /api/cart/item/:itemId
router.delete('/item/:itemId', async (req, res) => {
  try {
    const scope = getCartScope(req)
    if (!scope) return res.status(400).json(apiMessage(meatShopMessages.system.sessionExpired))

    const { itemId } = req.params

    const cart = await prisma.cart.findUnique({ where: getCartWhere(scope) })
    if (!cart) return res.status(404).json(apiMessage(meatShopMessages.cart.restored))

    const item = await prisma.cartItem.findFirst({ where: { id: itemId, cartId: cart.id } })
    if (!item) return res.status(404).json(apiMessage(meatShopMessages.stock.unavailable))

    await prisma.$transaction(async (tx) => {
      await releaseActiveReservations(tx, cart)
      await tx.cartItem.delete({ where: { id: item.id } })
    })

    res.json(resolveMessage(meatShopMessages.cart.itemRemoved))
  } catch (error) {
    console.error('Remove cart item error:', error)
    res.status(500).json(apiMessage(meatShopMessages.system.serverBusy))
  }
})

// DELETE /api/cart/clear
router.delete('/clear', async (req, res) => {
  try {
    const scope = getCartScope(req)
    if (!scope) return res.status(400).json(apiMessage(meatShopMessages.system.sessionExpired))

    const cart = await prisma.cart.findUnique({ where: getCartWhere(scope) })
    if (!cart) return res.status(200).json(resolveMessage(meatShopMessages.cart.cleared))

    await prisma.$transaction(async (tx) => {
      await releaseActiveReservations(tx, cart)
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } })
    })

    res.json(resolveMessage(meatShopMessages.cart.cleared))
  } catch (error) {
    console.error('Clear cart error:', error)
    res.status(500).json(apiMessage(meatShopMessages.system.serverBusy))
  }
})

// POST /api/cart/checkout-lock
router.post('/checkout-lock', async (req, res) => {
  try {
    const scope = getCartScope(req)
    if (!scope) return res.status(400).json(apiMessage(meatShopMessages.system.sessionExpired))

    const cart = await prisma.cart.findUnique({
      where: getCartWhere(scope),
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, stockQuantity: true } },
            variant: { select: { id: true, stockQuantity: true } },
          },
        },
      },
    })

    if (!cart || cart.items.length === 0) {
      return res.status(400).json(apiMessage(meatShopMessages.cart.restored))
    }

    const expiresAt = new Date(Date.now() + RESERVATION_MINUTES * 60 * 1000)

    const result = await prisma.$transaction(async (tx) => {
      await releaseActiveReservations(tx, cart)

      for (const item of cart.items) {
        if (item.variantId) {
          const updated = await tx.productVariant.updateMany({
            where: { id: item.variantId, stockQuantity: { gte: item.quantity } },
            data: { stockQuantity: { decrement: item.quantity } },
          })
          if (updated.count !== 1) {
            throw new Error(resolveMessage(meatShopMessages.cart.stockRemaining, { quantity: item.variant?.stockQuantity || 0 }).message)
          }
        } else {
          const updated = await tx.product.updateMany({
            where: { id: item.productId, stockQuantity: { gte: item.quantity } },
            data: { stockQuantity: { decrement: item.quantity } },
          })
          if (updated.count !== 1) {
            throw new Error(resolveMessage(meatShopMessages.cart.stockRemaining, { quantity: item.product.stockQuantity }).message)
          }
        }
      }

      const reservations = cart.items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        expiresAt: expiresAt.toISOString(),
      }))

      await writeReservations(tx, cart.id, cart.notes, reservations)
      return { reservations, expiresAt }
    })

    res.json({
      message: `Your cart is reserved for ${RESERVATION_MINUTES} minutes while you pay.`,
      reservationExpiresAt: result.expiresAt,
      reservations: result.reservations,
    })
  } catch (error) {
    console.error('Checkout lock error:', error)
    const message = error instanceof Error ? error.message : resolveMessage(meatShopMessages.system.serverBusy).message
    res.status(400).json({ ...apiMessage(meatShopMessages.system.serverBusy), message, error: message })
  }
})

export default router
