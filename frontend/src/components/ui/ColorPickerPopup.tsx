import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Copy, RotateCcw } from 'lucide-react'

interface ColorPickerPopupProps {
  label: string
  description?: string
  value: string
  onChange: (hex: string) => void
}

/** Converts a hex color to HSL components */
function hexToHsl(hex: string): [number, number, number] {
  let r = 0, g = 0, b = 0
  const clean = hex.replace('#', '')
  if (clean.length === 3) {
    r = parseInt(clean[0] + clean[0], 16)
    g = parseInt(clean[1] + clean[1], 16)
    b = parseInt(clean[2] + clean[2], 16)
  } else if (clean.length >= 6) {
    r = parseInt(clean.slice(0, 2), 16)
    g = parseInt(clean.slice(2, 4), 16)
    b = parseInt(clean.slice(4, 6), 16)
  }
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
}

/** Converts HSL components back to a hex string */
function hslToHex(h: number, s: number, l: number): string {
  const hNorm = h / 360, sNorm = s / 100, lNorm = l / 100
  let r, g, b
  if (sNorm === 0) {
    r = g = b = lNorm
  } else {
    const q = lNorm < 0.5 ? lNorm * (1 + sNorm) : lNorm + sNorm - lNorm * sNorm
    const p = 2 * lNorm - q
    const hue2rgb = (pp: number, qq: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1/6) return pp + (qq - pp) * 6 * t
      if (t < 1/2) return qq
      if (t < 2/3) return pp + (qq - pp) * (2/3 - t) * 6
      return pp
    }
    r = hue2rgb(p, q, hNorm + 1/3)
    g = hue2rgb(p, q, hNorm)
    b = hue2rgb(p, q, hNorm - 1/3)
  }
  const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

export const ColorPickerPopup: React.FC<ColorPickerPopupProps> = ({ label, description, value, onChange }) => {
  const [open, setOpen] = useState(false)
  const [hex, setHex] = useState(value)
  const [copied, setCopied] = useState(false)
  const popupRef = useRef<HTMLDivElement>(null)
  const originalRef = useRef(value)

  const [h, s, l] = hexToHsl(hex)

  useEffect(() => { setHex(value) }, [value])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleHslChange = useCallback((newH: number, newS: number, newL: number) => {
    const next = hslToHex(newH, newS, newL)
    setHex(next)
    onChange(next)
  }, [onChange])

  const handleHexInput = (raw: string) => {
    setHex(raw)
    if (/^#[0-9a-fA-F]{6}$/.test(raw)) onChange(raw)
  }

  const copyHex = () => {
    navigator.clipboard.writeText(hex).catch(() => undefined)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const reset = () => {
    setHex(originalRef.current)
    onChange(originalRef.current)
  }

  // Suggested harmony colors
  const harmonies = [
    { label: 'Comp', color: hslToHex((h + 180) % 360, s, l) },
    { label: 'Split', color: hslToHex((h + 150) % 360, s, l) },
    { label: 'Analog', color: hslToHex((h + 30) % 360, s, l) },
    { label: 'Light', color: hslToHex(h, s, Math.min(l + 20, 95)) },
    { label: 'Dark', color: hslToHex(h, s, Math.max(l - 20, 5)) },
  ]

  return (
    <div className="relative" ref={popupRef}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="group flex w-full items-center justify-between rounded-xl border border-stone-200 bg-white px-3 py-2.5 shadow-sm transition hover:border-stone-300 hover:shadow-md"
        aria-label={`Pick color for ${label}`}
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <span
            className="h-8 w-8 flex-shrink-0 rounded-lg shadow-inner ring-2 ring-white transition-transform group-hover:scale-105"
            style={{ background: hex }}
          />
          <div className="text-left">
            <p className="text-sm font-semibold text-stone-800 leading-tight">{label}</p>
            {description && <p className="text-xs text-stone-500 leading-tight mt-0.5">{description}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <code className="text-xs font-mono text-stone-500 bg-stone-100 px-2 py-0.5 rounded">{hex.toUpperCase()}</code>
          <ChevronDown className={`h-4 w-4 text-stone-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Popup */}
      {open && (
        <div className="absolute left-0 top-full z-[9000] mt-2 w-80 rounded-2xl border border-white/40 bg-white/95 p-5 shadow-2xl backdrop-blur-xl ring-1 ring-black/5 animate-[fadeInDown_0.15s_ease]">
          {/* Big color preview */}
          <div
            className="mb-4 h-20 w-full rounded-xl shadow-inner transition-colors duration-150"
            style={{ background: `linear-gradient(135deg, ${hex}, ${hslToHex(h, Math.min(s + 10, 100), Math.max(l - 10, 5))})` }}
          />

          {/* Native color input (hidden visually, used as an overlay) */}
          <div className="mb-4 flex items-center gap-3">
            <label className="relative flex-1">
              <span className="sr-only">Pick from color wheel</span>
              <input
                type="color"
                value={hex.length === 7 ? hex : '#dc2626'}
                onChange={(e) => { setHex(e.target.value); onChange(e.target.value) }}
                className="h-10 w-full cursor-pointer rounded-lg border border-stone-200"
                title="Open color wheel"
              />
            </label>
            <div className="flex items-center gap-1.5 flex-1">
              <span className="text-xs font-mono text-stone-400">#</span>
              <input
                type="text"
                value={hex.replace('#', '').toUpperCase()}
                onChange={(e) => handleHexInput(`#${e.target.value}`)}
                maxLength={6}
                className="w-full rounded-lg border border-stone-200 bg-stone-50 px-2 py-2 text-sm font-mono uppercase tracking-widest focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
              />
            </div>
          </div>

          {/* HSL sliders */}
          <div className="space-y-3 mb-4">
            {/* Hue */}
            <div>
              <div className="mb-1 flex justify-between text-xs text-stone-500">
                <span>Hue</span><span>{h}°</span>
              </div>
              <div
                className="relative h-4 w-full rounded-full cursor-pointer"
                style={{ background: `linear-gradient(to right, hsl(0,${s}%,${l}%), hsl(30,${s}%,${l}%), hsl(60,${s}%,${l}%), hsl(90,${s}%,${l}%), hsl(120,${s}%,${l}%), hsl(150,${s}%,${l}%), hsl(180,${s}%,${l}%), hsl(210,${s}%,${l}%), hsl(240,${s}%,${l}%), hsl(270,${s}%,${l}%), hsl(300,${s}%,${l}%), hsl(330,${s}%,${l}%), hsl(360,${s}%,${l}%))` }}
              >
                <input
                  type="range" min={0} max={360} value={h}
                  onChange={(e) => handleHslChange(Number(e.target.value), s, l)}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
                <div
                  className="pointer-events-none absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border-2 border-white shadow-md"
                  style={{ left: `calc(${(h / 360) * 100}% - 10px)`, background: hex }}
                />
              </div>
            </div>

            {/* Saturation */}
            <div>
              <div className="mb-1 flex justify-between text-xs text-stone-500">
                <span>Saturation</span><span>{s}%</span>
              </div>
              <div
                className="relative h-4 w-full rounded-full cursor-pointer"
                style={{ background: `linear-gradient(to right, hsl(${h},0%,${l}%), hsl(${h},100%,${l}%))` }}
              >
                <input
                  type="range" min={0} max={100} value={s}
                  onChange={(e) => handleHslChange(h, Number(e.target.value), l)}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
                <div
                  className="pointer-events-none absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border-2 border-white shadow-md"
                  style={{ left: `calc(${s}% - 10px)`, background: hex }}
                />
              </div>
            </div>

            {/* Lightness */}
            <div>
              <div className="mb-1 flex justify-between text-xs text-stone-500">
                <span>Lightness</span><span>{l}%</span>
              </div>
              <div
                className="relative h-4 w-full rounded-full cursor-pointer"
                style={{ background: `linear-gradient(to right, hsl(${h},${s}%,0%), hsl(${h},${s}%,50%), hsl(${h},${s}%,100%))` }}
              >
                <input
                  type="range" min={0} max={100} value={l}
                  onChange={(e) => handleHslChange(h, s, Number(e.target.value))}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
                <div
                  className="pointer-events-none absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border-2 border-white shadow-md"
                  style={{ left: `calc(${l}% - 10px)`, background: hex }}
                />
              </div>
            </div>
          </div>

          {/* Harmony suggestions */}
          <div className="mb-4">
            <p className="mb-2 text-xs font-medium text-stone-500 uppercase tracking-wider">Color Harmonies</p>
            <div className="flex gap-2">
              {harmonies.map(({ label: hLabel, color }) => (
                <button
                  key={hLabel}
                  type="button"
                  onClick={() => { setHex(color); onChange(color) }}
                  title={`${hLabel}: ${color}`}
                  className="flex flex-col items-center gap-1 group"
                >
                  <span
                    className="h-7 w-7 rounded-lg shadow ring-2 ring-white transition-transform group-hover:scale-110"
                    style={{ background: color }}
                  />
                  <span className="text-[10px] text-stone-400">{hLabel}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 border-t border-stone-100 pt-3">
            <button
              type="button"
              onClick={copyHex}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-stone-100 px-3 py-2 text-xs font-medium text-stone-600 transition hover:bg-stone-200"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied!' : 'Copy HEX'}
            </button>
            <button
              type="button"
              onClick={reset}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-stone-100 px-3 py-2 text-xs font-medium text-stone-600 transition hover:bg-stone-200"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700"
            >
              <Check className="h-3.5 w-3.5" /> Apply
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ColorPickerPopup
