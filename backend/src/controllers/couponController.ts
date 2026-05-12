import { Request, Response, NextFunction } from 'express'
import { CouponModel } from '../models'
import { asyncHandler, AppError, NotFoundError, ValidationError } from '../middleware'
import { validateBody } from '../middleware'
import { couponCreateSchema, couponUpdateSchema } from '../middleware/validationSchemas'

export const getCoupons = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 20, isActive, search } = req.query
  
  const result = await CouponModel.findAll({
    page: Number(page),
    limit: Number(limit),
    isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    search: search as string
  })
  
  res.json({
    success: true,
    data: result.coupons,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: result.total,
      pages: Math.ceil(result.total / Number(limit))
    }
  })
})

export const getCoupon = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const coupon = await CouponModel.findById(id)
  
  if (!coupon) {
    throw new NotFoundError('Coupon', id)
  }
  
  res.json({
    success: true,
    data: coupon
  })
})

export const getCouponByCode = asyncHandler(async (req: Request, res: Response) => {
  const { code } = req.params
  const coupon = await CouponModel.findByCode(code)
  
  if (!coupon) {
    throw new NotFoundError('Coupon', code)
  }
  
  res.json({
    success: true,
    data: coupon
  })
})

export const getActiveCoupons = asyncHandler(async (req: Request, res: Response) => {
  const coupons = await CouponModel.getActiveCoupons()
  
  res.json({
    success: true,
    data: coupons
  })
})

export const createCoupon = [
  validateBody(couponCreateSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const couponData = req.body
    
    // Check if coupon with same code exists
    const existingCoupon = await CouponModel.findByCode(couponData.code)
    if (existingCoupon) {
      throw new ValidationError('Coupon with this code already exists')
    }
    
    const coupon = await CouponModel.create(couponData)
    
    res.status(201).json({
      success: true,
      data: coupon,
      message: 'Coupon created successfully'
    })
  })
]

export const updateCoupon = [
  validateBody(couponUpdateSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const updateData = req.body
    
    const coupon = await CouponModel.findById(id)
    if (!coupon) {
      throw new NotFoundError('Coupon', id)
    }
    
    // If code is being updated, check for uniqueness
    if (updateData.code && updateData.code !== coupon.code) {
      const codeExists = await CouponModel.findByCode(updateData.code)
      if (codeExists) {
        throw new ValidationError('Coupon with this code already exists')
      }
    }
    
    const updatedCoupon = await CouponModel.update(id, updateData)
    
    res.json({
      success: true,
      data: updatedCoupon,
      message: 'Coupon updated successfully'
    })
  })
]

export const deleteCoupon = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  
  const coupon = await CouponModel.findById(id)
  if (!coupon) {
    throw new NotFoundError('Coupon', id)
  }
  
  await CouponModel.delete(id)
  
  res.json({
    success: true,
    message: 'Coupon deleted successfully'
  })
})

export const validateCoupon = asyncHandler(async (req: Request, res: Response) => {
  const { code, userId, cartTotal } = req.body
  
  if (!code) {
    throw new ValidationError('Coupon code is required')
  }
  
  const validation = await CouponModel.validateCoupon(
    code,
    userId,
    cartTotal ? Number(cartTotal) : undefined
  )
  
  res.json({
    success: true,
    data: validation
  })
})

export const applyCoupon = asyncHandler(async (req: Request, res: Response) => {
  const { code, userId, cartTotal } = req.body
  
  if (!code) {
    throw new ValidationError('Coupon code is required')
  }
  
  const validation = await CouponModel.validateCoupon(
    code,
    userId,
    cartTotal ? Number(cartTotal) : undefined
  )
  
  if (!validation.valid) {
    throw new ValidationError(validation.error || 'Invalid coupon')
  }
  
  // Increment usage count
  if (validation.coupon) {
    await CouponModel.incrementUsage(validation.coupon.id)
  }
  
  res.json({
    success: true,
    data: {
      valid: true,
      coupon: validation.coupon,
      discount: calculateDiscount(validation.coupon, cartTotal ? Number(cartTotal) : 0)
    },
    message: 'Coupon applied successfully'
  })
})

export const getCouponStats = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query
  
  const stats = await CouponModel.getCouponStats({
    startDate: startDate ? new Date(startDate as string) : undefined,
    endDate: endDate ? new Date(endDate as string) : undefined
  })
  
  res.json({
    success: true,
    data: stats
  })
})

function calculateDiscount(coupon: any, cartTotal: number): number {
  if (coupon.discountType === 'percentage') {
    return cartTotal * (Number(coupon.discountValue) / 100)
  } else if (coupon.discountType === 'fixed') {
    return Number(coupon.discountValue)
  }
  return 0
}
