import { 
  DollarSign,
  ShoppingCart, 
  Users, 
  Package,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { dashboardApi } from '../services/adminApi'
import toast from 'react-hot-toast'
import { formatPrice } from '../utils/currency'

interface StatCard {
  title: string
  value: string | number
  change: number
  changeType: 'increase' | 'decrease'
  icon: any
  color: string
  period?: string
}

interface DashboardStatsProps {
  stats?: {
    revenue: { current: number; change: number; period: string }
    orders: { current: number; change: number; period: string }
    customers: { current: number; change: number; period: string }
    products: { current: number; change: number; period: string }
  }
  loading?: boolean
}

const DashboardStats = ({ stats, loading = false }: DashboardStatsProps) => {
  const [apiStats, setApiStats] = useState<any>(null)
  const [apiLoading, setApiLoading] = useState(true)

  const normalizeStats = (rawData: any) => {
    if (!rawData) return null

    if (rawData.overview) {
      return {
        revenue: {
          current: Number(rawData.overview.totalSalesMonth || 0),
          change: Number(rawData.overview.changes?.revenue || 0),
          period: 'from last month'
        },
        orders: {
          current: Number(rawData.overview.totalOrders || 0),
          change: Number(rawData.overview.changes?.orders || 0),
          period: 'all time'
        },
        customers: {
          current: Number(rawData.overview.totalUsers || 0),
          change: Number(rawData.overview.changes?.users || 0),
          period: 'all time'
        },
        products: {
          current: Number(rawData.overview.totalProducts || 0),
          change: Number(rawData.overview.changes?.products || 0),
          period: 'all time'
        }
      }
    }

    return {
      revenue: {
        current: Number(rawData.revenue?.current || 0),
        change: Number(rawData.revenue?.change || 0),
        period: rawData.revenue?.period || 'from last month'
      },
      orders: {
        current: Number(rawData.orders?.current || 0),
        change: Number(rawData.orders?.change || 0),
        period: rawData.orders?.period || 'from last month'
      },
      customers: {
        current: Number(rawData.customers?.current || 0),
        change: Number(rawData.customers?.change || 0),
        period: rawData.customers?.period || 'from last month'
      },
      products: {
        current: Number(rawData.products?.current || 0),
        change: Number(rawData.products?.change || 0),
        period: rawData.products?.period || 'from last month'
      }
    }
  }

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setApiLoading(true)
        const data = await dashboardApi.getOverview()
        setApiStats(data)
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error)
        toast.error('Failed to load dashboard statistics')
        setApiStats(null)
      } finally {
        setApiLoading(false)
      }
    }

    if (!stats) {
      fetchStats()
    } else {
      setApiStats(stats)
      setApiLoading(false)
    }
  }, [stats])

  const defaultStats = {
    revenue: { current: 45231.89, change: 12.5, period: 'from last month' },
    orders: { current: 156, change: 8.2, period: 'from last month' },
    customers: { current: 1234, change: 15.3, period: 'from last month' },
    products: { current: 48, change: -2.1, period: 'from last month' }
  }

  const data = normalizeStats(stats || apiStats) || defaultStats

  const statCards: StatCard[] = [
    {
      title: 'Total Revenue',
      value: formatPrice(data.revenue.current),
      change: data.revenue.change,
      changeType: data.revenue.change >= 0 ? 'increase' : 'decrease',
      icon: DollarSign,
      color: 'bg-green-500',
      period: data.revenue.period
    },
    {
      title: 'Total Orders',
      value: data.orders.current.toLocaleString(),
      change: data.orders.change,
      changeType: data.orders.change >= 0 ? 'increase' : 'decrease',
      icon: ShoppingCart,
      color: 'bg-blue-500',
      period: data.orders.period
    },
    {
      title: 'Total Customers',
      value: data.customers.current.toLocaleString(),
      change: data.customers.change,
      changeType: data.customers.change >= 0 ? 'increase' : 'decrease',
      icon: Users,
      color: 'bg-orange-500',
      period: data.customers.period
    },
    {
      title: 'Total Products',
      value: data.products.current.toLocaleString(),
      change: data.products.change,
      changeType: data.products.change >= 0 ? 'increase' : 'decrease',
      icon: Package,
      color: 'bg-purple-500',
      period: data.products.period
    }
  ]

  if (loading || apiLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((card, index) => {
        const Icon = card.icon
        const isPositive = card.changeType === 'increase'
        
        return (
          <div key={index} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900 mb-2">{card.value}</p>
                <div className="flex items-center">
                  {isPositive ? (
                    <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm font-medium ${
                    isPositive ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {Math.abs(card.change)}%
                  </span>
                  <span className="text-sm text-gray-500 ml-1">
                    {card.period}
                  </span>
                </div>
              </div>
              <div className={`${card.color} p-3 rounded-full`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default DashboardStats
