import React, { useEffect, useMemo, useState } from 'react'
import {
  Plus,
  Save,
  Trash2,
  X,
  Tag,
  Percent,
  Flame,
  Gift,
  Sparkles,
  Eye,
  Pencil,
  Search,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Zap,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { dealsApi, productsApi, contentApi } from '../services/adminApi'
import { formatPrice } from '../utils/currency'

type TabId = 'banners' | 'flashsales' | 'bulk'

interface DealBannerForm {
  id?: string
  title: string
  subtitle?: string
  bannerColor: string
  textColor: string
  bannerImage?: string
  productIds: string[]
  categoryId?: string
  flashSaleId?: string
  seeAllUrl?: string
  seeAllLabel: string
  sortOrder: number
  isActive: boolean
  startDate?: string
  endDate?: string
}

interface FlashSaleForm {
  id?: string
  name: string
  slug?: string
  description?: string
  startDate: string
  endDate: string
  isActive: boolean
  products: Array<{
    productId: string
    salePrice: number
    originalPrice: number
    stockAllocated: number
  }>
}

const emptyBanner = (): DealBannerForm => ({
  title: '',
  subtitle: '',
  bannerColor: '#FF5500',
  textColor: '#FFFFFF',
  bannerImage: '',
  productIds: [],
  categoryId: '',
  flashSaleId: '',
  seeAllUrl: '/shop',
  seeAllLabel: 'See All',
  sortOrder: 0,
  isActive: true,
  startDate: '',
  endDate: '',
})

const emptyFlashSale = (): FlashSaleForm => ({
  name: '',
  description: '',
  startDate: '',
  endDate: '',
  isActive: true,
  products: [],
})

const DealsPage: React.FC = () => {
  const [tab, setTab] = useState<TabId>('banners')

  // ==== Deal Banners state ====
  const [banners, setBanners] = useState<any[]>([])
  const [bannerLoading, setBannerLoading] = useState(false)
  const [bannerModalOpen, setBannerModalOpen] = useState(false)
  const [editingBanner, setEditingBanner] = useState<DealBannerForm>(emptyBanner())

  // ==== Flash Sales state ====
  const [flashSales, setFlashSales] = useState<any[]>([])
  const [flashLoading, setFlashLoading] = useState(false)
  const [flashModalOpen, setFlashModalOpen] = useState(false)
  const [editingFlash, setEditingFlash] = useState<FlashSaleForm>(emptyFlashSale())

  // ==== Bulk Discounts state ====
  const [products, setProducts] = useState<any[]>([])
  const [productSearch, setProductSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [discountPct, setDiscountPct] = useState<number>(15)
  const [markOnSale, setMarkOnSale] = useState(true)
  const [bulkLoading, setBulkLoading] = useState(false)

  // Shared catalogs
  const [categories, setCategories] = useState<any[]>([])
  const [productCatalog, setProductCatalog] = useState<any[]>([])
  const [productPickerOpen, setProductPickerOpen] = useState(false)
  const [pickerSearch, setPickerSearch] = useState('')
  const [pickerTarget, setPickerTarget] = useState<'banner' | 'flash'>('banner')
  const [pickerFlashIdx, setPickerFlashIdx] = useState<number | null>(null)

  const fetchAll = async () => {
    try {
      setBannerLoading(true)
      const [{ banners: b }, { flashSales: fs }, prodRes, catRes] = await Promise.all([
        dealsApi.listDealBanners(),
        dealsApi.listFlashSales(),
        productsApi.getProducts({ limit: 200 }),
        contentApi.getCategories(),
      ])
      setBanners(Array.isArray(b) ? b : [])
      setFlashSales(Array.isArray(fs) ? fs : [])
      const list = prodRes?.products || prodRes?.data || []
      setProducts(list)
      setProductCatalog(list)
      setCategories(catRes?.categories || [])
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load deals data')
    } finally {
      setBannerLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [])

  // ======== Helpers ========
  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase()
    if (!q) return products
    return products.filter((p: any) =>
      (p.name || '').toLowerCase().includes(q) ||
      (p.sku || '').toLowerCase().includes(q)
    )
  }, [products, productSearch])

  const pickerFiltered = useMemo(() => {
    const q = pickerSearch.trim().toLowerCase()
    if (!q) return productCatalog
    return productCatalog.filter((p: any) =>
      (p.name || '').toLowerCase().includes(q) ||
      (p.sku || '').toLowerCase().includes(q)
    )
  }, [productCatalog, pickerSearch])

  const toggleBulkSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const toggleBulkSelectAll = () => {
    if (selectedIds.size === filteredProducts.length && filteredProducts.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredProducts.map((p: any) => p.id)))
    }
  }

  // ======== Banner actions ========
  const openNewBanner = () => {
    setEditingBanner(emptyBanner())
    setBannerModalOpen(true)
  }

  const openEditBanner = (banner: any) => {
    setEditingBanner({
      id: banner.id,
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      bannerColor: banner.bannerColor || '#FF5500',
      textColor: banner.textColor || '#FFFFFF',
      bannerImage: banner.bannerImage || '',
      productIds: Array.isArray(banner.productIds) ? banner.productIds : [],
      categoryId: banner.categoryId || '',
      flashSaleId: banner.flashSaleId || '',
      seeAllUrl: banner.seeAllUrl || '/shop',
      seeAllLabel: banner.seeAllLabel || 'See All',
      sortOrder: banner.sortOrder ?? 0,
      isActive: banner.isActive ?? true,
      startDate: banner.startDate ? banner.startDate.slice(0, 16) : '',
      endDate: banner.endDate ? banner.endDate.slice(0, 16) : '',
    })
    setBannerModalOpen(true)
  }

  const saveBanner = async () => {
    if (!editingBanner.title.trim()) {
      toast.error('Banner title is required')
      return
    }
    try {
      setBannerLoading(true)
      const payload: any = { ...editingBanner }
      if (!payload.startDate) delete payload.startDate
      if (!payload.endDate) delete payload.endDate
      if (!payload.categoryId) delete payload.categoryId
      if (!payload.flashSaleId) delete payload.flashSaleId
      if (payload.id) {
        await dealsApi.updateDealBanner(payload.id, payload)
        toast.success('Deal banner updated')
      } else {
        await dealsApi.createDealBanner(payload)
        toast.success('Deal banner created')
      }
      setBannerModalOpen(false)
      await fetchAll()
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save banner')
    } finally {
      setBannerLoading(false)
    }
  }

  const deleteBanner = async (id: string) => {
    if (!confirm('Delete this deal banner?')) return
    try {
      await dealsApi.deleteDealBanner(id)
      toast.success('Banner deleted')
      await fetchAll()
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete banner')
    }
  }

  // ======== Flash Sale actions ========
  const openNewFlash = () => {
    setEditingFlash(emptyFlashSale())
    setFlashModalOpen(true)
  }

  const openEditFlash = (fs: any) => {
    setEditingFlash({
      id: fs.id,
      name: fs.name || '',
      slug: fs.slug || '',
      description: fs.description || '',
      startDate: fs.startDate ? fs.startDate.slice(0, 16) : '',
      endDate: fs.endDate ? fs.endDate.slice(0, 16) : '',
      isActive: fs.isActive ?? true,
      products: Array.isArray(fs.products)
        ? fs.products.map((p: any) => ({
            productId: p.productId,
            salePrice: Number(p.salePrice),
            originalPrice: Number(p.originalPrice),
            stockAllocated: Number(p.stockAllocated),
          }))
        : [],
    })
    setFlashModalOpen(true)
  }

  const saveFlash = async () => {
    if (!editingFlash.name.trim()) return toast.error('Flash sale name is required')
    if (!editingFlash.startDate || !editingFlash.endDate) return toast.error('Start and end dates are required')
    if (editingFlash.products.length === 0) return toast.error('Add at least 1 product to the flash sale')
    try {
      setFlashLoading(true)
      const payload: any = { ...editingFlash }
      if (payload.id) {
        await dealsApi.updateFlashSale(payload.id, payload)
        toast.success('Flash sale updated')
      } else {
        await dealsApi.createFlashSale(payload)
        toast.success('Flash sale created')
      }
      setFlashModalOpen(false)
      await fetchAll()
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save flash sale')
    } finally {
      setFlashLoading(false)
    }
  }

  const stopFlash = async (id: string) => {
    if (!confirm('End this flash sale now?')) return
    try {
      await dealsApi.stopFlashSale(id)
      toast.success('Flash sale ended')
      await fetchAll()
    } catch (e: any) {
      toast.error(e?.message || 'Failed to stop flash sale')
    }
  }

  const deleteFlash = async (id: string) => {
    if (!confirm('Delete this flash sale?')) return
    try {
      await dealsApi.deleteFlashSale(id)
      toast.success('Flash sale deleted')
      await fetchAll()
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete')
    }
  }

  const addProductToFlash = (product: any) => {
    if (pickerFlashIdx === null) return
    const price = Number(product.price || 0)
    setEditingFlash(prev => {
      const next = [...prev.products]
      next[pickerFlashIdx] = {
        productId: product.id,
        originalPrice: price,
        salePrice: Math.round(price * 0.8),
        stockAllocated: Math.min(20, Number(product.stockQuantity || 10)),
      }
      return { ...prev, products: next }
    })
    setProductPickerOpen(false)
  }

  // ======== Bulk Discount actions ========
  const runApplyBulk = async () => {
    if (selectedIds.size === 0) return toast.error('Select at least one product')
    if (discountPct <= 0 || discountPct > 95) return toast.error('Discount % must be between 1 and 95')
    try {
      setBulkLoading(true)
      await dealsApi.applyBulkDiscount({
        productIds: Array.from(selectedIds),
        discountPercentage: discountPct,
        isOnSale: markOnSale,
      })
      toast.success(`Applied -${discountPct}% to ${selectedIds.size} product(s). Prices are REAL and reduced on the store.`)
      setSelectedIds(new Set())
      await fetchAll()
    } catch (e: any) {
      toast.error(e?.message || 'Failed to apply discounts')
    } finally {
      setBulkLoading(false)
    }
  }

  const runRemoveBulk = async () => {
    if (selectedIds.size === 0) return toast.error('Select at least one product')
    if (!confirm(`Restore original prices and remove discount flags for ${selectedIds.size} product(s)?`)) return
    try {
      setBulkLoading(true)
      await dealsApi.removeBulkDiscount({ productIds: Array.from(selectedIds) })
      toast.success('Discounts removed, original prices restored')
      setSelectedIds(new Set())
      await fetchAll()
    } catch (e: any) {
      toast.error(e?.message || 'Failed to remove discounts')
    } finally {
      setBulkLoading(false)
    }
  }

  // ======== Rendering ========
  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-red-600" />
            Deals & Offers
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Create clearance banners, run flash sales, and apply real percentage discounts to products.
          </p>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200">
        {[
          { id: 'banners', icon: Gift, label: 'Deal Banners (colored sections)' },
          { id: 'flashsales', icon: Flame, label: 'Flash Sales (time-limited)' },
          { id: 'bulk', icon: Percent, label: 'Bulk Product Discounts' },
        ].map(t => {
          const Icon = t.icon
          const active = tab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id as TabId)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition ${
                active
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* ========== TAB: BANNERS ========== */}
      {tab === 'banners' && (
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Build the orange/red &quot;Top Deals | Clearance Sale&quot; rows on the homepage.
            </p>
            <button
              onClick={openNewBanner}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              <Plus className="h-4 w-4" /> New Deal Banner
            </button>
          </div>
          {bannerLoading && banners.length === 0 ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-red-600" /></div>
          ) : banners.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
              <Gift className="h-12 w-12 mx-auto text-gray-300" />
              <h3 className="mt-3 text-lg font-semibold">No deal banners yet</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto mt-1">
                Create your first section banner (e.g. &quot;Top Deals&quot;) and pick the products it shows.
                Colours and scheduling are fully editable below.
              </p>
              <button
                onClick={openNewBanner}
                className="mt-6 rounded-lg bg-red-600 px-5 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Create banner
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {banners.map(b => (
                <div key={b.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                  <div
                    className="flex flex-wrap items-center justify-between gap-4 px-6 py-5"
                    style={{ background: b.bannerColor, color: b.textColor }}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        {b.isActive ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 opacity-80" />
                        )}
                        <h3 className="text-lg font-bold">{b.title}</h3>
                      </div>
                      {b.subtitle && <p className="text-sm opacity-90 mt-1">{b.subtitle}</p>}
                      <div className="text-xs opacity-80 mt-2 flex flex-wrap gap-3">
                        <span>Sort: #{b.sortOrder}</span>
                        {b.productIds?.length != null && <span>{b.productIds.length} pinned product(s)</span>}
                        {b.categoryId && <span>Category bound</span>}
                        {b.flashSaleId && <span className="inline-flex items-center gap-1"><Zap className="h-3.5 w-3.5" aria-hidden="true" />Linked to flash sale</span>}
                        <span>Clicks: {b.totalClicks ?? 0}</span>
                        <span>Impressions: {b.totalImpressions ?? 0}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditBanner(b)}
                        className="rounded-md bg-white/15 backdrop-blur hover:bg-white/25 px-3 py-1.5 text-sm font-medium flex items-center gap-1"
                      >
                        <Pencil className="h-4 w-4" /> Edit
                      </button>
                      <button
                        onClick={() => deleteBanner(b.id)}
                        className="rounded-md bg-white/15 backdrop-blur hover:bg-red-900/40 px-3 py-1.5 text-sm font-medium flex items-center gap-1"
                      >
                        <Trash2 className="h-4 w-4" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ========== TAB: FLASH SALES ========== */}
      {tab === 'flashsales' && (
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Time-limited events with real per-product sale prices and allocated stock.
            </p>
            <button
              onClick={openNewFlash}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              <Plus className="h-4 w-4" /> New Flash Sale
            </button>
          </div>

          {flashLoading && flashSales.length === 0 ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-red-600" /></div>
          ) : flashSales.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
              <Flame className="h-12 w-12 mx-auto text-orange-400" />
              <h3 className="mt-3 text-lg font-semibold">No flash sales yet</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto mt-1">
                Run a limited-time event with overridden prices and stock caps. Buyers see -XX% badges automatically.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {flashSales.map(fs => (
                <div key={fs.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Flame className="h-5 w-5 text-orange-500" />
                        <h3 className="text-lg font-bold text-gray-900">{fs.name}</h3>
                        {fs.isActive ? (
                          <span className="rounded-full bg-green-100 text-green-700 text-xs px-2.5 py-0.5">Active</span>
                        ) : (
                          <span className="rounded-full bg-gray-100 text-gray-600 text-xs px-2.5 py-0.5">Draft / Scheduled</span>
                        )}
                      </div>
                      {fs.description && <p className="text-sm text-gray-600 mt-1">{fs.description}</p>}
                      <div className="mt-2 text-xs text-gray-500 flex flex-wrap gap-3">
                        <span>From <b>{fs.startDate?.slice(0, 16)}</b></span>
                        <span>To <b>{fs.endDate?.slice(0, 16)}</b></span>
                        <span>{fs.products?.length ?? 0} products</span>
                        {fs.slug && <span className="font-mono">#{fs.slug}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={() => openEditFlash(fs)} className="rounded-md border border-gray-300 hover:bg-gray-50 px-3 py-1.5 text-sm flex items-center gap-1">
                        <Pencil className="h-4 w-4" /> Edit
                      </button>
                      <button onClick={() => stopFlash(fs.id)} className="rounded-md bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 text-sm flex items-center gap-1">
                        <Eye className="h-4 w-4" /> End Now
                      </button>
                      <button onClick={() => deleteFlash(fs.id)} className="rounded-md border border-red-200 text-red-700 hover:bg-red-50 px-3 py-1.5 text-sm flex items-center gap-1">
                        <Trash2 className="h-4 w-4" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ========== TAB: BULK DISCOUNTS ========== */}
      {tab === 'bulk' && (
        <section className="space-y-4">
          <div className="rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 to-orange-50 p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-red-600 mt-0.5 shrink-0" />
              <div className="text-sm text-gray-800">
                <b className="text-red-700">Prices change for real.</b> Applying a discount saves the original
                price to <span className="font-mono">comparePrice</span> and lowers
                the <span className="font-mono">price</span> the buyer pays. Checkout uses the new price.
                Remove discounts safely using &quot;Restore&quot; below.
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm flex flex-col lg:flex-row lg:items-end gap-4">
            <div className="flex-1 min-w-[220px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Search products</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  placeholder="Search by name or SKU..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount %</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={95}
                  value={discountPct}
                  onChange={e => setDiscountPct(Number(e.target.value) || 0)}
                  className="w-28 px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
                <Percent className="h-5 w-5 text-gray-500" />
              </div>
            </div>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={markOnSale}
                onChange={e => setMarkOnSale(e.target.checked)}
                className="w-4 h-4 text-red-600 rounded focus:ring-red-500 border-gray-300"
              />
              <span className="text-sm text-gray-700">Also toggle <b>On Sale</b> flag</span>
            </label>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={runApplyBulk}
                disabled={bulkLoading || selectedIds.size === 0}
                className="rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 px-4 py-2 text-sm font-medium text-white flex items-center gap-2"
              >
                {bulkLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Tag className="h-4 w-4" />}
                Apply -{discountPct}% ({selectedIds.size})
              </button>
              <button
                onClick={runRemoveBulk}
                disabled={bulkLoading || selectedIds.size === 0}
                className="rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 px-4 py-2 text-sm font-medium text-gray-700 flex items-center gap-2"
              >
                Restore prices ({selectedIds.size})
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-700">
                  <tr>
                    <th className="text-left px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={filteredProducts.length > 0 && selectedIds.size === filteredProducts.length}
                        onChange={toggleBulkSelectAll}
                        className="w-4 h-4 text-red-600 rounded focus:ring-red-500 border-gray-300"
                      />
                    </th>
                    <th className="text-left px-4 py-3">Product</th>
                    <th className="text-right px-4 py-3">Price</th>
                    <th className="text-right px-4 py-3">Compare</th>
                    <th className="text-center px-4 py-3">On Sale</th>
                    <th className="text-right px-4 py-3">Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProducts.map((p: any) => {
                    const compare = Number(p.comparePrice || 0)
                    const price = Number(p.price || 0)
                    const pct = compare && compare > price ? Math.round(((compare - price) / compare) * 100) : 0
                    return (
                      <tr key={p.id} className="hover:bg-gray-50/60">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(p.id)}
                            onChange={() => toggleBulkSelect(p.id)}
                            className="w-4 h-4 text-red-600 rounded focus:ring-red-500 border-gray-300"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-11 w-11 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                              {p.images?.[0] || p.image ? (
                                <img src={p.images?.[0] || p.image} alt="" className="h-full w-full object-cover" />
                              ) : null}
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-gray-900 truncate max-w-sm">{p.name}</div>
                              <div className="text-xs text-gray-500">{p.sku || '—'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatPrice(price)}</td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          {compare ? (
                            <>
                              <span className="line-through">{formatPrice(compare)}</span>
                              <span className="ml-2 text-xs text-red-600 font-semibold">-{pct}%</span>
                            </>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {p.isOnSale ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 text-red-700 text-xs px-2 py-0.5">
                              <Flame className="h-3 w-3" /> Sale
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">No</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-700">{p.stockQuantity ?? 0}</td>
                      </tr>
                    )
                  })}
                  {filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center text-gray-400 py-10">
                        No products match your search
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* ========== Banner Modal ========== */}
      {bannerModalOpen && (
        <ModalShell onClose={() => setBannerModalOpen(false)} title={editingBanner.id ? 'Edit Deal Banner' : 'New Deal Banner'}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Section Title *">
              <input
                value={editingBanner.title}
                onChange={e => setEditingBanner({ ...editingBanner, title: e.target.value })}
                placeholder="e.g. Top Deals | Clearance Sale"
                className={inputCls}
              />
            </Field>
            <Field label="Subtitle">
              <input
                value={editingBanner.subtitle || ''}
                onChange={e => setEditingBanner({ ...editingBanner, subtitle: e.target.value })}
                placeholder="Up to 50% off this week only"
                className={inputCls}
              />
            </Field>
            <Field label="Banner Background Colour">
              <div className="flex gap-2">
                <input
                  type="color"
                  value={editingBanner.bannerColor}
                  onChange={e => setEditingBanner({ ...editingBanner, bannerColor: e.target.value })}
                  className="h-10 w-16 rounded-md border border-gray-300"
                />
                <input
                  value={editingBanner.bannerColor}
                  onChange={e => setEditingBanner({ ...editingBanner, bannerColor: e.target.value })}
                  className={inputCls}
                />
              </div>
            </Field>
            <Field label="Text Colour">
              <div className="flex gap-2">
                <input
                  type="color"
                  value={editingBanner.textColor}
                  onChange={e => setEditingBanner({ ...editingBanner, textColor: e.target.value })}
                  className="h-10 w-16 rounded-md border border-gray-300"
                />
                <input
                  value={editingBanner.textColor}
                  onChange={e => setEditingBanner({ ...editingBanner, textColor: e.target.value })}
                  className={inputCls}
                />
              </div>
            </Field>
            <Field label="Link to Category (optional)">
              <select
                value={editingBanner.categoryId || ''}
                onChange={e => setEditingBanner({ ...editingBanner, categoryId: e.target.value })}
                className={inputCls}
              >
                <option value="">— None —</option>
                {categories.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Link to Flash Sale (optional)">
              <select
                value={editingBanner.flashSaleId || ''}
                onChange={e => setEditingBanner({ ...editingBanner, flashSaleId: e.target.value })}
                className={inputCls}
              >
                <option value="">— None —</option>
                {flashSales.map((fs: any) => (
                  <option key={fs.id} value={fs.id}>{fs.name}</option>
                ))}
              </select>
            </Field>
            <Field label="See All URL">
              <input
                value={editingBanner.seeAllUrl || ''}
                onChange={e => setEditingBanner({ ...editingBanner, seeAllUrl: e.target.value })}
                placeholder="/shop"
                className={inputCls}
              />
            </Field>
            <Field label="See All Button Text">
              <input
                value={editingBanner.seeAllLabel}
                onChange={e => setEditingBanner({ ...editingBanner, seeAllLabel: e.target.value })}
                placeholder="See All"
                className={inputCls}
              />
            </Field>
            <Field label="Start Date / Time (optional)">
              <input
                type="datetime-local"
                value={editingBanner.startDate || ''}
                onChange={e => setEditingBanner({ ...editingBanner, startDate: e.target.value })}
                className={inputCls}
              />
            </Field>
            <Field label="End Date / Time (optional)">
              <input
                type="datetime-local"
                value={editingBanner.endDate || ''}
                onChange={e => setEditingBanner({ ...editingBanner, endDate: e.target.value })}
                className={inputCls}
              />
            </Field>
            <Field label="Sort Order">
              <input
                type="number"
                value={editingBanner.sortOrder}
                onChange={e => setEditingBanner({ ...editingBanner, sortOrder: Number(e.target.value) || 0 })}
                className={inputCls}
              />
            </Field>
            <Field label="Status">
              <label className="flex items-center gap-2 h-10">
                <input
                  type="checkbox"
                  checked={editingBanner.isActive}
                  onChange={e => setEditingBanner({ ...editingBanner, isActive: e.target.checked })}
                  className="w-4 h-4 text-red-600 rounded focus:ring-red-500 border-gray-300"
                />
                <span className="text-sm text-gray-700">Banner is active &amp; visible on homepage</span>
              </label>
            </Field>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Pinned Products ({editingBanner.productIds.length})</label>
              <button
                type="button"
                onClick={() => { setPickerTarget('banner'); setPickerSearch(''); setProductPickerOpen(true) }}
                className="text-xs rounded-md bg-gray-100 hover:bg-gray-200 px-3 py-1.5 font-medium text-gray-700 flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" /> Choose products
              </button>
            </div>
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50/50 p-3 min-h-[56px] flex flex-wrap gap-2">
              {editingBanner.productIds.length === 0 && (
                <span className="text-xs text-gray-500 self-center">No products pinned — this banner will fall back to the category or flash sale products above.</span>
              )}
              {editingBanner.productIds.map(id => {
                const prod = productCatalog.find((p: any) => p.id === id)
                if (!prod) return null
                return (
                  <div key={id} className="flex items-center gap-2 rounded-full bg-white border border-gray-200 pl-3 pr-1 py-1 text-xs">
                    <span className="font-medium max-w-[200px] truncate">{prod.name}</span>
                    <button
                      type="button"
                      onClick={() => setEditingBanner({ ...editingBanner, productIds: editingBanner.productIds.filter(x => x !== id) })}
                      className="text-gray-400 hover:text-red-600 p-1"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button onClick={() => setBannerModalOpen(false)} className="rounded-lg border border-gray-300 hover:bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
              Cancel
            </button>
            <button onClick={saveBanner} className="rounded-lg bg-red-600 hover:bg-red-700 text-white px-5 py-2 text-sm font-medium flex items-center gap-2">
              <Save className="h-4 w-4" /> Save Banner
            </button>
          </div>
        </ModalShell>
      )}

      {/* ========== Flash Sale Modal ========== */}
      {flashModalOpen && (
        <ModalShell onClose={() => setFlashModalOpen(false)} title={editingFlash.id ? 'Edit Flash Sale' : 'New Flash Sale'}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Event Name *">
              <input value={editingFlash.name} onChange={e => setEditingFlash({ ...editingFlash, name: e.target.value })} className={inputCls} placeholder="Mega Eid Sale" />
            </Field>
            <Field label="Short Slug">
              <input value={editingFlash.slug || ''} onChange={e => setEditingFlash({ ...editingFlash, slug: e.target.value })} className={inputCls} placeholder="mega-eid-2025" />
            </Field>
            <Field label="Starts At *">
              <input type="datetime-local" value={editingFlash.startDate} onChange={e => setEditingFlash({ ...editingFlash, startDate: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Ends At *">
              <input type="datetime-local" value={editingFlash.endDate} onChange={e => setEditingFlash({ ...editingFlash, endDate: e.target.value })} className={inputCls} />
            </Field>
            <div className="md:col-span-2">
              <Field label="Description">
                <textarea
                  rows={2}
                  value={editingFlash.description || ''}
                  onChange={e => setEditingFlash({ ...editingFlash, description: e.target.value })}
                  className={inputCls}
                  placeholder="Short text shown on the deals banner (optional)"
                />
              </Field>
            </div>
            <div className="md:col-span-2">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingFlash.isActive}
                  onChange={e => setEditingFlash({ ...editingFlash, isActive: e.target.checked })}
                  className="w-4 h-4 text-red-600 rounded focus:ring-red-500 border-gray-300"
                />
                <span className="text-sm text-gray-700">Enabled &amp; running during the window</span>
              </label>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">Products &amp; Sale Prices *</label>
              <button
                type="button"
                onClick={() => {
                  setEditingFlash({ ...editingFlash, products: [...editingFlash.products, { productId: '', salePrice: 0, originalPrice: 0, stockAllocated: 0 }] })
                }}
                className="text-xs rounded-md bg-gray-100 hover:bg-gray-200 px-3 py-1.5 font-medium text-gray-700 flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" /> Add row
              </button>
            </div>

            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-700 text-xs">
                    <tr>
                      <th className="text-left px-3 py-2">Product</th>
                      <th className="text-right px-3 py-2 w-32">Original</th>
                      <th className="text-right px-3 py-2 w-32">Sale Price</th>
                      <th className="text-right px-3 py-2 w-24">Stock Cap</th>
                      <th className="px-3 py-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {editingFlash.products.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-3 py-6 text-center text-gray-400">
                          Click <span className="font-semibold">Add row</span> above to add discounted products
                        </td>
                      </tr>
                    )}
                    {editingFlash.products.map((row, idx) => {
                      const prod = productCatalog.find((p: any) => p.id === row.productId)
                      const pct = row.originalPrice > row.salePrice && row.salePrice > 0
                        ? Math.round(((row.originalPrice - row.salePrice) / row.originalPrice) * 100)
                        : 0
                      return (
                        <tr key={idx}>
                          <td className="px-3 py-2">
                            <button
                              type="button"
                              onClick={() => { setPickerTarget('flash'); setPickerFlashIdx(idx); setPickerSearch(''); setProductPickerOpen(true) }}
                              className="w-full text-left rounded-md border border-dashed border-gray-300 px-3 py-2 text-sm hover:border-red-400 hover:bg-red-50/40"
                            >
                              {prod ? (
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-medium truncate">{prod.name}</span>
                                  {pct > 0 && <span className="text-xs font-semibold text-red-600 shrink-0">-{pct}%</span>}
                                </div>
                              ) : (
                                <span className="text-gray-400">Click to choose a product…</span>
                              )}
                            </button>
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              value={row.originalPrice}
                              onChange={e => setEditingFlash({
                                ...editingFlash,
                                products: editingFlash.products.map((r, i) => i === idx ? { ...r, originalPrice: Number(e.target.value) || 0 } : r)
                              })}
                              className="w-full text-right px-2 py-1.5 rounded-md border border-gray-300 text-sm"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              value={row.salePrice}
                              onChange={e => setEditingFlash({
                                ...editingFlash,
                                products: editingFlash.products.map((r, i) => i === idx ? { ...r, salePrice: Number(e.target.value) || 0 } : r)
                              })}
                              className="w-full text-right px-2 py-1.5 rounded-md border border-gray-300 text-sm font-semibold text-red-700"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              value={row.stockAllocated}
                              onChange={e => setEditingFlash({
                                ...editingFlash,
                                products: editingFlash.products.map((r, i) => i === idx ? { ...r, stockAllocated: Number(e.target.value) || 0 } : r)
                              })}
                              className="w-full text-right px-2 py-1.5 rounded-md border border-gray-300 text-sm"
                            />
                          </td>
                          <td className="px-3 py-2 text-right">
                            <button
                              type="button"
                              onClick={() => setEditingFlash({
                                ...editingFlash,
                                products: editingFlash.products.filter((_, i) => i !== idx)
                              })}
                              className="text-gray-400 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button onClick={() => setFlashModalOpen(false)} className="rounded-lg border border-gray-300 hover:bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
              Cancel
            </button>
            <button onClick={saveFlash} className="rounded-lg bg-red-600 hover:bg-red-700 text-white px-5 py-2 text-sm font-medium flex items-center gap-2">
              {flashLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Flash Sale
            </button>
          </div>
        </ModalShell>
      )}

      {/* ========== Product Picker ========== */}
      {productPickerOpen && (
        <ModalShell onClose={() => setProductPickerOpen(false)} title="Choose a product">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                autoFocus
                value={pickerSearch}
                onChange={e => setPickerSearch(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
          </div>
          <div className="max-h-[60vh] overflow-y-auto space-y-1 pr-1">
            {pickerFiltered.length === 0 && <div className="text-center py-10 text-gray-400 text-sm">No products match</div>}
            {pickerFiltered.map((p: any) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  if (pickerTarget === 'banner') {
                    if (!editingBanner.productIds.includes(p.id)) {
                      setEditingBanner({ ...editingBanner, productIds: [...editingBanner.productIds, p.id] })
                    }
                    setProductPickerOpen(false)
                  } else {
                    addProductToFlash(p)
                  }
                }}
                className="w-full flex items-center gap-3 rounded-lg p-2 hover:bg-red-50 text-left border border-transparent hover:border-red-200"
              >
                <div className="h-12 w-12 bg-gray-100 rounded-md overflow-hidden shrink-0">
                  {p.images?.[0] || p.image ? <img src={p.images?.[0] || p.image} alt="" className="h-full w-full object-cover" /> : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-gray-900 truncate">{p.name}</div>
                  <div className="text-xs text-gray-500">{p.sku || '—'} · in stock: {p.stockQuantity ?? 0}</div>
                </div>
                <div className="text-sm font-semibold text-gray-900">{formatPrice(Number(p.price || 0))}</div>
              </button>
            ))}
          </div>
        </ModalShell>
      )}
    </div>
  )
}

// ==== UI helpers ====
const inputCls = 'w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm'

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    {children}
  </div>
)

const ModalShell: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-3 bg-black/60 overflow-y-auto">
    <div className="my-6 w-full max-w-4xl rounded-2xl bg-white shadow-2xl">
      <div className="sticky top-0 flex items-center justify-between gap-2 px-6 py-4 border-b border-gray-200 bg-white rounded-t-2xl">
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
)

export default DealsPage
