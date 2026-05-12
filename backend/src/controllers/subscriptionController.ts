import { Request, Response, NextFunction } from 'express'
import { SubscriptionModel } from '../models'
import { asyncHandler, AppError, NotFoundError, ValidationError } from '../middleware'
import { validateBody } from '../middleware'
import { subscriptionCreateSchema, subscriptionUpdateSchema } from '../middleware/validationSchemas'

export const getSubscriptions = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 20, status, userId } = req.query
  
  const result = await SubscriptionModel.findAll({
    page: Number(page),
    limit: Number(limit),
    status: status as string,
    userId: userId as string
  })
  
  res.json({
    success: true,
    data: result.subscriptions,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: result.total,
      pages: Math.ceil(result.total / Number(limit))
    }
  })
})

export const getSubscription = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const subscription = await SubscriptionModel.findById(id)
  
  if (!subscription) {
    throw new NotFoundError('Subscription', id)
  }
  
  res.json({
    success: true,
    data: subscription
  })
})

export const getUserSubscription = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params
  const subscription = await SubscriptionModel.findByUserId(userId)
  
  if (!subscription) {
    return res.json({
      success: true,
      data: null,
      message: 'No active subscription found'
    })
  }
  
  res.json({
    success: true,
    data: subscription
  })
})

export const createSubscription = [
  validateBody(subscriptionCreateSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const subscriptionData = req.body
    const userId = (req as any).user?.id
    
    if (!userId) {
      throw new AppError('User authentication required', 401, 'UNAUTHORIZED')
    }
    
    // Check if user already has active subscription
    const existingSubscription = await SubscriptionModel.findByUserId(userId)
    if (existingSubscription && existingSubscription.status === 'ACTIVE') {
      throw new ValidationError('User already has an active subscription')
    }
    
    const subscription = await SubscriptionModel.create({
      ...subscriptionData,
      userId
    })
    
    res.status(201).json({
      success: true,
      data: subscription,
      message: 'Subscription created successfully'
    })
  })
]

export const updateSubscription = [
  validateBody(subscriptionUpdateSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const updateData = req.body
    
    const subscription = await SubscriptionModel.findById(id)
    if (!subscription) {
      throw new NotFoundError('Subscription', id)
    }
    
    const updatedSubscription = await SubscriptionModel.update(id, updateData)
    
    res.json({
      success: true,
      data: updatedSubscription,
      message: 'Subscription updated successfully'
    })
  })
]

export const cancelSubscription = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const { reason } = req.body
  
  const subscription = await SubscriptionModel.findById(id)
  if (!subscription) {
    throw new NotFoundError('Subscription', id)
  }
  
  const cancelledSubscription = await SubscriptionModel.cancel(id, reason)
  
  res.json({
    success: true,
    data: cancelledSubscription,
    message: 'Subscription cancelled successfully'
  })
})

export const pauseSubscription = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const { pauseUntil } = req.body
  
  const subscription = await SubscriptionModel.findById(id)
  if (!subscription) {
    throw new NotFoundError('Subscription', id)
  }
  
  if (subscription.status !== 'ACTIVE') {
    throw new ValidationError('Cannot pause subscription that is not active')
  }
  
  const pausedSubscription = await SubscriptionModel.pause(id, new Date(pauseUntil))
  
  res.json({
    success: true,
    data: pausedSubscription,
    message: 'Subscription paused successfully'
  })
})

export const resumeSubscription = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  
  const subscription = await SubscriptionModel.findById(id)
  if (!subscription) {
    throw new NotFoundError('Subscription', id)
  }
  
  if (subscription.status !== 'PAUSED') {
    throw new ValidationError('Cannot resume subscription that is not paused')
  }
  
  const resumedSubscription = await SubscriptionModel.resume(id)
  
  res.json({
    success: true,
    data: resumedSubscription,
    message: 'Subscription resumed successfully'
  })
})

export const createDelivery = asyncHandler(async (req: Request, res: Response) => {
  const { subscriptionId } = req.params
  const deliveryData = req.body
  
  const subscription = await SubscriptionModel.findById(subscriptionId)
  if (!subscription) {
    throw new NotFoundError('Subscription', subscriptionId)
  }
  
  if (subscription.status !== 'ACTIVE') {
    throw new ValidationError('Cannot create delivery for inactive subscription')
  }
  
  const delivery = await SubscriptionModel.createDelivery(subscriptionId, deliveryData)
  
  res.status(201).json({
    success: true,
    data: delivery,
    message: 'Delivery created successfully'
  })
})

export const updateDelivery = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const updateData = req.body
  
  const delivery = await SubscriptionModel.updateDelivery(id, updateData)
  
  res.json({
    success: true,
    data: delivery,
    message: 'Delivery updated successfully'
  })
})

export const markDeliveryDelivered = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const { trackingNumber } = req.body
  
  const deliveredDelivery = await SubscriptionModel.markDeliveryDelivered(id, trackingNumber)
  
  res.json({
    success: true,
    data: deliveredDelivery,
    message: 'Delivery marked as delivered'
  })
})

export const getSubscriptionStats = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query
  
  const stats = await SubscriptionModel.getSubscriptionStats({
    startDate: startDate ? new Date(startDate as string) : undefined,
    endDate: endDate ? new Date(endDate as string) : undefined
  })
  
  res.json({
    success: true,
    data: stats
  })
})
