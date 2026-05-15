import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Save } from 'lucide-react'
import { contentApi } from '../services/adminApi'
import { defaultSiteProfile, SiteProfile, useSiteContent } from '../contexts/SiteContentContext'

const toLines = (values: string[]) => values.join('\n')
const fromLines = (value: string) => value.split('\n').map((line) => line.trim()).filter(Boolean)
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
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
  const [categories, setCategories] = useState<any[]>([])
  const [categoryDraft, setCategoryDraft] = useState({ name: '', description: '', image: '' })
  const [blogPosts, setBlogPosts] = useState<any[]>([])
  const [blogDraft, setBlogDraft] = useState({ title: '', excerpt: '', content: '', featuredImage: '', category: 'Updates', tags: '', isPublished: true, isFeatured: false })
  const pageKeys = ['about', 'farms', 'sustainability', 'contact', 'careers', 'wellness', 'returns', 'blog'] as const

  useEffect(() => {
    const load = async () => {
      try {
        const [data, categoriesData, blogData] = await Promise.all([
          contentApi.getSiteProfile(),
          contentApi.getCategories().catch(() => ({ categories: [] })),
          contentApi.getBlogPosts({ limit: 50 }).catch(() => ({ posts: [] })),
        ])
        const saved = data.profile || {}
        const next = {
          ...defaultSiteProfile,
          ...saved,
          brand: { ...defaultSiteProfile.brand, ...(saved.brand || {}) },
          images: { ...defaultSiteProfile.images, ...(saved.images || {}) },
          pages: { ...defaultSiteProfile.pages, ...(saved.pages || {}) },
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
        setCategories(categoriesData.categories || [])
        setBlogPosts(blogData.posts || [])
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

  const updateSocialLink = (index: number, field: 'label' | 'url', value: string) => {
    setProfile((current) => {
      const socialLinks = [...(current.brand.socialLinks || [])]
      socialLinks[index] = { ...socialLinks[index], [field]: value }
      return { ...current, brand: { ...current.brand, socialLinks } }
    })
  }

  const addSocialLink = () => {
    setProfile((current) => ({
      ...current,
      brand: { ...current.brand, socialLinks: [...(current.brand.socialLinks || []), { label: '', url: '' }] }
    }))
  }

  const removeSocialLink = (index: number) => {
    setProfile((current) => ({
      ...current,
      brand: { ...current.brand, socialLinks: (current.brand.socialLinks || []).filter((_, i) => i !== index) }
    }))
  }

  const updateImage = (key: keyof SiteProfile['images'], value: string) => {
    setProfile((current) => ({ ...current, images: { ...current.images, [key]: value } }))
  }

  const updatePage = (key: string, field: 'title' | 'subtitle' | 'body' | 'image' | 'video', value: string) => {
    setProfile((current) => ({
      ...current,
      pages: {
        ...current.pages,
        [key]: { ...(current.pages[key] || defaultSiteProfile.pages.about), [field]: value },
      },
    }))
  }

  const updatePageSection = (pageKey: string, index: number, field: 'title' | 'body' | 'image' | 'video' | 'linkLabel' | 'linkUrl', value: string) => {
    setProfile((current) => {
      const page = current.pages[pageKey] || defaultSiteProfile.pages.about
      const sections = [...(page.sections || [])]
      sections[index] = { ...sections[index], [field]: value }
      return { ...current, pages: { ...current.pages, [pageKey]: { ...page, sections } } }
    })
  }

  const addPageSection = (pageKey: string) => {
    setProfile((current) => {
      const page = current.pages[pageKey] || defaultSiteProfile.pages.about
      return {
        ...current,
        pages: { ...current.pages, [pageKey]: { ...page, sections: [...(page.sections || []), { title: '', body: '' }] } },
      }
    })
  }

  const removePageSection = (pageKey: string, index: number) => {
    setProfile((current) => {
      const page = current.pages[pageKey] || defaultSiteProfile.pages.about
      return {
        ...current,
        pages: { ...current.pages, [pageKey]: { ...page, sections: (page.sections || []).filter((_, i) => i !== index) } },
      }
    })
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

  const uploadPageMedia = async (pageKey: string, field: 'image' | 'video', file?: File) => {
    if (!file) return
    try {
      const data = await contentApi.uploadContentImage(file)
      updatePage(pageKey, field, data.url)
      toast.success('Media uploaded')
    } catch {
      toast.error('Could not upload media')
    }
  }

  const createCategory = async () => {
    const name = categoryDraft.name.trim()
    if (!name) return
    try {
      const data = await contentApi.createCategory({
        name,
        slug: slugify(name),
        description: categoryDraft.description,
        image: categoryDraft.image || undefined,
        isActive: true,
      })
      setCategories((current) => [data.category, ...current].sort((a, b) => a.name.localeCompare(b.name)))
      setCategoryDraft({ name: '', description: '', image: '' })
      toast.success('Category added')
    } catch {
      toast.error('Could not add category')
    }
  }

  const updateCategory = async (category: any) => {
    try {
      await contentApi.updateCategory(category.id, {
        name: category.name,
        slug: category.slug || slugify(category.name),
        description: category.description || '',
        image: category.image || undefined,
        isActive: category.isActive,
      })
      toast.success('Category updated')
    } catch {
      toast.error('Could not update category')
    }
  }

  const archiveCategory = async (categoryId: string) => {
    try {
      await contentApi.deleteCategory(categoryId)
      setCategories((current) => current.filter((category) => category.id !== categoryId))
      toast.success('Category archived')
    } catch {
      toast.error('Could not archive category')
    }
  }

  const saveBlogPost = async () => {
    if (!blogDraft.title.trim() || !blogDraft.content.trim()) {
      toast.error('Blog title and content are required')
      return
    }
    try {
      const data = await contentApi.createBlogPost({
        title: blogDraft.title.trim(),
        slug: slugify(blogDraft.title),
        excerpt: blogDraft.excerpt.trim(),
        content: blogDraft.content,
        featuredImage: blogDraft.featuredImage.trim() || undefined,
        category: blogDraft.category.trim() || 'Updates',
        tags: fromLines(blogDraft.tags.replace(/,/g, '\n')),
        isPublished: blogDraft.isPublished,
        isFeatured: blogDraft.isFeatured,
      })
      setBlogPosts((current) => [data.post, ...current])
      setBlogDraft({ title: '', excerpt: '', content: '', featuredImage: '', category: 'Updates', tags: '', isPublished: true, isFeatured: false })
      toast.success('Blog post saved')
    } catch {
      toast.error('Could not save blog post')
    }
  }

  const deleteBlogPost = async (id: string) => {
    try {
      await contentApi.deleteBlogPost(id)
      setBlogPosts((current) => current.filter((post) => post.id !== id))
      toast.success('Blog post deleted')
    } catch {
      toast.error('Could not delete blog post')
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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-950">Social Links</h2>
            <p className="mt-1 text-sm text-gray-600">Edit the real social links shown on the public site.</p>
          </div>
          <button type="button" onClick={addSocialLink} className="rounded bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200">Add Link</button>
        </div>
        <div className="mt-5 space-y-3">
          {(profile.brand.socialLinks || []).map((link, index) => (
            <div key={index} className="grid gap-3 md:grid-cols-[14rem_1fr_auto]">
              <input value={link.label} onChange={(event) => updateSocialLink(index, 'label', event.target.value)} placeholder="Instagram" className="rounded border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500" />
              <input value={link.url} onChange={(event) => updateSocialLink(index, 'url', event.target.value)} placeholder="https://..." className="rounded border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500" />
              <button type="button" onClick={() => removeSocialLink(index)} className="rounded border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">Remove</button>
            </div>
          ))}
          {!(profile.brand.socialLinks || []).length && <p className="text-sm text-gray-500">No social links yet.</p>}
        </div>
      </section>

      <section className="rounded bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-950">Product Categories</h2>
        <p className="mt-1 text-sm text-gray-600">Categories are not fixed to meat. Add anything the business sells: utensils, cars, services, bundles, or future product lines.</p>
        <div className="mt-5 grid gap-3 md:grid-cols-[14rem_1fr_1fr_auto]">
          <input value={categoryDraft.name} onChange={(event) => setCategoryDraft((current) => ({ ...current, name: event.target.value }))} placeholder="Category name" className="rounded border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500" />
          <input value={categoryDraft.description} onChange={(event) => setCategoryDraft((current) => ({ ...current, description: event.target.value }))} placeholder="Description" className="rounded border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500" />
          <input value={categoryDraft.image} onChange={(event) => setCategoryDraft((current) => ({ ...current, image: event.target.value }))} placeholder="Image URL or uploaded path" className="rounded border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500" />
          <button type="button" onClick={createCategory} className="rounded bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700">Add Category</button>
        </div>
        <div className="mt-5 space-y-3">
          {categories.map((category) => (
            <div key={category.id} className="rounded border border-gray-200 p-4">
              <div className="grid gap-3 md:grid-cols-[14rem_1fr_1fr_auto_auto]">
                <input value={category.name || ''} onChange={(event) => setCategories((current) => current.map((item) => item.id === category.id ? { ...item, name: event.target.value, slug: slugify(event.target.value) } : item))} className="rounded border border-gray-300 px-3 py-2" />
                <input value={category.description || ''} onChange={(event) => setCategories((current) => current.map((item) => item.id === category.id ? { ...item, description: event.target.value } : item))} placeholder="Description" className="rounded border border-gray-300 px-3 py-2" />
                <input value={category.image || ''} onChange={(event) => setCategories((current) => current.map((item) => item.id === category.id ? { ...item, image: event.target.value } : item))} placeholder="Image" className="rounded border border-gray-300 px-3 py-2" />
                <button type="button" onClick={() => updateCategory(category)} className="rounded bg-gray-900 px-3 py-2 text-sm font-semibold text-white">Save</button>
                <button type="button" onClick={() => archiveCategory(category.id)} className="rounded border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">Archive</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-950">Editable Public Pages</h2>
        <p className="mt-1 text-sm text-gray-600">Edit copy, images, videos, and sections for About, Farms, Sustainability, Contact, Careers, Blog, Wellness, and Returns.</p>
        <div className="mt-5 space-y-6">
          {pageKeys.map((key) => {
            const page = profile.pages[key] || defaultSiteProfile.pages[key]
            return (
              <div key={key} className="rounded border border-gray-200 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-base font-bold capitalize text-gray-950">{key}</h3>
                  <button type="button" onClick={() => addPageSection(key)} className="rounded bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200">Add Section</button>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <input value={page.title} onChange={(event) => updatePage(key, 'title', event.target.value)} placeholder="Page title" className="rounded border border-gray-300 px-3 py-2" />
                  <input value={page.subtitle} onChange={(event) => updatePage(key, 'subtitle', event.target.value)} placeholder="Subtitle" className="rounded border border-gray-300 px-3 py-2" />
                  <input value={page.image} onChange={(event) => updatePage(key, 'image', event.target.value)} placeholder="Hero image URL" className="rounded border border-gray-300 px-3 py-2" />
                  <input value={page.video || ''} onChange={(event) => updatePage(key, 'video', event.target.value)} placeholder="Optional hero video URL" className="rounded border border-gray-300 px-3 py-2" />
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <input type="file" accept="image/*" onChange={(event) => uploadPageMedia(key, 'image', event.target.files?.[0])} className="text-sm text-gray-600" />
                  <input type="file" accept="video/*" onChange={(event) => uploadPageMedia(key, 'video', event.target.files?.[0])} className="text-sm text-gray-600" />
                </div>
                <textarea value={page.body} onChange={(event) => updatePage(key, 'body', event.target.value)} rows={4} placeholder="Page body" className="mt-3 w-full rounded border border-gray-300 px-3 py-2" />
                <div className="mt-4 space-y-3">
                  {(page.sections || []).map((section, index) => (
                    <div key={index} className="rounded bg-gray-50 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-700">Section {index + 1}</span>
                        <button type="button" onClick={() => removePageSection(key, index)} className="text-sm font-semibold text-red-700">Remove</button>
                      </div>
                      <div className="grid gap-2 md:grid-cols-2">
                        <input value={section.title} onChange={(event) => updatePageSection(key, index, 'title', event.target.value)} placeholder="Section title" className="rounded border border-gray-300 px-3 py-2" />
                        <input value={section.image || ''} onChange={(event) => updatePageSection(key, index, 'image', event.target.value)} placeholder="Image URL" className="rounded border border-gray-300 px-3 py-2" />
                        <input value={section.video || ''} onChange={(event) => updatePageSection(key, index, 'video', event.target.value)} placeholder="Video URL" className="rounded border border-gray-300 px-3 py-2" />
                        <input value={section.linkUrl || ''} onChange={(event) => updatePageSection(key, index, 'linkUrl', event.target.value)} placeholder="Optional link URL" className="rounded border border-gray-300 px-3 py-2" />
                      </div>
                      <textarea value={section.body || ''} onChange={(event) => updatePageSection(key, index, 'body', event.target.value)} rows={3} placeholder="Section body" className="mt-2 w-full rounded border border-gray-300 px-3 py-2" />
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="rounded bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-950">Blog Posts</h2>
        <p className="mt-1 text-sm text-gray-600">Create real backend blog posts with images, categories, tags, and Read More pages.</p>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <input value={blogDraft.title} onChange={(event) => setBlogDraft((current) => ({ ...current, title: event.target.value }))} placeholder="Post title" className="rounded border border-gray-300 px-3 py-2" />
          <input value={blogDraft.category} onChange={(event) => setBlogDraft((current) => ({ ...current, category: event.target.value }))} placeholder="Category" className="rounded border border-gray-300 px-3 py-2" />
          <input value={blogDraft.featuredImage} onChange={(event) => setBlogDraft((current) => ({ ...current, featuredImage: event.target.value }))} placeholder="Featured image URL or uploaded path" className="rounded border border-gray-300 px-3 py-2" />
          <input value={blogDraft.tags} onChange={(event) => setBlogDraft((current) => ({ ...current, tags: event.target.value }))} placeholder="Tags, comma separated" className="rounded border border-gray-300 px-3 py-2" />
        </div>
        <div className="mt-3">
          <input type="file" accept="image/*" onChange={async (event) => {
            const file = event.target.files?.[0]
            if (!file) return
            const data = await contentApi.uploadContentImage(file)
            setBlogDraft((current) => ({ ...current, featuredImage: data.url }))
          }} className="text-sm text-gray-600" />
        </div>
        <textarea value={blogDraft.excerpt} onChange={(event) => setBlogDraft((current) => ({ ...current, excerpt: event.target.value }))} rows={2} placeholder="Excerpt" className="mt-3 w-full rounded border border-gray-300 px-3 py-2" />
        <textarea value={blogDraft.content} onChange={(event) => setBlogDraft((current) => ({ ...current, content: event.target.value }))} rows={7} placeholder="Full post content" className="mt-3 w-full rounded border border-gray-300 px-3 py-2" />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={blogDraft.isPublished} onChange={(event) => setBlogDraft((current) => ({ ...current, isPublished: event.target.checked }))} /> Published</label>
            <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={blogDraft.isFeatured} onChange={(event) => setBlogDraft((current) => ({ ...current, isFeatured: event.target.checked }))} /> Featured</label>
          </div>
          <button type="button" onClick={saveBlogPost} className="rounded bg-red-600 px-5 py-2 text-sm font-bold text-white hover:bg-red-700">Publish Post</button>
        </div>
        <div className="mt-6 space-y-3">
          {blogPosts.map((post) => (
            <div key={post.id} className="flex items-center justify-between rounded border border-gray-200 p-4">
              <div>
                <p className="font-semibold text-gray-950">{post.title}</p>
                <p className="text-sm text-gray-500">{post.category || 'Blog'} · {post.status || (post.isPublished ? 'PUBLISHED' : 'DRAFT')}</p>
              </div>
              <button type="button" onClick={() => deleteBlogPost(post.id)} className="rounded border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">Delete</button>
            </div>
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
