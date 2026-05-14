import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Save } from 'lucide-react'
import { contentApi } from '../services/adminApi'
import { defaultSiteProfile, SiteProfile, useSiteContent } from '../contexts/SiteContentContext'

const toLines = (values: string[]) => values.join('\n')
const fromLines = (value: string) => value.split('\n').map((line) => line.trim()).filter(Boolean)
const copyLabels: Record<'companyProfile' | 'mission' | 'vision' | 'procurementCommitment', string> = {
  companyProfile: 'Hero intro paragraph',
  mission: 'Mission',
  vision: 'Vision',
  procurementCommitment: 'Procurement commitment',
}

const ContentPage = () => {
  const { refresh } = useSiteContent()
  const [profile, setProfile] = useState<SiteProfile>(defaultSiteProfile)
  const [marketsText, setMarketsText] = useState(toLines(defaultSiteProfile.markets))
  const [qualityText, setQualityText] = useState(toLines(defaultSiteProfile.qualityPoints))
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await contentApi.getSiteProfile()
        const saved = data.profile || {}
        const next = {
          ...defaultSiteProfile,
          ...saved,
          brand: { ...defaultSiteProfile.brand, ...(saved.brand || {}) },
          images: { ...defaultSiteProfile.images, ...(saved.images || {}) },
          markets: saved.markets || defaultSiteProfile.markets,
          qualityPoints: saved.qualityPoints || defaultSiteProfile.qualityPoints,
          terms: saved.terms || defaultSiteProfile.terms,
          privacy: saved.privacy || defaultSiteProfile.privacy,
          helpCenter: {
            ...defaultSiteProfile.helpCenter,
            ...(saved.helpCenter || {}),
            faqs: saved.helpCenter?.faqs || defaultSiteProfile.helpCenter.faqs,
            guides: saved.helpCenter?.guides || defaultSiteProfile.helpCenter.guides,
          },
          appInfo: { ...defaultSiteProfile.appInfo, ...(saved.appInfo || {}) },
        }
        setProfile(next)
        setMarketsText(toLines(next.markets))
        setQualityText(toLines(next.qualityPoints))
      } catch {
        toast.error('Could not load editable content')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const updateBrand = (key: keyof SiteProfile['brand'], value: string) => {
    setProfile((current) => ({ ...current, brand: { ...current.brand, [key]: value } }))
  }

  const updateImage = (key: keyof SiteProfile['images'], value: string) => {
    setProfile((current) => ({ ...current, images: { ...current.images, [key]: value } }))
  }

  const updateTerms = (index: number, field: 'title' | 'body', value: string) => {
    setProfile((current) => ({
      ...current,
      terms: current.terms.map((section, i) => i === index ? { ...section, [field]: value } : section)
    }))
  }

  const updatePrivacy = (index: number, field: 'title' | 'body', value: string) => {
    setProfile((current) => ({
      ...current,
      privacy: current.privacy.map((section, i) => i === index ? { ...section, [field]: value } : section)
    }))
  }

  const updateFaq = (index: number, field: 'question' | 'answer' | 'category', value: string) => {
    setProfile((current) => ({
      ...current,
      helpCenter: {
        ...current.helpCenter,
        faqs: current.helpCenter.faqs.map((faq, i) => i === index ? { ...faq, [field]: value } : faq)
      }
    }))
  }

  const updateGuide = (index: number, field: 'title' | 'content' | 'category', value: string) => {
    setProfile((current) => ({
      ...current,
      helpCenter: {
        ...current.helpCenter,
        guides: current.helpCenter.guides.map((guide, i) => i === index ? { ...guide, [field]: value } : guide)
      }
    }))
  }

  const updateAppInfo = (key: keyof SiteProfile['appInfo'], value: string | string[]) => {
    setProfile((current) => ({ ...current, appInfo: { ...current.appInfo, [key]: value } }))
  }

  const addTermsSection = () => {
    setProfile((current) => ({
      ...current,
      terms: [...current.terms, { title: '', body: '' }]
    }))
  }

  const addPrivacySection = () => {
    setProfile((current) => ({
      ...current,
      privacy: [...current.privacy, { title: '', body: '' }]
    }))
  }

  const removeTermsSection = (index: number) => {
    setProfile((current) => ({
      ...current,
      terms: current.terms.filter((_, i) => i !== index)
    }))
  }

  const removePrivacySection = (index: number) => {
    setProfile((current) => ({
      ...current,
      privacy: current.privacy.filter((_, i) => i !== index)
    }))
  }

  const addFaq = () => {
    setProfile((current) => ({ ...current, helpCenter: { ...current.helpCenter, faqs: [...current.helpCenter.faqs, { question: '', answer: '', category: 'general' }] } }))
  }

  const removeFaq = (index: number) => {
    setProfile((current) => ({ ...current, helpCenter: { ...current.helpCenter, faqs: current.helpCenter.faqs.filter((_, i) => i !== index) } }))
  }

  const addGuide = () => {
    setProfile((current) => ({ ...current, helpCenter: { ...current.helpCenter, guides: [...current.helpCenter.guides, { title: '', content: '', category: 'general' }] } }))
  }

  const removeGuide = (index: number) => {
    setProfile((current) => ({ ...current, helpCenter: { ...current.helpCenter, guides: current.helpCenter.guides.filter((_, i) => i !== index) } }))
  }

  const uploadImage = async (key: keyof SiteProfile['images'], file?: File) => {
    if (!file) return
    try {
      const data = await contentApi.uploadContentImage(file)
      updateImage(key, data.url)
      toast.success('Image uploaded')
    } catch {
      toast.error('Could not upload image')
    }
  }

  const save = async () => {
    setSaving(true)
    try {
      const payload = {
        ...profile,
        markets: fromLines(marketsText),
        qualityPoints: fromLines(qualityText),
      }
      await contentApi.updateSiteProfile(payload)
      setProfile(payload)
      await refresh()
      toast.success('Site content updated')
    } catch {
      toast.error('Could not save site content')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-6 text-gray-600">Loading content...</div>
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-950">Site Content</h1>
        <p className="mt-1 text-gray-600">Update public brand, home, about, and contact content from one place.</p>
      </div>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded bg-red-600 px-5 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Content'}
        </button>
      </div>

      <section className="rounded bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-950">Brand and Contact</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {(['name', 'tagline', 'mantra', 'website', 'phone', 'phoneHref', 'email', 'emailHref', 'address', 'socialHandle', 'logo'] as const).map((key) => (
            <label key={key} className="block">
              <span className="text-sm font-medium capitalize text-gray-700">{key}</span>
              <input
                value={profile.brand[key] || ''}
                onChange={(event) => updateBrand(key, event.target.value)}
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500"
              />
            </label>
          ))}
        </div>
      </section>

      <section className="rounded bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-950">Help Center</h2>
        <p className="mt-1 text-sm text-gray-600">These FAQs and guides power the public help page.</p>
        <div className="mt-5 space-y-4">
          <h3 className="text-sm font-bold uppercase text-gray-500">FAQs</h3>
          {profile.helpCenter.faqs.map((faq, index) => (
            <div key={index} className="rounded border border-gray-200 p-4">
              <div className="mb-3 flex items-start justify-between">
                <span className="text-sm font-medium text-gray-700">FAQ {index + 1}</span>
                <button type="button" onClick={() => removeFaq(index)} className="text-sm text-red-600 hover:text-red-800">Remove</button>
              </div>
              <div className="grid gap-3 md:grid-cols-[1fr_12rem]">
                <input value={faq.question} onChange={(event) => updateFaq(index, 'question', event.target.value)} placeholder="Question" className="rounded border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500" />
                <input value={faq.category} onChange={(event) => updateFaq(index, 'category', event.target.value)} placeholder="Category" className="rounded border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500" />
              </div>
              <textarea value={faq.answer} onChange={(event) => updateFaq(index, 'answer', event.target.value)} rows={3} placeholder="Answer" className="mt-3 w-full rounded border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500" />
            </div>
          ))}
          <button type="button" onClick={addFaq} className="rounded bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">Add FAQ</button>

          <h3 className="pt-4 text-sm font-bold uppercase text-gray-500">Guides</h3>
          {profile.helpCenter.guides.map((guide, index) => (
            <div key={index} className="rounded border border-gray-200 p-4">
              <div className="mb-3 flex items-start justify-between">
                <span className="text-sm font-medium text-gray-700">Guide {index + 1}</span>
                <button type="button" onClick={() => removeGuide(index)} className="text-sm text-red-600 hover:text-red-800">Remove</button>
              </div>
              <div className="grid gap-3 md:grid-cols-[1fr_12rem]">
                <input value={guide.title} onChange={(event) => updateGuide(index, 'title', event.target.value)} placeholder="Title" className="rounded border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500" />
                <input value={guide.category} onChange={(event) => updateGuide(index, 'category', event.target.value)} placeholder="Category" className="rounded border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500" />
              </div>
              <textarea value={guide.content} onChange={(event) => updateGuide(index, 'content', event.target.value)} rows={3} placeholder="Guide content" className="mt-3 w-full rounded border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500" />
            </div>
          ))}
          <button type="button" onClick={addGuide} className="rounded bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">Add Guide</button>
        </div>
      </section>

      <section className="rounded bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-950">App Info, Reports, and Notices</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {(['version', 'build', 'platform', 'lastUpdated', 'developerContact'] as const).map((key) => (
            <label key={key} className="block">
              <span className="text-sm font-medium text-gray-700">{key}</span>
              <input value={profile.appInfo[key]} onChange={(event) => updateAppInfo(key, event.target.value)} className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500" />
            </label>
          ))}
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {(['features', 'permissions', 'legalNotices', 'channelReports'] as const).map((key) => (
            <label key={key} className="block">
              <span className="text-sm font-medium text-gray-700">{key}, one per line</span>
              <textarea value={toLines(profile.appInfo[key])} onChange={(event) => updateAppInfo(key, fromLines(event.target.value))} rows={5} className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500" />
            </label>
          ))}
        </div>
      </section>

      <section className="rounded bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-950">Page Copy</h2>
        <div className="mt-5 grid gap-4">
          {(['companyProfile', 'mission', 'vision', 'procurementCommitment'] as const).map((key) => (
            <label key={key} className="block">
              <span className="text-sm font-medium text-gray-700">{copyLabels[key]}</span>
              <textarea
                value={profile[key]}
                onChange={(event) => setProfile((current) => ({ ...current, [key]: event.target.value }))}
                rows={key === 'companyProfile' ? 4 : 3}
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500"
              />
              {key === 'companyProfile' && (
                <span className="mt-1 block text-xs text-gray-500">This text appears in the home hero and animates with a typewriter effect.</span>
              )}
            </label>
          ))}
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Markets, one per line</span>
            <textarea value={marketsText} onChange={(event) => setMarketsText(event.target.value)} rows={4} className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Quality points, one per line</span>
            <textarea value={qualityText} onChange={(event) => setQualityText(event.target.value)} rows={4} className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500" />
          </label>
        </div>
      </section>

      <section className="rounded bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-950">Page Images</h2>
        <p className="mt-1 text-sm text-gray-600">Use an uploaded image URL such as `/uploads/products/image-name.jpg` or any existing public asset path.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {(['logo', 'hero', 'about', 'market'] as const).map((key) => (
            <label key={key} className="block">
              <span className="text-sm font-medium capitalize text-gray-700">{key} image</span>
              <input value={profile.images[key]} onChange={(event) => updateImage(key, event.target.value)} className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500" />
              <input type="file" accept="image/*" onChange={(event) => uploadImage(key, event.target.files?.[0])} className="mt-2 block w-full text-sm text-gray-600" />
            </label>
          ))}
        </div>
      </section>

      <section className="rounded bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-950">Terms and Conditions</h2>
        <div className="mt-5 space-y-4">
          {profile.terms.map((section, index) => (
            <div key={index} className="rounded border border-gray-200 p-4">
              <div className="flex justify-between items-start mb-3">
                <span className="text-sm font-medium text-gray-700">Section {index + 1}</span>
                <button
                  onClick={() => removeTermsSection(index)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Remove
                </button>
              </div>
              <label className="block mb-3">
                <span className="text-sm font-medium text-gray-700">Title</span>
                <input
                  value={section.title}
                  onChange={(e) => updateTerms(index, 'title', e.target.value)}
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Content</span>
                <textarea
                  value={section.body}
                  onChange={(e) => updateTerms(index, 'body', e.target.value)}
                  rows={4}
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500"
                />
              </label>
            </div>
          ))}
          <button
            onClick={addTermsSection}
            className="rounded bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            Add Section
          </button>
        </div>
      </section>

      <section className="rounded bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-950">Privacy Policy</h2>
        <div className="mt-5 space-y-4">
          {profile.privacy.map((section, index) => (
            <div key={index} className="rounded border border-gray-200 p-4">
              <div className="flex justify-between items-start mb-3">
                <span className="text-sm font-medium text-gray-700">Section {index + 1}</span>
                <button
                  onClick={() => removePrivacySection(index)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Remove
                </button>
              </div>
              <label className="block mb-3">
                <span className="text-sm font-medium text-gray-700">Title</span>
                <input
                  value={section.title}
                  onChange={(e) => updatePrivacy(index, 'title', e.target.value)}
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Content</span>
                <textarea
                  value={section.body}
                  onChange={(e) => updatePrivacy(index, 'body', e.target.value)}
                  rows={4}
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500"
                />
              </label>
            </div>
          ))}
          <button
            onClick={addPrivacySection}
            className="rounded bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            Add Section
          </button>
        </div>
      </section>
    </div>
  )
}

export default ContentPage
