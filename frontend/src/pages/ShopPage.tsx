import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { Search, Grid, List, Beef } from 'lucide-react'
import { productService } from '../services/productService'
import { MEAT_CATEGORIES, SORT_OPTIONS, PRICE_RANGES, WEIGHT_RANGES } from '../utils/constants'
import ProductCard from '../components/ProductCard'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { useSiteContent } from '../contexts/SiteContentContext'
import { useLanguage } from '../contexts/LanguageContext'


const ShopPage: React.FC = () => {
  const { t } = useLanguage()
  const { profile } = useSiteContent()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [priceRange, setPriceRange] = useState('')
  const [weightRange, setWeightRange] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [currentPage, setCurrentPage] = useState(1)

  const filters = {
    search: searchTerm,
    category: selectedCategory,
    minPrice: priceRange ? PRICE_RANGES.find(range => range.label === priceRange)?.min : undefined,
    maxPrice: priceRange ? PRICE_RANGES.find(range => range.label === priceRange)?.max : undefined,
    minWeight: weightRange ? WEIGHT_RANGES.find(range => range.label === weightRange)?.min : undefined,
    maxWeight: weightRange ? WEIGHT_RANGES.find(range => range.label === weightRange)?.max : undefined,
    sortBy: sortBy as any,
    sortOrder: sortOrder as 'asc' | 'desc',
    page: currentPage,
    limit: 12
  }

  const {
    data: productsData,
    isLoading,
    error,
    refetch
  } = useQuery(['products', filters], () => productService.getProducts(filters))

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    refetch()
  }

  const handleFilterChange = () => {
    setCurrentPage(1)
    refetch()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('home.somethingWentWrong')}</h2>
          <p className="text-gray-600">{t('home.tryAgainLater')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('shop.shopBrand').replace('{brand}', profile.brand.name || '')}</h1>
          <p className="text-gray-600">{t('shop.discoverProducts')}</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mb-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder={t('shop.searchForMeats')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10"
                />
              </div>
              <button type="submit" className="btn btn-primary">
                {t('shop.search')}
              </button>
            </div>
          </form>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('shop.category')}
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value)
                  handleFilterChange()
                }}
                className="input"
              >
                <option value="">{t('shop.allCategories')}</option>
                {MEAT_CATEGORIES.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('shop.priceRange')}
              </label>
              <select
                value={priceRange}
                onChange={(e) => {
                  setPriceRange(e.target.value)
                  handleFilterChange()
                }}
                className="input"
              >
                <option value="">{t('shop.allPrices')}</option>
                {PRICE_RANGES.map(range => (
                  <option key={range.label} value={range.label}>
                    {range.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Weight Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('shop.weightKg')}
              </label>
              <select
                value={weightRange}
                onChange={(e) => {
                  setWeightRange(e.target.value)
                  handleFilterChange()
                }}
                className="input"
              >
                <option value="">{t('shop.allWeights')}</option>
                {WEIGHT_RANGES.map(range => (
                  <option key={range.label} value={range.label}>
                    {range.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('shop.sortBy')}
              </label>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [sort, order] = e.target.value.split('-')
                  setSortBy(sort)
                  setSortOrder(order)
                  handleFilterChange()
                }}
                className="input"
              >
                {SORT_OPTIONS.map(option => (
                  <option key={option.value} value={`${option.value}-desc`}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* View Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('shop.view')}
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-600'}`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-600'}`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="mb-6">
          <p className="text-gray-600">
            {t('shop.showingProducts').replace('{count}', String(productsData?.products.length || 0)).replace('{total}', String(productsData?.pagination.total || 0))}
          </p>
        </div>

        {/* Products Grid/List */}
        {productsData?.products && productsData.products.length > 0 ? (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-4'}>
            {productsData.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg">
            <Beef className="mx-auto mb-4 h-16 w-16 text-primary-600" aria-hidden="true" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('shop.noProductsFound')}</h3>
            <p className="text-gray-600">{t('shop.tryAdjustingFilters')}</p>
          </div>
        )}

        {/* Pagination */}
        {productsData?.pagination && productsData.pagination.pages > 1 && (
          <div className="flex justify-center mt-8">
            <div className="flex gap-2">
              {Array.from({ length: productsData.pagination.pages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => {
                    setCurrentPage(page)
                    refetch()
                  }}
                  className={`px-4 py-2 rounded ${
                    page === currentPage
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ShopPage
