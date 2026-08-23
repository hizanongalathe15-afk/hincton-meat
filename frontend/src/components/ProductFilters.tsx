import React, { useState, useEffect } from 'react'
import { X, ChevronDown, ChevronUp, Search, SlidersHorizontal, Star } from 'lucide-react'
import toast from 'react-hot-toast'
import '../styles/glassmorphism.css'
import { useLanguage } from '../contexts/LanguageContext'

interface FilterOptions {
  categories: string[]
  priceRange: [number, number]
  ratings: number[]
  inStock: boolean
  sortBy: string
  search: string
}

interface ProductFiltersProps {
  onFiltersChange: (filters: FilterOptions) => void
  initialFilters?: Partial<FilterOptions>
}

const ProductFilters: React.FC<ProductFiltersProps> = ({ onFiltersChange, initialFilters }) => {
  const { t } = useLanguage()
  const [isExpanded, setIsExpanded] = useState(false)
  const [filters, setFilters] = useState<FilterOptions>({
    categories: [],
    priceRange: [0, 50000],
    ratings: [],
    inStock: false,
    sortBy: 'name',
    search: '',
    ...initialFilters
  })

  const availableCategories = [
    'Beef',
    'Chicken',
    'Pork',
    'Lamb',
    'Goat',
    'Fish',
    'Sausages',
    'Burgers',
    'Steaks',
    'Minced Meat'
  ]

  const sortOptions = [
    { value: 'name', label: t('productFilters.nameAZ') },
    { value: 'name-desc', label: t('productFilters.nameZA') },
    { value: 'price-low', label: t('productFilters.priceLowHigh') },
    { value: 'price-high', label: t('productFilters.priceHighLow') },
    { value: 'rating', label: t('productFilters.highestRated') },
    { value: 'newest', label: 'Newest First' },
    { value: 'popular', label: 'Most Popular' }
  ]

  useEffect(() => {
    onFiltersChange(filters)
  }, [filters])

  const handleCategoryToggle = (category: string) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }))
  }

  const handleRatingToggle = (rating: number) => {
    setFilters(prev => ({
      ...prev,
      ratings: prev.ratings.includes(rating)
        ? prev.ratings.filter(r => r !== rating)
        : [...prev.ratings, rating]
    }))
  }

  const handlePriceRangeChange = (index: number, value: number) => {
    const newPriceRange = [...filters.priceRange] as [number, number]
    newPriceRange[index] = value
    setFilters(prev => ({ ...prev, priceRange: newPriceRange }))
  }

  const handleClearFilters = () => {
    setFilters({
      categories: [],
      priceRange: [0, 50000],
      ratings: [],
      inStock: false,
      sortBy: 'name',
      search: ''
    })
    toast.success('Filters cleared')
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.categories.length > 0) count++
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 50000) count++
    if (filters.ratings.length > 0) count++
    if (filters.inStock) count++
    if (filters.search) count++
    return count
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < rating
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            }`}
            aria-hidden="true"
          />
        ))}
        <span className="text-sm text-gray-600 ml-1">& up</span>
      </div>
    )
  }

  return (
    <div className="glass-card p-6 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <SlidersHorizontal className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          {getActiveFiltersCount() > 0 && (
            <span className="bg-primary-500 text-white text-xs px-2 py-1 rounded-full">
              {getActiveFiltersCount()}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          {getActiveFiltersCount() > 0 && (
            <button
              onClick={handleClearFilters}
              className="text-sm text-red-600 hover:text-red-800 flex items-center space-x-1"
            >
              <X className="w-4 h-4" />
              <span>{t('productFilters.clearAll')}</span>
            </button>
          )}
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 glass-button rounded-lg hover:bg-white hover:bg-opacity-20"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={t('productFilters.searchPlaceholder')}
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="w-full pl-10 pr-4 py-3 glass-button rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="space-y-6 animate-slide-in-down">
          {/* Categories */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">{t('productFilters.categories')}</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {availableCategories.map((category) => (
                <label
                  key={category}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-white hover:bg-opacity-20 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={filters.categories.includes(category)}
                    onChange={() => handleCategoryToggle(category)}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">{category}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Price Range (KSH)</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <label className="text-sm text-gray-600">Min</label>
                  <input
                    type="number"
                    min="0"
                    max="50000"
                    value={filters.priceRange[0]}
                    onChange={(e) => handlePriceRangeChange(0, parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 glass-button rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm text-gray-600">Max</label>
                  <input
                    type="number"
                    min="0"
                    max="50000"
                    value={filters.priceRange[1]}
                    onChange={(e) => handlePriceRangeChange(1, parseInt(e.target.value) || 50000)}
                    className="w-full px-3 py-2 glass-button rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              
              {/* Price Range Slider */}
              <div className="relative pt-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-500 h-2 rounded-full"
                      style={{
                        width: `${((filters.priceRange[1] - filters.priceRange[0]) / 50000) * 100}%`,
                        marginLeft: `${(filters.priceRange[0] / 50000) * 100}%`
                      }}
                    />
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50000"
                  value={filters.priceRange[0]}
                  onChange={(e) => handlePriceRangeChange(0, parseInt(e.target.value))}
                  className="absolute w-full h-2 opacity-0 cursor-pointer"
                />
                <input
                  type="range"
                  min="0"
                  max="50000"
                  value={filters.priceRange[1]}
                  onChange={(e) => handlePriceRangeChange(1, parseInt(e.target.value))}
                  className="absolute w-full h-2 opacity-0 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Ratings */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">{t('productFilters.customerRatings')}</h4>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => (
                <label
                  key={rating}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white hover:bg-opacity-20 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={filters.ratings.includes(rating)}
                    onChange={() => handleRatingToggle(rating)}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                  {renderStars(rating)}
                </label>
              ))}
            </div>
          </div>

          {/* Availability */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">{t('productFilters.availability')}</h4>
            <label className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white hover:bg-opacity-20 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={filters.inStock}
                onChange={(e) => setFilters(prev => ({ ...prev, inStock: e.target.checked }))}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">{t('productFilters.inStockOnly')}</span>
            </label>
          </div>

          {/* Sort By */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">{t('productFilters.sortBy')}</h4>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
              className="w-full px-3 py-2 glass-button rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductFilters
