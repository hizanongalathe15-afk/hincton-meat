import { useState, useEffect, useRef } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import {
  Clock, Instagram, Mail, MapPin, Phone, Send, MessageCircle,
  CheckCircle2, ArrowRight, Headphones
} from 'lucide-react'
import { useSiteContent } from '../contexts/SiteContentContext'
import { useLanguage } from '../contexts/LanguageContext'
import { contentApi } from '../services/contentApi'
import toast from 'react-hot-toast'
import { resolveMediaUrl } from '../services/api'

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })
  const [attachments, setAttachments] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [scrollY, setScrollY] = useState(0)
  const formRef = useRef<HTMLDivElement>(null)

  const { profile } = useSiteContent()
  const { t } = useLanguage()
  const brand = profile.brand
  const page = profile.pages.contact

  // Smooth anti-gravity scroll tracking
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const payload = attachments.length ? new FormData() : formData
      if (payload instanceof FormData) {
        Object.entries(formData).forEach(([key, value]) => payload.append(key, value))
        attachments.forEach((file) => payload.append('attachments', file))
      }
      await contentApi.submitContactForm(payload)
      setSubmitStatus('success')
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' })
      setAttachments([])
      toast.success('Message sent successfully!')
    } catch (error) {
      console.error('Contact form submission error:', error)
      setSubmitStatus('error')
      toast.error('Failed to send message. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const whatsappHref = brand.phone
    ? `https://wa.me/${brand.phone.replace(/\D/g, '').replace(/^0/, '254')}?text=${encodeURIComponent('Hello Hincton Meat, I need help with...')}`
    : ''

  const contactMethods = [
    {
      icon: Phone,
      label: t('contact.phone'),
      value: brand.phone,
      href: brand.phoneHref,
      color: 'from-emerald-500 to-teal-600',
      delay: 0,
    },
    {
      icon: MessageCircle,
      label: 'WhatsApp',
      value: 'Chat instantly',
      href: whatsappHref,
      color: 'from-green-500 to-emerald-600',
      delay: 80,
    },
    {
      icon: Mail,
      label: t('contact.emailLabel'),
      value: brand.email,
      href: brand.emailHref,
      color: 'from-blue-500 to-indigo-600',
      delay: 160,
    },
    {
      icon: MapPin,
      label: t('contact.address'),
      value: brand.address,
      href: null,
      color: 'from-rose-500 to-red-600',
      delay: 240,
    },
  ]

  // Anti-gravity floating calculation
  const float = (speed = 1, offset = 0) =>
    `translateY(${(scrollY * speed * 0.08) + offset}px)`

  return (
    <div className="ambient-page relative min-h-screen overflow-x-hidden bg-[#faf9f7]">
      {/* ========== HERO with deep parallax ========== */}
      <section className="gravity-hero relative h-[70vh] min-h-[520px] overflow-hidden bg-[#1a1b1e]">
        {page?.video ? (
          <video
            src={resolveMediaUrl(page.video)}
            autoPlay muted loop playsInline
            className="absolute inset-0 h-full w-full object-cover opacity-50"
            style={{ transform: float(0.3) }}
          />
        ) : page?.image ? (
          <img
            src={resolveMediaUrl(page.image)}
            alt={page.title}
            className="absolute inset-0 h-full w-full object-cover opacity-50"
            style={{ transform: float(0.3) }}
          />
        ) : null}

        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a1b1e]/70 via-[#1a1b1e]/50 to-[#1a1b1e]" />

        {/* Floating light orbs (anti-gravity feel) */}
        <div
          className="pointer-events-none absolute -left-20 top-20 h-72 w-72 rounded-full bg-red-600/20 blur-3xl"
          style={{ transform: float(-0.4, 40) }}
        />
        <div
          className="pointer-events-none absolute -right-10 bottom-10 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl"
          style={{ transform: float(0.25, -20) }}
        />

        <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center">
          <img
            src={profile.images.logo || brand.logo}
            alt={brand.name}
            className="mb-8 h-24 w-auto rounded-2xl bg-white/95 p-3 shadow-2xl shadow-black/30 backdrop-blur"
            style={{ transform: float(-0.15) }}
          />
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-red-300">
            {brand.tagline || 'NYAMA FRESH PEKEE'}
          </p>
          <h1
            className="max-w-4xl text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl"
            style={{ transform: float(-0.1) }}
          >
            {page?.title || t('contact.title') || 'Wasiliana'}
          </h1>
          <p
            className="mt-6 max-w-2xl text-lg leading-relaxed text-gray-200 sm:text-xl"
            style={{ transform: float(-0.05) }}
          >
            {page?.subtitle || page?.body || 'Talk to our team about orders, supply, delivery, or partnerships.'}
          </p>

          {/* Quick action pills */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            {whatsappHref && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-2 rounded-full bg-[#25D366] px-6 py-3.5 font-semibold text-white shadow-lg shadow-green-900/30 transition-all hover:-translate-y-1 hover:shadow-xl"
              >
                <MessageCircle className="h-5 w-5" />
                Chat on WhatsApp
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
            )}
            {brand.phoneHref && (
              <a
                href={brand.phoneHref}
                className="flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 py-3.5 font-semibold text-white backdrop-blur transition-all hover:-translate-y-1 hover:bg-white/20"
              >
                <Phone className="h-5 w-5" />
                Call Now
              </a>
            )}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-white/60">
          <div className="h-10 w-6 rounded-full border-2 border-white/40 p-1">
            <div className="h-2 w-full animate-pulse rounded-full bg-white/70" />
          </div>
        </div>
      </section>

      {/* ========== FLOATING CONTACT METHODS (anti-gravity cards) ========== */}
      <section className="relative z-20 -mt-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {contactMethods.map((item, i) => {
            const Icon = item.icon
            const content = (
              <div
                className="group relative overflow-hidden rounded-3xl bg-white p-6 shadow-xl shadow-black/5 transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl"
                style={{
                  transform: float(0.05 + i * 0.02, i * 8),
                  transitionDelay: `${item.delay}ms`,
                }}
              >
                <div className={`mb-4 inline-flex rounded-2xl bg-gradient-to-br ${item.color} p-3.5 text-white shadow-lg`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                  {item.label}
                </h3>
                <p className="mt-1 text-lg font-bold text-gray-900 group-hover:text-[#9f2f20]">
                  {item.value}
                </p>
                {/* subtle shine on hover */}
                <div className="pointer-events-none absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-[100%]" />
              </div>
            )

            return item.href ? (
              <a key={item.label} href={item.href} target={item.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
                {content}
              </a>
            ) : (
              <div key={item.label}>{content}</div>
            )
          })}
        </div>
      </section>

      {/* ========== MAIN CONTENT ========== */}
      <section className="relative px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-[1fr_1.15fr]">
          {/* Left column – info + trust */}
          <div className="space-y-10">
            <div>
              <h2 className="text-4xl font-black tracking-tight text-gray-950 sm:text-5xl">
                {t('contact.getTouch') || 'Get in Touch'}
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                We usually reply within a few hours during business days. For urgent orders, WhatsApp is fastest.
              </p>
            </div>

            {/* Business hours + social */}
            <div className="space-y-4">
              <div className="flex items-start gap-4 rounded-2xl bg-white p-5 shadow-sm">
                <div className="rounded-xl bg-red-50 p-3">
                  <Clock className="h-6 w-6 text-[#9f2f20]" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Business</h3>
                  <p className="mt-1 text-gray-600">
                    Fresh meat supply for retail, wholesale, foodservice & export enquiries.
                  </p>
                </div>
              </div>

              {brand.socialHandle && (
                <a
                  href={`https://instagram.com/${brand.socialHandle.replace('@', '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-start gap-4 rounded-2xl bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="rounded-xl bg-pink-50 p-3">
                    <Instagram className="h-6 w-6 text-pink-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Instagram</h3>
                    <p className="mt-1 text-gray-600">{brand.socialHandle}</p>
                  </div>
                </a>
              )}
            </div>

            {/* Response time badge */}
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 px-5 py-4">
              <Headphones className="h-6 w-6 text-emerald-600" />
              <div>
                <p className="font-semibold text-emerald-900">Average response time</p>
                <p className="text-sm text-emerald-700">Under 2 hours • Mon–Sat</p>
              </div>
            </div>
          </div>

          {/* Right column – Form with floating panel */}
          <div
            ref={formRef}
            className="relative"
            style={{ transform: float(0.03) }}
          >
            <div className="gravity-panel relative overflow-hidden rounded-[2rem] bg-white p-8 shadow-2xl shadow-black/10 sm:p-10">
              {/* Decorative floating shape */}
              <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br from-red-100 to-orange-50 opacity-70 blur-2xl" />

              <h2 className="relative text-3xl font-black text-gray-950">
                {t('contact.send') || 'Send Message'}
              </h2>
              <p className="relative mt-2 text-gray-500">
                Tell us what you need — orders, partnership, or just a question.
              </p>

              {submitStatus === 'success' && (
                <div className="relative mt-8 flex items-start gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                  <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" />
                  <div>
                    <p className="font-semibold text-emerald-900">Message received!</p>
                    <p className="mt-1 text-sm text-emerald-700">
                      We’ll get back to you shortly. Check your email for a copy.
                    </p>
                  </div>
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="relative mt-8 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-800">
                  Something went wrong. Please try again or WhatsApp us.
                </div>
              )}

              <form onSubmit={handleSubmit} className="relative mt-8 space-y-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      {t('contact.name')} *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      placeholder="Your full name"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3.5 text-gray-900 outline-none transition focus:border-[#9f2f20] focus:bg-white focus:ring-4 focus:ring-red-500/10"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      {t('contact.emailLabel')} *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      placeholder="you@example.com"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3.5 text-gray-900 outline-none transition focus:border-[#9f2f20] focus:bg-white focus:ring-4 focus:ring-red-500/10"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    {t('contact.phone')}
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="07XX XXX XXX"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3.5 text-gray-900 outline-none transition focus:border-[#9f2f20] focus:bg-white focus:ring-4 focus:ring-red-500/10"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Subject *
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    placeholder="Order enquiry, Partnership, Delivery..."
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3.5 text-gray-900 outline-none transition focus:border-[#9f2f20] focus:bg-white focus:ring-4 focus:ring-red-500/10"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Images or Videos (optional)
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={(e) => setAttachments(Array.from(e.target.files || []))}
                    className="w-full rounded-xl border border-dashed border-gray-300 bg-gray-50/50 px-4 py-3 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-[#9f2f20] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[#842719]"
                  />
                  {attachments.length > 0 && (
                    <p className="mt-1.5 text-sm text-gray-500">{attachments.length} file(s) selected</p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    {t('contact.message')} *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={5}
                    placeholder="Tell us more about what you need..."
                    className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3.5 text-gray-900 outline-none transition focus:border-[#9f2f20] focus:bg-white focus:ring-4 focus:ring-red-500/10"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-[#9f2f20] px-8 py-4 text-lg font-bold text-white shadow-lg shadow-red-900/20 transition-all hover:-translate-y-1 hover:bg-[#842719] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {isSubmitting ? (
                      t('contact.sending') || 'Sending...'
                    ) : (
                      <>
                        <Send className="h-5 w-5" />
                        {t('contact.send') || 'Send Message'}
                      </>
                    )}
                  </span>
                  {/* shine effect */}
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default ContactPage