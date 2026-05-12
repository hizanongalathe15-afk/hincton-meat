import { Request, Response, NextFunction } from 'express'
import { CartModel } from '../models'
import { asyncHandler, AppError, NotFoundError, ValidationError } from '../middleware'
import { validateBody } from '../middleware'

export const getCart = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id
  const sessionId = req.headers['x-guest-session-id'] as string
  
  let cart
  if (userId) {
    cart = await CartModel.findByUserId(userId)
  } else if (sessionId) {
    cart = await CartModel.findBySessionId(sessionId)
  } else {
    cart = null
  }
  
  res.json({
    success: true,
    data: cart
  })
})

export const addToCart = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id
  const sessionId = req.headers['x-guest-session-id'] as string
  const { productId, variantId, quantity } = req.body
  
  if (!productId || !quantity) {
    throw new ValidationError('Product ID and quantity are required')
  }
  
  if (quantity < 1) {
    throw new ValidationError('Quantity must be at least 1')
  }
  
  let cart
  if (userId) {
    cart = await CartModel.findByUserId(userId)
  } else if (sessionId) {
    cart = await CartModel.findBySessionId(sessionId)
  }
  
  if (!cart) {
    // Create new cart
    const cartData: any = {
      items: [{
        productId,
        variantId,
        quantity: Number(quantity)
      }]
    }
    
    if (userId) {
      cartData.userId = userId
    } else {
      cartData.sessionId = sessionId
    }
    
    cart = await CartModel.create(cartData)
  } else {
    // Add item to existing cart
    const updatedCart = await CartModel.addItem(cart.id, {
      productId,
      variantId,
      quantity: Number(quantity)
    })
    cart = updatedCart
  }
  
  res.status(201).json({
    success: true,
    data: cart,
    message: 'Item added to cart successfully'
  })
})

export const updateCartItem = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id
  const sessionId = req.headers['x-guest-session-id'] as string
  const { itemId } = req.params
  const { quantity } = req.body
  
  if (!quantity || quantity < 1) {
    throw new ValidationError('Valid quantity is required')
  }
  
  let cart
  if (userId) {
    cart = await CartModel.findByUserId(userId)
  } else if (sessionId) {
    cart = await CartModel.findBySessionId(sessionId)
  }
  
  if (!cart) {
    throw new NotFoundError('Cart')
  }
  
  const updatedCart = await CartModel.updateItem(itemId, {
    quantity: Number(quantity)
  })
  
  res.json({
    success: true,
    data: updatedCart,
    message: 'Cart item updated successfully'
  })
})

export const removeFromCart = asyncHandler(async (req: Request, res: Response) => {
  const { itemId } = req.params
  
  const updatedCart = await CartModel.removeItem(itemId)
  
  res.json({
    success: true,
    data: updatedCart,
    message: 'Item removed from cart successfully'
  })
})

export const clearCart = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id
  const sessionId = req.headers['x-guest-session-id'] as string
  
  let cart
  if (userId) {
    cart = await CartModel.findByUserId(userId)
  } else if (sessionId) {
    cart = await CartModel.findBySessionId(sessionId)
  }
  
  if (!cart) {
    throw new NotFoundError('Cart')
  }
  
  await CartModel.clearCart(cart.id)
  
  res.json({
    success: true,
    message: 'Cart cleared successfully'
  })
})

export const applyCoupon = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id
  const sessionId = req.headers['x-guest-session-id'] as string
  const { couponCode } = req.body
  
  if (!couponCode) {
    throw new ValidationError('Coupon code is required')
  }
  
  let cart
  if (userId) {
    cart = await CartModel.findByUserId(userId)
  } else if (sessionId) {
    cart = await CartModel.findBySessionId(sessionId)
  }
  
  if (!cart) {
    throw new NotFoundError('Cart')
  }
  
  const updatedCart = await CartModel.applyCoupon(cart.id, couponCode)
  
  res.json({
    success: true,
    data: updatedCart,
    message: 'Coupon applied to cart successfully'
  })
})

export const removeCoupon = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id
  const sessionId = req.headers['x-guest-session-id'] as string
  
  let cart
  if (userId) {
    cart = await CartModel.findByUserId(userId)
  } else if (sessionId) {
    cart = await CartModel.findBySessionId(sessionId)
  }
  
  if (!cart) {
    throw new NotFoundError('Cart')
  }
  
  const updatedCart = await CartModel.removeCoupon(cart.id)
  
  res.json({
    success: true,
    data: updatedCart,
    message: 'Coupon removed from cart successfully'
  })
})

export const updateShippingInfo = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id
  const sessionId = req.headers['x-guest-session-id'] as string
  const { shippingAddress, shippingMethod } = req.body
  
  let cart
  if (userId) {
    cart = await CartModel.findByUserId(userId)
  } else if (sessionId) {
    cart = await CartModel.findBySessionId(sessionId)
  }
  
  if (!cart) {
    throw new NotFoundError('Cart')
  }
  
  const updatedCart = await CartModel.updateShippingInfo(cart.id, {
    shippingAddress,
    shippingMethod
  })
  
  res.json({
    success: true,
    data: updatedCart,
    message: 'Shipping information updated successfully'
  })
})

export const getCartSummary = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id
  const sessionId = req.headers['x-guest-session-id'] as string
  
  let cart
  if (userId) {
    cart = await CartModel.findByUserId(userId)
  } else if (sessionId) {
    cart = await CartModel.findBySessionId(sessionId)
  }
  
  if (!cart) {
    return res.json({
      success: true,
      data: {
        items: [],
        subtotal: 0,
        tax: 0,
        shipping: 0,
        discount: 0,
        total: 0
      }
    })
  }
  
  const summary = await CartModel.getCartSummary(cart.id)
  
  res.json({
    success: true,
    data: summary
  })
})
