import { useEffect, useMemo, useState } from 'react'
import { Check, Plus, RotateCcw, Save, Sparkles, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { contentApi } from '../services/adminApi'
import {
  blankSiteTheme,
  defaultSiteTheme,
  SiteTheme,
  themeColorFields,
  useSiteTheme,
} from '../contexts/SiteThemeContext'
import { useSiteContent } from '../contexts/SiteContentContext'
import { useConfirmationDialog } from '../hooks/useConfirmationDialog'
import ConfirmationDialog from '../components/ui/ConfirmationDialog'

const presets: Record<string, SiteTheme> = {
  'Market Red': defaultSiteTheme,
  Forest: { ...defaultSiteTheme, primary: '#16744b', accent: '#d6922d', page: '#f6fbf7', ad: '#e8f7ed', navActive: '#16744b' },
  Midnight: { ...defaultSiteTheme, primary: '#4f46e5', accent: '#ec4899', page: '#f7f7ff', ad: '#f2efff', footer: '#0f172a', navActive: '#4f46e5' },
  Ocean: { ...defaultSiteTheme, primary: '#0369a1', accent: '#06b6d4', page: '#f0f9ff', ad: '#e0f2fe', navActive: '#0369a1' },
}

export default function ThemePage() {
  const { theme: liveTheme, applyTheme } = useSiteTheme()
  const { refresh: refreshContent } = useSiteContent()
  const { isOpen, options, confirm, handleConfirm, handleCancel } = useConfirmationDialog()
  const [theme, setTheme] = useState<SiteTheme>(liveTheme)
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [customKey, setCustomKey] = useState('')
  const [customValue, setCustomValue] = useState('#6366f1')

  useEffect(() => setTheme(liveTheme), [liveTheme])

  const isChanged = useMemo(() => JSON.stringify(theme) !== JSON.stringify(liveTheme), [theme, liveTheme])
  const knownKeys = new Set(themeColorFields.map(([key]) => key))
  const customColors = Object.entries(theme).filter(([key]) => !knownKeys.has(key as typeof themeColorFields[number][0]))

  const update = (key: string, value: string) => {
    const next = { ...theme, [key]: value }
    setTheme(next)
    applyTheme(next)
  }

  const addCustomColor = () => {
    const key = customKey.trim().replace(/[^a-zA-Z0-9_-]/g, '')
    if (!key) {
      toast.error('Enter a colour key (letters, numbers, dash, underscore)')
      return
    }
    update(key, customValue)
    setCustomKey('')
    toast.success(`Added custom colour: ${key}`)
  }

  const removeCustomColor = (key: string) => {
    const next = { ...theme }
    delete next[key]
    setTheme(next)
    applyTheme(next)
  }

  const save = async () => {
    setSaving(true)
    try {
      await contentApi.updateSiteTheme(theme)
      toast.success('Theme saved and published for all visitors')
    } catch {
      toast.error('Could not save the theme')
    } finally {
      setSaving(false)
    }
  }

  const resetLocal = (next: SiteTheme) => {
    setTheme(next)
    applyTheme(next)
  }

  const runReset = async (mode: 'blank' | 'defaults', targets: Array<'profile' | 'theme' | 'all'>) => {
    const label = mode === 'blank' ? 'blank slate (no branding, neutral colours)' : 'factory defaults'
    const confirmed = await confirm({
      title: mode === 'blank' ? 'Reset to blank?' : 'Restore defaults?',
      message: `This will reset ${targets.join(', ')} to ${label}. You can still save or undo before leaving if you only previewed locally.`,
      confirmText: mode === 'blank' ? 'Reset to blank' : 'Restore defaults',
      cancelText: 'Cancel',
      type: 'danger',
    })
    if (!confirmed) return

    setResetting(true)
    try {
      const result = await contentApi.resetAppearance({ mode, targets })
      if (result.theme) applyTheme(result.theme)
      if (result.profile) await refreshContent()
      toast.success(result.message || 'Appearance reset')
      if (result.theme) setTheme(result.theme)
    } catch {
      toast.error('Reset failed')
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-7 p-4 sm:p-6 lg:p-8">
      <ConfirmationDialog
        isOpen={isOpen}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        title={options?.title || ''}
        message={options?.message || ''}
        confirmText={options?.confirmText}
        cancelText={options?.cancelText}
        type={options?.type}
      />

      <section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-stone-950 via-stone-900 to-[var(--site-primary)] p-7 text-white shadow-xl sm:p-9">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <span className="flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[.16em]">
              <Sparkles className="h-3.5 w-3.5" /> Live storefront theme
            </span>
            <h1 className="mt-4 text-3xl font-black sm:text-4xl">Full colour control</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/75">
              Pick any colour for every part of the site — buttons, nav, footer, warnings, links, and your own custom tokens. Preview instantly, then save to publish.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => resetLocal(defaultSiteTheme)} className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold hover:bg-white/20">
              <RotateCcw className="h-4 w-4" /> Preview defaults
            </button>
            <button type="button" onClick={() => resetLocal(blankSiteTheme)} className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold hover:bg-white/20">
              Preview blank
            </button>
            <button type="button" onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-stone-900 disabled:opacity-60">
              <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save & publish'}
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-red-200 bg-red-50 p-5 sm:p-6">
        <h2 className="text-lg font-black text-red-900">Reset storefront appearance</h2>
        <p className="mt-1 text-sm text-red-800">Choose how far you want to go. Blank removes logo, name, images, and sets neutral greys. Defaults restores the original Hincton branding.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" disabled={resetting} onClick={() => runReset('blank', ['theme'])} className="rounded-xl border border-red-300 bg-white px-4 py-2.5 text-sm font-bold text-red-800 hover:bg-red-100 disabled:opacity-60">Reset colours only (blank)</button>
          <button type="button" disabled={resetting} onClick={() => runReset('blank', ['profile'])} className="rounded-xl border border-red-300 bg-white px-4 py-2.5 text-sm font-bold text-red-800 hover:bg-red-100 disabled:opacity-60">Clear branding & images</button>
          <button type="button" disabled={resetting} onClick={() => runReset('blank', ['all'])} className="rounded-xl bg-red-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-800 disabled:opacity-60">Full blank slate</button>
          <button type="button" disabled={resetting} onClick={() => runReset('defaults', ['all'])} className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-bold text-stone-800 hover:bg-stone-50 disabled:opacity-60">Restore factory defaults</button>
        </div>
      </section>

      <div className="grid gap-7 lg:grid-cols-[1fr_22rem]">
        <section className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-stone-950">Built-in colours</h2>
              <p className="mt-1 text-sm text-stone-500">Use the picker or paste any hex, rgb, or rgba value.</p>
            </div>
            {isChanged && <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800">Unsaved preview</span>}
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {themeColorFields.map(([key, label, help]) => (
              <label key={key} className="rounded-2xl border border-stone-200 p-4 transition hover:border-stone-300">
                <span className="block text-sm font-bold text-stone-900">{label}</span>
                <span className="mt-0.5 block text-xs text-stone-500">{help}</span>
                <span className="mt-3 flex items-center gap-3">
                  <input aria-label={label} type="color" value={theme[key]?.startsWith('#') && theme[key].length <= 9 ? theme[key] : '#6b7280'} onChange={(e) => update(key, e.target.value)} className="h-10 w-12 cursor-pointer rounded-lg border-0 bg-transparent p-0" />
                  <input value={theme[key] || ''} onChange={(e) => update(key, e.target.value)} className="min-w-0 flex-1 rounded-lg border border-stone-200 px-3 py-2 font-mono text-sm outline-none focus:border-[var(--site-primary)]" />
                </span>
              </label>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-dashed border-stone-300 p-4">
            <h3 className="font-bold text-stone-900">Add custom colour token</h3>
            <p className="mt-1 text-xs text-stone-500">Create any extra CSS variable, e.g. <code className="font-mono">saleBadge</code> or <code className="font-mono">heroGradientEnd</code>.</p>
            <div className="mt-3 flex flex-wrap items-end gap-3">
              <label className="flex-1 min-w-[8rem]">
                <span className="text-xs font-semibold text-stone-600">Key</span>
                <input value={customKey} onChange={(e) => setCustomKey(e.target.value)} placeholder="myCustomColor" className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm" />
              </label>
              <label>
                <span className="text-xs font-semibold text-stone-600">Colour</span>
                <input type="color" value={customValue} onChange={(e) => setCustomValue(e.target.value)} className="mt-1 block h-10 w-12 cursor-pointer rounded-lg" />
              </label>
              <button type="button" onClick={addCustomColor} className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-bold text-white">
                <Plus className="h-4 w-4" /> Add
              </button>
            </div>
            {customColors.length > 0 && (
              <div className="mt-4 space-y-2">
                {customColors.map(([key, value]) => (
                  <div key={key} className="flex items-center gap-3 rounded-xl bg-stone-50 px-3 py-2">
                    <i className="h-6 w-6 rounded-full border border-black/10" style={{ background: value }} />
                    <span className="font-mono text-sm font-bold text-stone-800">{key}</span>
                    <input value={value} onChange={(e) => update(key, e.target.value)} className="ml-auto min-w-0 flex-1 rounded border border-stone-200 px-2 py-1 font-mono text-xs" />
                    <button type="button" onClick={() => removeCustomColor(key)} className="rounded-lg p-1.5 text-stone-400 hover:bg-white hover:text-red-600" aria-label={`Remove ${key}`}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="font-black text-stone-950">Quick palettes</h2>
            <div className="mt-4 space-y-3">
              {Object.entries(presets).map(([name, palette]) => (
                <button key={name} type="button" onClick={() => resetLocal(palette)} className="flex w-full items-center gap-3 rounded-2xl border border-stone-200 p-3 text-left hover:border-stone-400">
                  <span className="flex gap-1">
                    {['primary', 'accent', 'page'].map((k) => (
                      <i key={k} className="h-5 w-5 rounded-full border border-black/10" style={{ background: palette[k] }} />
                    ))}
                  </span>
                  <span className="text-sm font-bold text-stone-800">{name}</span>
                </button>
              ))}
            </div>
          </section>
          <section className="overflow-hidden rounded-[2rem] border border-stone-200 bg-[var(--site-page)] p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--site-muted)]">Live preview</p>
            <h3 className="mt-3 text-xl font-black text-[var(--site-text)]">Your storefront</h3>
            <p className="mt-2 text-sm text-[var(--site-muted)]">Visitors see this after you save.</p>
            <button type="button" className="mt-5 w-full rounded-xl bg-[var(--site-primary)] px-4 py-3 font-bold text-[var(--site-buttonText)]">Shop now</button>
            <div className="mt-3 rounded-xl bg-[var(--site-ad)] p-3 text-sm font-bold text-[var(--site-primary)]">
              <Check className="mr-1 inline h-4 w-4" /> Promo strip
            </div>
            <div className="mt-3 rounded-xl bg-[var(--site-footer)] p-3 text-sm text-[var(--site-footerText)]">Footer preview</div>
          </section>
        </aside>
      </div>
    </div>
  )
}
