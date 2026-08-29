import React, { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Star, 
  Sparkles, 
  ShieldCheck, 
  MapPin, 
  Clock, 
  ChefHat, 
  Camera, 
  X,
  Award,
  Heart,
  Loader2
} from 'lucide-react'
import toast from 'react-hot-toast'
import { photoReviewsApi } from '../../services/buyerApi'
import { useAuth } from '../../contexts/AuthContext'
import { getEmbedVideoUrl, isDirectVideoUrl } from '../../services/api'

interface PhotoReview {
  id: string
  authorName: string
  location: string | null
  rating: number
  cutPurchased: string
  dishPrepared: string
  cookingTip: string | null
  photoUrl: string
  verifiedBuyer: boolean
  likes: number
  likedByMe: boolean
  createdAt: string
}

const relativeDate = (iso: string) => {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const days = Math.floor((Date.now() - then) / 86400000)
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return new Date(iso).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })
}

const cardVariants = {
  hidden: { opacity: 0, y: 32, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1 },
}

export const PhotoReviewsProvenanceSection: React.FC<{ preloadedReviews?: any[] | null }> = ({ preloadedReviews }) => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'reviews' | 'provenance'>('reviews')
  const [reviews, setReviews] = useState<PhotoReview[]>(preloadedReviews || [])
  const [loading, setLoading] = useState(!preloadedReviews)
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [reviewDish, setReviewDish] = useState('')
  const [reviewCut, setReviewCut] = useState('')
  const [reviewTip, setReviewTip] = useState('')
  const [reviewName, setReviewName] = useState('')
  const [reviewLocation, setReviewLocation] = useState('')
  const [reviewPhoto, setReviewPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const likingIds = useRef<Set<string>>(new Set())

  const loadReviews = useCallback(async () => {
    try {
      const data = await photoReviewsApi.list(12)
      setReviews(data.reviews || [])
    } catch {
      toast.error('Could not load customer creations right now')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Skip fetch if we already have preloaded data
    if (preloadedReviews) {
      setReviews(preloadedReviews)
      setLoading(false)
      return
    }
    loadReviews()
  }, [loadReviews, preloadedReviews])

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview)
    }
  }, [photoPreview])

  const handlePhotoPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      toast.error('Please choose an image or video file')
      return
    }
    if (file.size > 80 * 1024 * 1024) {
      toast.error('File must be under 80MB')
      return
    }
    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setReviewPhoto(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const resetForm = () => {
    setReviewDish('')
    setReviewCut('')
    setReviewTip('')
    setReviewName('')
    setReviewLocation('')
    setReviewPhoto(null)
    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setPhotoPreview(null)
  }

  const handleUploadReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reviewDish.trim() || !reviewCut.trim()) {
      toast.error('Please enter your dish and meat cut')
      return
    }
    if (!reviewPhoto) {
      toast.error('Please attach a photo of your dish')
      return
    }
    if (!user && !reviewName.trim()) {
      toast.error('Please tell us your name')
      return
    }
    setSubmitting(true)
    try {
      const data = await photoReviewsApi.submit({
        photo: reviewPhoto,
        authorName: reviewName.trim() || undefined,
        location: reviewLocation.trim() || undefined,
        cutPurchased: reviewCut.trim(),
        dishPrepared: reviewDish.trim(),
        cookingTip: reviewTip.trim() || undefined,
      })
      toast.success(data.message || 'Your photo review is live.')
      if (data.review) setReviews((prev) => [data.review, ...prev])
      setModalOpen(false)
      resetForm()
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Could not submit your review. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleLike = async (rev: PhotoReview) => {
    if (likingIds.current.has(rev.id)) return
    likingIds.current.add(rev.id)
    const nextLiked = !rev.likedByMe
    setReviews((prev) =>
      prev.map((r) =>
        r.id === rev.id
          ? { ...r, likedByMe: nextLiked, likes: Math.max(0, r.likes + (nextLiked ? 1 : -1)) }
          : r,
      ),
    )
    try {
      const data = await photoReviewsApi.toggleLike(rev.id)
      setReviews((prev) =>
        prev.map((r) => (r.id === rev.id ? { ...r, likedByMe: data.liked, likes: data.likes } : r)),
      )
    } catch {
      setReviews((prev) =>
        prev.map((r) =>
          r.id === rev.id
            ? { ...r, likedByMe: rev.likedByMe, likes: rev.likes }
            : r,
        ),
      )
    } finally {
      likingIds.current.delete(rev.id)
    }
  }

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header & Toggle */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-black uppercase tracking-wider mb-2">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Real Kitchens · 6:00 AM Certified Provenance</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-stone-900 dark:text-white tracking-tight">
            What Our Customers Cooked & Farm Provenance
          </h2>
          <p className="text-sm text-stone-600 dark:text-stone-300 mt-2 max-w-2xl">
            See real culinary creations from our Nairobi home chefs and trace our direct ethical sourcing from Kenyan highland pastures.
          </p>
        </div>

        <div className="flex gap-2 p-1.5 rounded-2xl bg-stone-100 dark:bg-stone-800 self-start md:self-auto">
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
              activeTab === 'reviews'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-md'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            <Camera className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
            Customer Creations ({loading ? '…' : reviews.length})
          </button>
          <button
            onClick={() => setActiveTab('provenance')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
              activeTab === 'provenance'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-md'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            <ChefHat className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
            Meet Our Kenyan Farmers
          </button>
        </div>
      </div>

      {/* 1. Customer Photo Reviews Tab */}
      <AnimatePresence mode="wait">
        {activeTab === 'reviews' && (
          <motion.div
            key="reviews"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="glass-card-ultra rounded-[2.5rem] overflow-hidden border border-white/50 bg-white/80 dark:bg-stone-900/80 shadow-xl animate-pulse"
                  >
                    <div className="aspect-[4/3] bg-stone-200 dark:bg-stone-800" />
                    <div className="p-6 space-y-3">
                      <div className="h-3 w-1/2 rounded bg-stone-200 dark:bg-stone-800" />
                      <div className="h-3 w-3/4 rounded bg-stone-200 dark:bg-stone-800" />
                      <div className="h-16 rounded-2xl bg-stone-100 dark:bg-stone-800/60" />
                    </div>
                  </div>
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <div className="glass-card-ultra rounded-[2.5rem] border border-white/50 bg-white/80 dark:bg-stone-900/80 shadow-xl p-12 text-center">
                <Camera className="h-10 w-10 mx-auto text-stone-400 mb-3" />
                <p className="text-sm font-bold text-stone-700 dark:text-stone-200">
                  No kitchen creations shared yet — be the first!
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                  Cook something delicious with our cuts, snap a photo, and earn +100 Loyalty Points.
                </p>
              </div>
            ) : (
              <motion.div
                className="grid grid-cols-1 md:grid-cols-3 gap-8"
                variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
                initial="hidden"
                animate="visible"
              >
                {reviews.map((rev) => (
                  <motion.div
                    key={rev.id}
                    variants={cardVariants}
                    transition={{ duration: 0.45, ease: 'easeOut' }}
                    whileHover={{ y: -6 }}
                    className="glass-card-ultra rounded-[2.5rem] overflow-hidden border border-white/50 bg-white/80 dark:bg-stone-900/80 shadow-xl flex flex-col justify-between group"
                  >
                    <div>
                      {/* Photo Container */}
                      <div className="relative aspect-[4/3] overflow-hidden bg-stone-900">
                        {isDirectVideoUrl(rev.photoUrl) || /\/video\/upload\//i.test(rev.photoUrl) ? (
                          getEmbedVideoUrl(rev.photoUrl) ? (
                            <iframe src={getEmbedVideoUrl(rev.photoUrl)} title={rev.dishPrepared} className="w-full h-full object-cover" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
                          ) : (
                            <video src={rev.photoUrl} controls className="w-full h-full object-cover" />
                          )
                        ) : (
                          <img
                            src={rev.photoUrl}
                            alt={rev.dishPrepared}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        )}
                        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-stone-950/80 backdrop-blur-md text-amber-400 text-xs font-bold flex items-center gap-1 shadow-lg">
                          <Star className="h-3.5 w-3.5 fill-amber-400" />
                          <span>{rev.rating}.0</span>
                        </div>
                        <div className="absolute bottom-3 left-3 px-3 py-1 rounded-xl bg-stone-950/80 backdrop-blur-md text-white text-[11px] font-extrabold">
                          {rev.cutPurchased}
                        </div>
                      </div>

                      {/* Review Text */}
                      <div className="p-6 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-extrabold text-sm text-stone-900 dark:text-white">
                              {rev.authorName}
                            </h4>
                            <span className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3 w-3" />
                              {rev.location ? `${rev.location} · ` : ''}{relativeDate(rev.createdAt)}
                            </span>
                          </div>
                          {rev.verifiedBuyer && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                              Verified Cut
                            </span>
                          )}
                        </div>

                        <h5 className="font-black text-sm text-stone-800 dark:text-stone-100">
                          "{rev.dishPrepared}"
                        </h5>

                        {/* Cooking Tip Quote */}
                        {rev.cookingTip && (
                          <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700/50 text-xs text-stone-600 dark:text-stone-300 italic">
                            <p className="font-semibold text-stone-900 dark:text-white not-italic text-[11px] mb-1 flex items-center gap-1 text-[var(--site-primary)]">
                              <ChefHat className="h-3.5 w-3.5" /> Chef's Tip:
                            </p>
                            "{rev.cookingTip}"
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="px-6 pb-5 pt-3 flex items-center justify-between text-xs text-stone-500 border-t border-stone-100 dark:border-stone-800 mt-1">
                      <button
                        onClick={() => handleToggleLike(rev)}
                        className={`flex items-center gap-1.5 font-bold transition-colors ${
                          rev.likedByMe
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-stone-400 hover:text-rose-600 dark:hover:text-rose-400'
                        }`}
                        aria-pressed={rev.likedByMe}
                      >
                        <Heart className={`h-3.5 w-3.5 ${rev.likedByMe ? 'fill-rose-500 text-rose-500' : ''}`} />
                        {rev.likes} found this inspiring
                      </button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Upload Photo Call to Action Banner */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.4 }}
              className="glass-card-ultra rounded-3xl p-6 sm:p-8 border border-white/50 bg-gradient-to-r from-red-600/10 via-amber-500/5 to-transparent flex flex-col sm:flex-row items-center justify-between gap-6"
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-[var(--site-primary)] text-white flex items-center justify-center shadow-lg flex-shrink-0">
                  <Camera className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-stone-900 dark:text-white">
                    Cooked something delicious with our cuts?
                  </h3>
                  <p className="text-xs text-stone-600 dark:text-stone-300 mt-0.5">
                    Share your kitchen photo with your secret cooking tip and earn **+100 Loyalty Points** towards your next purchase.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setModalOpen(true)}
                className="flex-shrink-0 px-6 py-3 rounded-2xl bg-[var(--site-primary)] text-white text-xs font-black shadow-xl hover:scale-105 transition flex items-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                <span>Submit Photo Review (+100 Pts)</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Farm Provenance Tab */}
      {activeTab === 'provenance' && (
        <motion.div
          key="provenance"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          <div className="glass-card-ultra rounded-[2.5rem] p-6 border border-white/50 bg-white/80 dark:bg-stone-900/80 shadow-xl space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg">
              <MapPin className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-black text-stone-900 dark:text-white">
              Naivasha & Laikipia Pastures
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              Our cattle graze naturally on pesticide-free Kenyan highland pastures with free access to mineral springs. 100% grass-fed and finished for healthy omega fats and deep beef flavor.
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
              <Award className="h-3.5 w-3.5" /> 100% Halal & Vet Certified
            </div>
          </div>

          <div className="glass-card-ultra rounded-[2.5rem] p-6 border border-white/50 bg-white/80 dark:bg-stone-900/80 shadow-xl space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-lg">
              <Clock className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-black text-stone-900 dark:text-white">
              Sourced at 6:00 AM Daily
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              Every carcass is processed at dawn under strict cold-chain supervision. Never frozen twice, ensuring natural juices and enzymes remain preserved from the counter to your doorstep.
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
              <Clock className="h-3.5 w-3.5" /> Strict 2°C Cold Chain
            </div>
          </div>

          <div className="glass-card-ultra rounded-[2.5rem] p-6 border border-white/50 bg-white/80 dark:bg-stone-900/80 shadow-xl space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-lg">
              <ChefHat className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-black text-stone-900 dark:text-white">
              Hand-Trimmed by Master Cutters
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              Every cut is hand-portioned by veteran Kenyan butchers with 15+ years experience. Custom thicknesses, special marinades, or bone-in cuts available upon request on WhatsApp.
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-bold">
              <Sparkles className="h-3.5 w-3.5" /> Custom Cut Precision
            </div>
          </div>
        </motion.div>
      )}

      {/* Customer Review Upload Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 24 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 24 }}
              className="glass-card-ultra w-full max-w-lg rounded-3xl p-6 sm:p-8 border border-white/60 bg-white/95 dark:bg-stone-900/95 shadow-2xl text-stone-900 dark:text-white my-8"
            >
              <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-4 mb-4">
                <div className="flex items-center gap-2.5">
                  <Camera className="h-5 w-5 text-[var(--site-primary)]" />
                  <h3 className="text-lg font-black">Submit Kitchen Photo Review</h3>
                </div>
                <button onClick={() => setModalOpen(false)} className="p-1 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleUploadReview} className="space-y-4">
                {!user && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold mb-1">Your Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Wanjiru K."
                        value={reviewName}
                        onChange={(e) => setReviewName(e.target.value)}
                        className="w-full text-xs rounded-xl border border-stone-300 dark:border-stone-700 p-2.5 bg-white dark:bg-stone-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1">Area (optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Kilimani, Nairobi"
                        value={reviewLocation}
                        onChange={(e) => setReviewLocation(e.target.value)}
                        className="w-full text-xs rounded-xl border border-stone-300 dark:border-stone-700 p-2.5 bg-white dark:bg-stone-800"
                      />
                    </div>
                  </div>
                )}
                {user && (
                  <div>
                    <label className="block text-xs font-bold mb-1">Area (optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Kilimani, Nairobi"
                      value={reviewLocation}
                      onChange={(e) => setReviewLocation(e.target.value)}
                      className="w-full text-xs rounded-xl border border-stone-300 dark:border-stone-700 p-2.5 bg-white dark:bg-stone-800"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold mb-1">Meat Cut Used</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Prime Aged Ribeye, Mbuzi Choma Ribs"
                    value={reviewCut}
                    onChange={(e) => setReviewCut(e.target.value)}
                    className="w-full text-xs rounded-xl border border-stone-300 dark:border-stone-700 p-2.5 bg-white dark:bg-stone-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">Dish Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Garlic Basted Steak, Swahili Kuku"
                    value={reviewDish}
                    onChange={(e) => setReviewDish(e.target.value)}
                    className="w-full text-xs rounded-xl border border-stone-300 dark:border-stone-700 p-2.5 bg-white dark:bg-stone-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">Your Cooking Tip (for other buyers)</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Rest for 8 minutes, sear in cast iron at max heat..."
                    value={reviewTip}
                    onChange={(e) => setReviewTip(e.target.value)}
                    className="w-full text-xs rounded-xl border border-stone-300 dark:border-stone-700 p-2.5 bg-white dark:bg-stone-800"
                  />
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={handlePhotoPick}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-4 rounded-2xl border-2 border-dashed border-stone-300 dark:border-stone-700 text-center cursor-pointer hover:border-[var(--site-primary)] transition overflow-hidden"
                >
                  {photoPreview ? (
                    reviewPhoto?.type?.startsWith('video/') ? (
                      <video src={photoPreview} controls className="max-h-40 mx-auto rounded-xl object-contain" />
                    ) : (
                      <img src={photoPreview} alt="Your dish preview" className="max-h-40 mx-auto rounded-xl object-contain" />
                    )
                  ) : (
                    <>
                      <Camera className="h-8 w-8 mx-auto text-stone-400 mb-1" />
                      <p className="text-xs font-bold text-stone-600 dark:text-stone-300">Tap to choose meal photo or video</p>
                      <p className="text-[10px] text-stone-400">Images or videos up to 80MB</p>
                    </>
                  )}
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-2xl bg-[var(--site-primary)] text-white text-xs font-black shadow-lg hover:scale-[1.02] transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Publishing...
                    </>
                  ) : (
                    <>Publish Photo {user ? '(+100 Loyalty Points)' : ''}</>
                  )}
                </button>
                {!user && (
                  <p className="text-[10px] text-stone-400 text-center">
                    Posting as a guest. Create an account to earn loyalty points on your reviews.
                  </p>
                )}
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  )
}

export default PhotoReviewsProvenanceSection
