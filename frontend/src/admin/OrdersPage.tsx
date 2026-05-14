import { useState, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'
import OrderTable from './OrderTable'
import { ordersApi } from '../services/adminApi'
import toast from 'react-hot-toast'
import { formatPrice } from '../utils/currency'

type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'refunded'
  | 'returned'
  | 'partially_shipped'
  | 'on_hold'
  | 'awaiting_payment'
  | 'payment_failed'
type PaymentStatus = 'unpaid' | 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded' | 'authorized' | 'voided' | 'expired'

type Order = {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  total: number
  items: number
  createdAt: string
  estimatedDelivery?: string
  trackingNumber?: string
  shippingAddress: {
    street: string
    city: string
    state: string
    zipCode: string
  }
  paymentMethod: string
  notes?: string
}

interface OrdersPageProps {
  onViewOrder?: (order: any) => void
  onUpdateOrderStatus?: (orderId: string, status: string) => void
  onAssignTracking?: (orderId: string, trackingNumber: string) => void
}

const OrdersPage = ({
  onViewOrder,
  onUpdateOrderStatus,
  onAssignTracking
}: OrdersPageProps) => {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(true)

  const fetchOrders = async () => {
    try {
      const data = await ordersApi.getOrders()
      
      // Transform API data to component format
      const transformedOrders = (data.orders || []).map((order: any) => {
        const shippingAddress = order.shippingAddress ? 
          (typeof order.shippingAddress === 'string' ? 
            JSON.parse(order.shippingAddress) : 
            order.shippingAddress) : 
          { street: '', city: '', state: '', zipCode: '' }

        return {
          id: order.id,
          orderNumber: order.orderNumber,
          customerName: order.user?.profile?.firstName && order.user?.profile?.lastName 
            ? `${order.user.profile.firstName} ${order.user.profile.lastName}`
            : order.user?.username || order.guestEmail || 'Unknown',
          customerEmail: order.user?.email || order.guestEmail || '',
          customerPhone: order.user?.phone || order.user?.profile?.mpesaPhone || order.guestPhone || '',
          status: String(order.status || 'pending').toLowerCase(),
          paymentStatus: String(order.paymentStatus || 'pending').toLowerCase(),
          total: Number(order.totalAmount) || 0,
          items: order.orderItems?.length || 0,
          createdAt: order.createdAt,
          estimatedDelivery: order.estimatedDelivery,
          trackingNumber: order.trackingNumber,
          shippingAddress: {
            street: shippingAddress.address || shippingAddress.addressLine1 || shippingAddress.street || '',
            city: shippingAddress.city || '',
            state: shippingAddress.state || '',
            zipCode: shippingAddress.zipCode || ''
          },
          paymentMethod: order.payments?.[0]?.paymentMethod || order.paymentMethod || 'Unknown',
          notes: order.notes
        }
      })
      
      setOrders(transformedOrders)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
    
    // Auto-refresh every 10 seconds so newly placed orders reach the admin quickly.
    const intervalId = isAutoRefreshing ? setInterval(fetchOrders, 10000) : undefined
    
    // Refresh when tab becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchOrders()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      if (intervalId) clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isAutoRefreshing])

  const handleView = (order: any) => {
    toast(`Order ${order.orderNumber}: ${order.customerEmail || order.customerName}, ${order.items} item(s)`)
    onViewOrder?.(order)
  }

  const handleUpdateStatus = async (orderId: string, status: string) => {
    try {
      await ordersApi.updateOrderStatus(orderId, { status: status.toUpperCase() })
      const nextStatus = status as OrderStatus
      setOrders(orders.map(order =>
        order.id === orderId ? { ...order, status: nextStatus } : order
      ))
      toast.success('Order status updated')
      onUpdateOrderStatus?.(orderId, status)
    } catch (error: any) {
      console.error('Failed to update order status:', error)
      toast.error(error.message || 'Failed to update order status')
    }
  }

  const handleAssignTracking = async (orderId: string, trackingNumber: string) => {
    try {
      const order = orders.find(o => o.id === orderId)
      if (order) {
        await ordersApi.updateOrderStatus(orderId, { 
          status: order.status.toUpperCase(), 
          trackingNumber 
        })
        setOrders(orders.map(order => 
          order.id === orderId ? { ...order, trackingNumber } : order
        ))
        onAssignTracking?.(orderId, trackingNumber)
      }
    } catch (error: any) {
      console.error('Failed to assign tracking:', error)
      toast.error(error.message || 'Failed to assign tracking')
    }
  }

  const refreshAfterAction = async (message: string) => {
    toast.success(message)
    await fetchOrders()
  }

  const handleAcceptOrder = async (orderId: string) => {
    try {
      await ordersApi.acceptOrder(orderId)
      await refreshAfterAction('Order accepted')
    } catch (error: any) {
      toast.error(error.message || 'Failed to accept order')
    }
  }

  const handleMarkPaid = async (orderId: string) => {
    if (!window.confirm('Mark this order as paid? Use this only after confirming payment.')) return
    try {
      await ordersApi.markPaid(orderId)
      await refreshAfterAction('Order marked as paid')
    } catch (error: any) {
      toast.error(error.message || 'Failed to mark order as paid')
    }
  }

  const handleCancelOrder = async (orderId: string) => {
    const reason = window.prompt('Cancellation reason')
    if (!reason?.trim()) return
    try {
      await ordersApi.cancelOrder(orderId, reason.trim())
      await refreshAfterAction('Order cancelled')
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel order')
    }
  }

  const handleRefundOrder = async (orderId: string) => {
    const order = orders.find((item) => item.id === orderId)
    const amountText = window.prompt('Refund amount', order ? String(order.total) : '')
    if (!amountText) return
    const reason = window.prompt('Refund reason')
    if (!reason?.trim()) return
    try {
      await ordersApi.refundOrder(orderId, { amount: Number(amountText), reason: reason.trim() })
      await refreshAfterAction('Refund recorded')
    } catch (error: any) {
      toast.error(error.message || 'Failed to record refund')
    }
  }

  const handleInternalNotes = async (orderId: string) => {
    const order = orders.find((item) => item.id === orderId)
    const notes = window.prompt('Internal notes. Customers will not see this.', order?.notes || '')
    if (!notes?.trim()) return
    try {
      await ordersApi.saveInternalNotes(orderId, notes.trim())
      await refreshAfterAction('Internal notes saved')
    } catch (error: any) {
      toast.error(error.message || 'Failed to save notes')
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-4">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Calculate summary statistics
  const totalOrders = orders.length
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0)
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
  const pendingOrders = orders.filter(o => o.status === 'pending').length
  const processingOrders = orders.filter(o => o.status === 'processing').length
  const shippedOrders = orders.filter(o => ['shipped', 'out_for_delivery', 'partially_shipped'].includes(o.status)).length
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length
  const paidOrders = orders.filter(o => o.paymentStatus === 'paid').length
  const pendingPayment = orders.filter(o => o.paymentStatus === 'pending').length

  return (
    <div className="space-y-6 p-6">
      {/* Header with Auto-Sync Controls */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orders Management</h1>
          <p className="text-gray-600 mt-1">
            {lastUpdated ? `Last updated: ${lastUpdated.toLocaleTimeString()}` : 'Loading...'}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchOrders}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Now
          </button>
          <button
            onClick={() => setIsAutoRefreshing(!isAutoRefreshing)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              isAutoRefreshing
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {isAutoRefreshing ? 'Auto-Sync ON' : 'Auto-Sync OFF'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-white">
                <circle cx="8" cy="21" r="1"></circle>
                <circle cx="19" cy="21" r="1"></circle>
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path>
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatPrice(totalRevenue)}</p>
            </div>
            <div className="bg-green-500 p-3 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-white">
                <line x1="12" x2="12" y1="2" y2="22"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Avg Order Value</p>
              <p className="text-2xl font-bold text-gray-900">{formatPrice(averageOrderValue)}</p>
            </div>
            <div className="bg-purple-500 p-3 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-white">
                <path d="m7.5 4.27 9 5.15"></path>
                <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path>
                <path d="m3.3 7 8.7 5 8.7-5"></path>
                <path d="M12 22V12"></path>
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Paid Orders</p>
              <p className="text-2xl font-bold text-gray-900">{paidOrders}</p>
              <p className="text-xs text-green-600 mt-1">{pendingPayment} pending payment</p>
            </div>
            <div className="bg-orange-500 p-3 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-white">
                <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
                <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Order Status Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-yellow-50 rounded-lg p-4">
            <p className="text-sm font-medium text-yellow-800 mb-1">Pending</p>
            <p className="text-2xl font-bold text-yellow-900">{pendingOrders}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-800 mb-1">Processing</p>
            <p className="text-2xl font-bold text-blue-900">{processingOrders}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm font-medium text-purple-800 mb-1">Shipped</p>
            <p className="text-2xl font-bold text-purple-900">{shippedOrders}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm font-medium text-green-800 mb-1">Delivered</p>
            <p className="text-2xl font-bold text-green-900">{deliveredOrders}</p>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <OrderTable
        orders={orders}
        onView={handleView}
        onUpdateStatus={handleUpdateStatus}
        onAssignTracking={handleAssignTracking}
        onAccept={handleAcceptOrder}
        onMarkPaid={handleMarkPaid}
        onCancel={handleCancelOrder}
        onRefund={handleRefundOrder}
        onInternalNotes={handleInternalNotes}
      />
    </div>
  )
}

export default OrdersPage
