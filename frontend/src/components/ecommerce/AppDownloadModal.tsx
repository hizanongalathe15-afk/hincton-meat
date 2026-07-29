import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { Check, Download, QrCode, Smartphone, X } from 'lucide-react'

type Props = { open: boolean; onClose: () => void }

const AppDownloadModal = ({ open, onClose }: Props) => {
  const [qrImage, setQrImage] = useState('')
  useEffect(() => { if (open) QRCode.toDataURL(`${window.location.origin}/?source=app-qr`, { width: 260, margin: 2, errorCorrectionLevel: 'M' }).then(setQrImage).catch(() => setQrImage('')) }, [open])
  if (!open) return null
  return <aside className="fixed bottom-4 right-4 z-[70] w-[calc(100vw-2rem)] max-w-md overflow-hidden rounded-[1.65rem] border border-[var(--site-border)] bg-[var(--site-surface)] text-[var(--site-text)] shadow-2xl sm:bottom-6 sm:right-6" role="dialog" aria-modal="false" aria-labelledby="app-download-title">
    <div className="absolute inset-x-0 top-0 h-1.5 bg-[var(--site-primary)]" />
    <button type="button" onClick={onClose} className="absolute right-4 top-4 rounded-full p-2 text-[var(--site-muted)] transition hover:bg-[var(--site-page)] hover:text-[var(--site-text)]" aria-label="Close app download panel"><X className="h-5 w-5" /></button>
    <div className="p-5 sm:p-6"><div className="pr-10"><h2 id="app-download-title" className="text-xl font-black">Download App</h2><p className="mt-1 text-sm text-[var(--site-muted)]">Fast shopping from your home screen.</p></div>
      <div className="mt-4 space-y-2 text-sm text-[var(--site-muted)]"><p className="flex items-center gap-2"><i className="grid h-6 w-6 place-items-center rounded-lg bg-[var(--site-ad)] text-[var(--site-primary)]"><Check className="h-3.5 w-3.5" /></i> Browse fresh meat and offers anytime</p><p className="flex items-center gap-2"><i className="grid h-6 w-6 place-items-center rounded-lg bg-[var(--site-ad)] text-[var(--site-primary)]"><Smartphone className="h-3.5 w-3.5" /></i> Install directly from your browser</p></div>
      <div className="mt-5 grid grid-cols-[1fr_auto] items-end gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-[var(--site-muted)]">Scan to download</p><button type="button" onClick={() => window.location.assign(`${window.location.origin}/?source=app-download`)} className="mt-3 flex w-full items-center gap-2 rounded-xl bg-[var(--site-primary)] px-3 py-3 text-left text-[var(--site-buttonText)] shadow-lg transition hover:opacity-90"><Download className="h-4 w-4" /><span><b className="block text-sm">Open Hincton app</b><small className="text-xs opacity-80">Phone & tablet</small></span></button><p className="mt-2 text-[11px] leading-4 text-[var(--site-muted)]">iPhone: Share → Add to Home Screen. Android: Install app in browser menu.</p></div><div className="w-fit rounded-xl border border-[var(--site-border)] bg-white p-2"><span className="mb-1 flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-[var(--site-primary)]"><QrCode className="h-3 w-3" /> Scan</span>{qrImage ? <img src={qrImage} alt="QR code to open the Hincton Meat app" className="h-28 w-28 sm:h-32 sm:w-32" /> : <div className="h-28 w-28 animate-pulse rounded-lg bg-stone-100 sm:h-32 sm:w-32" />}</div></div>
    </div>
  </aside>
}

export default AppDownloadModal
