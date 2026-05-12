"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsService = void 0;
// @ts-nocheck
const database_1 = require("../database");
class AnalyticsService {
    async getSalesAnalytics(dateRange, period = 'daily') {
        try {
            const { from, to } = dateRange;
            // Get previous period for growth calculations
            const previousFrom = new Date(from.getTime() - (to.getTime() - from.getTime()));
            const previousTo = from;
            const [currentPeriod, previousPeriod, topProducts, categoryData, paymentData, dailyData] = await Promise.all([
                this.getPeriodData(from, to),
                this.getPeriodData(previousFrom, previousTo),
                this.getTopSellingProducts(from, to, 10),
                this.getSalesByCategory(from, to),
                this.getSalesByPaymentMethod(from, to),
                period === 'daily' ? this.getDailySales(from, to) : this.getWeeklySales(from, to)
            ]);
            const revenueGrowth = previousPeriod.totalRevenue > 0
                ? ((currentPeriod.totalRevenue - previousPeriod.totalRevenue) / previousPeriod.totalRevenue) * 100
                : 0;
            const orderGrowth = previousPeriod.totalOrders > 0
                ? ((currentPeriod.totalOrders - previousPeriod.totalOrders) / previousPeriod.totalOrders) * 100
                : 0;
            return {
                totalRevenue: currentPeriod.totalRevenue,
                totalOrders: currentPeriod.totalOrders,
                averageOrderValue: currentPeriod.totalOrders > 0 ? currentPeriod.totalRevenue / currentPeriod.totalOrders : 0,
                revenueGrowth: Math.round(revenueGrowth * 100) / 100,
                orderGrowth: Math.round(orderGrowth * 100) / 100,
                topSellingProducts: topProducts,
                salesByCategory: categoryData,
                salesByPaymentMethod: paymentData,
                dailySales: dailyData
            };
        }
        catch (error) {
            console.error('Sales analytics error:', error);
            return this.getEmptySalesAnalytics();
        }
    }
    async getCustomerAnalytics(dateRange) {
        try {
            const { from, to } = dateRange;
            const [totalCustomers, newCustomers, customerData, topCustomers, regionData] = await Promise.all([
                database_1.prisma.user.count({
                    where: {
                        createdAt: { lte: to }
                    }
                }),
                database_1.prisma.user.count({
                    where: {
                        createdAt: {
                            gte: from,
                            lte: to
                        }
                    }
                }),
                this.getCustomerSegmentation(from, to),
                this.getTopCustomers(from, to, 10),
                this.getCustomersByRegion(from, to)
            ]);
            const returningCustomers = totalCustomers - newCustomers;
            const customerGrowthRate = totalCustomers > 0
                ? (newCustomers / totalCustomers) * 100
                : 0;
            return {
                totalCustomers,
                newCustomers,
                returningCustomers,
                customerGrowthRate: Math.round(customerGrowthRate * 100) / 100,
                topCustomers,
                customersByRegion: regionData
            };
        }
        catch (error) {
            console.error('Customer analytics error:', error);
            return this.getEmptyCustomerAnalytics();
        }
    }
    async getProductAnalytics(dateRange) {
        try {
            const { from, to } = dateRange;
            const [totalProducts, topViewed, topRated, categoryPerformance] = await Promise.all([
                this.getProductCounts(),
                this.getTopViewedProducts(from, to, 10),
                this.getTopRatedProducts(10),
                this.getCategoryPerformance(from, to)
            ]);
            return {
                totalProducts,
                activeProducts: totalProducts, // Assuming published products are active
                outOfStockProducts: 0, // Would need to query stock status
                lowStockProducts: 0, // Would need to query low stock threshold
                topViewedProducts,
                topRatedProducts,
                categoryPerformance
            };
        }
        catch (error) {
            console.error('Product analytics error:', error);
            return this.getEmptyProductAnalytics();
        }
    }
    async getDeliveryAnalytics(dateRange) {
        try {
            const { from, to } = dateRange;
            const [totalDeliveries, deliveryData, courierData] = await Promise.all([
                this.getTotalDeliveries(from, to),
                this.getDeliveryPerformance(from, to),
                this.getCourierPerformance(from, to)
            ]);
            const onTimeDeliveries = deliveryData.filter(d => d.onTime).length;
            const lateDeliveries = deliveryData.filter(d => !d.onTime).length;
            const averageDeliveryTime = deliveryData.reduce((sum, d) => sum + d.deliveryTime, 0) / deliveryData.length;
            return {
                totalDeliveries,
                onTimeDeliveries,
                lateDeliveries,
                averageDeliveryTime: Math.round(averageDeliveryTime * 100) / 100,
                deliveryPerformance: totalDeliveries > 0 ? (onTimeDeliveries / totalDeliveries) * 100 : 0,
                deliveriesByStatus: this.getDeliveryStatusBreakdown(from, to),
                deliveriesByCourier: courierData
            };
        }
        catch (error) {
            console.error('Delivery analytics error:', error);
            return this.getEmptyDeliveryAnalytics();
        }
    }
    async getDashboardAnalytics(period = 'today') {
        try {
            const now = new Date();
            let from;
            let to = now;
            switch (period) {
                case 'today':
                    from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    break;
                case 'week':
                    from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case 'month':
                    from = new Date(now.getFullYear(), now.getMonth(), 1);
                    break;
                case 'year':
                    from = new Date(now.getFullYear(), 0, 1);
                    break;
            }
            const [salesData, customerData, productData, orderData] = await Promise.all([
                this.getPeriodData(from, to),
                this.getCustomerAnalytics({ from, to }),
                this.getProductAnalytics({ from, to }),
                this.getOrderStatusBreakdown(from, to)
            ]);
            return {
                sales: {
                    revenue: salesData.totalRevenue,
                    orders: salesData.totalOrders,
                    growth: 0 // Would need previous period data
                },
                customers: {
                    total: customerData.totalCustomers,
                    new: customerData.newCustomers,
                    growth: customerData.customerGrowthRate
                },
                products: {
                    total: productData.totalProducts,
                    lowStock: productData.lowStockProducts
                },
                orders: orderData
            };
        }
        catch (error) {
            console.error('Dashboard analytics error:', error);
            return this.getEmptyDashboardAnalytics();
        }
    }
    async getPeriodData(from, to) {
        const [revenueData, orderCount] = await Promise.all([
            database_1.prisma.order.aggregate({
                where: {
                    createdAt: { gte: from, lte: to },
                    paymentStatus: 'PAID'
                },
                _sum: { totalAmount: true }
            }),
            database_1.prisma.order.count({
                where: {
                    createdAt: { gte: from, lte: to }
                }
            })
        ]);
        return {
            totalRevenue: Number(revenueData._sum.totalAmount || 0),
            totalOrders: orderCount
        };
    }
    async getTopSellingProducts(from, to, limit) {
        const topProducts = await database_1.prisma.orderItem.groupBy({
            by: ['productId'],
            where: {
                order: {
                    createdAt: { gte: from, lte: to },
                    paymentStatus: 'PAID'
                }
            },
            _sum: { quantity: true },
            _count: { id: true },
            orderBy: {
                _sum: { quantity: 'desc' }
            },
            take: limit
        });
        // Get product names
        const productIds = topProducts.map(p => p.productId);
        const products = await database_1.prisma.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, name: true, price: true }
        });
        const productMap = products.reduce((acc, product) => {
            acc[product.id] = product;
            return acc;
        }, {});
        return topProducts.map(item => {
            const product = productMap[item.productId];
            const quantity = Number(item._sum.quantity || 0);
            const revenue = quantity * Number(product?.price || 0);
            return {
                productId: item.productId,
                productName: product?.name || 'Unknown',
                quantity,
                revenue
            };
        });
    }
    async getSalesByCategory(from, to) {
        const categoryData = await database_1.prisma.orderItem.groupBy({
            by: ['productId'],
            where: {
                order: {
                    createdAt: { gte: from, lte: to },
                    paymentStatus: 'PAID'
                }
            },
            _sum: { quantity: true },
            _count: { id: true }
        });
        // Get product categories
        const productIds = categoryData.map(p => p.productId);
        const products = await database_1.prisma.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, categoryId: true, price: true }
        });
        const productMap = products.reduce((acc, product) => {
            acc[product.id] = product;
            return acc;
        }, {});
        // Group by category
        const categoryMap = new Map();
        for (const item of categoryData) {
            const product = productMap[item.productId];
            if (product) {
                const categoryId = product.categoryId || 'uncategorized';
                const quantity = Number(item._sum.quantity || 0);
                const revenue = quantity * Number(product.price || 0);
                if (!categoryMap.has(categoryId)) {
                    categoryMap.set(categoryId, {
                        categoryId,
                        categoryName: '', // Would need to fetch category names
                        revenue: 0,
                        orders: 0
                    });
                }
                const category = categoryMap.get(categoryId);
                category.revenue += revenue;
                category.orders += Number(item._count.id || 0);
            }
        }
        return Array.from(categoryMap.values());
    }
    async getSalesByPaymentMethod(from, to) {
        const paymentData = await database_1.prisma.order.groupBy({
            by: ['paymentMethod'],
            where: {
                createdAt: { gte: from, lte: to },
                paymentStatus: 'PAID'
            },
            _sum: { totalAmount: true },
            _count: { id: true }
        });
        return paymentData.reduce((acc, item) => {
            acc[item.paymentMethod] = {
                revenue: Number(item._sum.totalAmount || 0),
                orders: Number(item._count.id || 0)
            };
            return acc;
        }, {});
    }
    async getDailySales(from, to) {
        const dailyData = await database_1.prisma.order.groupBy({
            by: ['createdAt'],
            where: {
                createdAt: { gte: from, lte: to },
                paymentStatus: 'PAID'
            },
            _sum: { totalAmount: true },
            _count: { id: true }
        });
        return dailyData.map(item => ({
            date: item.createdAt.toISOString().split('T')[0],
            revenue: Number(item._sum.totalAmount || 0),
            orders: Number(item._count.id || 0)
        }));
    }
    async getWeeklySales(from, to) {
        // Similar to daily but grouped by week
        // For now, return empty array
        return [];
    }
    async getCustomerSegmentation(from, to) {
        const [totalCustomers, newCustomers] = await Promise.all([
            database_1.prisma.user.count({
                where: {
                    createdAt: { lte: to }
                }
            }),
            database_1.prisma.user.count({
                where: {
                    createdAt: {
                        gte: from,
                        lte: to
                    }
                }
            })
        ]);
        return {
            newCustomers,
            returningCustomers: totalCustomers - newCustomers
        };
    }
    async getTopCustomers(from, to, limit) {
        const customerData = await database_1.prisma.order.groupBy({
            by: ['userId'],
            where: {
                createdAt: { gte: from, lte: to },
                paymentStatus: 'PAID'
            },
            _sum: { totalAmount: true },
            _count: { id: true },
            orderBy: {
                _sum: { totalAmount: 'desc' }
            },
            take: limit
        });
        const userIds = customerData.map(c => c.userId);
        const users = await database_1.prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, name: true, email: true }
        });
        const userMap = users.reduce((acc, user) => {
            acc[user.id] = user;
            return acc;
        }, {});
        return customerData.map(item => {
            const user = userMap[item.userId];
            const totalSpent = Number(item._sum.totalAmount || 0);
            const totalOrders = Number(item._count.id || 0);
            return {
                userId: item.userId,
                name: user?.name || 'Unknown',
                email: user?.email || 'unknown@example.com',
                totalSpent,
                totalOrders,
                averageOrderValue: totalOrders > 0 ? totalSpent / totalOrders : 0
            };
        });
    }
    async getCustomersByRegion(from, to) {
        // This would require geocoding addresses
        // For now, return mock data
        return [
            { region: 'Nairobi', count: 150, percentage: 45 },
            { region: 'Mombasa', count: 80, percentage: 24 },
            { region: 'Kisumu', count: 60, percentage: 18 },
            { region: 'Other', count: 43, percentage: 13 }
        ];
    }
    async getProductCounts() {
        return database_1.prisma.product.count({
            where: { isPublished: true }
        });
    }
    async getTopViewedProducts(from, to, limit) {
        // This would require product view tracking
        // For now, return empty array
        return [];
    }
    async getTopRatedProducts(limit) {
        const topRated = await database_1.prisma.product.findMany({
            where: { isPublished: true },
            select: { id: true, name: true, averageRating: true, totalReviews: true },
            orderBy: { averageRating: 'desc' },
            take: limit
        });
        return topRated.map(product => ({
            productId: product.id,
            productName: product.name,
            rating: product.averageRating,
            reviews: product.totalReviews
        }));
    }
    async getCategoryPerformance(from, to) {
        // This would require complex joins
        // For now, return empty array
        return [];
    }
    async getTotalDeliveries(from, to) {
        return database_1.prisma.delivery.count({
            where: {
                createdAt: { gte: from, lte: to }
            }
        });
    }
    async getDeliveryPerformance(from, to) {
        // This would require delivery tracking data
        // For now, return empty array
        return [];
    }
    async getCourierPerformance(from, to) {
        // This would require courier tracking
        // For now, return empty array
        return [];
    }
    async getDeliveryStatusBreakdown(from, to) {
        const statusData = await database_1.prisma.delivery.groupBy({
            by: ['status'],
            where: {
                createdAt: { gte: from, lte: to }
            },
            _count: { id: true }
        });
        return statusData.reduce((acc, item) => {
            acc[item.status] = Number(item._count.id || 0);
            return acc;
        }, {});
    }
    async getOrderStatusBreakdown(from, to) {
        const statusData = await database_1.prisma.order.groupBy({
            by: ['status'],
            where: {
                createdAt: { gte: from, lte: to }
            },
            _count: { id: true }
        });
        const statusMap = statusData.reduce((acc, item) => {
            acc[item.status] = Number(item._count.id || 0);
            return acc;
        }, {});
        return {
            pending: statusMap['PENDING'] || 0,
            processing: statusMap['PROCESSING'] || 0,
            delivered: statusMap['DELIVERED'] || 0
        };
    }
    // Empty analytics objects for error cases
    getEmptySalesAnalytics() {
        return {
            totalRevenue: 0,
            totalOrders: 0,
            averageOrderValue: 0,
            revenueGrowth: 0,
            orderGrowth: 0,
            topSellingProducts: [],
            salesByCategory: [],
            salesByPaymentMethod: {},
            dailySales: []
        };
    }
    getEmptyCustomerAnalytics() {
        return {
            totalCustomers: 0,
            newCustomers: 0,
            returningCustomers: 0,
            customerGrowthRate: 0,
            topCustomers: [],
            customersByRegion: []
        };
    }
    getEmptyProductAnalytics() {
        return {
            totalProducts: 0,
            activeProducts: 0,
            outOfStockProducts: 0,
            lowStockProducts: 0,
            topViewedProducts: [],
            topRatedProducts: [],
            categoryPerformance: []
        };
    }
    getEmptyDeliveryAnalytics() {
        return {
            totalDeliveries: 0,
            onTimeDeliveries: 0,
            lateDeliveries: 0,
            averageDeliveryTime: 0,
            deliveryPerformance: 0,
            deliveriesByStatus: {},
            deliveriesByCourier: []
        };
    }
    getEmptyDashboardAnalytics() {
        return {
            sales: { revenue: 0, orders: 0, growth: 0 },
            customers: { total: 0, new: 0, growth: 0 },
            products: { total: 0, lowStock: 0 },
            orders: { pending: 0, processing: 0, delivered: 0 }
        };
    }
}
exports.analyticsService = new AnalyticsService();
exports.default = exports.analyticsService;
//# sourceMappingURL=analyticsService.js.map