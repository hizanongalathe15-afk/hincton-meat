import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Package, Heart, RotateCcw, LifeBuoy, Wallet, Award, ChevronRight,
  ShoppingBag, Sparkles, HelpCircle, FileText, AlertTriangle, Bell, MapPin, Clock, CreditCard, TrendingUp, MessageCircle
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import {
  ordersApi, wishlistApi, supportTicketsApi, loyaltyApi, invoicesApi, alertsApi, returnsApiExtended,
} from '../services/buyerApi'
import { formatPrice } from '../utils/currency'

interface StatCard {
  label: string
  value: string | number
  icon: any
  accent: string
  action?: string
}

const BuyerDashboard = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<{
    orders: number;
    ordersTotal: number;
    wishlist: number;
    tickets: number;
    openTickets: number;
    points: number;
    tier: string;
    invoices: number;
    returns: number;
    alerts: number;
  }>({
    orders: 0, ordersTotal: 0, wishlist: 0, tickets: 0, openTickets: 0,
    points: 0, tier: 'Bronze', invoices: 0, returns: 0, alerts: 0,
  })
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [recentTickets, setRecentTickets] = useState<any[]>([])

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    const load = async () => {
      setLoading(true)
      try {
        const [orders, wishlist, tickets, loyalty, invoices, alerts, returns] = await Promise.all([
          ordersApi.getMyOrders().catch(() => ({ orders: [] })),
          wishlistApi.getWishlist().catch(() => ({ wishlist: { items: [] } })),
          supportTicketsApi.getMyTickets().catch(() => ({ tickets: [] })),
          loyaltyApi.getLoyaltySummary().catch(() => ({ points: 0, tier: 'Bronze', redemptions: [] })),
          invoicesApi.getMyInvoices().catch(() => ({ invoices: [] })),
          alertsApi.getMyAlerts().catch(() => ({ alerts: [] })),
          returnsApiExtended.getMyReturns().catch(() => ({ returns: [] })),
        ])
        const orderList = (orders.orders || []) as any[]
        const openTicketsCount = (tickets.tickets || []).filter((t: any) => t.status !== 'CLOSED' && t.status !== 'RESOLVED').length
        const total = orderList.reduce((s: number, o: any) => s + Number(o.totalAmount || 0), 0)
        setStats({
          orders: orderList.length,
          ordersTotal: total,
          wishlist: wishlist.wishlist?.items?.length || 0,
          tickets: tickets.tickets?.length || 0,
          openTickets: openTicketsCount,
          points: Number(loyalty.points || 0),
          tier: loyalty.tier || (Number(loyalty.points || 0) >= 5000 ? 'Platinum' : Number(loyalty.points || 0) >= 2000 ? 'Gold' : Number(loyalty.points || 0) >= 500 ? 'Silver' : 'Bronze'),
          invoices: invoices.invoices?.length || 0,
          returns: returns.returns?.length || 0,
          alerts: alerts.alerts?.length || 0,
        })
        setRecentOrders(orderList.slice(0, 5))
        setRecentTickets((tickets.tickets || []).slice(0, 5))
      } catch (err: any) {
        console.error(err)
        toast.error('Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user, navigate])

  const quickActions: { icon: any; label: string; desc: string; onClick: () => void; color: string }[] = [
    { icon: ShoppingBag, label: 'Browse Shop', desc: 'Explore premium cuts & deli', onClick: () => navigate('/shop'), color: 'from-red-600 to-red-800' },
    { icon: Package, label: 'Track Orders', desc: 'Check delivery status', onClick: () => navigate('/profile?tab=orders'), color: 'from-blue-600 to-blue-800' },
    { icon: LifeBuoy, label: 'Support Tickets', desc: 'Talk to our team', onClick: () => navigate('/profile?tab=tickets'), color: 'from-amber-600 to-amber-800' },
    { icon: Heart, label: 'My Wishlist', desc: 'Saved favorites', onClick: () => navigate('/profile?tab=wishlist'), color: 'from-pink-600 to-pink-800' },
    { icon: RotateCcw, label: 'Returns & Refunds', desc: 'Self-service returns', onClick: () => navigate('/profile?tab=returns'), color: 'from-purple-600 to-purple-800' },
    { icon: Wallet, label: 'Wallet / Payments', desc: 'Payment methods & cards', onClick: () => navigate('/wallet'), color: 'from-emerald-600 to-emerald-800' },
    { icon: FileText, label: 'Invoices', desc: 'Download receipts', onClick: () => navigate('/profile?tab=invoices'), color: 'from-indigo-600 to-indigo-800' },
    { icon: Award, label: 'Loyalty Rewards', desc: 'Redeem your points', onClick: () => navigate('/profile?tab=loyalty'), color: 'from-yellow-600 to-yellow-800' },
  ]

  const statCards: StatCard[] = [
    { label: 'Total Orders', value: stats.orders, icon: Package, accent: 'bg-blue-50 text-blue-700', action: '/profile?tab=orders' },
    { label: 'Amount Spent', value: formatPrice(stats.ordersTotal), icon: CreditCard, accent: 'bg-emerald-50 text-emerald-700' },
    { label: 'Wishlist', value: stats.wishlist, icon: Heart, accent: 'bg-pink-50 text-pink-700', action: '/profile?tab=wishlist' },
    { label: 'Open Tickets', value: stats.openTickets, icon: LifeBuoy, accent: 'bg-amber-50 text-amber-700', action: '/profile?tab=tickets' },
    { label: 'Loyalty Points', value: stats.points.toLocaleString(), icon: Award, accent: 'bg-yellow-50 text-yellow-700', action: '/profile?tab=loyalty' },
    { label: 'Active Alerts', value: stats.alerts, icon: AlertTriangle, accent: 'bg-red-50 text-red-700', action: '/profile?tab=alerts' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-950 via-[#9f2f20] to-gray-950 text-white">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute -top-20 -right-32 h-80 w-80 rounded-full bg-yellow-400 blur-3xl" />
          <div className="absolute -bottom-20 -left-32 h-80 w-80 rounded-full bg-red-500 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 backdrop-blur-sm border border-white/10">
                <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-red-200">{stats.tier} Member</span>
              </div>
              <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">
                Welcome back, {user?.name?.split(' ')[0] || 'Friend'}
              </h1>
              <p className="mt-3 max-w-2xl text-red-100">
                Manage your orders, earn loyalty rewards, and reach our concierge team whenever you need a hand.
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 p-5 min-w-[180px]">
              <p className="text-xs font-bold uppercase tracking-wide text-red-200">Loyalty Points</p>
              <p className="mt-1 text-4xl font-black">{stats.points.toLocaleString()}</p>
              <Link to="/profile?tab=loyalty" className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-yellow-300 hover:text-white">
                View Rewards <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-10">
        {/* Stats */}
        <section>
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="h-28 animate-pulse rounded-2xl border border-gray-200 bg-white" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {statCards.map((c) => (
                <button
                  key={c.label}
                  onClick={() => c.action && navigate(c.action)}
                  className={`group flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm text-left ${c.action ? 'hover:border-red-300 hover:shadow-md transition-all' : ''}`}
                >
                  <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${c.accent}`}>
                    <c.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{c.label}</p>
                    <p className="mt-1 text-2xl font-extrabold text-gray-950">{c.value}</p>
                  </div>
                  {c.action && <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-red-600 self-end" />}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Quick Actions */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-950">Quick Actions</h2>
              <p className="text-sm text-gray-600">Jump to what you need in one tap.</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((a) => (
              <button
                key={a.label}
                onClick={a.onClick}
                className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
              >
                <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${a.color} text-white shadow-sm`}>
                  <a.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-bold text-gray-950 group-hover:text-[#9f2f20]">{a.label}</h3>
                <p className="mt-1 text-sm text-gray-600">{a.desc}</p>
                <ChevronRight className="absolute bottom-5 right-5 h-4 w-4 text-gray-300 group-hover:text-[#9f2f20]" />
              </button>
            ))}
          </div>
        </section>

        {/* Recent Orders + Tickets */}
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
              <div>
                <h3 className="text-lg font-bold text-gray-950">Recent Orders</h3>
                <p className="text-sm text-gray-500">Your last 5 orders</p>
              </div>
              <Link to="/profile?tab=orders" className="inline-flex items-center gap-1 text-sm font-bold text-red-700 hover:text-red-800">
                All Orders <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            {loading || recentOrders.length === 0 ? (
              <div className="p-8 text-center">
                <Package className="mx-auto h-10 w-10 text-gray-300" />
                <p className="mt-3 text-sm text-gray-500">No recent orders.</p>
                <button onClick={() => navigate('/shop')} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700">
                  <ShoppingBag className="h-3.5 w-3.5" /> Start Shopping
                </button>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {recentOrders.map((o) => (
                  <li key={o.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50">
                    <div>
                      <p className="font-semibold text-gray-900">{o.orderNumber}</p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="h-3 w-3" /> {new Date(o.createdAt).toLocaleDateString()}
                        <span className="mx-1">·</span>
                        {(o.items?.length || 0)} items
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <div>
                        <p className="font-bold text-gray-950">{formatPrice(Number(o.totalAmount || 0))}</p>
                        <span className={`inline-block mt-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          o.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                          o.status === 'OUT_FOR_DELIVERY' ? 'bg-blue-100 text-blue-800' :
                          o.status === 'PROCESSING' ? 'bg-purple-100 text-purple-800' :
                          o.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {(o.status || 'PENDING').replace(/_/g, ' ')}
                        </span>
                      </div>
                      <button onClick={() => navigate(`/order-tracking/${o.id}`)} className="rounded-lg border border-gray-200 p-2 hover:bg-red-50 hover:border-red-200">
                        <ChevronRight className="h-4 w-4 text-gray-500" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
              <div>
                <h3 className="text-lg font-bold text-gray-950">Recent Support</h3>
                <p className="text-sm text-gray-500">Your latest conversations with our team</p>
              </div>
              <div className="flex items-center gap-2">
                <Link to="/help" className="inline-flex items-center gap-1 text-xs font-bold text-gray-600 hover:text-gray-800">
                  <HelpCircle className="h-3.5 w-3.5" /> Help Center
                </Link>
                <Link to="/profile?tab=tickets" className="inline-flex items-center gap-1 text-sm font-bold text-red-700 hover:text-red-800">
                  All Tickets <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            {loading || recentTickets.length === 0 ? (
              <div className="p-8 text-center">
                <MessageCircle className="mx-auto h-10 w-10 text-gray-300" />
                <p className="mt-3 text-sm text-gray-500">No recent support tickets.</p>
                <button onClick={() => navigate('/profile?tab=tickets')} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700">
                  <LifeBuoy className="h-3.5 w-3.5" /> Open a Ticket
                </button>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {recentTickets.map((t) => (
                  <li key={t.id} className="flex items-start justify-between gap-3 px-6 py-4 hover:bg-gray-50 cursor-pointer" onClick={() => navigate('/profile?tab=tickets')}>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{t.subject}</p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                        <span className="truncate">#{t.ticketNumber || t.id?.slice(0, 8)?.toUpperCase()}</span>
                        <span>·</span>
                        <span>{new Date(t.createdAt || t.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      t.status === 'RESOLVED' ? 'bg-green-100 text-green-800' :
                      t.status === 'CLOSED' ? 'bg-gray-100 text-gray-700' :
                      t.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                      t.status === 'WAITING_ON_CUSTOMER' ? 'bg-purple-100 text-purple-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {(t.status || 'OPEN').replace(/_/g, ' ')}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Help + Proactive CTA */}
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-r from-white to-red-50 shadow-sm">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="p-8">
              <h3 className="text-2xl font-extrabold text-gray-950">Need help with something?</h3>
              <p className="mt-2 text-gray-700 max-w-md">
                Browse the FAQ, read step-by-step guides, or send us a message — real humans reply within one business day.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link to="/help" className="inline-flex items-center gap-2 rounded-xl bg-gray-950 px-5 py-3 text-sm font-bold text-white hover:bg-gray-800">
                  <HelpCircle className="h-4 w-4" /> Visit Help Center
                </Link>
                <Link to="/contact" className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-bold text-gray-900 hover:bg-gray-50">
                  <Bell className="h-4 w-4" /> Contact Form
                </Link>
                <Link to="/profile?tab=tickets" className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white hover:bg-red-700">
                  <TrendingUp className="h-4 w-4" /> Check Tickets
                </Link>
              </div>
            </div>
            <div className="hidden md:flex items-center justify-center p-8 bg-gradient-to-bl from-red-50 via-white to-white relative">
              <div className="relative rounded-3xl bg-white p-6 shadow-2xl border border-gray-100 w-full max-w-xs rotate-2">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-red-100 p-2"><MapPin className="h-5 w-5 text-red-700" /></div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Shipping</p>
                    <p className="font-bold text-gray-950">Free delivery available</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <div className="rounded-full bg-emerald-100 p-2"><Award className="h-5 w-5 text-emerald-700" /></div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Loyalty</p>
                    <p className="font-bold text-gray-950">Earn points on every order</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <div className="rounded-full bg-blue-100 p-2"><Package className="h-5 w-5 text-blue-700" /></div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Quality</p>
                    <p className="font-bold text-gray-950">100% fresh guaranteed</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default BuyerDashboard
