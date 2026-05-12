export interface StockUpdateData {
    productId: string;
    quantity: number;
    operation: 'increase' | 'decrease' | 'set';
    reason?: string;
    userId?: string;
}
export interface LowStockAlert {
    productId: string;
    productName: string;
    currentStock: number;
    lowStockThreshold: number;
    recommendedOrderQuantity: number;
}
export interface InventoryStats {
    totalProducts: number;
    inStockProducts: number;
    outOfStockProducts: number;
    lowStockProducts: number;
    totalValue: number;
    categories: Array<{
        name: string;
        productCount: number;
        totalValue: number;
    }>;
}
declare class InventoryService {
    updateStock(updateData: StockUpdateData): Promise<{
        success: boolean;
        error?: string;
        previousStock?: number;
        newStock?: number;
    }>;
    bulkUpdateStock(updates: StockUpdateData[]): Promise<{
        success: boolean;
        results: Array<{
            productId: string;
            success: boolean;
            error?: string;
        }>;
        error?: string;
    }>;
    getStockMovements(productId: string, page?: number, limit?: number, filters?: {
        operation?: string;
        dateFrom?: Date;
        dateTo?: Date;
    }): Promise<{
        movements: any[];
        total: number;
        page: number;
        pages: number;
    }>;
    getLowStockAlerts(): Promise<LowStockAlert[]>;
    getInventoryStats(categoryId?: string): Promise<InventoryStats>;
    getReorderSuggestions(): Promise<Array<{
        productId: string;
        productName: string;
        currentStock: number;
        reorderPoint: number;
        suggestedOrderQuantity: number;
        estimatedCost: number;
        supplier?: string;
    }>>;
    getTopSellingProducts(limit?: number): Promise<Array<{
        productId: string;
        productName: string;
        totalSold: number;
        revenue: number;
        currentStock: number;
        stockStatus: string;
    }>>;
    getInventoryValueReport(dateRange?: {
        from: Date;
        to: Date;
    }): Promise<{
        totalValue: number;
        categories: Array<{
            categoryId: string;
            categoryName: string;
            productCount: number;
            totalValue: number;
            averageValue: number;
        }>;
    }>;
    private getStockStatus;
    private createLowStockAlert;
    clearLowStockAlerts(): Promise<number>;
    getStockAdjustmentHistory(page?: number, limit?: number, filters?: {
        userId?: string;
        operation?: string;
        dateFrom?: Date;
        dateTo?: Date;
    }): Promise<{
        adjustments: any[];
        total: number;
        page: number;
        pages: number;
    }>;
}
export declare const inventoryService: InventoryService;
export default inventoryService;
//# sourceMappingURL=inventoryService.d.ts.map