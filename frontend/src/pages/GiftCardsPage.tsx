import { useState } from 'react'
import { Gift, Heart, Star, TreePine, PartyPopper, Flower2, Mail, MessageCircle, Printer, CheckCircle, ChevronRight } from 'lucide-react'
import { giftCardsApi } from '../services/buyerApi'
import toast from 'react-hot-toast'

const OCCASIONS = [
  { id: 'WEDDING', label: 'Wedding', icon: Heart, color: 'from-pink-500 to-rose-600' },
  { id: 'EID', label: 'Eid', icon: Star, color: 'from-emerald-500 to-teal-600' },
  { id: 'BIRTHDAY', label: 'Birthday', icon: PartyPopper, color: 'from-violet-500 to-purple-600' },
  { id: 'CHRISTMAS', label: 'Christmas', icon: TreePine, color: 'from-green-600 to-red-600' },
  { id: 'THANK_YOU', label: 'Thank You', icon: Gift, color: 'from-amber-500 to-orange-600' },
  { id: 'FUNERAL', label: 'Condolence', icon: Flower2, color: 'from-gray-500 to-slate-600' },
]

const PRESET_AMOUNTS = [1000, 2000, 5000, 10000, 20000, 50000]

const GiftCardsPage = () => {
  const [step, setStep] = useState(1)
  const [occasion, setOccasion] = useState('')
  const [amount, setAmount] = useState(5000)
  const [customAmount, setCustomAmount] = useState('')
  const [senderName, setSenderName] = useState('')
  const [senderEmail, setSenderEmail] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [recipientPhone, setRecipientPhone] = useState('')
  const [message, setMessage] = useState('')
  const [deliveryMethod, setDeliveryMethod] = useState('EMAIL')
  const [submitting, setSubmitting] = useState(false)
  const [createdCard, setCreatedCard] = useState<any>(null)

  const finalAmount = customAmount ? Number(customAmount) : amount
  const SelectedOccasionIcon = selectedOccasion?.icon || Gift

  const handlePurchase = async () => {
    if (!senderName || !recipientName) {
      toast.error('Please fill in sender and recipient names')
      return
    }
    if (finalAmount < 500 || finalAmount > 50000) {
      toast.error('Amount must be between KSh 500 and KSh 50,000')
      return
    }

    setSubmitting(true)
    try {
      const result = await giftCardsApi.purchase({
        amount: finalAmount,
        senderName,
        senderEmail: senderEmail || undefined,
        recipientName,
        recipientEmail: recipientEmail || undefined,
        recipientPhone: recipientPhone || undefined,
        message: message || undefined,
        occasion: occasion || undefined,
        template: occasion,
        deliveryMethod,
      })
      setCreatedCard(result.giftCard)
      setStep(4)
      toast.success('Gift card created successfully!')
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to create gift card')
    } finally {
      setSubmitting(false)
    }
  }

  const handleShare = async (method: string) => {
    if (!createdCard) return
    try {
      const result = await giftCardsApi.send({ code: createdCard.code, method })
      if (result.deliveryInfo?.url) {
        window.open(result.deliveryInfo.url, '_blank', 'noopener,noreferrer')
      }
      toast.success(`Share link ready!`)
    } catch { toast.error('Failed to generate share link') }
  }

  const selectedOccasion = OCCASIONS.find((o) => o.id === occasion)

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      {/* Hero */}
      <div className="relative overflow-hidden px-4 py-16 sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-amber-500 blur-[120px]" />
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-rose-500 blur-[120px]" />
        </div>
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-400">
            <Gift className="h-4 w-4" />
            Gift Cards
          </div>
          <h1 className="mb-3 bg-gradient-to-r from-white via-amber-200 to-rose-400 bg-clip-text text-4xl font-black text-transparent sm:text-5xl">
            Give the Gift of Premium Meat
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-400">
            Send a Hincton Meat gift card to someone special. They can use it to order any product from our store.
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      {step < 4 && (
        <div className="mx-auto max-w-3xl px-4 pb-4">
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${step >= s ? 'bg-red-600 text-white' : 'bg-white/10 text-gray-500'}`}>
                  {step > s ? <CheckCircle className="h-5 w-5" aria-label="Complete" /> : s}
                </div>
                <span className={`text-sm ${step >= s ? 'text-white' : 'text-gray-500'}`}>
                  {s === 1 ? 'Occasion' : s === 2 ? 'Details' : 'Review'}
                </span>
                {s < 3 && <ChevronRight className="h-4 w-4 text-gray-600" />}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mx-auto max-w-3xl px-4 pb-20">
        {/* Step 1: Choose Occasion & Amount */}
        {step === 1 && (
          <div className="space-y-8">
            <div>
              <h2 className="mb-4 text-lg font-semibold text-white">Choose an Occasion</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {OCCASIONS.map((occ) => (
                  <button
                    key={occ.id}
                    onClick={() => setOccasion(occ.id)}
                    className={`group relative overflow-hidden rounded-xl border p-4 text-left transition ${occasion === occ.id ? 'border-red-500 bg-red-500/10' : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.07]'}`}
                  >
                    <occ.icon className="h-7 w-7" aria-hidden="true" />
                    <p className="mt-2 font-medium text-white">{occ.label}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="mb-4 text-lg font-semibold text-white">Select Amount (KSh)</h2>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                {PRESET_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => { setAmount(amt); setCustomAmount('') }}
                    className={`rounded-xl border py-3 text-sm font-semibold transition ${!customAmount && amount === amt ? 'border-red-500 bg-red-500/20 text-white' : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'}`}
                  >
                    {amt.toLocaleString()}
                  </button>
                ))}
              </div>
              <div className="mt-3">
                <input
                  type="number"
                  min={500}
                  max={50000}
                  placeholder="Or enter custom amount (500 - 50,000)"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-red-500"
                />
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!finalAmount || finalAmount < 500 || finalAmount > 50000}
              className="w-full rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-6 py-3.5 font-semibold text-white shadow-lg shadow-red-600/25 transition hover:shadow-red-600/40 disabled:opacity-50"
            >
              Continue — KSh {finalAmount.toLocaleString()}
            </button>
          </div>
        )}

        {/* Step 2: Sender & Recipient Details */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-300">Your Name *</label>
                <input type="text" value={senderName} onChange={(e) => setSenderName(e.target.value)} className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none focus:border-red-500" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-300">Your Email</label>
                <input type="email" value={senderEmail} onChange={(e) => setSenderEmail(e.target.value)} className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none focus:border-red-500" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-300">Recipient Name *</label>
                <input type="text" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none focus:border-red-500" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-300">Recipient Email</label>
                <input type="email" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none focus:border-red-500" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-300">Recipient Phone (for WhatsApp)</label>
                <input type="tel" value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} placeholder="+254..." className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none focus:border-red-500" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-300">Personal Message</label>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} placeholder="Write a personal message..." className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-red-500" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">Delivery Method</label>
              <div className="grid grid-cols-3 gap-3">
                {([
                  { id: 'EMAIL', label: 'Email', icon: Mail },
                  { id: 'WHATSAPP', label: 'WhatsApp', icon: MessageCircle },
                  { id: 'PRINT', label: 'Print', icon: Printer },
                ]).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setDeliveryMethod(m.id)}
                    className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition ${deliveryMethod === m.id ? 'border-red-500 bg-red-500/10 text-white' : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'}`}
                  >
                    <m.icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="rounded-xl border border-white/20 px-6 py-3 font-semibold text-white transition hover:bg-white/10">Back</button>
              <button
                onClick={() => { if (senderName && recipientName) setStep(3); else toast.error('Please fill in names') }}
                className="flex-1 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-6 py-3 font-semibold text-white shadow-lg shadow-red-600/25 transition hover:shadow-red-600/40"
              >
                Preview Card
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Preview & Confirm */}
        {step === 3 && (
          <div className="space-y-6">
            {/* Card Preview */}
            <div className={`relative overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br ${selectedOccasion?.color || 'from-red-600 to-red-800'} p-8`}>
              <SelectedOccasionIcon className="absolute right-4 top-4 h-10 w-10 opacity-30" aria-hidden="true" />
              <div className="relative">
                <p className="text-sm font-medium uppercase tracking-wider text-white/60">Hincton Meat Gift Card</p>
                <p className="mt-2 text-4xl font-black text-white">KSh {finalAmount.toLocaleString()}</p>
                {message && <p className="mt-4 text-lg italic text-white/80">"{message}"</p>}
                <div className="mt-6 flex justify-between text-sm text-white/60">
                  <span>From: {senderName}</span>
                  <span>To: {recipientName}</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h3 className="mb-2 font-semibold text-white">Order Summary</h3>
              <div className="space-y-1 text-sm text-gray-400">
                <p>Amount: <span className="text-white">KSh {finalAmount.toLocaleString()}</span></p>
                <p>Occasion: <span className="text-white">{selectedOccasion?.label || 'General'}</span></p>
                <p>Delivery: <span className="text-white">{deliveryMethod}</span></p>
                <p>From: <span className="text-white">{senderName}</span></p>
                <p>To: <span className="text-white">{recipientName}</span> {recipientEmail && `(${recipientEmail})`}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="rounded-xl border border-white/20 px-6 py-3 font-semibold text-white transition hover:bg-white/10">Back</button>
              <button
                onClick={handlePurchase}
                disabled={submitting}
                className="flex-1 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-6 py-3 font-semibold text-white shadow-lg shadow-red-600/25 transition hover:shadow-red-600/40 disabled:opacity-50"
              >
                {submitting ? 'Creating...' : `Purchase — KSh ${finalAmount.toLocaleString()}`}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 4 && createdCard && (
          <div className="space-y-6 text-center">
            <CheckCircle className="mx-auto h-20 w-20 text-green-500" />
            <h2 className="text-2xl font-bold text-white">Gift Card Created!</h2>
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <p className="text-sm text-gray-400">Gift Card Code</p>
              <p className="mt-1 font-mono text-2xl font-bold tracking-wider text-amber-400">{createdCard.code}</p>
              <p className="mt-2 text-lg text-white">KSh {createdCard.balance.toLocaleString()}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => handleShare('WHATSAPP')}
                className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 font-semibold text-white transition hover:bg-green-700"
              >
                <MessageCircle className="h-4 w-4" /> Share via WhatsApp
              </button>
              <button
                onClick={() => handleShare('EMAIL')}
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-5 py-2.5 font-semibold text-white transition hover:bg-white/10"
              >
                <Mail className="h-4 w-4" /> Share via Email
              </button>
              <button
                onClick={() => { navigator.clipboard.writeText(createdCard.code); toast.success('Code copied!') }}
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-5 py-2.5 font-semibold text-white transition hover:bg-white/10"
              >
                Copy Code
              </button>
            </div>
            <button
              onClick={() => { setStep(1); setCreatedCard(null); setOccasion(''); setAmount(5000); setCustomAmount(''); setSenderName(''); setRecipientName(''); setMessage('') }}
              className="text-sm text-red-400 underline hover:text-red-300"
            >
              Create another gift card
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default GiftCardsPage
