export interface AnalyticsDateRange {
    from: Date;
    to: Date;
}
export interface SalesAnalytics {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    revenueGrowth: number;
    orderGrowth: number;
    topSellingProducts: Array<{
        productId: string;
        productName: string;
        quantity: number;
        revenue: number;
    }>;
    salesByCategory: Array<{
        categoryId: string;
        categoryName: string;
        revenue: number;
        orders: number;
    }>;
    salesByPaymentMethod: Record<string, {
        revenue: number;
        orders: number;
    }>;
    dailySales: Array<{
        date: string;
        revenue: number;
        orders: number;
    }>;
}
export interface CustomerAnalytics {
    totalCustomers: number;
    newCustomers: number;
    returningCustomers: number;
    customerGrowthRate: number;
    topCustomers: Array<{
        userId: string;
        name: string;
        email: string;
        totalSpent: number;
        totalOrders: number;
        averageOrderValue: number;
    }>;
    customersByRegion: Array<{
        region: string;
        count: number;
        percentage: number;
    }>;
}
export interface ProductAnalytics {
    totalProducts: number;
    activeProducts: number;
    outOfStockProducts: number;
    lowStockProducts: number;
    topViewedProducts: Array<{
        productId: string;
        productName: string;
        views: number;
    }>;
    topRatedProducts: Array<{
        productId: string;
        productName: string;
        rating: number;
        reviews: number;
    }>;
    categoryPerformance: Array<{
        categoryId: string;
        categoryName: string;
        productCount: number;
        totalRevenue: number;
        averageRating: number;
    }>;
}
export interface DeliveryAnalytics {
    totalDeliveries: number;
    onTimeDeliveries: number;
    lateDeliveries: number;
    averageDeliveryTime: number;
    deliveryPerformance: number;
    deliveriesByStatus: Record<string, number>;
    deliveriesByCourier: Array<{
        courierName: string;
        deliveries: number;
        onTimeRate: number;
        averageTime: number;
    }>;
}
declare class AnalyticsService {
    getSalesAnalytics(dateRange: AnalyticsDateRange, period?: 'daily' | 'weekly' | 'monthly'): Promise<SalesAnalytics>;
    getCustomerAnalytics(dateRange: AnalyticsDateRange): Promise<CustomerAnalytics>;
    getProductAnalytics(dateRange: AnalyticsDateRange): Promise<ProductAnalytics>;
    getDeliveryAnalytics(dateRange: AnalyticsDateRange): Promise<DeliveryAnalytics>;
    getDashboardAnalytics(period?: 'today' | 'week' | 'month' | 'year'): Promise<{
        sales: {
            revenue: number;
            orders: number;
            growth: number;
        };
        customers: {
            total: number;
            new: number;
            growth: number;
        };
        products: {
            total: number;
            lowStock: number;
        };
        orders: {
            pending: number;
            processing: number;
            delivered: number;
        };
    }>;
    private getPeriodData;
    private getTopSellingProducts;
    private getSalesByCategory;
    private getSalesByPaymentMethod;
    private getDailySales;
    private getWeeklySales;
    private getCustomerSegmentation;
    private getTopCustomers;
    private getCustomersByRegion;
    private getProductCounts;
    private getTopViewedProducts;
    private getTopRatedProducts;
    private getCategoryPerformance;
    private getTotalDeliveries;
    private getDeliveryPerformance;
    private getCourierPerformance;
    private getDeliveryStatusBreakdown;
    private getOrderStatusBreakdown;
    private getEmptySalesAnalytics;
    private getEmptyCustomerAnalytics;
    private getEmptyProductAnalytics;
    private getEmptyDeliveryAnalytics;
    private getEmptyDashboardAnalytics;
}
export declare const analyticsService: AnalyticsService;
export default analyticsService;
//# sourceMappingURL=analyticsService.d.ts.map