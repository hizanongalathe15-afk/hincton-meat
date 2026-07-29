import { useState } from 'react'
import { MessageCircle, X, Send, ShoppingBag, Truck, RefreshCcw, CreditCard, HelpCircle } from 'lucide-react'
import { useSiteContent } from '../contexts/SiteContentContext'

const DEFAULT_MESSAGE = 'Hi Hincton team! I would like help with my order/account/question.'

const QuickTopics = [
  { label: 'Order status', icon: ShoppingBag, prompt: 'Hello! Could I get an update on my recent order, please?' },
  { label: 'Delivery questions', icon: Truck, prompt: 'Hi! I have a question about shipping or delivery timelines.' },
  { label: 'Returns & refunds', icon: RefreshCcw, prompt: 'Hello! I need help with a return or refund request.' },
  { label: 'Payments', icon: CreditCard, prompt: 'Hi! I have a question about payment options or invoicing.' },
  { label: 'Something else', icon: HelpCircle, prompt: DEFAULT_MESSAGE },
]

const WhatsAppWidget = () => {
  const { profile } = useSiteContent()
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState(DEFAULT_MESSAGE)

  const phone = profile?.brand?.whatsapp || profile?.brand?.supportPhone || profile?.brand?.phone

  const openWhatsApp = (finalMessage: string) => {
    const digits = String(phone || '').replace(/[^0-9]/g, '')
    if (!digits) {
      alert('WhatsApp contact is not configured yet. Please reach us through the Contact page.')
      return
    }
    const cleanMsg = (finalMessage || DEFAULT_MESSAGE).trim()
    const url = `https://wa.me/${digits}?text=${encodeURIComponent(cleanMsg)}`
    window.open(url, '_blank', 'noopener,noreferrer')
    setOpen(false)
  }

  if (!phone) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Chat with us on WhatsApp"
        className="fixed bottom-4 right-4 z-[59] inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-2xl shadow-green-900/40 border-4 border-white hover:scale-105 transition-transform"
      >
        <MessageCircle className="h-7 w-7" fill="currentColor" stroke="none" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="WhatsApp chat card"
          className="fixed bottom-4 right-4 z-[60] w-[22rem] max-w-[calc(100vw-2rem)] rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-black/20 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-[#128C7E] via-[#25D366] to-[#075E54] text-white px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-white/20 border border-white/30 inline-flex items-center justify-center">
                <MessageCircle className="h-5 w-5" fill="currentColor" stroke="none" />
              </div>
              <div>
                <p className="font-extrabold">Hincton Meat · WhatsApp</p>
                <p className="text-xs text-white/90 inline-flex items-center gap-1.5">
                  <span className="relative inline-flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-300" />
                  </span>
                  We typically reply in minutes
                </p>
              </div>
            </div>
            <button aria-label="Close WhatsApp card" onClick={() => setOpen(false)} className="rounded-lg p-1 text-white/80 hover:bg-white/10 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="bg-[#ECE5DD] px-4 py-3 text-xs text-gray-700 flex items-center gap-2">
            <span className="rounded-full bg-green-100 text-green-900 px-2 py-0.5 font-bold">TIP</span>
            Click a topic below or type your message to open WhatsApp.
          </div>

          <div className="p-4 space-y-3 bg-[#ECE5DD]/30">
            <div className="grid grid-cols-2 gap-2">
              {QuickTopics.map((t) => (
                <button
                  key={t.label}
                  onClick={() => openWhatsApp(t.prompt)}
                  className="group rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-left text-xs font-semibold text-gray-800 hover:bg-green-50 hover:border-green-300 transition"
                >
                  <div className="flex items-center gap-2">
                    <t.icon className="h-4 w-4 text-green-600 group-hover:text-green-700" />
                    {t.label}
                  </div>
                </button>
              ))}
            </div>

            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">Your message</span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="Type the message you want to send on WhatsApp…"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-[#25D366] focus:outline-none focus:ring-2 focus:ring-[#25D366]/30"
              />
            </label>

            <button
              onClick={() => openWhatsApp(message)}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-extrabold text-white hover:bg-[#1ebe5a] transition-colors"
            >
              <Send className="h-4 w-4" /> Open WhatsApp
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default WhatsAppWidget
