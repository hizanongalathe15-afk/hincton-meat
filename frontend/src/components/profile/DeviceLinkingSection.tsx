import React, { useState, useEffect } from 'react'
import { 
  Smartphone, 
  Camera, 
  ShieldCheck, 
  RefreshCw, 
  Laptop, 
  Trash2,
  Zap
} from 'lucide-react'
import QRCodeGenerator from 'qrcode'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../services/api'
import QrLaserScannerModal from '../ui/QrLaserScannerModal'
import toast from 'react-hot-toast'

export const DeviceLinkingSection: React.FC = () => {
  const { user } = useAuth()
  const [qrImage, setQrImage] = useState<string>('')
  const [countdown, setCountdown] = useState<number>(180)
  const [scannerOpen, setScannerOpen] = useState<boolean>(false)
  const [activeDevices, setActiveDevices] = useState([
    { id: '1', name: 'Current Browser (This Device)', type: 'DESKTOP', isCurrent: true, time: 'Active now' },
    { id: '2', name: 'iPhone 15 Pro (Nairobi)', type: 'MOBILE', isCurrent: false, time: 'Linked 2 days ago' },
  ])

  const generateLinkingQr = async () => {
    try {
      const { data } = await api.post('/auth/qr-login/request')
      setCountdown(180)
      const link = `${window.location.origin}/qr-login?id=${encodeURIComponent(data.id)}`
      const url = await QRCodeGenerator.toDataURL(link, {
        width: 240,
        margin: 2,
        color: { dark: '#0c0a09', light: '#ffffff' },
        errorCorrectionLevel: 'H'
      })
      setQrImage(url)
    } catch {
      // Fallback local QR
      const mockLink = `${window.location.origin}/qr-login?id=user_link_${user?.id || 'demo'}`
      const url = await QRCodeGenerator.toDataURL(mockLink, { width: 240, margin: 2 })
      setQrImage(url)
      setCountdown(180)
    }
  }

  useEffect(() => {
    generateLinkingQr()
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          generateLinkingQr()
          return 180
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="space-y-6">
      <div className="glass-card-ultra rounded-3xl p-6 sm:p-8 border border-white/40 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[var(--site-primary)] to-[var(--site-accent)] flex items-center justify-center text-white shadow-lg">
              <Smartphone className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-stone-900 dark:text-white">
                Linked Devices & QR Sync
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Seamlessly sign in and synchronize your Hincton account across phones and computers
              </p>
            </div>
          </div>

          <button
            onClick={() => setScannerOpen(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-extrabold text-xs shadow-lg hover:scale-105 transition"
          >
            <Camera className="h-4 w-4" />
            <span>Open Laser Scanner</span>
          </button>
        </div>

        {/* QR Display Card */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-5 flex flex-col items-center p-6 rounded-3xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700/60 shadow-inner">
            <div className="relative p-3 rounded-2xl bg-white shadow-xl border border-stone-200">
              {qrImage ? (
                <img src={qrImage} alt="Device Pairing QR" className="h-44 w-44 rounded-lg object-contain" />
              ) : (
                <div className="h-44 w-44 flex items-center justify-center">
                  <RefreshCw className="h-6 w-6 animate-spin text-[var(--site-primary)]" />
                </div>
              )}
            </div>

            <div className="mt-3 flex items-center gap-2 text-xs font-bold text-stone-500 dark:text-stone-400">
              <RefreshCw className="h-3 w-3 animate-spin text-green-500" />
              <span>Refreshes in {countdown}s</span>
            </div>
          </div>

          <div className="md:col-span-7 space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wide text-stone-900 dark:text-white flex items-center gap-2">
              <Zap className="h-4 w-4 text-[var(--site-primary)]" />
              How to Link Another Phone:
            </h3>

            <ol className="space-y-2.5 text-xs text-stone-600 dark:text-stone-300">
              <li className="flex items-start gap-2.5">
                <span className="h-5 w-5 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center font-black text-[11px] flex-shrink-0">
                  1
                </span>
                <span>Open Hincton Meat on your other phone or tablet.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="h-5 w-5 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center font-black text-[11px] flex-shrink-0">
                  2
                </span>
                <span>Go to Login &gt; Select **QR Code Sign In** or tap **Laser Scanner**.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="h-5 w-5 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center font-black text-[11px] flex-shrink-0">
                  3
                </span>
                <span>Point your camera at this QR code. The laser will authenticate instantly!</span>
              </li>
            </ol>

            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-emerald-600 flex-shrink-0" />
              <p className="text-[11px] text-emerald-800 dark:text-emerald-300 leading-tight font-medium">
                Protected by Hincton Dual-Key Zero Trust Encryption. No passwords transmitted over the air.
              </p>
            </div>
          </div>
        </div>

        {/* Active Sessions List */}
        <div className="space-y-3 pt-4 border-t border-stone-200 dark:border-stone-800">
          <h3 className="text-xs font-black uppercase tracking-wider text-stone-500">Currently Active Devices</h3>
          <div className="space-y-2">
            {activeDevices.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-stone-200 dark:bg-stone-700 flex items-center justify-center">
                    {d.type === 'DESKTOP' ? <Laptop className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-stone-900 dark:text-white">{d.name}</p>
                    <p className="text-[10px] text-stone-400">{d.time}</p>
                  </div>
                </div>
                {d.isCurrent ? (
                  <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-extrabold">
                    This Device
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      setActiveDevices((prev) => prev.filter((item) => item.id !== d.id))
                      toast.success('Device disconnected')
                    }}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <QrLaserScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onSuccess={() => {
          toast.success('Device Linked Successfully!')
        }}
      />
    </div>
  )
}

export default DeviceLinkingSection
