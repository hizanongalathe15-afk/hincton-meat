export interface ITransaction {
    id: string;
    orderId: string;
    userId?: string;
    amount: number | string;
    currency: string;
    paymentMethod: string;
    paymentReference?: string;
    status: string;
    metadata?: any;
    errorMessage?: string;
    mpesaReceipt?: string;
    mpesaPhone?: string;
    mpesaTransactionDate?: Date;
    createdAt: Date;
    completedAt?: Date;
    order?: {
        id: string;
        orderNumber: string;
        status: string;
        totalAmount: number | string;
    };
    user?: {
        id: string;
        email: string;
        profile?: {
            fullName?: string;
        };
    };
}
export interface ICreateTransaction {
    orderId: string;
    userId?: string;
    amount: number | string;
    currency?: string;
    paymentMethod: string;
    paymentReference?: string;
    mpesaPhone?: string;
    metadata?: any;
}
export interface IUpdateTransaction {
    status?: string;
    paymentReference?: string;
    errorMessage?: string;
    metadata?: any;
    mpesaReceipt?: string;
    mpesaPhone?: string;
    mpesaTransactionDate?: Date;
    completedAt?: Date;
}
export declare const TransactionModel: {
    create: (data: ICreateTransaction) => Promise<ITransaction>;
    findById: (id: string) => Promise<ITransaction | null>;
    findByOrderId: (orderId: string) => Promise<ITransaction[]>;
    findByTransactionId: (transactionId: string) => Promise<ITransaction | null>;
    update: (id: string, data: IUpdateTransaction) => Promise<ITransaction | null>;
    findAll: (query?: any) => Promise<ITransaction[]>;
};
//# sourceMappingURL=Transaction.d.ts.map