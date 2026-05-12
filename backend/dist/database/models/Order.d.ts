export interface IOrder {
    id: string;
    userId: string;
    items: any[];
    totalAmount: number;
    status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
    paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
    paymentMethod: string;
    paymentId?: string;
    deliveryAddress: string;
    deliveryFee: number;
    estimatedDeliveryTime: Date;
    actualDeliveryTime?: Date;
    specialInstructions?: string;
    orderNotes?: string;
    refundAmount?: number;
    refundStatus?: 'PROCESSING' | 'COMPLETED' | 'FAILED';
    createdAt: Date;
    updatedAt: Date;
}
export declare const OrderModel: {
    findById: (id: string) => Promise<IOrder | null>;
    findByUserId: (userId: string) => Promise<IOrder[]>;
    findAll: (filters?: any) => Promise<IOrder[]>;
    create: (orderData: Omit<IOrder, "id" | "createdAt" | "updatedAt">) => Promise<IOrder>;
    update: (id: string, orderData: Partial<IOrder>) => Promise<IOrder>;
    delete: (id: string) => Promise<void>;
};
//# sourceMappingURL=Order.d.ts.map