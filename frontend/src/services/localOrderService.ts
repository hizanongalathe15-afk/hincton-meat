import { CartItem, OrderData } from '../types'

export type LocalOrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

export interface LocalOrder {
  id: string
  trackingNumber: string
  status: LocalOrderStatus
  createdAt: string
  estimatedDelivery: string
  customerName: string
  customerEmail: string
  customerPhone: string
  shippingAddress: OrderData['shippingAddress']
  items: CartItem[]
  subtotal: number
  shipping: number
  tax: number
  total: number
  paymentMethod: OrderData['paymentMethod']
  deliveryOption: OrderData['deliveryOption']
  notes?: string
  transactionId?: string
}

const STORAGE_KEY = 'premium-meats-orders'

const readOrders = (): LocalOrder[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return []
  }
}

const writeOrders = (orders: LocalOrder[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders))
}

const calculateStatus = (order: LocalOrder): LocalOrderStatus => {
  if (order.status === 'cancelled' || order.status === 'delivered') return order.status

  const minutesSinceOrder = (Date.now() - new Date(order.createdAt).getTime()) / 60000
  if (minutesSinceOrder >= 180) return 'delivered'
  if (minutesSinceOrder >= 60) return 'shipped'
  if (minutesSinceOrder >= 10) return 'processing'
  return 'pending'
}

export const localOrderService = {
  createOrder(
    orderData: OrderData,
    items: CartItem[],
    totals: { subtotal: number; shipping: number; tax: number; total: number },
    transactionId?: string
  ) {
    const createdAt = new Date()
    const estimatedDelivery = new Date(createdAt.getTime() + (orderData.deliveryOption === 'express' ? 90 : 180) * 60000)
    const id = `ORD-${createdAt.getTime()}`

    const order: LocalOrder = {
      id,
      trackingNumber: `PMK-${createdAt.getTime().toString().slice(-8)}`,
      status: 'pending',
      createdAt: createdAt.toISOString(),
      estimatedDelivery: estimatedDelivery.toISOString(),
      customerName: `${orderData.customerInfo.firstName} ${orderData.customerInfo.lastName}`.trim(),
      customerEmail: orderData.customerInfo.email,
      customerPhone: orderData.customerInfo.phone,
      shippingAddress: orderData.shippingAddress,
      items,
      subtotal: totals.subtotal,
      shipping: totals.shipping,
      tax: totals.tax,
      total: totals.total,
      paymentMethod: orderData.paymentMethod,
      deliveryOption: orderData.deliveryOption,
      notes: orderData.notes,
      transactionId,
    }

    const orders = [order, ...readOrders()]
    writeOrders(orders)
    return order
  },

  getOrder(id: string) {
    const orders = readOrders()
    const order = orders.find((item) => item.id === id || item.trackingNumber === id)
    return order ? { ...order, status: calculateStatus(order) } : null
  },

  getOrders() {
    return readOrders().map((order) => ({ ...order, status: calculateStatus(order) }))
  },
}
