import { useEffect, useMemo, useState } from 'react'
import { Check, RotateCcw, Save, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import { settingsApi } from '../services/adminApi'
import { defaultSiteTheme, SiteTheme, useSiteTheme } from '../contexts/SiteThemeContext'

const fields = [
  ['primary', 'Primary actions', 'Main buttons, links and highlights'], ['accent', 'Accent', 'Badges and secondary calls to action'],
  ['page', 'Page background', 'Storefront canvas and login backdrop'], ['surface', 'Card surface', 'Cards, modals and input areas'],
  ['text', 'Main text', 'Headings and important copy'], ['muted', 'Muted text', 'Supporting labels and descriptions'],
  ['border', 'Borders', 'Inputs, dividers and card outlines'], ['buttonText', 'Button text', 'Text on primary buttons'],
  ['header', 'Header background', 'Navigation and top areas'], ['ad', 'Promotion background', 'Ads, promotions and notices'],
  ['success', 'Success', 'Confirmed actions and positive states'], ['info', 'Information', 'Neutral notices and links'],
] as const

const presets: Record<string, SiteTheme> = {
  'Market Red': defaultSiteTheme,
  'Forest': { ...defaultSiteTheme, primary: '#16744b', accent: '#d6922d', page: '#f6fbf7', ad: '#e8f7ed' },
  'Midnight': { ...defaultSiteTheme, primary: '#4f46e5', accent: '#ec4899', page: '#f7f7ff', ad: '#f2efff' },
}

export default function ThemePage() {
  const { theme: liveTheme, applyTheme } = useSiteTheme()
  const [theme, setTheme] = useState<SiteTheme>(liveTheme)
  const [saving, setSaving] = useState(false)
  useEffect(() => setTheme(liveTheme), [liveTheme])
  const isChanged = useMemo(() => JSON.stringify(theme) !== JSON.stringify(liveTheme), [theme, liveTheme])
  const update = (key: string, value: string) => { const next = { ...theme, [key]: value }; setTheme(next); applyTheme(next) }
  const save = async () => { setSaving(true); try { await settingsApi.createSetting({ key: 'site_theme', value: JSON.stringify(theme), type: 'json', group: 'appearance', description: 'Storefront colour palette', isPublic: true }); toast.success('Theme saved and published') } catch { toast.error('Could not save the theme') } finally { setSaving(false) } }
  const reset = () => { setTheme(defaultSiteTheme); applyTheme(defaultSiteTheme) }

  return <div className="mx-auto max-w-7xl space-y-7 p-4 sm:p-6 lg:p-8">
    <section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-stone-950 via-stone-900 to-[var(--site-primary)] p-7 text-white shadow-xl sm:p-9">
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><div><span className="flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[.16em]"><Sparkles className="h-3.5 w-3.5" /> Live storefront theme</span><h1 className="mt-4 text-3xl font-black sm:text-4xl">Make every colour yours.</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-white/75">Changes preview instantly across the storefront, ads, buttons, navigation and authentication pages. Save to publish them for every visitor.</p></div><div className="flex gap-3"><button onClick={reset} className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold hover:bg-white/20"><RotateCcw className="h-4 w-4" /> Reset</button><button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-stone-900 disabled:opacity-60"><Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save & publish'}</button></div></div>
    </section>
    <div className="grid gap-7 lg:grid-cols-[1fr_22rem]"><section className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm sm:p-7"><div className="flex items-center justify-between"><div><h2 className="text-xl font-black text-stone-950">Colour controls</h2><p className="mt-1 text-sm text-stone-500">Use a picker or paste any hex colour.</p></div>{isChanged && <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800">Unsaved preview</span>}</div><div className="mt-6 grid gap-3 sm:grid-cols-2">{fields.map(([key, label, help]) => <label key={key} className="rounded-2xl border border-stone-200 p-4 transition hover:border-stone-300"><span className="block text-sm font-bold text-stone-900">{label}</span><span className="mt-0.5 block text-xs text-stone-500">{help}</span><span className="mt-3 flex items-center gap-3"><input aria-label={label} type="color" value={theme[key]} onChange={(e) => update(key, e.target.value)} className="h-10 w-12 cursor-pointer rounded-lg border-0 bg-transparent p-0"/><input value={theme[key]} onChange={(e) => update(key, e.target.value)} className="min-w-0 flex-1 rounded-lg border border-stone-200 px-3 py-2 font-mono text-sm uppercase outline-none focus:border-[var(--site-primary)]" /></span></label>)}</div></section>
      <aside className="space-y-5"><section className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm"><h2 className="font-black text-stone-950">Quick palettes</h2><div className="mt-4 space-y-3">{Object.entries(presets).map(([name, palette]) => <button key={name} onClick={() => { setTheme(palette); applyTheme(palette) }} className="flex w-full items-center gap-3 rounded-2xl border border-stone-200 p-3 text-left hover:border-stone-400"><span className="flex gap-1">{['primary','accent','page'].map((key) => <i key={key} className="h-5 w-5 rounded-full border border-black/10" style={{ background: palette[key] }} />)}</span><span className="text-sm font-bold text-stone-800">{name}</span></button>)}</div></section><section className="overflow-hidden rounded-[2rem] border border-stone-200 bg-[var(--site-page)] p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-wider text-[var(--site-muted)]">Preview</p><h3 className="mt-3 text-xl font-black text-[var(--site-text)]">Freshly designed</h3><p className="mt-2 text-sm text-[var(--site-muted)]">Your customer experience updates when you save.</p><button className="mt-5 w-full rounded-xl bg-[var(--site-primary)] px-4 py-3 font-bold text-[var(--site-buttonText)]">Shop now</button><div className="mt-3 rounded-xl bg-[var(--site-ad)] p-3 text-sm font-bold text-[var(--site-primary)]"><Check className="mr-1 inline h-4 w-4" /> Promo & ad colour</div></section></aside></div>
  </div>
}
