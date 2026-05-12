import { useState, useEffect } from 'react'
import { X, Cookie, Shield, Target } from 'lucide-react'

interface CookiePreferences {
  necessary: boolean
  analytics: boolean
  advertising: boolean
  functional: boolean
}

interface CookieConsentProps {
  onPreferencesChange?: (preferences: CookiePreferences) => void
  className?: string
}

const CookieConsent = ({ onPreferencesChange, className = '' }: CookieConsentProps) => {
  const [isVisible, setIsVisible] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Always required
    analytics: false,
    advertising: false,
    functional: false
  })

  useEffect(() => {
    // Check if user has already made cookie choices
    const consent = localStorage.getItem('cookieConsent')
    if (!consent) {
      setIsVisible(true)
    } else {
      const savedPreferences = JSON.parse(consent)
      setPreferences(savedPreferences)
      onPreferencesChange?.(savedPreferences)
    }
  }, [onPreferencesChange])

  const handleAcceptAll = () => {
    const allPreferences = {
      necessary: true,
      analytics: true,
      advertising: true,
      functional: true
    }
    savePreferences(allPreferences)
  }

  const handleAcceptSelected = () => {
    savePreferences(preferences)
  }

  const handleRejectAll = () => {
    const minimalPreferences = {
      necessary: true,
      analytics: false,
      advertising: false,
      functional: false
    }
    savePreferences(minimalPreferences)
  }

  const savePreferences = (prefs: CookiePreferences) => {
    setPreferences(prefs)
    localStorage.setItem('cookieConsent', JSON.stringify(prefs))
    localStorage.setItem('cookieConsentDate', new Date().toISOString())
    onPreferencesChange?.(prefs)
    setIsVisible(false)

    // Set actual cookies based on preferences
    if (prefs.analytics) {
      document.cookie = "analytics_consent=true; path=/; max-age=31536000"
    }
    if (prefs.advertising) {
      document.cookie = "advertising_consent=true; path=/; max-age=31536000"
    }
    if (prefs.functional) {
      document.cookie = "functional_consent=true; path=/; max-age=31536000"
    }
  }

  const updatePreference = (key: keyof CookiePreferences, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }))
  }

  if (!isVisible) return null

  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-white border-t shadow-2xl z-50 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-4">
                <Cookie className="w-6 h-6 text-amber-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Cookie Consent</h3>
              </div>
              
              <p className="text-gray-600 mb-4 max-w-3xl">
                We use cookies to enhance your experience, analyze site traffic, and deliver personalized advertisements. 
                By clicking "Accept All", you consent to our use of cookies. You can manage your preferences below.
              </p>

              {showDetails && (
                <div className="space-y-4 mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <Shield className="w-4 h-4 text-blue-600 mr-2" />
                        <span className="font-medium text-gray-900">Essential Cookies</span>
                      </div>
                      <p className="text-sm text-gray-600">Required for the site to function properly. Cannot be disabled.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.necessary}
                      disabled
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                  </div>

                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <Target className="w-4 h-4 text-green-600 mr-2" />
                        <span className="font-medium text-gray-900">Advertising Cookies</span>
                      </div>
                      <p className="text-sm text-gray-600">Used to deliver personalized ads and track ad performance.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.advertising}
                      onChange={(e) => updatePreference('advertising', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                  </div>

                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <Target className="w-4 h-4 text-purple-600 mr-2" />
                        <span className="font-medium text-gray-900">Analytics Cookies</span>
                      </div>
                      <p className="text-sm text-gray-600">Help us understand how visitors interact with our site.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.analytics}
                      onChange={(e) => updatePreference('analytics', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                  </div>

                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <Target className="w-4 h-4 text-orange-600 mr-2" />
                        <span className="font-medium text-gray-900">Functional Cookies</span>
                      </div>
                      <p className="text-sm text-gray-600">Enable personalized features and remember your preferences.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.functional}
                      onChange={(e) => updatePreference('functional', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleAcceptAll}
                  className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Accept All
                </button>
                <button
                  onClick={handleAcceptSelected}
                  className="px-6 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Accept Selected
                </button>
                <button
                  onClick={handleRejectAll}
                  className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Reject All
                </button>
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="px-6 py-2 text-blue-600 font-medium hover:text-blue-700 transition-colors"
                >
                  {showDetails ? 'Hide Details' : 'Customize'}
                </button>
              </div>
            </div>

            <button
              onClick={() => setIsVisible(false)}
              className="ml-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CookieConsent
