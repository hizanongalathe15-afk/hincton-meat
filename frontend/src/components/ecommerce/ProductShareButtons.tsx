import React, { useState } from 'react'
import { Share2, MessageCircle, Copy, Check } from 'lucide-react'
import toast from 'react-hot-toast'

type ShareProvider = 'whatsapp' | 'facebook' | 'twitter' | 'copy'

type ProductShareButtonsProps = {
  url?: string
  title?: string
  description?: string
  productName: string
}

const buildShareUrl = (provider: ShareProvider, shareUrl: string, shareTitle: string, shareText: string): string => {
  const encodedUrl = encodeURIComponent(shareUrl)
  const encodedTitle = encodeURIComponent(shareTitle)
  const encodedText = encodeURIComponent(`${shareTitle} — ${shareText}`)

  switch (provider) {
    case 'whatsapp':
      return `https://wa.me/?text=${encodedText}%20${encodedUrl}`
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedTitle}`
    case 'twitter':
      return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`
    default:
      return shareUrl
  }
}

const ProductShareButtons: React.FC<ProductShareButtonsProps> = ({
  url,
  title,
  description,
  productName,
}) => {
  const [copied, setCopied] = useState(false)

  const shareUrl = url ?? (typeof window !== 'undefined' ? window.location.href : '')
  const shareTitle = title ?? productName
  const shareText = description ?? `Check out ${productName} from Hincton Meat Products.`

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        })
        toast.success('Shared successfully')
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          toast.error('Sharing cancelled or unavailable')
        }
      }
    }
  }

  const handleProviderClick = (provider: ShareProvider) => {
    if (provider === 'copy') {
      handleCopyLink()
      return
    }

    if (provider === 'whatsapp' && typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      const link = buildShareUrl(provider, shareUrl, shareTitle, shareText)
      window.location.href = link
      return
    }

    const link = buildShareUrl(provider, shareUrl, shareTitle, shareText)
    window.open(link, '_blank', 'noopener,noreferrer,width=600,height=700')
  }

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = shareUrl
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.focus()
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
      setCopied(true)
      toast.success('Link copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Unable to copy link')
    }
  }

  const hasNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Share2 className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Share {productName}</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {hasNativeShare && (
          <button
            type="button"
            onClick={handleNativeShare}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
        )}

        <button
          type="button"
          onClick={() => handleProviderClick('whatsapp')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
          aria-label="Share via WhatsApp"
        >
          <MessageCircle className="w-4 h-4" />
          WhatsApp
        </button>

        <button
          type="button"
          onClick={() => handleProviderClick('facebook')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium rounded-lg transition-colors"
          aria-label="Share via Facebook"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
            <path d="M13.5 21v-7.5h2.5l.5-3h-3V8.5c0-.9.3-1.5 1.6-1.5h1.5V4.3c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 3.9v2.4H7.5v3h2.5V21h3.5z" />
          </svg>
          Facebook
        </button>

        <button
          type="button"
          onClick={() => handleProviderClick('twitter')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium rounded-lg transition-colors"
          aria-label="Share via Twitter"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
            <path d="M18.9 5.1c.01.2.01.3.01.5 0 5.1-3.9 10.9-10.9 10.9-2.2 0-4.2-.6-5.9-1.7.3.04.6.05.9.05 1.8 0 3.5-.6 4.8-1.7-1.7-.03-3.1-1.1-3.6-2.7.2.04.5.06.7.06.3 0 .7-.04 1-.12C2.8 11.7 1.6 10 1.6 8V7.9c.5.3 1.1.5 1.8.5-1.1-.7-1.8-1.9-1.8-3.2 0-.7.2-1.4.5-2 1.8 2.3 4.6 3.8 7.7 4-.06-.3-.1-.6-.1-.9 0-2.2 1.8-4 4-4 1.1 0 2.2.5 2.9 1.3.9-.2 1.8-.5 2.6-1-.3.9-.9 1.7-1.7 2.2.8-.1 1.5-.3 2.2-.6-.6.8-1.3 1.5-2.1 2.1z" />
          </svg>
          Twitter
        </button>

        <button
          type="button"
          onClick={() => handleProviderClick('copy')}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors"
          aria-label="Copy product link"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-green-600" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy Link
            </>
          )}
        </button>
      </div>
    </div>
  )
}

export default ProductShareButtons
