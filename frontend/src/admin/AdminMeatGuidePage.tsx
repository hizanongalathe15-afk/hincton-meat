import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Plus, Save, Trash2, Beef, X, ArrowUp, ArrowDown } from 'lucide-react'
import { meatGuideAdminApi } from '../services/adminApi'
import { useConfirmationDialog } from '../hooks/useConfirmationDialog'
import ConfirmationDialog from '../components/ui/ConfirmationDialog'
import AdminImageField from './AdminImageField'
import { getApiHost } from '../services/api'

const inputCls = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-500'
const labelCls = 'block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5'

interface CategoryDraft {
  id: string
  key: string
  label: string
  title: string
  subtitle: string
  sortOrder: number
  isActive: boolean
}

interface CutDraft {
  id: string
  categoryKey: string
  name: string
  localName: string
  bestFor: string
  cookingMethod: string
  recommendedTemp: string
  flavorProfile: string
  priceApprox: number
  unit: string
  image: string
  tips: string
  categorySlug: string
  sortOrder: number
  isActive: boolean
}

const AdminMeatGuidePage = () => {
  const [tab, setTab] = useState<'categories' | 'cuts'>('categories')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [cuts, setCuts] = useState<any[]>([])
  const [cutFilter, setCutFilter] = useState('ALL')
  const [editing, setEditing] = useState<{ kind: 'category' | 'cut'; id: string } | null>(null)
  const [catDraft, setCatDraft] = useState<CategoryDraft | null>(null)
  const [cutDraft, setCutDraft] = useState<CutDraft | null>(null)
  const { isOpen, options, confirm, handleConfirm, handleCancel } = useConfirmationDialog()

  const load = async () => {
    setLoading(true)
    try {
      const [catRes, cutRes] = await Promise.all([meatGuideAdminApi.listCategories(), meatGuideAdminApi.listCuts()])
      setCategories(catRes.categories || [])
      setCuts(cutRes.cuts || [])
    } catch {
      toast.error('Could not load meat guide')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const resolveImage = (url?: string) => (url?.startsWith('http') ? url : `${getApiHost()}${url || ''}`)

  // ---------- Categories ----------
  const startNewCategory = () => {
    setCatDraft({ id: '', key: '', label: '', title: '', subtitle: '', sortOrder: categories.length, isActive: true })
    setEditing({ kind: 'category', id: 'NEW' })
  }

  const startEditCategory = (c: any) => {
    setCatDraft({ id: c.id, key: c.key, label: c.label, title: c.title, subtitle: c.subtitle, sortOrder: c.sortOrder, isActive: c.isActive !== false })
    setEditing({ kind: 'category', id: c.id })
  }

  const submitCategory = async () => {
    if (!catDraft) return
    if (!catDraft.key.trim() || !catDraft.label.trim() || !catDraft.title.trim()) return toast.error('Key, label and title are required')
    setSaving(true)
    try {
      const payload = {
        key: catDraft.key.trim(),
        label: catDraft.label.trim(),
        title: catDraft.title.trim(),
        subtitle: catDraft.subtitle.trim(),
        sortOrder: Number(catDraft.sortOrder) || 0,
        isActive: catDraft.isActive,
      }
      if (catDraft.id) {
        await meatGuideAdminApi.updateCategory(catDraft.id, payload)
        toast.success('Category updated')
      } else {
        await meatGuideAdminApi.createCategory(payload)
        toast.success('Category created')
      }
      setEditing(null)
      await load()
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Could not save category')
    } finally {
      setSaving(false)
    }
  }

  const removeCategory = (c: any) => {
    confirm({
      title: 'Delete category?',
      message: `Delete "${c.label}" and ALL of its cuts? This cannot be undone.`,
      type: 'danger',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          await meatGuideAdminApi.deleteCategory(c.id)
          toast.success('Category deleted')
          await load()
        } catch {
          toast.error('Could not delete category')
        }
      },
    })
  }

  const moveCategory = async (index: number, dir: -1 | 1) => {
    const target = index + dir
    if (target < 0 || target >= categories.length) return
    const a = categories[index]
    const b = categories[target]
    let aOrder = a.sortOrder
    let bOrder = b.sortOrder
    if (aOrder === bOrder) {
      aOrder = index
      bOrder = target
    }
    try {
      await Promise.all([
        meatGuideAdminApi.updateCategory(a.id, { sortOrder: bOrder }),
        meatGuideAdminApi.updateCategory(b.id, { sortOrder: aOrder }),
      ])
      await load()
    } catch {
      toast.error('Could not reorder categories')
    }
  }

  // ---------- Cuts ----------
  const visibleCuts = cuts
    .filter((c) => cutFilter === 'ALL' || c.category?.key === cutFilter)
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)

  const startNewCut = () => {
    const first = categories[0]
    setCutDraft({
      id: '',
      categoryKey: cutFilter !== 'ALL' ? cutFilter : first?.key || '',
      name: '',
      localName: '',
      bestFor: '',
      cookingMethod: '',
      recommendedTemp: '',
      flavorProfile: '',
      priceApprox: 0,
      unit: 'per kg',
      image: '',
      tips: '',
      categorySlug: first?.key || '',
      sortOrder: visibleCuts.length,
      isActive: true,
    })
    setEditing({ kind: 'cut', id: 'NEW' })
  }

  const startEditCut = (c: any) => {
    setCutDraft({
      id: c.id,
      categoryKey: c.category?.key || '',
      name: c.name || '',
      localName: c.localName || '',
      bestFor: c.bestFor || '',
      cookingMethod: c.cookingMethod || '',
      recommendedTemp: c.recommendedTemp || '',
      flavorProfile: c.flavorProfile || '',
      priceApprox: Number(c.priceApprox) || 0,
      unit: c.unit || 'per kg',
      image: c.image || '',
      tips: c.tips || '',
      categorySlug: c.categorySlug || '',
      sortOrder: Number(c.sortOrder) || 0,
      isActive: c.isActive !== false,
    })
    setEditing({ kind: 'cut', id: c.id })
  }

  const submitCut = async () => {
    if (!cutDraft) return
    if (!cutDraft.name.trim() || !cutDraft.categoryKey) return toast.error('Cut name and category are required')
    if (!cutDraft.image.trim()) return toast.error('An image is required')
    setSaving(true)
    try {
      const payload = {
        categoryKey: cutDraft.categoryKey,
        name: cutDraft.name.trim(),
        localName: cutDraft.localName.trim() || null,
        bestFor: cutDraft.bestFor.trim(),
        cookingMethod: cutDraft.cookingMethod.trim(),
        recommendedTemp: cutDraft.recommendedTemp.trim(),
        flavorProfile: cutDraft.flavorProfile.trim(),
        priceApprox: Number(cutDraft.priceApprox),
        unit: cutDraft.unit.trim() || 'per kg',
        image: cutDraft.image.trim(),
        tips: cutDraft.tips.trim(),
        categorySlug: cutDraft.categorySlug.trim() || cutDraft.categoryKey,
        sortOrder: Number(cutDraft.sortOrder) || 0,
        isActive: cutDraft.isActive,
      }
      if (cutDraft.id) {
        await meatGuideAdminApi.updateCut(cutDraft.id, payload)
        toast.success('Cut updated')
      } else {
        await meatGuideAdminApi.createCut(payload)
        toast.success('Cut created')
      }
      setEditing(null)
      await load()
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Could not save cut')
    } finally {
      setSaving(false)
    }
  }

  const removeCut = (c: any) => {
    confirm({
      title: 'Delete cut?',
      message: `Delete "${c.name}" from the butcher's guide?`,
      type: 'danger',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          await meatGuideAdminApi.deleteCut(c.id)
          toast.success('Cut deleted')
          await load()
        } catch {
          toast.error('Could not delete cut')
        }
      },
    })
  }

  const moveCut = async (index: number, dir: -1 | 1) => {
    const target = index + dir
    if (target < 0 || target >= visibleCuts.length) return
    const a = visibleCuts[index]
    const b = visibleCuts[target]
    let aOrder = a.sortOrder
    let bOrder = b.sortOrder
    if (aOrder === bOrder) {
      aOrder = index
      bOrder = target
    }
    try {
      await Promise.all([
        meatGuideAdminApi.updateCut(a.id, { sortOrder: bOrder }),
        meatGuideAdminApi.updateCut(b.id, { sortOrder: aOrder }),
      ])
      await load()
    } catch {
      toast.error('Could not reorder cuts')
    }
  }

  // ---------- Category edit view ----------
  if (editing?.kind === 'category' && catDraft) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
        <button onClick={() => setEditing(null)} className="inline-flex items-center gap-2 text-sm font-bold text-red-700 hover:text-red-800 mb-6">
          <X className="h-4 w-4" /> Back to meat guide
        </button>
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-gray-950 via-[#9f2f20] to-gray-950 text-white px-6 py-5">
            <h1 className="text-2xl font-extrabold">{catDraft.id ? 'Edit Category' : 'Create Category'}</h1>
            <p className="text-sm text-red-200 mt-1">Categories become the tabs of the Master Butcher's Guide.</p>
          </div>
          <div className="p-6 space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className={labelCls}>Key (URL-safe, unique)</label>
                <input value={catDraft.key} onChange={(e) => setCatDraft({ ...catDraft, key: e.target.value })} disabled={!!catDraft.id} placeholder="beef / goat / lamb / poultry" className={`${inputCls} ${catDraft.id ? 'opacity-60' : ''}`} />
              </div>
              <div>
                <label className={labelCls}>Tab label</label>
                <input value={catDraft.label} onChange={(e) => setCatDraft({ ...catDraft, label: e.target.value })} placeholder="Prime Beef" className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Title</label>
              <input value={catDraft.title} onChange={(e) => setCatDraft({ ...catDraft, title: e.target.value })} placeholder="Prime Beef Cuts" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Subtitle</label>
              <textarea value={catDraft.subtitle} onChange={(e) => setCatDraft({ ...catDraft, subtitle: e.target.value })} rows={2} placeholder="Short description shown under the tab" className={inputCls} />
            </div>
            <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
              <div>
                <label className={labelCls}>Sort order</label>
                <input type="number" value={catDraft.sortOrder} onChange={(e) => setCatDraft({ ...catDraft, sortOrder: Number(e.target.value) })} className={inputCls} />
              </div>
              <label className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-200 bg-white text-sm">
                <input type="checkbox" checked={catDraft.isActive} onChange={(e) => setCatDraft({ ...catDraft, isActive: e.target.checked })} />
                Active (visible)
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setEditing(null)} className="rounded-lg border border-gray-200 bg-white px-5 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={submitCategory} disabled={saving} className="rounded-lg bg-red-600 px-5 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60 inline-flex items-center gap-2">
                <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save Category'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ---------- Cut edit view ----------
  if (editing?.kind === 'cut' && cutDraft) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
        <button onClick={() => setEditing(null)} className="inline-flex items-center gap-2 text-sm font-bold text-red-700 hover:text-red-800 mb-6">
          <X className="h-4 w-4" /> Back to meat guide
        </button>
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-gray-950 via-[#9f2f20] to-gray-950 text-white px-6 py-5">
            <h1 className="text-2xl font-extrabold">{cutDraft.id ? 'Edit Cut' : 'Add Cut'}</h1>
            <p className="text-sm text-red-200 mt-1">Cuts appear in the guide picker with price, temp and butcher tips.</p>
          </div>
          <div className="p-6 space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className={labelCls}>Category</label>
                <select value={cutDraft.categoryKey} onChange={(e) => setCutDraft({ ...cutDraft, categoryKey: e.target.value })} className={inputCls}>
                  {categories.map((c) => <option key={c.id} value={c.key}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Shop category slug (for "Shop This Cut" link)</label>
                <input value={cutDraft.categorySlug} onChange={(e) => setCutDraft({ ...cutDraft, categorySlug: e.target.value })} placeholder="beef" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Cut name</label>
                <input value={cutDraft.name} onChange={(e) => setCutDraft({ ...cutDraft, name: e.target.value })} placeholder="Prime Ribeye Steak" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Local name (optional)</label>
                <input value={cutDraft.localName} onChange={(e) => setCutDraft({ ...cutDraft, localName: e.target.value })} placeholder="Steak ya Mbavu" className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Best for</label>
              <input value={cutDraft.bestFor} onChange={(e) => setCutDraft({ ...cutDraft, bestFor: e.target.value })} placeholder="High heat grilling & cast-iron searing" className={inputCls} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className={labelCls}>Cooking method</label>
                <input value={cutDraft.cookingMethod} onChange={(e) => setCutDraft({ ...cutDraft, cookingMethod: e.target.value })} placeholder="Grill / Choma" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Recommended temp</label>
                <input value={cutDraft.recommendedTemp} onChange={(e) => setCutDraft({ ...cutDraft, recommendedTemp: e.target.value })} placeholder="54°C (Medium Rare)" className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Flavor profile</label>
              <textarea value={cutDraft.flavorProfile} onChange={(e) => setCutDraft({ ...cutDraft, flavorProfile: e.target.value })} rows={2} placeholder="Rich, intensely juicy…" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Butcher's tip</label>
              <textarea value={cutDraft.tips} onChange={(e) => setCutDraft({ ...cutDraft, tips: e.target.value })} rows={3} placeholder="Season generously with sea salt…" className={inputCls} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className={labelCls}>Approx. price (KSh)</label>
                <input type="number" min={0} value={cutDraft.priceApprox} onChange={(e) => setCutDraft({ ...cutDraft, priceApprox: Number(e.target.value) })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Unit</label>
                <input value={cutDraft.unit} onChange={(e) => setCutDraft({ ...cutDraft, unit: e.target.value })} placeholder="per kg" className={inputCls} />
              </div>
            </div>
            <AdminImageField value={cutDraft.image} onChange={(url) => setCutDraft({ ...cutDraft, image: url })} label="Cut image" />
            <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
              <div>
                <label className={labelCls}>Sort order</label>
                <input type="number" value={cutDraft.sortOrder} onChange={(e) => setCutDraft({ ...cutDraft, sortOrder: Number(e.target.value) })} className={inputCls} />
              </div>
              <label className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-200 bg-white text-sm">
                <input type="checkbox" checked={cutDraft.isActive} onChange={(e) => setCutDraft({ ...cutDraft, isActive: e.target.checked })} />
                Active (visible)
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setEditing(null)} className="rounded-lg border border-gray-200 bg-white px-5 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={submitCut} disabled={saving} className="rounded-lg bg-red-600 px-5 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60 inline-flex items-center gap-2">
                <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save Cut'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ---------- List view ----------
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-950 inline-flex items-center gap-2"><Beef className="h-8 w-8 text-red-600" /> Master Butcher's Guide</h1>
          <p className="mt-1 text-sm text-gray-600">Manage the meat category tabs and their cuts shown on the homepage guide.</p>
        </div>
        <button
          onClick={tab === 'categories' ? startNewCategory : startNewCut}
          className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-700"
        >
          <Plus className="h-4 w-4" /> {tab === 'categories' ? 'Add Category' : 'Add Cut'}
        </button>
      </div>

      <div className="mb-6 flex items-center gap-2">
        <button onClick={() => setTab('categories')} className={`rounded-lg px-4 py-2 text-sm font-bold ${tab === 'categories' ? 'bg-gray-950 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'}`}>
          Categories ({categories.length})
        </button>
        <button onClick={() => setTab('cuts')} className={`rounded-lg px-4 py-2 text-sm font-bold ${tab === 'cuts' ? 'bg-gray-950 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'}`}>
          Cuts ({cuts.length})
        </button>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm divide-y divide-gray-100">
          {[0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse bg-white" />)}
        </div>
      ) : tab === 'categories' ? (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm divide-y divide-gray-100">
          {categories.map((c, i) => (
            <div key={c.id} className="p-4 sm:p-5 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-gray-950">{c.label}</h3>
                  <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-500">{c.key}</span>
                  {c.isActive === false && <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-700">Hidden</span>}
                </div>
                <p className="mt-1 text-sm text-gray-600 line-clamp-1">{c.subtitle}</p>
                <p className="mt-1 text-xs text-gray-500">{c._count?.cuts ?? 0} cuts · Order: {c.sortOrder}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex flex-col">
                  <button onClick={() => moveCategory(i, -1)} disabled={i === 0} className="rounded p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30" title="Move up"><ArrowUp className="h-4 w-4" /></button>
                  <button onClick={() => moveCategory(i, 1)} disabled={i === categories.length - 1} className="rounded p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30" title="Move down"><ArrowDown className="h-4 w-4" /></button>
                </div>
                <button onClick={() => startEditCategory(c)} className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-bold text-gray-700 hover:bg-gray-50">Edit</button>
                <button onClick={() => removeCategory(c)} className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-bold text-red-700 hover:bg-red-50 inline-flex items-center gap-1">
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-4">
            <select value={cutFilter} onChange={(e) => setCutFilter(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-500">
              <option value="ALL">All categories</option>
              {categories.map((c) => <option key={c.id} value={c.key}>{c.label}</option>)}
            </select>
          </div>
          <div className="divide-y divide-gray-100">
            {visibleCuts.length === 0 ? (
              <div className="p-12 text-center">
                <Beef className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-4 font-semibold text-gray-700">No cuts in this category yet.</p>
              </div>
            ) : (
              visibleCuts.map((c, i) => (
                <div key={c.id} className="p-4 sm:p-5 flex flex-col gap-3 lg:flex-row lg:items-center">
                  <img src={resolveImage(c.image)} alt={c.name} className="h-16 w-16 shrink-0 rounded-xl object-cover border border-gray-100" />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-gray-950">{c.name}</h3>
                      {c.localName && <span className="text-xs text-gray-500 italic">({c.localName})</span>}
                      <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-500">{c.category?.label || c.categoryId}</span>
                      {c.isActive === false && <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-700">Hidden</span>}
                    </div>
                    <p className="mt-1 text-sm text-gray-600 line-clamp-1">{c.bestFor}</p>
                    <p className="mt-1 text-xs text-gray-500">KSh {Number(c.priceApprox).toLocaleString()} {c.unit} · {c.recommendedTemp} · Order: {c.sortOrder}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex flex-col">
                      <button onClick={() => moveCut(i, -1)} disabled={i === 0} className="rounded p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30" title="Move up"><ArrowUp className="h-4 w-4" /></button>
                      <button onClick={() => moveCut(i, 1)} disabled={i === visibleCuts.length - 1} className="rounded p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30" title="Move down"><ArrowDown className="h-4 w-4" /></button>
                    </div>
                    <button onClick={() => startEditCut(c)} className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-bold text-gray-700 hover:bg-gray-50">Edit</button>
                    <button onClick={() => removeCut(c)} className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-bold text-red-700 hover:bg-red-50 inline-flex items-center gap-1">
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <ConfirmationDialog isOpen={isOpen} onClose={handleCancel} onConfirm={handleConfirm} title={options?.title || ''} message={options?.message || ''} confirmText={options?.confirmText} cancelText={options?.cancelText} type={options?.type} />
    </div>
  )
}

export default AdminMeatGuidePage
