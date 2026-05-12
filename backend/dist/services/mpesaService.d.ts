export interface MpesaPaymentData {
    phoneNumber: string;
    amount: number;
    orderId: string;
    accountReference?: string;
    transactionDesc?: string;
}
export interface MpesaResult {
    success: boolean;
    transactionId?: string;
    message: string;
    data?: any;
}
export interface MpesaTransactionStatus {
    success: boolean;
    status: string;
    transactionId?: string;
    amount?: number;
    message: string;
    data?: any;
}
declare class MpesaService {
    private baseUrl;
    private consumerKey;
    private consumerSecret;
    private passKey;
    private shortCode;
    private callbackUrl;
    private accessToken;
    private tokenExpiry;
    constructor();
    private getAccessToken;
    private generatePassword;
    private formatPhoneNumber;
    initiatePayment(paymentData: MpesaPaymentData): Promise<MpesaResult>;
    checkTransactionStatus(checkoutRequestID: string): Promise<MpesaTransactionStatus>;
    processCallback(callbackData: any): Promise<void>;
    getTransactionHistory(page?: number, limit?: number, filters?: {
        status?: string;
        dateFrom?: Date;
        dateTo?: Date;
        phoneNumber?: string;
    }): Promise<{
        transactions: any[];
        total: number;
        page: number;
        pages: number;
    }>;
    getTransactionStats(dateRange?: {
        from: Date;
        to: Date;
    }): Promise<{
        totalTransactions: number;
        successfulTransactions: number;
        failedTransactions: number;
        totalAmount: number;
        successRate: number;
    }>;
    reverseTransaction(transactionId: string, reason: string): Promise<MpesaResult>;
    validatePhoneNumber(phoneNumber: string): boolean;
    getPaymentLimits(): {
        minAmount: number;
        maxAmount: number;
        dailyLimit: number;
    };
}
export declare const mpesaService: MpesaService;
export default mpesaService;
//# sourceMappingURL=mpesaService.d.ts.map