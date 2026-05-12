import { useState } from 'react'
import { 
  User, 
  MapPin, 
  CreditCard,

  Shield,
  Check
} from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'

interface CheckoutFormProps {
  onSubmit: (orderData: OrderData) => Promise<void>
  total: number
  cartItems: any[]
}

interface OrderData {
  customerInfo: {
    firstName: string
    lastName: string
    email: string
    phone: string
  }
  shippingAddress: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  paymentMethod: 'mpesa' | 'card'
  deliveryOption: 'standard' | 'express'
  notes?: string
}

const CheckoutForm = ({ onSubmit, total, cartItems }: CheckoutFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const { t } = useLanguage()
  const [orderData, setOrderData] = useState<OrderData>({
    customerInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phone: ''
    },
    shippingAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Kenya'
    },
    paymentMethod: 'mpesa',
    deliveryOption: 'standard'
  })

  const steps = [
    { id: 1, title: t('checkout.customerInfo'), icon: User },
    { id: 2, title: t('checkout.shipping'), icon: MapPin },
    { id: 3, title: t('checkout.payment'), icon: CreditCard },
    { id: 4, title: t('checkout.review'), icon: Check }
  ]

  const deliveryOptions = [
    {
      id: 'standard',
      name: t('checkout.standardDelivery'),
      description: '3-5 business days',
      price: total > 50 ? 0 : 9.99
    },
    {
      id: 'express',
      name: t('checkout.expressDelivery'),
      description: '1-2 business days',
      price: 19.99
    }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(orderData)
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateOrderData = (section: keyof OrderData, field: string, value: any) => {
    setOrderData(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as any),
        [field]: value
      }
    }))
  }

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return orderData.customerInfo.firstName && 
               orderData.customerInfo.lastName && 
               orderData.customerInfo.email && 
               orderData.customerInfo.phone
      case 2:
        return orderData.shippingAddress.street && 
               orderData.shippingAddress.city && 
               orderData.shippingAddress.state && 
               orderData.shippingAddress.zipCode
      case 3:
        return orderData.paymentMethod
      default:
        return true
    }
  }

  const deliveryCost = deliveryOptions.find(opt => opt.id === orderData.deliveryOption)?.price || 0
  const tax = total * 0.08
  const finalTotal = total + deliveryCost + tax

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = step.id === currentStep
            const isCompleted = step.id < currentStep
            
            return (
              <div key={step.id} className="flex items-center">
                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors
                  ${isActive ? 'border-red-600 bg-red-600 text-white' : 
                    isCompleted ? 'border-green-600 bg-green-600 text-white' : 
                    'border-gray-300 text-gray-500'}
                `}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="ml-3 hidden sm:block">
                  <p className={`text-sm font-medium ${
                    isActive ? 'text-red-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-full sm:w-24 h-0.5 mx-4 ${
                    step.id < currentStep ? 'bg-green-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form Content */}
          <div className="lg:col-span-2">
            {/* Step 1: Customer Information */}
            {currentStep === 1 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-6">Customer Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={orderData.customerInfo.firstName}
                      onChange={(e) => updateOrderData('customerInfo', 'firstName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={orderData.customerInfo.lastName}
                      onChange={(e) => updateOrderData('customerInfo', 'lastName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={orderData.customerInfo.email}
                      onChange={(e) => updateOrderData('customerInfo', 'email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={orderData.customerInfo.phone}
                      onChange={(e) => updateOrderData('customerInfo', 'phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Shipping Address */}
            {currentStep === 2 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-6">Shipping Address</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      required
                      value={orderData.shippingAddress.street}
                      onChange={(e) => updateOrderData('shippingAddress', 'street', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City *
                      </label>
                      <input
                        type="text"
                        required
                        value={orderData.shippingAddress.city}
                        onChange={(e) => updateOrderData('shippingAddress', 'city', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        State/Province *
                      </label>
                      <input
                        type="text"
                        required
                        value={orderData.shippingAddress.state}
                        onChange={(e) => updateOrderData('shippingAddress', 'state', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ZIP/Postal Code *
                      </label>
                      <input
                        type="text"
                        required
                        value={orderData.shippingAddress.zipCode}
                        onChange={(e) => updateOrderData('shippingAddress', 'zipCode', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Country
                      </label>
                      <input
                        type="text"
                        value={orderData.shippingAddress.country}
                        onChange={(e) => updateOrderData('shippingAddress', 'country', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Payment Method */}
            {currentStep === 3 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-6">Payment Method</h2>
                
                {/* Delivery Options */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-4">Delivery Options</h3>
                  <div className="space-y-3">
                    {deliveryOptions.map((option) => (
                      <label key={option.id} className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="delivery"
                          value={option.id}
                          checked={orderData.deliveryOption === option.id}
                          onChange={(e) => updateOrderData('deliveryOption', 'deliveryOption', e.target.value)}
                          className="mr-3 text-red-600 focus:ring-red-500"
                        />
                        <div className="flex-1">
                          <div className="font-medium">{option.name}</div>
                          <div className="text-sm text-gray-600">{option.description}</div>
                        </div>
                        <div className="font-semibold">
                          {option.price === 0 ? 'FREE' : `$${option.price.toFixed(2)}`}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Payment Options */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Payment Method</h3>
                  <div className="space-y-3">
                    <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="payment"
                        value="mpesa"
                        checked={orderData.paymentMethod === 'mpesa'}
                        onChange={(e) => updateOrderData('paymentMethod', 'paymentMethod', e.target.value)}
                        className="mr-3 text-red-600 focus:ring-red-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium">M-Pesa</div>
                        <div className="text-sm text-gray-600">Pay via M-Pesa mobile money</div>
                      </div>
                    </label>
                    <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="payment"
                        value="card"
                        checked={orderData.paymentMethod === 'card'}
                        onChange={(e) => updateOrderData('paymentMethod', 'paymentMethod', e.target.value)}
                        className="mr-3 text-red-600 focus:ring-red-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium">Credit/Debit Card</div>
                        <div className="text-sm text-gray-600">Visa, Mastercard, or other cards</div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Order Notes */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Order Notes (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={orderData.notes || ''}
                    onChange={(e) => updateOrderData('paymentMethod', 'notes', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Special instructions for delivery..."
                  />
                </div>
              </div>
            )}

            {/* Step 4: Review Order */}
            {currentStep === 4 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-6">Review Your Order</h2>
                
                {/* Order Items */}
                <div className="mb-6">
                  <h3 className="font-medium mb-4">Order Items</h3>
                  <div className="space-y-3">
                    {cartItems.map((item, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-gray-600">Qty: {item.quantity}</div>
                        </div>
                        <div className="font-medium">
                          ${(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="mb-6">
                  <h3 className="font-medium mb-4">Shipping Address</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm">
                      {orderData.customerInfo.firstName} {orderData.customerInfo.lastName}<br />
                      {orderData.shippingAddress.street}<br />
                      {orderData.shippingAddress.city}, {orderData.shippingAddress.state} {orderData.shippingAddress.zipCode}<br />
                      {orderData.shippingAddress.country}
                    </p>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="mb-6">
                  <h3 className="font-medium mb-4">Payment Method</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm capitalize">
                      {orderData.paymentMethod === 'mpesa' ? 'M-Pesa Mobile Money' : 'Credit/Debit Card'}
                    </p>
                    <p className="text-sm text-gray-600 capitalize">
                      {deliveryOptions.find(opt => opt.id === orderData.deliveryOption)?.name}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                disabled={currentStep === 1}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                type="submit"
                disabled={!isStepValid() || isSubmitting}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isSubmitting ? t('checkout.processing') : currentStep === 4 ? t('checkout.placeOrder') : t('checkout.continue')}
              </button>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Delivery</span>
                  <span>{deliveryCost === 0 ? 'FREE' : `$${deliveryCost.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span className="text-lg">${finalTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Security Badge */}
              <div className="border-t pt-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Shield className="w-4 h-4 text-green-600" />
                  <span>Secure checkout powered by SSL</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

export default CheckoutForm
