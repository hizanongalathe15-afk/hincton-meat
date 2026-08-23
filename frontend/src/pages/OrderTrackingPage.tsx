import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Package, Truck, MapPin, Check, Phone, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import LiveMap, { MapMarker } from '../components/LiveMap';
import { useSiteContent } from '../contexts/SiteContentContext';
import { ordersApi } from '../services/buyerApi';

interface TrackingStep {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  completed: boolean;
  icon: React.ReactNode;
}

interface OrderDetails {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  deliveryAddress: string;
  estimatedDeliveryTime: string;
  actualDeliveryTime?: string;
  deliveryPerson?: {
    name: string;
    phone: string;
    photo?: string;
  };
  currentLocation?: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

const OrderTrackingPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { profile } = useSiteContent();
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [trackingSteps, setTrackingSteps] = useState<TrackingStep[]>([]);
  const [loading, setLoading] = useState(true);

  const orderId = searchParams.get('orderId');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
      case 'CONFIRMED':
        return <Check className="w-5 h-5" />;
      case 'PROCESSING':
        return <Package className="w-5 h-5" />;
      case 'SHIPPED':
      case 'OUT_FOR_DELIVERY':
        return <Truck className="w-5 h-5" />;
      case 'DELIVERED':
        return <Check className="w-5 h-5" />;
      default:
        return <Package className="w-5 h-5" />;
    }
  };

  const getStatusTitle = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Order Pending';
      case 'CONFIRMED':
        return 'Order Confirmed';
      case 'PROCESSING':
        return 'Processing Order';
      case 'SHIPPED':
        return 'Order Shipped';
      case 'OUT_FOR_DELIVERY':
        return 'Out for Delivery';
      case 'DELIVERED':
        return 'Order Delivered';
      case 'CANCELLED':
        return 'Order Cancelled';
      default:
        return 'Order Status';
    }
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Your order is being reviewed';
      case 'CONFIRMED':
        return 'Your order has been confirmed and is being prepared';
      case 'PROCESSING':
        return 'Your order is being processed and packaged';
      case 'SHIPPED':
        return 'Your order has been shipped';
      case 'OUT_FOR_DELIVERY':
        return 'Your order is out for delivery';
      case 'DELIVERED':
        return 'Your order has been delivered successfully';
      case 'CANCELLED':
        return 'Your order has been cancelled';
      default:
        return 'Order status update';
    }
  };

  const isStatusCompleted = (status: string) => {
    return ['DELIVERED', 'CANCELLED', 'REFUNDED', 'RETURNED'].includes(status);
  };

  useEffect(() => {
    if (!orderId) {
      toast.error('Order ID not found');
      navigate('/');
      return;
    }

    const fetchOrderDetails = async () => {
      try {
        const data = await ordersApi.getOrder(orderId);
        const order = data.order;

        // Transform API data to component format
        const transformedOrder: OrderDetails = {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          totalAmount: Number(order.totalAmount),
          deliveryAddress: `${order.shippingAddress?.address}, ${order.shippingAddress?.city}, ${order.shippingAddress?.state}`,
          estimatedDeliveryTime: order.estimatedDeliveryTime || new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          actualDeliveryTime: order.deliveredAt,
          deliveryPerson: order.deliveryPerson ? {
            name: order.deliveryPerson.name,
            phone: order.deliveryPerson.phone,
          } : undefined,
          currentLocation: order.currentLocation ? {
            latitude: order.currentLocation.latitude,
            longitude: order.currentLocation.longitude,
            address: order.currentLocation.address,
          } : undefined,
        };

        setOrderDetails(transformedOrder);

        // Transform tracking history to steps
        const steps: TrackingStep[] = (order.trackingHistory || []).map((history: any, index: number) => ({
          id: history.id || index.toString(),
          title: history.status || 'Status Update',
          description: history.description || `Order status: ${history.status}`,
          timestamp: history.timestamp,
          completed: true,
          icon: getStatusIcon(history.status),
        }));

        // Add current status if not in history
        const currentStatusStep: TrackingStep = {
          id: 'current',
          title: getStatusTitle(order.status),
          description: getStatusDescription(order.status),
          timestamp: new Date().toISOString(),
          completed: isStatusCompleted(order.status),
          icon: getStatusIcon(order.status),
        };

        setTrackingSteps([...steps, currentStatusStep]);

      } catch (error) {
        console.error('Failed to fetch order details:', error);
        toast.error('Failed to load order tracking information');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId, navigate]);

  const handleContactDriver = () => {
    if (orderDetails?.deliveryPerson?.phone) {
      window.open(`tel:${orderDetails.deliveryPerson.phone}`);
    }
  };

  const handleEmailSupport = () => {
    window.open(profile.brand.emailHref || 'mailto:support@example.com');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!orderDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h1>
          <button
            onClick={() => navigate('/')}
            className="text-blue-600 hover:text-blue-700"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  const trackingMapMarkers = useMemo<MapMarker[]>(() => {
    if (orderDetails?.currentLocation) {
      return [{
        id: 'current',
        position: [orderDetails.currentLocation.latitude, orderDetails.currentLocation.longitude],
        type: 'driver',
        label: 'Current location',
        popup: (
          <div>
            <p className="font-semibold text-gray-900">Current Location</p>
            <p className="text-sm text-gray-600">{orderDetails.currentLocation.address}</p>
          </div>
        ),
      }]
    }
    return []
  }, [orderDetails?.currentLocation])

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Track Your Order</h1>
          <p className="text-lg text-gray-600">
            Order Number: <span className="font-semibold">{orderDetails.orderNumber}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Tracking Timeline */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Status */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Status</h2>
              
              <div className="space-y-4">
                {trackingSteps.map((step, index) => (
                  <div key={step.id} className="flex items-start space-x-4">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      step.completed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {step.icon}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className={`font-medium ${
                          step.completed ? 'text-gray-900' : 'text-gray-500'
                        }`}>
                          {step.title}
                        </h3>
                        <span className="text-sm text-gray-500">
                          {new Date(step.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className={`text-sm ${
                        step.completed ? 'text-gray-600' : 'text-gray-400'
                      }`}>
                        {step.description}
                      </p>
                    </div>
                    
                    {index < trackingSteps.length - 1 && (
                      <div className={`absolute left-5 top-10 w-0.5 h-full ${
                        step.completed ? 'bg-green-200' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Live Map View */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Live Tracking</h2>
              
              {orderDetails.currentLocation ? (
                <LiveMap
                  markers={trackingMapMarkers}
                  height={256}
                  fitBounds={false}
                  center={[orderDetails.currentLocation.latitude, orderDetails.currentLocation.longitude]}
                  zoom={15}
                  scrollWheelZoom={true}
                />
              ) : (
                <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">Live location not available yet</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Map will appear once the driver is en route
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Details Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Details</h2>
              
              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-sm text-gray-600">Delivery Address</p>
                  <p className="font-medium text-gray-900">{orderDetails.deliveryAddress}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">Estimated Delivery</p>
                  <p className="font-medium text-gray-900">
                    {new Date(orderDetails.estimatedDeliveryTime).toLocaleDateString()} at{' '}
                    {new Date(orderDetails.estimatedDeliveryTime).toLocaleTimeString()}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">Order Total</p>
                  <p className="font-semibold text-lg text-gray-900">
                    KES {(orderDetails.totalAmount + 200).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Delivery Person Info */}
              {orderDetails.deliveryPerson && (
                <div className="border-t pt-6 mb-6">
                  <h3 className="font-medium text-gray-900 mb-3">Delivery Person</h3>
                  
                  <div className="flex items-center space-x-3 mb-4">
                    <img
                      src={orderDetails.deliveryPerson.photo || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face'}
                      alt={orderDetails.deliveryPerson.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-medium text-gray-900">{orderDetails.deliveryPerson.name}</p>
                      <p className="text-sm text-gray-600">{orderDetails.deliveryPerson.phone}</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleContactDriver}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Contact Driver
                  </button>
                </div>
              )}

              {/* Contact Support */}
              <div className="border-t pt-6">
                <h3 className="font-medium text-gray-900 mb-3">Need Help?</h3>
                
                <div className="space-y-2">
                  <button
                    onClick={handleContactDriver}
                    className="w-full text-left flex items-center space-x-2 text-gray-600 hover:text-gray-900 py-2"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Call Delivery Driver</span>
                  </button>
                  
                  <button
                    onClick={handleEmailSupport}
                    className="w-full text-left flex items-center space-x-2 text-gray-600 hover:text-gray-900 py-2"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Email Support</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTrackingPage;
