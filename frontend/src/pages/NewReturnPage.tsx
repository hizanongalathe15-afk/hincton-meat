import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ArrowLeft, RotateCcw, ShoppingBag } from 'lucide-react'
import ReturnForm from '../buyer/ReturnForm'
import { returnsApi } from '../services/buyerApi'

const NewReturnPage = () => {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const orderId = params.get('orderId') || ''
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (formData: any) => {
    if (!formData?.orderId?.trim()) {
      toast.error('Please provide the order number for the return.')
      return
    }
    setSubmitting(true)
    try {
      const payload: any = {
        orderId: formData.orderId.trim(),
        reason: formData.reason || 'other',
        reasonDetails: formData.description || '',
        quantity: 1,
      }
      if (formData.orderItemId) payload.orderItemId = formData.orderItemId
      if (formData.productId) payload.productId = formData.productId
      if (formData.variantId) payload.variantId = formData.variantId
      const result = await returnsApi.createReturn(payload)
      const ref = result?.returnRequest?.returnNumber || result?.returnNumber || result?.id
      toast.success(ref ? `Return ${ref} submitted!` : 'Return submitted successfully')
      setTimeout(() => navigate('/profile?tab=returns', { replace: true }), 900)
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err?.message || 'Could not submit return request')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm font-bold text-red-700 hover:text-red-800 mb-6">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-gray-950 via-[#9f2f20] to-gray-950 text-white px-6 py-6 sm:px-8 sm:py-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur px-3 py-1 text-xs font-bold uppercase tracking-wider text-red-100 mb-3">
                  <RotateCcw className="h-3.5 w-3.5" /> Self-service returns
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold">Request a return or refund</h1>
                <p className="mt-2 text-sm text-red-100 max-w-2xl">
                  Tell us what went wrong. Our concierge team will review every request and contact you within 24 hours.
                </p>
              </div>
              <div className="hidden sm:inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur border border-white/20">
                <ShoppingBag className="h-8 w-8" />
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-8">
            {submitting ? (
              <div className="py-16 text-center">
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-red-200 border-t-red-600" />
                <p className="mt-4 text-sm font-semibold text-gray-700">Submitting your return…</p>
              </div>
            ) : (
              <ReturnForm orderId={orderId} onSubmit={handleSubmit} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default NewReturnPage
