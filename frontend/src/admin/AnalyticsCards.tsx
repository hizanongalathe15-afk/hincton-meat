import { 
  TrendingUp, 
  Users, 
  ShoppingCart, 
  Package,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import { formatPriceFromUSD } from '../utils/currency'
import { useEffect, useState } from 'react'
import { analyticsApi } from '../services/adminApi'
import toast from 'react-hot-toast'



interface AnalyticsCard {
  title: string
  value: string | number
  change?: number
  changeType?: 'increase' | 'decrease'
  icon: any
  color: string
  subtitle?: string
  trend?: Array<{ date: string; value: number }>
}

interface AnalyticsCardsProps {
  cards?: AnalyticsCard[]
  timeRange?: 'week' | 'month' | 'quarter' | 'year'
  onTimeRangeChange?: (range: 'week' | 'month' | 'quarter' | 'year') => void
  loading?: boolean
}

const AnalyticsCards = ({ 
  cards, 
  timeRange = 'month', 
  onTimeRangeChange,
  loading = false 
}: AnalyticsCardsProps) => {
  const [analyticsCards, setAnalyticsCards] = useState<AnalyticsCard[]>([])
  const [dashboardStats, setDashboardStats] = useState<any>(null)
  const [apiLoading, setApiLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setApiLoading(true)
        const data = await analyticsApi.getDashboardStats()
        setDashboardStats(data)
        
        // Transform API data to card format
        const transformedCards: AnalyticsCard[] = [
          {
            title: 'Total Revenue',
            value: formatPriceFromUSD(data.totalRevenue || 0),
            change: 12.5, // TODO: Calculate from API
            changeType: 'increase',
            icon: TrendingUp,
            color: 'bg-green-500',
            subtitle: 'vs last month'
          },
          {
            title: 'Total Customers',
            value: data.totalCustomers || 0,
            change: 8.2,
            changeType: 'increase',
            icon: Users,
            color: 'bg-blue-500',
            subtitle: 'registered users'
          },
          {
            title: 'Total Orders',
            value: data.totalOrders || 0,
            change: 5.3,
            changeType: 'increase',
            icon: ShoppingCart,
            color: 'bg-purple-500',
            subtitle: 'all time'
          },
          {
            title: 'Total Products',
            value: data.totalProducts || 0,
            change: 2.1,
            changeType: 'increase',
            icon: Package,
            color: 'bg-orange-500',
            subtitle: 'in catalog'
          }
        ]
        
        setAnalyticsCards(transformedCards)
      } catch (error) {
        console.error('Failed to fetch analytics:', error)
        toast.error('Failed to load analytics data')
        // Fallback to empty cards
        setAnalyticsCards([])
      } finally {
        setApiLoading(false)
      }
    }

    if (!cards) {
      fetchAnalytics()
    } else {
      setAnalyticsCards(cards)
      setApiLoading(false)
    }
  }, [cards, timeRange])

  const timeRanges = [
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'year', label: 'This Year' }
  ]

  const renderMiniChart = (trend: Array<{ date: string; value: number }>) => {
    const maxValue = Math.max(...trend.map(t => t.value))
    const minValue = Math.min(...trend.map(t => t.value))
    const range = maxValue - minValue

    return (
      <svg className="w-full h-8" viewBox="0 0 100 32">
        {trend.map((point, index) => {
          const x = (index / (trend.length - 1)) * 100
          const y = range > 0 ? ((maxValue - point.value) / range) * 32 : 16
          
          if (index === 0) {
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="1"
                fill="currentColor"
                className="text-gray-400"
              />
            )
          }
          
          const prevPoint = trend[index - 1]
          const prevX = ((index - 1) / (trend.length - 1)) * 100
          const prevY = range > 0 ? ((maxValue - prevPoint.value) / range) * 32 : 16
          
          return (
            <g key={index}>
              <line
                x1={prevX}
                y1={prevY}
                x2={x}
                y2={y}
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-gray-300"
              />
              <circle
                cx={x}
                cy={y}
                r="1"
                fill="currentColor"
                className="text-gray-400"
              />
            </g>
          )
        })}
      </svg>
    )
  }

  if (loading || apiLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-8 bg-gray-100 rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Analytics Overview</h2>
          <p className="text-gray-600">Key performance metrics and trends</p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => onTimeRangeChange?.(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
        >
          {timeRanges.map(range => (
            <option key={range.value} value={range.value}>
              {range.label}
            </option>
          ))}
        </select>
      </div>

      {/* Analytics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {analyticsCards.map((card, index) => {
          const Icon = card.icon
          const isPositive = card.changeType === 'increase'
          
          return (
            <div key={index} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className={`${card.color} p-2 rounded-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                {card.change !== undefined && (
                  <div className={`flex items-center gap-1 text-sm font-medium ${
                    isPositive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {isPositive ? (
                      <ArrowUp className="w-3 h-3" />
                    ) : (
                      <ArrowDown className="w-3 h-3" />
                    )}
                    {Math.abs(card.change)}%
                  </div>
                )}
              </div>

              {/* Content */}
              <div>
                <h3 className="text-gray-600 text-sm font-medium mb-1">{card.title}</h3>
                <p className="text-2xl font-bold text-gray-900 mb-1">{card.value}</p>
                {card.subtitle && (
                  <p className="text-xs text-gray-500 mb-3">{card.subtitle}</p>
                )}

                {/* Mini Chart */}
                {card.trend && (
                  <div className="mt-4">
                    {renderMiniChart(card.trend)}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary Stats */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-1">
              {dashboardStats?.revenueChange != null ? `${dashboardStats.revenueChange.toFixed(1)}%` : '—'}
            </div>
            <p className="text-sm text-gray-600">Revenue Growth</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-1">
              {dashboardStats?.totalCustomers != null ? dashboardStats.totalCustomers.toLocaleString() : '—'}
            </div>
            <p className="text-sm text-gray-600">Total Customers</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-1">
              {dashboardStats?.returningCustomers != null ? dashboardStats.returningCustomers.toLocaleString() : '—'}
            </div>
            <p className="text-sm text-gray-600">Returning Customers</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600 mb-1">
              {dashboardStats?.avgOrderValue != null ? formatPriceFromUSD(dashboardStats.avgOrderValue) : '—'}
            </div>
            <p className="text-sm text-gray-600">Avg Order Value</p>
          </div>
        </div>
      </div>

      {/* Quick Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Products</h3>
          <div className="space-y-3">
            {dashboardStats?.topProducts?.length ? (
              dashboardStats.topProducts.map((product: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Package className="w-4 h-4 text-gray-700" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-600">{product.sales} sales this month</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatPriceFromUSD(product.revenue)}</p>
                    <p className="text-sm text-green-600">Top seller</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500">No product analytics available yet.</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Insights</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">New Customers</span>
              <div className="text-right">
                <p className="font-semibold">{dashboardStats?.newCustomersThisMonth != null ? dashboardStats.newCustomersThisMonth.toLocaleString() : '—'}</p>
                <p className="text-sm text-gray-500">Past 30 days</p>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Returning Customers</span>
              <div className="text-right">
                <p className="font-semibold">{dashboardStats?.returningCustomers != null ? dashboardStats.returningCustomers.toLocaleString() : '—'}</p>
                <p className="text-sm text-gray-500">Repeat buyers</p>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Orders</span>
              <div className="text-right">
                <p className="font-semibold">{dashboardStats?.totalOrders != null ? dashboardStats.totalOrders.toLocaleString() : '—'}</p>
                <p className="text-sm text-gray-500">Since launch</p>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Avg Order Value</span>
              <div className="text-right">
                <p className="font-semibold">{dashboardStats?.avgOrderValue != null ? formatPriceFromUSD(dashboardStats.avgOrderValue) : '—'}</p>
                <p className="text-sm text-gray-500">Based on current orders</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnalyticsCards
