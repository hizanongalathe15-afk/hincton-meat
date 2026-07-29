import { useEffect, useState } from 'react'
import { Bell, MapPin, ShieldCheck, X } from 'lucide-react'

const preferenceKey = 'hincton:device-permissions-v1'
type Choice = { location: boolean; notifications: boolean }

export default function PermissionCenter() {
  const [open, setOpen] = useState(false)
  const [choice, setChoice] = useState<Choice>({ location: false, notifications: false })
  useEffect(() => { if (!localStorage.getItem(preferenceKey)) { const timer = window.setTimeout(() => setOpen(true), 1800); return () => window.clearTimeout(timer) } }, [])
  const save = async () => {
    const outcome = { ...choice, savedAt: new Date().toISOString() }
    localStorage.setItem(preferenceKey, JSON.stringify(outcome))
    if (choice.location && navigator.geolocation) navigator.geolocation.getCurrentPosition(() => undefined, () => undefined, { maximumAge: 300000, timeout: 10000 })
    if (choice.notifications && 'Notification' in window && Notification.permission === 'default') await Notification.requestPermission()
    setOpen(false)
  }
  if (!open) return null
  return <div className="fixed inset-0 z-[80] flex items-end justify-center bg-stone-950/35 p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="permissions-title"><section className="w-full max-w-md rounded-3xl border border-white/60 bg-white p-6 shadow-2xl"><button onClick={() => { localStorage.setItem(preferenceKey, JSON.stringify({ location: false, notifications: false, savedAt: new Date().toISOString() })); setOpen(false) }} className="float-right rounded-full p-2 text-stone-500 hover:bg-stone-100" aria-label="Close permission settings"><X className="h-5 w-5" /></button><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-700"><ShieldCheck className="h-6 w-6" /></span><h2 id="permissions-title" className="mt-4 text-2xl font-black text-stone-950">Make your visit work better</h2><p className="mt-2 text-sm leading-6 text-stone-600">Choose what this device can share. We ask once, and you can change this later in your browser settings.</p><label className="mt-5 flex cursor-pointer gap-3 rounded-2xl border border-stone-200 p-4"><input checked={choice.location} onChange={(e) => setChoice({ ...choice, location: e.target.checked })} type="checkbox" className="mt-1 h-4 w-4 accent-red-600" /><MapPin className="mt-0.5 h-5 w-5 shrink-0 text-red-600" /><span><b className="block text-sm text-stone-900">Approximate location</b><span className="text-xs text-stone-600">Help find the nearest branch and improve delivery estimates.</span></span></label><label className="mt-3 flex cursor-pointer gap-3 rounded-2xl border border-stone-200 p-4"><input checked={choice.notifications} onChange={(e) => setChoice({ ...choice, notifications: e.target.checked })} type="checkbox" className="mt-1 h-4 w-4 accent-red-600" /><Bell className="mt-0.5 h-5 w-5 shrink-0 text-red-600" /><span><b className="block text-sm text-stone-900">Order updates</b><span className="text-xs text-stone-600">Receive browser notifications when you choose them.</span></span></label><div className="mt-6 flex justify-end gap-3"><button onClick={() => { localStorage.setItem(preferenceKey, JSON.stringify({ location: false, notifications: false, savedAt: new Date().toISOString() })); setOpen(false) }} className="rounded-full px-4 py-2 text-sm font-bold text-stone-600">Not now</button><button onClick={save} className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-red-600/25 hover:bg-red-700">Save choices</button></div></section></div>
}
