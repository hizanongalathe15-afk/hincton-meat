import { type DragEvent, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Save, Trash2, Upload, X, Copyright, SlidersHorizontal, Wallet, Shield, Gamepad2, SearchCheck, Megaphone } from 'lucide-react'
import { contentApi, settingsApi } from '../services/adminApi'
import { defaultSiteProfile, SiteProfile, useSiteContent } from '../contexts/SiteContentContext'
import { getEmbedVideoUrl, isDirectVideoUrl, resolveMediaUrl } from '../services/api'
import { buildCopyrightText } from '../utils/copyright'

const toLines = (values: string[]) => values.join('\n')
const fromLines = (value: string) => value.split('\n').map((line) => line.trim()).filter(Boolean)
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
const copyLabels: Record<'companyProfile' | 'mission' | 'vision' | 'procurementCommitment', string> = {
  companyProfile: 'Hero intro paragraph',
  mission: 'Mission',
  vision: 'Vision',
  procurementCommitment: 'Procurement commitment',
}

const renderMediaPreview = (url: string, type: 'image' | 'video') => {
  const mediaUrl = resolveMediaUrl(url)
  const embedUrl = type === 'video' ? getEmbedVideoUrl(mediaUrl) : ''

  if (!mediaUrl) return null
  if (type === 'video' && embedUrl) {
    return <iframe src={embedUrl} title="Media preview" className="h-44 w-full rounded object-cover" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
  }
  if (type === 'video' && isDirectVideoUrl(mediaUrl)) {
    return <video src={mediaUrl} controls className="h-44 w-full rounded object-cover" />
  }
  return <img src={mediaUrl} alt="" className="h-44 w-full rounded object-cover" />
}

const ContentPage = () => {
  const { refresh } = useSiteContent()
  const [profile, setProfile] = useState<SiteProfile>(defaultSiteProfile)
  const [marketsText, setMarketsText] = useState(toLines(defaultSiteProfile.markets))
  const [qualityText, setQualityText] = useState(toLines(defaultSiteProfile.qualityPoints))
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [categoryDraft, setCategoryDraft] = useState({ name: '', description: '', image: '' })
  const [blogPosts, setBlogPosts] = useState<any[]>([])
  const [blogDraft, setBlogDraft] = useState({ title: '', excerpt: '', content: '', featuredImage: '', category: 'Updates', tags: '', isPublished: true, isFeatured: false })
  const [seoKeywordDraft, setSeoKeywordDraft] = useState('')
  const pageKeys = ['about', 'farms', 'provenance', 'sustainability', 'contact', 'careers', 'wellness', 'returns', 'maintenance', 'downloadThankYou', 'blog'] as const
  const pageLabels: Record<typeof pageKeys[number], string> = {
    about: 'About Us',
    farms: 'Farms',
    provenance: 'Reviews & Provenance',
    sustainability: 'Sustainability',
    contact: 'Contact',
    careers: 'Careers',
    wellness: 'Wellness',
    returns: 'Returns',
    maintenance: 'Maintenance Page',
    downloadThankYou: 'Download Thank You',
    blog: 'Blog',
  }

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
          footer: { ...defaultSiteProfile.footer, ...(saved.footer || {}) },
          featureToggles: { ...defaultSiteProfile.featureToggles, ...(saved.featureToggles || {}) },
          payments: {
            bnpl: saved.payments?.bnpl ?? defaultSiteProfile.payments.bnpl,
            digitalWallets: saved.payments?.digitalWallets ?? defaultSiteProfile.payments.digitalWallets,
            crypto: saved.payments?.crypto ?? defaultSiteProfile.payments.crypto,
          },
          trust: {
            ...defaultSiteProfile.trust,
            ...(saved.trust || {}),
            badges: saved.trust?.badges ?? defaultSiteProfile.trust.badges,
            sustainability: saved.trust?.sustainability ?? defaultSiteProfile.trust.sustainability,
          },
          gamification: {
            ...defaultSiteProfile.gamification,
            ...(saved.gamification || {}),
            loyaltyBadgeThresholds: saved.gamification?.loyaltyBadgeThresholds ?? defaultSiteProfile.gamification.loyaltyBadgeThresholds,
          },
          seo: { ...defaultSiteProfile.seo, ...(saved.seo || {}) },
          newsletter: { ...defaultSiteProfile.newsletter, ...(saved.newsletter || {}) },
          currencies: saved.currencies ?? defaultSiteProfile.currencies,
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

  const addHeroSlides = async (files?: FileList | File[] | null) => {
    const selected = Array.from(files || [])
    if (!selected.length) return
    try {
      const uploads = await Promise.all(selected.map((file) => contentApi.uploadContentImage(file)))
      const slides = uploads.map((item) => item.url).filter(Boolean).map((image) => ({ image, alt: '' }))
      setProfile((current) => ({ ...current, heroSlides: [...current.heroSlides, ...slides] }))
      toast.success(`${slides.length} hero image${slides.length === 1 ? '' : 's'} added`)
    } catch { toast.error('Could not upload hero images') }
  }

  const removeHeroSlide = (index: number) => setProfile((current) => ({ ...current, heroSlides: current.heroSlides.filter((_, i) => i !== index) }))

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

  const appendPageMediaSections = (pageKey: string, field: 'image' | 'video', urls: string[]) => {
    if (!urls.length) return
    setProfile((current) => {
      const page = current.pages[pageKey] || defaultSiteProfile.pages.about
      const sections = [
        ...(page.sections || []),
        ...urls.map((url) => ({
          title: '',
          body: '',
          [field]: url,
        })),
      ]
      return { ...current, pages: { ...current.pages, [pageKey]: { ...page, sections } } }
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

  const updateFooter = (key: keyof SiteProfile['footer'], value: any) => {
    setProfile((current) => ({
      ...current,
      footer: { ...current.footer, [key]: value },
    }))
  }

  const previewCopyright = buildCopyrightText(profile.footer, profile.brand.name)

  const updateFeatureToggle = (key: string, value: boolean | number | string) => {
    setProfile((current) => ({ ...current, featureToggles: { ...current.featureToggles, [key]: value } }))
  }

  const updateBnpl = (index: number, key: 'code' | 'label' | 'enabled' | 'description' | 'learnMoreUrl', value: string | boolean) => {
    setProfile((current) => ({
      ...current,
      payments: {
        ...current.payments,
        bnpl: current.payments.bnpl.map((item, i) => i === index ? { ...item, [key]: value } : item),
      },
    }))
  }

  const addBnpl = () => {
    setProfile((current) => ({
      ...current,
      payments: {
        ...current.payments,
        bnpl: [...current.payments.bnpl, { code: '', label: '', enabled: false, description: '', learnMoreUrl: '' }],
      },
    }))
  }

  const removeBnpl = (index: number) => {
    setProfile((current) => ({
      ...current,
      payments: {
        ...current.payments,
        bnpl: current.payments.bnpl.filter((_, i) => i !== index),
      },
    }))
  }

  const updateDigitalWallet = (index: number, key: 'code' | 'label' | 'enabled', value: string | boolean) => {
    setProfile((current) => ({
      ...current,
      payments: {
        ...current.payments,
        digitalWallets: current.payments.digitalWallets.map((item, i) => i === index ? { ...item, [key]: value } : item),
      },
    }))
  }

  const addDigitalWallet = () => {
    setProfile((current) => ({
      ...current,
      payments: {
        ...current.payments,
        digitalWallets: [...current.payments.digitalWallets, { code: '', label: '', enabled: false }],
      },
    }))
  }

  const removeDigitalWallet = (index: number) => {
    setProfile((current) => ({
      ...current,
      payments: {
        ...current.payments,
        digitalWallets: current.payments.digitalWallets.filter((_, i) => i !== index),
      },
    }))
  }

  const updateCrypto = (index: number, key: 'code' | 'label' | 'enabled' | 'walletAddress', value: string | boolean) => {
    setProfile((current) => ({
      ...current,
      payments: {
        ...current.payments,
        crypto: current.payments.crypto.map((item, i) => i === index ? { ...item, [key]: value } : item),
      },
    }))
  }

  const addCrypto = () => {
    setProfile((current) => ({
      ...current,
      payments: {
        ...current.payments,
        crypto: [...current.payments.crypto, { code: '', label: '', enabled: false, walletAddress: '' }],
      },
    }))
  }

  const removeCrypto = (index: number) => {
    setProfile((current) => ({
      ...current,
      payments: {
        ...current.payments,
        crypto: current.payments.crypto.filter((_, i) => i !== index),
      },
    }))
  }

  const updateTrustBadge = (index: number, key: 'code' | 'label' | 'description', value: string) => {
    setProfile((current) => ({
      ...current,
      trust: {
        ...current.trust,
        badges: current.trust.badges.map((item, i) => i === index ? { ...item, [key]: value } : item),
      },
    }))
  }

  const addTrustBadge = () => {
    setProfile((current) => ({
      ...current,
      trust: {
        ...current.trust,
        badges: [...current.trust.badges, { code: '', label: '', description: '' }],
      },
    }))
  }

  const removeTrustBadge = (index: number) => {
    setProfile((current) => ({
      ...current,
      trust: {
        ...current.trust,
        badges: current.trust.badges.filter((_, i) => i !== index),
      },
    }))
  }

  const updateSustainability = (index: number, key: 'code' | 'label' | 'icon', value: string) => {
    setProfile((current) => ({
      ...current,
      trust: {
        ...current.trust,
        sustainability: current.trust.sustainability.map((item, i) => i === index ? { ...item, [key]: value } : item),
      },
    }))
  }

  const addSustainability = () => {
    setProfile((current) => ({
      ...current,
      trust: {
        ...current.trust,
        sustainability: [...current.trust.sustainability, { code: '', label: '', icon: '' }],
      },
    }))
  }

  const removeSustainability = (index: number) => {
    setProfile((current) => ({
      ...current,
      trust: {
        ...current.trust,
        sustainability: current.trust.sustainability.filter((_, i) => i !== index),
      },
    }))
  }

  const updateTrust = (key: 'viewCounterWindowMinutes' | 'recentPurchaseWindowHours' | 'socialProofMode', value: number | string) => {
    setProfile((current) => ({ ...current, trust: { ...current.trust, [key]: value } }))
  }

  const updateGamification = (key: 'welcomePoints' | 'pointsPerOrder' | 'pointsPerReview' | 'pointsPerReferral' | 'spinWinDailyLimit', value: number) => {
    setProfile((current) => ({ ...current, gamification: { ...current.gamification, [key]: value } }))
  }

  const updateGamificationThreshold = (badgeCode: string, field: string, value: number) => {
    setProfile((current) => ({
      ...current,
      gamification: {
        ...current.gamification,
        loyaltyBadgeThresholds: {
          ...current.gamification.loyaltyBadgeThresholds,
          [badgeCode]: { ...current.gamification.loyaltyBadgeThresholds[badgeCode], [field]: value },
        },
      },
    }))
  }

  const updateSeo = (key: 'enableJsonLd' | 'enableBreadcrumbsLd' | 'enableFaqsLd' | 'enableVoiceSearchMeta', value: boolean) => {
    setProfile((current) => ({ ...current, seo: { ...current.seo, [key]: value } }))
  }

  const updateSeoKeywordAdd = () => {
    const keyword = seoKeywordDraft.trim()
    if (!keyword) return
    setProfile((current) => ({
      ...current,
      seo: {
        ...current.seo,
        defaultKeywords: [...current.seo.defaultKeywords, keyword],
      },
    }))
    setSeoKeywordDraft('')
  }

  const updateSeoKeywordRemove = (index: number) => {
    setProfile((current) => ({
      ...current,
      seo: {
        ...current.seo,
        defaultKeywords: current.seo.defaultKeywords.filter((_, i) => i !== index),
      },
    }))
  }

  const updateNewsletter = (key: 'exitIntentEnabled' | 'exitIntentDelayMs' | 'popupTitle' | 'popupSubtitle' | 'footerCta', value: boolean | number | string) => {
    setProfile((current) => ({ ...current, newsletter: { ...current.newsletter, [key]: value } }))
  }

  const updateCurrency = (index: number, key: 'code' | 'symbol' | 'label' | 'rate' | 'isDefault', value: string | number | boolean) => {
    setProfile((current) => ({
      ...current,
      currencies: current.currencies.map((item, i) => i === index ? { ...item, [key]: value } : item),
    }))
  }

  const addCurrency = () => {
    setProfile((current) => ({
      ...current,
      currencies: [...current.currencies, { code: '', symbol: '', label: '', rate: 1.0, isDefault: false }],
    }))
  }

  const removeCurrency = (index: number) => {
    setProfile((current) => ({
      ...current,
      currencies: current.currencies.filter((_, i) => i !== index),
    }))
  }

  const setDefaultCurrency = (index: number) => {
    setProfile((current) => ({
      ...current,
      currencies: current.currencies.map((item, i) => ({ ...item, isDefault: i === index })),
    }))
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

  const uploadPageMediaFiles = async (pageKey: string, field: 'image' | 'video', files?: FileList | File[]) => {
    const selected = Array.from(files || [])
    if (!selected.length) return
    try {
      const uploads = await Promise.all(selected.map((file) => contentApi.uploadContentImage(file)))
      const urls = uploads.map((item) => item.url).filter(Boolean)
      if (!urls.length) return
      updatePage(pageKey, field, urls[0])
      appendPageMediaSections(pageKey, field, urls.slice(1))
      toast.success(`${urls.length} ${field === 'image' ? 'image' : 'video'}${urls.length === 1 ? '' : 's'} uploaded`)
    } catch {
      toast.error(`Could not upload ${field === 'image' ? 'images' : 'videos'}`)
    }
  }

  const uploadPageSectionMediaFiles = async (pageKey: string, index: number, field: 'image' | 'video', files?: FileList | File[]) => {
    const selected = Array.from(files || [])
    if (!selected.length) return
    try {
      const uploads = await Promise.all(selected.map((file) => contentApi.uploadContentImage(file)))
      const urls = uploads.map((item) => item.url).filter(Boolean)
      if (!urls.length) return
      updatePageSection(pageKey, index, field, urls[0])
      appendPageMediaSections(pageKey, field, urls.slice(1))
      toast.success(`${urls.length} section ${field === 'image' ? 'image' : 'video'}${urls.length === 1 ? '' : 's'} uploaded`)
    } catch {
      toast.error(`Could not upload section ${field === 'image' ? 'images' : 'videos'}`)
    }
  }

  const handleMediaDrop = (event: DragEvent<HTMLElement>, upload: (files?: FileList) => void) => {
    event.preventDefault()
    upload(event.dataTransfer.files)
  }

  const uploadCategoryImage = async (categoryId: string | 'draft', file?: File) => {
    if (!file) return
    try {
      const data = await contentApi.uploadContentImage(file)
      if (categoryId === 'draft') {
        setCategoryDraft((current) => ({ ...current, image: data.url }))
      } else {
        setCategories((current) => current.map((item) => item.id === categoryId ? { ...item, image: data.url } : item))
      }
      toast.success('Category image uploaded')
    } catch (error: any) {
      toast.error(error?.message || 'Could not upload category image')
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
    const category = categories.find((item) => item.id === categoryId)
    if (!window.confirm(`Permanently delete "${category?.name || 'this category'}"? Products in it will become uncategorized.`)) return
    try {
      await contentApi.deleteCategory(categoryId)
      setCategories((current) => current.filter((category) => category.id !== categoryId))
      toast.success('Category deleted')
    } catch {
      toast.error('Could not delete category')
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

      const settingsData = await settingsApi.getSettings().catch(() => ({ settings: [] }))
      const commerce = (settingsData.settings || []).find((setting: any) => setting.key === 'commerce_settings')
      const savedCommerce = commerce?.value ? JSON.parse(commerce.value) : {}
      await settingsApi.createSetting({
        key: 'commerce_settings',
        value: JSON.stringify({
          ...savedCommerce,
          general: {
            ...(savedCommerce.general || {}),
            storeName: payload.brand.name,
            storeEmail: payload.brand.email,
            storePhone: payload.brand.phone,
            storeAddress: payload.brand.address,
          },
        }),
        type: 'json',
        description: 'Editable commerce, delivery, payment, inventory, and notification settings',
        group: 'commerce',
        isPublic: true,
      })

      setProfile(payload)
      await refresh()
      toast.success('Site content updated')
    } catch {
      toast.error('Could not save site content')
    } finally {
      setSaving(false)
    }
  }

  const resetAppearance = async (mode: 'blank' | 'defaults', targets: Array<'profile' | 'theme' | 'all'> = ['profile']) => {
    const label = mode === 'blank'
      ? 'remove all branding, names, logos, and images from the live site'
      : 'restore the original Hincton factory content'
    if (!window.confirm(`${mode === 'blank' ? 'Clear everything' : 'Restore defaults'}? This will ${label}.`)) return

    setResetting(true)
    try {
      const result = await contentApi.resetAppearance({ mode, targets })
      const next = result.profile || {}
      if (result.profile) {
        setProfile({
          ...defaultSiteProfile,
          ...next,
          brand: { ...defaultSiteProfile.brand, ...(next.brand || {}) },
          images: { ...defaultSiteProfile.images, ...(next.images || {}) },
          footer: { ...defaultSiteProfile.footer, ...(next.footer || {}) },
        })
        setMarketsText(toLines(next.markets || []))
        setQualityText(toLines(next.qualityPoints || []))
      }
      await refresh()
      toast.success(result.message || 'Appearance reset')
    } catch {
      toast.error('Could not reset appearance')
    } finally {
      setResetting(false)
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
      <div className="flex flex-wrap justify-end gap-2">
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

      <section className="rounded-2xl border border-red-200 bg-red-50 p-5">
        <h2 className="text-lg font-bold text-red-900">Reset storefront branding</h2>
        <p className="mt-1 text-sm text-red-800">
          Blank clears your store name, logo, images, and page media. Factory defaults restores the original Hincton content. Colours can be reset from Theme &amp; colours.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" disabled={resetting} onClick={() => resetAppearance('blank', ['profile'])} className="rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-bold text-red-800 hover:bg-red-100 disabled:opacity-60">
            Clear branding &amp; images
          </button>
          <button type="button" disabled={resetting} onClick={() => resetAppearance('blank', ['all'])} className="rounded-xl bg-red-700 px-4 py-2 text-sm font-bold text-white hover:bg-red-800 disabled:opacity-60">
            Full blank slate
          </button>
          <button type="button" disabled={resetting} onClick={() => resetAppearance('defaults', ['all'])} className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-bold text-stone-800 hover:bg-stone-50 disabled:opacity-60">
            Restore factory defaults
          </button>
        </div>
      </section>

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
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600">
              <Copyright className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-950">Footer Copyright</h2>
              <p className="mt-1 text-sm text-gray-600">Configure the company year range and rights notice shown in the website footer.</p>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Live Preview</p>
          <p className="mt-2 text-sm text-gray-800">{previewCopyright}</p>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Company Start Year</span>
            <input
              type="number"
              min={1900}
              max={2999}
              value={profile.footer.startYear}
              onChange={(event) => updateFooter('startYear', parseInt(event.target.value, 10) || profile.footer.startYear)}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500"
            />
            <span className="mt-1 block text-xs text-gray-500">The year the company was founded. Example: 2018.</span>
          </label>
          <label className="flex flex-col justify-between">
            <span className="text-sm font-medium text-gray-700">Auto-Update End Year</span>
            <label className="mt-2 inline-flex cursor-pointer items-center gap-3 rounded border border-gray-300 px-4 py-3 hover:bg-gray-50">
              <input
                type="checkbox"
                checked={profile.footer.autoUpdateCurrentYear}
                onChange={(event) => updateFooter('autoUpdateCurrentYear', event.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              <span className="text-sm text-gray-700">
                Automatically use the current year as the end year (recommended).
              </span>
            </label>
          </label>
          {!profile.footer.autoUpdateCurrentYear && (
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Custom End Year</span>
              <input
                type="number"
                min={1900}
                max={2999}
                value={profile.footer.endYear || ''}
                onChange={(event) => updateFooter('endYear', event.target.value ? parseInt(event.target.value, 10) : null)}
                placeholder="Optional end year"
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500"
              />
              <span className="mt-1 block text-xs text-gray-500">Only used when Auto-Update is disabled.</span>
            </label>
          )}
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Company Name (Optional Override)</span>
            <input
              type="text"
              value={profile.footer.companyName || ''}
              onChange={(event) => updateFooter('companyName', event.target.value.trim() ? event.target.value : null)}
              placeholder={profile.brand.name}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500"
            />
            <span className="mt-1 block text-xs text-gray-500">Leave empty to use the brand name: {profile.brand.name}.</span>
          </label>
          <label className="block md:col-span-2">
            <span className="text-sm font-medium text-gray-700">Rights Reserved Text</span>
            <input
              type="text"
              value={profile.footer.allRightsReservedText || ''}
              onChange={(event) => updateFooter('allRightsReservedText', event.target.value.trim().length ? event.target.value : null)}
              placeholder="All rights reserved."
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500"
            />
            <span className="mt-1 block text-xs text-gray-500">Appended after the company name. Leave blank to hide this portion.</span>
          </label>
          <label className="block md:col-span-2">
            <span className="text-sm font-medium text-gray-700">Custom Copyright Line (Optional Override)</span>
            <textarea
              value={profile.footer.customCopyrightLine || ''}
              onChange={(event) => updateFooter('customCopyrightLine', event.target.value.trim().length ? event.target.value : null)}
              rows={2}
              placeholder="Example: © 2018-2026 Hincton Meat Products. All rights reserved. Registered in Kenya."
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500"
            />
            <span className="mt-1 block text-xs text-gray-500">If filled, this line is used verbatim and all other copyright fields are ignored. Use this for unusual legal wording.</span>
          </label>
        </div>
      </section>

      <section className="rounded border-2 border-amber-400 bg-amber-50 p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-amber-900">Maintenance Mode</h2>
              <p className="mt-1 text-sm text-amber-700">Toggle the entire site offline for visitors. Admins with the secret key can still access via <code className="rounded bg-amber-100 px-1 text-xs">?maintenance_key=YOUR_KEY</code>.</p>
            </div>
          </div>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="flex items-start gap-3 rounded border border-amber-300 bg-white p-3">
            <input
              type="checkbox"
              checked={Boolean(profile.featureToggles.maintenanceMode)}
              onChange={(event) => updateFeatureToggle('maintenanceMode', event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
            />
            <div className="flex-1">
              <span className="text-sm font-bold text-amber-900">Enable Maintenance Mode</span>
              <p className="mt-0.5 text-xs text-amber-700">When ON, all visitors see a 503 response. The health endpoint and site profile API remain accessible.</p>
            </div>
          </label>
          <label className="flex items-start gap-3 rounded border border-amber-300 bg-white p-3">
            <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
            </div>
            <div className="flex-1">
              <span className="text-sm font-medium text-amber-900">Secret Backdoor Key</span>
              <input
                type="text"
                value={String(profile.featureToggles.maintenanceSecretKey || '')}
                onChange={(event) => updateFeatureToggle('maintenanceSecretKey', event.target.value)}
                placeholder="e.g. hincton2026secret"
                className="mt-1 w-full rounded border border-amber-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
              />
              <p className="mt-0.5 text-xs text-amber-600">Append <code className="rounded bg-amber-100 px-1">?maintenance_key=THIS_VALUE</code> to any URL to bypass maintenance mode.</p>
            </div>
          </label>
        </div>
      </section>

      <section className="rounded bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600">
              <SlidersHorizontal className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-950">Feature Toggles</h2>
              <p className="mt-1 text-sm text-gray-600">Enable or disable site-wide features in one place.</p>
            </div>
          </div>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {(['quickViewModal', 'wishlistSharing', 'couponAutoApply', 'printableReturnLabel', 'oneClickReorder', 'reviewHelpfulVotes', 'backInStockAlerts', 'lowStockBadge', 'currencySwitcher', 'socialLoginButtons', 'bnplOptions', 'newsletterExitIntent', 'productShareButtons', 'instagramFeed', 'sustainabilityBadges', 'trustBadges', 'livePurchaseNotifications', 'pwaInstallPrompt', 'loyaltyProgram', 'spinToWin', 'arProductTryOn', 'voiceSearchMetadata', 'cryptoPayments', 'abTestingEnabled', 'analyticsTelemetry', 'socialProofViewers', 'subscriptionPlans', 'carbonNeutralClaims'] as const).map((key) => (
            <label key={key} className="flex items-start gap-3 rounded border border-gray-200 p-3">
              <input
                type="checkbox"
                checked={Boolean(profile.featureToggles[key])}
                onChange={(event) => updateFeatureToggle(key, event.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              <div className="flex-1">
                <span className="text-sm font-medium capitalize text-gray-700">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
              </div>
            </label>
          ))}
          <label className="flex items-start gap-3 rounded border border-gray-200 p-3 md:col-span-1">
            <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
              <span className="h-2 w-2 rounded-full bg-gray-300" />
            </div>
            <div className="flex-1">
              <span className="text-sm font-medium capitalize text-gray-700">Low Stock Threshold</span>
              <input
                type="number"
                value={Number(profile.featureToggles.lowStockThreshold)}
                onChange={(event) => updateFeatureToggle('lowStockThreshold', parseInt(event.target.value, 10) || 0)}
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500"
              />
            </div>
          </label>
          <label className="flex items-start gap-3 rounded border border-gray-200 p-3 md:col-span-2">
            <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
              <span className="h-2 w-2 rounded-full bg-gray-300" />
            </div>
            <div className="flex-1">
              <span className="text-sm font-medium text-gray-700">Instagram Feed Handle</span>
              <input
                type="text"
                value={String(profile.featureToggles.instagramFeedHandle || '')}
                onChange={(event) => updateFeatureToggle('instagramFeedHandle', event.target.value)}
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500"
              />
            </div>
          </label>
        </div>
      </section>

      <section className="rounded bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-950">Payment Options & Wallets</h2>
              <p className="mt-1 text-sm text-gray-600">Configure BNPL providers, digital wallets, and crypto currencies.</p>
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-6">
          <div className="rounded-xl border border-gray-200 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">BNPL Providers</h3>
              <button type="button" onClick={addBnpl} className="rounded bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200">Add BNPL</button>
            </div>
            <div className="space-y-3">
              {profile.payments.bnpl.map((item, index) => (
                <div key={index} className="grid gap-3 md:grid-cols-[10rem_14rem_auto_1fr_1fr_auto] items-center">
                  <input value={item.code} onChange={(event) => updateBnpl(index, 'code', event.target.value)} placeholder="CODE" className="rounded border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500" />
                  <input value={item.label} onChange={(event) => updateBnpl(index, 'label', event.target.value)} placeholder="Label" className="rounded border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500" />
                  <label className="inline-flex items-center gap-2 px-2">
                    <input type="checkbox" checked={item.enabled} onChange={(event) => updateBnpl(index, 'enabled', event.target.checked)} className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500" />
                    <span className="text-sm font-medium text-gray-700">Enabled</span>
                  </label>
                  <input value={item.description || ''} onChange={(event) => updateBnpl(index, 'description', event.target.value)} placeholder="Description" className="rounded border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500" />
                  <input value={item.learnMoreUrl || ''} onChange={(event) => updateBnpl(index, 'learnMoreUrl', event.target.value)} placeholder="Learn more URL" className="rounded border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500" />
                  <button type="button" onClick={() => removeBnpl(index)} className="rounded border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">Remove</button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">Digital Wallets</h3>
              <button type="button" onClick={addDigitalWallet} className="rounded bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200">Add Wallet</button>
            </div>
            <div className="space-y-3">
              {profile.payments.digitalWallets.map((item, index) => (
                <div key={index} className="grid gap-3 md:grid-cols-[10rem_1fr_auto_auto] items-center">
                  <input value={item.code} onChange={(event) => updateDigitalWallet(index, 'code', event.target.value)} placeholder="CODE" className="rounded border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500" />
                  <input value={item.label} onChange={(event) => updateDigitalWallet(index, 'label', event.target.value)} placeholder="Label" className="rounded border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500" />
                  <label className="inline-flex items-center gap-2 px-2">
                    <input type="checkbox" checked={item.enabled} onChange={(event) => updateDigitalWallet(index, 'enabled', event.target.checked)} className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500" />
                    <span className="text-sm font-medium text-gray-700">Enabled</span>
                  </label>
                  <button type="button" onClick={() => removeDigitalWallet(index)} className="rounded border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">Remove</button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">Crypto Currencies</h3>
              <button type="button" onClick={addCrypto} className="rounded bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200">Add Crypto</button>
            </div>
            <div className="space-y-3">
              {profile.payments.crypto.map((item, index) => (
                <div key={index} className="grid gap-3 md:grid-cols-[10rem_14rem_auto_1fr_auto] items-center">
                  <input value={item.code} onChange={(event) => updateCrypto(index, 'code', event.target.value)} placeholder="CODE" className="rounded border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500" />
                  <input value={item.label} onChange={(event) => updateCrypto(index, 'label', event.target.value)} placeholder="Label" className="rounded border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500" />
                  <label className="inline-flex items-center gap-2 px-2">
                    <input type="checkbox" checked={item.enabled} onChange={(event) => updateCrypto(index, 'enabled', event.target.checked)} className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500" />
                    <span className="text-sm font-medium text-gray-700">Enabled</span>
                  </label>
                  <input value={item.walletAddress || ''} onChange={(event) => updateCrypto(index, 'walletAddress', event.target.value)} placeholder="Wallet address" className="rounded border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500" />
                  <button type="button" onClick={() => removeCrypto(index)} className="rounded border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">Remove</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-950">Trust & Sustainability</h2>
              <p className="mt-1 text-sm text-gray-600">Trust badges, sustainability claims, and social proof tuning.</p>
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-6">
          <div className="rounded-xl border border-gray-200 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">Trust Badges</h3>
              <button type="button" onClick={addTrustBadge} className="rounded bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200">Add Badge</button>
            </div>
            <div className="space-y-3">
              {profile.trust.badges.map((item, index) => (
                <div key={index} className="grid gap-3 md:grid-cols-[10rem_14rem_1fr_auto] items-center">
                  <input value={item.code} onChange={(event) => updateTrustBadge(index, 'code', event.target.value)} placeholder="CODE" className="rounded border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500" />
                  <input value={item.label} onChange={(event) => updateTrustBadge(index, 'label', event.target.value)} placeholder="Label" className="rounded border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500" />
                  <input value={item.description || ''} onChange={(event) => updateTrustBadge(index, 'description', event.target.value)} placeholder="Description" className="rounded border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500" />
                  <button type="button" onClick={() => removeTrustBadge(index)} className="rounded border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">Remove</button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">Sustainability Badges</h3>
              <button type="button" onClick={addSustainability} className="rounded bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200">Add Badge</button>
            </div>
            <div className="space-y-3">
              {profile.trust.sustainability.map((item, index) => (
                <div key={index} className="grid gap-3 md:grid-cols-[10rem_1fr_10rem_auto] items-center">
                  <input value={item.code} onChange={(event) => updateSustainability(index, 'code', event.target.value)} placeholder="CODE" className="rounded border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500" />
                  <input value={item.label} onChange={(event) => updateSustainability(index, 'label', event.target.value)} placeholder="Label" className="rounded border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500" />
                  <input value={item.icon || ''} onChange={(event) => updateSustainability(index, 'icon', event.target.value)} placeholder="Icon" className="rounded border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500" />
                  <button type="button" onClick={() => removeSustainability(index)} className="rounded border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">Remove</button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 p-4">
            <h3 className="mb-4 text-sm font-bold text-gray-900">Social Proof Tuning</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">View Counter Window (minutes)</span>
                <input
                  type="number"
                  value={profile.trust.viewCounterWindowMinutes}
                  onChange={(event) => updateTrust('viewCounterWindowMinutes', parseInt(event.target.value, 10) || 0)}
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Recent Purchase Window (hours)</span>
                <input
                  type="number"
                  value={profile.trust.recentPurchaseWindowHours}
                  onChange={(event) => updateTrust('recentPurchaseWindowHours', parseInt(event.target.value, 10) || 0)}
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Social Proof Mode</span>
                <select
                  value={profile.trust.socialProofMode}
                  onChange={(event) => updateTrust('socialProofMode', event.target.value)}
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500"
                >
                  <option value="REAL_ONLY">REAL_ONLY</option>
                  <option value="REAL_FALLBACK_SIMULATED">REAL_FALLBACK_SIMULATED</option>
                  <option value="SIMULATED_ONLY">SIMULATED_ONLY</option>
                  <option value="OFF">OFF</option>
                </select>
              </label>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600">
              <Gamepad2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-950">Loyalty & Gamification</h2>
              <p className="mt-1 text-sm text-gray-600">Reward points and loyalty badge thresholds.</p>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-5">
          {(['welcomePoints', 'pointsPerOrder', 'pointsPerReview', 'pointsPerReferral', 'spinWinDailyLimit'] as const).map((key) => (
            <label key={key} className="block">
              <span className="text-sm font-medium capitalize text-gray-700">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
              <input
                type="number"
                value={profile.gamification[key]}
                onChange={(event) => updateGamification(key, parseInt(event.target.value, 10) || 0)}
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500"
              />
            </label>
          ))}
        </div>

        <div className="mt-6 rounded-xl border border-gray-200 p-4">
          <h3 className="mb-4 text-sm font-bold text-gray-900">Loyalty Badge Thresholds</h3>
          <div className="grid gap-4 md:grid-cols-5">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">FIRST_ORDER (Required Orders)</span>
              <input
                type="number"
                value={profile.gamification.loyaltyBadgeThresholds.FIRST_ORDER?.requiredOrders ?? 1}
                onChange={(event) => updateGamificationThreshold('FIRST_ORDER', 'requiredOrders', parseInt(event.target.value, 10) || 0)}
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">FREQUENT_BUYER (Required Orders)</span>
              <input
                type="number"
                value={profile.gamification.loyaltyBadgeThresholds.FREQUENT_BUYER?.requiredOrders ?? 5}
                onChange={(event) => updateGamificationThreshold('FREQUENT_BUYER', 'requiredOrders', parseInt(event.target.value, 10) || 0)}
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">REVIEWER (Required Reviews)</span>
              <input
                type="number"
                value={profile.gamification.loyaltyBadgeThresholds.REVIEWER?.requiredReviews ?? 3}
                onChange={(event) => updateGamificationThreshold('REVIEWER', 'requiredReviews', parseInt(event.target.value, 10) || 0)}
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">AMBASSADOR (Required Orders)</span>
              <input
                type="number"
                value={profile.gamification.loyaltyBadgeThresholds.AMBASSADOR?.requiredOrders ?? 20}
                onChange={(event) => updateGamificationThreshold('AMBASSADOR', 'requiredOrders', parseInt(event.target.value, 10) || 0)}
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">TOP_CUSTOMER (Required Spent)</span>
              <input
                type="number"
                value={profile.gamification.loyaltyBadgeThresholds.TOP_CUSTOMER?.requiredSpent ?? 100000}
                onChange={(event) => updateGamificationThreshold('TOP_CUSTOMER', 'requiredSpent', parseInt(event.target.value, 10) || 0)}
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500"
              />
            </label>
          </div>
        </div>
      </section>

      <section className="rounded bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600">
              <SearchCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-950">SEO & Voice Search</h2>
              <p className="mt-1 text-sm text-gray-600">Structured data, breadcrumbs, FAQ schema, and default SEO keywords.</p>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-4">
          {(['enableJsonLd', 'enableBreadcrumbsLd', 'enableFaqsLd', 'enableVoiceSearchMeta'] as const).map((key) => (
            <label key={key} className="flex items-center gap-3 rounded border border-gray-200 p-3">
              <input
                type="checkbox"
                checked={profile.seo[key]}
                onChange={(event) => updateSeo(key, event.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              <span className="text-sm font-medium capitalize text-gray-700">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
            </label>
          ))}
        </div>

        <div className="mt-6 rounded-xl border border-gray-200 p-4">
          <h3 className="mb-4 text-sm font-bold text-gray-900">Default Keywords</h3>
          <div className="mb-3 flex gap-3">
            <input
              value={seoKeywordDraft}
              onChange={(event) => setSeoKeywordDraft(event.target.value)}
              placeholder="Add keyword"
              onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); updateSeoKeywordAdd(); } }}
              className="flex-1 rounded border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500"
            />
            <button type="button" onClick={updateSeoKeywordAdd} className="rounded bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200">Add Keyword</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.seo.defaultKeywords.map((keyword, index) => (
              <div key={index} className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-sm">
                <span className="text-gray-700">{keyword}</span>
                <button type="button" onClick={() => updateSeoKeywordRemove(index)} className="text-gray-500 hover:text-red-600">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {!profile.seo.defaultKeywords.length && <span className="text-sm text-gray-500">No keywords yet.</span>}
          </div>
        </div>
      </section>

      <section className="rounded bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600">
              <Megaphone className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-950">Newsletter & Currencies</h2>
              <p className="mt-1 text-sm text-gray-600">Popup configuration and multi-currency setup.</p>
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-6">
          <div className="rounded-xl border border-gray-200 p-4">
            <h3 className="mb-4 text-sm font-bold text-gray-900">Newsletter Popup</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex items-center gap-3 rounded border border-gray-200 p-3 md:col-span-1">
                <input
                  type="checkbox"
                  checked={profile.newsletter.exitIntentEnabled}
                  onChange={(event) => updateNewsletter('exitIntentEnabled', event.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <span className="text-sm font-medium text-gray-700">Exit Intent Enabled</span>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Exit Intent Delay (ms)</span>
                <input
                  type="number"
                  value={profile.newsletter.exitIntentDelayMs}
                  onChange={(event) => updateNewsletter('exitIntentDelayMs', parseInt(event.target.value, 10) || 0)}
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Popup Title</span>
                <input
                  type="text"
                  value={profile.newsletter.popupTitle}
                  onChange={(event) => updateNewsletter('popupTitle', event.target.value)}
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Popup Subtitle</span>
                <input
                  type="text"
                  value={profile.newsletter.popupSubtitle}
                  onChange={(event) => updateNewsletter('popupSubtitle', event.target.value)}
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500"
                />
              </label>
              <label className="block md:col-span-2">
                <span className="text-sm font-medium text-gray-700">Footer CTA</span>
                <textarea
                  value={profile.newsletter.footerCta}
                  onChange={(event) => updateNewsletter('footerCta', event.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500"
                />
              </label>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">Currencies</h3>
              <button type="button" onClick={addCurrency} className="rounded bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200">Add Currency</button>
            </div>
            <div className="space-y-3">
              {profile.currencies.map((item, index) => (
                <div key={index} className="grid gap-3 md:grid-cols-[8rem_6rem_1fr_auto_auto_auto] items-center">
                  <input value={item.code} onChange={(event) => updateCurrency(index, 'code', event.target.value)} placeholder="CODE" className="rounded border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500" />
                  <input value={item.symbol} onChange={(event) => updateCurrency(index, 'symbol', event.target.value)} placeholder="KSh" className="rounded border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500" />
                  <input value={item.label} onChange={(event) => updateCurrency(index, 'label', event.target.value)} placeholder="Label" className="rounded border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500" />
                  <input type="number" step="any" value={item.rate} onChange={(event) => updateCurrency(index, 'rate', parseFloat(event.target.value) || 0)} placeholder="Rate" className="w-32 rounded border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500" />
                  <label className="inline-flex items-center gap-2 px-2">
                    <input type="radio" name="defaultCurrency" checked={item.isDefault} onChange={() => setDefaultCurrency(index)} className="h-4 w-4 border-gray-300 text-red-600 focus:ring-red-500" />
                    <span className="text-sm font-medium text-gray-700">Default</span>
                  </label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setDefaultCurrency(index)} className="rounded bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200">Set Default</button>
                    <button type="button" onClick={() => removeCurrency(index)} className="rounded border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">Remove</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-950">Product Categories</h2>
        <p className="mt-1 text-sm text-gray-600">Categories are not fixed to meat. Add anything the business sells: utensils, cars, services, bundles, or future product lines.</p>
        <div className="mt-5 grid gap-3 md:grid-cols-[14rem_1fr_1fr_auto_auto]">
          <input value={categoryDraft.name} onChange={(event) => setCategoryDraft((current) => ({ ...current, name: event.target.value }))} placeholder="Category name" className="rounded border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500" />
          <input value={categoryDraft.description} onChange={(event) => setCategoryDraft((current) => ({ ...current, description: event.target.value }))} placeholder="Description" className="rounded border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500" />
          <input value={categoryDraft.image} onChange={(event) => setCategoryDraft((current) => ({ ...current, image: event.target.value }))} placeholder="Image URL or uploaded path" className="rounded border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500" />
          <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            <Upload className="h-4 w-4" />
            Image
            <input type="file" accept="image/*" onChange={(event) => uploadCategoryImage('draft', event.target.files?.[0])} className="hidden" />
          </label>
          <button type="button" onClick={createCategory} className="rounded bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700">Add Category</button>
        </div>
        <div className="mt-5 space-y-3">
          {categories.map((category) => (
            <div key={category.id} className="rounded border border-gray-200 p-4">
              <div className="grid gap-3 md:grid-cols-[14rem_1fr_1fr_auto_auto_auto]">
                <input value={category.name || ''} onChange={(event) => setCategories((current) => current.map((item) => item.id === category.id ? { ...item, name: event.target.value, slug: slugify(event.target.value) } : item))} className="rounded border border-gray-300 px-3 py-2" />
                <input value={category.description || ''} onChange={(event) => setCategories((current) => current.map((item) => item.id === category.id ? { ...item, description: event.target.value } : item))} placeholder="Description" className="rounded border border-gray-300 px-3 py-2" />
                <input value={category.image || ''} onChange={(event) => setCategories((current) => current.map((item) => item.id === category.id ? { ...item, image: event.target.value } : item))} placeholder="Image" className="rounded border border-gray-300 px-3 py-2" />
                <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                  <Upload className="h-4 w-4" />
                  Upload
                  <input type="file" accept="image/*" onChange={(event) => uploadCategoryImage(category.id, event.target.files?.[0])} className="hidden" />
                </label>
                <button type="button" onClick={() => updateCategory(category)} className="rounded bg-gray-900 px-3 py-2 text-sm font-semibold text-white">Save</button>
                <button type="button" onClick={() => archiveCategory(category.id)} className="inline-flex items-center justify-center gap-1 rounded border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">
                  <X className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-950">Editable Public Pages</h2>
        <p className="mt-1 text-sm text-gray-600">Edit copy, images, videos, and sections for About, Farms, Sustainability, Contact, Careers, Blog, Wellness, Returns, Maintenance, and Download Thank You.</p>
        <div className="mt-5 space-y-6">
          {pageKeys.map((key) => {
            const page = profile.pages[key] || defaultSiteProfile.pages[key]
            return (
              <div key={key} className="rounded border border-gray-200 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-base font-bold text-gray-950">{pageLabels[key] || key}</h3>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => addPageSection(key)} className="rounded bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200">Add Section</button>
                    <button type="button" onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
                      <Save className="h-4 w-4" />
                      Save Page
                    </button>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <input value={page.title} onChange={(event) => updatePage(key, 'title', event.target.value)} placeholder="Page title" className="rounded border border-gray-300 px-3 py-2" />
                  <input value={page.subtitle} onChange={(event) => updatePage(key, 'subtitle', event.target.value)} placeholder="Subtitle" className="rounded border border-gray-300 px-3 py-2" />
                  <input value={page.image} onChange={(event) => updatePage(key, 'image', event.target.value)} placeholder="Hero image URL" className="rounded border border-gray-300 px-3 py-2" />
                  <input value={page.video || ''} onChange={(event) => updatePage(key, 'video', event.target.value)} placeholder="Optional hero video URL" className="rounded border border-gray-300 px-3 py-2" />
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <label
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => handleMediaDrop(event, (files) => uploadPageMediaFiles(key, 'image', files))}
                    className="flex cursor-pointer flex-col items-center justify-center rounded border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-5 text-center text-sm font-semibold text-gray-700 hover:border-red-400 hover:bg-red-50"
                  >
                    <Upload className="mb-2 h-5 w-5" />
                    Drop hero images or browse
                    <input type="file" multiple accept="image/*" onChange={(event) => uploadPageMediaFiles(key, 'image', event.target.files || undefined)} className="hidden" />
                  </label>
                  <label
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => handleMediaDrop(event, (files) => uploadPageMediaFiles(key, 'video', files))}
                    className="flex cursor-pointer flex-col items-center justify-center rounded border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-5 text-center text-sm font-semibold text-gray-700 hover:border-red-400 hover:bg-red-50"
                  >
                    <Upload className="mb-2 h-5 w-5" />
                    Drop hero videos or browse
                    <input type="file" multiple accept="video/*" onChange={(event) => uploadPageMediaFiles(key, 'video', event.target.files || undefined)} className="hidden" />
                  </label>
                </div>
                {(page.image || page.video) && (
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {page.image && renderMediaPreview(page.image, 'image')}
                    {page.video && renderMediaPreview(page.video, 'video')}
                  </div>
                )}
                <textarea value={page.body} onChange={(event) => updatePage(key, 'body', event.target.value)} rows={4} placeholder="Page body" className="mt-3 w-full rounded border border-gray-300 px-3 py-2" />
                <div className="mt-4 space-y-3">
                  {(page.sections || []).map((section, index) => (
                    <div key={index} className="rounded bg-gray-50 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-700">Section {index + 1}</span>
                        <button type="button" onClick={() => removePageSection(key, index)} className="inline-flex items-center gap-1 text-sm font-semibold text-red-700">
                          <Trash2 className="h-4 w-4" />
                          Remove
                        </button>
                      </div>
                      <div className="grid gap-2 md:grid-cols-2">
                        <input value={section.title} onChange={(event) => updatePageSection(key, index, 'title', event.target.value)} placeholder="Section title" className="rounded border border-gray-300 px-3 py-2" />
                        <input value={section.image || ''} onChange={(event) => updatePageSection(key, index, 'image', event.target.value)} placeholder="Image URL" className="rounded border border-gray-300 px-3 py-2" />
                        <input value={section.video || ''} onChange={(event) => updatePageSection(key, index, 'video', event.target.value)} placeholder="Video URL" className="rounded border border-gray-300 px-3 py-2" />
                        <input value={section.linkUrl || ''} onChange={(event) => updatePageSection(key, index, 'linkUrl', event.target.value)} placeholder="Optional link URL" className="rounded border border-gray-300 px-3 py-2" />
                      </div>
                      <div className="mt-2 grid gap-2 md:grid-cols-2">
                        <label
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={(event) => handleMediaDrop(event, (files) => uploadPageSectionMediaFiles(key, index, 'image', files))}
                          className="flex cursor-pointer items-center justify-center gap-2 rounded border-2 border-dashed border-gray-300 bg-white px-3 py-3 text-sm font-semibold text-gray-700 hover:border-red-400 hover:bg-red-50"
                        >
                          <Upload className="h-4 w-4" />
                          Drop section images
                          <input type="file" multiple accept="image/*" onChange={(event) => uploadPageSectionMediaFiles(key, index, 'image', event.target.files || undefined)} className="hidden" />
                        </label>
                        <label
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={(event) => handleMediaDrop(event, (files) => uploadPageSectionMediaFiles(key, index, 'video', files))}
                          className="flex cursor-pointer items-center justify-center gap-2 rounded border-2 border-dashed border-gray-300 bg-white px-3 py-3 text-sm font-semibold text-gray-700 hover:border-red-400 hover:bg-red-50"
                        >
                          <Upload className="h-4 w-4" />
                          Drop section videos
                          <input type="file" multiple accept="video/*" onChange={(event) => uploadPageSectionMediaFiles(key, index, 'video', event.target.files || undefined)} className="hidden" />
                        </label>
                      </div>
                      {(section.image || section.video) && (
                        <div className="mt-2 grid gap-2 md:grid-cols-2">
                          {section.image && renderMediaPreview(section.image, 'image')}
                          {section.video && renderMediaPreview(section.video, 'video')}
                        </div>
                      )}
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
        <p className="mt-1 text-sm text-gray-600">Create real blog posts with images, categories, tags, and Read More pages.</p>
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
            try {
              const data = await contentApi.uploadContentImage(file)
              setBlogDraft((current) => ({ ...current, featuredImage: data.url }))
              toast.success('Blog image uploaded')
            } catch (error: any) {
              toast.error(error?.message || 'Could not upload blog image')
            }
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
        <h2 className="text-lg font-bold text-gray-950">Home Hero Carousel</h2>
        <p className="mt-1 text-sm text-gray-600">Add as many images as you need. They will automatically move across the home hero; visitors can also select a slide.</p>
        <div onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); addHeroSlides(event.dataTransfer.files) }} className="mt-4 rounded-xl border-2 border-dashed border-red-100 bg-red-50/40 p-5 text-center">
          <Upload className="mx-auto h-5 w-5 text-red-600" />
          <p className="mt-2 text-sm font-semibold text-gray-800">Drop hero images here or choose files</p>
          <input type="file" accept="image/*" multiple onChange={(event) => addHeroSlides(event.target.files)} className="mt-2 text-sm" />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {profile.heroSlides.map((slide, index) => <div key={`${slide.image}-${index}`} className="relative overflow-hidden rounded-xl border border-gray-200"><img src={resolveMediaUrl(slide.image)} alt="Hero slide" className="h-24 w-full object-cover" /><button type="button" onClick={() => removeHeroSlide(index)} className="absolute right-2 top-2 rounded-full bg-white p-1 text-red-600 shadow"><X className="h-4 w-4" /></button><input value={slide.alt || ''} onChange={(event) => setProfile((current) => ({ ...current, heroSlides: current.heroSlides.map((item, i) => i === index ? { ...item, alt: event.target.value } : item) }))} placeholder="Image description" className="w-full px-2 py-2 text-xs" /></div>)}
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
