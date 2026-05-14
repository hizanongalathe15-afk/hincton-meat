import { useEffect, useState } from 'react'
import { Star, Eye, ThumbsUp, ThumbsDown, Filter } from 'lucide-react'
import { reviewsApi } from '../services/adminApi'
import toast from 'react-hot-toast'
import LinkifiedText from '../components/ui/LinkifiedText'

interface Review {
  id: string
  productId: string
  productName: string
  vendorId: string | null
  userId: string
  userName: string
  rating: number
  title: string
  content: string
  images: string[]
  helpful: number
  notHelpful: number
  isVerifiedPurchase: boolean
  status: string
  createdAt: string
  updatedAt: string
}

const AdminReviewsPage = () => {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState({
    status: '',
    rating: '',
    productId: ''
  })

  const loadReviews = async () => {
    try {
      setLoading(true)
      const params = {
        page,
        limit: 20,
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      }
      const response = await reviewsApi.getProductReviews(params)
      setReviews(response.data)
      setTotal(response.pagination.total)
    } catch (error) {
      console.error('Failed to load reviews:', error)
      toast.error('Failed to load reviews')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReviews()
  }, [page, filters])

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(1)
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ))
  }

  if (loading && reviews.length === 0) {
    return <div className="p-6 text-gray-600">Loading reviews...</div>
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-950">Product Reviews</h1>
        <p className="mt-1 text-gray-600">View and manage all product reviews from customers</p>
      </div>

      {/* Filters */}
      <div className="rounded bg-white p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <Filter className="h-5 w-5 text-gray-500" />
          <div className="flex gap-4">
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="rounded border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <select
              value={filters.rating}
              onChange={(e) => handleFilterChange('rating', e.target.value)}
              className="rounded border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center">
                    {renderStars(review.rating)}
                  </div>
                  <span className="text-sm text-gray-500">
                    by {review.userName} • {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                  {review.isVerifiedPurchase && (
                    <span className="rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                      Verified Purchase
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-gray-950 mb-1">{review.title}</h3>
                <p className="text-gray-700 mb-3 whitespace-pre-wrap"><LinkifiedText text={review.content} /></p>
                <div className="text-sm text-gray-600">
                  Product: <span className="font-medium">{review.productName}</span>
                </div>
                {review.images.length > 0 && (
                  <div className="mt-3 flex gap-2">
                    {review.images.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`Review image ${index + 1}`}
                        className="h-16 w-16 rounded object-cover"
                      />
                    ))}
                  </div>
                )}
                <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <ThumbsUp className="h-4 w-4" />
                    {review.helpful}
                  </div>
                  <div className="flex items-center gap-1">
                    <ThumbsDown className="h-4 w-4" />
                    {review.notHelpful}
                  </div>
                </div>
              </div>
              <div className="ml-4">
                <span className={`rounded px-2 py-1 text-xs font-medium ${
                  review.status === 'approved'
                    ? 'bg-green-100 text-green-800'
                    : review.status === 'rejected'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {review.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, total)} of {total} reviews
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded border border-gray-300 px-3 py-2 text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page * 20 >= total}
              className="rounded border border-gray-300 px-3 py-2 text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {reviews.length === 0 && !loading && (
        <div className="rounded bg-white p-8 text-center shadow-sm">
          <Eye className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No reviews found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your filters or check back later.
          </p>
        </div>
      )}
    </div>
  )
}

export default AdminReviewsPage
