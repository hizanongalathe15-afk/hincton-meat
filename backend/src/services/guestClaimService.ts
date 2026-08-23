import type { Request } from 'express'
import { prisma } from '../config/prisma'

/**
 * Guest checkout support.
 *
 * Guest activity (carts + orders) is keyed by an anonymous session id sent in
 * the `X-Guest-Session-Id` header. When the guest later registers or logs in,
 * `claimGuestData` attaches their guest orders to the account and merges the
 * guest cart into the account cart (quantities are combined per product).
 */

export const getGuestSessionIdFromRequest = (req: Request): string | null => {
  const value = req.header('X-Guest-Session-Id')
  if (typeof value !== 'string') return null
  const trimmed = value.trim().slice(0, 128)
  return trimmed.length >= 12 ? trimmed : null
}

export const claimGuestData = async (
  userId: string,
  guestSessionId: string | null
): Promise<{ ordersClaimed: number; cartItemsMerged: number }> => {
  if (!userId || !guestSessionId) return { ordersClaimed: 0, cartItemsMerged: 0 }

  // Attach unclaimed guest orders placed from this browser to the account.
  const claimedOrders = await prisma.order.updateMany({
    where: { guestSessionId, userId: null },
    data: { userId },
  })

  // Merge the guest cart into the account cart, combining quantities.
  const guestCart = await prisma.cart.findUnique({
    where: { sessionId: guestSessionId },
    include: { items: true },
  })

  let cartItemsMerged = 0

  if (guestCart && guestCart.items.length > 0) {
    const userCart = await prisma.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
    })

    for (const item of guestCart.items) {
      const existing = await prisma.cartItem.findFirst({
        where: {
          cartId: userCart.id,
          productId: item.productId,
          variantId: item.variantId ?? null,
        },
      })

      if (existing) {
        await prisma.cartItem.update({
          where: { id: existing.id },
          data: { quantity: existing.quantity + item.quantity },
        })
      } else {
        await prisma.cartItem.create({
          data: {
            cartId: userCart.id,
            productId: item.productId,
            variantId: item.variantId ?? null,
            quantity: item.quantity,
          },
        })
      }
      cartItemsMerged += 1
    }

    await prisma.cartItem.deleteMany({ where: { cartId: guestCart.id } })
    await prisma.cart.delete({ where: { id: guestCart.id } })
  }

  if (claimedOrders.count > 0 || cartItemsMerged > 0) {
    console.log(
      `Guest data claimed for user ${userId}: ${claimedOrders.count} orders, ${cartItemsMerged} cart items`,
    )
  }

  return { ordersClaimed: claimedOrders.count, cartItemsMerged }
}
