export interface Product {
  id: string
  name: string
  price: number
  originalPrice?: number
  image: string
  images: string[]
  videos?: string[]
  productVideos?: Array<{ url: string; provider?: string; thumbnail?: string; title?: string; description?: string }>
  rating: number
  reviews: number
  category: string
  categorySlug?: string
  inStock: boolean
  stockQuantity?: number
  lowStockThreshold?: number
  description?: string
  weight?: string
  weightValue?: number
  weightUnit?: string
  origin?: string
  sku?: string
  nutritionInfo?: {
    calories: number
    protein: number
    fat: number
    carbs: number
  }
  storage?: string
  cookingTips?: string[]
}

export interface CartItem extends Product {
  quantity: number
}

export interface User {
  id: string
  name: string
  email: string
  phone?: string
  role: 'CUSTOMER' | 'ADMIN'
  address?: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  createdAt: string
  lastLogin?: string
}

export interface Order {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone: string
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  total: number
  items: CartItem[]
  createdAt: string
  estimatedDelivery?: string
  actualDelivery?: string
  trackingNumber?: string
  shippingAddress: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  paymentMethod: string
  notes?: string
  transactionId?: string
}

export interface DeliveryLocation {
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

export interface Category {
  id: string
  name: string
  subcategories?: Category[]
}

export interface FilterOption {
  id: string
  name: string
  count?: number
}

export interface OrderData {
  customerInfo: {
    firstName: string
    lastName: string
    email: string
    phone: string
  }
  shippingAddress: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  paymentMethod: 'mpesa' | 'card'
  deliveryOption: 'standard' | 'express'
  notes?: string
}

export interface AnalyticsData {
  revenue: { current: number; change: number; period: string }
  orders: { current: number; change: number; period: string }
  customers: { current: number; change: number; period: string }
  products: { current: number; change: number; period: string }
}

export interface InventoryItem {
  id: string
  name: string
  sku: string
  category: string
  currentStock: number
  minStock: number
  maxStock: number
  reorderPoint: number
  unitPrice: number
  totalValue: number
  supplier: string
  lastRestocked: string
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstock'
  trend: 'up' | 'down' | 'stable'
  monthlySales: number
  turnoverRate: number
}

export interface AdminUser {
  id: string
  name: string
  email: string
  phone: string
  role: 'admin' | 'customer'
  status: 'active' | 'inactive' | 'suspended'
  registeredAt: string
  lastLogin: string
  totalOrders: number
  totalSpent: number
  address?: {
    street: string
    city: string
    state: string
    zipCode: string
  }
}

export interface Settings {
  general: {
    storeName: string
    storeEmail: string
    storePhone: string
    storeAddress: string
    currency: string
    timezone: string
    language: string
  }
  notifications: {
    emailNotifications: boolean
    smsNotifications: boolean
    orderNotifications: boolean
    lowStockAlerts: boolean
    customerInquiries: boolean
    systemUpdates: boolean
  }
  shipping: {
    freeShippingThreshold: number
    standardShippingFee: number
    expressShippingFee: number
    deliveryTimeframe: string
    expressDeliveryTimeframe: string
  }
  payment: {
    mpesaEnabled: boolean
    cardPaymentsEnabled: boolean
    cashOnDeliveryEnabled: boolean
    bankTransferEnabled: boolean
  }
  inventory: {
    lowStockThreshold: number
    autoReorderEnabled: boolean
    stockTrackingEnabled: boolean
    expirationAlerts: boolean
  }
}
