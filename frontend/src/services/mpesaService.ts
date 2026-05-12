import api from './api'
import { MpesaPaymentData, Transaction } from '../types/transaction'

export const mpesaService = {
  async initiateSTKPush(paymentData: MpesaPaymentData) {
    const response = await api.post('/mpesa/stk-push', paymentData)
    return response.data
  },

  async checkTransactionStatus(checkoutRequestID: string): Promise<{ status: string; transaction: Transaction }> {
    const response = await api.get(`/mpesa/transaction/${checkoutRequestID}`)
    return response.data
  },

  async getUserTransactions(page?: number, limit?: number, status?: string) {
    const params = new URLSearchParams()
    if (page) params.append('page', page.toString())
    if (limit) params.append('limit', limit.toString())
    if (status) params.append('status', status)

    const response = await api.get(`/mpesa/transactions?${params.toString()}`)
    return response.data
  },
}
