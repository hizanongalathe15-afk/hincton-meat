import { PaymentStatus, Currency } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
export interface IPayment {
    id: string;
    orderId: string;
    userId?: string;
    amount: Decimal | string | number;
    currency: Currency;
    paymentMethod: string;
    paymentReference?: string;
    status: PaymentStatus;
    metadata?: any;
    errorMessage?: string;
    mpesaReceipt?: string;
    mpesaPhone?: string;
    mpesaTransactionDate?: Date;
    createdAt: Date;
    completedAt?: Date;
    order?: any;
    user?: any;
    refunds?: any[];
}
export declare const PaymentModel: {
    findById: (id: string) => Promise<IPayment | null>;
    findByOrderId: (orderId: string) => Promise<IPayment[]>;
    findByUserId: (userId: string, params?: {
        page?: number;
        limit?: number;
        status?: PaymentStatus;
    }) => Promise<{
        payments: IPayment[];
        total: number;
    }>;
    create: (data: Omit<IPayment, "id" | "createdAt" | "completedAt" | "order" | "user" | "refunds">) => Promise<IPayment>;
    update: (id: string, data: Partial<Omit<IPayment, "id" | "createdAt" | "completedAt" | "order" | "user" | "refunds">>) => Promise<IPayment>;
    updateStatus: (id: string, status: PaymentStatus, metadata?: any) => Promise<IPayment>;
    completePayment: (id: string, paymentReference?: string, metadata?: any) => Promise<IPayment>;
    failPayment: (id: string, errorMessage: string, metadata?: any) => Promise<IPayment>;
    getPaymentStats: (params?: {
        startDate?: Date;
        endDate?: Date;
    }) => Promise<any>;
    getMpesaPayments: (params?: {
        page?: number;
        limit?: number;
        startDate?: Date;
        endDate?: Date;
    }) => Promise<{
        payments: IPayment[];
        total: number;
    }>;
};
//# sourceMappingURL=Payment.d.ts.map