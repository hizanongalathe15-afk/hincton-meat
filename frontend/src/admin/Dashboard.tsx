import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Package, 
  ShoppingCart, 
  Users, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Activity,
  Gauge,
} from 'lucide-react'
import { dashboardApi, systemApi } from '../services/adminApi'
import { formatPrice } from '../utils/currency'
import { useAuth } from '../contexts/AuthContext'
import { useSiteContent } from '../contexts/SiteContentContext'

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

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical'
  score: number
  issues: string[]
  metrics: { cpu: number; memory: number; storage: number; latency: number }
}

const AdminDashboard = () => {
  const navigate = useNavigate()
  const { user, updateProfile } = useAuth()
  const { profile } = useSiteContent()
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
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [showAdminWelcome, setShowAdminWelcome] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.sessionStorage.getItem('hincton:admin-welcome-pending') === 'true'
  })
  const [adminDisplayName, setAdminDisplayName] = useState(user?.profile?.fullName || user?.name || '')
  const [savingAdminName, setSavingAdminName] = useState(false)

  const adminName = user?.profile?.fullName || user?.name || user?.email || 'Admin'
  const adminIdentifier = user?.email || user?.id || 'verified admin session'
  const closeAdminWelcome = () => {
    window.sessionStorage.removeItem('hincton:admin-welcome-pending')
    setShowAdminWelcome(false)
  }
  const confirmAdminName = async () => {
    const cleanName = adminDisplayName.trim()
    if (cleanName.length < 2) return

    setSavingAdminName(true)
    try {
      await updateProfile({ name: cleanName })
      closeAdminWelcome()
    } finally {
      setSavingAdminName(false)
    }
  }

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
    systemApi.getHealth().then((response) => setSystemHealth(response.health)).catch(() => undefined)
    const intervalId = window.setInterval(fetchDashboardData, 15000)
    const healthIntervalId = window.setInterval(() => {
      systemApi.getHealth().then((response) => setSystemHealth(response.health)).catch(() => undefined)
    }, 60000)
    const handleVisibilityChange = () => {
      if (!document.hidden) fetchDashboardData()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.clearInterval(intervalId)
      window.clearInterval(healthIntervalId)
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
      {showAdminWelcome && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center overflow-hidden bg-black px-4">
          <div className="absolute inset-0 bg-[linear-gradient(125deg,rgba(127,29,29,0.96)_0%,rgba(127,29,29,0.96)_49%,rgba(15,23,42,0.98)_50%,rgba(3,7,18,1)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.20),transparent_24%),radial-gradient(circle_at_78%_18%,rgba(248,113,113,0.20),transparent_28%)]" />
          <div className="absolute inset-y-0 left-1/2 w-1 -translate-x-1/2 -rotate-[18deg] bg-gradient-to-b from-transparent via-white/70 to-transparent blur-sm" />
          <div className="floating-4d relative w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/30 bg-white/15 p-1 shadow-2xl shadow-red-950/40 backdrop-blur-2xl">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
            <div className="relative overflow-hidden rounded-[1.7rem] bg-white/10 p-8 text-white">
              <div className="absolute -left-1/3 top-0 h-full w-1/3 rotate-12 bg-gradient-to-r from-transparent via-white/25 to-transparent blur-sm animate-[pulse_2.8s_ease-in-out_infinite]" />
              <div className="relative grid gap-8 md:grid-cols-[0.85fr_1.15fr] md:items-center">
                <div className="grid place-items-center">
                  <div className="space-y-5 text-center md:text-left">
                    <div className="mx-auto rounded-[1.5rem] border border-white/30 bg-white/90 p-5 shadow-xl md:mx-0">
                      <img src={profile.images.logo || profile.brand.logo} alt={profile.brand.name} className="h-28 w-28 object-contain" />
                    </div>
                    <div>
                      <h2 className="particle-text mt-2 text-4xl font-black">Welcome Back</h2>
                      <p className="mt-3 text-red-50/90">Your admin workspace is ready for products, orders, content, and customer care.</p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-red-100">
                    <ShieldCheck className="h-4 w-4 text-yellow-300" />
                    Secure admin session verified
                  </p>
                  <h1 className="particle-text text-3xl font-black leading-tight md:text-5xl">
                    <span className="typewriter-glow">Welcome, {adminDisplayName.trim() || adminName}</span>
                  </h1>
                  <p className="mt-4 text-base leading-7 text-red-50 md:text-lg">
                    Product updates, orders, content, chat replies, and operational changes are tied to your authenticated admin identity so the team can trace decisions and resolve issues clearly.
                  </p>
                  <div className="mt-5 rounded-2xl border border-white/15 bg-white/10 p-4 text-sm text-red-50">
                    <p className="m-0 font-semibold">Signed in as: {adminIdentifier}</p>
                    <p className="m-0 mt-1 text-red-100/80">Keep your real admin profile name updated before making sensitive changes.</p>
                  </div>
                  <label className="mt-5 block">
                    <span className="mb-2 block text-sm font-bold text-red-50">Confirm real admin name</span>
                    <input
                      value={adminDisplayName}
                      onChange={(event) => setAdminDisplayName(event.target.value)}
                      placeholder="Example: Nancy"
                      className="w-full rounded-full border border-white/25 bg-white/15 px-5 py-3 font-semibold text-white placeholder:text-red-100/50 outline-none ring-0 backdrop-blur-xl focus:border-yellow-200"
                    />
                  </label>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={confirmAdminName}
                      disabled={adminDisplayName.trim().length < 2 || savingAdminName}
                      className="glass-button bg-red-600/80 px-5 py-3 font-bold text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {savingAdminName ? 'Saving Name...' : 'Save Name & Enter'}
                    </button>
                    <button type="button" onClick={() => navigate('/admin/profile')} className="glass-button px-5 py-3 font-bold text-white">
                      Update Admin Name
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
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
            <button key={index} type="button" onClick={() => navigate(card.path)} className="glass-panel rounded-3xl p-6 text-left transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-500">
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

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.15fr_repeat(4,minmax(0,1fr))]">
        <button type="button" onClick={() => navigate('/admin/system-metrics')} className="rounded-3xl border border-gray-200 bg-gradient-to-br from-slate-950 to-slate-800 p-5 text-left text-white shadow-lg transition hover:-translate-y-0.5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-300">System health</p>
              <p className="mt-2 text-3xl font-black">{systemHealth?.score ?? '--'}<span className="text-base font-semibold text-slate-300">/100</span></p>
              <p className="mt-2 text-sm text-slate-300">{systemHealth?.issues?.[0] || 'All monitored services are operating normally.'}</p>
            </div>
            <ShieldCheck className={`h-7 w-7 ${systemHealth?.status === 'critical' ? 'text-red-300' : systemHealth?.status === 'warning' ? 'text-amber-300' : 'text-emerald-300'}`} />
          </div>
        </button>
        {[
          { label: 'CPU', value: systemHealth?.metrics.cpu, icon: Activity },
          { label: 'Memory', value: systemHealth?.metrics.memory, icon: Gauge },
          { label: 'Storage', value: systemHealth?.metrics.storage, icon: Package },
          { label: 'Network', value: systemHealth?.metrics.latency, icon: Activity, suffix: 'ms' },
        ].map((item) => {
          const Icon = item.icon
          const value = item.value
          const isAlert = typeof value === 'number' && (item.suffix ? value > 200 : value > 80)
          return <button key={item.label} type="button" onClick={() => navigate('/admin/system-metrics')} className="rounded-3xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between"><span className="text-sm font-semibold text-gray-600">{item.label}</span><Icon className={`h-4 w-4 ${isAlert ? 'text-red-600' : 'text-gray-400'}`} /></div>
            <p className={`mt-3 text-2xl font-black ${isAlert ? 'text-red-700' : 'text-gray-950'}`}>{typeof value === 'number' ? `${value.toFixed(item.suffix ? 0 : 1)}${item.suffix || '%'}` : '--'}</p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-100"><div className={`h-full rounded-full ${isAlert ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, item.suffix ? (value || 0) / 3 : value || 0)}%` }} /></div>
          </button>
        })}
      </section>

      <div className="glass-panel rounded-3xl">
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Latest Abandoned Carts</h2>
            <p className="text-sm text-gray-600">Buyer and guest carts with real items, age, reminder count, and stock-pressure status.</p>
          </div>
          <ShoppingCart className="h-5 w-5 text-gray-500" />
        </div>
        <div className="overflow-x-auto rounded-b-3xl">
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
        <div className="glass-panel rounded-3xl">
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
        <div className="glass-panel rounded-3xl">
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
