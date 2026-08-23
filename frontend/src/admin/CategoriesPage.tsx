import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, FolderTree, ChevronRight, ChevronDown, Save, X, Upload } from 'lucide-react'
import { contentApi } from '../services/adminApi'
import { resolveMediaUrl } from '../services/api'
import toast from 'react-hot-toast'

interface Category {
  id: string
  name: string
  slug: string
  description?: string
  image?: string
  parentId?: string | null
  sortOrder: number
  isActive: boolean
  isFeatured: boolean
  seoTitle?: string
  seoDescription?: string
  children?: Category[]
}

const emptyForm = {
  name: '', slug: '', description: '', image: '', parentId: '',
  sortOrder: 0, isActive: true, isFeatured: false, seoTitle: '', seoDescription: '',
}

const generateSlug = (name: string): string =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

const buildTree = (categories: Category[]): Category[] => {
  const map = new Map<string, Category & { children: Category[] }>()
  const roots: Category[] = []

  categories.forEach((c) => map.set(c.id, { ...c, children: [] }))
  categories.forEach((c) => {
    const node = map.get(c.id)!
    if (c.parentId && map.has(c.parentId)) {
      map.get(c.parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  })
  return roots.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
}

const CategoriesPage = () => {
  const [categories, setCategories] = useState<Category[]>([])
  const [tree, setTree] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [imageUploading, setImageUploading] = useState(false)

  useEffect(() => { loadCategories() }, [])

  const loadCategories = async () => {
    try {
      const data = await contentApi.getCategories()
      const cats = data.categories || data.data || data || []
      setCategories(cats)
      setTree(buildTree(cats))
    } catch { toast.error('Failed to load categories') }
    finally { setLoading(false) }
  }

  const openCreate = (parentId?: string) => {
    setEditing(null)
    setForm({ ...emptyForm, parentId: parentId || '' })
    setShowModal(true)
  }

  const openEdit = (cat: Category) => {
    setEditing(cat)
    setForm({
      name: cat.name, slug: cat.slug, description: cat.description || '',
      image: cat.image || '', parentId: cat.parentId || '', sortOrder: cat.sortOrder,
      isActive: cat.isActive, isFeatured: cat.isFeatured,
      seoTitle: cat.seoTitle || '', seoDescription: cat.seoDescription || '',
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.slug) {
      toast.error('Name and slug are required')
      return
    }
    setSaving(true)
    try {
      const payload = { ...form, parentId: form.parentId || null, sortOrder: Number(form.sortOrder) }
      if (editing) {
        await contentApi.updateCategory(editing.id, payload)
        toast.success('Category updated')
      } else {
        await contentApi.createCategory(payload)
        toast.success('Category created')
      }
      setShowModal(false)
      loadCategories()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save category')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this category? Child categories will be unlinked.')) return
    try {
      await contentApi.deleteCategory(id)
      toast.success('Category deleted')
      loadCategories()
    } catch { toast.error('Failed to delete category') }
  }

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleImageUpload = async (file: File) => {
    setImageUploading(true)
    try {
      const data = await contentApi.uploadContentImage(file)
      const url = data.url || data.imageUrl || data.path
      if (url) setForm({ ...form, image: url })
      else toast.error('No URL returned from upload')
    } catch { toast.error('Image upload failed') }
    finally { setImageUploading(false) }
  }

  const renderTree = (nodes: Category[], depth = 0): JSX.Element[] => {
    return nodes.flatMap((node: any) => {
      const hasChildren = node.children && node.children.length > 0
      const isExpanded = expanded.has(node.id)
      return [
        <div key={node.id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 transition hover:shadow-sm" style={{ marginLeft: depth * 24 }}>
          <div className="flex items-center gap-2">
            {hasChildren ? (
              <button onClick={() => toggleExpand(node.id)} className="text-gray-400 hover:text-gray-600">
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            ) : <span className="w-4" />}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">{node.name}</span>
                <span className="text-xs text-gray-400">/{node.slug}</span>
                {node.isFeatured && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">Featured</span>}
              </div>
              <p className="text-xs text-gray-400">{node.description?.slice(0, 60) || 'No description'}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${node.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {node.isActive ? 'Active' : 'Hidden'}
            </span>
            <button onClick={() => openCreate(node.id)} className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-green-600" title="Add subcategory">
              <Plus className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => openEdit(node)} className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-blue-600">
              <Edit2 className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => handleDelete(node.id)} className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>,
        ...(hasChildren && isExpanded ? renderTree(node.children, depth + 1) : []),
      ]
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-sm text-gray-500">Manage product categories with unlimited nesting</p>
        </div>
        <button onClick={() => openCreate()} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-600/25 transition hover:shadow-red-600/40">
          <Plus className="h-4 w-4" /> New Category
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-red-500 border-t-transparent" />
        </div>
      ) : tree.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <FolderTree className="mx-auto mb-3 h-10 w-10 text-gray-300" />
          <p className="text-gray-500">No categories yet. Create your first one!</p>
        </div>
      ) : (
        <div className="space-y-2">{renderTree(tree)}</div>
      )}

      {/* Category Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => !saving && setShowModal(false)}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">{editing ? 'Edit Category' : 'New Category'}</h2>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => {
                    const name = e.target.value
                    setForm({ ...form, name, slug: !editing ? generateSlug(name) : form.slug })
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Slug *</label>
                <input type="text" value={form.slug} onChange={(e) => setForm({ ...form, slug: generateSlug(e.target.value) })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-500" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Parent Category</label>
                <select value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                  <option value="">— None (Top Level) —</option>
                  {categories.filter((c) => c.id !== editing?.id).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Image</label>
                <div className="flex items-center gap-2">
                  {form.image && <img src={resolveMediaUrl(form.image)} alt="" className="h-12 w-12 rounded-lg object-cover" />}
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-500 transition hover:border-red-500">
                    <Upload className="h-4 w-4" />
                    {imageUploading ? 'Uploading...' : 'Upload Image'}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])} />
                  </label>
                  {form.image && <button type="button" onClick={() => setForm({ ...form, image: '' })} className="text-sm text-red-500">Remove</button>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Sort Order</label>
                  <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                </div>
                <div className="flex items-center gap-4 pt-6">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded" />
                    Active
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} className="rounded" />
                    Featured
                  </label>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">SEO Title</label>
                <input type="text" value={form.seoTitle} onChange={(e) => setForm({ ...form, seoTitle: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">SEO Description</label>
                <textarea value={form.seoDescription} onChange={(e) => setForm({ ...form, seoDescription: e.target.value })} rows={2} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                <Save className="h-4 w-4" /> {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CategoriesPage
