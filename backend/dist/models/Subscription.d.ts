import { Decimal } from '@prisma/client/runtime/library';
export interface ISubscription {
    id: string;
    userId: string;
    planId?: string;
    plan: string;
    status: string;
    startDate: Date;
    endDate?: Date;
    trialEndsAt?: Date;
    autoRenew: boolean;
    paymentMethod?: string;
    lastPaymentDate?: Date;
    nextPaymentDate?: Date;
    cancelledAt?: Date;
    cancelReason?: string;
    deliveryFrequency?: string;
    deliveryAddress?: string;
    deliveryInstructions?: string;
    nextDeliveryDate?: Date;
    pauseUntil?: Date;
    customizations?: any;
    cancellationReason?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
    user?: any;
    deliveries?: ISubscriptionDelivery[];
    payments?: ISubscriptionPayment[];
}
export interface ISubscriptionDelivery {
    id: string;
    subscriptionId: string;
    scheduledDate: Date;
    deliveredDate?: Date;
    status: string;
    address?: string;
    instructions?: string;
    trackingNumber?: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    items?: ISubscriptionDeliveryItem[];
}
export interface ISubscriptionDeliveryItem {
    id: string;
    deliveryId: string;
    productId: string;
    quantity: number;
    notes?: string;
    createdAt: Date;
    product?: any;
}
export interface ISubscriptionPayment {
    id: string;
    subscriptionId: string;
    amount: Decimal | string | number;
    status: string;
    paymentId?: string;
    period: string;
    periodStart: Date;
    periodEnd: Date;
    invoiceUrl?: string;
    createdAt: Date;
}
export declare const SubscriptionModel: {
    findById: (id: string) => Promise<ISubscription | null>;
    findByUserId: (userId: string) => Promise<ISubscription | null>;
    findAll: (params?: {
        page?: number;
        limit?: number;
        status?: string;
        userId?: string;
    }) => Promise<{
        subscriptions: ISubscription[];
        total: number;
    }>;
    create: (data: Omit<ISubscription, "id" | "createdAt" | "updatedAt" | "deletedAt" | "user" | "deliveries" | "payments">) => Promise<ISubscription>;
    update: (id: string, data: Partial<Omit<ISubscription, "id" | "createdAt" | "updatedAt" | "deletedAt" | "user" | "deliveries" | "payments">>) => Promise<ISubscription>;
    cancel: (id: string, reason?: string) => Promise<ISubscription>;
    pause: (id: string, pauseUntil: Date) => Promise<ISubscription>;
    resume: (id: string) => Promise<ISubscription>;
    createDelivery: (subscriptionId: string, deliveryData: Omit<ISubscriptionDelivery, "id" | "subscriptionId" | "createdAt" | "updatedAt" | "items">) => Promise<ISubscriptionDelivery>;
    updateDelivery: (id: string, data: Partial<Omit<ISubscriptionDelivery, "id" | "subscriptionId" | "createdAt" | "updatedAt" | "items">>) => Promise<ISubscriptionDelivery>;
    markDeliveryDelivered: (id: string, trackingNumber?: string) => Promise<ISubscriptionDelivery>;
    getSubscriptionStats: (params?: {
        startDate?: Date;
        endDate?: Date;
    }) => Promise<any>;
};
//# sourceMappingURL=Subscription.d.ts.map