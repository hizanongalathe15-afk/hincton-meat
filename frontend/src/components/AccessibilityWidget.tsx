import { useEffect, useState } from 'react'
import { Accessibility, Type, X, CircleDot, Volume2, RotateCcw, Minus, Plus } from 'lucide-react'

const STORAGE_KEY = 'hincton-accessibility'
const ROOT_CLASS_CONTRAST = 'a11y-high-contrast'
const ROOT_CLASS_REDUCED_MOTION = 'a11y-reduced-motion'
const ROOT_CLASS_LINKS_UNDERLINE = 'a11y-links-underlined'

interface Prefs {
  fontSize: number
  contrast: boolean
  reducedMotion: boolean
  linksUnderlined: boolean
}

const DEFAULTS: Prefs = {
  fontSize: 100,
  contrast: false,
  reducedMotion: false,
  linksUnderlined: false,
}

const MIN_FONT = 85
const MAX_FONT = 135

const loadPrefs = (): Prefs => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULTS
    return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch {
    return DEFAULTS
  }
}

const applyPreferences = (p: Prefs) => {
  const root = document.documentElement
  root.style.setProperty('--a11y-font-scale', `${p.fontSize}%`)
  root.style.fontSize = `calc(16px * ${p.fontSize / 100})`
  root.classList.toggle(ROOT_CLASS_CONTRAST, !!p.contrast)
  root.classList.toggle(ROOT_CLASS_REDUCED_MOTION, !!p.reducedMotion)
  root.classList.toggle(ROOT_CLASS_LINKS_UNDERLINE, !!p.linksUnderlined)
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)) } catch {}
}

const AccessibilityWidget = () => {
  const [open, setOpen] = useState(false)
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS)

  useEffect(() => {
    const initial = loadPrefs()
    setPrefs(initial)
    applyPreferences(initial)
    const styleEl = document.getElementById('a11y-styles')
    if (!styleEl) {
      const s = document.createElement('style')
      s.id = 'a11y-styles'
      s.textContent = `
        html.${ROOT_CLASS_CONTRAST} { filter: contrast(1.2) saturate(0.9); }
        html.${ROOT_CLASS_CONTRAST} body { background-color:#000 !important; color:#fff !important; }
        html.${ROOT_CLASS_CONTRAST} * { box-shadow: none !important; text-shadow: none !important; border-color:#555 !important; }
        html.${ROOT_CLASS_CONTRAST} [class*="bg-white"], html.${ROOT_CLASS_CONTRAST} [class*="bg-gray-50"], html.${ROOT_CLASS_CONTRAST} [class*="bg-gray-100"] { background-color:#000 !important; color:#fff !important; }
        html.${ROOT_CLASS_CONTRAST} [class*="text-gray-500"], html.${ROOT_CLASS_CONTRAST} [class*="text-gray-600"], html.${ROOT_CLASS_CONTRAST} [class*="text-gray-700"], html.${ROOT_CLASS_CONTRAST} [class*="text-gray-800"], html.${ROOT_CLASS_CONTRAST} [class*="text-gray-900"], html.${ROOT_CLASS_CONTRAST} [class*="text-gray-950"] { color:#fff !important; }
        html.${ROOT_CLASS_REDUCED_MOTION} * { animation:none !important; transition:none !important; }
        html.${ROOT_CLASS_LINKS_UNDERLINE} a { text-decoration: underline !important; text-underline-offset: 2px; }
      `
      document.head.appendChild(s)
    }
  }, [])

  const update = (patch: Partial<Prefs>) => {
    const next = { ...prefs, ...patch }
    setPrefs(next)
    applyPreferences(next)
  }

  const speakSelection = () => {
    if (!('speechSynthesis' in window)) { alert('Text-to-speech is not supported in this browser.') ; return }
    const selection = (window.getSelection()?.toString() || '').trim()
    if (!selection) {
      alert('Highlight any text on the page, then click this button to hear it read aloud.')
      return
    }
    try {
      const utter = new SpeechSynthesisUtterance(selection)
      utter.rate = 0.95
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(utter)
    } catch {
      alert('Could not start speech synthesis.')
    }
  }

  const reset = () => {
    setPrefs(DEFAULTS)
    applyPreferences(DEFAULTS)
  }

  if (!open) {
    return (
      <button
        aria-label="Open accessibility options"
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-4 z-[60] inline-flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-2xl shadow-red-900/40 border-4 border-white hover:bg-red-700 hover:scale-105 transition-all"
      >
        <Accessibility className="h-7 w-7" />
      </button>
    )
  }

  return (
    <aside
      aria-label="Accessibility toolbar"
      className="fixed bottom-24 right-4 z-[60] w-[22rem] max-w-[calc(100vw-2rem)] rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-black/20 overflow-hidden"
    >
      <div className="bg-gradient-to-r from-gray-950 via-[#9f2f20] to-gray-950 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <Accessibility className="h-5 w-5" />
          <h2 className="text-base font-extrabold">Accessibility</h2>
        </div>
        <button aria-label="Close accessibility toolbar" onClick={() => setOpen(false)} className="rounded-lg p-1 text-white/80 hover:bg-white/10 hover:text-white">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="p-4 space-y-5">
        <section>
          <div className="flex items-center justify-between mb-2">
            <label className="inline-flex items-center gap-2 text-sm font-bold text-gray-800">
              <Type className="h-4 w-4 text-red-600" /> Text size
            </label>
            <span className="text-xs font-bold text-gray-500 tabular-nums">{prefs.fontSize}%</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              aria-label="Decrease font size"
              onClick={() => update({ fontSize: Math.max(MIN_FONT, prefs.fontSize - 5) })}
              className="h-9 w-9 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 inline-flex items-center justify-center disabled:opacity-50"
              disabled={prefs.fontSize <= MIN_FONT}
            >
              <Minus className="h-4 w-4" />
            </button>
            <input
              type="range"
              min={MIN_FONT}
              max={MAX_FONT}
              step={5}
              value={prefs.fontSize}
              onChange={(e) => update({ fontSize: Number(e.target.value) })}
              className="flex-1 accent-red-600"
            />
            <button
              aria-label="Increase font size"
              onClick={() => update({ fontSize: Math.min(MAX_FONT, prefs.fontSize + 5) })}
              className="h-9 w-9 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 inline-flex items-center justify-center disabled:opacity-50"
              disabled={prefs.fontSize >= MAX_FONT}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </section>

        <label className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 cursor-pointer hover:bg-gray-100">
          <div className="flex items-center gap-2">
            <CircleDot className="h-4 w-4 text-red-600" />
            <div>
              <p className="text-sm font-bold text-gray-800">High contrast</p>
              <p className="text-xs text-gray-500">Stronger colours, clearer edges</p>
            </div>
          </div>
          <input type="checkbox" className="accent-red-600 h-5 w-5" checked={prefs.contrast} onChange={(e) => update({ contrast: e.target.checked })} />
        </label>

        <label className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 cursor-pointer hover:bg-gray-100">
          <div className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-red-600" />
            <div>
              <p className="text-sm font-bold text-gray-800">Reduce motion</p>
              <p className="text-xs text-gray-500">Disable animations and transitions</p>
            </div>
          </div>
          <input type="checkbox" className="accent-red-600 h-5 w-5" checked={prefs.reducedMotion} onChange={(e) => update({ reducedMotion: e.target.checked })} />
        </label>

        <label className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 cursor-pointer hover:bg-gray-100">
          <div className="flex items-center gap-2">
            <Type className="h-4 w-4 text-red-600" />
            <div>
              <p className="text-sm font-bold text-gray-800">Underline links</p>
              <p className="text-xs text-gray-500">Spot every link at a glance</p>
            </div>
          </div>
          <input type="checkbox" className="accent-red-600 h-5 w-5" checked={prefs.linksUnderlined} onChange={(e) => update({ linksUnderlined: e.target.checked })} />
        </label>

        <button
          onClick={speakSelection}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gradient-to-br from-red-50 to-gray-50 px-4 py-3 text-sm font-bold text-gray-800 hover:from-red-100 hover:to-gray-100"
        >
          <Volume2 className="h-4 w-4 text-red-600" /> Read selected text aloud
        </button>

        <button
          onClick={reset}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50"
        >
          Reset accessibility options
        </button>
      </div>
    </aside>
  )
}

export default AccessibilityWidget
