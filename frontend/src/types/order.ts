export interface OrderItem {
  product: {
    id: string
    name: string
    price: number
    images: string[]
  }
  quantity: number
  price: number
  weight: number
  unit: 'kg' | 'g' | 'lbs'
}

export interface Order {
  id: string
  orderNumber: string
  user: {
    id: string
    name: string
    email: string
  }
  items: OrderItem[]
  totalAmount: number
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled'
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  paymentMethod: 'mpesa' | 'cash' | 'card'
  paymentId?: string
  deliveryAddress: {
    street: string
    city: string
    state: string
    zipCode: string
    coordinates?: {
      lat: number
      lng: number
    }
  }
  deliveryFee: number
  estimatedDeliveryTime: string
  actualDeliveryTime?: string
  specialInstructions?: string
  orderNotes?: string
  createdAt: string
  updatedAt: string
}

export interface CreateOrderData {
  items: {
    product: string
    quantity: number
    weight: number
    unit: 'kg' | 'g' | 'lbs'
  }[]
  deliveryAddress: {
    street: string
    city: string
    state: string
    zipCode: string
  }
  paymentMethod: 'mpesa' | 'cash' | 'card'
  specialInstructions?: string
  orderNotes?: string
}

export interface OrderResponse {
  order: Order
}

export interface OrdersResponse {
  orders: Order[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}
