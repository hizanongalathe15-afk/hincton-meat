import { Response, NextFunction } from 'express'
import { OrderModel } from '../models/Order'
import { AuthRequest } from '../middleware/auth'

// DeliveryModel isn't available in this Prisma-based model layer.
const DeliveryModel: any = undefined



/**
 * NOTE:
 * This repo is Prisma-based (OrderModel/ProductModel/etc.).
 * The previous deliveryController was written for a Mongoose-style model layer
 * (Delivery.find/populate/_id/new Delivery(...)), which doesn't exist here.
 *
 * This file provides Prisma-compatible stubs to unblock TypeScript compilation.
 */

export const createDelivery = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { orderId, deliveryPersonId, estimatedArrivalTime } = req.body

    // If DeliveryModel exists in your Prisma layer, use it; otherwise return a stubbed response.
    if (DeliveryModel?.create) {
      const delivery = await DeliveryModel.create({
        orderId,
        deliveryPersonId,
        estimatedArrivalTime
      })
      return res.status(201).json({ message: 'Delivery created successfully', delivery })
    }

    return res.status(501).json({ message: 'Delivery not implemented in current Prisma layer' })
  } catch (error) {
    next(error)
  }
}

export const updateDeliveryStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body

    if (DeliveryModel?.updateStatus) {
      const delivery = await DeliveryModel.updateStatus(req.params.id, status)
      return res.json({ message: 'Delivery status updated successfully', delivery })
    }

    return res.status(501).json({ message: 'Delivery update not implemented in current Prisma layer' })
  } catch (error) {
    next(error)
  }
}

export const updateLocation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { lat, lng } = req.body

    if (DeliveryModel?.updateLocation) {
      const delivery = await DeliveryModel.updateLocation(req.params.id, { lat, lng })
      return res.json({ message: 'Location updated successfully', delivery })
    }

    return res.status(501).json({ message: 'Delivery location update not implemented in current Prisma layer' })
  } catch (error) {
    next(error)
  }
}

export const getDeliveries = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, page = 1, limit = 10 } = req.query as any

    if (DeliveryModel?.findMany) {
      const deliveries = await DeliveryModel.findMany({ status, page: Number(page), limit: Number(limit) })
      return res.json(deliveries)
    }

    return res.json({ deliveries: [], pagination: { page: Number(page), limit: Number(limit), total: 0, pages: 0 } })
  } catch (error) {
    next(error)
  }
}

export const getDeliveryById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (DeliveryModel?.findById) {
      const delivery = await DeliveryModel.findById(req.params.id)
      if (!delivery) return res.status(404).json({ message: 'Delivery not found' })
      return res.json({ delivery })
    }

    return res.status(404).json({ message: 'Delivery not found' })
  } catch (error) {
    next(error)
  }
}

export const addCustomerRating = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { rating, comment } = req.body

    if (DeliveryModel?.addCustomerRating) {
      const delivery = await DeliveryModel.addCustomerRating(req.params.id, { rating, comment })
      return res.json({ message: 'Customer rating added successfully', delivery })
    }

    return res.status(501).json({ message: 'Customer rating not implemented in current Prisma layer' })
  } catch (error) {
    next(error)
  }
}

