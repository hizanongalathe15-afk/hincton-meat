import { prisma } from '../database';
import { Response, NextFunction } from 'express';
import { OrderModel } from '../models/Order';
import { ProductModel } from '../models/Product';
import { UserModel } from '../models/User';
import { OrderStatus } from '@prisma/client';

import { AuthRequest } from '../middleware/auth';

const safeNumber = (value: unknown) => {
  if (typeof value === 'number') return value
  if (typeof value === 'string') return Number(value) || 0
  return 0
}

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())

export const getDashboardStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const today = startOfDay(new Date())
    const monthAgo = new Date(today)
    monthAgo.setDate(monthAgo.getDate() - 30)
    const previousMonthAgo = new Date(monthAgo)
    previousMonthAgo.setDate(previousMonthAgo.getDate() - 30)

    const [orders, products, userResult, newCustomersThisMonth] = await Promise.all([
      OrderModel.findAll(),
      ProductModel.findAll(),
      UserModel.findAll({ page: 1, limit: 1 }),
      prisma.user.count({
        where: {
          deletedAt: null,
          createdAt: { gte: monthAgo }
        }
      })
    ])

    const totalCustomers = userResult.total
    const deliveredOrders = orders.filter(o => o.status === OrderStatus.DELIVERED)
    const totalRevenue = deliveredOrders.reduce((sum, o) => sum + safeNumber(o.totalAmount), 0)
    const totalOrders = orders.length
    const totalProducts = products.length
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    const currentMonthRevenue = deliveredOrders
      .filter(order => order.createdAt >= monthAgo)
      .reduce((sum, order) => sum + safeNumber(order.totalAmount), 0)

    const previousMonthRevenue = deliveredOrders
      .filter(order => order.createdAt >= previousMonthAgo && order.createdAt < monthAgo)
      .reduce((sum, order) => sum + safeNumber(order.totalAmount), 0)

    const revenueChange = previousMonthRevenue > 0
      ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
      : currentMonthRevenue > 0
        ? 100
        : 0

    const userOrderCounts = new Map<string, number>()
    orders.forEach(order => {
      if (order.userId) {
        userOrderCounts.set(order.userId, (userOrderCounts.get(order.userId) || 0) + 1)
      }
    })
    const returningCustomers = Array.from(userOrderCounts.values()).filter(count => count > 1).length

    const productStats = new Map<string, { name: string; quantity: number; revenue: number }>()
    orders.forEach(order => {
      order.orderItems?.forEach(item => {
        const key = item.productId || item.productName || 'unknown'
        const current = productStats.get(key) || { name: item.productName || 'Unknown Product', quantity: 0, revenue: 0 }
        current.quantity += Number(item.quantity || 0)
        current.revenue += safeNumber(item.totalPrice)
        productStats.set(key, current)
      })
    })

    const topProducts = Array.from(productStats.entries())
      .sort((a, b) => b[1].quantity - a[1].quantity)
      .slice(0, 3)
      .map(([productId, stats]) => ({
        productId,
        name: stats.name,
        sales: stats.quantity,
        revenue: stats.revenue
      }))

    const recentOrders = orders
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5)
      .map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customer: order.user?.email || order.guestEmail || 'Guest',
        amount: safeNumber(order.totalAmount),
        status: order.status,
        date: order.createdAt.toISOString()
      }))

    res.json({
      totalRevenue,
      totalOrders,
      totalProducts,
      totalCustomers,
      avgOrderValue,
      revenueChange,
      newCustomersThisMonth,
      returningCustomers,
      topProducts,
      recentOrders
    })
  } catch (error) {
    next(error)
  }
};

export const getSalesAnalytics = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const period = Number(req.query.period) || 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - period + 1)

    const orders = await prisma.order.findMany({
      where: {
        deletedAt: null,
        createdAt: { gte: startDate },
        status: { not: OrderStatus.CANCELLED }
      },
      include: {
        user: true,
        orderItems: {
          include: {
            product: {
              include: {
                category: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    const records: Record<string, { revenue: number; orders: number; customers: Set<string> }> = {}
    const categoryTotals: Record<string, number> = {}

    orders.forEach(order => {
      const dateKey = startOfDay(order.createdAt).toISOString().slice(0, 10)
      if (!records[dateKey]) {
        records[dateKey] = { revenue: 0, orders: 0, customers: new Set() }
      }
      records[dateKey].revenue += safeNumber(order.totalAmount)
      records[dateKey].orders += 1
      if (order.userId) records[dateKey].customers.add(order.userId)

      order.orderItems?.forEach(item => {
        const categoryName = item.product?.category?.name || 'Uncategorized'
        categoryTotals[categoryName] = (categoryTotals[categoryName] || 0) + Number(item.quantity || 0)
      })
    })

    const salesData = []
    for (let d = new Date(startDate); d <= new Date(); d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().slice(0, 10)
      const record = records[key]
      salesData.push({
        date: key,
        revenue: record?.revenue || 0,
        orders: record?.orders || 0,
        customers: record?.customers?.size || 0
      })
    }

    const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#14b8a6']
    const categoryData = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value], index) => ({
        name,
        value,
        color: colors[index % colors.length]
      }))

    res.json({ salesData, categoryData })
  } catch (error) {
    next(error)
  }
};

export const getProductAnalytics = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    res.json({
      productsByCategory: [],
      lowStockProducts: [],
      outOfStockProducts: [],
      featuredProducts: []
    })
  } catch (error) {
    next(error)
  }
};

export const getCustomerAnalytics = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    res.json({
      customerGrowth: [],
      topCustomers: [],
      customerStats: {
        totalCustomers: 0,
        verifiedCustomers: 0,
        withAddress: 0,
        withPhone: 0
      }
    })
  } catch (error) {
    next(error)
  }
};

export const getOrderAnalytics = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    res.json({
      orderStatusStats: [],
      paymentMethodStats: [],
      deliveryAnalytics: {
        avgDeliveryTime: 0,
        totalDeliveryFee: 0
      }
    })
  } catch (error) {
    next(error)
  }
};
