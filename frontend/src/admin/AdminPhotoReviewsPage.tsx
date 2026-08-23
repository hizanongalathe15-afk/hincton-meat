import { useEffect, useRef, useState, DragEvent } from 'react'
import toast from 'react-hot-toast'
import { Plus, Save, Trash2, Camera, X, Star, Eye, EyeOff, Sparkles, Upload, Video } from 'lucide-react'
import { photoReviewsAdminApi } from '../services/adminApi'
import { useConfirmationDialog } from '../hooks/useConfirmationDialog'
import ConfirmationDialog from '../components/ui/ConfirmationDialog'
import { getApiHost, getEmbedVideoUrl, isDirectVideoUrl } from '../services/api'

const inputCls = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-500'
const labelCls = 'block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5'

const AdminPhotoReviewsPage = () => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [reviews, setReviews] = useState<any[]>([])
  const [creating, setCreating] = useState(false)
  const [editingTipId, setEditingTipId] = useState<string | null>(null)
  const [tipDraft, setTipDraft] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({
    authorName: '',
    location: '',
    cutPurchased: '',
    dishPrepared: '',
    cookingTip: '',
    rating: 5,
    verifiedBuyer: true,
    isFeatured: false,
    photoUrl: '',
  })
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [mediaDragOver, setMediaDragOver] = useState(false)
  const { isOpen, options, confirm, handleConfirm, handleCancel } = useConfirmationDialog()

  const load = async () => {
    setLoading(true)
    try {
      const res = await photoReviewsAdminApi.list()
      setReviews(res.reviews || [])
    } catch {
      toast.error('Could not load photo reviews')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // Revoke object URLs when the preview changes or on unmount
  useEffect(() => {
    return () => {
      if (photoPreview.startsWith('blob:')) URL.revokeObjectURL(photoPreview)
    }
  }, [photoPreview])

  const resolvePhoto = (url?: string) => (url?.startsWith('http') ? url : `${getApiHost()}${url || ''}`)

  const pickPhoto = (file?: File) => {
    if (!file) return
    if (photoPreview.startsWith('blob:')) URL.revokeObjectURL(photoPreview)
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const handleMediaDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setMediaDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) pickPhoto(file)
  }

  const submit = async () => {
    if (!form.authorName.trim() || !form.cutPurchased.trim() || !form.dishPrepared.trim()) {
      return toast.error('Author, cut purchased and dish are required')
    }
    if (!photoFile && !form.photoUrl.trim()) {
      return toast.error('Upload a photo or paste an image URL')
    }
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('authorName', form.authorName.trim())
      if (form.location.trim()) fd.append('location', form.location.trim())
      fd.append('cutPurchased', form.cutPurchased.trim())
      fd.append('dishPrepared', form.dishPrepared.trim())
      if (form.cookingTip.trim()) fd.append('cookingTip', form.cookingTip.trim())
      fd.append('rating', String(form.rating))
      fd.append('verifiedBuyer', String(form.verifiedBuyer))
      fd.append('isFeatured', String(form.isFeatured))
      if (form.photoUrl.trim()) fd.append('photoUrl', form.photoUrl.trim())
      if (photoFile) fd.append('photo', photoFile)
      await photoReviewsAdminApi.create(fd)
      toast.success('Photo review published')
      setCreating(false)
      setForm({ authorName: '', location: '', cutPurchased: '', dishPrepared: '', cookingTip: '', rating: 5, verifiedBuyer: true, isFeatured: false, photoUrl: '' })
      setPhotoFile(null)
      if (photoPreview.startsWith('blob:')) URL.revokeObjectURL(photoPreview)
      setPhotoPreview('')
      await load()
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Could not create review')
    } finally {
      setSaving(false)
    }
  }

  const toggleStatus = async (r: any) => {
    try {
      await photoReviewsAdminApi.update(r.id, { status: r.status === 'APPROVED' ? 'HIDDEN' : 'APPROVED' })
      toast.success(r.status === 'APPROVED' ? 'Review hidden from homepage' : 'Review approved & visible')
      await load()
    } catch {
      toast.error('Could not update review')
    }
  }

  const toggleFeatured = async (r: any) => {
    try {
      await photoReviewsAdminApi.update(r.id, { isFeatured: !r.isFeatured })
      toast.success(r.isFeatured ? 'Removed from featured' : 'Marked as featured')
      await load()
    } catch {
      toast.error('Could not update review')
    }
  }

  const saveTip = async (r: any) => {
    try {
      await photoReviewsAdminApi.update(r.id, { cookingTip: tipDraft.trim() })
      toast.success('Chef tip updated')
      setEditingTipId(null)
      await load()
    } catch {
      toast.error('Could not update tip')
    }
  }

  const remove = (r: any) => {
    confirm({
      title: 'Delete photo review?',
      message: `Delete the review by "${r.authorName}"? This removes it from the Customer Creations section.`,
      type: 'danger',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          await photoReviewsAdminApi.remove(r.id)
          toast.success('Review deleted')
          await load()
        } catch {
          toast.error('Could not delete review')
        }
      },
    })
  }

  // ---------- Create view ----------
  if (creating) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
        <button onClick={() => setCreating(false)} className="inline-flex items-center gap-2 text-sm font-bold text-red-700 hover:text-red-800 mb-6">
          <X className="h-4 w-4" /> Back to photo reviews
        </button>
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-gray-950 via-[#9f2f20] to-gray-950 text-white px-6 py-5">
            <h1 className="text-2xl font-extrabold">Publish a Customer Creation</h1>
            <p className="text-sm text-red-200 mt-1">Add a curated review (e.g. from WhatsApp submissions) to the homepage gallery.</p>
          </div>
          <div className="p-6 space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className={labelCls}>Author name</label>
                <input value={form.authorName} onChange={(e) => setForm({ ...form, authorName: e.target.value })} placeholder="Wanjiru K." className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Location (optional)</label>
                <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Kilimani, Nairobi" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Cut purchased</label>
                <input value={form.cutPurchased} onChange={(e) => setForm({ ...form, cutPurchased: e.target.value })} placeholder="Prime Dry-Aged Ribeye" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Dish prepared</label>
                <input value={form.dishPrepared} onChange={(e) => setForm({ ...form, dishPrepared: e.target.value })} placeholder="Cast-Iron Butter Basted Ribeye" className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Chef's tip (optional)</label>
              <textarea value={form.cookingTip} onChange={(e) => setForm({ ...form, cookingTip: e.target.value })} rows={3} placeholder="Rest for a solid 8 minutes with garlic butter…" className={inputCls} />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className={labelCls}>Rating</label>
                <select value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })} className={inputCls}>
                  {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n > 1 ? 's' : ''}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-200 bg-white text-sm">
                <input type="checkbox" checked={form.verifiedBuyer} onChange={(e) => setForm({ ...form, verifiedBuyer: e.target.checked })} />
                Verified buyer badge
              </label>
              <label className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-200 bg-white text-sm">
                <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} />
                Featured on homepage
              </label>
            </div>
            <div>
              <label className={labelCls}>Photo or video</label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex-1 space-y-2">
                  <div
                    onDragOver={(e) => { e.preventDefault(); setMediaDragOver(true) }}
                    onDragLeave={() => setMediaDragOver(false)}
                    onDrop={handleMediaDrop}
                    onClick={() => fileRef.current?.click()}
                    className={`flex items-center gap-2 rounded-lg border-2 border-dashed px-3 py-2 text-sm font-bold transition-colors cursor-pointer ${
                      mediaDragOver ? 'border-red-400 bg-red-50 text-red-700' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {photoFile?.type?.startsWith('video/') ? <Video className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
                    {photoFile ? `Selected: ${photoFile.name}` : 'Drop or click to upload image/video'}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={(e) => pickPhoto(e.target.files?.[0])} />
                  <input value={form.photoUrl} onChange={(e) => setForm({ ...form, photoUrl: e.target.value })} placeholder="…or paste an image/video URL" className={inputCls} />
                </div>
                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                  {photoPreview ? (
                    photoFile?.type?.startsWith('video/') ? (
                      <video src={photoPreview} controls className="h-full w-full object-cover" />
                    ) : (
                      <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
                    )
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-300"><Camera className="h-8 w-8" /></div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setCreating(false)} className="rounded-lg border border-gray-200 bg-white px-5 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={submit} disabled={saving} className="rounded-lg bg-red-600 px-5 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60 inline-flex items-center gap-2">
                <Save className="h-4 w-4" /> {saving ? 'Publishing…' : 'Publish Review'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ---------- List view ----------
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-950 inline-flex items-center gap-2"><Camera className="h-8 w-8 text-red-600" /> Customer Creations</h1>
          <p className="mt-1 text-sm text-gray-600">Moderate customer photo reviews. Featured ones appear first in the homepage gallery.</p>
        </div>
        <button onClick={() => setCreating(true)} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-700">
          <Plus className="h-4 w-4" /> Add Review
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[0, 1, 2].map((i) => <div key={i} className="h-80 animate-pulse rounded-2xl bg-white border border-gray-200" />)}
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-12 text-center">
          <Camera className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 font-semibold text-gray-700">No photo reviews yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col">
              <div className="relative h-44">
                {isDirectVideoUrl(resolvePhoto(r.photoUrl)) || /\/video\/upload\//i.test(resolvePhoto(r.photoUrl)) ? (
                  getEmbedVideoUrl(resolvePhoto(r.photoUrl)) ? (
                    <iframe src={getEmbedVideoUrl(resolvePhoto(r.photoUrl))} title={r.dishPrepared} className="h-full w-full object-cover" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
                  ) : (
                    <video src={resolvePhoto(r.photoUrl)} controls className="h-full w-full object-cover" />
                  )
                ) : (
                  <img src={resolvePhoto(r.photoUrl)} alt={r.dishPrepared} className="h-full w-full object-cover" />
                )}
                <div className="absolute top-2 left-2 flex gap-1.5">
                  {r.status === 'APPROVED' ? (
                    <span className="rounded-full bg-green-600 px-2.5 py-0.5 text-[10px] font-bold text-white">Visible</span>
                  ) : (
                    <span className="rounded-full bg-orange-500 px-2.5 py-0.5 text-[10px] font-bold text-white">Hidden</span>
                  )}
                  {r.isFeatured && <span className="rounded-full bg-amber-400 px-2.5 py-0.5 text-[10px] font-bold text-amber-950">Featured</span>}
                  {r.verifiedBuyer && <span className="rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-bold text-gray-800">Verified</span>}
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-950">{r.authorName}</h3>
                  <span className="inline-flex items-center gap-0.5 text-amber-500">
                    {Array.from({ length: r.rating || 5 }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}
                  </span>
                </div>
                {r.location && <p className="text-xs text-gray-500">{r.location}</p>}
                <p className="text-sm text-gray-700"><b>{r.dishPrepared}</b> · {r.cutPurchased}</p>
                {editingTipId === r.id ? (
                  <div className="space-y-2">
                    <textarea value={tipDraft} onChange={(e) => setTipDraft(e.target.value)} rows={3} className={inputCls} />
                    <div className="flex gap-2">
                      <button onClick={() => saveTip(r)} className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700">Save tip</button>
                      <button onClick={() => setEditingTipId(null)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-600">Cancel</button>
                    </div>
                  </div>
                ) : (
                  r.cookingTip && (
                    <button onClick={() => { setEditingTipId(r.id); setTipDraft(r.cookingTip) }} className="text-left text-xs text-gray-500 italic hover:text-red-600 line-clamp-2" title="Click to edit chef tip">
                      “{r.cookingTip}”
                    </button>
                  )
                )}
                <p className="text-xs text-gray-400 mt-auto">
                  {r.likesCount || 0} found this inspiring · {r.user?.email || r.user?.username || 'Guest submission'}
                </p>
              </div>
              <div className="border-t border-gray-100 px-4 py-3 flex flex-wrap items-center gap-2">
                <button onClick={() => toggleFeatured(r)} className={`rounded-lg px-3 py-1.5 text-xs font-bold inline-flex items-center gap-1 ${r.isFeatured ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' : 'border border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                  <Sparkles className="h-3.5 w-3.5" /> {r.isFeatured ? 'Unfeature' : 'Feature'}
                </button>
                <button onClick={() => toggleStatus(r)} className={`rounded-lg px-3 py-1.5 text-xs font-bold inline-flex items-center gap-1 ${r.status === 'APPROVED' ? 'border border-orange-200 text-orange-700 hover:bg-orange-50' : 'border border-green-200 text-green-700 hover:bg-green-50'}`}>
                  {r.status === 'APPROVED' ? <><EyeOff className="h-3.5 w-3.5" /> Hide</> : <><Eye className="h-3.5 w-3.5" /> Approve</>}
                </button>
                <button onClick={() => remove(r)} className="ml-auto rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50 inline-flex items-center gap-1">
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmationDialog isOpen={isOpen} onClose={handleCancel} onConfirm={handleConfirm} title={options?.title || ''} message={options?.message || ''} confirmText={options?.confirmText} cancelText={options?.cancelText} type={options?.type} />
    </div>
  )
}

export default AdminPhotoReviewsPage
