import { useState } from 'react'
import { 
  Tag, 
  Clock, 
  Gift, 
  Percent,
  Calendar,

  Copy,
  Check
} from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'

interface Promotion {
  id: string
  title: string
  description: string
  code: string
  discountType: 'percentage' | 'fixed' | 'free_delivery'
  discountValue: number
  minimumOrder?: number
  maxDiscount?: number
  validFrom: string
  validUntil: string
  usageLimit?: number
  usageCount: number
  applicableProducts?: string[]
  applicableCategories?: string[]
  isNew?: boolean
  isPopular?: boolean
  terms?: string[]
}

interface PromotionCardProps {
  promotion: Promotion
  onApply?: (code: string) => void
  showApplyButton?: boolean
}

const PromotionCard = ({ promotion, onApply, showApplyButton = true }: PromotionCardProps) => {
  const [copied, setCopied] = useState(false)
  const { t } = useLanguage()

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(promotion.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy code:', error)
    }
  }

  const handleApply = () => {
    onApply?.(promotion.code)
  }

  const isExpired = new Date(promotion.validUntil) < new Date()
  const isUpcoming = new Date(promotion.validFrom) > new Date()
  const isActive = !isExpired && !isUpcoming

  const formatDiscount = () => {
    switch (promotion.discountType) {
      case 'percentage':
        return `${promotion.discountValue}% OFF`
      case 'fixed':
        return `KSh${promotion.discountValue} OFF`
      case 'free_delivery':
        return t('promotion.freeDelivery')
      default:
        return t('promotion.specialOffer')
    }
  }

  const getDaysLeft = () => {
    const now = new Date()
    const endDate = new Date(promotion.validUntil)
    const diffTime = endDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  }

  const getUsageProgress = () => {
    if (!promotion.usageLimit) return null
    return (promotion.usageCount / promotion.usageLimit) * 100
  }

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg ${
      !isActive ? 'opacity-60' : ''
    }`}>
      {/* Header */}
      <div className="relative">
        {/* Status Badges */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
          {promotion.isNew && (
            <span className="bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-full">
              NEW
            </span>
          )}
          {promotion.isPopular && (
            <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
              POPULAR
            </span>
          )}
          {isExpired && (
            <span className="bg-gray-600 text-white text-xs font-bold px-2 py-1 rounded-full">
              EXPIRED
            </span>
          )}
          {isUpcoming && (
            <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
              COMING SOON
            </span>
          )}
        </div>

        {/* Discount Display */}
        <div className="bg-gradient-to-r from-red-600 to-red-500 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Tag className="w-5 h-5" />
                <span className="text-sm font-medium">PROMO CODE</span>
              </div>
              <h3 className="text-2xl font-bold mb-1">{promotion.title}</h3>
              <p className="text-red-100 text-sm">{promotion.description}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold mb-1">{formatDiscount()}</div>
              {promotion.minimumOrder && (
                <div className="text-xs text-red-100">
                  Min. KSh{promotion.minimumOrder.toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Code Section */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 mb-1">Promo Code</div>
              <div className="text-2xl font-bold text-gray-900 tracking-wider">
                {promotion.code}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCopyCode}
                className="p-2 bg-white rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                title={t('promotion.copyCode')}
              >
                {copied ? (
                  <Check className="w-5 h-5 text-green-600" />
                ) : (
                  <Copy className="w-5 h-5 text-gray-600" />
                )}
              </button>
              {showApplyButton && isActive && (
                <button
                  onClick={handleApply}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Apply
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Validity */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>
                {new Date(promotion.validFrom).toLocaleDateString()} - {new Date(promotion.validUntil).toLocaleDateString()}
              </span>
            </div>
            {isActive && (
              <div className="flex items-center gap-1 text-red-600 font-medium">
                <Clock className="w-4 h-4" />
                <span>{getDaysLeft()} days left</span>
              </div>
            )}
          </div>
        </div>

        {/* Usage Progress */}
        {promotion.usageLimit && (
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600">Usage</span>
              <span className="text-gray-900 font-medium">
                {promotion.usageCount} / {promotion.usageLimit} used
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-red-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getUsageProgress()}%` }}
              />
            </div>
          </div>
        )}

        {/* Terms */}
        {promotion.terms && promotion.terms.length > 0 && (
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-3">Terms & Conditions</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              {promotion.terms.map((term, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-red-600 mt-1">•</span>
                  <span>{term}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Additional Info */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          {promotion.applicableCategories && (
            <div className="flex items-center gap-1">
              <Gift className="w-3 h-3" />
              <span>Applies to: {promotion.applicableCategories.join(', ')}</span>
            </div>
          )}
          {promotion.maxDiscount && (
            <div className="flex items-center gap-1">
              <Percent className="w-3 h-3" />
              <span>Max discount: KSh{promotion.maxDiscount.toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PromotionCard
