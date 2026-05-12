import { useParams } from 'react-router-dom'
import OrderTracker from './buyer/OrderTracker'

export default function OrderTrackerRouteWrapper() {
  const { id } = useParams()
  return <OrderTracker orderId={id || ''} />
}

