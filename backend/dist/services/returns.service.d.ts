import { ReturnStatus } from '@prisma/client';
export declare const returnsService: {
    getReturnDetails(id: string): Promise<any>;
    createReturnRequest(userId: string, data: {
        orderId: string;
        items: Array<{
            orderItemId: string;
            quantity: number;
            reason: string;
            condition?: string;
        }>;
        reason: string;
        description?: string;
        preferredRefundMethod?: string;
    }): Promise<any>;
    getReturns({ page, limit, status, userId, stationCode }: {
        page: number;
        limit: number;
        status?: string;
        userId?: string;
        stationCode?: string;
    }): Promise<{
        returns: any;
        total: any;
        summary: {
            pending: any;
            approved: any;
            rejected: any;
            completed: any;
        };
        page: number;
        totalPages: number;
    }>;
    getUserReturns(userId: string, { page, limit }: {
        page?: number;
        limit?: number;
    }): Promise<{
        returns: any;
        total: any;
        page: number;
        totalPages: number;
    }>;
    getReturnById(id: string): Promise<any>;
    updateReturnStatus(id: string, status: ReturnStatus, notes?: string): Promise<any>;
    approveReturn(id: string, refundAmount?: number): Promise<any>;
    rejectReturn(id: string, reason: string): Promise<any>;
    processRefund(id: string): Promise<any>;
    cancelReturnRequest(id: string, userId: string): Promise<any>;
    trackReturnStatus(id: string): Promise<any>;
    getReturnPolicy(): Promise<{
        allowedDays: number;
        maxReturnItems: number;
        restockingFee: number;
        refundProcessingDays: number;
    }>;
};
//# sourceMappingURL=returns.service.d.ts.map