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

      <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded bg-red-600 px-5 py-3 font-bold text-white hover:bg-red-700 disabled:opacity-60">
        <Save className="h-4 w-4" />
        {saving ? 'Saving...' : 'Save Content'}
      </button>
    </div>
  )
}

export default ContentPage
