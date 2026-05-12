import { useState } from 'react'
import { 
  Package, 
  Check, 
  Star, 
  Clock, 
  Truck,
  ChefHat,
  Heart,
  TrendingUp
} from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'

interface SubscriptionPlan {
  id: string
  name: string
  description: string
  price: number
  originalPrice?: number
  deliveryFrequency: string
  features: string[]
  popular?: boolean
  badge?: string
  icon: any
}

interface SubscriptionBoxProps {
  onSubscribe?: (planId: string) => void
  currentPlan?: string
}

const SubscriptionBox = ({ onSubscribe, currentPlan }: SubscriptionBoxProps) => {
  const [selectedPlan, setSelectedPlan] = useState(currentPlan || '')
  const { t } = useLanguage()

  const plans: SubscriptionPlan[] = [
    {
      id: 'weekly-basic',
      name: t('subscription.weeklyBasic'),
      description: t('subscription.perfectForSmallFamilies'),
      price: 2999,
      originalPrice: 3499,
      deliveryFrequency: t('subscription.everyWeek'),
      features: [
        t('subscription.weeklyBasicFeature1'),
        t('subscription.mixedVarietyPack'),
        t('subscription.freeDelivery'),
        t('subscription.recipeCardsIncluded'),
        t('subscription.prioritySupport')
      ],
      popular: true,
      badge: t('subscription.mostPopular'),
      icon: Package
    },
    {
      id: 'biweekly-premium',
      name: t('subscription.fortnightlyPremium'),
      description: t('subscription.idealForMeatLovers'),
      price: 5499,
      originalPrice: 6499,
      deliveryFrequency: t('subscription.every2Weeks'),
      features: [
        t('subscription.fortnightlyPremiumFeature1'),
        t('subscription.customizableSelection'),
        t('subscription.freeDelivery'),
        t('subscription.cookingGuide'),
        t('subscription.prioritySupport'),
        t('affiliate.exclusiveRecipes')
      ],
      icon: ChefHat
    },
    {
      id: 'monthly-family',
      name: t('subscription.monthlyFamily'),
      description: t('subscription.greatForLargeFamilies'),
      price: 8999,
      originalPrice: 10999,
      deliveryFrequency: t('subscription.everyMonth'),
      features: [
        t('subscription.monthlyFamilyFeature1'),
        t('subscription.fullyCustomizable'),
        t('subscription.freeDelivery'),
        t('subscription.familyRecipes'),
        t('subscription.videoTutorials'),
        t('subscription.prioritySupport'),
        t('subscription.giftBoxIncluded')
      ],
      icon: Heart
    },
    {
      id: 'weekly-gourmet',
      name: t('subscription.weeklyGourmet'),
      description: t('subscription.forDiscerningPalate'),
      price: 4999,
      deliveryFrequency: t('subscription.everyWeek'),
      features: [
        t('subscription.weeklyGourmetFeature1'),
        t('subscription.premiumCutsOnly'),
        t('subscription.freeDelivery'),
        t('subscription.chefRecipes'),
        t('subscription.prioritySupport'),
        t('subscription.tastingNotes'),
        t('subscription.winePairingGuide')
      ],
      badge: t('subscription.premium'),
      icon: Star
    }
  ]

  const handleSubscribe = (planId: string) => {
    setSelectedPlan(planId)
    onSubscribe?.(planId)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {t('subscription.premiumMeatSubscription')}
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            {t('subscription.subscriptionDescription')}
          </p>
          <div className="flex items-center justify-center gap-8 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-red-600" />
              <span>{t('subscription.freeDelivery')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-red-600" />
              <span>{t('subscription.flexibleScheduling')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-600" />
              <span>{t('subscription.cancelAnytime')}</span>
            </div>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan) => {
            const Icon = plan.icon
            const isSelected = selectedPlan === plan.id
            const isCurrent = currentPlan === plan.id

            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                  isSelected ? 'ring-2 ring-red-500' : ''
                }`}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className="absolute top-4 right-4 z-10">
                    <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                      {plan.badge}
                    </span>
                  </div>
                )}

                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-red-600 to-red-500 text-white text-center py-2 text-sm font-semibold">
                    {t('subscription.mostPopular')}
                  </div>
                )}

                {/* Content */}
                <div className={`p-8 ${plan.popular ? 'pt-12' : ''}`}>
                  {/* Icon */}
                  <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-6">
                    <Icon className="w-8 h-8 text-red-600" />
                  </div>

                  {/* Plan Info */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-600 mb-6">{plan.description}</p>

                  {/* Delivery Frequency */}
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
                    <Clock className="w-4 h-4" />
                    <span>{plan.deliveryFrequency}</span>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-gray-900">
                        KSh{plan.price.toLocaleString()}
                      </span>
                      {plan.originalPrice && (
                        <span className="text-lg text-gray-400 line-through">
                          KSh{plan.originalPrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">{t('subscription.perDelivery')}</div>
                  </div>

                  {/* Features */}
                  <div className="space-y-3 mb-8">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${
                      isSelected
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : isCurrent
                        ? 'bg-gray-200 text-gray-700'
                        : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                  >
                    {isCurrent ? t('subscription.currentPlan') : isSelected ? t('subscription.selected') : t('subscription.subscribeNow')}
                  </button>

                  {/* Current Plan Indicator */}
                  {isCurrent && (
                    <div className="text-center mt-4 text-sm text-gray-600">
                      <TrendingUp className="w-4 h-4 inline mr-1" />
                      <span>{t('subscription.nextDelivery')} {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Benefits Section */}
        <div className="mt-16 bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            {t('subscription.whyChooseSubscription')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{t('subscription.freshQuality')}</h3>
              <p className="text-gray-600 text-sm">
                {t('subscription.freshQualityDescription')}
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{t('subscription.bestValue')}</h3>
              <p className="text-gray-600 text-sm">
                {t('subscription.bestValueDescription')}
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{t('subscription.convenience')}</h3>
              <p className="text-gray-600 text-sm">
                {t('subscription.convenienceDescription')}
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            {t('subscription.faqTitle')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">{t('subscription.faqCustomizeQuestion')}</h3>
              <p className="text-gray-600 text-sm">
                {t('subscription.faqCustomizeAnswer')}
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">{t('subscription.faqSkipQuestion')}</h3>
              <p className="text-gray-600 text-sm">
                {t('subscription.faqSkipAnswer')}
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">{t('subscription.faqCancelQuestion')}</h3>
              <p className="text-gray-600 text-sm">
                {t('subscription.faqCancelAnswer')}
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">{t('subscription.faqFreshQuestion')}</h3>
              <p className="text-gray-600 text-sm">
                {t('subscription.faqFreshAnswer')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SubscriptionBox
