import React, { createContext, useContext, useState, useEffect } from 'react'

export type LayoutMode = 'standard' | 'split' | 'quad' | 'pip'

interface LayoutSplitContextType {
  layoutMode: LayoutMode
  setLayoutMode: (mode: LayoutMode) => void
  isPipActive: boolean
  setIsPipActive: (active: boolean) => void
  pipStreamType: 'meat_prep' | 'order_track' | 'freshness_cam' | 'cart_mini'
  setPipStreamType: (type: 'meat_prep' | 'order_track' | 'freshness_cam' | 'cart_mini') => void
  splitPanelContent: 'guide' | 'cart' | 'whatsapp' | 'bundles' | 'reviews'
  setSplitPanelContent: (content: 'guide' | 'cart' | 'whatsapp' | 'bundles' | 'reviews') => void
  isWatchMode: boolean
  setIsWatchMode: (mode: boolean) => void
}

const LayoutSplitContext = createContext<LayoutSplitContextType | undefined>(undefined)

const STORAGE_KEY = 'hincton_layout_mode_pref'

export const LayoutSplitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [layoutMode, setLayoutModeState] = useState<LayoutMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved && ['standard', 'split', 'quad', 'pip'].includes(saved)) {
        return saved as LayoutMode
      }
    } catch {}
    return 'standard'
  })

  const [isPipActive, setIsPipActive] = useState<boolean>(() => layoutMode === 'pip')
  const [pipStreamType, setPipStreamType] = useState<'meat_prep' | 'order_track' | 'freshness_cam' | 'cart_mini'>('freshness_cam')
  const [splitPanelContent, setSplitPanelContent] = useState<'guide' | 'cart' | 'whatsapp' | 'bundles' | 'reviews'>('bundles')
  const [isWatchMode, setIsWatchMode] = useState<boolean>(false)

  const setLayoutMode = (mode: LayoutMode) => {
    setLayoutModeState(mode)
    if (mode === 'pip') {
      setIsPipActive(true)
    }
    try {
      localStorage.setItem(STORAGE_KEY, mode)
    } catch {}
  }

  // Detect ultra-compact smartwatch viewports (<320px)
  useEffect(() => {
    const checkWidth = () => {
      if (window.innerWidth < 320) {
        setIsWatchMode(true)
      }
    }
    checkWidth()
    window.addEventListener('resize', checkWidth)
    return () => window.removeEventListener('resize', checkWidth)
  }, [])

  return (
    <LayoutSplitContext.Provider
      value={{
        layoutMode,
        setLayoutMode,
        isPipActive,
        setIsPipActive,
        pipStreamType,
        setPipStreamType,
        splitPanelContent,
        setSplitPanelContent,
        isWatchMode,
        setIsWatchMode,
      }}
    >
      {children}
    </LayoutSplitContext.Provider>
  )
}

export const useLayoutSplit = () => {
  const context = useContext(LayoutSplitContext)
  if (!context) {
    throw new Error('useLayoutSplit must be used within a LayoutSplitProvider')
  }
  return context
}
