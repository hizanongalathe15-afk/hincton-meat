"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFinancialSummary = exports.getRecentActivity = exports.getProductPerformance = exports.getUserGrowth = exports.getSalesOverview = exports.getDashboardStats = void 0;
const models_1 = require("../models");
const middleware_1 = require("../middleware");
exports.getDashboardStats = (0, middleware_1.asyncHandler)(async (req, res) => {
    const { startDate, endDate } = req.query;
    const [totalOrders, totalRevenue, totalUsers, totalProducts, activeSubscriptions, recentOrders, topProducts, salesByMonth] = await Promise.all([
        models_1.OrderModel.getOrderStats({
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined
        }),
        models_1.PaymentModel.getPaymentStats({
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined
        }),
        models_1.UserModel.getUserStats({
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined
        }),
        models_1.ProductModel.getProductStats({
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined
        }),
        models_1.SubscriptionModel.getSubscriptionStats({
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined
        }),
        models_1.OrderModel.findAll({
            deletedAt: null,
            page: 1,
            limit: 10
        }),
        models_1.ProductModel.getTopSellingProducts(10),
        models_1.OrderModel.getSalesByMonth()
    ]);
    res.json({
        success: true,
        data: {
            overview: {
                totalOrders: totalOrders.totalOrders,
                totalRevenue: totalRevenue.totalRevenue,
                totalUsers: totalUsers.totalUsers,
                totalProducts: totalProducts.totalProducts,
                activeSubscriptions: activeSubscriptions.activeSubscriptions
            },
            recentOrders,
            topProducts: Array.isArray(topProducts?.products) ? topProducts.products : topProducts?.products ?? topProducts,
            salesByMonth: salesByMonth.monthlyData
        }
    });
});
exports.getSalesOverview = (0, middleware_1.asyncHandler)(async (req, res) => {
    const { period = '30days' } = req.query;
    let startDate;
    const endDate = new Date();
    switch (period) {
        case '7days':
            startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case '30days':
            startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
        case '90days':
            startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
        case '1year':
            startDate = new Date(endDate.getTime() - 365 * 24 * 60 * 60 * 1000);
            break;
        default:
            startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    const [salesData, ordersData] = await Promise.all([
        models_1.PaymentModel.getPaymentStats({ startDate, endDate }),
        models_1.OrderModel.getOrderStats({ startDate, endDate })
    ]);
    res.json({
        success: true,
        data: {
            period,
            startDate,
            endDate,
            revenue: salesData.totalRevenue,
            orders: ordersData.totalOrders,
            averageOrderValue: ordersData.totalOrders > 0 ? salesData.totalRevenue / ordersData.totalOrders : 0
        }
    });
});
exports.getUserGrowth = (0, middleware_1.asyncHandler)(async (req, res) => {
    const { period = '30days' } = req.query;
    let startDate;
    const endDate = new Date();
    switch (period) {
        case '7days':
            startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case '30days':
            startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
        case '90days':
            startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
        case '1year':
            startDate = new Date(endDate.getTime() - 365 * 24 * 60 * 60 * 1000);
            break;
        default:
            startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    const userStats = await models_1.UserModel.getUserStats({ startDate, endDate });
    res.json({
        success: true,
        data: {
            period,
            startDate,
            endDate,
            totalUsers: userStats.totalUsers,
            newUsers: userStats.newUsers,
            activeUsers: userStats.activeUsers,
            growthRate: userStats.growthRate
        }
    });
});
exports.getProductPerformance = (0, middleware_1.asyncHandler)(async (req, res) => {
    const { period = '30days', limit = 10 } = req.query;
    let startDate;
    const endDate = new Date();
    switch (period) {
        case '7days':
            startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case '30days':
            startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
        case '90days':
            startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
        case '1year':
            startDate = new Date(endDate.getTime() - 365 * 24 * 60 * 60 * 1000);
            break;
        default:
            startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    const [topProducts, lowStockProducts] = await Promise.all([
        models_1.ProductModel.getTopSellingProducts(Number(limit)),
        models_1.ProductModel.getLowStockProducts(20)
    ]);
    res.json({
        success: true,
        data: {
            period,
            startDate,
            endDate,
            topProducts: topProducts.products,
            lowStockProducts: lowStockProducts.products
        }
    });
});
exports.getRecentActivity = (0, middleware_1.asyncHandler)(async (req, res) => {
    const { limit = 20 } = req.query;
    const [recentOrders, recentUsers, recentPayments] = await Promise.all([
        models_1.OrderModel.findAll({
            page: 1,
            limit: Number(limit)
        }),
        models_1.UserModel.findAll({
            page: 1,
            limit: Number(limit),
        }),
        models_1.PaymentModel.getMpesaPayments({
            page: 1,
            limit: Number(limit)
        })
    ]);
    res.json({
        success: true,
        data: {
            recentOrders,
            recentUsers,
            recentPayments: Array.isArray(recentPayments) ? recentPayments : recentPayments.payments ?? recentPayments
        }
    });
});
exports.getFinancialSummary = (0, middleware_1.asyncHandler)(async (req, res) => {
    const { period = '30days' } = req.query;
    let startDate;
    const endDate = new Date();
    switch (period) {
        case '7days':
            startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case '30days':
            startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
        case '90days':
            startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
        case '1year':
            startDate = new Date(endDate.getTime() - 365 * 24 * 60 * 60 * 1000);
            break;
        default:
            startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    const [paymentStats, orderStats] = await Promise.all([
        models_1.PaymentModel.getPaymentStats({ startDate, endDate }),
        models_1.OrderModel.getOrderStats({ startDate, endDate })
    ]);
    res.json({
        success: true,
        data: {
            period,
            startDate,
            endDate,
            totalRevenue: paymentStats.totalRevenue,
            totalOrders: orderStats.totalOrders,
            averageOrderValue: orderStats.totalOrders > 0 ? paymentStats.totalRevenue / orderStats.totalOrders : 0,
            paymentMethods: paymentStats.paymentsByMethod,
            orderStatuses: orderStats.ordersByStatus
        }
    });
});
//# sourceMappingURL=dashboardController.js.map