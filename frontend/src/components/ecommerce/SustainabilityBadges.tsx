import React from 'react'
import { Leaf, Snowflake, CircleDot, Recycle, Award, Shield, CheckCircle2, Heart } from 'lucide-react'
import { useSiteContent } from '../../contexts/SiteContentContext'

const SUSTAINABILITY_ICON: Record<string, React.FC<{ className?: string }>> = {
  leaf: Leaf,
  'ethical_sourcing': Leaf,
  ETHICAL_SOURCING: Leaf,
  snowflake: Snowflake,
  'cold_chain_efficiency': Snowflake,
  COLD_CHAIN_EFFICIENCY: Snowflake,
  'circle-dot': CircleDot,
  'circle_dot': CircleDot,
  CARBON_OFFSET: CircleDot,
  recycle: Recycle,
  ZERO_WASTE: Recycle,
  award: Award,
  shield: Shield,
  check: CheckCircle2,
  heart: Heart,
}

const pickIcon = (key?: string, fallback: React.FC<{ className?: string }> = Leaf) => {
  if (!key) return fallback
  const normalized = key.toLowerCase().replace(/_/g, '-')
  return (
    SUSTAINABILITY_ICON[key] ||
    SUSTAINABILITY_ICON[normalized] ||
    SUSTAINABILITY_ICON[key.toUpperCase()] ||
    fallback
  )
}

type SustainabilityBadgeItem = {
  code: string
  label: string
  icon?: string
  description?: string
}

type TrustBadgeItem = {
  code: string
  label: string
  description?: string
}

const TRUST_BADGE_STYLES: Record<string, { pill: string; icon: string }> = {
  SSL: { pill: 'bg-sky-50 text-sky-800 border-sky-200', icon: 'text-sky-600' },
  'MONEY_BACK': { pill: 'bg-emerald-50 text-emerald-800 border-emerald-200', icon: 'text-emerald-600' },
  HACCP: { pill: 'bg-amber-50 text-amber-800 border-amber-200', icon: 'text-amber-600' },
  COLD_CHAIN: { pill: 'bg-cyan-50 text-cyan-800 border-cyan-200', icon: 'text-cyan-600' },
}

const SUSTAIN_BADGE_STYLES: Record<string, { pill: string; icon: string }> = {
  ETHICAL_SOURCING: { pill: 'bg-lime-50 text-lime-800 border-lime-200', icon: 'text-lime-600' },
  COLD_CHAIN_EFFICIENCY: { pill: 'bg-sky-50 text-sky-800 border-sky-200', icon: 'text-sky-600' },
  CARBON_OFFSET: { pill: 'bg-emerald-50 text-emerald-800 border-emerald-200', icon: 'text-emerald-600' },
  ZERO_WASTE: { pill: 'bg-teal-50 text-teal-800 border-teal-200', icon: 'text-teal-600' },
}

const SustainabilityBadges: React.FC = () => {
  const { profile } = useSiteContent()
  const sustainabilityItems: SustainabilityBadgeItem[] = profile.trust?.sustainability || []
  const trustBadges: TrustBadgeItem[] = profile.trust?.badges || []

  const hasSustainability = sustainabilityItems.length > 0
  const hasTrust = trustBadges.length > 0

  if (!hasSustainability && !hasTrust) return null

  return (
    <div className="w-full space-y-4">
      {hasSustainability && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Leaf className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-semibold text-gray-800">Sustainability</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {sustainabilityItems.map((item) => {
              const Icon = pickIcon(item.icon, Leaf)
              const style =
                SUSTAIN_BADGE_STYLES[item.code] ||
                { pill: 'bg-emerald-50 text-emerald-800 border-emerald-200', icon: 'text-emerald-600' }
              return (
                <span
                  key={item.code}
                  title={item.description || item.label}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium shadow-sm ${style.pill}`}
                >
                  <Icon className={`w-3.5 h-3.5 ${style.icon}`} />
                  {item.label}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {hasTrust && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-sky-600" />
            <h3 className="text-sm font-semibold text-gray-800">Trust & Quality</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {trustBadges.map((item) => {
              const style =
                TRUST_BADGE_STYLES[item.code] ||
                { pill: 'bg-slate-50 text-slate-800 border-slate-200', icon: 'text-slate-600' }
              const TrustIcon =
                item.code === 'SSL'
                  ? Shield
                  : item.code === 'MONEY_BACK'
                    ? Heart
                    : item.code === 'HACCP'
                      ? Award
                      : item.code === 'COLD_CHAIN'
                        ? Snowflake
                        : CheckCircle2
              return (
                <span
                  key={item.code}
                  title={item.description || item.label}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium shadow-sm ${style.pill}`}
                >
                  <TrustIcon className={`w-3.5 h-3.5 ${style.icon}`} />
                  {item.label}
                </span>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default SustainabilityBadges
