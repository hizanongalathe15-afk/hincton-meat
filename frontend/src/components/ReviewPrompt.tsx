import { useEffect, useMemo, useState } from 'react'
import { Star, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { reviewsApi } from '../services/buyerApi'
import { resolveMediaUrl } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

type ProductToReview = {
  id: string
  orderItemId?: string
  name: string
  image?: string
  orderId: string
  orderNumber: string
  orderDate: string
}

const ReviewPrompt = () => {
  const { user } = useAuth()
  const [items, setItems] = useState<ProductToReview[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [rating, setRating] = useState(5)
  const [deliveryRating, setDeliveryRating] = useState(5)
  const [serviceRating, setServiceRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const activeItem = items[activeIndex]

  const dismissKey = useMemo(() => `hincton:review-prompt-dismissed:${user?.id || 'guest'}`, [user?.id])

  useEffect(() => {
    if (!user || String(user.role || '').toLowerCase() === 'admin') return
    const dismissedUntil = Number(localStorage.getItem(dismissKey) || 0)
    if (dismissedUntil > Date.now()) return

    reviewsApi.getProductsToReview()
      .then((response) => setItems((response.products || []).slice(0, 5)))
      .catch(() => {})
  }, [dismissKey, user])

  if (!user || !activeItem) return null

  const closeForNow = () => {
    localStorage.setItem(dismissKey, String(Date.now() + 24 * 60 * 60 * 1000))
    setItems([])
  }

  const skipItem = () => {
    if (activeIndex < items.length - 1) {
      setActiveIndex((index) => index + 1)
      return
    }
    closeForNow()
  }

  const submitReview = async () => {
    setSubmitting(true)
    try {
      const content = [
        comment.trim() || 'Reviewed after delivery.',
        '',
        `Delivery rating: ${deliveryRating}/5`,
        `Service rating: ${serviceRating}/5`,
      ].join('\n')

      await reviewsApi.createReview({
        productId: activeItem.id,
        orderId: activeItem.orderId,
        orderItemId: activeItem.orderItemId,
        rating,
        title: `Verified review for ${activeItem.name}`,
        content,
      })

      toast.success('Review submitted')
      setRating(5)
      setDeliveryRating(5)
      setServiceRating(5)
      setComment('')
      skipItem()
    } catch (error: any) {
      toast.error(error?.message || 'Could not submit review')
    } finally {
      setSubmitting(false)
    }
  }

  const RatingRow = ({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) => (
    <div>
      <p className="mb-2 text-sm font-semibold text-gray-700">{label}</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button key={star} type="button" onClick={() => onChange(star)} className="rounded p-1 hover:bg-yellow-50" aria-label={`${label} ${star}`}>
            <Star className={`h-6 w-6 ${star <= value ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 mx-auto w-[calc(100%-2rem)] max-w-xl">
      <div className="rounded-lg border border-gray-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 p-4">
          <div className="flex min-w-0 gap-3">
            <img src={resolveMediaUrl(activeItem.image) || '/hincton/hero-platter.jpg'} alt={activeItem.name} className="h-14 w-14 rounded object-cover" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-950">Rate your delivered order</p>
              <p className="truncate text-sm text-gray-600">{activeItem.name}</p>
              <p className="text-xs text-gray-500">Order {activeItem.orderNumber}</p>
            </div>
          </div>
          <button type="button" onClick={closeForNow} className="rounded-full p-2 text-gray-500 hover:bg-gray-100" aria-label="Close review prompt">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <RatingRow label="Product" value={rating} onChange={setRating} />
            <RatingRow label="Delivery" value={deliveryRating} onChange={setDeliveryRating} />
            <RatingRow label="Service" value={serviceRating} onChange={setServiceRating} />
          </div>
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-500"
            placeholder="Tell us what was fresh, fast, or what we should improve."
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={skipItem} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50">
              Later
            </button>
            <button type="button" disabled={submitting} onClick={submitReview} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60">
              {submitting ? 'Sending...' : 'Submit review'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReviewPrompt
