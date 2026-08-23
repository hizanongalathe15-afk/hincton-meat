import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Plus, Save, Trash2, ArrowUp, ArrowDown } from 'lucide-react'
import { productConfigAdminApi } from '../services/adminApi'
import { productConfigApi } from '../services/buyerApi'

const inputCls = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-500'
const labelCls = 'block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5'

type Tab = 'butcher' | 'shopPills' | 'storage'

const AdminProductConfigPage = () => {
  const [tab, setTab] = useState<Tab>('butcher')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [cutStyles, setCutStyles] = useState<string[]>([])
  const [fatTrimLevels, setFatTrimLevels] = useState<string[]>([])
  const [seasonings, setSeasonings] = useState<string[]>([])

  const [shopPills, setShopPills] = useState<Array<{ id: string; label: string }>>([])

  const [storageGuidelines, setStorageGuidelines] = useState<string[]>([])

  const load = async () => {
    setLoading(true)
    try {
      const data = await productConfigApi.get()
      setCutStyles(data.butcherPrep?.cutStyles || [])
      setFatTrimLevels(data.butcherPrep?.fatTrimLevels || [])
      setSeasonings(data.butcherPrep?.seasonings || [])
      setShopPills(data.shopPills || [])
      setStorageGuidelines(data.storageGuidelines || [])
    } catch {
      toast.error('Could not load product configuration')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const saveButcherPrep = async () => {
    if (cutStyles.length === 0 || fatTrimLevels.length === 0 || seasonings.length === 0) {
      toast.error('Each section needs at least one option')
      return
    }
    setSaving(true)
    try {
      await productConfigAdminApi.updateButcherPrep({ cutStyles, fatTrimLevels, seasonings })
      toast.success("Butcher's preparation options saved")
    } catch {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const saveShopPills = async () => {
    if (shopPills.length === 0) {
      toast.error('Add at least one category pill')
      return
    }
    setSaving(true)
    try {
      await productConfigAdminApi.updateShopPills(shopPills)
      toast.success('Shop category pills saved')
    } catch {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const saveStorage = async () => {
    if (storageGuidelines.length === 0) {
      toast.error('Add at least one storage guideline')
      return
    }
    setSaving(true)
    try {
      await productConfigAdminApi.updateStorageGuidelines(storageGuidelines)
      toast.success('Storage guidelines saved')
    } catch {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const moveItem = <T,>(arr: T[], idx: number, dir: -1 | 1, setter: (v: T[]) => void) => {
    const target = idx + dir
    if (target < 0 || target >= arr.length) return
    const copy = [...arr]
    ;[copy[idx], copy[target]] = [copy[target], copy[idx]]
    setter(copy)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-t-transparent" />
      </div>
    )
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'butcher', label: "Butcher's Preparation" },
    { key: 'shopPills', label: 'Shop Category Pills' },
    { key: 'storage', label: 'Storage Guidelines' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-950">Product Page Configuration</h1>
          <p className="text-sm text-gray-500 mt-1">Manage butcher preparation options, shop category filters, and storage guidelines.</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-bold border-b-2 transition ${
              tab === t.key
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Butcher's Preparation Tab */}
      {tab === 'butcher' && (
        <div className="space-y-8">
          <EditableStringList
            title="Cut & Portioning Styles"
            items={cutStyles}
            setItems={setCutStyles}
            moveItem={moveItem}
          />
          <EditableStringList
            title="Fat Trim Levels"
            items={fatTrimLevels}
            setItems={setFatTrimLevels}
            moveItem={moveItem}
          />
          <EditableStringList
            title="Complimentary Seasoning & Rubs"
            items={seasonings}
            setItems={setSeasonings}
            moveItem={moveItem}
          />
          <button
            onClick={saveButcherPrep}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-red-600/25 hover:bg-red-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : "Save Butcher's Preparation"}
          </button>
        </div>
      )}

      {/* Shop Category Pills Tab */}
      {tab === 'shopPills' && (
        <div className="space-y-4">
          <p className="text-xs text-gray-500">
            These are the filter pills shown on the shop page. The first pill should have an empty ID to show all products.
          </p>
          {shopPills.map((pill, idx) => (
            <div key={idx} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-3">
              <div className="flex flex-col gap-1">
                <button type="button" onClick={() => moveItem(shopPills, idx, -1, setShopPills)} disabled={idx === 0} className="text-gray-400 hover:text-gray-600 disabled:opacity-30"><ArrowUp className="h-3.5 w-3.5" /></button>
                <button type="button" onClick={() => moveItem(shopPills, idx, 1, setShopPills)} disabled={idx === shopPills.length - 1} className="text-gray-400 hover:text-gray-600 disabled:opacity-30"><ArrowDown className="h-3.5 w-3.5" /></button>
              </div>
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Filter ID (slug)</label>
                  <input
                    className={inputCls}
                    value={pill.id}
                    onChange={(e) => {
                      const copy = [...shopPills]
                      copy[idx] = { ...copy[idx], id: e.target.value }
                      setShopPills(copy)
                    }}
                    placeholder='e.g. "beef" or empty for all'
                  />
                </div>
                <div>
                  <label className={labelCls}>Display Label</label>
                  <input
                    className={inputCls}
                    value={pill.label}
                    onChange={(e) => {
                      const copy = [...shopPills]
                      copy[idx] = { ...copy[idx], label: e.target.value }
                      setShopPills(copy)
                    }}
                    placeholder="e.g. 🥩 Beef Steaks & Cuts"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShopPills(shopPills.filter((_, i) => i !== idx))}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setShopPills([...shopPills, { id: '', label: '' }])}
            className="inline-flex items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 hover:border-red-400 hover:text-red-600"
          >
            <Plus className="h-4 w-4" /> Add Category Pill
          </button>
          <div>
            <button
              onClick={saveShopPills}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-red-600/25 hover:bg-red-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Shop Category Pills'}
            </button>
          </div>
        </div>
      )}

      {/* Storage Guidelines Tab */}
      {tab === 'storage' && (
        <div className="space-y-4">
          <p className="text-xs text-gray-500">
            These guidelines appear on the product detail page under the Storage tab.
          </p>
          {storageGuidelines.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">{idx + 1}</span>
              <input
                className={inputCls + ' flex-1'}
                value={item}
                onChange={(e) => {
                  const copy = [...storageGuidelines]
                  copy[idx] = e.target.value
                  setStorageGuidelines(copy)
                }}
                placeholder="Storage guideline..."
              />
              <button
                type="button"
                onClick={() => setStorageGuidelines(storageGuidelines.filter((_, i) => i !== idx))}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setStorageGuidelines([...storageGuidelines, ''])}
            className="inline-flex items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 hover:border-red-400 hover:text-red-600"
          >
            <Plus className="h-4 w-4" /> Add Guideline
          </button>
          <div>
            <button
              onClick={saveStorage}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-red-600/25 hover:bg-red-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Storage Guidelines'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

interface EditableStringListProps {
  title: string
  items: string[]
  setItems: (v: string[]) => void
  moveItem: <T>(arr: T[], idx: number, dir: -1 | 1, setter: (v: T[]) => void) => void
}

const EditableStringList = ({ title, items, setItems, moveItem }: EditableStringListProps) => {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-gray-900">{title}</h3>
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-3">
          <div className="flex flex-col gap-1">
            <button type="button" onClick={() => moveItem(items, idx, -1, setItems)} disabled={idx === 0} className="text-gray-400 hover:text-gray-600 disabled:opacity-30"><ArrowUp className="h-3.5 w-3.5" /></button>
            <button type="button" onClick={() => moveItem(items, idx, 1, setItems)} disabled={idx === items.length - 1} className="text-gray-400 hover:text-gray-600 disabled:opacity-30"><ArrowDown className="h-3.5 w-3.5" /></button>
          </div>
          <input
            className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-500"
            value={item}
            onChange={(e) => {
              const copy = [...items]
              copy[idx] = e.target.value
              setItems(copy)
            }}
            placeholder={`${title} option...`}
          />
          <button
            type="button"
            onClick={() => setItems(items.filter((_, i) => i !== idx))}
            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => setItems([...items, ''])}
        className="inline-flex items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-2 text-xs font-semibold text-gray-600 hover:border-red-400 hover:text-red-600"
      >
        <Plus className="h-3.5 w-3.5" /> Add Option
      </button>
    </div>
  )
}

export default AdminProductConfigPage
