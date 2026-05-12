import { useState } from 'react'
import { 
  Package, 
  AlertCircle, 
  CheckCircle, 
  Camera,
  Clock,
  DollarSign
} from 'lucide-react'

interface ReturnFormProps {
  orderId?: string
  onSubmit?: (returnData: any) => void
}

const ReturnForm = ({ orderId, onSubmit }: ReturnFormProps) => {
  const [formData, setFormData] = useState({
    orderId: orderId || '',
    reason: '',
    description: '',
    refundMethod: 'original_payment',
    images: [] as File[],
    contactPhone: '',
    contactEmail: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const returnReasons = [
    { value: 'quality_issue', label: 'Quality Issue', description: 'Product not fresh or spoiled' },
    { value: 'wrong_item', label: 'Wrong Item', description: 'Received different product' },
    { value: 'damaged_packaging', label: 'Damaged Packaging', description: 'Package arrived damaged' },
    { value: 'incorrect_weight', label: 'Incorrect Weight', description: 'Weight doesn\'t match order' },
    { value: 'allergy_concern', label: 'Allergy Concern', description: 'Allergy information missing' },
    { value: 'other', label: 'Other', description: 'Other reason' }
  ]

  const refundMethods = [
    { value: 'original_payment', label: 'Original Payment Method', description: 'Refund to M-PESA/Card used' },
    { value: 'store_credit', label: 'Store Credit', description: 'Credit for future purchases' },
    { value: 'replacement', label: 'Product Replacement', description: 'New product delivered' }
  ]

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setFormData(prev => ({ ...prev, images: [...prev.images, ...files] }))
  }

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      onSubmit?.(formData)
      setSubmitted(true)
    } catch (error) {
      console.error('Return submission failed:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-green-900 mb-4">
            Return Request Submitted!
          </h2>
          <p className="text-green-700 mb-6">
            Your return request has been successfully submitted. We'll review it within 24 hours and contact you with the next steps.
          </p>
          <div className="bg-white rounded-lg p-6 text-left">
            <h3 className="font-semibold text-gray-900 mb-4">What happens next:</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-blue-600" />
                <span>Review within 24 hours</span>
              </div>
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-blue-600" />
                <span>Pickup arranged if approved</span>
              </div>
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-blue-600" />
                <span>Refund processed within 3-5 days</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Product Return Request
          </h1>
          <p className="text-gray-600">
            We're sorry you're having an issue with your order. Please provide details about your return request.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Order Information */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Order ID
            </label>
            <input
              type="text"
              value={formData.orderId}
              onChange={(e) => handleInputChange('orderId', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Enter your order ID"
              required
            />
          </div>

          {/* Return Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Reason for Return
            </label>
            <div className="space-y-3">
              {returnReasons.map((reason) => (
                <label
                  key={reason.value}
                  className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="radio"
                    name="reason"
                    value={reason.value}
                    checked={formData.reason === reason.value}
                    onChange={(e) => handleInputChange('reason', e.target.value)}
                    className="mt-1"
                    required
                  />
                  <div>
                    <div className="font-medium text-gray-900">{reason.label}</div>
                    <div className="text-sm text-gray-600">{reason.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Detailed Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Please describe the issue in detail..."
              required
            />
          </div>

          {/* Refund Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Preferred Resolution
            </label>
            <div className="space-y-3">
              {refundMethods.map((method) => (
                <label
                  key={method.value}
                  className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="radio"
                    name="refundMethod"
                    value={method.value}
                    checked={formData.refundMethod === method.value}
                    onChange={(e) => handleInputChange('refundMethod', e.target.value)}
                    className="mt-1"
                    required
                  />
                  <div>
                    <div className="font-medium text-gray-900">{method.label}</div>
                    <div className="text-sm text-gray-600">{method.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Upload Photos (Optional but Recommended)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="cursor-pointer">
                <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">
                  Click to upload photos of the product
                </p>
                <p className="text-sm text-gray-500">
                  PNG, JPG up to 10MB each
                </p>
              </label>
            </div>

            {/* Image Preview */}
            {formData.images.length > 0 && (
              <div className="mt-4 grid grid-cols-4 gap-4">
                {formData.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="0759 901 357"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="your@email.com"
                required
              />
            </div>
          </div>

          {/* Return Policy Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-semibold mb-1">Return Policy:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Returns must be initiated within 24 hours of delivery</li>
                  <li>Products must be in original packaging</li>
                  <li>Perishable items can only be returned for quality issues</li>
                  <li>Refunds processed within 3-5 business days after approval</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Return Request'}
            </button>
            <button
              type="button"
              className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ReturnForm
