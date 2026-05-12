"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addCustomerRating = exports.getDeliveryById = exports.getDeliveries = exports.updateLocation = exports.updateDeliveryStatus = exports.createDelivery = void 0;
// DeliveryModel isn't available in this Prisma-based model layer.
const DeliveryModel = undefined;
/**
 * NOTE:
 * This repo is Prisma-based (OrderModel/ProductModel/etc.).
 * The previous deliveryController was written for a Mongoose-style model layer
 * (Delivery.find/populate/_id/new Delivery(...)), which doesn't exist here.
 *
 * This file provides Prisma-compatible stubs to unblock TypeScript compilation.
 */
const createDelivery = async (req, res, next) => {
    try {
        const { orderId, deliveryPersonId, estimatedArrivalTime } = req.body;
        // If DeliveryModel exists in your Prisma layer, use it; otherwise return a stubbed response.
        if (DeliveryModel?.create) {
            const delivery = await DeliveryModel.create({
                orderId,
                deliveryPersonId,
                estimatedArrivalTime
            });
            return res.status(201).json({ message: 'Delivery created successfully', delivery });
        }
        return res.status(501).json({ message: 'Delivery not implemented in current Prisma layer' });
    }
    catch (error) {
        next(error);
    }
};
exports.createDelivery = createDelivery;
const updateDeliveryStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        if (DeliveryModel?.updateStatus) {
            const delivery = await DeliveryModel.updateStatus(req.params.id, status);
            return res.json({ message: 'Delivery status updated successfully', delivery });
        }
        return res.status(501).json({ message: 'Delivery update not implemented in current Prisma layer' });
    }
    catch (error) {
        next(error);
    }
};
exports.updateDeliveryStatus = updateDeliveryStatus;
const updateLocation = async (req, res, next) => {
    try {
        const { lat, lng } = req.body;
        if (DeliveryModel?.updateLocation) {
            const delivery = await DeliveryModel.updateLocation(req.params.id, { lat, lng });
            return res.json({ message: 'Location updated successfully', delivery });
        }
        return res.status(501).json({ message: 'Delivery location update not implemented in current Prisma layer' });
    }
    catch (error) {
        next(error);
    }
};
exports.updateLocation = updateLocation;
const getDeliveries = async (req, res, next) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        if (DeliveryModel?.findMany) {
            const deliveries = await DeliveryModel.findMany({ status, page: Number(page), limit: Number(limit) });
            return res.json(deliveries);
        }
        return res.json({ deliveries: [], pagination: { page: Number(page), limit: Number(limit), total: 0, pages: 0 } });
    }
    catch (error) {
        next(error);
    }
};
exports.getDeliveries = getDeliveries;
const getDeliveryById = async (req, res, next) => {
    try {
        if (DeliveryModel?.findById) {
            const delivery = await DeliveryModel.findById(req.params.id);
            if (!delivery)
                return res.status(404).json({ message: 'Delivery not found' });
            return res.json({ delivery });
        }
        return res.status(404).json({ message: 'Delivery not found' });
    }
    catch (error) {
        next(error);
    }
};
exports.getDeliveryById = getDeliveryById;
const addCustomerRating = async (req, res, next) => {
    try {
        const { rating, comment } = req.body;
        if (DeliveryModel?.addCustomerRating) {
            const delivery = await DeliveryModel.addCustomerRating(req.params.id, { rating, comment });
            return res.json({ message: 'Customer rating added successfully', delivery });
        }
        return res.status(501).json({ message: 'Customer rating not implemented in current Prisma layer' });
    }
    catch (error) {
        next(error);
    }
};
exports.addCustomerRating = addCustomerRating;
//# sourceMappingURL=deliveryController.js.map