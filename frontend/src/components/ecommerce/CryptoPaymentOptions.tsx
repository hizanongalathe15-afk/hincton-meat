import React, { useMemo, useState } from 'react'
import { Copy, Check, Wallet, ExternalLink, QrCode } from 'lucide-react'
import toast from 'react-hot-toast'
import { useSiteContent } from '../../contexts/SiteContentContext'

type CryptoProvider = {
  code: string
  label: string
  enabled: boolean
  walletAddress?: string
}

const CRYPTO_ACCENT: Record<string, { bg: string; text: string; ring: string }> = {
  BTC: { bg: 'bg-orange-50', text: 'text-orange-700', ring: 'ring-orange-200' },
  ETH: { bg: 'bg-indigo-50', text: 'text-indigo-700', ring: 'ring-indigo-200' },
  USDC: { bg: 'bg-sky-50', text: 'text-sky-700', ring: 'ring-sky-200' },
  USDT: { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200' },
  BNB: { bg: 'bg-yellow-50', text: 'text-yellow-700', ring: 'ring-yellow-200' },
  SOL: { bg: 'bg-fuchsia-50', text: 'text-fuchsia-700', ring: 'ring-fuchsia-200' },
}

const buildQrMatrix = (payload: string, size = 21): boolean[] => {
  const normalized = (payload || '').trim()
  const hash = Array.from({ length: size * size }, (_, i) => {
    const char = normalized.charCodeAt(i % Math.max(1, normalized.length)) || 0
    const value = (char + i * 31 + i * i) % 7
    return value < 3
  })
  for (let corner of [
    [0, 0], [0, size - 7], [size - 7, 0],
  ] as const) {
    for (let dy = 0; dy < 7; dy++) {
      for (let dx = 0; dx < 7; dx++) {
        const row = corner[0] + dy
        const col = corner[1] + dx
        if (row < 0 || row >= size || col < 0 || col >= size) continue
        const border = dx === 0 || dy === 0 || dx === 6 || dy === 6
        const center = dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4
        hash[row * size + col] = border || center
      }
    }
  }
  return hash
}

const CryptoPaymentOptions: React.FC = () => {
  const { profile } = useSiteContent()
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const providers: CryptoProvider[] = useMemo(() => {
    const list = profile.payments?.crypto || []
    if (list.some(p => p.enabled)) return list.filter(p => p.enabled)
    return list
  }, [profile.payments?.crypto])

  const handleCopy = async (code: string, walletAddress: string) => {
    if (!walletAddress) {
      toast.error(`${code} wallet address is not configured yet.`)
      return
    }
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(walletAddress)
      } else {
        const ta = document.createElement('textarea')
        ta.value = walletAddress
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.focus()
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      setCopiedCode(code)
      toast.success(`${code} wallet address copied`)
      setTimeout(() => setCopiedCode(current => (current === code ? null : current)), 2500)
    } catch {
      toast.error('Unable to copy wallet address')
    }
  }

  if (!providers.length) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-500">
        Crypto payment options will appear here once they are enabled.
      </div>
    )
  }

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-800">Pay with Crypto</h3>
        </div>
        <span className="text-xs text-gray-500">Send exactly to the address shown</span>
      </div>

      <div className="space-y-4">
        {providers.map((provider) => {
          const accent = CRYPTO_ACCENT[provider.code] || {
            bg: 'bg-gray-50',
            text: 'text-gray-700',
            ring: 'ring-gray-200',
          }
          const qrPayload = provider.walletAddress
            ? `${provider.code.toLowerCase()}:${provider.walletAddress}`
            : `hincton:${provider.code}:pending`
          const qr = buildQrMatrix(qrPayload, 21)
          const qrSize = 21
          const copied = copiedCode === provider.code
          const hasAddress = !!(provider.walletAddress || '').trim()

          return (
            <div
              key={provider.code}
              className={`rounded-2xl border border-gray-200 bg-white p-4 ring-1 ring-transparent hover:${accent.ring} transition-all`}
            >
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="shrink-0 self-start sm:self-auto">
                  <div className={`rounded-xl p-3 ${accent.bg} ${accent.text} inline-flex items-center gap-2 shadow-sm ring-1 ${accent.ring}`}>
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-sm font-black">
                      {provider.code.slice(0, 3)}
                    </div>
                    <span className="font-bold">{provider.label}</span>
                  </div>
                </div>

                <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-[auto_1fr] gap-4">
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className="grid gap-[1.5px] bg-gray-200 p-2 rounded-lg ring-1 ring-gray-200"
                      style={{ gridTemplateColumns: `repeat(${qrSize}, minmax(0, 1fr))` }}
                    >
                      {qr.map((filled, idx) => (
                        <div
                          key={idx}
                          className={`aspect-square ${filled ? 'bg-gray-900' : 'bg-white'}`}
                        />
                      ))}
                    </div>
                    <div className="inline-flex items-center gap-1 text-[11px] text-gray-500">
                      <QrCode className="w-3 h-3" />
                      Scan address QR
                    </div>
                  </div>

                  <div className="min-w-0 space-y-2">
                    <div>
                      <div className="text-[11px] uppercase tracking-wider text-gray-500 mb-1 font-semibold">
                        Wallet Address
                      </div>
                      <div className={`rounded-lg border px-3 py-2.5 text-sm font-mono break-all ${
                        hasAddress ? 'border-gray-200 bg-gray-50 text-gray-800' : 'border-amber-200 bg-amber-50 text-amber-800'
                      }`}>
                        {hasAddress ? provider.walletAddress : `Configure your ${provider.label} wallet address in settings.`}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopy(provider.code, provider.walletAddress || '')}
                        disabled={!hasAddress || copied}
                        className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
                          copied
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-gray-900 hover:bg-gray-800 text-white disabled:opacity-50 disabled:cursor-not-allowed'
                        }`}
                      >
                        {copied ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            Copy Address
                          </>
                        )}
                      </button>
                      <a
                        href={`https://www.blockchain.com/explorer?q=${encodeURIComponent(provider.walletAddress || provider.code)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-800"
                      >
                        Verify on explorer
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    {!hasAddress && (
                      <div className="text-[11px] text-amber-700">
                        This coin is enabled, but the wallet address is missing from settings.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default CryptoPaymentOptions
