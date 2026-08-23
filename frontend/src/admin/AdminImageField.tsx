import { useRef, useState, DragEvent } from 'react'
import { Upload, Image as ImageIcon, Video, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { mediaUploadApi, contentApi } from '../services/adminApi'
import { getApiHost, resolveMediaUrl, getEmbedVideoUrl, isDirectVideoUrl } from '../services/api'

interface AdminImageFieldProps {
  value: string
  onChange: (url: string) => void
  label?: string
  hint?: string
  accept?: 'image' | 'video' | 'all'
}

const AdminImageField = ({ value, onChange, label = 'Image', hint, accept = 'image' }: AdminImageFieldProps) => {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const isVideo = accept === 'video' || (accept === 'all' && /\.(mp4|webm|ogg|mov)(\?|#|$)/i.test(value)) || /\/video\/upload\//i.test(value)
  const embedUrl = isVideo ? getEmbedVideoUrl(value) : ''
  const preview = value ? resolveMediaUrl(value) : ''
  const acceptAttr = accept === 'image' ? 'image/*' : accept === 'video' ? 'video/*' : 'image/*,video/*'

  const handleFile = async (file?: File) => {
    if (!file) return
    const isVideoFile = file.type.startsWith('video/')
    setUploading(true)
    try {
      if (isVideoFile) {
        const res = await contentApi.uploadContentImage(file)
        if (res?.url) {
          onChange(res.url)
          toast.success('Video uploaded')
        } else {
          toast.error('Upload failed')
        }
      } else {
        const res = await mediaUploadApi.uploadImage(file)
        if (res?.url) {
          onChange(res.url)
          toast.success('Image uploaded')
        } else {
          toast.error(res?.message || 'Upload failed')
        }
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.response?.data?.error || 'Upload failed')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  const renderPreview = () => {
    if (!preview) return null
    if (isVideo && embedUrl) {
      return <iframe src={embedUrl} title="Preview" className="h-full w-full rounded object-cover" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
    }
    if (isVideo && (isDirectVideoUrl(preview) || /\/video\/upload\//i.test(preview))) {
      return <video src={preview} controls className="h-full w-full rounded object-cover" />
    }
    return <img src={preview} alt="Preview" className="h-full w-full object-cover" />
  }

  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5">{label}</label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1 space-y-2">
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://… or /hincton/image.webp"
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-500"
          />
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`flex items-center gap-2 rounded-lg border-2 border-dashed px-3 py-2 text-sm font-bold transition-colors cursor-pointer ${
              dragOver ? 'border-red-400 bg-red-50 text-red-700' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            } ${uploading ? 'opacity-60 pointer-events-none' : ''}`}
            onClick={() => fileRef.current?.click()}
          >
            {isVideo ? <Video className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
            {uploading ? 'Uploading…' : isVideo ? 'Drop or click to upload video' : `Drop or click to upload ${accept === 'all' ? 'image or video' : 'image'}`}
          </div>
          <input ref={fileRef} type="file" accept={acceptAttr} className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
          {hint && <p className="text-xs text-gray-400">{hint}</p>}
        </div>
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
          {preview ? renderPreview() : (
            <div className="flex h-full w-full items-center justify-center text-gray-300">
              {isVideo ? <Video className="h-8 w-8" /> : <ImageIcon className="h-8 w-8" />}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminImageField
