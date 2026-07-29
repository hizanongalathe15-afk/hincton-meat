import React, { useState } from 'react'
import { Bell, Mail, Phone, Loader2, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { featuresApi } from '../../services/featuresApi'

type BackInStockFormProps = {
  productId: string
  variantId?: string
  productName?: string
}

const BackInStockForm: React.FC<BackInStockFormProps> = ({
  productId,
  variantId,
  productName = 'this item',
}) => {
  const [contact, setContact] = useState('')
  const [sendVia, setSendVia] = useState<'EMAIL' | 'SMS' | 'BOTH'>('EMAIL')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const detectChannel = (value: string): 'EMAIL' | 'SMS' => {
    const trimmed = value.trim()
    const looksLikePhone = /^[+\d][\d\s()-]{5,}$/.test(trimmed)
    return looksLikePhone ? 'SMS' : 'EMAIL'
  }

  const validateContact = (value: string): { valid: boolean; message?: string } => {
    const trimmed = value.trim()
    if (!trimmed) {
      return { valid: false, message: 'Please enter your email or phone number' }
    }
    const channel = detectChannel(trimmed)
    if (channel === 'EMAIL') {
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
      if (!emailOk) return { valid: false, message: 'Please enter a valid email address' }
    } else {
      const phoneOk = /^[+\d][\d\s()-]{7,}$/.test(trimmed)
      if (!phoneOk) return { valid: false, message: 'Please enter a valid phone number' }
    }
    return { valid: true }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const check = validateContact(contact)
    if (!check.valid) {
      toast.error(check.message || 'Invalid contact details')
      return
    }

    const channel = detectChannel(contact)
    const isEmail = channel === 'EMAIL'
    const sentVia: 'EMAIL' | 'SMS' | 'BOTH' = sendVia === 'BOTH'
      ? 'BOTH'
      : isEmail
        ? 'EMAIL'
        : 'SMS'

    setLoading(true)
    try {
      await featuresApi.registerBackInStockAlert({
        productId,
        variantId,
        email: isEmail ? contact.trim() : undefined,
        phone: !isEmail ? contact.trim() : undefined,
        sentVia,
      })
      setSubmitted(true)
      toast.success(`You'll be notified when ${productName} is back in stock`)
    } catch (error) {
      toast.error('Could not register your alert. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-5">
        <div className="flex items-start gap-3">
          <div className="shrink-0 p-2 rounded-full bg-green-100">
            <CheckCircle2 className="w-5 h-5 text-green-700" />
          </div>
          <div>
            <h3 className="font-semibold text-green-900">You're on the list</h3>
            <p className="mt-1 text-sm text-green-800">
              We'll let you know as soon as {productName} is available again.
            </p>
            <button
              type="button"
              onClick={() => {
                setSubmitted(false)
                setContact('')
              }}
              className="mt-3 text-sm font-medium text-green-700 underline hover:text-green-800"
            >
              Notify a different contact
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-amber-200 bg-amber-50 p-5"
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="shrink-0 p-2 rounded-full bg-amber-100">
          <Bell className="w-5 h-5 text-amber-700" />
        </div>
        <div>
          <h3 className="font-semibold text-amber-900">Notify me when back in stock</h3>
          <p className="mt-1 text-sm text-amber-800">
            Leave your details and we'll alert you the moment {productName} returns.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <label className="block">
          <span className="sr-only">Email or phone number</span>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              {detectChannel(contact) === 'SMS' ? (
                <Phone className="w-4 h-4" />
              ) : (
                <Mail className="w-4 h-4" />
              )}
            </div>
            <input
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Enter your email or phone number"
              className="w-full rounded-lg border border-amber-200 bg-white pl-10 pr-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-400/30 focus:outline-none"
              autoComplete="off"
            />
          </div>
        </label>

        <div className="flex flex-wrap gap-2">
          {(['EMAIL', 'SMS', 'BOTH'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setSendVia(mode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                sendVia === mode
                  ? 'border-amber-500 bg-amber-100 text-amber-900'
                  : 'border-amber-200 bg-white text-amber-700 hover:border-amber-300'
              }`}
            >
              {mode === 'EMAIL' ? 'Email only' : mode === 'SMS' ? 'SMS only' : 'Email + SMS'}
            </button>
          ))}
        </div>

        <button
          type="submit"
          disabled={loading || !contact.trim()}
          className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Registering…
            </>
          ) : (
            <>
              <Bell className="w-4 h-4" />
              Set Back-In-Stock Alert
            </>
          )}
        </button>
      </div>
    </form>
  )
}

export default BackInStockForm
