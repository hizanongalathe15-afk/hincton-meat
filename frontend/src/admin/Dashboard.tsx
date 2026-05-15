import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Package, 
  ShoppingCart, 
  Users, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { dashboardApi } from '../services/adminApi'
import { formatPrice } from '../utils/currency'

interface DashboardStats {
  totalRevenue: number
  totalOrders: number
  totalProducts: number
  totalUsers: number
  revenueChange: number
  ordersChange: number
  productsChange: number
  usersChange: number
}

interface RecentOrder {
  id: string
  orderNumber: string
  customer: string
  amount: number
  status: 'pending' | 'processing' | 'shipped' | 'delivered'
  date: string
}

interface TopProduct {
  id: string
  name: string
  sales: number
  revenue: number
  stock: number
}

interface AbandonedCart {
  id: string
  customerName: string
  customerEmail?: string
  customerPhone?: string
  items: Array<{ name?: string; productName?: string; quantity?: number; price?: number }>
  totalAmount: number
  abandonedAt: string
  recoveryEmailsSent: number
  recoveryStatus: string
}

const AdminDashboard = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalUsers: 0,
    revenueChange: 0,
    ordersChange: 0,
    productsChange: 0,
    usersChange: 0
  })
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [abandonedCarts, setAbandonedCarts] = useState<AbandonedCart[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const data = await dashboardApi.getOverview()
        
        // Transform API data to component format
        setStats({
          totalRevenue: Number(data.overview.totalSalesMonth) || 0,
          totalOrders: data.overview.totalOrders || 0,
          totalProducts: data.overview.totalProducts || 0,
          totalUsers: data.overview.totalUsers || 0,
          revenueChange: Number(data.overview.changes?.revenue) || 0,
          ordersChange: Number(data.overview.changes?.orders) || 0,
          productsChange: Number(data.overview.changes?.products) || 0,
          usersChange: Number(data.overview.changes?.users) || 0
        })

        // Transform recent orders
        const transformedOrders = (data.recentOrders || []).slice(0, 5).map((order: any) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          customer: order.user?.email || order.guestEmail || 'Unknown',
          amount: Number(order.totalAmount) || 0,
          status: order.status,
          date: new Date(order.createdAt).toLocaleDateString()
        }))
        setRecentOrders(transformedOrders)

        // Transform top products
        const transformedProducts = (data.topProducts || []).map((item: any) => ({
          id: item.productId,
          name: item.product?.name || 'Unknown Product',
          sales: Number(item._sum.quantity) || 0,
          revenue: Number(item.product?.price || 0) * Number(item._sum.quantity || 0),
          stock: Number(item.product?.stockQuantity || 0)
        }))
        setTopProducts(transformedProducts)
        setAbandonedCarts((data.abandonedCarts || []).map((cart: any) => ({
          id: cart.id,
          customerName: cart.customerName,
          customerEmail: cart.customerEmail,
          customerPhone: cart.customerPhone,
          items: cart.items || [],
          totalAmount: Number(cart.totalAmount) || 0,
          abandonedAt: cart.abandonedAt,
          recoveryEmailsSent: Number(cart.recoveryEmailsSent) || 0,
          recoveryStatus: cart.recoveryStatus || 'abandoned',
        })))
        setLastUpdated(data.generatedAt || new Date().toISOString())

      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
    const intervalId = window.setInterval(fetchDashboardData, 15000)
    const handleVisibilityChange = () => {
      if (!document.hidden) fetchDashboardData()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const statCards = [
    {
      title: 'Total Revenue',
      value: formatPrice(stats.totalRevenue),
      change: stats.revenueChange,
      icon: DollarSign,
      color: 'bg-green-500',
      path: '/admin/analytics'
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders.toLocaleString(),
      change: stats.ordersChange,
      icon: ShoppingCart,
      color: 'bg-blue-500',
      path: '/admin/orders'
    },
    {
      title: 'Products',
      value: stats.totalProducts.toLocaleString(),
      change: stats.productsChange,
      icon: Package,
      color: 'bg-purple-500',
      path: '/admin/products'
    },
    {
      title: 'Users',
      value: stats.totalUsers.toLocaleString(),
      change: stats.usersChange,
      icon: Users,
      color: 'bg-orange-500',
      path: '/admin/users'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      case 'shipped': return 'bg-purple-100 text-purple-800'
      case 'delivered': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">
          Live store data refreshes every 15 seconds{lastUpdated ? `, last updated ${new Date(lastUpdated).toLocaleTimeString()}` : ''}.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon
          const isPositive = card.change > 0
          
          return (
            <button key={index} type="button" onClick={() => navigate(card.path)} className="bg-white rounded-lg shadow p-6 text-left transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                  <div className="flex items-center mt-2">
                    {isPositive ? (
                      <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
                    )}
                    <span className={`text-sm font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                      {Math.abs(card.change)}%
                    </span>
                    <span className="text-sm text-gray-500 ml-1">from last month</span>
                  </div>
                </div>
                <div className={`${card.color} p-3 rounded-full`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Latest Abandoned Carts</h2>
            <p className="text-sm text-gray-600">Buyer and guest carts with real items, age, reminder count, and stock-pressure status.</p>
          </div>
          <ShoppingCart className="h-5 w-5 text-gray-500" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Buyer</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Products Left</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Abandoned</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {abandonedCarts.map((cart) => (
                <tr key={cart.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">
                    <div className="font-medium text-gray-900">{cart.customerName}</div>
                    <div className="text-gray-500">{cart.customerEmail || cart.customerPhone || 'Guest session'}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {cart.items.length > 0 ? cart.items.slice(0, 3).map((item, index) => (
                      <div key={`${cart.id}-${index}`}>{item.quantity || 1}x {item.name || item.productName || 'Product'}</div>
                    )) : 'No item snapshot'}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{formatPrice(cart.totalAmount)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{new Date(cart.abandonedAt).toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="rounded-full bg-orange-100 px-2 py-1 text-xs font-semibold text-orange-800">
                      {cart.recoveryStatus} · {cart.recoveryEmailsSent} reminders
                    </span>
                  </td>
                </tr>
              ))}
              {abandonedCarts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">No abandoned carts tracked yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentOrders.map((order) => (
                  <tr key={order.id} onClick={() => navigate('/admin/orders')} className="cursor-pointer hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.orderNumber || order.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.customer}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatPrice(order.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
                      No orders yet. New orders will appear here with customer, amount, and status.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Top Products</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sales</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topProducts.map((product) => (
                  <tr key={product.id} onClick={() => navigate('/admin/products')} className="cursor-pointer hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {product.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.sales}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatPrice(product.revenue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        product.stock < 10 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {product.stock}
                      </span>
                    </td>
                  </tr>
                ))}
                {topProducts.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
                      No product sales yet. Products will rank here after completed order items exist.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
