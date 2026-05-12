import { OrderStatus, PaymentStatus, DeliveryStatus, VerificationMethod, Currency } from '@prisma/client';
export interface IOrder {
    id: string;
    orderNumber: string;
    userId?: string;
    guestEmail?: string;
    guestPhone?: string;
    guestSessionId?: string;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    deliveryStatus: DeliveryStatus;
    subtotal: number | string;
    shippingCost: number | string;
    taxAmount: number | string;
    discountAmount: number | string;
    totalAmount: number | string;
    currency: Currency;
    couponCode?: string;
    couponDiscount: number | string;
    shippingAddress: any;
    billingAddress?: any;
    shippingMethod?: string;
    trackingNumber?: string;
    courier?: string;
    trackingUrl?: string;
    pickupStationId?: string;
    pickupCode?: string;
    pickupCodeExpiresAt?: Date;
    qrSecret?: string;
    qrSecretExpiresAt?: Date;
    verificationMethod: VerificationMethod;
    idVerified: boolean;
    idLast4?: string;
    pickedAt?: Date;
    pickedByAgentId?: string;
    verificationAttempts: number;
    failedVerificationAttempts: number;
    lockedUntil?: Date;
    estimatedDelivery?: Date;
    deliveredAt?: Date;
    notes?: string;
    adminNotes?: string;
    ipAddress?: string;
    userAgent?: string;
    createdAt: Date;
    updatedAt: Date;
    cancelledAt?: Date;
    refundedAt?: Date;
    deletedAt?: Date;
    orderItems?: {
        id: string;
        orderId: string;
        productId?: string;
        variantId?: string;
        productName: string;
        productImage?: string;
        sku?: string;
        quantity: number;
        unitPrice: number | string;
        totalPrice: number | string;
        discount: number | string;
        taxAmount: number | string;
        isDigital: boolean;
        downloadUrl?: string;
        createdAt: Date;
    }[];
    user?: {
        id: string;
        email: string;
        profile?: {
            fullName?: string;
        };
    };
    payments?: {
        id: string;
        amount: number | string;
        paymentMethod: string;
        paymentReference?: string;
        status: PaymentStatus;
        createdAt: Date;
    }[];
}
export declare const OrderModel: {
    findById: (id: string) => Promise<IOrder | null>;
    findByUserId: (userId: string) => Promise<IOrder[]>;
    findAll: (filters?: any) => Promise<IOrder[]>;
    create: (orderData: Omit<IOrder, "id" | "createdAt" | "updatedAt">) => Promise<IOrder>;
    update: (id: string, orderData: Partial<IOrder>) => Promise<IOrder>;
    getOrderStats: (params?: {
        startDate?: Date;
        endDate?: Date;
    }) => Promise<{
        totalOrders: number;
        totalRevenue: number;
        ordersByStatus: Array<{
            status: string;
            count: number;
        }>;
    }>;
    getSalesByMonth: () => Promise<{
        monthlyData: Array<{
            month: string;
            revenue: number;
            orders: number;
        }>;
    }>;
    delete: (id: string) => Promise<void>;
};
//# sourceMappingURL=Order.d.ts.map