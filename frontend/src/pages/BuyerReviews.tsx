import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Search, Edit, Trash2, ThumbsUp, ThumbsDown, MessageSquare, Package, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { reviewsApi } from '../services/buyerApi';
import { useAuth } from '../contexts/AuthContext';
import ConfirmationDialog from '../components/ui/ConfirmationDialog';

interface Review {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  rating: number;
  title: string;
  content: string;
  images?: string[];
  helpful: number;
  notHelpful: number;
  isVerifiedPurchase: boolean;
  createdAt: string;
  updatedAt: string;
  status: 'published' | 'pending' | 'rejected';
  orderId?: string;
  orderNumber?: string;
  sellerResponse?: string;
  canEdit: boolean;
}

interface ProductToReview {
  id: string;
  name: string;
  image?: string;
  orderId: string;
  orderItemId?: string;
  orderNumber: string;
  orderDate: string;
  canReview: boolean;
  hasReviewed: boolean;
  existingReviewId?: string;
}

const BuyerReviews: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [productsToReview, setProductsToReview] = useState<ProductToReview[]>([]);
  const [activeTab, setActiveTab] = useState<'my-reviews' | 'to-review' | 'pending'>('my-reviews');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | '5' | '4' | '3' | '2' | '1'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'rating-high' | 'rating-low'>('newest');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductToReview | null>(null);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: '',
    content: '',
    images: [] as string[]
  });
  const [submitting, setSubmitting] = useState(false);
  
  // Confirmation dialog state
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState({
    isOpen: false,
    reviewId: '',
    title: '',
    message: ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchReviews();
    fetchProductsToReview();
  }, [user, navigate]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await reviewsApi.getMyReviews();
      setReviews(response.reviews || []);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      toast.error('Could not load reviews');
    } finally {
      setLoading(false);
    }
  };

  const fetchProductsToReview = async () => {
    try {
      const response = await reviewsApi.getProductsToReview();
      setProductsToReview(response.products || []);
    } catch (error) {
      console.error('Failed to fetch products to review:', error);
      console.error('Could not load products to review');
    }
  };

  const submitReview = async () => {
    if (!selectedProduct) return;

    if (!reviewForm.title.trim() || !reviewForm.content.trim()) {
      toast.error('Please provide both title and review content');
      return;
    }

    setSubmitting(true);
    try {
      if (editingReview) {
        await reviewsApi.updateReview(editingReview.id, reviewForm);
        toast.success('Review updated successfully');
      } else {
        await reviewsApi.createReview({
          productId: selectedProduct.id,
          orderId: selectedProduct.orderId,
          orderItemId: selectedProduct.orderItemId,
          rating: reviewForm.rating,
          title: reviewForm.title.trim(),
          content: reviewForm.content.trim(),
          images: reviewForm.images
        });
        toast.success('Review submitted successfully');
      }

      setShowReviewModal(false);
      setSelectedProduct(null);
      setEditingReview(null);
      setReviewForm({ rating: 5, title: '', content: '', images: [] });
      
      // Refresh data
      fetchReviews();
      fetchProductsToReview();
    } catch (error) {
      console.error('Failed to submit review:', error);
      toast.error('Could not submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteReview = async (reviewId: string) => {
    setDeleteConfirmDialog({
      isOpen: true,
      reviewId,
      title: 'Delete Review',
      message: 'Are you sure you want to delete this review? This action cannot be undone and will permanently remove your review.'
    });
  };

  const handleConfirmDeleteReview = async () => {
    try {
      await reviewsApi.deleteReview(deleteConfirmDialog.reviewId);
      setReviews(prev => prev.filter(review => review.id !== deleteConfirmDialog.reviewId));
      toast.success('Review deleted successfully');
    } catch (error) {
      console.error('Failed to delete review:', error);
      toast.error('Could not delete review');
    } finally {
      setDeleteConfirmDialog(prev => ({ ...prev, isOpen: false }));
    }
  };

  const markHelpful = async (reviewId: string, helpful: boolean) => {
    try {
      await reviewsApi.markHelpful(reviewId, helpful);
      setReviews(prev => prev.map(review => {
        if (review.id === reviewId) {
          if (helpful) {
            return { ...review, helpful: review.helpful + 1 };
          } else {
            return { ...review, notHelpful: review.notHelpful + 1 };
          }
        }
        return review;
      }));
    } catch (error) {
      console.error('Failed to mark review helpful:', error);
      toast.error('Could not update review');
    }
  };

  const openReviewModal = (product: ProductToReview, review?: Review) => {
    setSelectedProduct(product);
    if (review) {
      setEditingReview(review);
      setReviewForm({
        rating: review.rating,
        title: review.title,
        content: review.content,
        images: review.images || []
      });
    } else {
      setEditingReview(null);
      setReviewForm({ rating: 5, title: '', content: '', images: [] });
    }
    setShowReviewModal(true);
  };

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = review.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filter === 'all' || review.rating === parseInt(filter);
    
    return matchesSearch && matchesFilter;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'rating-high':
        return b.rating - a.rating;
      case 'rating-low':
        return a.rating - b.rating;
      default:
        return 0;
    }
  });

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'w-3 h-3',
      md: 'w-4 h-4',
      lg: 'w-5 h-5'
    };

    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const renderRatingInput = () => {
    return (
      <div className="flex gap-2 justify-center mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
            className="p-1"
          >
            <Star
              className={`w-8 h-8 transition-colors ${
                star <= reviewForm.rating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300 hover:text-yellow-200'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Reviews & Ratings</h1>

          {/* Tabs */}
          <div className="flex gap-4 mb-6 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('my-reviews')}
              className={`pb-2 px-1 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'my-reviews'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              My Reviews ({reviews.length})
            </button>
            <button
              onClick={() => setActiveTab('to-review')}
              className={`pb-2 px-1 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'to-review'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              To Review ({productsToReview.filter(p => p.canReview && !p.hasReviewed).length})
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`pb-2 px-1 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'pending'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Pending ({reviews.filter(r => r.status === 'pending').length})
            </button>
          </div>

          {/* My Reviews Tab */}
          {activeTab === 'my-reviews' && (
            <div>
              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search reviews..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="all">All Ratings</option>
                  <option value="5">5 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="2">2 Stars</option>
                  <option value="1">1 Star</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="rating-high">Highest Rating</option>
                  <option value="rating-low">Lowest Rating</option>
                </select>
              </div>

              {/* Reviews List */}
              {filteredReviews.length === 0 ? (
                <div className="text-center py-12">
                  <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No reviews found</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredReviews.map((review) => (
                    <div key={review.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <img
                            src={review.productImage || '/placeholder.jpg'}
                            alt={review.productName}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                          <div>
                            <h3 className="font-semibold text-gray-900">{review.productName}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              {renderStars(review.rating)}
                              <span className="text-sm text-gray-500">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            {review.isVerifiedPurchase && (
                              <span className="inline-block mt-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                                Verified Purchase
                              </span>
                            )}
                            {review.status === 'pending' && (
                              <span className="inline-block mt-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                                Pending Approval
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {review.canEdit && (
                            <button
                              onClick={() => openReviewModal(
                                productsToReview.find(p => p.id === review.productId)!,
                                review
                              )}
                              className="p-2 text-gray-500 hover:text-gray-700"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteReview(review.id)}
                            className="p-2 text-gray-500 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <h4 className="font-medium text-gray-900 mb-2">{review.title}</h4>
                      <p className="text-gray-700 mb-4">{review.content}</p>

                      {review.images && review.images.length > 0 && (
                        <div className="flex gap-2 mb-4">
                          {review.images.map((image, index) => (
                            <img
                              key={index}
                              src={image}
                              alt={`Review image ${index + 1}`}
                              className="w-20 h-20 object-cover rounded-lg"
                            />
                          ))}
                        </div>
                      )}

                      {review.sellerResponse && (
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                          <p className="text-sm font-medium text-gray-900 mb-1">Seller Response:</p>
                          <p className="text-sm text-gray-700">{review.sellerResponse}</p>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => markHelpful(review.id, true)}
                            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                          >
                            <ThumbsUp className="w-4 h-4" />
                            Helpful ({review.helpful})
                          </button>
                          <button
                            onClick={() => markHelpful(review.id, false)}
                            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                          >
                            <ThumbsDown className="w-4 h-4" />
                            Not Helpful ({review.notHelpful})
                          </button>
                        </div>
                        {review.orderNumber && (
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Package className="w-4 h-4" />
                            Order {review.orderNumber}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* To Review Tab */}
          {activeTab === 'to-review' && (
            <div>
              {productsToReview.filter(p => p.canReview && !p.hasReviewed).length === 0 ? (
                <div className="text-center py-12">
                  <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No products to review</p>
                  <button
                    onClick={() => navigate('/shop')}
                    className="mt-4 bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700"
                  >
                    Browse Products
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {productsToReview
                    .filter(p => p.canReview && !p.hasReviewed)
                    .map((product) => (
                      <div key={product.id} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <img
                              src={product.image || '/placeholder.jpg'}
                              alt={product.name}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                            <div>
                              <h3 className="font-semibold text-gray-900">{product.name}</h3>
                              <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                                <Package className="w-4 h-4" />
                                Order {product.orderNumber}
                                <span>•</span>
                                <Calendar className="w-4 h-4" />
                                {new Date(product.orderDate).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => openReviewModal(product)}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700"
                          >
                            Write Review
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Pending Reviews Tab */}
          {activeTab === 'pending' && (
            <div>
              {reviews.filter(r => r.status === 'pending').length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No pending reviews</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews
                    .filter(r => r.status === 'pending')
                    .map((review) => (
                      <div key={review.id} className="border border-yellow-200 bg-yellow-50 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <img
                              src={review.productImage || '/placeholder.jpg'}
                              alt={review.productName}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                            <div>
                              <h3 className="font-semibold text-gray-900">{review.productName}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                {renderStars(review.rating)}
                                <span className="text-sm text-gray-500">
                                  {new Date(review.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
                            Pending Approval
                          </span>
                        </div>
                        <h4 className="font-medium text-gray-900 mb-2">{review.title}</h4>
                        <p className="text-gray-700">{review.content}</p>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Review Modal */}
        {showReviewModal && selectedProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {editingReview ? 'Edit Review' : 'Write a Review'}
                </h2>
                
                <div className="flex items-center gap-4 mb-6">
                  <img
                    src={selectedProduct.image || '/placeholder.jpg'}
                    alt={selectedProduct.name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div>
                    <h3 className="font-semibold text-gray-900">{selectedProduct.name}</h3>
                    <p className="text-sm text-gray-500">Order {selectedProduct.orderNumber}</p>
                  </div>
                </div>

                {/* Rating Input */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                  {renderRatingInput()}
                </div>

                {/* Review Title */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Review Title</label>
                  <input
                    type="text"
                    value={reviewForm.title}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Summarize your experience"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                {/* Review Content */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Review</label>
                  <textarea
                    value={reviewForm.content}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Share your experience with this product"
                    rows={5}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => {
                      setShowReviewModal(false);
                      setSelectedProduct(null);
                      setEditingReview(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitReview}
                    disabled={submitting}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : editingReview ? 'Update Review' : 'Submit Review'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteConfirmDialog.isOpen}
        onClose={() => setDeleteConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmDeleteReview}
        title={deleteConfirmDialog.title}
        message={deleteConfirmDialog.message}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        icon="delete"
      />
    </div>
  );
};

export default BuyerReviews;
