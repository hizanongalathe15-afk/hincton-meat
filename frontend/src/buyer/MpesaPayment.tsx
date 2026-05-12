import { useState } from 'react'
import { Smartphone, CheckCircle, AlertCircle, RefreshCw, X } from 'lucide-react'
import { formatCurrency } from '../utils/helpers'
import { mpesaService } from '../services/mpesaService'
import { useLanguage } from '../contexts/LanguageContext'
import { getApiErrorMessage } from '../services/api'

interface MpesaPaymentProps {
  amount: number
  phoneNumber: string
  orderId: string
  onPaymentSuccess: (transactionId: string) => void
  onPaymentError: (error: string) => void
  onClose: () => void
}



interface PaymentStatus {
  status: 'pending' | 'processing' | 'success' | 'error'
  message?: string
  transactionId?: string
}

const MpesaPayment = ({ 
  amount, 
  phoneNumber, 
  orderId,
  onPaymentSuccess, 
  onPaymentError, 
  onClose 
}: MpesaPaymentProps) => {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>({ status: 'pending' })
  const [userPhoneNumber, setUserPhoneNumber] = useState(phoneNumber)
  const [isProcessing, setIsProcessing] = useState(false)
  const { t } = useLanguage()

  const initiatePayment = async () => {
    if (!userPhoneNumber || userPhoneNumber.length < 10) {
      setPaymentStatus({
        status: 'error',
        message: t('validation.validPhone')
      })
      return
    }

    setIsProcessing(true)
    setPaymentStatus({ status: 'processing' })

    try {
      // Initiate real M-Pesa STK Push
      const stkResp = await mpesaService.initiateSTKPush({
        phoneNumber: userPhoneNumber,
        amount,
        orderId
      })

      const checkoutRequestID: string = stkResp.checkoutRequestID || stkResp.CheckoutRequestID

      if (!checkoutRequestID) {
        throw new Error('Missing checkoutRequestID from STK Push response')
      }

      setPaymentStatus({
        status: 'processing',
        message: stkResp?.message || 'Waiting for payment confirmation...'
      })

      // Poll transaction status
      const start = Date.now()
      const timeoutMs = 3 * 60 * 1000 // 3 minutes
      let lastStatus: string | undefined

      while (Date.now() - start < timeoutMs) {
        const txResp = await mpesaService.checkTransactionStatus(checkoutRequestID)
        const txStatus = txResp?.status
        lastStatus = txStatus

        // Backend may return transaction status strings; accept common variants.
        const normalized = String(txStatus || '').toUpperCase()

        if (normalized === 'COMPLETED' || normalized === 'SUCCESS') {
          const transactionId = (txResp as any)?.transaction?.mpesaReceipt || (txResp as any)?.transaction?.id || checkoutRequestID

          setPaymentStatus({
            status: 'success',
            message: (txResp as any)?.message || 'Payment successful. Order confirmed.',
            transactionId: String(transactionId || '')
          })

          onPaymentSuccess(String(transactionId || ''))
          return
        }

        if (normalized === 'FAILED' || normalized === 'ERROR') {
          const errMsg = (txResp as any)?.transaction?.errorMessage || (txResp as any)?.transaction?.error || (txResp as any)?.message || 'Payment failed. Please try again.'
          setPaymentStatus({ status: 'error', message: errMsg })
          onPaymentError(errMsg)
          return
        }


        await new Promise(resolve => setTimeout(resolve, 3000))
      }

      const timeoutMsg = `Transaction timeout. Please retry. Status: ${lastStatus || 'UNKNOWN'}`
      setPaymentStatus({ status: 'error', message: timeoutMsg })
      onPaymentError(timeoutMsg)
    } catch (error: any) {
      const msg = getApiErrorMessage(error, 'Network error. Check your connection.')
      setPaymentStatus({ status: 'error', message: msg })
      onPaymentError(msg)
    } finally {
      setIsProcessing(false)
    }
  }


  const resetPayment = () => {
    setPaymentStatus({ status: 'pending' })
  }



  return (

    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Smartphone className="w-6 h-6 text-green-600" />
            <h2 className="text-xl font-semibold">{t('mpesa.title')}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {paymentStatus.status === 'pending' && (
            <div className="space-y-6">
              {/* Amount Display */}
              <div className="text-center py-6 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">{t('mpesa.amountToPay')}</p>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(amount)}</p>
              </div>

              {/* Phone Number Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('mpesa.phoneNumber')}
                </label>
                <input
                  type="tel"
                  value={userPhoneNumber}
                  onChange={(e) => setUserPhoneNumber(e.target.value)}
                  placeholder={t('mpesa.phonePlaceholder')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <p className="mt-2 text-sm text-gray-500">
                  {t('mpesa.enterMpesaPhone')}
                </p>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">{t('mpesa.howToPay')}</h4>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>{t('mpesa.clickPayNow')}</li>
                  <li>{t('mpesa.enterPin')}</li>
                  <li>{t('mpesa.waitForConfirmation')}</li>
                </ol>
              </div>

              {/* Pay Button */}
              <button
                onClick={initiatePayment}
                disabled={isProcessing}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    {t('mpesa.processing')}
                  </span>
                ) : (
                  t('mpesa.payNow')
                )}
              </button>
            </div>
          )}

          {paymentStatus.status === 'processing' && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-8 h-8 text-green-600 animate-pulse" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Processing Payment</h3>
              <p className="text-gray-600 mb-4">
                Please check your phone for M-Pesa prompt and enter your PIN
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
            </div>
          )}

          {paymentStatus.status === 'success' && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Payment successful</h3>
              <p className="text-gray-600 mb-4">{paymentStatus.message}</p>
              {paymentStatus.transactionId && (
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <p className="text-sm text-gray-600">Transaction ID:</p>
                  <p className="font-mono font-medium">{paymentStatus.transactionId}</p>
                </div>
              )}
              <p className="text-sm text-gray-500">This window will close automatically...</p>
            </div>
          )}

          {paymentStatus.status === 'error' && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Payment Failed</h3>
              <p className="text-gray-600 mb-6">{paymentStatus.message}</p>
              <div className="space-y-3">
                <button
                  onClick={resetPayment}
                  className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Try Again
                </button>
                <button
                  onClick={onClose}
                  className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <Smartphone className="w-4 h-4" />
            <span>Secured by M-Pesa</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MpesaPayment
