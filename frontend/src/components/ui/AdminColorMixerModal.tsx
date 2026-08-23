import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Palette, 
  Sparkles, 
  RotateCcw, 
  Save, 
  X, 
  Sliders, 
  Zap,
  Eye
} from 'lucide-react'
import { useSiteTheme, defaultSiteTheme, SiteTheme } from '../../contexts/SiteThemeContext'
import { contentApi } from '../../services/adminApi'
import toast from 'react-hot-toast'

interface AdminColorMixerModalProps {
  isOpen: boolean
  onClose: () => void
}

const themePresets: Record<string, SiteTheme> = {
  'Prime Crimson (Default)': defaultSiteTheme,
  'Emerald Highland Fresh': {
    ...defaultSiteTheme,
    primary: '#16a34a',
    accent: '#84cc16',
    page: '#f6fbf7',
    surface: '#ffffff',
    laserColor: '#22c55e',
    header: '#ffffff',
    footer: '#064e3b',
    navActive: '#16a34a',
  },
  'Royal Amber Gold': {
    ...defaultSiteTheme,
    primary: '#d97706',
    accent: '#f59e0b',
    page: '#fffdfa',
    surface: '#ffffff',
    laserColor: '#f59e0b',
    header: '#ffffff',
    footer: '#451a03',
    navActive: '#d97706',
  },
  'Obsidian Dark Luxury': {
    ...defaultSiteTheme,
    primary: '#ef4444',
    accent: '#f59e0b',
    page: '#0c0a09',
    surface: '#1c1917',
    text: '#fafaf9',
    muted: '#a8a29e',
    border: '#292524',
    laserColor: '#22c55e',
    header: '#1c1917',
    footer: '#09090b',
    navText: '#d6d3d1',
    navActive: '#ef4444',
  },
  'Neon Cyber Butchery': {
    ...defaultSiteTheme,
    primary: '#06b6d4',
    accent: '#ec4899',
    page: '#030712',
    surface: '#111827',
    text: '#f3f4f6',
    muted: '#9ca3af',
    border: '#1f2937',
    laserColor: '#06b6d4',
    header: '#111827',
    footer: '#030712',
    navText: '#e5e7eb',
    navActive: '#06b6d4',
  },
}

export const AdminColorMixerModal: React.FC<AdminColorMixerModalProps> = ({ isOpen, onClose }) => {
  const { theme, applyTheme } = useSiteTheme()
  const [currentColors, setCurrentColors] = useState<SiteTheme>(theme)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'mixer' | 'presets'>('mixer')

  useEffect(() => {
    setCurrentColors(theme)
  }, [theme])

  const handleColorChange = (key: string, value: string) => {
    const updated = { ...currentColors, [key]: value }
    setCurrentColors(updated)
    applyTheme(updated)
  }

  const handlePresetSelect = (presetName: string) => {
    const preset = themePresets[presetName]
    if (preset) {
      setCurrentColors(preset)
      applyTheme(preset)
      toast.success(`Loaded "${presetName}" theme preset`)
    }
  }

  const handleSaveTheme = async () => {
    setSaving(true)
    try {
      await contentApi.updateSiteTheme(currentColors)
      toast.success('Theme published across buyer and admin system!')
      onClose()
    } catch {
      toast.error('Could not save theme to server, saved locally.')
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setCurrentColors(defaultSiteTheme)
    applyTheme(defaultSiteTheme)
    toast.success('Restored default theme')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        className="glass-card-ultra w-full max-w-2xl rounded-3xl p-6 border border-white/60 bg-white/95 dark:bg-stone-900/95 shadow-2xl text-stone-900 dark:text-white max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[var(--site-primary)] to-[var(--site-accent)] flex items-center justify-center text-white shadow-lg">
              <Palette className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">System-Wide Color Mixer</h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Transforms colors in real-time across both Buyer & Admin sides
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex gap-2 my-4">
          <button
            onClick={() => setActiveTab('mixer')}
            className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 ${
              activeTab === 'mixer'
                ? 'bg-[var(--site-primary)] text-white shadow-md'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
            }`}
          >
            <Sliders className="h-3.5 w-3.5" /> Interactive Color Sliders
          </button>
          <button
            onClick={() => setActiveTab('presets')}
            className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 ${
              activeTab === 'presets'
                ? 'bg-[var(--site-primary)] text-white shadow-md'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" /> Curated Theme Presets
          </button>
        </div>

        {/* Tab 1: Interactive Mixer */}
        {activeTab === 'mixer' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Primary Color */}
              <div className="p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50">
                <label className="flex items-center justify-between text-xs font-bold mb-2">
                  <span>Primary Brand Accent</span>
                  <span className="font-mono text-[11px] uppercase text-stone-500">{currentColors.primary}</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={currentColors.primary || '#dc2626'}
                    onChange={(e) => handleColorChange('primary', e.target.value)}
                    className="h-10 w-16 cursor-pointer rounded-xl border-none p-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={currentColors.primary || '#dc2626'}
                    onChange={(e) => handleColorChange('primary', e.target.value)}
                    className="w-full text-xs font-mono uppercase bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg px-2.5 py-1.5"
                  />
                </div>
              </div>

              {/* Accent Color */}
              <div className="p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50">
                <label className="flex items-center justify-between text-xs font-bold mb-2">
                  <span>Secondary / Highlight</span>
                  <span className="font-mono text-[11px] uppercase text-stone-500">{currentColors.accent}</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={currentColors.accent || '#f59e0b'}
                    onChange={(e) => handleColorChange('accent', e.target.value)}
                    className="h-10 w-16 cursor-pointer rounded-xl border-none p-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={currentColors.accent || '#f59e0b'}
                    onChange={(e) => handleColorChange('accent', e.target.value)}
                    className="w-full text-xs font-mono uppercase bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg px-2.5 py-1.5"
                  />
                </div>
              </div>

              {/* QR Laser Scanner Color */}
              <div className="p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50 sm:col-span-2">
                <label className="flex items-center justify-between text-xs font-bold mb-2">
                  <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <Zap className="h-3.5 w-3.5" /> QR Camera Laser Beam & Particle Glow
                  </span>
                  <span className="font-mono text-[11px] uppercase text-stone-500">{currentColors.laserColor || '#22c55e'}</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={currentColors.laserColor || '#22c55e'}
                    onChange={(e) => handleColorChange('laserColor', e.target.value)}
                    className="h-10 w-16 cursor-pointer rounded-xl border-none p-0 bg-transparent"
                  />
                  <div className="flex-1 flex gap-2">
                    {['#22c55e', '#ef4444', '#06b6d4', '#f59e0b', '#a855f7'].map((c) => (
                      <button
                        key={c}
                        onClick={() => handleColorChange('laserColor', c)}
                        className="h-7 w-7 rounded-lg shadow-sm border border-white/50 transition hover:scale-110"
                        style={{ backgroundColor: c }}
                        title={`Set laser color to ${c}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Page Background */}
              <div className="p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50">
                <label className="flex items-center justify-between text-xs font-bold mb-2">
                  <span>Page Canvas Background</span>
                  <span className="font-mono text-[11px] uppercase text-stone-500">{currentColors.page}</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={currentColors.page || '#ffffff'}
                    onChange={(e) => handleColorChange('page', e.target.value)}
                    className="h-10 w-16 cursor-pointer rounded-xl border-none p-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={currentColors.page || '#ffffff'}
                    onChange={(e) => handleColorChange('page', e.target.value)}
                    className="w-full text-xs font-mono uppercase bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg px-2.5 py-1.5"
                  />
                </div>
              </div>

              {/* Surface Color */}
              <div className="p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50">
                <label className="flex items-center justify-between text-xs font-bold mb-2">
                  <span>Surface & Cards</span>
                  <span className="font-mono text-[11px] uppercase text-stone-500">{currentColors.surface}</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={currentColors.surface || '#ffffff'}
                    onChange={(e) => handleColorChange('surface', e.target.value)}
                    className="h-10 w-16 cursor-pointer rounded-xl border-none p-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={currentColors.surface || '#ffffff'}
                    onChange={(e) => handleColorChange('surface', e.target.value)}
                    className="w-full text-xs font-mono uppercase bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg px-2.5 py-1.5"
                  />
                </div>
              </div>
            </div>

            {/* Live Interactive Preview Box */}
            <div className="mt-4 p-4 rounded-2xl border border-stone-200 dark:border-stone-700 bg-[var(--site-page)] shadow-inner">
              <p className="text-xs font-black uppercase tracking-wider text-stone-400 mb-2 flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5" /> Live Preview Widget
              </p>
              <div className="p-4 rounded-2xl bg-[var(--site-surface)] border border-[var(--site-border)] shadow-md flex items-center justify-between gap-4">
                <div>
                  <h4 className="font-extrabold text-sm text-[var(--site-text)]">Premium Nyama Choma</h4>
                  <p className="text-xs text-[var(--site-muted)]">Kenyan Aged Beef Ribs • Sourced 6 AM</p>
                </div>
                <button className="px-4 py-2 rounded-xl bg-[var(--site-primary)] text-[var(--site-buttonText,#ffffff)] text-xs font-black shadow-md hover:scale-105 transition">
                  Buy Now • KSh 950
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Theme Presets */}
        {activeTab === 'presets' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(themePresets).map(([name, preset]) => (
              <button
                key={name}
                onClick={() => handlePresetSelect(name)}
                className="group p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/40 text-left hover:border-[var(--site-primary)] hover:shadow-lg transition space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-stone-900 dark:text-white group-hover:text-[var(--site-primary)]">
                    {name}
                  </span>
                  <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: preset.primary }} />
                </div>
                <div className="flex gap-1.5">
                  <span className="h-5 flex-1 rounded-md" style={{ backgroundColor: preset.primary }} title="Primary" />
                  <span className="h-5 flex-1 rounded-md" style={{ backgroundColor: preset.accent }} title="Accent" />
                  <span className="h-5 flex-1 rounded-md border border-stone-300" style={{ backgroundColor: preset.page }} title="Page" />
                  <span className="h-5 flex-1 rounded-md" style={{ backgroundColor: preset.laserColor || '#22c55e' }} title="Laser" />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-xs font-bold hover:bg-stone-200"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Restore Defaults
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-bold"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveTheme}
              disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[var(--site-primary)] text-white text-xs font-extrabold shadow-lg hover:scale-105 transition disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              {saving ? 'Publishing...' : 'Save & Publish for All'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default AdminColorMixerModal
