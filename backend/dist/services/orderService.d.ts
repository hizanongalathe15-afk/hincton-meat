export interface OrderItem {
    productId: string;
    quantity: number;
    price: number;
    weight: number;
    unit: 'kg' | 'g' | 'lbs';
}
export interface CreateOrderData {
    userId: string;
    items: OrderItem[];
    deliveryAddress: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country?: string;
        coordinates?: {
            lat: number;
            lng: number;
        };
    };
    paymentMethod: 'mpesa' | 'card' | 'cash';
    deliveryOption: 'standard' | 'express';
    specialInstructions?: string;
    orderNotes?: string;
    couponCode?: string;
}
export interface OrderUpdateData {
    status?: string;
    paymentStatus?: string;
    trackingNumber?: string;
    courier?: string;
    estimatedDelivery?: string;
    actualDelivery?: string;
    notes?: string;
}
declare class OrderService {
    createOrder(orderData: CreateOrderData): Promise<{
        success: boolean;
        order?: any;
        error?: string;
    }>;
    updateOrder(orderId: string, updateData: OrderUpdateData): Promise<{
        success: boolean;
        order?: any;
        error?: string;
    }>;
    cancelOrder(orderId: string, reason: string, userId: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    getUserOrders(userId: string, page?: number, limit?: number, filters?: {
        status?: string;
        dateFrom?: Date;
        dateTo?: Date;
    }): Promise<{
        orders: any[];
        total: number;
        page: number;
        pages: number;
    }>;
    getOrderDetails(orderId: string, userId?: string): Promise<{
        order?: any;
        error?: string;
    }>;
    getAllOrders(page?: number, limit?: number, filters?: {
        status?: string;
        paymentStatus?: string;
        dateFrom?: Date;
        dateTo?: Date;
        userId?: string;
    }): Promise<{
        orders: any[];
        total: number;
        page: number;
        pages: number;
    }>;
    private validateStockAvailability;
    private calculateOrderTotals;
    private applyCoupon;
    private generateOrderNumber;
    private calculateEstimatedDelivery;
    private updateStockAfterOrder;
    private sendStatusUpdateEmail;
    getOrderStats(dateRange?: {
        from: Date;
        to: Date;
    }): Promise<{
        totalOrders: number;
        totalRevenue: number;
        averageOrderValue: number;
        ordersByStatus: Record<string, number>;
        ordersByPaymentMethod: Record<string, number>;
    }>;
}
export declare const orderService: OrderService;
export default orderService;
//# sourceMappingURL=orderService.d.ts.map