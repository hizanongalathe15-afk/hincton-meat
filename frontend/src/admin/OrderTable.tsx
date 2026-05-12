import { useState } from 'react'
import {
  Search,
  Eye,
  Truck,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'
import { formatPrice } from '../utils/currency'

interface Order {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone: string
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
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

interface OrderTableProps {
  orders?: Order[]
  onView?: (order: Order) => void
  onUpdateStatus?: (orderId: string, status: string) => void
  onAssignTracking?: (orderId: string, trackingNumber: string) => void
  loading?: boolean
}

const OrderTable = ({
  orders,
  onView,
  onUpdateStatus,
  onAssignTracking,
  loading = false
}: OrderTableProps) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('')
  const [dateRange, setDateRange] = useState('')
  const [sortField, setSortField] = useState<keyof Order>('createdAt')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  const defaultOrders: Order[] = [
    {
      id: '1',
      orderNumber: 'ORD-2024-001',
      customerName: 'John Doe',
      customerEmail: 'john.doe@example.com',
      customerPhone: '+254 712 345 678',
      status: 'processing',
      paymentStatus: 'paid',
      total: 234.50,
      items: 3,
      createdAt: '2024-01-15T10:30:00Z',
      estimatedDelivery: '2024-01-18T16:00:00Z',
      shippingAddress: {
        street: 'Summit House, Waiyaki Way',
        city: 'Nairobi',
        state: 'Nairobi County',
        zipCode: '00100'
      },
      paymentMethod: 'M-Pesa'
    },
    {
      id: '2',
      orderNumber: 'ORD-2024-002',
      customerName: 'Jane Smith',
      customerEmail: 'jane.smith@example.com',
      customerPhone: '+254 723 456 789',
      status: 'shipped',
      paymentStatus: 'paid',
      total: 156.99,
      items: 2,
      createdAt: '2024-01-14T14:20:00Z',
      estimatedDelivery: '2024-01-17T16:00:00Z',
      trackingNumber: 'MPK123456789',
      shippingAddress: {
        street: '456 Mombasa Road',
        city: 'Mombasa',
        state: 'Mombasa County',
        zipCode: '80100'
      },
      paymentMethod: 'Credit Card'
    },
    {
      id: '3',
      orderNumber: 'ORD-2024-003',
      customerName: 'Bob Johnson',
      customerEmail: 'bob.johnson@example.com',
      customerPhone: '+254 734 567 890',
      status: 'delivered',
      paymentStatus: 'paid',
      total: 445.00,
      items: 5,
      createdAt: '2024-01-13T09:15:00Z',
      shippingAddress: {
        street: '789 Kisumu Avenue',
        city: 'Kisumu',
        state: 'Kisumu County',
        zipCode: '40100'
      },
      paymentMethod: 'M-Pesa'
    },
    {
      id: '4',
      orderNumber: 'ORD-2024-004',
      customerName: 'Alice Brown',
      customerEmail: 'alice.brown@example.com',
      customerPhone: '+254 745 678 901',
      status: 'pending',
      paymentStatus: 'pending',
      total: 89.75,
      items: 1,
      createdAt: '2024-01-12T16:45:00Z',
      shippingAddress: {
        street: '321 Eldoret Highway',
        city: 'Eldoret',
        state: 'Uasin Gishu County',
        zipCode: '30100'
      },
      paymentMethod: 'M-Pesa'
    }
  ]

  const ordersData = orders || defaultOrders

  const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
  const paymentStatuses = ['pending', 'paid', 'failed', 'refunded']
  const dateRanges = [
    { value: '', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' }
  ]

  const filteredOrders = ordersData
    .filter(order => 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(order => !selectedStatus || order.status === selectedStatus)
    .filter(order => !selectedPaymentStatus || order.paymentStatus === selectedPaymentStatus)
    .sort((a, b) => {
      const aValue = sortValue(a[sortField])
      const bValue = sortValue(b[sortField])

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

  const handleSort = (field: keyof Order) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortValue = (value: Order[keyof Order]) => {
    if (typeof value === 'number') return value
    if (typeof value === 'string') {
      const t = Date.parse(value)
      return Number.isNaN(t) ? value.toLowerCase().charCodeAt(0) : t
    }
    return 0
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      case 'shipped': return 'bg-purple-100 text-purple-800'
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'failed': return 'bg-red-100 text-red-800'
      case 'refunded': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />
      case 'processing': return <Clock className="w-4 h-4" />
      case 'shipped': return <Truck className="w-4 h-4" />
      case 'delivered': return <CheckCircle className="w-4 h-4" />
      case 'cancelled': return <XCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="h-96 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading orders...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Orders</h2>
          <p className="text-gray-600">Manage customer orders and fulfillment</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mt-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
          
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          >
            <option value="">All Status</option>
            {statuses.map(status => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>

          <select
            value={selectedPaymentStatus}
            onChange={(e) => setSelectedPaymentStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          >
            <option value="">All Payment Status</option>
            {paymentStatuses.map(status => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>

          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          >
            {dateRanges.map(range => (
              <option key={range.value} value={range.value}>{range.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('orderNumber')}
                  className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                >
                  Order
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('total')}
                  className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                >
                  Total
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Payment
              </th>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('createdAt')}
                  className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                >
                  Date
                </button>
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredOrders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {order.orderNumber}
                    </div>
                    <div className="text-sm text-gray-500">
                      {order.items} items
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {order.customerName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {order.customerEmail}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {formatPrice(order.total)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {order.paymentMethod}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                    {getStatusIcon(order.status)}
                  </div>
                  {order.trackingNumber && (
                    <div className="text-xs text-gray-500 mt-1">
                      Track: {order.trackingNumber}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentStatusColor(order.paymentStatus)}`}>
                    {order.paymentStatus}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(order.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onView?.(order)}
                      className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    <select
                      value={order.status}
                      onChange={(event) => onUpdateStatus?.(order.id, event.target.value)}
                      className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700"
                      aria-label={`Update status for ${order.orderNumber}`}
                    >
                      {statuses.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        const trackingNumber = window.prompt('Enter tracking number', order.trackingNumber || '')
                        if (trackingNumber !== null && trackingNumber.trim()) {
                          onAssignTracking?.(order.id, trackingNumber.trim())
                        }
                      }}
                      className="text-green-700 hover:text-green-900"
                    >
                      Track
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {filteredOrders.length === 0 && (
        <div className="text-center py-12">
          <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
          <p className="text-gray-600">
            {searchTerm || selectedStatus || selectedPaymentStatus || dateRange
              ? 'Try adjusting your filters' 
              : 'Orders will appear here when customers make purchases'}
          </p>
        </div>
      )}
    </div>
  )
}

export default OrderTable
