import React from 'react'
import { CreditCard, ArrowUpRight, ShieldCheck } from 'lucide-react'
import { useSiteContent } from '../../contexts/SiteContentContext'
import { Link } from 'react-router-dom'

type BnplProvider = {
  code: string
  label: string
  enabled: boolean
  description?: string
  learnMoreUrl?: string
}

const PROVIDER_ACCENT: Record<string, { bg: string; ring: string; text: string }> = {
  KLARNA: { bg: 'bg-pink-50', ring: 'ring-pink-200', text: 'text-pink-700' },
  AFTERPAY: { bg: 'bg-emerald-50', ring: 'ring-emerald-200', text: 'text-emerald-700' },
  LIPA_POLE_POLE: { bg: 'bg-amber-50', ring: 'ring-amber-200', text: 'text-amber-700' },
}

const BnplOptions: React.FC = () => {
  const { profile } = useSiteContent()
  const bnplList: BnplProvider[] = profile.payments?.bnpl || []
  const enabled = bnplList.filter(b => b.enabled)

  if (!enabled.length) {
    const fallback: BnplProvider[] = (profile.payments?.bnpl || []).slice(0, 2).length
      ? profile.payments!.bnpl
      : [
          {
            code: 'LIPA_POLE_POLE',
            label: 'Lipa Pole Pole',
            enabled: true,
            description: 'Split your order into 3 easy installments with no extra fees.',
            learnMoreUrl: '#',
          },
        ]
    return renderGrid(fallback)
  }

  return renderGrid(enabled)
}

const renderGrid = (items: BnplProvider[]) => {
  if (!items.length) return null

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-3">
        <CreditCard className="w-4 h-4 text-gray-600" />
        <h3 className="text-sm font-semibold text-gray-800">Buy Now, Pay Later</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((provider) => {
          const accent = PROVIDER_ACCENT[provider.code] || {
            bg: 'bg-indigo-50',
            ring: 'ring-indigo-200',
            text: 'text-indigo-700',
          }
          const initials = provider.label
            .split(/\s+/)
            .filter(Boolean)
            .map(w => w[0])
            .slice(0, 2)
            .join('')
            .toUpperCase()

          const href = provider.learnMoreUrl || '#'
          const isExternal = /^https?:\/\//i.test(href)

          return (
            <div
              key={provider.code}
              className={`group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 ring-1 ring-transparent hover:${accent.ring}`}
            >
              <div className="flex items-start gap-3">
                <div className={`shrink-0 w-11 h-11 rounded-lg ${accent.bg} flex items-center justify-center ${accent.text} font-bold`}>
                  {initials || <ShieldCheck className="w-5 h-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-semibold text-gray-900 truncate">{provider.label}</h4>
                    {isExternal ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`shrink-0 inline-flex items-center gap-1 text-xs font-semibold ${accent.text} hover:underline`}
                      >
                        Learn more
                        <ArrowUpRight className="w-3 h-3" />
                      </a>
                    ) : (
                      <Link
                        to={href}
                        className={`shrink-0 inline-flex items-center gap-1 text-xs font-semibold ${accent.text} hover:underline`}
                      >
                        Learn more
                        <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-600 leading-relaxed">
                    {provider.description ||
                      'Flexible installments available at checkout with no hidden fees.'}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default BnplOptions
