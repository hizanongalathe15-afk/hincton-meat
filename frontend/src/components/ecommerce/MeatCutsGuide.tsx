import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Flame, ChefHat, Sparkles, Clock, ArrowRight, ShieldCheck, Thermometer } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatPrice } from '../../utils/currency'
import { meatGuideApi } from '../../services/buyerApi'
import toast from 'react-hot-toast'

interface CutInfo {
  id: string
  name: string
  localName?: string | null
  bestFor: string
  cookingMethod: string
  recommendedTemp: string
  flavorProfile: string
  priceApprox: number
  unit: string
  image: string
  tips: string
  categorySlug: string
}

interface GuideCategory {
  id: string
  key: string
  label: string
  title: string
  subtitle: string
  cuts: CutInfo[]
}

export const MeatCutsGuide: React.FC = () => {
  const [categories, setCategories] = useState<GuideCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategoryKey, setActiveCategoryKey] = useState<string | null>(null)
  const [selectedCutId, setSelectedCutId] = useState<string | null>(null)

  useEffect(() => {
    meatGuideApi
      .getGuide()
      .then((data) => {
        const list = data.categories || []
        setCategories(list)
        if (list.length > 0) {
          setActiveCategoryKey(list[0].key)
          setSelectedCutId(list[0].cuts[0]?.id ?? null)
        }
      })
      .catch(() => {
        toast.error('Could not load the meat cuts guide')
      })
      .finally(() => setLoading(false))
  }, [])

  const currentCategory = categories.find((c) => c.key === activeCategoryKey) || categories[0]
  const currentCut =
    currentCategory?.cuts.find((c) => c.id === selectedCutId) || currentCategory?.cuts[0]

  if (loading) {
    return (
      <section className="relative overflow-hidden bg-gradient-to-b from-stone-900 via-[#1c1917] to-stone-950 py-20 text-white">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 animate-pulse">
            <div className="h-6 w-56 mx-auto rounded-full bg-white/10 mb-4" />
            <div className="h-9 w-3/4 mx-auto rounded bg-white/10" />
            <div className="mt-8 h-14 w-2/3 mx-auto rounded-2xl bg-white/5" />
          </div>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="lg:col-span-5 space-y-2.5">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-2xl bg-white/5 animate-pulse" />
              ))}
            </div>
            <div className="lg:col-span-7 h-96 rounded-3xl bg-white/5 animate-pulse" />
          </div>
        </div>
      </section>
    )
  }

  if (!currentCategory || !currentCut) {
    return (
      <section className="relative overflow-hidden bg-gradient-to-b from-stone-900 via-[#1c1917] to-stone-950 py-20 text-white">
        <div className="relative mx-auto max-w-7xl px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-950/60 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-red-400 backdrop-blur-md mb-4">
            <ChefHat className="h-4 w-4" /> Master Butcher’s Guide
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight">Choose the Perfect Cut for Every Dish</h2>
          <p className="mt-4 text-stone-300">Our cut guide is being sharpened — check back soon.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-stone-900 via-[#1c1917] to-stone-950 py-20 text-white">
      {/* Background accents */}
      <div className="absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-red-600/15 blur-3xl" aria-hidden="true" />
      <div className="absolute right-0 bottom-0 h-80 w-80 rounded-full bg-amber-500/10 blur-3xl" aria-hidden="true" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-950/60 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-red-400 backdrop-blur-md mb-4">
            <ChefHat className="h-4 w-4" /> Master Butcher’s Guide
          </div>
          <h2 className="text-3xl font-extrabold sm:text-4xl lg:text-5xl tracking-tight text-white">
            Choose the Perfect Cut for Every Dish
          </h2>
          <p className="mt-4 text-base sm:text-lg text-stone-300">
            Explore our artisanal meat cuts, optimal cooking temperatures, and butcher tips for top-tier results.
          </p>

          {/* Animal Category Tabs */}
          <div className="mt-8 inline-flex flex-wrap justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-2 backdrop-blur-md">
            {categories.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setActiveCategoryKey(tab.key)
                  setSelectedCutId(tab.cuts[0]?.id ?? null)
                }}
                className={`rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${
                  currentCategory.key === tab.key
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/30 ring-1 ring-red-400'
                    : 'text-stone-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Cuts Grid & Interactive Showcase */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
          {/* Left Cut Picker Column */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between pb-2 text-xs font-bold uppercase tracking-wider text-stone-400">
              <span>Select a cut</span>
              <span>{currentCategory.cuts.length} cuts available</span>
            </div>

            <div className="space-y-2.5">
              {currentCategory.cuts.map((cut) => {
                const isSelected = cut.id === currentCut.id
                return (
                  <button
                    key={cut.id}
                    type="button"
                    onClick={() => setSelectedCutId(cut.id)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                      isSelected
                        ? 'border-red-500 bg-red-950/40 shadow-lg shadow-red-950/50 ring-1 ring-red-500'
                        : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-base truncate">{cut.name}</span>
                        {cut.localName && (
                          <span className="text-xs text-amber-400 font-medium">({cut.localName})</span>
                        )}
                      </div>
                      <p className="text-xs text-stone-400 mt-1 line-clamp-1">{cut.bestFor}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-stone-200">
                          <Flame className="h-3 w-3 text-red-400" /> {cut.cookingMethod}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-amber-300">{formatPrice(cut.priceApprox)}</div>
                      <div className="text-[11px] text-stone-400">{cut.unit}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Right Cut Detailed Display Card */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentCut.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-stone-900/90 to-stone-950/95 p-6 sm:p-8 shadow-2xl backdrop-blur-xl"
              >
                <div className="grid gap-6 sm:grid-cols-2 items-center mb-6">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/10 shadow-lg">
                    <img
                      src={currentCut.image}
                      alt={currentCut.name}
                      className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                    />
                    <div className="absolute top-3 left-3 rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-white backdrop-blur-md border border-white/10">
                      Freshly Butchered
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-red-600/20 px-3 py-1 text-xs font-bold text-red-300 border border-red-500/30">
                      <Sparkles className="h-3.5 w-3.5" /> Best: {currentCut.cookingMethod}
                    </div>
                    <h3 className="text-2xl font-black text-white">{currentCut.name}</h3>
                    {currentCut.localName && (
                      <p className="text-sm font-medium text-amber-400">Known locally as “{currentCut.localName}”</p>
                    )}
                    <p className="text-sm text-stone-300 leading-relaxed">{currentCut.flavorProfile}</p>

                    <div className="pt-2 flex items-baseline gap-2">
                      <span className="text-2xl font-black text-amber-300">{formatPrice(currentCut.priceApprox)}</span>
                      <span className="text-xs text-stone-400">{currentCut.unit}</span>
                    </div>
                  </div>
                </div>

                {/* Specs Meter */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-4 border-t border-white/10">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-400 mb-1">
                      <Thermometer className="h-4 w-4 text-red-400" /> Optimal Temperature
                    </div>
                    <div className="text-sm font-bold text-white">{currentCut.recommendedTemp}</div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-400 mb-1">
                      <Clock className="h-4 w-4 text-amber-400" /> Best Preparation
                    </div>
                    <div className="text-sm font-bold text-white">{currentCut.bestFor}</div>
                  </div>
                </div>

                {/* Chef's Pro Tip */}
                <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-950/20 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
                    <ChefHat className="h-4 w-4" /> Butcher’s Culinary Tip
                  </div>
                  <p className="text-xs sm:text-sm text-amber-100/90 leading-relaxed">{currentCut.tips}</p>
                </div>

                {/* Action CTA */}
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/10">
                  <div className="flex items-center gap-2 text-xs text-stone-400">
                    <ShieldCheck className="h-4 w-4 text-green-400 shrink-0" />
                    <span>Cold-chain vacuum sealed at 2°C for peak freshness.</span>
                  </div>

                  <Link
                    to={`/shop?category=${currentCut.categorySlug}&q=${encodeURIComponent(currentCut.name.split(' ')[0])}`}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-red-600/30 transition-all hover:scale-105 shrink-0"
                  >
                    Shop This Cut <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}

export default MeatCutsGuide
