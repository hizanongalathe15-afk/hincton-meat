export interface PaymentData {
    orderId: string;
    userId: string;
    amount: number;
    currency: string;
    paymentMethod: 'mpesa' | 'card' | 'cash';
    paymentDetails: {
        phoneNumber?: string;
        cardNumber?: string;
        transactionId?: string;
        reference?: string;
    };
}
export interface PaymentResult {
    success: boolean;
    transactionId?: string;
    status: PaymentStatus;
    message: string;
    data?: any;
}
export interface RefundData {
    paymentId: string;
    amount?: number;
    reason: string;
    processedBy: string;
}
declare class PaymentService {
    createPayment(paymentData: PaymentData): Promise<PaymentResult>;
    private processMpesaPayment;
    private processCardPayment;
    private processCashPayment;
    verifyPayment(transactionId: string): Promise<PaymentResult>;
    processRefund(refundData: RefundData): Promise<PaymentResult>;
    private processMpesaRefund;
    private processCardRefund;
    private sendPaymentConfirmationEmail;
    getPaymentHistory(userId: string, page?: number, limit?: number): Promise<{
        payments: any[];
        total: number;
        page: number;
        pages: number;
    }>;
    getPaymentStats(dateRange?: {
        from: Date;
        to: Date;
    }): Promise<{
        totalRevenue: number;
        totalTransactions: number;
        successfulTransactions: number;
        failedTransactions: number;
        refunds: number;
        refundAmount: number;
    }>;
}
export declare const paymentService: PaymentService;
export default paymentService;
//# sourceMappingURL=paymentService.d.ts.map