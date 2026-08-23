import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Maximize2, 
  Minimize2, 
  X, 
  Flame, 
  ShoppingBag, 
  MessageCircle, 
  Truck, 
  ShieldCheck,
  ChefHat
} from 'lucide-react'
import { useLayoutSplit } from '../../contexts/LayoutSplitContext'
import { useCart } from '../../contexts/CartContext'
import { useSiteContent } from '../../contexts/SiteContentContext'
import { formatPrice } from '../../utils/currency'

interface SplitLayoutContainerProps {
  children: React.ReactNode
}

export const SplitLayoutContainer: React.FC<SplitLayoutContainerProps> = ({ children }) => {
  const { 
    layoutMode, 
    setLayoutMode, 
    isPipActive, 
    setIsPipActive, 
    pipStreamType, 
    splitPanelContent,
    setSplitPanelContent 
  } = useLayoutSplit()
  const { items, getTotalPrice } = useCart()
  const { profile } = useSiteContent()
  const [isPipMinimized, setIsPipMinimized] = useState(false)

  const phone = profile?.brand?.whatsapp || profile?.brand?.phone || '254797416181'
  const total = getTotalPrice()

  return (
    <div className="relative w-full">
      {/* Layout Engine Content */}
      {layoutMode === 'standard' && <div className="w-full transition-all">{children}</div>}

      {layoutMode === 'split' && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="split-layout-grid-dual items-start">
            {/* Left Main Stream */}
            <div className="space-y-6">{children}</div>

            {/* Right Interactive Glass Panel */}
            <div className="sticky top-24 space-y-4">
              <div className="glass-card-ultra rounded-3xl p-5 border border-white/40 shadow-xl space-y-4">
                {/* Panel Navigation Tabs */}
                <div className="flex items-center justify-between border-b border-stone-200/60 dark:border-stone-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[var(--site-primary)] animate-pulse" />
                    <h3 className="font-extrabold text-sm text-stone-900 dark:text-white uppercase tracking-wider">
                      Smart Butchery Panel
                    </h3>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setSplitPanelContent('bundles')}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition ${
                        splitPanelContent === 'bundles'
                          ? 'bg-[var(--site-primary)] text-white'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                      }`}
                    >
                      Bundles
                    </button>
                    <button
                      onClick={() => setSplitPanelContent('guide')}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition ${
                        splitPanelContent === 'guide'
                          ? 'bg-[var(--site-primary)] text-white'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                      }`}
                    >
                      Prep Guide
                    </button>
                    <button
                      onClick={() => setSplitPanelContent('cart')}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition ${
                        splitPanelContent === 'cart'
                          ? 'bg-[var(--site-primary)] text-white'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                      }`}
                    >
                      Cart ({items.length})
                    </button>
                  </div>
                </div>

                {/* Dynamic Panel Body */}
                {splitPanelContent === 'bundles' && (
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-red-500/5 to-transparent border border-amber-500/20">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <Flame className="h-3.5 w-3.5" /> Weekend Nyama Choma Pack
                        </span>
                        <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Save 15%</span>
                      </div>
                      <p className="text-xs text-stone-600 dark:text-stone-300 mt-1 font-medium">
                        2kg Prime Mbuzi Choma + 1kg Aged Ribeye + Gourmet Boerewors
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <div>
                          <span className="text-xs line-through text-stone-400">KSh 3,850</span>
                          <span className="ml-2 text-sm font-extrabold text-[var(--site-primary)]">KSh 3,250</span>
                        </div>
                        <button
                          onClick={() => {
                            const cleanPhone = String(phone).replace(/[^0-9]/g, '')
                            window.open(
                              `https://wa.me/${cleanPhone}?text=Hello!%20I%20would%20like%20to%20order%20the%20Weekend%20Nyama%20Choma%20Bundle%20(KSh%203,250)`,
                              '_blank'
                            )
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[var(--site-primary)] text-white text-xs font-bold shadow-sm hover:scale-105 transition"
                        >
                          Quick Buy Pack
                        </button>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-transparent border border-green-500/20">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase text-green-600 dark:text-green-400 flex items-center gap-1">
                          <ChefHat className="h-3.5 w-3.5" /> Family Meal Prep Essentials
                        </span>
                        <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Save 10%</span>
                      </div>
                      <p className="text-xs text-stone-600 dark:text-stone-300 mt-1 font-medium">
                        2kg Lean Beef Steak Mince + 2 Farm Capons + 1kg Stew Beef
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <div>
                          <span className="text-xs line-through text-stone-400">KSh 3,200</span>
                          <span className="ml-2 text-sm font-extrabold text-green-600">KSh 2,880</span>
                        </div>
                        <button
                          onClick={() => {
                            const cleanPhone = String(phone).replace(/[^0-9]/g, '')
                            window.open(
                              `https://wa.me/${cleanPhone}?text=Hello!%20I%20would%20like%20to%20order%20the%20Family%20Meal%20Prep%20Bundle%20(KSh%202,880)`,
                              '_blank'
                            )
                          }}
                          className="px-3 py-1.5 rounded-xl bg-green-600 text-white text-xs font-bold shadow-sm hover:scale-105 transition"
                        >
                          Quick Buy Pack
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {splitPanelContent === 'guide' && (
                  <div className="space-y-2.5 text-xs text-stone-700 dark:text-stone-300">
                    <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/50">
                      <h4 className="font-black text-stone-900 dark:text-white flex items-center gap-1.5">
                        <ChefHat className="h-4 w-4" aria-hidden="true" /> Searing the Perfect Ribeye
                      </h4>
                      <p className="mt-1 text-[11px] leading-relaxed text-stone-600 dark:text-stone-400">
                        Bring to room temperature 20 mins prior. Heat cast iron to smoking hot. 3 mins each side with garlic herb butter basting.
                      </p>
                    </div>
                    <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/50">
                      <h4 className="font-black text-stone-900 dark:text-white flex items-center gap-1.5">
                        <Flame className="h-4 w-4" aria-hidden="true" /> Traditional Mbuzi Choma Tips
                      </h4>
                      <p className="mt-1 text-[11px] leading-relaxed text-stone-600 dark:text-stone-400">
                        Low and slow over acacia charcoal. Brush frequently with sea salt brine. Rest 8 minutes before slicing.
                      </p>
                    </div>
                  </div>
                )}

                {splitPanelContent === 'cart' && (
                  <div className="space-y-3">
                    {items.length === 0 ? (
                      <p className="text-xs text-stone-500 text-center py-6">Your shopping cart is empty.</p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {items.map((item) => (
                          <div key={item.id} className="flex justify-between items-center text-xs p-2 rounded-xl bg-stone-50 dark:bg-stone-800">
                            <span className="font-bold truncate max-w-[140px]">{item.name}</span>
                            <span className="font-extrabold text-[var(--site-primary)]">
                              {item.quantity}x {formatPrice(item.price)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="border-t border-stone-200 dark:border-stone-800 pt-2 flex justify-between font-black text-sm">
                      <span>Total:</span>
                      <span className="text-[var(--site-primary)]">{formatPrice(total)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {layoutMode === 'quad' && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="split-layout-grid-quad">
            {/* Grid 1: Catalog Main */}
            <div className="glass-card-ultra rounded-3xl p-5 border border-white/40 shadow-xl max-h-[700px] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-sm uppercase tracking-wide flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-[var(--site-primary)]" />
                  Primary Catalog Stream
                </h3>
              </div>
              {children}
            </div>

            {/* Grid 2: Provenance & Freshness Live Feed */}
            <div className="glass-card-ultra rounded-3xl p-5 border border-white/40 shadow-xl space-y-4 max-h-[700px] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-2">
                <h3 className="font-black text-sm uppercase tracking-wide flex items-center gap-2 text-emerald-600">
                  <ShieldCheck className="h-4 w-4" />
                  Daily Farm Provenance
                </h3>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  6:00 AM Certified
                </span>
              </div>
              <div className="relative rounded-2xl overflow-hidden aspect-video bg-stone-900">
                <img
                  src="https://images.unsplash.com/photo-1544025162-d76694265947?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600"
                  alt="Kenyan High-Grade Butcher Cuts"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3 text-white">
                  <div>
                    <p className="text-xs font-black">Naivasha Valley Grass-Fed Herd</p>
                    <p className="text-[10px] text-stone-300">Aged 21 Days • Zero Hormones • 100% Halal Certified</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                Every cut delivered by Hincton Meat is sourced directly from ethical Kenyan partner ranches, precision-chilled to 2°C, and inspected by certified veterinary authorities.
              </p>
            </div>

            {/* Grid 3: Smart Bundles */}
            <div className="glass-card-ultra rounded-3xl p-5 border border-white/40 shadow-xl space-y-4">
              <h3 className="font-black text-sm uppercase tracking-wide flex items-center gap-2 text-amber-600">
                <Flame className="h-4 w-4" />
                Featured Package Bundles
              </h3>
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                <p className="text-xs font-black text-amber-900 dark:text-amber-300">BBQ Master Box</p>
                <p className="text-[11px] text-stone-600 dark:text-stone-400">2kg Mbuzi + 1kg Ribeye + Sausage links</p>
                <div className="flex justify-between items-center pt-2">
                  <span className="font-extrabold text-sm text-[var(--site-primary)]">KSh 3,250</span>
                  <button
                    onClick={() => {
                      const cleanPhone = String(phone).replace(/[^0-9]/g, '')
                      window.open(`https://wa.me/${cleanPhone}?text=I%20want%20to%20order%20the%20BBQ%20Master%20Box`, '_blank')
                    }}
                    className="px-3 py-1 rounded-xl bg-[var(--site-primary)] text-white text-xs font-bold"
                  >
                    Order via WhatsApp
                  </button>
                </div>
              </div>
            </div>

            {/* Grid 4: Express Cart & Checkout */}
            <div className="glass-card-ultra rounded-3xl p-5 border border-white/40 shadow-xl space-y-4">
              <h3 className="font-black text-sm uppercase tracking-wide flex items-center gap-2 text-stone-900 dark:text-white">
                <Truck className="h-4 w-4 text-[var(--site-primary)]" />
                Express Cart & M-PESA
              </h3>
              <div className="space-y-2">
                {items.length === 0 ? (
                  <p className="text-xs text-stone-500">Cart is empty. Add items from the catalog.</p>
                ) : (
                  items.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex justify-between text-xs py-1 border-b border-stone-200 dark:border-stone-800">
                      <span>{item.name}</span>
                      <span className="font-bold">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="pt-2 flex justify-between font-black text-sm">
                <span>Total:</span>
                <span className="text-[var(--site-primary)]">{formatPrice(total)}</span>
              </div>
              <a
                href="/checkout"
                className="block w-full text-center py-2.5 rounded-xl bg-[var(--site-primary)] text-white font-extrabold text-xs shadow-md hover:scale-102 transition"
              >
                1-Click Guest Checkout
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Floating Picture-in-Picture (PiP) Glass Widget */}
      <AnimatePresence>
        {(layoutMode === 'pip' || isPipActive) && (
          <motion.div
            drag
            dragConstraints={{ left: 0, right: 300, top: 0, bottom: 400 }}
            initial={{ scale: 0.8, opacity: 0, x: 20, y: 20 }}
            animate={{ scale: 1, opacity: 1, x: 0, y: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className={`fixed bottom-24 right-6 z-[60] glass-card-ultra rounded-3xl overflow-hidden shadow-2xl border-2 border-white/60 dark:border-stone-700 bg-stone-950/90 text-white ${
              isPipMinimized ? 'w-64 h-14 p-3 flex items-center justify-between' : 'w-80 h-72'
            }`}
          >
            {/* PiP Header Controls */}
            <div className="flex items-center justify-between p-3 border-b border-white/10 bg-stone-900/60 select-none">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                <span className="text-xs font-black uppercase tracking-wider text-stone-200">
                  {pipStreamType === 'freshness_cam' ? 'Live Butchery' : 'Cooking Guide'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsPipMinimized(!isPipMinimized)}
                  className="p-1 rounded-lg hover:bg-white/10 text-stone-400 hover:text-white"
                  title={isPipMinimized ? 'Expand PiP' : 'Minimize PiP'}
                >
                  {isPipMinimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
                </button>
                <button
                  onClick={() => {
                    setIsPipActive(false)
                    if (layoutMode === 'pip') setLayoutMode('standard')
                  }}
                  className="p-1 rounded-lg hover:bg-red-500/20 text-stone-400 hover:text-red-400"
                  title="Close PiP"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* PiP Body Content */}
            {!isPipMinimized && (
              <div className="relative h-[calc(100%-48px)] flex flex-col justify-between p-3">
                <div className="relative rounded-2xl overflow-hidden flex-1 bg-stone-900 mb-2">
                  <img
                    src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=500"
                    alt="Live Prep"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-red-600/90 text-[10px] font-black uppercase tracking-wider">
                    LIVE HD
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-bold truncate text-stone-300">
                    {items.length > 0 ? `Cart Total: ${formatPrice(total)}` : 'Fresh Nyama Choma Prep'}
                  </p>
                  <button
                    onClick={() => {
                      const cleanPhone = String(phone).replace(/[^0-9]/g, '')
                      window.open(`https://wa.me/${cleanPhone}?text=Hello!%20Watching%20the%20live%20prep%20stream.`, '_blank')
                    }}
                    className="flex-shrink-0 px-2.5 py-1 rounded-xl bg-[#25D366] text-white text-[11px] font-black flex items-center gap-1"
                  >
                    <MessageCircle className="h-3 w-3" />
                    Order
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default SplitLayoutContainer
