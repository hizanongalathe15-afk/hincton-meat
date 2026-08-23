import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Smartphone, Truck, User, MapPin, ShieldCheck, ChevronRight, Lock } from 'lucide-react';
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
import LiveMap, { MapMarker } from '../components/LiveMap';

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
    variant: 'info' | 'success' | 'error';
    title: string;
    message: string;
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
    longitude: '',
  });

  useEffect(() => {
    const transformedItems: OrderItem[] = items.map((item) => ({
      id: item.id,
      product: {
        id: item.id,
        name: item.name,
        price: Number(item.price) || 0,
      },
      quantity: item.quantity,
      weight: Number.parseFloat(String(item.weight || '1')) || 1,
      unit: String(item.weight || '').includes('g') ? 'g' : 'kg',
    }));
    setOrderItems(transformedItems);
  }, [items]);

  useEffect(() => {
    contentApi
      .getCommerceSettings()
      .then((data: any) => setCommerceSettings(data.settings))
      .catch(() => setCommerceSettings(null));
  }, []);

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        firstName: user.name?.split(' ')[0] || '',
        lastName: user.name?.split(' ')[1] || '',
        email: user.email || '',
        phone: user.profile?.mpesaPhone || '',
        mpesaPhone: user.profile?.mpesaPhone || '',
      }));
    }
  }, [user]);

  const subtotal = orderItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const deliveryFee = Number(commerceSettings?.shipping?.standardShippingFee ?? 200);
  const total = subtotal + deliveryFee;
  const cutoffHour = Number(commerceSettings?.shipping?.coldChainCutoffHour ?? 10);
  const beforeCutoff = new Date().getHours() < cutoffHour;
  const cutoffLabel = `${String(cutoffHour).padStart(2, '0')}:00`;
  const deliveryPromise = beforeCutoff
    ? `Order by ${cutoffLabel} AM → delivered today before ${commerceSettings?.shipping?.sameDayDeliveryBy || '5:00 PM'}`
    : `Orders placed now use the next available cold-chain slot`;
  const deliveryMapQuery =
    formData.latitude && formData.longitude
      ? `${formData.latitude},${formData.longitude}`
      : [formData.address, formData.city, formData.state, 'Kenya'].filter(Boolean).join(', ');
  const deliveryMapUrl = deliveryMapQuery
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(deliveryMapQuery)}`
    : '';
  const hasPinnedLocation = Boolean(formData.latitude && formData.longitude);

  const checkoutMapMarkers = useMemo<MapMarker[]>(() => {
    if (hasPinnedLocation) {
      return [
        {
          id: 'delivery',
          position: [Number(formData.latitude), Number(formData.longitude)],
          type: 'customer',
          label: 'Delivery location',
          popup: (
            <div>
              <p className="font-semibold text-gray-900">Pinned Delivery Location</p>
              <p className="text-sm text-gray-600">GPS coordinates pinned</p>
            </div>
          ),
        },
      ];
    }
    return [];
  }, [formData.latitude, formData.longitude, hasPinnedLocation]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const useCurrentLocation = async () => {
    try {
      toast.loading('Getting precise delivery location...', { id: 'checkout-location' });
      const location = await locationService.getHighAccuracyLocation(2);
      let address = `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
      try {
        const geocodedAddress = await locationService.reverseGeocode(location.latitude, location.longitude);
        address = geocodedAddress.formattedAddress || address;
      } catch (geocodingError) {
        console.warn('Geocoding failed for checkout:', geocodingError);
      }
      setFormData((prev) => ({
        ...prev,
        latitude: location.latitude.toString(),
        longitude: location.longitude.toString(),
        address: prev.address || address,
      }));
      const accuracyLevel = locationService.getLocationAccuracyLevel(location.accuracy);
      toast.success(`Delivery location set! Accuracy: ${accuracyLevel} (${Math.round(location.accuracy)}m)`, {
        id: 'checkout-location',
      });
    } catch (error) {
      console.error('Checkout location error:', error);
      if (error instanceof Error) {
        if (error.message.includes('permission denied')) {
          toast.error('Location permission denied. Please enable location for accurate delivery.', {
            id: 'checkout-location',
          });
        } else if (error.message.includes('unavailable')) {
          toast.error('Location unavailable. Please check your GPS services.', { id: 'checkout-location' });
        } else {
          toast.error('Could not get location. Please enter address manually.', { id: 'checkout-location' });
        }
      } else {
        toast.error('Location error. Please try again.', { id: 'checkout-location' });
      }
    }
  };

  const formatMpesaDisplayPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('254')) return `0${cleaned.slice(3)}`;
    if (cleaned.startsWith('7')) return `0${cleaned}`;
    if (cleaned.startsWith('0')) return cleaned;
    return cleaned;
  };

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
      const displayPhone = formatMpesaDisplayPhone(formData.mpesaPhone);
      setPaymentNotification({
        variant: 'info',
        title: 'M-PESA payment selected',
        message: `After you place the order, M-PESA will send a prompt to ${displayPhone}. Enter your PIN to complete payment.`,
      });
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
          const checkoutRequestID = paymentResult.checkoutRequestID || paymentResult.CheckoutRequestID;
          if (!checkoutRequestID) {
            throw new Error('Missing checkout request ID from M-PESA initiation response.');
          }
          const displayPhone = formatMpesaDisplayPhone(formData.mpesaPhone);
          setPaymentNotification({
            variant: 'info',
            title: paymentResult?.message || 'STK Push sent',
            message:
              paymentResult?.message ||
              `STK Push sent to ${displayPhone}. Check your phone and enter your M-PESA PIN to complete payment.`,
          });
          toast.success(paymentResult?.message || `STK Push sent to ${displayPhone}`);
          setShowMpesaConfirmationModal(true);
          setMpesaConfirmationMessage('Waiting for the M-Pesa prompt on your phone...');
          setMpesaConfirmationElapsed('00:00');
          const startTime = Date.now();
          const timeoutMs = 3 * 60 * 1000;
          let lastStatus = '';
          let transactionData: any = null;
          while (Date.now() - startTime < timeoutMs) {
            const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
            const minutes = String(Math.floor(elapsedSeconds / 60)).padStart(2, '0');
            const seconds = String(elapsedSeconds % 60).padStart(2, '0');
            setMpesaConfirmationElapsed(`${minutes}:${seconds}`);
            const txResult = await paymentsApi.checkMpesaTransactionStatus(checkoutRequestID);
            const status = String(txResult?.status || '').toUpperCase();
            lastStatus = status;
            transactionData = txResult?.transaction || null;
            if (status === 'COMPLETED' || status === 'PAID' || status === 'SUCCESS') {
              setShowMpesaConfirmationModal(false);
              setPaymentNotification({
                variant: 'success',
                title: 'Payment confirmed',
                message: `M-PESA payment confirmed. Receipt: ${transactionData?.mpesaReceipt || checkoutRequestID}`,
              });
              clearCart(false);
              navigate('/order-confirmation', {
                state: { order: orderResponse.order, paymentTransaction: transactionData },
              });
              return;
            }
            if (status === 'FAILED' || status === 'ERROR') {
              const errMsg = txResult?.message || transactionData?.errorMessage || 'M-PESA payment failed. Please try again.';
              throw new Error(errMsg);
            }
            setMpesaConfirmationMessage('Waiting for M-Pesa to confirm the payment on your phone...');
            setPaymentNotification({
              variant: 'info',
              title: 'Waiting for M-PESA confirmation',
              message: `Checking payment status... (${minutes}:${seconds} elapsed)`,
            });
            await new Promise((resolve) => setTimeout(resolve, 3000));
          }
          throw new Error(`M-PESA payment confirmation timed out. Last status: ${lastStatus || 'UNKNOWN'}`);
        } catch (paymentError) {
          const errorMessage = getApiErrorMessage(paymentError, 'Order was created, but M-PESA payment could not complete.');
          console.error('MPESA processing failed:', paymentError);
          setShowMpesaConfirmationModal(false);
          setPaymentNotification({
            variant: 'error',
            title: 'M-PESA payment failed',
            message: errorMessage,
          });
          toast.error(errorMessage);
          return;
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-50 via-white to-red-50/30">
        <div className="h-14 w-14 animate-spin rounded-full border-[3px] border-red-200 border-t-red-600" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#f8f7f4]">
      {/* Soft ambient background blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-red-200/25 blur-3xl" />
        <div className="absolute -right-24 top-1/3 h-80 w-80 rounded-full bg-amber-100/40 blur-3xl" />
        <div className="absolute bottom-20 left-1/3 h-72 w-72 rounded-full bg-emerald-100/30 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        {/* M-Pesa waiting modal */}
        {showMpesaConfirmationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
            <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-300 rounded-3xl border border-white/60 bg-white/95 p-8 shadow-2xl shadow-black/20">
              <div className="flex flex-col items-center gap-5 text-center">
                <div className="relative flex h-20 w-20 items-center justify-center">
                  <div className="absolute inset-0 animate-ping rounded-full bg-green-400/30" />
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-50 to-emerald-100 text-green-600 shadow-inner">
                    <Smartphone className="h-8 w-8" />
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-gray-900">Waiting for M-Pesa</h2>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">{mpesaConfirmationMessage}</p>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-gray-100 px-4 py-1.5 text-sm font-medium text-gray-700">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                  {mpesaConfirmationElapsed}
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full w-2/3 animate-pulse rounded-full bg-gradient-to-r from-green-400 to-emerald-500" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <header className="mb-10">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/70 p-6 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] backdrop-blur-xl sm:p-8">
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br from-red-300/40 to-orange-200/30 blur-3xl" />
            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-red-100/80 bg-red-50/90 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-red-700">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Secure checkout
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight text-gray-950 sm:text-4xl">
                  {t('checkout.title')}
                </h1>
                <p className="mt-2 max-w-md text-gray-600">{t('checkout.completeOrder')}</p>
                {!user && (
                  <div className="mt-5 flex flex-col gap-1 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3 text-sm sm:flex-row sm:items-center sm:gap-3">
                    <p className="font-semibold text-emerald-900">No account needed — continue as guest</p>
                    <p className="text-emerald-800">
                      Just your name, phone and delivery address.{' '}
                      <button
                        type="button"
                        onClick={() => navigate('/login')}
                        className="font-bold underline decoration-emerald-400/60 underline-offset-2 hover:text-emerald-950"
                      >
                        Sign in
                      </button>{' '}
                      if you already have one.
                    </p>
                  </div>
                )}
              </div>
              <div className="shrink-0 rounded-2xl border border-red-100/80 bg-white/90 px-5 py-3.5 text-sm font-semibold text-red-900 shadow-sm sm:max-w-xs">
                {deliveryPromise}
                <span className="mt-1 block text-xs font-normal text-red-700/80">
                  {commerceSettings?.shipping?.insulatedBoxText || t('checkout.deliveredColdInsulatedBox')}
                </span>
              </div>
            </div>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left column – form sections */}
          <div className="space-y-6 lg:col-span-7 xl:col-span-8">
            {/* Contact */}
            <section className="group relative overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/75 p-6 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.06)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.1)] sm:p-8">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
                  <User className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-bold tracking-tight text-gray-900">{t('checkout.contactInfo')}</h2>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">{t('checkout.firstName')} *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-xl border border-gray-200 bg-white/90 px-4 py-2.5 text-gray-900 shadow-sm transition focus:border-red-400 focus:outline-none focus:ring-4 focus:ring-red-500/10"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">{t('checkout.lastName')} *</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-xl border border-gray-200 bg-white/90 px-4 py-2.5 text-gray-900 shadow-sm transition focus:border-red-400 focus:outline-none focus:ring-4 focus:ring-red-500/10"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">{t('checkout.email')} *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-xl border border-gray-200 bg-white/90 px-4 py-2.5 text-gray-900 shadow-sm transition focus:border-red-400 focus:outline-none focus:ring-4 focus:ring-red-500/10"
                  />
                </div>
                <PhoneNumberInput
                  id="phone"
                  label={`${t('checkout.phone')} *`}
                  value={formData.phone}
                  onChange={(value) => setFormData((c) => ({ ...c, phone: value }))}
                  required
                />
              </div>
            </section>

            {/* Delivery */}
            <section className="group relative overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/75 p-6 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.06)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.1)] sm:p-8">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
                  <MapPin className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-bold tracking-tight text-gray-900">{t('checkout.deliveryAddress')}</h2>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">{t('checkout.streetAddress')} *</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-xl border border-gray-200 bg-white/90 px-4 py-2.5 text-gray-900 shadow-sm transition focus:border-red-400 focus:outline-none focus:ring-4 focus:ring-red-500/10"
                  />
                  <button
                    type="button"
                    onClick={useCurrentLocation}
                    className="mt-3 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-red-600/25 transition hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-red-600/30 active:translate-y-0"
                  >
                    <MapPin className="h-4 w-4" />
                    {t('checkout.pinCurrentLocation')}
                  </button>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">{t('checkout.city')} *</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-xl border border-gray-200 bg-white/90 px-4 py-2.5 text-gray-900 shadow-sm transition focus:border-red-400 focus:outline-none focus:ring-4 focus:ring-red-500/10"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">{t('checkout.stateProvince')} *</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-xl border border-gray-200 bg-white/90 px-4 py-2.5 text-gray-900 shadow-sm transition focus:border-red-400 focus:outline-none focus:ring-4 focus:ring-red-500/10"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">{t('checkout.zipPostalCode')} *</label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-xl border border-gray-200 bg-white/90 px-4 py-2.5 text-gray-900 shadow-sm transition focus:border-red-400 focus:outline-none focus:ring-4 focus:ring-red-500/10"
                  />
                </div>
                <div className="md:col-span-2 overflow-hidden rounded-2xl border border-gray-100 bg-gray-50/80 shadow-inner">
                  {hasPinnedLocation ? (
                    <div>
                      <LiveMap
                        markers={checkoutMapMarkers}
                        height={256}
                        fitBounds={false}
                        center={[Number(formData.latitude), Number(formData.longitude)]}
                        zoom={16}
                        scrollWheelZoom={true}
                      />
                      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200/80 bg-white/90 px-4 py-3 text-sm">
                        <span className="font-medium text-gray-700">Pinned GPS location</span>
                        <a
                          href={deliveryMapUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-bold text-red-700 hover:text-red-800"
                        >
                          Open live map <ChevronRight className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  ) : deliveryMapUrl ? (
                    <div>
                      <div className="flex h-32 items-center justify-center text-sm text-gray-500">
                        <MapPin className="mr-2 h-5 w-5 text-gray-400" />
                        Address-only — pin GPS for precise delivery
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200/80 bg-white/90 px-4 py-3 text-sm">
                        <span className="font-medium text-gray-700">Map preview from your address</span>
                        <a
                          href={deliveryMapUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-bold text-red-700 hover:text-red-800"
                        >
                          Open live map <ChevronRight className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-32 items-center justify-center px-4 text-center text-sm text-gray-500">
                      {t('checkout.pinYourLocation')}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Payment */}
            <section className="group relative overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/75 p-6 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.06)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.1)] sm:p-8">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
                  <Lock className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-bold tracking-tight text-gray-900">{t('checkout.paymentMethod')}</h2>
              </div>
              <div className="space-y-3">
                <label
                  className={`flex cursor-pointer items-center gap-4 rounded-2xl border-2 p-4 transition-all duration-200 ${
                    formData.paymentMethod === 'mpesa'
                      ? 'border-green-400 bg-green-50/80 shadow-md shadow-green-100'
                      : 'border-gray-200 bg-white/60 hover:border-gray-300 hover:bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="mpesa"
                    checked={formData.paymentMethod === 'mpesa'}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                      formData.paymentMethod === 'mpesa' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <span className="font-semibold text-gray-900">{t('checkout.mpesa')}</span>
                  </div>
                  {formData.paymentMethod === 'mpesa' && (
                    <div className="h-5 w-5 rounded-full border-[5px] border-green-500" />
                  )}
                </label>

                <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-gray-50/80 p-4 opacity-70">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">{t('checkout.creditDebitCard')}</span>
                  </div>
                </div>

                <label
                  className={`flex cursor-pointer items-center gap-4 rounded-2xl border-2 p-4 transition-all duration-200 ${
                    formData.paymentMethod === 'cash'
                      ? 'border-gray-400 bg-gray-50 shadow-md'
                      : 'border-gray-200 bg-white/60 hover:border-gray-300 hover:bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cash"
                    checked={formData.paymentMethod === 'cash'}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                      formData.paymentMethod === 'cash' ? 'bg-gray-200 text-gray-700' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    <Truck className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <span className="font-semibold text-gray-900">{t('checkout.cash')}</span>
                  </div>
                  {formData.paymentMethod === 'cash' && (
                    <div className="h-5 w-5 rounded-full border-[5px] border-gray-500" />
                  )}
                </label>
              </div>

              {formData.paymentMethod === 'mpesa' && (
                <div className="mt-5 rounded-2xl border border-green-100 bg-gradient-to-br from-green-50/80 to-emerald-50/50 p-5">
                  <PhoneNumberInput
                    id="mpesaPhone"
                    label={`${t('checkout.mpesa')} ${t('checkout.phone')} *`}
                    value={formData.mpesaPhone}
                    onChange={(value) => setFormData((c) => ({ ...c, mpesaPhone: value }))}
                    required
                  />
                </div>
              )}
            </section>
          </div>

          {/* Right column – floating order summary */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="sticky top-6 space-y-4">
              <div className="relative overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/85 p-6 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.12)] backdrop-blur-xl">
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-red-200/30 blur-2xl" />
                <h2 className="relative mb-5 text-lg font-bold tracking-tight text-gray-900">
                  {t('checkout.orderSummary')}
                </h2>

                {paymentNotification && (
                  <div
                    className={`mb-5 rounded-xl border p-4 text-sm ${
                      paymentNotification.variant === 'success'
                        ? 'border-green-200 bg-green-50 text-green-900'
                        : paymentNotification.variant === 'error'
                          ? 'border-red-200 bg-red-50 text-red-900'
                          : 'border-blue-200 bg-blue-50 text-blue-900'
                    }`}
                  >
                    <p className="font-semibold">{paymentNotification.title}</p>
                    <p className="mt-1 leading-relaxed">{paymentNotification.message}</p>
                  </div>
                )}

                <div className="mb-5 max-h-56 space-y-3 overflow-y-auto pr-1">
                  {orderItems.map((item) => (
                    <div key={item.id} className="flex items-start justify-between gap-3 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-gray-900">{item.product.name}</p>
                        <p className="text-gray-500">
                          {item.quantity} × {item.weight} {item.unit}
                        </p>
                      </div>
                      <span className="shrink-0 font-semibold text-gray-900">
                        {formatPrice(item.product.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2.5 border-t border-gray-100 pt-4 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>{t('checkout.subtotal')}</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>{t('checkout.deliveryFee')}</span>
                    <span>{formatPrice(deliveryFee)}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-100 pt-3 text-base font-bold text-gray-950">
                    <span>{t('checkout.total')}</span>
                    <span className="text-red-600">{formatPrice(total)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={processing}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-red-500 px-6 py-4 font-bold text-white shadow-lg shadow-red-600/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-red-600/35 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {processing ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      {t('checkout.processing')}
                    </>
                  ) : (
                    <>
                      {t('checkout.placeOrder')}
                      <ChevronRight className="h-5 w-5" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/cart')}
                  className="mt-3 w-full rounded-xl py-2.5 text-sm font-medium text-gray-500 transition hover:bg-gray-50 hover:text-gray-800"
                >
                  {t('checkout.backToCart')}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CheckoutPage;