import React from 'react'
import { motion } from 'framer-motion'
import { 
  Sparkles, 
  ShoppingBag, 
  MessageCircle, 
  CheckCircle2, 
  Zap, 
  Flame
} from 'lucide-react'
import { useCart } from '../../contexts/CartContext'
import { useSiteContent } from '../../contexts/SiteContentContext'
import { formatPrice } from '../../utils/currency'
import toast from 'react-hot-toast'

interface BundlePackage {
  id: string
  name: string
  subtitle: string
  description: string
  items: string[]
  regularPrice: number
  bundlePrice: number
  savingPercent: number
  badge: string
  image: string
  popularFor: string
}

export const SmartRecommendationsBundles: React.FC = () => {
  const { addItem } = useCart()
  const { profile } = useSiteContent()
  const phone = profile?.brand?.whatsapp || profile?.brand?.phone || '254797416181'

  const bundles: BundlePackage[] = [
    {
      id: 'bundle-nyama-choma',
      name: 'Grand Nyama Choma Feast',
      subtitle: 'The Ultimate Kenyan Weekend Gathering Pack',
      description: 'Hand-selected, prime-aged goat ribs and beef sirloin paired with traditional gourmet boerewors sausages.',
      items: ['2kg Fresh Mbuzi Ribs / Choma Cut', '1.5kg Aged Prime Beef Sirloin', '1kg Gourmet Beef Herb Boerewors'],
      regularPrice: 4200,
      bundlePrice: 3499,
      savingPercent: 17,
      badge: '🔥 Kenya #1 Weekend Seller',
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
      popularFor: 'BBQs, Gatherings & Celebrations'
    },
    {
      id: 'bundle-family-protein',
      name: 'Family Weekly Protein Box',
      subtitle: 'Everyday Fresh Meal Prep Essentials',
      description: 'Lean minced steak, tender stewing cubes, and fresh farm capons portioned for healthy family weekday meals.',
      items: ['2kg Extra Lean Minced Beef', '2kg Prime Stew Beef Cubes', '2 Whole Country Farm Capons (2.4kg)'],
      regularPrice: 4600,
      bundlePrice: 3890,
      savingPercent: 15,
      badge: '🌿 Family Favorite Pack',
      image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
      popularFor: 'Weekly Dinners & Healthy Meal Prep'
    },
    {
      id: 'bundle-steakhouse-master',
      name: 'Steakhouse Connoisseur Reserve',
      subtitle: '21-Day Dry Aged Cuts for Steak Lovers',
      description: 'Thick cut, heavily marbled Ribeyes and T-Bones with complimentary compound herb butter.',
      items: ['2x 400g Prime Aged Ribeye Steaks', '2x 450g Aged T-Bone Steaks', 'Handcrafted Rosemary Garlic Butter'],
      regularPrice: 3900,
      bundlePrice: 3250,
      savingPercent: 17,
      badge: '⭐ Premium Reserve',
      image: 'https://images.unsplash.com/photo-1558030006-450675393462?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
      popularFor: 'Date Nights & Gourmet Dining'
    }
  ]

  const handle1ClickBundle = async (bundle: BundlePackage) => {
    try {
      await addItem(
        {
          id: bundle.id,
          name: bundle.name,
          price: bundle.bundlePrice,
          images: [bundle.image],
          category: { id: 'bundles', name: 'Curated Bundles' },
          stockQuantity: 20,
          unit: 'pack',
          description: bundle.description
        } as any,
        1
      )
      toast.success(`Added "${bundle.name}" to cart!`)
    } catch {
      toast.error('Could not add bundle to cart')
    }
  }

  const handleWhatsAppOrder = (bundle: BundlePackage) => {
    const cleanPhone = String(phone).replace(/[^0-9]/g, '')
    const msg = `Hi Hincton Meat! I would like to order the *${bundle.name}* bundle for *${formatPrice(bundle.bundlePrice)}* (Savings: ${bundle.savingPercent}%). Delivery to Nairobi.`
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  return (
    <section className="relative py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 text-xs font-black uppercase tracking-wider mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Curated Kenyan BBQ & Family Packs</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-stone-900 dark:text-white tracking-tight">
            Smart Recommendations & Bundles
          </h2>
          <p className="text-sm text-stone-600 dark:text-stone-300 mt-2 max-w-xl">
            Save up to 20% on butchery packages expertly paired by our Master Cutters for gatherings, meal prep, and BBQs.
          </p>
        </div>
      </div>

      {/* Bundles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {bundles.map((bundle) => (
          <motion.div
            key={bundle.id}
            whileHover={{ y: -6 }}
            transition={{ duration: 0.3 }}
            className="glass-card-ultra rounded-[2.5rem] overflow-hidden border border-white/50 bg-white/80 dark:bg-stone-900/80 shadow-xl flex flex-col justify-between"
          >
            <div>
              {/* Image & Badges */}
              <div className="relative aspect-[16/10] overflow-hidden bg-stone-900">
                <img
                  src={bundle.image}
                  alt={bundle.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-stone-950/80 backdrop-blur-md text-white text-xs font-black shadow-lg border border-white/20">
                  {bundle.badge}
                </div>
                <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 text-white text-xs font-extrabold shadow-lg">
                  Save {bundle.savingPercent}%
                </div>
              </div>

              {/* Content Body */}
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-xl font-black text-stone-900 dark:text-white tracking-tight">
                    {bundle.name}
                  </h3>
                  <p className="text-xs text-[var(--site-primary)] font-bold mt-0.5">
                    {bundle.subtitle}
                  </p>
                  <p className="text-xs text-stone-600 dark:text-stone-300 mt-2 line-clamp-2 leading-relaxed">
                    {bundle.description}
                  </p>
                </div>

                {/* Bundle Item Checklist */}
                <div className="space-y-1.5 p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700/50">
                  <p className="text-[10px] font-black uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1">
                    What's in this pack:
                  </p>
                  {bundle.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-stone-700 dark:text-stone-200">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                      <span className="truncate">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Price & Action Buttons Footer */}
            <div className="p-6 pt-0 border-t border-stone-100 dark:border-stone-800/80 mt-2">
              <div className="flex items-baseline justify-between mb-4 pt-4">
                <div>
                  <span className="text-xs line-through text-stone-400 block font-medium">
                    Reg. {formatPrice(bundle.regularPrice)}
                  </span>
                  <span className="text-2xl font-black text-[var(--site-primary)]">
                    {formatPrice(bundle.bundlePrice)}
                  </span>
                </div>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded-lg">
                  You save {formatPrice(bundle.regularPrice - bundle.bundlePrice)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => handle1ClickBundle(bundle)}
                  className="flex items-center justify-center gap-1.5 py-3 px-3 rounded-2xl bg-[var(--site-primary)] text-[var(--site-buttonText,#ffffff)] text-xs font-black shadow-lg hover:scale-102 active:scale-98 transition"
                >
                  <ShoppingBag className="h-4 w-4" />
                  <span>1-Click Buy</span>
                </button>
                <button
                  onClick={() => handleWhatsAppOrder(bundle)}
                  className="flex items-center justify-center gap-1.5 py-3 px-3 rounded-2xl bg-[#25D366] text-white text-xs font-black shadow-lg hover:scale-102 active:scale-98 transition"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>WhatsApp</span>
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Frequently Bought Together Banner */}
      <div className="mt-12 glass-card-ultra rounded-3xl p-6 sm:p-8 border border-white/50 bg-gradient-to-r from-red-600/10 via-amber-500/5 to-transparent flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-[var(--site-primary)] text-white flex items-center justify-center shadow-lg flex-shrink-0">
            <Flame className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-stone-900 dark:text-white">
              Host a Nyama Choma Party This Weekend?
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-300 mt-0.5">
              Get complimentary marinade rub, rosemary sprigs, and instant WhatsApp butcher prep assistance with any order over KSh 3,000.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            const cleanPhone = String(phone).replace(/[^0-9]/g, '')
            window.open(`https://wa.me/${cleanPhone}?text=Hi%20Hincton%20Butcher!%20Help%20me%20plan%20my%20BBQ%20event%20meat%20order.`, '_blank')
          }}
          className="flex-shrink-0 px-6 py-3 rounded-2xl bg-stone-950 dark:bg-white text-white dark:text-stone-900 text-xs font-black shadow-xl hover:scale-105 transition flex items-center gap-2"
        >
          <Zap className="h-4 w-4 text-amber-400" />
          <span>Talk to Head Butcher</span>
        </button>
      </div>
    </section>
  )
}

export default SmartRecommendationsBundles
