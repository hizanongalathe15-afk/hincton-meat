import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Check, Package, Truck, Clock, MapPin, Phone, Mail, UserPlus } from 'lucide-react'
import QRCode from 'qrcode'
import toast from 'react-hot-toast'
import { ordersApi } from '../services/buyerApi'
import { formatPrice } from '../utils/currency'
import { useSiteContent } from '../contexts/SiteContentContext'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'

const OrderConfirmationPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { profile } = useSiteContent()
  const { t } = useLanguage()
  const { user, register } = useAuth()
  const [order, setOrder] = useState<any>((location.state as any)?.order || null)
  const [loading, setLoading] = useState(!order)
  const [trackingQr, setTrackingQr] = useState('')
  const [upgradePassword, setUpgradePassword] = useState('')
  const [upgradeProcessing, setUpgradeProcessing] = useState(false)

  const orderId = searchParams.get('orderId') || searchParams.get('orderNumber') || order?.orderNumber || order?.id

  useEffect(() => {
    if (order || !orderId) {
      setLoading(false)
      return
    }

    const loadOrder = async () => {
      try {
        const data = await ordersApi.getOrder(orderId)
        setOrder(data.order)
      } catch {
        toast.error(t('order.notFoundError'))
      } finally {
        setLoading(false)
      }
    }

    loadOrder()
  }, [order, orderId])

  const address = order?.shippingAddress || {}
  const items = order?.orderItems || []
  const trackingId = order?.trackingNumber || order?.orderNumber || order?.id

  // Soft account creation after payment: we already have the guest's name and email,
  // so one password turns this order into a full account (order + cart get linked server-side).
  const upgradeName = [address.firstName, address.lastName].filter(Boolean).join(' ') || ''
  const upgradeEmail = address.email || order?.guestEmail || ''

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!upgradeEmail || !upgradePassword) return
    setUpgradeProcessing(true)
    try {
      await register({
        name: upgradeName || 'Hincton Customer',
        email: upgradeEmail,
        password: upgradePassword,
        agreed: true,
      })
      toast.success('Account created — this order is now linked to it.')
    } catch {
      // AuthContext already shows the specific error toast
    } finally {
      setUpgradeProcessing(false)
    }
  }

  useEffect(() => {
    if (!trackingId) return
    QRCode.toDataURL(`${window.location.origin}/order-tracking/${encodeURIComponent(trackingId)}`, { width: 220, margin: 2, errorCorrectionLevel: 'M' }).then(setTrackingQr).catch(() => setTrackingQr(''))
  }, [trackingId])
  const whatsappHref = useMemo(() => {
    const digits = (profile.brand.phoneHref || profile.brand.phone || '').replace(/\D/g, '')
    const phone = digits.startsWith('254') ? digits : digits.startsWith('0') ? `254${digits.slice(1)}` : digits
    const text = encodeURIComponent(`Hello ${profile.brand.name}, I need help with order ${trackingId || ''}.`)
    return phone ? `https://wa.me/${phone}?text=${text}` : ''
  }, [profile.brand.name, profile.brand.phone, profile.brand.phoneHref, trackingId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('order.notFound')}</h1>
          <button onClick={() => navigate('/shop')} className="text-green-700 hover:text-green-800">
            {t('order.returnToShop')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('order.received')}</h1>
          <p className="text-lg text-gray-600">{t('order.savedAndStarted')}</p>
          <p className="text-sm text-gray-500 mt-2">
            {t('order.number')}: <span className="font-semibold">{order.orderNumber}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Package className="w-5 h-5 mr-2" />
                {t('order.items')}
              </h2>
              <div className="space-y-4">
                {items.map((item: any) => (
                  <div key={item.id} className="flex items-center space-x-4 pb-4 border-b last:border-b-0">
                    <img
                      src={item.productImage || '/hincton/hero-platter.webp'}
                      alt={item.productName}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.productName}</h3>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-gray-900">{formatPrice(Number(item.totalPrice) || 0)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Truck className="w-5 h-5 mr-2" />
                {t('order.deliveryInformation')}
              </h2>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">{t('order.deliveryAddress')}</p>
                    <p className="text-gray-600">
                      {[address.address, address.city, address.state, address.country].filter(Boolean).join(', ')}
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">{t('order.currentStatus')}</p>
                    <p className="text-gray-600">{order.status}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            {!user && upgradeEmail && (
              <div className="rounded-lg border border-green-200 bg-green-50 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-green-950 mb-1 flex items-center">
                  <UserPlus className="w-5 h-5 mr-2" />
                  Save this order to an account
                </h2>
                <p className="text-sm text-green-900 mb-4">
                  We already have your details — just pick a password and this order (plus your cart) is linked instantly for tracking on any device.
                </p>
                <form onSubmit={handleCreateAccount} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-green-900 mb-1">Email</label>
                    <input
                      type="email"
                      value={upgradeEmail}
                      readOnly
                      className="w-full px-3 py-2 rounded-lg border border-green-200 bg-white text-sm text-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-green-900 mb-1">Create password</label>
                    <input
                      type="password"
                      value={upgradePassword}
                      onChange={(e) => setUpgradePassword(e.target.value)}
                      required
                      minLength={8}
                      placeholder="At least 8 characters"
                      className="w-full px-3 py-2 rounded-lg border border-green-200 bg-white text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <p className="mt-1 text-xs text-green-800">Use uppercase, lowercase, a number and a symbol.</p>
                  </div>
                  <button
                    type="submit"
                    disabled={upgradeProcessing}
                    className="w-full rounded-lg bg-green-700 text-white py-2.5 px-4 font-semibold hover:bg-green-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {upgradeProcessing ? 'Creating account...' : 'Create account in 10 seconds'}
                  </button>
                  <button type="button" onClick={() => navigate('/register')} className="w-full text-xs text-green-800 hover:text-green-950 underline">
                    Or register with a different email
                  </button>
                </form>
              </div>
            )}

            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('order.summary')}</h2>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>{t('order.subtotal')}</span>
                  <span>{formatPrice(Number(order.subtotal) || 0)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>{t('order.deliveryFee')}</span>
                  <span>{formatPrice(Number(order.shippingCost) || 0)}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold text-gray-900 pt-3 border-t">
                  <span>{t('order.total')}</span>
                  <span>{formatPrice(Number(order.totalAmount) || 0)}</span>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('order.payment')}</span>
                  <span className="font-medium">{order.payments?.[0]?.paymentMethod || 'Pending'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('order.paymentStatus')}</span>
                  <span className="font-medium text-yellow-700">{order.paymentStatus}</span>
                </div>
              </div>
              {order.payments?.[0]?.paymentMethod?.toLowerCase() === 'mpesa' && (
                <div className={`rounded-lg border p-4 text-sm ${
                  order.paymentStatus === 'paid'
                    ? 'border-green-200 bg-green-50 text-green-900'
                    : 'border-yellow-200 bg-yellow-50 text-yellow-900'
                }`}>
                  <p className="font-semibold">
                    {order.paymentStatus === 'paid'
                      ? 'M-PESA payment confirmed'
                      : 'M-PESA payment pending'}
                  </p>
                  <p className="mt-1">
                    {order.paymentStatus === 'paid'
                      ? 'Payment completed successfully through M-PESA.'
                      : 'Your order is waiting for M-PESA confirmation. Check your phone for the STK prompt and enter your PIN.'}
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <button onClick={() => navigate(`/order-tracking/${trackingId}`)} className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors">
                  {t('order.trackYourOrder')}
                </button>
                <button onClick={() => navigate('/shop')} className="w-full bg-gray-100 text-gray-900 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 transition-colors">
                  {t('order.continueShopping')}
                </button>
                {whatsappHref && (
                  <a href={whatsappHref} target="_blank" rel="noreferrer" className="block w-full rounded-lg bg-red-600 px-6 py-3 text-center font-semibold text-white transition-colors hover:bg-red-700">
                    WhatsApp Support
                  </a>
                )}
              </div>

              {trackingQr && <div className="mt-5 border-t pt-5 text-center"><p className="text-sm font-bold text-gray-900">Receipt & tracking QR</p><p className="mt-1 text-xs text-gray-500">Scan to open this order’s live delivery tracking.</p><img src={trackingQr} alt={`QR code for order ${trackingId} tracking`} className="mx-auto mt-3 h-32 w-32 rounded-lg border border-gray-200 p-1" /></div>}

              <div className="mt-6 pt-6 border-t">
                <h3 className="font-medium text-gray-900 mb-3">{t('order.needHelp')}</h3>
                <div className="space-y-2 text-sm">
                  <a href={profile.brand.phoneHref} className="flex items-center space-x-2 text-gray-600 hover:text-red-700">
                    <Phone className="w-4 h-4" />
                    <span>{profile.brand.phone}</span>
                  </a>
                  <a href={profile.brand.emailHref} className="flex items-center space-x-2 text-gray-600 hover:text-red-700">
                    <Mail className="w-4 h-4" />
                    <span>{profile.brand.email}</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderConfirmationPage
