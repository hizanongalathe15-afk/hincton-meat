import React from 'react'
import { motion } from 'framer-motion'
import { 
  Flame, 
  ShoppingBag, 
  PhoneCall, 
  MessageCircle, 
  X
} from 'lucide-react'
import { useLayoutSplit } from '../../contexts/LayoutSplitContext'
import { useSiteContent } from '../../contexts/SiteContentContext'
import { formatPrice } from '../../utils/currency'
import toast from 'react-hot-toast'

interface SmartwatchCompactViewProps {
  onQuickOrder?: (name: string, price: number) => void
}

export const SmartwatchCompactView: React.FC<SmartwatchCompactViewProps> = ({ onQuickOrder }) => {
  const { setIsWatchMode } = useLayoutSplit()
  const { profile } = useSiteContent()
  const phone = profile?.brand?.whatsapp || profile?.brand?.phone || '254797416181'

  const watchQuickItems = [
    { name: 'Prime Beef Cuts (1kg)', price: 950, tag: 'Sourced 6 AM', time: 'Today' },
    { name: 'Mbuzi Choma Ribs (1kg)', price: 900, tag: 'Top Seller', time: 'Fresh' },
    { name: 'Capon Chicken (1.2kg)', price: 450, tag: 'Free Range', time: 'Ready' },
    { name: 'Gourmet Beef Sausages', price: 650, tag: 'Hand-Crafted', time: 'Pack' },
  ]

  const handle1TapBuy = (item: { name: string; price: number }) => {
    if (onQuickOrder) {
      onQuickOrder(item.name, item.price)
    } else {
      const cleanPhone = String(phone).replace(/[^0-9]/g, '')
      const msg = `Smartwatch 1-Tap Order: I would like to order ${item.name} for ${formatPrice(item.price)} to Nairobi.`
      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank')
    }
    toast.success(`1-Tap Added: ${item.name}`)
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-[280px] h-[340px] rounded-[48px] bg-stone-950 border-[6px] border-stone-800 shadow-2xl p-4 flex flex-col justify-between overflow-hidden text-white ring-4 ring-stone-900"
      >
        {/* Watch Bezel Header */}
        <div className="flex items-center justify-between border-b border-stone-800/80 pb-2">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[11px] font-black tracking-wider text-stone-300">HINCTON WATCH</span>
          </div>
          <button
            onClick={() => setIsWatchMode(false)}
            className="p-1 rounded-full bg-stone-800/80 text-stone-400 hover:text-white"
            title="Exit Watch Mode"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Scrollable Mini List */}
        <div className="flex-1 overflow-y-auto space-y-2 py-2 pr-0.5 scrollbar-thin">
          <div className="text-[10px] uppercase font-bold text-stone-400 flex items-center gap-1">
            <Flame className="h-3 w-3 text-red-500" />
            <span>Daily Fresh Nyama</span>
          </div>

          {watchQuickItems.map((item) => (
            <div
              key={item.name}
              className="bg-stone-900/90 border border-stone-800 rounded-2xl p-2.5 flex items-center justify-between gap-2 hover:border-[var(--site-primary)] transition"
            >
              <div className="min-w-0">
                <p className="text-[11px] font-bold truncate text-white leading-tight">{item.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[11px] font-extrabold text-[var(--site-primary)]">{formatPrice(item.price)}</span>
                  <span className="text-[9px] text-green-400 bg-green-950/80 px-1 rounded">{item.tag}</span>
                </div>
              </div>
              <button
                onClick={() => handle1TapBuy(item)}
                className="flex-shrink-0 h-7 w-7 rounded-xl bg-[var(--site-primary)] text-white flex items-center justify-center shadow-md active:scale-95 transition"
                title="1-Tap Quick Order"
              >
                <ShoppingBag className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Quick Emergency Actions Footer */}
        <div className="pt-2 border-t border-stone-800/80 grid grid-cols-2 gap-1.5">
          <a
            href={`tel:${phone}`}
            className="flex items-center justify-center gap-1 bg-stone-900 hover:bg-stone-800 text-stone-300 py-1.5 rounded-xl text-[10px] font-bold border border-stone-800"
          >
            <PhoneCall className="h-3 w-3 text-amber-400" />
            <span>Call Butchery</span>
          </a>
          <button
            onClick={() => {
              const cleanPhone = String(phone).replace(/[^0-9]/g, '')
              window.open(`https://wa.me/${cleanPhone}?text=Hi%20Hincton%20Meat!%20Watch%20Quick%20Inquiry`, '_blank')
            }}
            className="flex items-center justify-center gap-1 bg-green-600 hover:bg-green-500 text-white py-1.5 rounded-xl text-[10px] font-bold"
          >
            <MessageCircle className="h-3 w-3" />
            <span>WhatsApp</span>
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default SmartwatchCompactView
