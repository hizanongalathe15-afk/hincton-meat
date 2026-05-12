import { Request, Response, NextFunction } from 'express'
import { OrderModel, ProductModel, UserModel, PaymentModel, SubscriptionModel } from '../models'
import { asyncHandler, AppError, NotFoundError } from '../middleware'

export const getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query
  
  const [
    totalOrders,
    totalRevenue,
    totalUsers,
    totalProducts,
    activeSubscriptions,
    recentOrders,
    topProducts,
    salesByMonth
  ] = await Promise.all([
    OrderModel.getOrderStats({
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined
    }),
    PaymentModel.getPaymentStats({
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined
    }),
    UserModel.getUserStats({
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined
    }),
    ProductModel.getProductStats({
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined
    }),
    SubscriptionModel.getSubscriptionStats({
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined
    }),
    OrderModel.findAll({
      deletedAt: null,
      page: 1,
      limit: 10
    }),
    ProductModel.getTopSellingProducts(10),
    OrderModel.getSalesByMonth()
  ])
  
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
      topProducts: Array.isArray(topProducts?.products) ? topProducts.products : (topProducts as any)?.products ?? topProducts,
      salesByMonth: salesByMonth.monthlyData
    }
  })
})

export const getSalesOverview = asyncHandler(async (req: Request, res: Response) => {
  const { period = '30days' } = req.query
  
  let startDate: Date
  const endDate = new Date()
  
  switch (period) {
    case '7days':
      startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case '30days':
      startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
    case '90days':
      startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000)
      break
    case '1year':
      startDate = new Date(endDate.getTime() - 365 * 24 * 60 * 60 * 1000)
      break
    default:
      startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)
  }
  
  const [salesData, ordersData] = await Promise.all([
    PaymentModel.getPaymentStats({ startDate, endDate }),
    OrderModel.getOrderStats({ startDate, endDate })
  ])
  
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
  })
})

export const getUserGrowth = asyncHandler(async (req: Request, res: Response) => {
  const { period = '30days' } = req.query
  
  let startDate: Date
  const endDate = new Date()
  
  switch (period) {
    case '7days':
      startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case '30days':
      startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
    case '90days':
      startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000)
      break
    case '1year':
      startDate = new Date(endDate.getTime() - 365 * 24 * 60 * 60 * 1000)
      break
    default:
      startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)
  }
  
  const userStats = await UserModel.getUserStats({ startDate, endDate })
  
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
  })
})

export const getProductPerformance = asyncHandler(async (req: Request, res: Response) => {
  const { period = '30days', limit = 10 } = req.query
  
  let startDate: Date
  const endDate = new Date()
  
  switch (period) {
    case '7days':
      startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case '30days':
      startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
    case '90days':
      startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000)
      break
    case '1year':
      startDate = new Date(endDate.getTime() - 365 * 24 * 60 * 60 * 1000)
      break
    default:
      startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)
  }
  
  const [topProducts, lowStockProducts] = await Promise.all([
    ProductModel.getTopSellingProducts(Number(limit)),
    ProductModel.getLowStockProducts(20)
  ])
  
  res.json({
    success: true,
    data: {
      period,
      startDate,
      endDate,
      topProducts: topProducts.products,
      lowStockProducts: lowStockProducts.products
    }
  })
})

export const getRecentActivity = asyncHandler(async (req: Request, res: Response) => {
  const { limit = 20 } = req.query
  
  const [recentOrders, recentUsers, recentPayments] = await Promise.all([
    OrderModel.findAll({
      page: 1,
      limit: Number(limit)
    }),
    UserModel.findAll({
      page: 1,
      limit: Number(limit),

    }),
    PaymentModel.getMpesaPayments({
      page: 1,
      limit: Number(limit)
    })
  ])
  
  res.json({
    success: true,
    data: {
      recentOrders,
      recentUsers,
      recentPayments: Array.isArray(recentPayments as any) ? recentPayments : (recentPayments as any).payments ?? recentPayments
    }
  })
})

export const getFinancialSummary = asyncHandler(async (req: Request, res: Response) => {
  const { period = '30days' } = req.query
  
  let startDate: Date
  const endDate = new Date()
  
  switch (period) {
    case '7days':
      startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case '30days':
      startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
    case '90days':
      startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000)
      break
    case '1year':
      startDate = new Date(endDate.getTime() - 365 * 24 * 60 * 60 * 1000)
      break
    default:
      startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)
  }
  
  const [paymentStats, orderStats] = await Promise.all([
    PaymentModel.getPaymentStats({ startDate, endDate }),
    OrderModel.getOrderStats({ startDate, endDate })
  ])
  
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
  })
})
