import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Send, Bug, Lightbulb, MessageSquare } from 'lucide-react'
import { useSiteContent } from '../contexts/SiteContentContext'
import toast from 'react-hot-toast'
import { contentApi } from '../services/contentApi'

const FeedbackPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    type: 'bug' as 'bug' | 'feature' | 'general',
    subject: '',
    message: '',
    screenshot: null as File | null,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { profile } = useSiteContent()
  const brand = profile.brand

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setFormData({
      ...formData,
      screenshot: file,
    })
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const data = new FormData()
      data.append('name', formData.name)
      data.append('email', formData.email)
      data.append('subject', `[${formData.type.toUpperCase()}] ${formData.subject}`)
      data.append('message', formData.message)
      data.append('category', 'feedback')
      if (formData.screenshot) {
        data.append('screenshot', formData.screenshot)
      }

      await contentApi.submitContactForm(data)
      setFormData({
        name: '',
        email: '',
        type: 'bug',
        subject: '',
        message: '',
        screenshot: null,
      })
      toast.success('Feedback sent successfully!')
    } catch (error) {
      console.error('Feedback submission error:', error)
      toast.error('Failed to send feedback. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const feedbackTypes = [
    { value: 'bug', label: 'Bug Report', icon: Bug, description: 'Report a technical issue or error' },
    { value: 'feature', label: 'Feature Request', icon: Lightbulb, description: 'Suggest a new feature or improvement' },
    { value: 'general', label: 'General Feedback', icon: MessageSquare, description: 'Share your thoughts or experience' },
  ] as const

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gray-950 px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-bold uppercase tracking-wide text-red-300">{brand.name}</p>
          <h1 className="mt-3 text-4xl font-extrabold sm:text-5xl">Send Feedback</h1>
          <p className="mt-4 max-w-3xl text-gray-300">
            Help us improve by sharing your feedback, reporting bugs, or suggesting new features.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Name</span>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Email</span>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500"
                />
              </label>
            </div>

            <div>
              <span className="text-sm font-medium text-gray-700">Feedback Type</span>
              <div className="mt-2 grid gap-3 md:grid-cols-3">
                {feedbackTypes.map((type) => (
                  <label key={type.value} className="relative">
                    <input
                      type="radio"
                      name="type"
                      value={type.value}
                      checked={formData.type === type.value}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <div className={`cursor-pointer rounded-lg border p-4 transition-colors ${
                      formData.type === type.value
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}>
                      <type.icon className={`h-6 w-6 ${
                        formData.type === type.value ? 'text-red-600' : 'text-gray-400'
                      }`} />
                      <div className="mt-2">
                        <div className={`text-sm font-medium ${
                          formData.type === type.value ? 'text-red-900' : 'text-gray-900'
                        }`}>
                          {type.label}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {type.description}
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">Subject</span>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                required
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">Message</span>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                required
                rows={6}
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500"
                placeholder="Please provide as much detail as possible..."
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">Screenshot (optional)</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="mt-1 block w-full text-sm text-gray-600 file:mr-4 file:rounded file:border-0 file:bg-red-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-red-700 hover:file:bg-red-100"
              />
              <span className="mt-1 block text-xs text-gray-500">
                Upload a screenshot to help us understand the issue better.
              </span>
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded bg-red-600 px-6 py-3 font-bold text-white hover:bg-red-700 disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
              {isSubmitting ? 'Sending...' : 'Send Feedback'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}

export default FeedbackPage