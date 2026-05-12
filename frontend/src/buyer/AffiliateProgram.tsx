import { useState } from 'react'
import { 
  Users, 
  TrendingUp, 
  Gift, 
  Share2,
  Copy,
  Check,
  DollarSign,
  Target,
  Award,
  BarChart3,
  QrCode,
  Mail,
  MessageSquare
} from 'lucide-react'
import { HINCTON_BRAND } from '../utils/hinctonBrand'
import { useLanguage } from '../contexts/LanguageContext'

interface AffiliateProgramProps {
  onJoin?: (data: any) => void
  currentAffiliate?: any
}

const AffiliateProgram = ({ onJoin, currentAffiliate }: AffiliateProgramProps) => {
  const [copied, setCopied] = useState(false)
  const [showJoinForm, setShowJoinForm] = useState(false)
  const { t } = useLanguage()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    businessName: '',
    businessType: '',
    website: '',
    socialMedia: '',
    whyJoin: ''
  })

  const affiliateStats = {
    totalEarned: 45678,
    totalReferrals: 127,
    currentMonth: 8900,
    conversionRate: 12.5,
    avgCommission: 350,
    tier: 'Gold'
  }

  const commissionTiers = [
    {
      name: 'Bronze',
      minReferrals: 0,
      commission: 5,
      benefits: [t('affiliate.bronzeBenefit1'), t('affiliate.basicDashboard'), t('affiliate.monthlyPayouts')]
    },
    {
      name: 'Silver',
      minReferrals: 25,
      commission: 8,
      benefits: [t('affiliate.silverBenefit1'), t('affiliate.advancedDashboard'), t('affiliate.biweeklyPayouts'), t('affiliate.marketingMaterials')]
    },
    {
      name: 'Gold',
      minReferrals: 50,
      commission: 12,
      benefits: [t('affiliate.goldBenefit1'), t('affiliate.premiumDashboard'), t('affiliate.weeklyPayouts'), t('affiliate.dedicatedSupport'), t('affiliate.customLinks')]
    },
    {
      name: 'Platinum',
      minReferrals: 100,
      commission: 15,
      benefits: [t('affiliate.platinumBenefit1'), t('affiliate.vipDashboard'), t('affiliate.dailyPayouts'), t('affiliate.personalManager'), t('affiliate.coBrandedMaterials'), t('affiliate.exclusiveOffers')]
    }
  ]

  const handleCopyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText('https://hinctonmeatproducts.com/ref/USER123')
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy link:', error)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      onJoin?.(formData)
      setShowJoinForm(false)
      alert('Application submitted successfully! We\'ll review it within 48 hours.')
    } catch (error) {
      console.error('Application failed:', error)
    }
  }

  if (currentAffiliate) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {t('affiliate.affiliateDashboard')}
                </h1>
                <p className="text-gray-600">
                  {t('affiliate.welcomeBack').replace('{name}', currentAffiliate.name)}
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">{t('affiliate.currentTier')}</div>
                <div className="text-2xl font-bold text-yellow-600">{currentAffiliate.tier}</div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-gradient-to-r from-green-600 to-green-500 text-white p-6 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="w-8 h-8" />
                  <span className="text-2xl font-bold">KSh{affiliateStats.totalEarned.toLocaleString()}</span>
                </div>
                <div className="text-green-100">{t('affiliate.totalEarned')}</div>
              </div>
              <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-6 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-8 h-8" />
                  <span className="text-2xl font-bold">{affiliateStats.totalReferrals}</span>
                </div>
                <div className="text-blue-100">{t('affiliate.totalReferrals')}</div>
              </div>
              <div className="bg-gradient-to-r from-purple-600 to-purple-500 text-white p-6 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-8 h-8" />
                  <span className="text-2xl font-bold">KSh{affiliateStats.currentMonth.toLocaleString()}</span>
                </div>
                <div className="text-purple-100">{t('affiliate.currentMonth')}</div>
              </div>
              <div className="bg-gradient-to-r from-orange-600 to-orange-500 text-white p-6 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Target className="w-8 h-8" />
                  <span className="text-2xl font-bold">{affiliateStats.conversionRate}%</span>
                </div>
                <div className="text-orange-100">{t('affiliate.conversionRate')}</div>
              </div>
            </div>
          </div>

          {/* Referral Tools */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('affiliate.marketingTools')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">{t('affiliate.referralLink')}</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <code className="text-sm text-gray-700">https://hinctonmeatproducts.com/ref/USER123</code>
                    <button
                      onClick={handleCopyReferralLink}
                      className="p-2 bg-white rounded-lg border border-gray-300 hover:bg-gray-50"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-600" />}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      <Share2 className="w-4 h-4" />
                      {t('affiliate.shareLink')}
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                      <QrCode className="w-4 h-4" />
                      {t('affiliate.qrCode')}
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">{t('affiliate.marketingMaterials')}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50">
                    <Mail className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                    <div className="text-sm text-gray-900">{t('affiliate.emailTemplates')}</div>
                  </button>
                  <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50">
                    <MessageSquare className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                    <div className="text-sm text-gray-900">{t('affiliate.socialPosts')}</div>
                  </button>
                  <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50">
                    <Gift className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                    <div className="text-sm text-gray-900">{t('affiliate.banners')}</div>
                  </button>
                  <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50">
                    <BarChart3 className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                    <div className="text-sm text-gray-900">{t('affiliate.analytics')}</div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Commission Tiers */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('affiliate.commissionTiers')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {commissionTiers.map((tier) => (
                <div
                  key={tier.name}
                  className={`border rounded-lg p-6 ${
                    tier.name === currentAffiliate.tier
                      ? 'border-yellow-500 bg-yellow-50'
                      : 'border-gray-200'
                  }`}
                >
                  <h3 className="font-bold text-lg text-gray-900 mb-2">{tier.name}</h3>
                  <div className="text-3xl font-bold text-red-600 mb-4">{tier.commission}%</div>
                  <div className="text-sm text-gray-600 mb-4">{tier.minReferrals}+ {t('affiliate.minReferrals')}</div>
                  <ul className="space-y-2 text-sm text-gray-700">
                    {tier.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {HINCTON_BRAND.name} {t('affiliate.joinProgram')}
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            {t('affiliate.programDescription')}
          </p>
          <div className="flex items-center justify-center gap-8 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span>{t('affiliate.upToCommission')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-600" />
              <span>4 {t('affiliate.commissionTiers')}</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <span>{t('affiliate.realtimeAnalytics')}</span>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">{t('affiliate.whyJoinProgram')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{t('affiliate.generousCommissions')}</h3>
              <p className="text-gray-600 text-sm">
                {t('affiliate.generousCommissionsDesc')}
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{t('affiliate.advancedAnalytics')}</h3>
              <p className="text-gray-600 text-sm">
                {t('affiliate.advancedAnalyticsDesc')}
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{t('affiliate.marketingSupport')}</h3>
              <p className="text-gray-600 text-sm">
                {t('affiliate.marketingSupportDesc')}
              </p>
            </div>
          </div>
        </div>

        {/* Commission Tiers */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">{t('affiliate.commissionStructure')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {commissionTiers.map((tier) => (
              <div
                key={tier.name}
                className={`border rounded-lg p-6 hover:shadow-lg transition-shadow ${
                  tier.name === 'Gold' ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200'
                }`}
              >
                <h3 className="font-bold text-lg text-gray-900 mb-2">{tier.name}</h3>
                <div className="text-3xl font-bold text-red-600 mb-4">{tier.commission}%</div>
                <div className="text-sm text-gray-600 mb-4">{tier.minReferrals}+ {t('affiliate.minReferrals')}</div>
                <ul className="space-y-2 text-sm text-gray-700">
                  {tier.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Join Form */}
        {!showJoinForm ? (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('affiliate.readyToStartEarning')}</h2>
            <p className="text-gray-600 mb-8">
              {t('affiliate.joinPartnersEarning').replace('{brand}', HINCTON_BRAND.name)}
            </p>
            <button
              onClick={() => setShowJoinForm(true)}
              className="bg-red-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
            >
              {t('affiliate.joinNow')}
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">{t('affiliate.joinProgram')}</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('affiliate.fullName')}
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('affiliate.emailAddress')}
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('affiliate.phoneNumber')}
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('affiliate.businessName')}
                  </label>
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => handleInputChange('businessName', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('affiliate.businessType')}
                  </label>
                  <select
                    value={formData.businessType}
                    onChange={(e) => handleInputChange('businessType', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="">Select type</option>
                    <option value="restaurant">Restaurant</option>
                    <option value="butcher">Butcher Shop</option>
                    <option value="catering">Catering Service</option>
                    <option value="food-blogger">Food Blogger</option>
                    <option value="influencer">Social Media Influencer</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="https://"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Social Media (Instagram, Facebook, etc.)
                  </label>
                  <input
                    type="text"
                    value={formData.socialMedia}
                    onChange={(e) => handleInputChange('socialMedia', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="@yourhandle"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Why do you want to join our affiliate program? *
                </label>
                <textarea
                  value={formData.whyJoin}
                  onChange={(e) => handleInputChange('whyJoin', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-700"
                >
                  Submit Application
                </button>
                <button
                  type="button"
                  onClick={() => setShowJoinForm(false)}
                  className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

export default AffiliateProgram
