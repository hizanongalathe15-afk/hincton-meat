import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Clock, Instagram, Mail, MapPin, Phone, Send } from 'lucide-react'
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
  const { profile } = useSiteContent()
  const { t } = useLanguage()
  const brand = profile.brand
  const page = profile.pages.contact

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
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

  const contactItems = [
    { icon: Phone, label: t('contact.phone'), value: brand.phone, href: brand.phoneHref },
    { icon: Mail, label: t('contact.emailLabel'), value: brand.email, href: brand.emailHref },
    { icon: MapPin, label: t('contact.address'), value: brand.address },
    { icon: Instagram, label: 'Social', value: brand.socialHandle },
    { icon: Clock, label: 'Business', value: 'Fresh meat supply for retail, wholesale, foodservice, and export enquiries.' },
  ]

  return (
    <div className="ambient-page min-h-screen bg-white">
      <section className="gravity-hero relative overflow-hidden bg-[#333437] px-4 py-20 text-white sm:px-6 lg:px-8">
        {page?.video ? (
          <video src={resolveMediaUrl(page.video)} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover opacity-40" />
        ) : page?.image ? (
          <img src={resolveMediaUrl(page.image)} alt={page.title} className="absolute inset-0 h-full w-full object-cover opacity-40" />
        ) : null}
        <div className="absolute inset-0 bg-[#333437]/70" />
        <div className="absolute left-1/2 top-0 h-72 w-[34rem] -translate-x-1/2 rounded-b-[6rem] bg-white/10" />
        <div className="relative mx-auto max-w-7xl">
          <img src={profile.images.logo || brand.logo} alt={brand.name} className="mx-auto h-28 w-auto rounded bg-white p-2" />
          <div className="mx-auto mt-10 max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-wide text-red-300">{brand.tagline}</p>
            <h1 className="mt-4 text-5xl font-extrabold text-white">{page?.title || t('contact.title')}</h1>
            <p className="mt-6 text-lg leading-8 text-gray-200">{page?.subtitle || page?.body || profile.companyProfile}</p>
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 className="text-4xl font-extrabold text-gray-950">{t('contact.getTouch')}</h2>
            <div className="mt-8 space-y-5">
              {contactItems.map((item) => {
                const Icon = item.icon
                const content = <span className="text-gray-700">{item.value}</span>

                return (
                  <div key={item.label} className="gravity-card flex items-start gap-4 rounded-2xl bg-gray-50 p-5">
                    <div className="rounded bg-red-100 p-3">
                      <Icon className="h-6 w-6 text-[#9f2f20]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-950">{item.label}</h3>
                      {item.href ? (
                        <a href={item.href} className="text-gray-700 hover:text-[#9f2f20]">
                          {item.value}
                        </a>
                      ) : (
                        content
                      )}
                    </div>
                  </div>
                )
              })}
              {(brand.socialLinks || []).map((link) => (
                <div key={`${link.label}-${link.url}`} className="gravity-card flex items-start gap-4 rounded-2xl bg-gray-50 p-5">
                  <div className="rounded bg-red-100 p-3">
                    <Instagram className="h-6 w-6 text-[#9f2f20]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-950">{link.label}</h3>
                    <a href={link.url} target="_blank" rel="noreferrer" className="text-gray-700 hover:text-[#9f2f20]">{link.url}</a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="gravity-panel rounded-3xl bg-gray-50/75 p-6 sm:p-8">
            <h2 className="text-3xl font-extrabold text-gray-950">{t('contact.send')}</h2>

            {submitStatus === 'success' && (
              <div className="mt-6 rounded border border-green-200 bg-green-50 px-4 py-3 text-green-800">
                {t('success.messageSent')}
              </div>
            )}

            {submitStatus === 'error' && (
              <div className="mt-6 rounded border border-red-200 bg-red-50 px-4 py-3 text-red-800">
                {t('error.general')}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-700">
                    {t('contact.name')} *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
                    {t('contact.emailLabel')} *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="mb-2 block text-sm font-medium text-gray-700">
                  {t('contact.phone')}
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full rounded border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label htmlFor="attachments" className="mb-2 block text-sm font-medium text-gray-700">
                  Images or Videos
                </label>
                <input
                  type="file"
                  id="attachments"
                  multiple
                  accept="image/*,video/*"
                  onChange={(event) => setAttachments(Array.from(event.target.files || []))}
                  className="w-full rounded border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-red-500"
                />
                {attachments.length > 0 && <p className="mt-1 text-sm text-gray-500">{attachments.length} file(s) selected</p>}
              </div>

              <div>
                <label htmlFor="subject" className="mb-2 block text-sm font-medium text-gray-700">
                  Subject *
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label htmlFor="message" className="mb-2 block text-sm font-medium text-gray-700">
                  {t('contact.message')} *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  rows={6}
                  className="w-full rounded border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-red-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded bg-[#9f2f20] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#842719] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? (
                  t('contact.sending')
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    {t('contact.send')}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  )
}

export default ContactPage
