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

    res.json({
      cart: {
        items,
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

    if (existing.product.stockQuantity < quantity) {
      return res.status(400).json(apiMessage(meatShopMessages.cart.stockRemaining, { quantity: existing.product.stockQuantity }))
    }

    const updated = await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity },
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

    await prisma.cartItem.delete({ where: { id: item.id } })

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

    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } })

    res.json(resolveMessage(meatShopMessages.cart.cleared))
  } catch (error) {
    console.error('Clear cart error:', error)
    res.status(500).json(apiMessage(meatShopMessages.system.serverBusy))
  }
})

export default router
