export interface Delivery {
  id: string
  order: {
    id: string
    orderNumber: string
    user: {
      id: string
      name: string
      email: string
    }
  }
  deliveryPerson: {
    id: string
    name: string
    phone?: string
  }
  status: 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'failed'
  currentLocation?: {
    lat: number
    lng: number
    address: string
  }
  estimatedArrivalTime: string
  actualArrivalTime?: string
  deliveryNotes?: string
  customerRating?: {
    rating: number
    comment: string
  }
  createdAt: string
  updatedAt: string
}

export interface CreateDeliveryData {
  orderId: string
  deliveryPersonId: string
  estimatedArrivalTime: string
}

export interface UpdateDeliveryStatusData {
  status: 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'failed'
  currentLocation?: {
    lat: number
    lng: number
    address: string
  }
  deliveryNotes?: string
}

export interface UpdateLocationData {
  lat: number
  lng: number
  address: string
}

export interface CustomerRatingData {
  rating: number
  comment: string
}
