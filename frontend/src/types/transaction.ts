export interface Transaction {
  id: string
  order: {
    id: string
    orderNumber: string
    totalAmount: number
  }
  user: {
    id: string
    name: string
    email: string
  }
  amount: number
  currency: string
  paymentMethod: 'mpesa' | 'cash' | 'card'
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  mpesaDetails?: {
    phoneNumber: string
    transactionId: string
    receiptNumber?: string
    merchantRequestId?: string
    checkoutRequestId?: string
  }
  refundDetails?: {
    amount: number
    reason: string
    refundId: string
    processedAt: string
  }
  createdAt: string
  updatedAt: string
}

export interface MpesaPaymentData {
  phoneNumber: string
  amount: number
  orderId: string
}

export interface MpesaCallbackData {
  Body: {
    stkCallback: {
      CheckoutRequestID: string
      MerchantRequestID: string
      ResultCode: number
      ResultDesc: string
      CallbackMetadata?: {
        Item: Array<{
          Name: string
          Value: any
        }>
      }
    }
  }
}
