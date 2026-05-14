import { useState, useEffect } from 'react'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { Calendar, TrendingUp, DollarSign } from 'lucide-react'
import { analyticsApi } from '../services/adminApi'
import toast from 'react-hot-toast'
import { formatPrice } from '../utils/currency'

interface SalesData {
  date: string
  revenue: number
  orders: number
  customers: number
}

interface CategoryData {
  name: string
  value: number
  color: string
}

interface SalesChartProps {
  timeRange?: 'week' | 'month' | 'quarter' | 'year'
  onTimeRangeChange?: (range: 'week' | 'month' | 'quarter' | 'year') => void
  data?: SalesData[]
  categoryData?: CategoryData[]
  loading?: boolean
}

const SalesChart = ({ 
  timeRange = 'month', 
  onTimeRangeChange,
  data,
  categoryData,
  loading = false 
}: SalesChartProps) => {
  const [chartType, setChartType] = useState<'line' | 'bar'>('line')
  const [salesData, setSalesData] = useState<SalesData[]>([])
  const [categories, setCategories] = useState<CategoryData[]>([])
  const [apiLoading, setApiLoading] = useState(true)

  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        setApiLoading(true)
        const response = await analyticsApi.getSalesAnalytics(timeRange === 'week' ? '7' : timeRange === 'month' ? '30' : timeRange === 'quarter' ? '90' : '365')
        
        // Transform API data to expected format
        const transformedData: SalesData[] = (response.salesData || []).map((item: any) => ({
          date: new Date(item.date).toLocaleDateString(),
          revenue: Number(item.revenue) || 0,
          orders: Number(item.orders) || 0,
          customers: Number(item.customers) || 0
        }))
        
        setSalesData(transformedData)
        
        const defaultCategoryData: CategoryData[] = [
          { name: 'Beef', value: 45, color: '#ef4444' },
          { name: 'Chicken', value: 25, color: '#f59e0b' },
          { name: 'Lamb', value: 15, color: '#10b981' },
          { name: 'Seafood', value: 10, color: '#3b82f6' },
          { name: 'Other', value: 5, color: '#8b5cf6' },
        ]
        setCategories((response.categoryData && response.categoryData.length > 0) ? response.categoryData : defaultCategoryData)
        
      } catch (error) {
        console.error('Failed to fetch sales data:', error)
        toast.error('Failed to load sales analytics')
        setSalesData([])
        setCategories([])
      } finally {
        setApiLoading(false)
      }
    }

    if (!data && !categoryData) {
      fetchSalesData()
    } else {
      setSalesData(data || [])
      setCategories(categoryData || [])
      setApiLoading(false)
    }
  }, [data, categoryData, timeRange])

  const timeRanges = [
    { value: 'week', label: 'Last 7 Days' },
    { value: 'month', label: 'Last 30 Days' },
    { value: 'quarter', label: 'Last Quarter' },
    { value: 'year', label: 'Last Year' }
  ]

  const totalRevenue = salesData.reduce((sum, item) => sum + item.revenue, 0)
  const totalOrders = salesData.reduce((sum, item) => sum + item.orders, 0)
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.name === 'Revenue' ? formatPrice(entry.value) : entry.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  if (loading || apiLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="h-96 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading sales data...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Chart Controls */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Sales Overview</h2>
            <p className="text-gray-600">Track your revenue and sales performance</p>
          </div>
          <div className="flex gap-2">
            <select
              value={timeRange}
              onChange={(e) => onTimeRangeChange?.(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              {timeRanges.map(range => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setChartType('line')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  chartType === 'line' 
                    ? 'bg-white text-gray-900 shadow' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Line
              </button>
              <button
                onClick={() => setChartType('bar')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  chartType === 'bar' 
                    ? 'bg-white text-gray-900 shadow' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Bar
              </button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="text-sm text-gray-600">Total Revenue</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatPrice(totalRevenue)}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-gray-600">Total Orders</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {totalOrders.toLocaleString()}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-purple-600" />
              <span className="text-sm text-gray-600">Avg Order Value</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatPrice(avgOrderValue)}
            </p>
          </div>
        </div>

        {/* Main Chart */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'line' ? (
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  stroke="#6b7280"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={12}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  name="Revenue"
                  dot={{ fill: '#ef4444', r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="orders" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Orders"
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            ) : (
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  stroke="#6b7280"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={12}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="revenue" 
                  fill="#ef4444" 
                  name="Revenue"
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="orders" 
                  fill="#3b82f6" 
                  name="Orders"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales by Category</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categories}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Categories</h3>
          <div className="space-y-3">
            {categories.map((category, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: category.color }}
                  ></div>
                  <span className="font-medium text-gray-900">{category.name}</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{category.value}%</p>
                  <p className="text-sm text-gray-600">
                    ${((totalRevenue * category.value) / 100).toFixed(0)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SalesChart
