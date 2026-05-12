import DeliveryMap from './DeliveryMap'

interface DeliveryPageProps {
  onAssignDriver?: (deliveryId: string, driverId: string) => void
  onUpdateDeliveryStatus?: (deliveryId: string, status: string) => void
  onViewDeliveryDetails?: (delivery: any) => void
}

const DeliveryPage = ({ 
  onAssignDriver, 
  onUpdateDeliveryStatus, 
  onViewDeliveryDetails 
}: DeliveryPageProps) => {
  const handleAssignDriver = (deliveryId: string, driverId: string) => {
    console.log('Assign driver:', deliveryId, driverId)
    onAssignDriver?.(deliveryId, driverId)
  }

  const handleUpdateStatus = (deliveryId: string, status: string) => {
    console.log('Update delivery status:', deliveryId, status)
    onUpdateDeliveryStatus?.(deliveryId, status)
  }

  const handleViewDetails = (delivery: any) => {
    console.log('View delivery details:', delivery)
    onViewDeliveryDetails?.(delivery)
  }

  return (
    <div className="p-6">
      <DeliveryMap
        onAssignDriver={handleAssignDriver}
        onUpdateStatus={handleUpdateStatus}
        onViewDetails={handleViewDetails}
      />
    </div>
  )
}

export default DeliveryPage
