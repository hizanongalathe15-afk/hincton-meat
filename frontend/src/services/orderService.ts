import api from './api'
import { Order, CreateOrderData, OrderResponse, OrdersResponse } from '../types/order'

export const orderService = {
  async createOrder(orderData: CreateOrderData): Promise<OrderResponse> {
    const response = await api.post('/orders', orderData)
    return response.data
  },

  async getOrders(page?: number, limit?: number, status?: string): Promise<OrdersResponse> {
    const params = new URLSearchParams()
    if (page) params.append('page', page.toString())
    if (limit) params.append('limit', limit.toString())
    if (status) params.append('status', status)

    const response = await api.get(`/orders?${params.toString()}`)
    return response.data
  },

  async getOrder(id: string): Promise<Order> {
    const response = await api.get(`/orders/${id}`)
    return response.data.order
  },

  async updateOrderStatus(id: string, status: Order['status']): Promise<Order> {
    const response = await api.put(`/orders/${id}/status`, { status })
    return response.data.order
  },

  async cancelOrder(id: string): Promise<Order> {
    const response = await api.patch(`/orders/${id}/cancel`)
    return response.data.order
  },

  async getOrderStats() {
    const response = await api.get('/orders/stats')
    return response.data
  },
}
