import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Plus, Save, Trash2, ChefHat, X, ArrowUp, ArrowDown, Link2 } from 'lucide-react'
import { recipesAdminApi, productsApi } from '../services/adminApi'
import { useConfirmationDialog } from '../hooks/useConfirmationDialog'
import ConfirmationDialog from '../components/ui/ConfirmationDialog'
import AdminImageField from './AdminImageField'
import { getApiHost } from '../services/api'

const DIFFICULTIES = ['Easy', 'Medium', 'Hard']

interface RecipeDraft {
  id: string
  title: string
  subtitle: string
  prepTime: string
  cookTime: string
  servings: string
  difficulty: string
  tagsText: string
  ingredientsText: string
  instructionsText: string
  cutName: string
  cutCategory: string
  cutPrice: number
  cutWeight: string
  cutImage: string
  productId: string
  sortOrder: number
  isActive: boolean
}

const emptyDraft = (sortOrder: number): RecipeDraft => ({
  id: '',
  title: '',
  subtitle: '',
  prepTime: '',
  cookTime: '',
  servings: '',
  difficulty: 'Easy',
  tagsText: '',
  ingredientsText: '',
  instructionsText: '',
  cutName: '',
  cutCategory: 'beef',
  cutPrice: 0,
  cutWeight: '1 kg',
  cutImage: '',
  productId: '',
  sortOrder,
  isActive: true,
})

const AdminRecipesPage = () => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [recipes, setRecipes] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<RecipeDraft>(emptyDraft(0))
  const { isOpen, options, confirm, handleConfirm, handleCancel } = useConfirmationDialog()

  const load = async () => {
    setLoading(true)
    try {
      const [recipeRes, productRes] = await Promise.all([
        recipesAdminApi.list(),
        productsApi.getProducts({ limit: 300 }),
      ])
      setRecipes((recipeRes.recipes || []).slice().sort((a: any, b: any) => a.sortOrder - b.sortOrder))
      setProducts(productRes.products || [])
    } catch {
      toast.error('Could not load recipes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const productName = (id?: string | null) => products.find((p) => p.id === id)?.name

  const startNew = () => {
    setDraft(emptyDraft(recipes.length ? Math.max(...recipes.map((r) => r.sortOrder)) + 1 : 0))
    setEditingId('NEW')
  }

  const startEdit = (r: any) => {
    setDraft({
      id: r.id,
      title: r.title || '',
      subtitle: r.subtitle || '',
      prepTime: r.prepTime || '',
      cookTime: r.cookTime || '',
      servings: r.servings || '',
      difficulty: r.difficulty || 'Easy',
      tagsText: (Array.isArray(r.tags) ? r.tags : []).join(', '),
      ingredientsText: (Array.isArray(r.ingredients) ? r.ingredients : []).join('\n'),
      instructionsText: (Array.isArray(r.instructions) ? r.instructions : []).join('\n'),
      cutName: r.cutName || '',
      cutCategory: r.cutCategory || 'beef',
      cutPrice: Number(r.cutPrice) || 0,
      cutWeight: r.cutWeight || '',
      cutImage: r.cutImage || '',
      productId: r.productId || '',
      sortOrder: Number(r.sortOrder) || 0,
      isActive: r.isActive !== false,
    })
    setEditingId(r.id)
  }

  const lines = (text: string) => text.split('\n').map((l) => l.trim()).filter(Boolean)

  const submit = async () => {
    if (!draft.title.trim() || !draft.subtitle.trim()) return toast.error('Title and subtitle are required')
    if (!draft.cutName.trim() || !draft.cutImage.trim()) return toast.error('Featured cut name and image are required')
    if (lines(draft.ingredientsText).length === 0) return toast.error('Add at least one ingredient')
    if (lines(draft.instructionsText).length === 0) return toast.error('Add at least one instruction step')
    setSaving(true)
    try {
      const payload = {
        title: draft.title.trim(),
        subtitle: draft.subtitle.trim(),
        prepTime: draft.prepTime.trim(),
        cookTime: draft.cookTime.trim(),
        servings: draft.servings.trim(),
        difficulty: draft.difficulty,
        tags: draft.tagsText.split(',').map((t) => t.trim()).filter(Boolean),
        ingredients: lines(draft.ingredientsText),
        instructions: lines(draft.instructionsText),
        cutName: draft.cutName.trim(),
        cutCategory: draft.cutCategory.trim(),
        cutPrice: Number(draft.cutPrice),
        cutWeight: draft.cutWeight.trim(),
        cutImage: draft.cutImage.trim(),
        productId: draft.productId || null,
        sortOrder: Number(draft.sortOrder) || 0,
        isActive: draft.isActive,
      }
      if (draft.id) {
        await recipesAdminApi.update(draft.id, payload)
        toast.success('Recipe updated')
      } else {
        await recipesAdminApi.create(payload)
        toast.success('Recipe created')
      }
      setEditingId(null)
      await load()
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Could not save recipe')
    } finally {
      setSaving(false)
    }
  }

  const remove = (r: any) => {
    confirm({
      title: 'Delete recipe?',
      message: `Delete "${r.title}"? It will disappear from the Butcher's Kitchen section.`,
      type: 'danger',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          await recipesAdminApi.remove(r.id)
          toast.success('Recipe deleted')
          await load()
        } catch {
          toast.error('Could not delete recipe')
        }
      },
    })
  }

  // Reorder: swap sortOrder with the neighbour above/below
  const move = async (index: number, dir: -1 | 1) => {
    const target = index + dir
    if (target < 0 || target >= recipes.length) return
    const a = recipes[index]
    const b = recipes[target]
    let aOrder = a.sortOrder
    let bOrder = b.sortOrder
    if (aOrder === bOrder) {
      aOrder = index
      bOrder = target
    }
    try {
      await Promise.all([
        recipesAdminApi.update(a.id, { sortOrder: bOrder }),
        recipesAdminApi.update(b.id, { sortOrder: aOrder }),
      ])
      await load()
    } catch {
      toast.error('Could not reorder recipes')
    }
  }

  const inputCls = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-500'
  const labelCls = 'block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5'

  if (editingId) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
        <button onClick={() => setEditingId(null)} className="inline-flex items-center gap-2 text-sm font-bold text-red-700 hover:text-red-800 mb-6">
          <X className="h-4 w-4" /> Back to recipes
        </button>
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-gray-950 via-[#9f2f20] to-gray-950 text-white px-6 py-5">
            <h1 className="text-2xl font-extrabold">{draft.id ? 'Edit Recipe' : 'Create Recipe'}</h1>
            <p className="text-sm text-red-200 mt-1">Shown in the homepage "Butcher's Kitchen Inspiration" section.</p>
          </div>
          <div className="p-6 space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className={labelCls}>Title</label>
                <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Authentic Kenyan Nyama Choma" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Difficulty</label>
                <select value={draft.difficulty} onChange={(e) => setDraft({ ...draft, difficulty: e.target.value })} className={inputCls}>
                  {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={labelCls}>Subtitle</label>
              <input value={draft.subtitle} onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })} placeholder="Short appetizing description" className={inputCls} />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className={labelCls}>Prep time</label>
                <input value={draft.prepTime} onChange={(e) => setDraft({ ...draft, prepTime: e.target.value })} placeholder="15 mins" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Cook time</label>
                <input value={draft.cookTime} onChange={(e) => setDraft({ ...draft, cookTime: e.target.value })} placeholder="45 mins" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Servings</label>
                <input value={draft.servings} onChange={(e) => setDraft({ ...draft, servings: e.target.value })} placeholder="4-6 people" className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Tags (comma separated)</label>
              <input value={draft.tagsText} onChange={(e) => setDraft({ ...draft, tagsText: e.target.value })} placeholder="BBQ / Choma, Goat / Mbuzi, Traditional Kenyan" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Ingredients (one per line)</label>
              <textarea value={draft.ingredientsText} onChange={(e) => setDraft({ ...draft, ingredientsText: e.target.value })} rows={6} placeholder={'1.5kg Fresh Goat Ribs\n2 tbsp Coarse Sea Salt'} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Instructions (one step per line)</label>
              <textarea value={draft.instructionsText} onChange={(e) => setDraft({ ...draft, instructionsText: e.target.value })} rows={7} placeholder={'Prepare medium-hot charcoal…\nBaste every 10 minutes…'} className={inputCls} />
            </div>

            <div className="rounded-xl border border-red-100 bg-red-50/50 p-4 space-y-4">
              <h3 className="text-sm font-extrabold text-gray-900 inline-flex items-center gap-2"><Link2 className="h-4 w-4 text-red-600" /> Featured meat cut (add-to-cart)</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className={labelCls}>Cut name</label>
                  <input value={draft.cutName} onChange={(e) => setDraft({ ...draft, cutName: e.target.value })} placeholder="Mbuzi Choma Ribs 1Kg" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Cut category</label>
                  <input value={draft.cutCategory} onChange={(e) => setDraft({ ...draft, cutCategory: e.target.value })} list="cut-category-options" placeholder="beef / goat / chicken" className={inputCls} />
                  <datalist id="cut-category-options">
                    <option value="beef" /><option value="goat" /><option value="lamb" /><option value="chicken" />
                  </datalist>
                </div>
                <div>
                  <label className={labelCls}>Cut price (KSh)</label>
                  <input type="number" min={0} value={draft.cutPrice} onChange={(e) => setDraft({ ...draft, cutPrice: Number(e.target.value) })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Cut weight</label>
                  <input value={draft.cutWeight} onChange={(e) => setDraft({ ...draft, cutWeight: e.target.value })} placeholder="1 kg" className={inputCls} />
                </div>
              </div>
              <AdminImageField value={draft.cutImage} onChange={(url) => setDraft({ ...draft, cutImage: url })} label="Cut image" />
              <div>
                <label className={labelCls}>Link to shop product (enables real 1-click add to cart)</label>
                <select value={draft.productId} onChange={(e) => setDraft({ ...draft, productId: e.target.value })} className={inputCls}>
                  <option value="">No linked product — show "Shop This Cut" search link</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
              <div>
                <label className={labelCls}>Sort order</label>
                <input type="number" value={draft.sortOrder} onChange={(e) => setDraft({ ...draft, sortOrder: Number(e.target.value) })} className={inputCls} />
              </div>
              <label className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-200 bg-white text-sm">
                <input type="checkbox" checked={draft.isActive} onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })} />
                Active (visible on homepage)
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setEditingId(null)} className="rounded-lg border border-gray-200 bg-white px-5 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={submit} disabled={saving} className="rounded-lg bg-red-600 px-5 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60 inline-flex items-center gap-2">
                <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save Recipe'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-950 inline-flex items-center gap-2"><ChefHat className="h-8 w-8 text-red-600" /> Butcher's Kitchen Recipes</h1>
          <p className="mt-1 text-sm text-gray-600">Homepage recipes with a featured cut. Link a real product so customers can 1-click add it to cart.</p>
        </div>
        <button onClick={startNew} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-700">
          <Plus className="h-4 w-4" /> Add Recipe
        </button>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="divide-y divide-gray-100">
            {[0, 1, 2].map((i) => <div key={i} className="h-28 animate-pulse bg-white" />)}
          </div>
        ) : recipes.length === 0 ? (
          <div className="p-12 text-center">
            <ChefHat className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 font-semibold text-gray-700">No recipes yet. Add your first one.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recipes.map((r, i) => (
              <div key={r.id} className="p-4 sm:p-5 flex flex-col gap-3 lg:flex-row lg:items-center">
                <img
                  src={r.cutImage?.startsWith('http') ? r.cutImage : `${getApiHost()}${r.cutImage}`}
                  alt={r.title}
                  className="h-16 w-16 shrink-0 rounded-xl object-cover border border-gray-100"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-gray-950">{r.title}</h3>
                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-700">{r.difficulty}</span>
                    {r.isActive === false && <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-700">Hidden</span>}
                  </div>
                  <p className="mt-1 text-sm text-gray-600 line-clamp-1">{r.subtitle}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    <span>Cut: <b className="text-gray-700">{r.cutName}</b> · KSh {Number(r.cutPrice).toLocaleString()}</span>
                    <span className="inline-flex items-center gap-1">
                      <Link2 className="h-3.5 w-3.5" />
                      {r.productId ? `Linked: ${productName(r.productId) || 'product'}` : 'Shop link fallback'}
                    </span>
                    <span>Order: {r.sortOrder}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex flex-col">
                    <button onClick={() => move(i, -1)} disabled={i === 0} className="rounded p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30" title="Move up"><ArrowUp className="h-4 w-4" /></button>
                    <button onClick={() => move(i, 1)} disabled={i === recipes.length - 1} className="rounded p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30" title="Move down"><ArrowDown className="h-4 w-4" /></button>
                  </div>
                  <button onClick={() => startEdit(r)} className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-bold text-gray-700 hover:bg-gray-50">Edit</button>
                  <button onClick={() => remove(r)} className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-bold text-red-700 hover:bg-red-50 inline-flex items-center gap-1">
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmationDialog isOpen={isOpen} onClose={handleCancel} onConfirm={handleConfirm} title={options?.title || ''} message={options?.message || ''} confirmText={options?.confirmText} cancelText={options?.cancelText} type={options?.type} />
    </div>
  )
}

export default AdminRecipesPage
