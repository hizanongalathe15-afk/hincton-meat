import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Smartphone, Truck, User, MapPin, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatPrice } from '../utils/currency';
import { cartApi, ordersApi, paymentsApi } from '../services/buyerApi';
import { locationService } from '../services/locationService';
import { getApiErrorMessage } from '../services/api';
import { contentApi } from '../services/contentApi';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import PhoneNumberInput from '../components/ui/PhoneNumberInput';

interface OrderItem {
  id: string;
  product: {
    id: string;
    name: string;
    price: number;
  };
  quantity: number;
  weight: number;
  unit: string;
}

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, clearCart } = useCart();
  const { t } = useLanguage();
  const { user } = useAuth();
  const loading = false;
  const [processing, setProcessing] = useState(false);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [commerceSettings, setCommerceSettings] = useState<any>(null);
    const [paymentNotification, setPaymentNotification] = useState<{
    variant: 'info' | 'success' | 'error'
    title: string
    message: string
  } | null>(null);
  const [showMpesaConfirmationModal, setShowMpesaConfirmationModal] = useState(false);
  const [mpesaConfirmationMessage, setMpesaConfirmationMessage] = useState('Waiting for M-Pesa confirmation...');
  const [mpesaConfirmationElapsed, setMpesaConfirmationElapsed] = useState('00:00');
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    paymentMethod: 'mpesa' as 'mpesa' | 'card' | 'cash',
    mpesaPhone: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvv: '',
    notes: '',
    latitude: '',
    longitude: ''
  });

  useEffect(() => {
    const transformedItems: OrderItem[] = items.map((item) => ({
      id: item.id,
      product: {
        id: item.id,
        name: item.name,
        price: Number(item.price) || 0
      },
      quantity: item.quantity,
      weight: Number.parseFloat(String(item.weight || '1')) || 1,
      unit: String(item.weight || '').includes('g') ? 'g' : 'kg'
    }))

    setOrderItems(transformedItems)
  }, [items])

  useEffect(() => {
    contentApi.getCommerceSettings()
      .then((data: any) => setCommerceSettings(data.settings))
      .catch(() => setCommerceSettings(null))
  }, [])

  // Auto-populate form with user data
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        firstName: user.name?.split(' ')[0] || '',
        lastName: user.name?.split(' ')[1] || '',
        email: user.email || '',
        phone: user.profile?.mpesaPhone || '',
        mpesaPhone: user.profile?.mpesaPhone || ''
      }));
    }
  }, [user])

  const subtotal = orderItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const deliveryFee = Number(commerceSettings?.shipping?.standardShippingFee ?? 200);
  const total = subtotal + deliveryFee;
  const cutoffHour = Number(commerceSettings?.shipping?.coldChainCutoffHour ?? 10)
  const beforeCutoff = new Date().getHours() < cutoffHour
  const cutoffLabel = `${String(cutoffHour).padStart(2, '0')}:00`
  const deliveryPromise = beforeCutoff
    ? `Order by ${cutoffLabel} AM -> delivered today before ${commerceSettings?.shipping?.sameDayDeliveryBy || '5:00 PM'}`
    : `Orders placed now use the next available cold-chain slot`
  const deliveryMapQuery = formData.latitude && formData.longitude
    ? `${formData.latitude},${formData.longitude}`
    : [formData.address, formData.city, formData.state, 'Kenya'].filter(Boolean).join(', ')
  const deliveryMapSrc = deliveryMapQuery
    ? `https://www.google.com/maps?q=${encodeURIComponent(deliveryMapQuery)}&z=${formData.latitude && formData.longitude ? '16' : '14'}&output=embed`
    : ''
  const deliveryMapUrl = deliveryMapQuery
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(deliveryMapQuery)}`
    : ''

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const useCurrentLocation = async () => {
    try {
      toast.loading('Getting precise delivery location...', { id: 'checkout-location' })
      
      // Get high accuracy location for delivery
      const location = await locationService.getHighAccuracyLocation(2)
      
      // Get address from coordinates
      let address = `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`
      try {
        const geocodedAddress = await locationService.reverseGeocode(
          location.latitude,
          location.longitude
        )
        address = geocodedAddress.formattedAddress || address
      } catch (geocodingError) {
        console.warn('Geocoding failed for checkout:', geocodingError)
      }
      
      // Update form with precise location
      setFormData(prev => ({
        ...prev,
        latitude: location.latitude.toString(),
        longitude: location.longitude.toString(),
        address: prev.address || address
      }))
      
      // Show success with accuracy info
      const accuracyLevel = locationService.getLocationAccuracyLevel(location.accuracy)
      toast.success(
        `Delivery location set! Accuracy: ${accuracyLevel} (${Math.round(location.accuracy)}m)`,
        { id: 'checkout-location' }
      )
      
    } catch (error) {
      console.error('Checkout location error:', error)
      
      if (error instanceof Error) {
        if (error.message.includes('permission denied')) {
          toast.error(
            'Location permission denied. Please enable location for accurate delivery.',
            { id: 'checkout-location' }
          )
        } else if (error.message.includes('unavailable')) {
          toast.error(
            'Location unavailable. Please check your GPS services.',
            { id: 'checkout-location' }
          )
        } else {
          toast.error(
            'Could not get location. Please enter address manually.',
            { id: 'checkout-location' }
          )
        }
      } else {
        toast.error('Location error. Please try again.', { id: 'checkout-location' })
      }
    }
  }

  const formatMpesaDisplayPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.startsWith('254')) return `0${cleaned.slice(3)}`
    if (cleaned.startsWith('7')) return `0${cleaned}`
    if (cleaned.startsWith('0')) return cleaned
    return cleaned
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
      toast.error(t('checkout.fillAllRequiredFields'));
      return;
    }

    if (orderItems.length === 0) {
      toast.error(t('checkout.cartEmpty'));
      navigate('/cart');
      return;
    }

    if (formData.paymentMethod === 'mpesa' && !formData.mpesaPhone) {
      toast.error(t('checkout.enterMpesaPhone'));
      return;
    }

    if (formData.paymentMethod === 'card' && (!formData.cardNumber || !formData.cardExpiry || !formData.cardCvv)) {
      toast.error(t('checkout.enterCompleteCardDetails'));
      return;
    }

    if (formData.paymentMethod === 'mpesa') {
      const displayPhone = formatMpesaDisplayPhone(formData.mpesaPhone)
      setPaymentNotification({
        variant: 'info',
        title: 'M-PESA payment selected',
        message: `After you place the order, M-PESA will send a prompt to ${displayPhone}. Enter your PIN to complete payment.`,
      })
    }

    setProcessing(true);

    try {
      const lock = await cartApi.lockForCheckout();
      if (lock?.reservationExpiresAt) {
        toast.success(`Stock reserved until ${new Date(lock.reservationExpiresAt).toLocaleTimeString()}.`);
      }

      const orderResponse = await ordersApi.createOrder({
        customer: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
        },
        shippingAddress: {
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: 'Kenya',
          latitude: formData.latitude,
          longitude: formData.longitude,
          phone: formData.phone,
        },
        paymentMethod: formData.paymentMethod,
        mpesaPhone: formData.mpesaPhone,
        notes: formData.notes,
        items: orderItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
      });

      if (formData.paymentMethod === 'mpesa') {
        try {
          const paymentResult = await paymentsApi.initiateMpesaPayment({
            phoneNumber: formData.mpesaPhone,
            amount: total,
            orderId: orderResponse.order.id,
          });

          const checkoutRequestID = paymentResult.checkoutRequestID || paymentResult.CheckoutRequestID
          if (!checkoutRequestID) {
            throw new Error('Missing checkout request ID from M-PESA initiation response.')
          }

          const displayPhone = formatMpesaDisplayPhone(formData.mpesaPhone)
          setPaymentNotification({
            variant: 'info',
            title: paymentResult?.message || 'STK Push sent',
            message: paymentResult?.message || `STK Push sent to ${displayPhone}. Check your phone and enter your M-PESA PIN to complete payment.`,
          })
          toast.success(paymentResult?.message || `STK Push sent to ${displayPhone}`)
          setShowMpesaConfirmationModal(true)
          setMpesaConfirmationMessage('Waiting for the M-Pesa prompt on your phone...')
          setMpesaConfirmationElapsed('00:00')

          const startTime = Date.now()
          const timeoutMs = 3 * 60 * 1000
          let lastStatus = ''
          let transactionData: any = null

          while (Date.now() - startTime < timeoutMs) {
            const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000)
            const minutes = String(Math.floor(elapsedSeconds / 60)).padStart(2, '0')
            const seconds = String(elapsedSeconds % 60).padStart(2, '0')
            setMpesaConfirmationElapsed(`${minutes}:${seconds}`)

            const txResult = await paymentsApi.checkMpesaTransactionStatus(checkoutRequestID)
            const status = String(txResult?.status || '').toUpperCase()
            lastStatus = status
            transactionData = txResult?.transaction || null

            if (status === 'COMPLETED' || status === 'PAID' || status === 'SUCCESS') {
              setShowMpesaConfirmationModal(false)
              setPaymentNotification({
                variant: 'success',
                title: 'Payment confirmed',
                message: `M-PESA payment confirmed. Receipt: ${transactionData?.mpesaReceipt || checkoutRequestID}`,
              })
              clearCart(false)
              navigate('/order-confirmation', {
                state: { order: orderResponse.order, paymentTransaction: transactionData },
              })
              return
            }

            if (status === 'FAILED' || status === 'ERROR') {
              const errMsg = txResult?.message || transactionData?.errorMessage || 'M-PESA payment failed. Please try again.'
              throw new Error(errMsg)
            }

            setMpesaConfirmationMessage('Waiting for M-Pesa to confirm the payment on your phone...')
            setPaymentNotification({
              variant: 'info',
              title: 'Waiting for M-PESA confirmation',
              message: `Checking payment status... (${minutes}:${seconds} elapsed)`,
            })
            await new Promise((resolve) => setTimeout(resolve, 3000))
          }

          throw new Error(`M-PESA payment confirmation timed out. Last status: ${lastStatus || 'UNKNOWN'}`)
        } catch (paymentError) {
          const errorMessage = getApiErrorMessage(paymentError, 'Order was created, but M-PESA payment could not complete.')
          console.error('MPESA processing failed:', paymentError)
          setShowMpesaConfirmationModal(false)
          setPaymentNotification({
            variant: 'error',
            title: 'M-PESA payment failed',
            message: errorMessage,
          })
          toast.error(errorMessage)
          return
        }
      }
      
      clearCart(false);
      toast.success(orderResponse?.message || 'Order placed successfully.');
      navigate('/order-confirmation', { state: { order: orderResponse.order } });
    } catch (error) {
      console.error('Checkout failed:', error);
      toast.error(getApiErrorMessage(error, 'Failed to place order. Please try again.'));
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="ambient-page min-h-screen bg-gray-50 py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {showMpesaConfirmationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8">
            <div className="gravity-panel w-full max-w-md rounded-3xl border border-white/70 bg-white/90 p-6 shadow-2xl shadow-black/20">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-600">
                  <Smartphone className="h-8 w-8" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Waiting for M-Pesa</h2>
                <p className="text-sm text-gray-600">{mpesaConfirmationMessage}</p>
                <div className="text-sm text-gray-500">Elapsed time: {mpesaConfirmationElapsed}</div>
                <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                  <div className="h-full w-3/4 animate-pulse rounded-full bg-green-500" />
                </div>
                <div className="text-xs text-gray-500">Do not close this page until the payment is confirmed.</div>
              </div>
            </div>
          </div>
        )}
        <div className="gravity-panel relative mb-8 overflow-hidden rounded-3xl bg-white/75 p-6 sm:p-8">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-red-300/30 blur-3xl" aria-hidden="true" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[.14em] text-red-700"><ShieldCheck className="h-4 w-4" /> Secure checkout</div>
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-950 sm:text-4xl">{t('checkout.title')}</h1>
              <p className="mt-2 text-gray-600">{t('checkout.completeOrder')}</p>
            </div>
            <div className="rounded-2xl border border-red-100 bg-white/80 px-4 py-3 text-sm font-semibold text-red-900 shadow-sm sm:max-w-sm">
              {deliveryPromise} ({commerceSettings?.shipping?.insulatedBoxText || t('checkout.deliveredColdInsulatedBox')})
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information */}
            <div className="gravity-panel rounded-3xl bg-white/80 p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2" />
                {t('checkout.contactInfo')}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('checkout.firstName')} *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('checkout.lastName')} *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('checkout.email')} *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                
                <PhoneNumberInput
                  id="phone"
                  label={`${t('checkout.phone')} *`}
                  value={formData.phone}
                  onChange={(value) => setFormData((current) => ({ ...current, phone: value }))}
                  required
                />
              </div>
            </div>

            {/* Delivery Address */}
            <div className="gravity-panel rounded-3xl bg-white/80 p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                {t('checkout.deliveryAddress')}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('checkout.streetAddress')} *
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={useCurrentLocation}
                    className="mt-3 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-red-600/20 transition hover:-translate-y-0.5 hover:bg-red-700"
                  >
                    <MapPin className="h-4 w-4" />
                    {t('checkout.pinCurrentLocation')}
                  </button>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('checkout.city')} *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('checkout.stateProvince')} *
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('checkout.zipPostalCode')} *
                  </label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2 overflow-hidden rounded-2xl border border-white/80 bg-gray-50 shadow-inner">
                  {deliveryMapSrc ? (
                    <div>
                      <iframe
                        title="Delivery location map"
                        src={deliveryMapSrc}
                        className="h-64 w-full"
                        loading="lazy"
                      />
                      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 bg-white px-4 py-3 text-sm">
                        <span className="font-medium text-gray-700">
                          {formData.latitude && formData.longitude ? 'Pinned GPS location' : 'Map preview from your address'}
                        </span>
                        <a href={deliveryMapUrl} target="_blank" rel="noreferrer" className="font-bold text-red-700 hover:text-red-800">
                          Open live map
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-32 items-center justify-center px-4 text-center text-sm text-gray-600">
                      {t('checkout.pinYourLocation')}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="gravity-panel rounded-3xl bg-white/80 p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('checkout.paymentMethod')}</h2>
              
              <div className="space-y-3">
                <label className="gravity-card flex items-center border-2 border-green-200 bg-green-50/60 p-4 rounded-2xl cursor-pointer">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="mpesa"
                    checked={formData.paymentMethod === 'mpesa'}
                    onChange={handleInputChange}
                    className="mr-3"
                  />
                  <Smartphone className="h-5 w-5 mr-2 text-green-600" />
                  <span className="font-medium">{t('checkout.mpesa')}</span>
                </label>
                
                <div className="flex items-center border border-gray-200 bg-gray-50 p-4 rounded-2xl opacity-75">
                  <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
                  <div><span className="font-medium text-gray-700">{t('checkout.creditDebitCard')}</span><p className="mt-0.5 text-xs text-gray-500">Coming soon — card details are not collected until a certified payment gateway is connected.</p></div>
                </div>
                
                <label className="gravity-card flex items-center border border-gray-300 bg-white/60 p-4 rounded-2xl cursor-pointer">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cash"
                    checked={formData.paymentMethod === 'cash'}
                    onChange={handleInputChange}
                    className="mr-3"
                  />
                  <Truck className="h-5 w-5 mr-2 text-gray-600" />
                  <span className="font-medium">{t('checkout.cash')}</span>
                </label>
              </div>

              {formData.paymentMethod === 'mpesa' && (
                <div className="mt-5 rounded-2xl border border-green-100 bg-green-50/50 p-4">
                  <PhoneNumberInput
                    id="mpesaPhone"
                    label={`${t('checkout.mpesa')} ${t('checkout.phone')} *`}
                    value={formData.mpesaPhone}
                    onChange={(value) => setFormData((current) => ({ ...current, mpesaPhone: value }))}
                    required
                  />
                  <p className="mt-3 text-xs leading-5 text-green-800">A secure M-Pesa prompt is sent to this number. Hincton never asks for your M-Pesa PIN.</p>
                </div>
              )}

            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="gravity-panel sticky top-4 rounded-3xl bg-white/85 p-6 shadow-xl shadow-stone-900/5">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('checkout.orderSummary')}</h2>
              {paymentNotification && (
                <div className={`mb-4 rounded-lg border p-4 text-sm ${
                  paymentNotification.variant === 'success'
                    ? 'border-green-200 bg-green-50 text-green-900'
                    : paymentNotification.variant === 'error'
                    ? 'border-red-200 bg-red-50 text-red-900'
                    : 'border-blue-200 bg-blue-50 text-blue-900'
                }`}>
                  <p className="font-semibold">{paymentNotification.title}</p>
                  <p className="mt-1">{paymentNotification.message}</p>
                </div>
              )}

              {/* Order Items */}
              <div className="space-y-3 mb-6">
                {orderItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <div>
                      <p className="font-medium text-gray-900">{item.product.name}</p>
                      <p className="text-gray-600">
                        {item.quantity} × {item.weight} {item.unit}
                      </p>
                    </div>
                    <span className="font-medium">
                      {formatPrice(item.product.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 mb-6 border-t pt-4">
                <div className="flex justify-between text-gray-600">
                  <span>{t('checkout.subtotal')}</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>{t('checkout.deliveryFee')}</span>
                  <span>{formatPrice(deliveryFee)}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold text-gray-900 pt-3 border-t">
                  <span>{t('checkout.total')}</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={processing}
                className="w-full rounded-2xl bg-red-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-red-600/25 transition hover:-translate-y-0.5 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {processing ? t('checkout.processing') : t('checkout.placeOrder')}
              </button>

              <button
                type="button"
                onClick={() => navigate('/cart')}
                className="w-full mt-3 text-gray-600 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t('checkout.backToCart')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CheckoutPage;
