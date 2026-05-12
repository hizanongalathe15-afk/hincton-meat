export interface DeliveryAssignmentData {
    orderId: string;
    courierId: string;
    estimatedDeliveryTime: string;
    notes?: string;
}
export interface DeliveryUpdateData {
    deliveryId: string;
    status: 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'failed';
    location?: {
        lat: number;
        lng: number;
        address: string;
    };
    notes?: string;
    proofOfDelivery?: {
        signature?: string;
        photo?: string;
        timestamp: string;
    };
}
export interface DeliveryRoute {
    courierId: string;
    orders: Array<{
        orderId: string;
        orderNumber: string;
        customerAddress: string;
        customerCoordinates: {
            lat: number;
            lng: number;
        };
        priority: 'normal' | 'urgent' | 'express';
    }>;
    estimatedDuration: number;
    totalDistance: number;
}
declare class DeliveryService {
    createDeliveryAssignment(assignmentData: DeliveryAssignmentData): Promise<{
        success: boolean;
        delivery?: any;
        error?: string;
    }>;
    updateDeliveryStatus(updateData: DeliveryUpdateData): Promise<{
        success: boolean;
        delivery?: any;
        error?: string;
    }>;
    getDeliveryHistory(courierId: string, page?: number, limit?: number, filters?: {
        status?: string;
        dateFrom?: Date;
        dateTo?: Date;
    }): Promise<{
        deliveries: any[];
        total: number;
        page: number;
        pages: number;
    }>;
    getActiveDeliveries(courierId?: string): Promise<{
        deliveries: any[];
        total: number;
    }>;
    getDeliveryDetails(deliveryId: string, userId?: string): Promise<{
        delivery?: any;
        error?: string;
    }>;
    optimizeDeliveryRoute(courierId: string): Promise<{
        route?: DeliveryRoute;
        error?: string;
    }>;
    private calculateOptimalRoute;
    private calculateDistance;
    private toRadians;
    getDeliveryStats(dateRange?: {
        from: Date;
        to: Date;
    }): Promise<{
        totalDeliveries: number;
        successfulDeliveries: number;
        failedDeliveries: number;
        averageDeliveryTime: number;
        onTimeDeliveryRate: number;
        deliveriesByCourier: Array<{
            courierId: string;
            courierName: string;
            deliveries: number;
            successRate: number;
            averageTime: number;
        }>;
    }>;
    getAvailableCouriers(): Promise<Array<{
        id: string;
        name: string;
        phone: string;
        currentDeliveries: number;
        rating: number;
    }>>;
}
export declare const deliveryService: DeliveryService;
export default deliveryService;
//# sourceMappingURL=deliveryService.d.ts.map