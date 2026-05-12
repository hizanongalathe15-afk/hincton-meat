"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deliveryService = void 0;
// @ts-nocheck
const database_1 = require("../database");
const notificationService_1 = require("./notificationService");
class DeliveryService {
    async createDeliveryAssignment(assignmentData) {
        try {
            // Check if order exists and is ready for delivery
            const order = await database_1.prisma.order.findUnique({
                where: { id: assignmentData.orderId }
            });
            if (!order) {
                return {
                    success: false,
                    error: 'Order not found'
                };
            }
            if (order.status !== 'READY') {
                return {
                    success: false,
                    error: 'Order is not ready for delivery'
                };
            }
            // Check if courier exists and is available
            const courier = await database_1.prisma.user.findFirst({
                where: {
                    id: assignmentData.courierId,
                    roles: {
                        has: 'COURIER'
                    }
                }
            });
            if (!courier) {
                return {
                    success: false,
                    error: 'Courier not found or not authorized'
                };
            }
            // Create delivery assignment
            const delivery = await database_1.prisma.delivery.create({
                data: {
                    orderId: assignmentData.orderId,
                    courierId: assignmentData.courierId,
                    status: 'ASSIGNED',
                    assignedAt: new Date(),
                    estimatedDeliveryTime: assignmentData.estimatedDeliveryTime,
                    notes: assignmentData.notes
                }
            });
            // Update order status
            await database_1.prisma.order.update({
                where: { id: assignmentData.orderId },
                data: {
                    status: 'OUT_FOR_DELIVERY'
                }
            });
            // Send notification to courier
            await notificationService_1.notificationService.createNotification({
                userId: assignmentData.courierId,
                title: 'New Delivery Assignment',
                message: `You have been assigned a new delivery for order ${order.orderNumber}`,
                type: 'info',
                category: 'delivery',
                data: {
                    deliveryId: delivery.id,
                    orderId: assignmentData.orderId,
                    orderNumber: order.orderNumber
                }
            });
            return {
                success: true,
                delivery
            };
        }
        catch (error) {
            console.error('Delivery assignment error:', error);
            return {
                success: false,
                error: 'Failed to create delivery assignment'
            };
        }
    }
    async updateDeliveryStatus(updateData) {
        try {
            const delivery = await database_1.prisma.delivery.findUnique({
                where: { id: updateData.deliveryId },
                include: {
                    order: true,
                    courier: true
                }
            });
            if (!delivery) {
                return {
                    success: false,
                    error: 'Delivery not found'
                };
            }
            const updateFields = {
                status: updateData.status.toUpperCase()
            };
            // Add timestamp based on status
            switch (updateData.status) {
                case 'picked_up':
                    updateFields.pickedUpAt = new Date();
                    break;
                case 'in_transit':
                    updateFields.inTransitAt = new Date();
                    break;
                case 'delivered':
                    updateFields.deliveredAt = new Date();
                    break;
                case 'failed':
                    updateFields.failedAt = new Date();
                    break;
            }
            // Add location if provided
            if (updateData.location) {
                updateFields.currentLocation = updateData.location;
            }
            // Add notes if provided
            if (updateData.notes) {
                updateFields.notes = updateData.notes;
            }
            // Add proof of delivery if provided
            if (updateData.proofOfDelivery) {
                updateFields.proofOfDelivery = updateData.proofOfDelivery;
            }
            const updatedDelivery = await database_1.prisma.delivery.update({
                where: { id: updateData.deliveryId },
                data: updateFields
            });
            // Update order status based on delivery status
            if (delivery.order) {
                let orderStatus;
                switch (updateData.status) {
                    case 'assigned':
                        orderStatus = 'OUT_FOR_DELIVERY';
                        break;
                    case 'picked_up':
                        orderStatus = 'OUT_FOR_DELIVERY';
                        break;
                    case 'in_transit':
                        orderStatus = 'OUT_FOR_DELIVERY';
                        break;
                    case 'delivered':
                        orderStatus = 'DELIVERED';
                        break;
                    case 'failed':
                        orderStatus = 'DELIVERY_FAILED';
                        break;
                    default:
                        orderStatus = delivery.order.status;
                }
                await database_1.prisma.order.update({
                    where: { id: delivery.orderId },
                    data: {
                        status: orderStatus
                    }
                });
                // Send notification to customer
                if (delivery.order.userId && updateData.status === 'delivered') {
                    await notificationService_1.notificationService.createNotification({
                        userId: delivery.order.userId,
                        title: 'Order Delivered',
                        message: `Your order ${delivery.order.orderNumber} has been delivered successfully`,
                        type: 'success',
                        category: 'delivery',
                        data: {
                            orderId: delivery.orderId,
                            orderNumber: delivery.order.orderNumber
                        }
                    });
                }
            }
            return {
                success: true,
                delivery: updatedDelivery
            };
        }
        catch (error) {
            console.error('Delivery status update error:', error);
            return {
                success: false,
                error: 'Failed to update delivery status'
            };
        }
    }
    async getDeliveryHistory(courierId, page = 1, limit = 20, filters) {
        const skip = (page - 1) * limit;
        const where = { courierId };
        if (filters?.status) {
            where.status = filters.status.toUpperCase();
        }
        if (filters?.dateFrom || filters?.dateTo) {
            where.createdAt = {};
            if (filters.dateFrom) {
                where.createdAt.gte = filters.dateFrom;
            }
            if (filters.dateTo) {
                where.createdAt.lte = filters.dateTo;
            }
        }
        const [deliveries, total] = await Promise.all([
            database_1.prisma.delivery.findMany({
                where,
                include: {
                    order: {
                        select: {
                            id: true,
                            orderNumber: true,
                            totalAmount: true,
                            customerAddress: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            database_1.prisma.delivery.count({ where })
        ]);
        return {
            deliveries,
            total,
            page,
            pages: Math.ceil(total / limit)
        };
    }
    async getActiveDeliveries(courierId) {
        const where = {
            status: {
                in: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT']
            }
        };
        if (courierId) {
            where.courierId = courierId;
        }
        const deliveries = await database_1.prisma.delivery.findMany({
            where,
            include: {
                order: {
                    select: {
                        id: true,
                        orderNumber: true,
                        totalAmount: true,
                        customerAddress: true,
                        customerPhone: true
                    }
                },
                courier: {
                    select: {
                        id: true,
                        name: true,
                        phone: true
                    }
                }
            },
            orderBy: { assignedAt: 'asc' }
        });
        return {
            deliveries,
            total: deliveries.length
        };
    }
    async getDeliveryDetails(deliveryId, userId) {
        try {
            const where = { id: deliveryId };
            if (userId) {
                // If user is provided, only return deliveries for their orders
                const delivery = await database_1.prisma.delivery.findUnique({
                    where,
                    include: {
                        order: {
                            select: {
                                id: true,
                                orderNumber: true,
                                userId: true
                            }
                        }
                    }
                });
                if (delivery && delivery.order.userId !== userId) {
                    return {
                        error: 'Unauthorized to view this delivery'
                    };
                }
            }
            const delivery = await database_1.prisma.delivery.findUnique({
                where,
                include: {
                    order: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                    phone: true
                                }
                            },
                            orderItems: {
                                include: {
                                    product: true
                                }
                            }
                        }
                    },
                    courier: {
                        select: {
                            id: true,
                            name: true,
                            phone: true
                        }
                    }
                }
            });
            if (!delivery) {
                return {
                    error: 'Delivery not found'
                };
            }
            return {
                delivery
            };
        }
        catch (error) {
            console.error('Delivery details error:', error);
            return {
                error: 'Failed to get delivery details'
            };
        }
    }
    async optimizeDeliveryRoute(courierId) {
        try {
            // Get active deliveries for this courier
            const activeDeliveries = await this.getActiveDeliveries(courierId);
            if (activeDeliveries.deliveries.length === 0) {
                return {
                    error: 'No active deliveries found'
                };
            }
            // Simple route optimization (in production, use proper routing algorithm)
            const route = this.calculateOptimalRoute(activeDeliveries.deliveries);
            return {
                route
            };
        }
        catch (error) {
            console.error('Route optimization error:', error);
            return {
                error: 'Failed to optimize delivery route'
            };
        }
    }
    calculateOptimalRoute(deliveries) {
        // Simple nearest neighbor algorithm for route optimization
        // In production, use proper routing algorithms like Google OR-Tools
        const unvisited = [...deliveries];
        const route = {
            courierId: deliveries[0]?.courierId || '',
            orders: [],
            estimatedDuration: 0,
            totalDistance: 0
        };
        let currentLocation = { lat: 0, lng: 0 }; // Start from depot or courier location
        while (unvisited.length > 0) {
            // Find nearest delivery
            let nearestIndex = 0;
            let nearestDistance = Infinity;
            for (let i = 0; i < unvisited.length; i++) {
                const delivery = unvisited[i];
                const distance = this.calculateDistance(currentLocation, delivery.order.customerAddress.coordinates || { lat: 0, lng: 0 });
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestIndex = i;
                }
            }
            const nextDelivery = unvisited.splice(nearestIndex, 1)[0];
            route.orders.push({
                orderId: nextDelivery.order.id,
                orderNumber: nextDelivery.order.orderNumber,
                customerAddress: nextDelivery.order.customerAddress,
                customerCoordinates: nextDelivery.order.customerAddress.coordinates || { lat: 0, lng: 0 },
                priority: nextDelivery.order.totalAmount > 5000 ? 'urgent' : 'normal'
            });
            currentLocation = nextDelivery.order.customerAddress.coordinates || { lat: 0, lng: 0 };
            route.totalDistance += nearestDistance;
        }
        // Estimate duration (5 minutes per delivery + 2 minutes per km)
        route.estimatedDuration = route.orders.length * 5 + (route.totalDistance * 2);
        return route;
    }
    calculateDistance(point1, point2) {
        // Haversine formula for calculating distance between two points
        const R = 6371; // Earth's radius in km
        const dLat = this.toRadians(point2.lat - point1.lat);
        const dLon = this.toRadians(point2.lng - point1.lng);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRadians(point1.lat)) * Math.cos(this.toRadians(point2.lat)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }
    async getDeliveryStats(dateRange) {
        try {
            const where = dateRange ? {
                createdAt: {
                    gte: dateRange.from,
                    lte: dateRange.to
                }
            } : {};
            const [totalDeliveries, statusData, courierData, timeData] = await Promise.all([
                database_1.prisma.delivery.count({ where }),
                database_1.prisma.delivery.groupBy({
                    by: ['status'],
                    where,
                    _count: { id: true }
                }),
                database_1.prisma.delivery.groupBy({
                    by: ['courierId'],
                    where,
                    _count: { id: true }
                }),
                database_1.prisma.delivery.findMany({
                    where: { ...where, status: 'DELIVERED' },
                    select: {
                        assignedAt: true,
                        deliveredAt: true
                    }
                })
            ]);
            const successfulDeliveries = statusData.find(s => s.status === 'DELIVERED')?._count.id || 0;
            const failedDeliveries = statusData.find(s => s.status === 'FAILED')?._count.id || 0;
            // Calculate average delivery time
            const deliveryTimes = timeData.map(d => new Date(d.deliveredAt).getTime() - new Date(d.assignedAt).getTime());
            const averageDeliveryTime = deliveryTimes.length > 0
                ? deliveryTimes.reduce((sum, time) => sum + time, 0) / deliveryTimes.length
                : 0;
            const onTimeDeliveryRate = totalDeliveries > 0 ? (successfulDeliveries / totalDeliveries) * 100 : 0;
            // Get courier details
            const courierIds = courierData.map(c => c.courierId);
            const couriers = await database_1.prisma.user.findMany({
                where: { id: { in: courierIds } },
                select: { id: true, name: true }
            });
            const courierMap = couriers.reduce((acc, courier) => {
                acc[courier.id] = courier.name;
                return acc;
            }, {});
            const deliveriesByCourier = courierData.map(courier => ({
                courierId: courier.courierId,
                courierName: courierMap[courier.courierId] || 'Unknown',
                deliveries: courier._count.id,
                successRate: courier._count.id > 0 ? (successfulDeliveries / courier._count.id) * 100 : 0,
                averageTime: 0 // Would need per-courier time calculation
            }));
            return {
                totalDeliveries,
                successfulDeliveries,
                failedDeliveries,
                averageDeliveryTime: Math.round(averageDeliveryTime / (1000 * 60)), // Convert to minutes
                onTimeDeliveryRate: Math.round(onTimeDeliveryRate * 100) / 100,
                deliveriesByCourier
            };
        }
        catch (error) {
            console.error('Delivery stats error:', error);
            return {
                totalDeliveries: 0,
                successfulDeliveries: 0,
                failedDeliveries: 0,
                averageDeliveryTime: 0,
                onTimeDeliveryRate: 0,
                deliveriesByCourier: []
            };
        }
    }
    async getAvailableCouriers() {
        try {
            const couriers = await database_1.prisma.user.findMany({
                where: {
                    roles: {
                        has: 'COURIER'
                    }
                },
                select: {
                    id: true,
                    name: true,
                    phone: true
                }
            });
            // Get current delivery counts for each courier
            const courierIds = couriers.map(c => c.id);
            const activeDeliveries = await database_1.prisma.delivery.groupBy({
                by: ['courierId'],
                where: {
                    courierId: { in: courierIds },
                    status: {
                        in: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT']
                    }
                },
                _count: { id: true }
            });
            const deliveryCountMap = activeDeliveries.reduce((acc, item) => {
                acc[item.courierId] = item._count.id;
                return acc;
            }, {});
            return couriers.map(courier => ({
                id: courier.id,
                name: courier.name,
                phone: courier.phone,
                currentDeliveries: deliveryCountMap[courier.id] || 0,
                rating: 0 // Would need rating system
            }));
        }
        catch (error) {
            console.error('Available couriers error:', error);
            return [];
        }
    }
}
exports.deliveryService = new DeliveryService();
exports.default = exports.deliveryService;
//# sourceMappingURL=deliveryService.js.map