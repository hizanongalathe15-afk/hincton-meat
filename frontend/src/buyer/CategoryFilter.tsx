import { useState } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'

interface Category {
  id: string
  name: string
  count?: number
}

interface CategoryFilterProps {
  categories: Category[]
  onCategoryChange?: (categoryId: string) => void
  selectedCategory?: string
}

const CategoryFilter = ({
  categories,
  onCategoryChange,
  selectedCategory = '',
}: CategoryFilterProps) => {
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)
  const hasActiveFilters = Boolean(selectedCategory)

  const clearFilters = () => {
    onCategoryChange?.('')
  }

  const panel = (
    <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-gray-800">Category</h2>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="rounded-full px-3 py-1 text-xs font-bold text-red-700 transition hover:bg-red-50"
          >
            Clear
          </button>
        )}
      </div>
      <nav className="py-2" aria-label="Product categories">
        {categories.map((category, index) => {
          const isSelected = selectedCategory === category.id
          const isRoot = index === 0 || category.id === ''
          return (
            <button
              key={category.id || 'all-products'}
              onClick={() => onCategoryChange?.(category.id)}
              className={`flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm transition ${
                isSelected
                  ? 'bg-red-50 font-bold text-red-700'
                  : isRoot
                    ? 'font-bold text-gray-950 hover:bg-gray-50'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-950'
              } ${!isRoot ? 'pl-7' : ''}`}
            >
              <span>{category.name}</span>
              {typeof category.count === 'number' ? (
                <span className={`text-xs ${isSelected ? 'text-red-600' : 'text-gray-400'}`}>{category.count}</span>
              ) : null}
            </button>
          )
        })}
      </nav>
    </section>
  )

  return (
    <>
      <button
        onClick={() => setIsMobileFilterOpen(true)}
        className="mb-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-800 shadow-sm lg:hidden"
      >
        <SlidersHorizontal className="h-4 w-4" />
        Categories
        {hasActiveFilters ? <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs text-white">Active</span> : null}
      </button>

      <aside className="hidden lg:block">{panel}</aside>

      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsMobileFilterOpen(false)}
            aria-label="Close categories"
          />
          <div className="absolute inset-y-0 left-0 w-[min(88vw,360px)] overflow-y-auto bg-white p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-lg font-bold text-gray-950">Category</span>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="rounded-full p-2 text-gray-600 hover:bg-gray-100"
                aria-label="Close categories"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {panel}
          </div>
        </div>
      )}
    </>
  )
}

export default CategoryFilter
