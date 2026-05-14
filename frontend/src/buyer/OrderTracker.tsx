import { useState, useEffect } from 'react'
import {
  Package, 
  Truck, 
  MapPin, 
  CheckCircle, 
  Clock, 
  Phone,
  Mail,
  Calendar,
  User
} from 'lucide-react'
import { LocalOrder } from '../services/localOrderService'
import { ordersApi } from '../services/buyerApi'
import { formatPrice } from '../utils/currency'
import { useLanguage } from '../contexts/LanguageContext'

interface TrackingStep {
  id: string
  title: string
  description: string
  status: 'completed' | 'current' | 'pending'
  timestamp?: string
  location?: string
}

interface OrderTrackerProps {
  orderId: string
  onClose?: () => void
}

const OrderTracker = ({ orderId, onClose }: OrderTrackerProps) => {
  const [orderDetails, setOrderDetails] = useState<LocalOrder | null>(null)
  const [backendTracking, setBackendTracking] = useState<TrackingStep[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { t } = useLanguage()

  useEffect(() => {
    fetchOrderDetails()
  }, [orderId])

  const fetchOrderDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      const data = await ordersApi.getOrder(orderId)
      const order = transformBackendOrder(data.order)
      setOrderDetails(order)
      setBackendTracking(transformTrackingHistory(data.order))
    } catch (err) {
      setError(t('order.notFoundError'))
    } finally {
      setLoading(false)
    }
  }

  const getTrackingSteps = (): TrackingStep[] => {
    if (!orderDetails) return []

    if (backendTracking.length > 0) return backendTracking

    const steps: TrackingStep[] = [
      {
        id: 'order_placed',
        title: t('tracking.orderPlaced'),
        description: t('tracking.orderPlacedDescription'),
        status: 'completed',
        timestamp: orderDetails.createdAt,
        location: t('tracking.online')
      },
      {
        id: 'order_confirmed',
        title: t('tracking.orderConfirmed'),
        description: t('tracking.orderConfirmedDescription'),
        status: orderDetails.status === 'pending' ? 'current' : 'completed',
        timestamp: orderDetails.createdAt,
        location: t('tracking.system')
      }
    ]

    if (orderDetails.status === 'processing' || orderDetails.status === 'shipped' || orderDetails.status === 'delivered') {
      steps.push({
        id: 'processing',
        title: t('tracking.processing'),
        description: t('tracking.orderProcessedDescription'),
        status: orderDetails.status === 'processing' ? 'current' : 'completed',
        timestamp: orderDetails.createdAt,
        location: t('tracking.dispatch')
      })
    }

    if (orderDetails.status === 'shipped' || orderDetails.status === 'delivered') {
      steps.push({
        id: 'shipped',
        title: t('tracking.shipped'),
        description: t('tracking.orderShippedDescription'),
        status: orderDetails.status === 'shipped' ? 'current' : 'completed',
        timestamp: orderDetails.estimatedDelivery,
        location: t('tracking.inTransit')
      })
    }

    if (orderDetails.status === 'delivered') {
      steps.push({
        id: 'delivered',
        title: t('tracking.delivered'),
        description: t('tracking.orderDeliveredDescription'),
        status: 'completed',
        timestamp: orderDetails.estimatedDelivery,
        location: orderDetails.shippingAddress.city
      })
    } else if (orderDetails.status === 'shipped') {
      steps.push({
        id: 'delivered',
        title: t('tracking.outForDelivery'),
        description: t('tracking.outForDeliveryDescription'),
        status: 'pending',
        timestamp: orderDetails.estimatedDelivery,
        location: orderDetails.shippingAddress.city
      })
    }

    return steps
  }

  const normalizeStatus = (status: string): LocalOrder['status'] => {
    const value = status.toLowerCase()
    if (value.includes('deliver')) return 'delivered'
    if (value.includes('ship') || value.includes('transit')) return 'shipped'
    if (value.includes('process') || value.includes('confirm')) return 'processing'
    if (value.includes('cancel') || value.includes('refund') || value.includes('return')) return 'cancelled'
    return 'pending'
  }

  const transformBackendOrder = (order: any): LocalOrder => {
    const address = order.shippingAddress || {}
    const fallbackName = address.fullName || [address.firstName, address.lastName].filter(Boolean).join(' ') || 'Customer'
    return {
      id: order.orderNumber || order.id,
      trackingNumber: order.trackingNumber || order.orderNumber || order.id,
      status: normalizeStatus(order.status || order.deliveryStatus || 'pending'),
      createdAt: order.createdAt,
      estimatedDelivery: order.estimatedDelivery || order.deliveredAt || order.updatedAt || order.createdAt,
      customerName: fallbackName,
      customerEmail: order.guestEmail || address.email || '',
      customerPhone: order.guestPhone || address.phone || '',
      shippingAddress: {
        street: address.street || address.address || address.addressLine1 || '',
        city: address.city || '',
        state: address.state || address.region || '',
        zipCode: address.zipCode || address.postalCode || '',
        country: address.country || 'Kenya',
        latitude: address.latitude,
        longitude: address.longitude,
      } as any,
      items: (order.orderItems || []).map((item: any) => ({
        id: item.productId || item.id,
        name: item.productName,
        price: Number(item.unitPrice) || 0,
        image: item.productImage || 'https://via.placeholder.com/600x600',
        images: item.productImage ? [item.productImage] : [],
        rating: 0,
        reviews: 0,
        category: 'Order item',
        inStock: true,
        quantity: item.quantity,
      })),
      subtotal: Number(order.subtotal) || 0,
      shipping: Number(order.shippingCost) || 0,
      tax: Number(order.taxAmount) || 0,
      total: Number(order.totalAmount) || 0,
      paymentMethod: (order.payments?.[0]?.paymentMethod || 'mpesa').toLowerCase() === 'card' ? 'card' : 'mpesa',
      deliveryOption: order.shippingMethod === 'express' ? 'express' : 'standard',
      notes: order.notes,
      transactionId: order.payments?.[0]?.paymentReference,
    }
  }

  const transformTrackingHistory = (order: any): TrackingStep[] => {
    const history = order.trackingHistory || []
    if (history.length === 0) return []

    return history.map((event: any, index: number) => ({
      id: event.id,
      title: event.status,
      description: event.description || event.status,
      status: index === history.length - 1 && normalizeStatus(order.status) !== 'delivered' ? 'current' : 'completed',
      timestamp: event.timestamp,
      location: event.location,
    }))
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    )
  }

  if (error || !orderDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Order not found'}</p>
          <button
            onClick={onClose}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const trackingSteps = getTrackingSteps()
  const mapQuery = (orderDetails.shippingAddress as any).latitude && (orderDetails.shippingAddress as any).longitude
    ? `${(orderDetails.shippingAddress as any).latitude},${(orderDetails.shippingAddress as any).longitude}`
    : [
        orderDetails.shippingAddress.street,
        orderDetails.shippingAddress.city,
        orderDetails.shippingAddress.state,
        orderDetails.shippingAddress.country,
      ].filter(Boolean).join(', ')
  const mapSrc = mapQuery ? `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=15&output=embed` : ''
  const mapUrl = mapQuery ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}` : ''

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Order Tracking</h1>
              <p className="text-gray-600">Order #{orderDetails.id}</p>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Status Badge */}
        <div className="mb-8">
          <span className={`inline-flex px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(orderDetails.status)}`}>
            {orderDetails.status.charAt(0).toUpperCase() + orderDetails.status.slice(1)}
          </span>
        </div>

        {/* Tracking Timeline */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold mb-6">Tracking Timeline</h2>
          <div className="relative">
            {trackingSteps.map((step, index) => (
              <div key={step.id} className="flex items-start mb-8 last:mb-0">
                {/* Icon */}
                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-full border-2 z-10
                  ${step.status === 'completed' ? 'bg-green-100 border-green-600' :
                    step.status === 'current' ? 'bg-blue-100 border-blue-600' :
                    'bg-gray-100 border-gray-300'}
                `}>
                  {step.status === 'completed' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : step.status === 'current' ? (
                    <Package className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Clock className="w-5 h-5 text-gray-400" />
                  )}
                </div>

                {/* Content */}
                <div className="ml-4 flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`font-medium ${
                      step.status === 'current' ? 'text-blue-600' : 
                      step.status === 'completed' ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </h3>
                    {step.timestamp && (
                      <span className="text-sm text-gray-500">
                        {formatDate(step.timestamp)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{step.description}</p>
                  {step.location && (
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPin className="w-3 h-3 mr-1" />
                      {step.location}
                    </div>
                  )}
                </div>

                {/* Connector Line */}
                {index < trackingSteps.length - 1 && (
                  <div className={`
                    absolute left-5 w-0.5 h-full -ml-px mt-10
                    ${step.status === 'completed' ? 'bg-green-600' : 'bg-gray-300'}
                  `} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Order Details</h2>
            
            {/* Items */}
            <div className="mb-6">
              <h3 className="font-medium mb-3">Items</h3>
              <div className="space-y-3">
                {orderDetails.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-medium">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatPrice(orderDetails.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Shipping</span>
                <span>{orderDetails.shipping === 0 ? 'FREE' : formatPrice(orderDetails.shipping)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax</span>
                <span>{formatPrice(orderDetails.tax)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatPrice(orderDetails.total)}</span>
              </div>
            </div>
          </div>

          {/* Delivery Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Delivery Information</h2>
            
            {/* Customer Info */}
            <div className="mb-6">
              <h3 className="font-medium mb-3">Customer</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span>{orderDetails.customerName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>{orderDetails.customerEmail}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{orderDetails.customerPhone}</span>
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="mb-6">
              <h3 className="font-medium mb-3">Delivery Address</h3>
              <div className="text-sm text-gray-600">
                <p>{orderDetails.shippingAddress.street}</p>
                <p>
                  {orderDetails.shippingAddress.city}, {orderDetails.shippingAddress.state} {orderDetails.shippingAddress.zipCode}
                </p>
              </div>
              {mapSrc && (
                <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
                  <iframe title="Order delivery map" src={mapSrc} className="h-56 w-full" loading="lazy" />
                  <div className="flex items-center justify-between gap-3 bg-gray-50 px-3 py-2 text-sm">
                    <span className="font-medium text-gray-700">Delivery map</span>
                    <a href={mapUrl} target="_blank" rel="noreferrer" className="font-bold text-red-700 hover:text-red-800">
                      Open live map
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Additional Info */}
            <div>
              <h3 className="font-medium mb-3">Additional Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>Order Date: {formatDate(orderDetails.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-gray-400" />
                  <span>Payment: {orderDetails.paymentMethod === 'mpesa' ? 'M-Pesa' : 'Card'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-gray-400" />
                  <span>Tracking: {orderDetails.trackingNumber}</span>
                </div>
                {orderDetails.notes && (
                  <div className="mt-3 p-3 bg-gray-50 rounded">
                    <p className="text-xs text-gray-600">Notes:</p>
                    <p className="text-sm">{orderDetails.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderTracker
