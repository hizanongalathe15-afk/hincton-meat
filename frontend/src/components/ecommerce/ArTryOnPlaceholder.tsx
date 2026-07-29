import React, { useEffect, useRef, useState } from 'react'
import { Camera, X, Maximize2, AlertCircle, Sparkles, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useSiteContent } from '../../contexts/SiteContentContext'

type ArTryOnPlaceholderProps = {
  productId?: string
  productName?: string
  productImage?: string
}

const ArTryOnPlaceholder: React.FC<ArTryOnPlaceholderProps> = ({
  productId,
  productName = 'this cut',
  productImage,
}) => {
  const { profile } = useSiteContent()
  const [open, setOpen] = useState(false)
  const [requesting, setRequesting] = useState(false)
  const [streamOn, setStreamOn] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [notSupported, setNotSupported] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const arEnabled = !!profile.featureToggles?.arProductTryOn

  useEffect(() => {
    const userAgent = typeof navigator === 'undefined' ? '' : navigator.userAgent || ''
    const unsupported =
      !userAgent ||
      /MSIE |Trident\//.test(userAgent) ||
      (typeof navigator !== 'undefined' && !(navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function'))
    setNotSupported(unsupported && !arEnabled)
  }, [arEnabled])

  useEffect(() => {
    return () => {
      stopStream()
    }
  }, [])

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setStreamOn(false)
  }

  const handleOpen = async () => {
    if (!arEnabled) {
      setOpen(true)
      return
    }
    setOpen(true)
    setCameraError(null)
    setRequesting(true)
    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera access is not supported in this browser.')
        setNotSupported(true)
        return
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => {})
      }
      setStreamOn(true)
      toast.success('Camera active. Use the overlay to preview the cut placement.')
    } catch (error: any) {
      const name = error?.name || ''
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        setCameraError('Camera permission denied. Please allow access in your browser settings.')
      } else if (name === 'NotFoundError' || name === 'OverconstrainedError') {
        setCameraError('No camera found on this device.')
      } else if (name === 'NotReadableError') {
        setCameraError('Your camera is in use by another app. Close it and try again.')
      } else {
        setCameraError('Unable to start the camera. Try again or use the product preview.')
      }
      toast.error('Could not open your camera')
    } finally {
      setRequesting(false)
    }
  }

  const handleClose = () => {
    stopStream()
    setCameraError(null)
    setOpen(false)
  }

  const overlayImage = productImage || profile.images?.hero || '/hincton/hero-platter.webp'

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="group relative inline-flex items-center gap-2 rounded-xl border border-dashed border-violet-300 bg-gradient-to-r from-violet-50 to-fuchsia-50 hover:from-violet-100 hover:to-fuchsia-100 px-4 py-3 text-sm font-semibold text-violet-800 transition-all"
      >
        <div className="p-1.5 rounded-lg bg-violet-600 text-white group-hover:scale-105 transition-transform">
          <Maximize2 className="w-4 h-4" />
        </div>
        <span className="text-left">
          <span className="block">See this cut on your table</span>
          <span className="block text-[11px] font-medium text-violet-600/80">
            AR preview · Camera or reference image
          </span>
        </span>
        <Sparkles className="w-4 h-4 text-fuchsia-500 shrink-0" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ar-tryon-title"
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleClose} />
          <div className="relative z-10 w-full max-w-3xl rounded-3xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-violet-100 text-violet-700">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-violet-600 font-semibold">
                    AR Try-On Preview
                  </div>
                  <h2 id="ar-tryon-title" className="font-bold text-gray-900">
                    Preview {productName}
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="shrink-0 p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Close AR preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative bg-black aspect-[16/10] sm:aspect-video overflow-hidden">
              {requesting && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white bg-black/60 z-20">
                  <Loader2 className="w-8 h-8 animate-spin text-red-500" />
                  <div className="text-sm font-medium">Requesting camera access…</div>
                </div>
              )}

              {notSupported || cameraError ? (
                <div className="absolute inset-0 flex items-center justify-center p-6 bg-gradient-to-br from-gray-900 via-black to-gray-900 z-10">
                  <div className="max-w-md text-center">
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/15 flex items-center justify-center text-amber-400 mb-4">
                      <AlertCircle className="w-8 h-8" />
                    </div>
                    <div className="text-xl font-bold text-white mb-1">Coming Soon</div>
                    <div className="text-sm text-gray-400 mb-3">
                      {cameraError ||
                        'AR camera preview is not supported in this browser. You can still preview the product reference image below.'}
                    </div>
                    <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-4">
                      <img
                        src={overlayImage}
                        alt={productName}
                        className="w-full h-40 object-cover rounded-xl"
                      />
                    </div>
                    {productId && (
                      <div className="mt-3 text-xs font-mono text-gray-500">
                        Product ID: {productId}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    autoPlay
                    className="w-full h-full object-cover"
                  />
                  {!streamOn && !requesting && (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-900 to-black flex items-center justify-center">
                      <div className="text-center text-white/80 max-w-xs px-6">
                        <Camera className="w-10 h-10 mx-auto mb-3 opacity-70" />
                        <div className="font-semibold">Camera preview area</div>
                        <div className="text-xs opacity-80 mt-1">
                          Product overlay will appear once your camera is active.
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="pointer-events-none absolute inset-0 p-5 flex items-end justify-end">
                    <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl overflow-hidden shadow-2xl ring-2 ring-white/60 rotate-[-4deg] opacity-90">
                      <img
                        src={overlayImage}
                        alt={`${productName} overlay`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/50 backdrop-blur text-white/90 px-3 py-1.5 text-xs font-medium">
                    <span className={`inline-block w-2 h-2 rounded-full ${streamOn ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
                    {streamOn ? 'Live preview' : 'Preview pending'}
                  </div>
                </>
              )}
            </div>

            <div className="px-5 py-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-xs text-gray-500">
                This is a placeholder AR experience. The full version will support 3D cut placement, table sizing, and portion previews.
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                {(!streamOn && !notSupported && !cameraError) && (
                  <button
                    type="button"
                    onClick={handleOpen}
                    disabled={requesting}
                    className="inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 text-sm font-semibold text-white transition-colors"
                  >
                    <Camera className="w-4 h-4" />
                    Start Camera
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleClose}
                  className="inline-flex items-center px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm font-semibold text-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ArTryOnPlaceholder
