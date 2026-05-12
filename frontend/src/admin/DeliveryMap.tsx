import { useState } from 'react'
import { 
  MapPin, 
  Truck, 
  Clock, 
  CheckCircle,
  Phone,
  Mail,
  User,
  Package,
} from 'lucide-react'

interface DeliveryLocation {
  id: string
  orderId: string
  orderNumber: string
  customerName: string
  customerPhone: string
  customerEmail: string
  address: {
    street: string
    city: string
    state: string
    zipCode: string
    coordinates: {
      lat: number
      lng: number
    }
  }
  driver?: {
    name: string
    phone: string
    vehicle: string
    plateNumber: string
    coordinates?: {
      lat: number
      lng: number
    }
  }
  status: 'pending' | 'assigned' | 'in_transit' | 'delivered' | 'failed'
  estimatedDelivery: string
  actualDelivery?: string
  trackingNumber: string
  items: number
  notes?: string
}

interface DeliveryMapProps {
  deliveries?: DeliveryLocation[]
  onAssignDriver?: (deliveryId: string, driverId: string) => void
  onUpdateStatus?: (deliveryId: string, status: string) => void
  onViewDetails?: (delivery: DeliveryLocation) => void
  loading?: boolean
}

const DeliveryMap = ({ 
  deliveries, 
  onAssignDriver,
  onViewDetails,
  loading = false 
}: DeliveryMapProps) => {
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryLocation | null>(null)
  const [showDrivers, setShowDrivers] = useState(true)

  const defaultDeliveries: DeliveryLocation[] = [
    {
      id: '1',
      orderId: '1',
      orderNumber: 'ORD-2024-001',
      customerName: 'John Doe',
      customerPhone: '+254 712 345 678',
      customerEmail: 'john.doe@example.com',
      address: {
        street: 'Summit House, Waiyaki Way',
        city: 'Nairobi',
        state: 'Nairobi County',
        zipCode: '00100',
        coordinates: { lat: -1.2921, lng: 36.8219 }
      },
      driver: {
        name: 'James Kamau',
        phone: '+254 723 456 789',
        vehicle: 'Toyota Hilux',
        plateNumber: 'KBC 123A',
        coordinates: { lat: -1.2851, lng: 36.8259 }
      },
      status: 'in_transit',
      estimatedDelivery: '2024-01-18T16:00:00Z',
      trackingNumber: 'DEL123456',
      items: 3,
      notes: 'Deliver after 5 PM'
    },
    {
      id: '2',
      orderId: '2',
      orderNumber: 'ORD-2024-002',
      customerName: 'Jane Smith',
      customerPhone: '+254 734 567 890',
      customerEmail: 'jane.smith@example.com',
      address: {
        street: '456 Mombasa Road',
        city: 'Mombasa',
        state: 'Mombasa County',
        zipCode: '80100',
        coordinates: { lat: -4.0435, lng: 39.6682 }
      },
      status: 'assigned',
      estimatedDelivery: '2024-01-19T10:00:00Z',
      trackingNumber: 'DEL123457',
      items: 2
    },
    {
      id: '3',
      orderId: '3',
      orderNumber: 'ORD-2024-003',
      customerName: 'Bob Johnson',
      customerPhone: '+254 745 678 901',
      customerEmail: 'bob.johnson@example.com',
      address: {
        street: '789 Kisumu Avenue',
        city: 'Kisumu',
        state: 'Kisumu County',
        zipCode: '40100',
        coordinates: { lat: -0.0917, lng: 34.7680 }
      },
      status: 'delivered',
      estimatedDelivery: '2024-01-17T16:00:00Z',
      actualDelivery: '2024-01-17T15:30:00Z',
      trackingNumber: 'DEL123458',
      items: 5
    }
  ]

  const deliveriesData = deliveries || defaultDeliveries

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'assigned': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'in_transit': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200'
      case 'failed': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />
      case 'assigned': return <User className="w-4 h-4" />
      case 'in_transit': return <Truck className="w-4 h-4" />
      case 'delivered': return <CheckCircle className="w-4 h-4" />
      case 'failed': return <MapPin className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const statusCounts = {
    pending: deliveriesData.filter(d => d.status === 'pending').length,
    assigned: deliveriesData.filter(d => d.status === 'assigned').length,
    in_transit: deliveriesData.filter(d => d.status === 'in_transit').length,
    delivered: deliveriesData.filter(d => d.status === 'delivered').length,
    failed: deliveriesData.filter(d => d.status === 'failed').length
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="h-96 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading delivery map...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Delivery Tracking</h2>
            <p className="text-gray-600">Real-time delivery tracking and management</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showDrivers}
                onChange={(e) => setShowDrivers(e.target.checked)}
                className="rounded text-red-600 focus:ring-red-500"
              />
              Show Drivers
            </label>
          </div>
        </div>

        {/* Status Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-6">
          {Object.entries(statusCounts).map(([status, count]) => (
            <div key={status} className="text-center">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${getStatusColor(status).split(' ')[0]} ${getStatusColor(status).split(' ')[1]}`}>
                {getStatusIcon(status)}
              </div>
              <p className="mt-2 text-2xl font-bold text-gray-900">{count}</p>
              <p className="text-sm text-gray-600 capitalize">{status.replace('_', ' ')}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Area */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Delivery Map</h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>Live Tracking</span>
              </div>
            </div>
            
            {/* Map Placeholder */}
            <div className="relative h-96 bg-gray-100 rounded-lg overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">Interactive Map View</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Real-time delivery tracking would be displayed here
                  </p>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span>Pending</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span>Assigned</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        <span>In Transit</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span>Delivered</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mock Map Markers */}
              {deliveriesData.map((delivery) => (
                <div
                  key={delivery.id}
                  className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: `${20 + (delivery.id === '1' ? 30 : delivery.id === '2' ? 60 : 80)}%`,
                    top: `${20 + (delivery.id === '1' ? 20 : delivery.id === '2' ? 50 : 70)}%`
                  }}
                  onClick={() => setSelectedDelivery(delivery)}
                >
                  <div className={`w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center ${getStatusColor(delivery.status).split(' ')[0]} ${getStatusColor(delivery.status).split(' ')[1]}`}>
                    {getStatusIcon(delivery.status)}
                  </div>
                  <div className="absolute top-full mt-1 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded shadow text-xs whitespace-nowrap">
                    {delivery.orderNumber}
                  </div>
                </div>
              ))}

              {showDrivers && deliveriesData.filter(d => d.driver).map((delivery) => (
                <div
                  key={`driver-${delivery.id}`}
                  className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: `${25 + (delivery.id === '1' ? 30 : 0)}%`,
                    top: `${25 + (delivery.id === '1' ? 20 : 0)}%`
                  }}
                >
                  <div className="w-6 h-6 bg-orange-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                    <Truck className="w-3 h-3 text-white" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Delivery List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Active Deliveries</h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {deliveriesData
                .filter(d => d.status !== 'delivered')
                .map((delivery) => (
                <div
                  key={delivery.id}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                    selectedDelivery?.id === delivery.id ? 'bg-red-50' : ''
                  }`}
                  onClick={() => setSelectedDelivery(delivery)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-gray-900">{delivery.orderNumber}</p>
                      <p className="text-sm text-gray-600">{delivery.customerName}</p>
                    </div>
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(delivery.status)}`}>
                      {delivery.status.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{delivery.address.city}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(delivery.estimatedDelivery)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Package className="w-3 h-3" />
                      <span>{delivery.items} items</span>
                    </div>
                  </div>

                  {delivery.driver && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-3 h-3 text-gray-500" />
                        <span className="font-medium">{delivery.driver.name}</span>
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-600">{delivery.driver.vehicle}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Selected Delivery Details */}
      {selectedDelivery && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Delivery Details</h3>
            <button
              onClick={() => setSelectedDelivery(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Order Information */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Order Information</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Number:</span>
                  <span className="font-medium">{selectedDelivery.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tracking Number:</span>
                  <span className="font-medium">{selectedDelivery.trackingNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Items:</span>
                  <span className="font-medium">{selectedDelivery.items}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedDelivery.status)}`}>
                    {selectedDelivery.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Customer Information</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span>{selectedDelivery.customerName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{selectedDelivery.customerPhone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>{selectedDelivery.customerEmail}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div className="text-sm">
                    <div>{selectedDelivery.address.street}</div>
                    <div>{selectedDelivery.address.city}, {selectedDelivery.address.state} {selectedDelivery.address.zipCode}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Driver Information */}
            {selectedDelivery.driver && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Driver Information</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span>{selectedDelivery.driver.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{selectedDelivery.driver.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-gray-400" />
                    <span>{selectedDelivery.driver.vehicle} ({selectedDelivery.driver.plateNumber})</span>
                  </div>
                </div>
              </div>
            )}

            {/* Timeline */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Delivery Timeline</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Order Placed</p>
                    <p className="text-xs text-gray-500">Today, 10:30 AM</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Driver Assigned</p>
                    <p className="text-xs text-gray-500">Today, 11:00 AM</p>
                  </div>
                </div>
                {selectedDelivery.status === 'in_transit' && (
                  <div className="flex items-center gap-3">
                    <Truck className="w-4 h-4 text-blue-500 animate-pulse" />
                    <div>
                      <p className="text-sm font-medium">In Transit</p>
                      <p className="text-xs text-gray-500">Currently on the way</p>
                    </div>
                  </div>
                )}
                {selectedDelivery.status === 'delivered' && (
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">Delivered</p>
                      <p className="text-xs text-gray-500">
                        {selectedDelivery.actualDelivery ? formatDate(selectedDelivery.actualDelivery) : ''}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={() => onViewDetails?.(selectedDelivery)}
              className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              View Full Details
            </button>
            {selectedDelivery.status === 'pending' && (
              <button
                onClick={() => onAssignDriver?.(selectedDelivery.id, 'driver-id')}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Assign Driver
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default DeliveryMap
