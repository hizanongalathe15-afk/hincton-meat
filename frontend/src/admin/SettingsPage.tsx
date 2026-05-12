import { useEffect, useState } from 'react'
import { 
  Save, 
  Bell, 
  Globe, 
  CreditCard,
  Package,
  Truck,
  FileText,
  Database,
  Smartphone,
  Plus,
  Trash2,

} from 'lucide-react'
import { HINCTON_BRAND } from '../utils/hinctonBrand'
import { LANGUAGES } from '../utils/languages'
import { settingsApi } from '../services/adminApi'
import toast from 'react-hot-toast'
import { getPriceRanges } from '../utils/currency'


interface SettingsPageProps {
  onSaveSettings?: (settings: any) => void
}

const SettingsPage = ({ onSaveSettings }: SettingsPageProps) => {
  const [activeTab, setActiveTab] = useState('general')
  const [isSaving, setIsSaving] = useState(false)



  const [settings, setSettings] = useState({
    general: {
      storeName: HINCTON_BRAND.name,
      storeEmail: HINCTON_BRAND.email,
      storePhone: HINCTON_BRAND.phone,
      storeAddress: HINCTON_BRAND.address,
      currency: 'KES',
      timezone: 'Africa/Nairobi',
      language: 'en'
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      orderNotifications: true,
      lowStockAlerts: true,
      customerInquiries: true,
      systemUpdates: true
    },
    shipping: {
      freeShippingThreshold: 5000,
      standardShippingFee: 200,
      expressShippingFee: 450,
      deliveryTimeframe: 'Today before 5 PM',
      expressDeliveryTimeframe: 'Within 2 hours',
      coldChainCutoffHour: 10,
      sameDayDeliveryBy: '5:00 PM',
      insulatedBoxText: 'Delivered cold in an insulated box'
    },
    payment: {
      mpesaEnabled: true,
      cardPaymentsEnabled: true,
      cashOnDeliveryEnabled: false,
      bankTransferEnabled: true
    },
    inventory: {
      lowStockThreshold: 10,
      autoReorderEnabled: false,
      stockTrackingEnabled: true,
      expirationAlerts: true
    },
    shop: {
      priceRanges: getPriceRanges().map((range) => ({
        ...range,
        max: Number.isFinite(range.max) ? range.max : null,
      }))
    }
  })

  const tabs = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'shipping', label: 'Shipping', icon: Truck },
    { id: 'payment', label: 'Payment', icon: CreditCard },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'shop', label: 'Shop', icon: Package }
  ]

  useEffect(() => {
    settingsApi.getSettings()
      .then((data) => {
        const commerce = (data.settings || []).find((setting: any) => setting.key === 'commerce_settings')
        if (!commerce) return
        const saved = JSON.parse(commerce.value)
        setSettings((current) => ({
          ...current,
          ...saved,
          general: { ...current.general, ...(saved.general || {}) },
          notifications: { ...current.notifications, ...(saved.notifications || {}) },
          shipping: { ...current.shipping, ...(saved.shipping || {}) },
          payment: { ...current.payment, ...(saved.payment || {}) },
          inventory: { ...current.inventory, ...(saved.inventory || {}) },
          shop: { ...current.shop, ...(saved.shop || {}) },
        }))
      })
      .catch(() => toast.error('Could not load saved settings'))
  }, [])

  const handleSettingChange = (category: string, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [field]: value
      }
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const payload = {
        ...settings,
        shop: {
          ...settings.shop,
          priceRanges: settings.shop.priceRanges.map((range: any, index: number) => ({
            id: range.id || `${range.min || 0}-${range.max || 'plus'}-${index}`,
            name: range.name,
            min: Number(range.min) || 0,
            max: range.max === '' || range.max === null || range.max === undefined ? null : Number(range.max),
          })),
        },
      }
      await settingsApi.createSetting({
        key: 'commerce_settings',
        value: JSON.stringify(payload),
        type: 'json',
        description: 'Editable commerce, delivery, payment, inventory, and notification settings',
        group: 'commerce',
        isPublic: true,
      })
      toast.success('Settings saved')
      onSaveSettings?.(settings)
    } catch {
      toast.error('Could not save settings')
    } finally {
      setIsSaving(false)
    }
  }

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Store Name
          </label>
          <input
            type="text"
            value={settings.general.storeName}
            onChange={(e) => handleSettingChange('general', 'storeName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Store Email
          </label>
          <input
            type="email"
            value={settings.general.storeEmail}
            onChange={(e) => handleSettingChange('general', 'storeEmail', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Store Phone
          </label>
          <input
            type="tel"
            value={settings.general.storePhone}
            onChange={(e) => handleSettingChange('general', 'storePhone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Currency
          </label>
          <select
            value={settings.general.currency}
            onChange={(e) => handleSettingChange('general', 'currency', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          >
            <option value="KES">Kenyan Shilling (KES)</option>
            <option value="USD">US Dollar (USD)</option>
            <option value="EUR">Euro (EUR)</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Store Address
        </label>
        <textarea
          rows={3}
          value={settings.general.storeAddress}
          onChange={(e) => handleSettingChange('general', 'storeAddress', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Timezone
          </label>
          <select
            value={settings.general.timezone}
            onChange={(e) => handleSettingChange('general', 'timezone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          >
            <option value="Africa/Nairobi">Africa/Nairobi</option>
            <option value="Europe/London">Europe/London</option>
            <option value="America/New_York">America/New_York</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Language
          </label>
          <select
            value={settings.general.language}
            onChange={(e) => handleSettingChange('general', 'language', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.label}
              </option>
            ))}
          </select>

        </div>
      </div>
    </div>
  )

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(settings.notifications).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </p>
                <p className="text-sm text-gray-600">
                  {key === 'emailNotifications' && 'Receive email notifications'}
                  {key === 'smsNotifications' && 'Receive SMS notifications'}
                  {key === 'orderNotifications' && 'New order notifications'}
                  {key === 'lowStockAlerts' && 'Low stock alerts'}
                  {key === 'customerInquiries' && 'Customer inquiries'}
                  {key === 'systemUpdates' && 'System update notifications'}
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(value)}
                onChange={(e) => handleSettingChange('notifications', key, e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
            </label>
          </div>
        ))}
      </div>
    </div>
  )

  const renderShippingSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Free Shipping Threshold
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              {settings.general.currency}
            </span>
            <input
              type="number"
              value={settings.shipping.freeShippingThreshold}
              onChange={(e) => handleSettingChange('shipping', 'freeShippingThreshold', parseFloat(e.target.value))}
              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Standard Shipping Fee
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              {settings.general.currency}
            </span>
            <input
              type="number"
              value={settings.shipping.standardShippingFee}
              onChange={(e) => handleSettingChange('shipping', 'standardShippingFee', parseFloat(e.target.value))}
              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Express Shipping Fee
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              {settings.general.currency}
            </span>
            <input
              type="number"
              value={settings.shipping.expressShippingFee}
              onChange={(e) => handleSettingChange('shipping', 'expressShippingFee', parseFloat(e.target.value))}
              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Standard Delivery Promise
          </label>
          <input
            type="text"
            value={settings.shipping.deliveryTimeframe}
            onChange={(e) => handleSettingChange('shipping', 'deliveryTimeframe', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Express Delivery Timeframe
          </label>
          <input
            type="text"
            value={settings.shipping.expressDeliveryTimeframe}
            onChange={(e) => handleSettingChange('shipping', 'expressDeliveryTimeframe', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cold Chain Cut-off Hour
          </label>
          <input
            type="number"
            min="0"
            max="23"
            value={settings.shipping.coldChainCutoffHour}
            onChange={(e) => handleSettingChange('shipping', 'coldChainCutoffHour', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Same-day Delivery By
          </label>
          <input
            type="text"
            value={settings.shipping.sameDayDeliveryBy}
            onChange={(e) => handleSettingChange('shipping', 'sameDayDeliveryBy', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cold Chain Message
          </label>
          <input
            type="text"
            value={settings.shipping.insulatedBoxText}
            onChange={(e) => handleSettingChange('shipping', 'insulatedBoxText', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>
      </div>
    </div>
  )

  const renderPaymentSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(settings.payment).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3">
              {key === 'mpesaEnabled' && <Smartphone className="w-5 h-5 text-gray-400" />}
              {key === 'cardPaymentsEnabled' && <CreditCard className="w-5 h-5 text-gray-400" />}
              {key === 'cashOnDeliveryEnabled' && <FileText className="w-5 h-5 text-gray-400" />}
              {key === 'bankTransferEnabled' && <Database className="w-5 h-5 text-gray-400" />}
              <div>
                <p className="font-medium text-gray-900">
                  {key === 'mpesaEnabled' && 'M-Pesa'}
                  {key === 'cardPaymentsEnabled' && 'Credit/Debit Cards'}
                  {key === 'cashOnDeliveryEnabled' && 'Cash on Delivery'}
                  {key === 'bankTransferEnabled' && 'Bank Transfer'}
                </p>
                <p className="text-sm text-gray-600">
                  {key === 'mpesaEnabled' && 'Accept M-Pesa mobile payments'}
                  {key === 'cardPaymentsEnabled' && 'Accept credit and debit card payments'}
                  {key === 'cashOnDeliveryEnabled' && 'Accept cash on delivery'}
                  {key === 'bankTransferEnabled' && 'Accept bank transfers'}
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(value)}
                onChange={(e) => handleSettingChange('payment', key, e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
            </label>
          </div>
        ))}
      </div>
    </div>
  )

  const renderInventorySettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Low Stock Threshold
          </label>
          <input
            type="number"
            value={settings.inventory.lowStockThreshold}
            onChange={(e) => handleSettingChange('inventory', 'lowStockThreshold', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(settings.inventory).filter(([key]) => key !== 'lowStockThreshold').map(([key, value]) => (
          <div key={key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3">
              <Package className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </p>
                <p className="text-sm text-gray-600">
                  {key === 'autoReorderEnabled' && 'Automatically reorder low stock items'}
                  {key === 'stockTrackingEnabled' && 'Enable stock tracking'}
                  {key === 'expirationAlerts' && 'Alert for expiring products'}
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(value)}
                onChange={(e) => handleSettingChange('inventory', key, e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
            </label>
          </div>
        ))}
      </div>
    </div>
  )

  const updatePriceRange = (index: number, field: string, value: string | number) => {
    setSettings((current) => ({
      ...current,
      shop: {
        ...current.shop,
        priceRanges: current.shop.priceRanges.map((range: any, rangeIndex: number) => (
          rangeIndex === index ? { ...range, [field]: value } : range
        )),
      },
    }))
  }

  const addPriceRange = () => {
    setSettings((current) => ({
      ...current,
      shop: {
        ...current.shop,
        priceRanges: [
          ...current.shop.priceRanges,
          { id: `custom-${Date.now()}`, name: 'New price range', min: 0, max: null },
        ],
      },
    }))
  }

  const removePriceRange = (index: number) => {
    setSettings((current) => ({
      ...current,
      shop: {
        ...current.shop,
        priceRanges: current.shop.priceRanges.filter((_: any, rangeIndex: number) => rangeIndex !== index),
      },
    }))
  }

  const renderShopSettings = () => (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-950">Editable Shop Price Ranges</h3>
            <p className="mt-1 text-sm text-gray-600">These ranges power the buyer shop price filter on the right side of the catalog.</p>
          </div>
          <button
            type="button"
            onClick={addPriceRange}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
          >
            <Plus className="h-4 w-4" />
            Add Range
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {settings.shop.priceRanges.map((range: any, index: number) => (
            <div key={range.id || index} className="grid gap-3 rounded-lg border border-gray-200 p-4 md:grid-cols-[1fr_120px_120px_auto] md:items-end">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Label</span>
                <input
                  value={range.name}
                  onChange={(event) => updatePriceRange(index, 'name', event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Min</span>
                <input
                  type="number"
                  value={range.min}
                  onChange={(event) => updatePriceRange(index, 'min', event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Max</span>
                <input
                  type="number"
                  value={range.max === null || range.max === undefined ? '' : range.max}
                  placeholder="No max"
                  onChange={(event) => updatePriceRange(index, 'max', event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500"
                />
              </label>
              <button
                type="button"
                onClick={() => removePriceRange(index)}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-red-200 px-3 text-red-700 hover:bg-red-50"
                aria-label="Remove price range"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general': return renderGeneralSettings()
      case 'notifications': return renderNotificationSettings()
      case 'shipping': return renderShippingSettings()
      case 'payment': return renderPaymentSettings()
      case 'inventory': return renderInventorySettings()
      case 'shop': return renderShopSettings()
      default: return renderGeneralSettings()
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
            <p className="text-gray-600">Manage your store settings and preferences</p>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`bg-red-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              isSaving ? 'opacity-70 cursor-not-allowed hover:bg-red-600' : 'hover:bg-red-700'
            }`}
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Settings Content */}
      <div className="bg-white rounded-lg shadow">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
