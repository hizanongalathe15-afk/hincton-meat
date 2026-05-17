import { useState, useEffect } from 'react'
import { ExternalLink, X } from 'lucide-react'
import { API_URL, getEmbedVideoUrl, isDirectVideoUrl, resolveMediaUrl } from '../services/api'

interface AdPlacementProps {
  placementId: string
  type: 'BANNER' | 'SIDEBAR' | 'FOOTER' | 'HEADER' | 'IN_CONTENT' | 'POPUP' | 'VIDEO'
  className?: string
  fallback?: React.ReactNode
}

interface AdData {
  id: string
  title: string
  description: string
  imageUrl?: string
  mediaUrl?: string
  mediaType?: 'image' | 'gif' | 'video' | 'audio' | 'sticker'
  stickerUrl?: string
  landingUrl: string
  buttonText?: string
  advertiser: string
  placement: {
    id: string
    type: string
    size: { width: number; height: number }
  }
  tracking: {
    impressionId: string
  }
}

const AdPlacement = ({ placementId, type, className = '', fallback }: AdPlacementProps) => {
  const [ad, setAd] = useState<AdData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPopup, setShowPopup] = useState(false)

  useEffect(() => {
    const fetchAd = async () => {
      try {
        setLoading(true)
        
        // Get device info
        const device = getDeviceType()
        const userAgent = navigator.userAgent

        const response = await fetch(`${API_URL}/marketing/serve?placementId=${encodeURIComponent(placementId)}&device=${device}&userAgent=${encodeURIComponent(userAgent)}`)
        const data = await response.json()

        if (data.ad) {
          setAd(data.ad)
          
          // Track impression
          trackInteraction('impression', data.ad.tracking.impressionId, data.ad.id, placementId)
        } else {
          setError(data.reason || 'No ad available')
        }
      } catch (err) {
        console.error('Failed to fetch ad:', err)
        setError('Failed to load ad')
      } finally {
        setLoading(false)
      }
    }

    fetchAd()
  }, [placementId])

  const getDeviceType = (): string => {
    const width = window.innerWidth
    if (width < 768) return 'MOBILE'
    if (width < 1024) return 'TABLET'
    return 'DESKTOP'
  }

  const trackInteraction = async (type: 'click' | 'impression', impressionId: string, campaignId: string, placementId: string) => {
    try {
      await fetch(`${API_URL}/marketing/track/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ impressionId, campaignId, placementId })
      })
    } catch (err) {
      console.error('Failed to track interaction:', err)
    }
  }

  const handleClick = () => {
    if (ad) {
      trackInteraction('click', ad.tracking.impressionId, ad.id, placementId)
      
      if (type === 'POPUP') {
        setShowPopup(true)
      } else {
        window.open(ad.landingUrl, '_blank', 'noopener,noreferrer')
      }
    }
  }

  const handleClosePopup = () => {
    setShowPopup(false)
  }

  const renderAdContent = () => {
    if (!ad) return null

    const { placement } = ad
    const mediaUrl = resolveMediaUrl(ad.mediaUrl || ad.imageUrl)
    const imageUrl = resolveMediaUrl(ad.imageUrl || ad.mediaUrl)
    const stickerUrl = resolveMediaUrl(ad.stickerUrl)
    const embedUrl = ad.mediaType === 'video' ? getEmbedVideoUrl(mediaUrl) : ''
    const adStyle = {
      width: '100%',
      maxWidth: `${placement.size.width}px`,
      minHeight: `${placement.size.height}px`
    }

    return (
      <div 
        className="relative bg-gray-100 border border-gray-300 rounded-lg overflow-hidden cursor-pointer hover:border-blue-400 transition-colors"
        style={adStyle}
        onClick={handleClick}
      >
        {ad.mediaType === 'audio' && mediaUrl ? (
          <div className="flex h-full w-full items-center justify-center bg-gray-900 p-3">
            <audio src={mediaUrl} controls className="w-full" />
          </div>
        ) : embedUrl ? (
          <iframe src={embedUrl} title={ad.title} className="h-full min-h-[inherit] w-full" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
        ) : ad.mediaType === 'video' && mediaUrl && isDirectVideoUrl(mediaUrl) ? (
          <video src={mediaUrl} className="h-full w-full object-cover" muted autoPlay loop playsInline />
        ) : imageUrl ? (
          <img 
            src={imageUrl} 
            alt={ad.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : null}
        {stickerUrl && (
          <img src={stickerUrl} alt="" className="absolute right-3 top-3 h-12 w-12 object-contain" loading="lazy" />
        )}
        
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
          <p className="text-white text-sm font-semibold truncate">{ad.title}</p>
          {ad.description && (
            <p className="text-white/80 text-xs truncate">{ad.description}</p>
          )}
          <div className="flex items-center justify-between mt-1">
            <span className="text-white/60 text-xs">Ad by {ad.advertiser}</span>
            {ad.buttonText && (
              <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded">
                {ad.buttonText}
              </span>
            )}
          </div>
        </div>

        <div className="absolute top-1 right-1">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowPopup(true)
            }}
            className="bg-white/80 hover:bg-white text-gray-600 p-1 rounded-full"
          >
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>
    )
  }

  const renderPopup = () => {
    if (!ad || !showPopup) return null
    const mediaUrl = resolveMediaUrl(ad.mediaUrl || ad.imageUrl)
    const imageUrl = resolveMediaUrl(ad.imageUrl || ad.mediaUrl)
    const embedUrl = ad.mediaType === 'video' ? getEmbedVideoUrl(mediaUrl) : ''

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{ad.title}</h3>
              <button
                onClick={handleClosePopup}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {ad.mediaType === 'audio' && mediaUrl ? (
              <audio src={mediaUrl} controls className="mb-4 w-full" />
            ) : embedUrl ? (
              <iframe src={embedUrl} title={ad.title} className="mb-4 h-56 w-full rounded-lg" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
            ) : ad.mediaType === 'video' && mediaUrl ? (
              <video src={mediaUrl} controls className="mb-4 h-48 w-full rounded-lg object-cover" />
            ) : imageUrl && (
              <img 
                src={imageUrl} 
                alt={ad.title}
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
            )}
            
            <p className="text-gray-600 mb-4">{ad.description}</p>
            
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-500">Ad by {ad.advertiser}</span>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => {
                  trackInteraction('click', ad.tracking.impressionId, ad.id, placementId)
                  window.open(ad.landingUrl, '_blank', 'noopener,noreferrer')
                  handleClosePopup()
                }}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {ad.buttonText || 'Learn More'}
              </button>
              <button
                onClick={handleClosePopup}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={`bg-gray-100 border border-gray-300 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-gray-400 text-sm">Loading ad...</div>
      </div>
    )
  }

  if (error || !ad) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-gray-400 text-xs text-center p-2">
          Ad space available
        </div>
      </div>
    )
  }

  return (
    <>
      <div className={className}>
        {renderAdContent()}
      </div>
      {renderPopup()}
    </>
  )
}

export default AdPlacement
