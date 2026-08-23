import React from 'react'
import { motion } from 'framer-motion'
import { 
  Maximize2, 
  Columns, 
  Grid2X2, 
  PictureInPicture2, 
  Watch, 
  Layers
} from 'lucide-react'
import { useLayoutSplit, LayoutMode } from '../../contexts/LayoutSplitContext'

export const LayoutSelectorDock: React.FC = () => {
  const { 
    layoutMode, 
    setLayoutMode, 
    isWatchMode, 
    setIsWatchMode
  } = useLayoutSplit()

  const modes: Array<{ id: LayoutMode; label: string; icon: React.FC<{ className?: string }>; desc: string }> = [
    { id: 'standard', label: 'Full View', icon: Maximize2, desc: 'Classic spacious layout' },
    { id: 'split', label: '50/50 Split', icon: Columns, desc: 'Shop & Smart Prep Panel' },
    { id: 'quad', label: '4-Grid Quad', icon: Grid2X2, desc: 'Catalog, Provenance & Deals' },
    { id: 'pip', label: 'PiP Stream', icon: PictureInPicture2, desc: 'Floating Butcher / Cart feed' },
  ]

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[48] pointer-events-auto">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass-card-ultra rounded-full px-2 py-1.5 shadow-2xl flex items-center gap-1 border border-white/40 bg-white/85 dark:bg-stone-900/85 backdrop-blur-xl ring-1 ring-black/10"
      >
        <div className="flex items-center pl-2 pr-1 text-xs font-black uppercase tracking-wider text-stone-500 dark:text-stone-400 gap-1.5 select-none hidden sm:flex">
          <Layers className="h-3.5 w-3.5 text-[var(--site-primary)]" />
          <span className="hidden md:inline">Layout:</span>
        </div>

        {modes.map(({ id, label, icon: Icon }) => {
          const isActive = layoutMode === id
          return (
            <button
              key={id}
              onClick={() => setLayoutMode(id)}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                isActive
                  ? 'bg-[var(--site-primary)] text-[var(--site-buttonText,#ffffff)] shadow-md shadow-[var(--site-primary)]/30'
                  : 'text-stone-700 dark:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800/50'
              }`}
              title={label}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{label}</span>
              {isActive && (
                <motion.span
                  layoutId="activeLayoutPill"
                  className="absolute inset-0 rounded-full ring-2 ring-[var(--site-primary)] ring-offset-1 pointer-events-none"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          )
        })}

        {/* Watch Mode Toggle */}
        <button
          onClick={() => setIsWatchMode(!isWatchMode)}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-bold transition ${
            isWatchMode 
              ? 'bg-amber-500 text-white shadow-sm' 
              : 'text-stone-600 dark:text-stone-300 hover:bg-stone-200/50'
          }`}
          title="Toggle Smartwatch Viewport Simulator"
        >
          <Watch className="h-3.5 w-3.5" />
          <span className="hidden lg:inline">Watch View</span>
        </button>
      </motion.div>
    </div>
  )
}

export default LayoutSelectorDock
