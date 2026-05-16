import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import ProductCard from './ProductCard'
import CategoryFilter from './CategoryFilter'
import { Product } from '../types/index'
import { productsApi as api, trackingApi } from '../services/buyerApi'
import { resolveMediaUrl } from '../services/api'
import { useLanguage } from '../contexts/LanguageContext'
import { HINCTON_PRODUCTS } from '../utils/hinctonBrand'

interface BuyerShopProps {
  onProductClick?: (product: Product) => void
  onAddToCart?: (product: Product, quantity: number) => Promise<void>
  onToggleWishlist?: (productId: string) => void
  wishlistItems?: Set<string>
}

const filterProducts = (items: Product[], categoryId: string, query: string) => {
  const normalizedCategory = categoryId.trim().toLowerCase()
  const normalizedQuery = query.trim().toLowerCase()

  return items.filter((product) => {
    const matchesCategory = !normalizedCategory
      || product.categorySlug?.toLowerCase() === normalizedCategory
      || product.category.toLowerCase() === normalizedCategory
      || product.name.toLowerCase() === normalizedCategory
    const matchesQuery = !normalizedQuery
      || product.name.toLowerCase().includes(normalizedQuery)
      || product.description?.toLowerCase().includes(normalizedQuery)
      || product.category.toLowerCase().includes(normalizedQuery)

    return matchesCategory && matchesQuery
  })
}

const SHOP_CACHE_KEY = 'hincton:shop-products:v1'
const CATEGORY_CACHE_KEY = 'hincton:shop-categories:v1'

const readCachedProducts = () => {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(window.sessionStorage.getItem(SHOP_CACHE_KEY) || '[]') as Product[]
  } catch {
    return []
  }
}

const readCachedCategories = () => {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(window.sessionStorage.getItem(CATEGORY_CACHE_KEY) || '[]') as Array<{ id: string; name: string }>
  } catch {
    return []
  }
}

const writeShopCache = (products: Product[], categories: Array<{ id: string; name: string }>) => {
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem(SHOP_CACHE_KEY, JSON.stringify(products))
  window.sessionStorage.setItem(CATEGORY_CACHE_KEY, JSON.stringify(categories))
  products.forEach((product) => {
    window.sessionStorage.setItem(`hincton:product:${product.id}`, JSON.stringify(product))
  })
}

const transformApiProduct = (product: any): Product => {
  const images = (product.images || product.productImages?.map((img: any) => img.url) || []).map((url: string) => resolveMediaUrl(url))
  return {
    id: product.id,
    name: product.name,
    price: Number(product.price) || 0,
    originalPrice: product.comparePrice ? Number(product.comparePrice) : undefined,
    image: images[0] || 'https://images.unsplash.com/photo-1546823998-b7c00af72b9d?w=600&h=600&fit=crop',
    images,
    rating: Number(product.averageRating || product.rating || 0),
    reviews: Number(product.reviewCount || product.totalReviews || 0),
    category: product.category?.name || 'Uncategorized',
    categorySlug: product.category?.slug || product.categoryId || product.category?.id,
    inStock: product.stockQuantity > 0 && product.isPublished !== false,
    stockQuantity: Number(product.stockQuantity) || 0,
    lowStockThreshold: Number(product.lowStockThreshold) || undefined,
    description: product.description || `${product.name}. Prices are subject to change without prior notice.`,
    weight: [product.weight, product.weightUnit].filter(Boolean).join(' ') || product.weightUnit || '',
    weightValue: Number(product.weight) || undefined,
    weightUnit: product.weightUnit || undefined,
    origin: product.brand || 'Hincton Meat Products',
    sku: product.sku,
    videos: (product.videos || product.productVideos?.map((video: any) => video.url) || []).map((url: string) => resolveMediaUrl(url)),
    productVideos: product.productVideos || [],
  }
}

const BuyerShop = ({ 
  onProductClick, 
  onAddToCart, 
  onToggleWishlist,
  wishlistItems = new Set()
}: BuyerShopProps) => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { t } = useLanguage()
  const [products, setProducts] = useState<Product[]>(() => filterProducts(
    readCachedProducts(),
    searchParams.get('category') || '',
    searchParams.get('q') || '',
  ))
  const [categories, setCategories] = useState<any[]>([
    { id: '', name: t('shop.allProducts'), count: 0 },
    ...readCachedCategories().map((category) => ({ ...category, count: 0 })),
  ])
  const [loading, setLoading] = useState(() => readCachedProducts().length === 0)

  // Define sortOptions with translations
    const sortOptions = [
      { id: 'featured', name: t('shop.featured') },
      { id: 'price-low', name: t('shop.priceLowToHigh') },
      { id: 'price-high', name: t('shop.priceHighToLow') },
    { id: 'rating', name: t('shop.highestRated') },
    { id: 'newest', name: t('shop.newestFirst') },
    { id: 'name-asc', name: t('shop.nameAZ') },
      { id: 'name-desc', name: t('shop.nameZA') },
    ]

  const getApiSortParams = (sortOption: string) => {
    switch (sortOption) {
      case 'price-low':
        return { sortBy: 'price', sortOrder: 'asc' as const }
      case 'price-high':
        return { sortBy: 'price', sortOrder: 'desc' as const }
      case 'rating':
        return { sortBy: 'rating', sortOrder: 'desc' as const }
      case 'newest':
        return { sortBy: 'createdAt', sortOrder: 'desc' as const }
      case 'name-asc':
        return { sortBy: 'name', sortOrder: 'asc' as const }
      case 'name-desc':
        return { sortBy: 'name', sortOrder: 'desc' as const }
      case 'featured':
      default:
        return { sortBy: 'featured', sortOrder: 'desc' as const }
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      const hasCachedProducts = readCachedProducts().length > 0
      setLoading(!hasCachedProducts)
      try {
          // Fetch products with filters
        const currentSort = searchParams.get('sort') || 'featured'
        const currentCategory = searchParams.get('category') || ''
        const currentQuery = searchParams.get('q') || ''
        const apiSort = getApiSortParams(currentSort)
        setSortBy(currentSort)
        setSelectedCategory(currentCategory)
        setSearchQuery(currentQuery)
          const params = {
            search: currentQuery || undefined,
            category: currentCategory || undefined,
            minPrice: undefined,
            maxPrice: undefined,
            sortBy: apiSort.sortBy,
            sortOrder: apiSort.sortOrder,
            page: 1,
            limit: 50
          }
        
        const [productsData, categoriesData] = await Promise.all([
          api.getProducts(params),
          api.getCategories(),
        ])
        
        const transformedProducts = (productsData.products || []).map(transformApiProduct)
        
        const activeProducts = transformedProducts.length
          ? transformedProducts
          : filterProducts(readCachedProducts(), currentCategory, currentQuery)
        setProducts(activeProducts)

        const backendCategories = (categoriesData.categories || []).map((category: any) => ({
          id: category.slug || category.id,
          name: category.name,
        }))
        const fallbackCategories = HINCTON_PRODUCTS.map((product) => ({
          id: product.category,
          name: product.name,
        }))
        const visibleCategories = backendCategories.length ? backendCategories : fallbackCategories
        const countProductsForCategory = (categoryId: string) => activeProducts.filter((product: Product) => {
          const normalized = categoryId.toLowerCase()
          return product.categorySlug?.toLowerCase() === normalized || product.category.toLowerCase() === normalized
        }).length
        const transformedCategories = [
          {
            id: '',
            name: t('shop.allProducts'),
            count: activeProducts.length,
          },
          ...visibleCategories.map((category: any) => ({
            ...category,
            count: countProductsForCategory(category.id),
          }))
        ]
        
        setCategories(transformedCategories)
        if (transformedProducts.length) writeShopCache(transformedProducts, visibleCategories)
      } catch (error) {
        console.error('Failed to fetch shop data:', error)
        const currentCategory = searchParams.get('category') || ''
        const currentQuery = searchParams.get('q') || ''
        const visibleProducts = filterProducts(readCachedProducts(), currentCategory, currentQuery)
        setProducts(visibleProducts)
        setCategories([
          { id: '', name: t('shop.allProducts'), count: visibleProducts.length },
          ...readCachedCategories().map((category) => ({
            id: category.id,
            name: category.name,
            count: visibleProducts.filter((item) => item.categorySlug === category.id || item.category === category.name).length,
          })),
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    }, [searchParams])

  const [filteredProducts, setFilteredProducts] = useState<Product[]>(products)
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '')
  const [sortBy, setSortBy] = useState('featured')
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')

  // Update filtered products when products change
  useEffect(() => {
    setFilteredProducts(products)
  }, [products])

    const handleCategoryChange = (categoryId: string) => {
      setSelectedCategory(categoryId)
      updateUrl(categoryId, searchQuery, sortBy)
    }

    const handleSortChange = (sortOption: string) => {
      setSortBy(sortOption)
      updateUrl(selectedCategory, searchQuery, sortOption)
    }

    const handleSearchChange = (query: string) => {
      setSearchQuery(query)
      updateUrl(selectedCategory, query, sortBy)
    }

    const updateUrl = (categoryId: string, query: string, sortOption: string) => {
      const params = new URLSearchParams()
      if (categoryId) {
        params.set('category', categoryId)
      }
      if (query.trim()) {
        params.set('q', query.trim())
      }
    if (sortOption !== 'featured') {
      params.set('sort', sortOption)
    }
      setSearchParams(params, { replace: true })
    }

  const handleProductClick = (product: Product) => {
    trackingApi.trackClick({
      linkUrl: `/product/${product.id}`,
      linkId: product.id,
      label: product.name,
      source: 'shop',
      medium: 'product-card',
      path: window.location.pathname + window.location.search,
    }).catch(() => {})
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(`hincton:product:${product.id}`, JSON.stringify(product))
    }
    navigate(`/product/${product.id}`, { state: { product } })
    onProductClick?.(product)
  }

  const selectedCategoryName = selectedCategory
    ? categories.find((category) => category.id === selectedCategory)?.name || `${selectedCategory.charAt(0).toUpperCase()}${selectedCategory.slice(1)}`
    : 'All'

  const sortControls = (
      <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-4 py-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-gray-800">{t('shop.sortBy')}</h2>
        </div>
        <div className="py-2">
          {sortOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => handleSortChange(option.id)}
              className={`block w-full px-4 py-2 text-left text-sm transition ${
                sortBy === option.id
                  ? 'bg-red-50 font-bold text-red-700'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-950'
              }`}
            >
              {option.name}
            </button>
          ))}
        </div>
      </section>
  )

  if (loading) {
    return (
      <div className="bg-gray-50">
        <div className="animate-pulse">
          <div className="h-64 bg-gray-900"></div>
          <div className="p-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="h-80 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50">
      {/* Header */}
      <section className="bg-neutral-950 text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_420px] lg:items-end">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-wide text-yellow-300">{t('shop.premiumCounter')}</p>
              <h1 className="mt-3 text-4xl font-extrabold">{t('shop.freshCuts')}</h1>
              <p className="mt-3 text-lg text-neutral-300">{t('shop.description')}</p>
            </div>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-neutral-200">{t('shop.searchProducts')}</span>
              <div className="flex overflow-hidden rounded-lg bg-white shadow-xl">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => handleSearchChange(event.target.value)}
                  placeholder={t('shop.searchPlaceholder')}
                  className="min-w-0 flex-1 px-4 py-3 text-gray-950 outline-none"
                />
                <span className="flex w-12 items-center justify-center text-gray-500">
                  <Search className="h-5 w-5" />
                </span>
              </div>
            </label>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[250px_minmax(0,1fr)_240px]">
          {/* Category Sidebar */}
          <div>
            <CategoryFilter
              categories={categories}
              onCategoryChange={handleCategoryChange}
              selectedCategory={selectedCategory}
            />
          </div>

          {/* Products Grid */}
          <div>
            {/* Results Header */}
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-3xl font-extrabold text-gray-950">
                  {selectedCategory ? `${selectedCategoryName} ${t('shop.products')}` : t('shop.allProducts')}
                </h2>
                <p className="mt-1 text-gray-600">
                  {filteredProducts.length} {filteredProducts.length === 1 ? t('shop.product') : t('shop.products')} {t('shop.found')}
                </p>
              </div>
              
              <div className="lg:hidden">{sortControls}</div>
            </div>

            {/* Products Grid */}
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {filteredProducts.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    priority={index < 6}
                    onAddToCart={onAddToCart}
                    onToggleWishlist={onToggleWishlist}
                    isInWishlist={wishlistItems.has(product.id)}
                    onClick={() => handleProductClick(product)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your search or filter criteria
                </p>
                  <button
                    onClick={() => {
                      setSelectedCategory('')
                      setSortBy('featured')
                      updateUrl('', '', 'featured')
                    }}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-24">{sortControls}</div>
          </aside>
        </div>
      </section>
    </div>
  )
}

export default BuyerShop
