import React from 'react'
import { Instagram, ArrowUpRight, Camera } from 'lucide-react'
import { useSiteContent } from '../../contexts/SiteContentContext'

const FEED_PLACEHOLDERS = [
  { prompt: 'Premium grilled steak platter with herbs and spices', idx: 0, size: 'portrait_4_3' as const },
  { prompt: 'Fresh raw beef cuts arranged on wooden butcher board', idx: 1, size: 'portrait_4_3' as const },
  { prompt: 'Marinated meat skewers with rosemary and chili flakes', idx: 2, size: 'portrait_4_3' as const },
  { prompt: 'Chilled packaged meat delivery box with ice packs', idx: 3, size: 'portrait_4_3' as const },
  { prompt: 'Ribeye steak with perfect grill marks and butter basting', idx: 4, size: 'portrait_4_3' as const },
  { prompt: 'Assorted meat cuts, goat meat, chicken and beef variety', idx: 5, size: 'portrait_4_3' as const },
  { prompt: 'Butcher counter with premium meat display under cold light', idx: 6, size: 'portrait_4_3' as const },
  { prompt: 'Homemade meat stew with vegetables and Kenyan spices', idx: 7, size: 'portrait_4_3' as const },
]

const imgUrl = (prompt: string, image_size: string, seed: number) =>
  `https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=${image_size}&seed=${seed}`

const InstagramFeedEmbed: React.FC = () => {
  const { profile } = useSiteContent()
  const enabled = !!profile.featureToggles?.instagramFeed
  const handleRaw = profile.featureToggles?.instagramFeedHandle as unknown
  const handle = typeof handleRaw === 'string' && handleRaw.trim().length > 0 ? handleRaw : '@hinctonmeatproducts'
  const cleanHandle = handle.startsWith('@') ? handle.slice(1) : handle
  const href = `https://instagram.com/${encodeURIComponent(cleanHandle)}`

  if (!enabled) {
    return null
  }

  return (
    <div className="w-full">
      <div className="flex items-end justify-between mb-4 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-br from-fuchsia-500 via-red-500 to-amber-500 text-white shadow-lg shadow-fuchsia-500/20">
            <Instagram className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-fuchsia-600 font-bold">
              Follow us
            </div>
            <h3 className="text-lg font-extrabold text-gray-900">
              <span className="bg-gradient-to-r from-fuchsia-600 via-red-500 to-amber-500 bg-clip-text text-transparent">
                @{cleanHandle}
              </span>
            </h3>
          </div>
        </div>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white hover:border-fuchsia-300 hover:text-fuchsia-700 px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-all"
        >
          View all posts
          <ArrowUpRight className="w-4 h-4" />
        </a>
      </div>

      <div className="relative rounded-3xl overflow-hidden bg-white shadow-sm ring-1 ring-gray-100">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1 sm:gap-1.5 p-1 sm:p-1.5">
          {FEED_PLACEHOLDERS.map((item, index) => {
            const isTall = index === 1 || index === 5
            return (
              <a
                key={index}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${handle} Instagram post ${index + 1}`}
                className={`group relative overflow-hidden rounded-2xl bg-gray-100 block ${
                  isTall ? 'md:row-span-2 aspect-[3/4] md:aspect-auto' : 'aspect-square'
                }`}
              >
                <img
                  src={imgUrl(item.prompt, item.size, 2026 + item.idx)}
                  alt={item.prompt}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement
                    if (!target.dataset.fallback) {
                      target.dataset.fallback = '1'
                      target.src = imgUrl(item.prompt, 'square', 9000 + item.idx)
                    }
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute inset-0 flex items-end p-3 sm:p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="flex items-center gap-2 text-white text-xs font-semibold drop-shadow">
                    <Camera className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[10rem]">{item.prompt}</span>
                  </div>
                </div>
                <div className="absolute top-2 right-2 p-1.5 rounded-full bg-black/45 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  <Instagram className="w-3.5 h-3.5" />
                </div>
              </a>
            )
          })}
        </div>
      </div>

      <div className="mt-3 text-xs text-gray-500 text-center">
        Posts shown are placeholders. Connect your Instagram business account to display live content.
      </div>
    </div>
  )
}

export default InstagramFeedEmbed
