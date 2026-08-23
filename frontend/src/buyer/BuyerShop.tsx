import { FormEvent, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import ProductCard from './ProductCard'
import CategoryFilter from './CategoryFilter'
import SplitLayoutContainer from '../components/Layout/SplitLayoutContainer'
import SmartwatchCompactView from '../components/Layout/SmartwatchCompactView'
import VoiceSearchButton from '../components/VoiceCommerce/VoiceSearchButton'
import { useLayoutSplit } from '../contexts/LayoutSplitContext'
import { Product } from '../types/index'
import { productsApi as api, trackingApi, productConfigApi } from '../services/buyerApi'
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

const DEFAULT_SHOP_PRODUCTS: Product[] = [
  {
    id: 'prod-sausage-1kg',
    name: 'Value Pack Beef Sausages 1Kg',
    price: 700,
    image: '/hincton/hero-platter.webp',
    images: ['/hincton/hero-platter.webp'],
    rating: 4.8,
    reviews: 52,
    category: 'Sausages',
    categorySlug: 'sausages',
    inStock: true,
    stockQuantity: 100,
    description: 'Juicy, savory Kenyan beef sausages. Perfect for breakfast and grilling.',
    weight: '1 kg',
    origin: 'Hincton Meat Products',
    sku: 'HMP-SAUSAGE-1KG',
  },
  {
    id: 'prod-ribeye-boneless',
    name: 'Prime Rib Eye Steak (Boneless)',
    price: 1400,
    originalPrice: 1600,
    image: '/hincton/beef-cuts.webp',
    images: ['/hincton/beef-cuts.webp'],
    rating: 4.9,
    reviews: 38,
    category: 'Beef Cuts',
    categorySlug: 'beef',
    inStock: true,
    stockQuantity: 45,
    description: 'Aged prime ribeye steak with luscious marbling. Thick-cut per kg.',
    weight: '1 kg',
    origin: 'Hincton Meat Products',
    sku: 'HMP-RIBEYE-STEAK',
  },
  {
    id: 'prod-tbone-steak',
    name: 'T-Bone Steak Portioned',
    price: 1500,
    image: '/hincton/beef-fresh.webp',
    images: ['/hincton/beef-fresh.webp'],
    rating: 4.9,
    reviews: 44,
    category: 'Beef Cuts',
    categorySlug: 'beef',
    inStock: true,
    stockQuantity: 30,
    description: 'Classic T-Bone cut with both striploin and tenderloin filet.',
    weight: '1 kg',
    origin: 'Hincton Meat Products',
    sku: 'HMP-TBONE-STEAK',
  },
  {
    id: 'prod-striploin-steak',
    name: 'Striploin Steak Portioned',
    price: 900,
    image: '/hincton/beef-cuts.webp',
    images: ['/hincton/beef-cuts.webp'],
    rating: 4.7,
    reviews: 29,
    category: 'Beef Cuts',
    categorySlug: 'beef',
    inStock: true,
    stockQuantity: 50,
    description: 'Tender, juicy striploin cut. Exceptional for quick grilling.',
    weight: '1 kg',
    origin: 'Hincton Meat Products',
    sku: 'HMP-STRIPLOIN-STEAK',
  },
  {
    id: 'prod-beef-cubes-boneless',
    name: 'Beef Boneless Cubes',
    price: 800,
    image: '/hincton/beef-cuts.webp',
    images: ['/hincton/beef-cuts.webp'],
    rating: 4.8,
    reviews: 64,
    category: 'Beef Cuts',
    categorySlug: 'beef',
    inStock: true,
    stockQuantity: 80,
    description: 'Hand-trimmed lean beef cubes. Great for beef stew, curries, and pilau.',
    weight: '1 kg',
    origin: 'Hincton Meat Products',
    sku: 'HMP-BEEF-CUBES-BONELESS',
  },
  {
    id: 'prod-cubed-beef-bone',
    name: 'Cubed Beef on Bone',
    price: 750,
    image: '/hincton/beef-cuts.webp',
    images: ['/hincton/beef-cuts.webp'],
    rating: 4.7,
    reviews: 41,
    category: 'Beef Cuts',
    categorySlug: 'beef',
    inStock: true,
    stockQuantity: 75,
    description: 'Traditional beef stew cuts with bone-in for rich marrow broth flavor.',
    weight: '1 kg',
    origin: 'Hincton Meat Products',
    sku: 'HMP-BEEF-CUBES-BONE',
  },
  {
    id: 'prod-lean-beef-mince',
    name: 'Lean Beef Mince per kg',
    price: 900,
    image: '/hincton/hero-platter.webp',
    images: ['/hincton/hero-platter.webp'],
    rating: 4.9,
    reviews: 36,
    category: 'Beef Cuts',
    categorySlug: 'beef',
    inStock: true,
    stockQuantity: 60,
    description: 'Freshly minced prime lean beef (90/10 ratio) for burgers and lasagna.',
    weight: '1 kg',
    origin: 'Hincton Meat Products',
    sku: 'HMP-LEAN-BEEF-MINCE',
  },
  {
    id: 'prod-beef-ossobuco',
    name: 'Beef Ossobuco with Marrow',
    price: 700,
    image: '/hincton/beef-cuts.webp',
    images: ['/hincton/beef-cuts.webp'],
    rating: 4.8,
    reviews: 31,
    category: 'Beef Cuts',
    categorySlug: 'beef',
    inStock: true,
    stockQuantity: 40,
    description: 'Cross-cut beef shanks with buttery bone marrow centers for rich slow braising.',
    weight: '1 kg',
    origin: 'Hincton Meat Products',
    sku: 'HMP-OSSOBUCO',
  },
  {
    id: 'prod-oxtail-portioned',
    name: 'Oxtail Portioned per kg',
    price: 650,
    image: '/hincton/beef-cuts.webp',
    images: ['/hincton/beef-cuts.webp'],
    rating: 4.9,
    reviews: 48,
    category: 'Beef Cuts',
    categorySlug: 'beef',
    inStock: true,
    stockQuantity: 35,
    description: 'Selected oxtail segments rich in gelatin, collagen, and deep beef flavor.',
    weight: '1 kg',
    origin: 'Hincton Meat Products',
    sku: 'HMP-OXTAIL-PORTIONED',
  },
  {
    id: 'prod-mbuzi-choma-ribs',
    name: 'Mbuzi Choma Ribs',
    price: 900,
    image: '/hincton/goat-meat.webp',
    images: ['/hincton/goat-meat.webp'],
    rating: 4.9,
    reviews: 72,
    category: 'Lamb/Goat Cuts',
    categorySlug: 'goat',
    inStock: true,
    stockQuantity: 90,
    description: 'Fresh goat ribs cut specifically for authentic charcoal nyama choma.',
    weight: '1 kg',
    origin: 'Hincton Meat Products',
    sku: 'HMP-MBUZI-CHOMA-RIBS',
  },
  {
    id: 'prod-cubed-goat-bone',
    name: 'Cubed Goat (Bone-in)',
    price: 900,
    image: '/hincton/goat-meat.webp',
    images: ['/hincton/goat-meat.webp'],
    rating: 4.8,
    reviews: 58,
    category: 'Lamb/Goat Cuts',
    categorySlug: 'goat',
    inStock: true,
    stockQuantity: 80,
    description: 'Cleaned goat stew cuts for wet fry, goat biryani, and pepper soup.',
    weight: '1 kg',
    origin: 'Hincton Meat Products',
    sku: 'HMP-GOAT-CUBES-BONE',
  },
  {
    id: 'prod-whole-goat',
    name: 'Whole Cleaned Goat Carcass',
    price: 850,
    image: '/hincton/goat-meat.webp',
    images: ['/hincton/goat-meat.webp'],
    rating: 5.0,
    reviews: 19,
    category: 'Lamb/Goat Cuts',
    categorySlug: 'goat',
    inStock: true,
    stockQuantity: 25,
    description: 'Whole dressed goat, portioned and packed to order. Price per kg.',
    weight: '10-14 kg avg',
    origin: 'Hincton Meat Products',
    sku: 'HMP-WHOLE-GOAT',
  },
  {
    id: 'prod-frenched-lamb-chops',
    name: 'Frenched Lamb Chops',
    price: 1500,
    image: '/hincton/lamb-mutton.webp',
    images: ['/hincton/lamb-mutton.webp'],
    rating: 4.9,
    reviews: 27,
    category: 'Lamb/Goat Cuts',
    categorySlug: 'lamb',
    inStock: true,
    stockQuantity: 35,
    description: 'Delicate rib chops trimmed to the bone. Exceptional seared with fresh rosemary.',
    weight: '1 kg',
    origin: 'Hincton Meat Products',
    sku: 'HMP-FRENCHED-LAMB-CHOPS',
  },
  {
    id: 'prod-capon-whole',
    name: 'Dressed Farm Capon',
    price: 450,
    image: '/hincton/chicken.webp',
    images: ['/hincton/chicken.webp'],
    rating: 4.9,
    reviews: 45,
    category: 'Capon',
    categorySlug: 'chicken',
    inStock: true,
    stockQuantity: 65,
    description: 'Naturally reared farm chicken, whole dressed and chilled for roasting.',
    weight: '1.2 - 1.5 kg',
    origin: 'Hincton Meat Products',
    sku: 'HMP-CAPON-WHOLE',
  },
  {
    id: 'prod-chicken-wings-drums',
    name: 'Chicken Wings & Drumsticks',
    price: 600,
    image: '/hincton/chicken.webp',
    images: ['/hincton/chicken.webp'],
    rating: 4.8,
    reviews: 39,
    category: 'Capon',
    categorySlug: 'chicken',
    inStock: true,
    stockQuantity: 50,
    description: 'Fresh chicken wings and drums, ready for BBQ, air-frying, or curries.',
    weight: '1 kg',
    origin: 'Hincton Meat Products',
    sku: 'HMP-CHICKEN-WINGS-DRUMS',
  },
  {
    id: 'prod-fried-fish',
    name: 'Whole Fried Tilapia Fish',
    price: 650,
    image: '/hincton/fish.webp',
    images: ['/hincton/fish.webp'],
    rating: 4.7,
    reviews: 23,
    category: 'Fish',
    categorySlug: 'fish',
    inStock: true,
    stockQuantity: 30,
    description: 'Freshly fried whole Lake Victoria tilapia, golden and crisp.',
    weight: '1 piece (approx 700g)',
    origin: 'Hincton Meat Products',
    sku: 'HMP-FRIED-FISH',
  },
  {
    id: 'prod-pet-food-mix',
    name: 'Healthy Pet Food Meat Mix',
    price: 350,
    image: '/hincton/pet-food.jpg',
    images: ['/hincton/pet-food.jpg'],
    rating: 4.9,
    reviews: 31,
    category: 'Pet food',
    categorySlug: 'pet-food',
    inStock: true,
    stockQuantity: 80,
    description: 'Nutritious natural beef and bone trim mix for dogs and cats.',
    weight: '1 kg',
    origin: 'Hincton Meat Products',
    sku: 'HMP-PET-FOOD-1KG',
  },
]

const BuyerShop = ({ 
  onProductClick, 
  onAddToCart, 
  onToggleWishlist,
  wishlistItems = new Set()
}: BuyerShopProps) => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { t } = useLanguage()
  const initialProducts = readCachedProducts().length > 0 ? readCachedProducts() : DEFAULT_SHOP_PRODUCTS
  const [products, setProducts] = useState<Product[]>(() => filterProducts(
    initialProducts,
    searchParams.get('category') || '',
    searchParams.get('q') || searchParams.get('navSearch') || '',
  ))
  const [categories, setCategories] = useState<any[]>([
    { id: '', name: t('shop.allProducts'), count: initialProducts.length },
    { id: 'beef', name: 'Beef Cuts', count: initialProducts.filter(p => p.categorySlug === 'beef' || p.category.toLowerCase().includes('beef')).length },
    { id: 'goat', name: 'Goat / Mbuzi', count: initialProducts.filter(p => p.categorySlug === 'goat' || p.category.toLowerCase().includes('goat')).length },
    { id: 'lamb', name: 'Lamb / Mutton', count: initialProducts.filter(p => p.categorySlug === 'lamb' || p.category.toLowerCase().includes('lamb')).length },
    { id: 'chicken', name: 'Capon & Chicken', count: initialProducts.filter(p => p.categorySlug === 'chicken' || p.category.toLowerCase().includes('capon')).length },
    { id: 'sausages', name: 'Sausages', count: initialProducts.filter(p => p.categorySlug === 'sausages' || p.category.toLowerCase().includes('sausage')).length },
    { id: 'fish', name: 'Fish', count: initialProducts.filter(p => p.categorySlug === 'fish' || p.category.toLowerCase().includes('fish')).length },
    { id: 'pet-food', name: 'Pet food', count: initialProducts.filter(p => p.categorySlug === 'pet-food' || p.category.toLowerCase().includes('pet')).length },
  ])

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
    let cancelled = false
    const fetchData = async () => {
      try {
        const currentSort = searchParams.get('sort') || 'featured'
        const currentCategory = searchParams.get('category') || ''
        const currentQuery = searchParams.get('q') || ''
        const navigationQuery = searchParams.get('navSearch') || ''
        const filterQuery = currentQuery || navigationQuery
        const apiSort = getApiSortParams(currentSort)
        setSortBy(currentSort)
        setSelectedCategory(currentCategory)
        setSearchQuery(currentQuery)
        
        const params = {
          search: filterQuery || undefined,
          category: currentCategory || undefined,
          minPrice: undefined,
          maxPrice: undefined,
          sortBy: apiSort.sortBy,
          sortOrder: apiSort.sortOrder,
          page: 1,
          limit: 100
        }
        
        const [productsData, categoriesData] = await Promise.all([
          api.getProducts(params).catch(() => ({ products: [] })),
          api.getCategories().catch(() => ({ categories: [] })),
        ])

        if (cancelled) return
        
        const transformedProducts = (productsData.products || []).map(transformApiProduct)
        const activeProducts = transformedProducts.length > 0 ? transformedProducts : DEFAULT_SHOP_PRODUCTS
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
          return product.categorySlug?.toLowerCase() === normalized || product.category.toLowerCase().includes(normalized)
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
        // Retain fallback seamlessly
      }
    }

    fetchData()
    return () => {
      cancelled = true
    }
  }, [searchParams])

  const [filteredProducts, setFilteredProducts] = useState<Product[]>(products)
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '')
  const [sortBy, setSortBy] = useState('featured')
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const navigationQuery = searchParams.get('navSearch') || ''

  const [shopPills, setShopPills] = useState<Array<{ id: string; label: string }>>([
    { id: '', label: '🥩 All Cuts' },
  ])

  useEffect(() => {
    let cancelled = false
    productConfigApi.get().then((data) => {
      if (cancelled) return
      if (data.shopPills?.length) setShopPills(data.shopPills)
    }).catch(() => {})
    return () => { cancelled = true }
  }, [])

  // Update filtered products when products change
  useEffect(() => {
    setFilteredProducts(filterProducts(products, selectedCategory, searchQuery || navigationQuery))
  }, [products, selectedCategory, searchQuery, navigationQuery])

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
      setFilteredProducts(filterProducts(products, selectedCategory, query))
    }

    const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      updateUrl(selectedCategory, searchQuery, sortBy)
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

  const { isWatchMode } = useLayoutSplit()

  return (
    <div className="ambient-page bg-gray-50">
      <SplitLayoutContainer>
        {/* Header */}
        <section className="gravity-hero relative overflow-hidden bg-neutral-950 text-white">
          <div className="mx-auto max-w-[1800px] px-4 py-12 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-[1fr_420px] lg:items-end">
              <div className="max-w-2xl">
                <p className="text-sm font-bold uppercase tracking-wide text-yellow-300">{t('shop.premiumCounter')}</p>
                <h1 className="mt-3 text-4xl font-extrabold">{t('shop.freshCuts')}</h1>
                <p className="mt-3 text-lg text-neutral-300">{t('shop.description')}</p>
              </div>
              <form className="block" onSubmit={handleSearchSubmit}>
                <span className="mb-2 block text-sm font-semibold text-neutral-200">{t('shop.searchProducts')}</span>
                <div className="flex overflow-hidden rounded-lg bg-white shadow-xl">
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(event) => handleSearchChange(event.target.value)}
                    placeholder={t('shop.searchPlaceholder')}
                    className="min-w-0 flex-1 px-4 py-3 text-gray-950 outline-none"
                  />
                  {searchQuery && <button type="button" onClick={() => { handleSearchChange(''); updateUrl(selectedCategory, '', sortBy) }} className="flex w-11 items-center justify-center text-gray-400 transition hover:text-red-600" aria-label="Clear shop search"><X className="h-5 w-5" /></button>}
                  <div className="flex w-12 items-center justify-center border-l border-gray-200">
                    <VoiceSearchButton
                      onSearch={(query) => { handleSearchChange(query); updateUrl(selectedCategory, query, sortBy) }}
                      onNavigate={(page) => navigate(page)}
                    />
                  </div>
                  <span className="flex w-12 items-center justify-center text-gray-500">
                    <Search className="h-5 w-5" />
                  </span>
                </div>
                <p className="mt-2 text-xs text-neutral-400">Press Enter to refresh from live stock. Typing filters loaded products instantly.</p>
              </form>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="mx-auto max-w-[1800px] px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)_240px]">
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
              {/* Quick Category Filter Pills */}
              <div className="mb-6 flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                {shopPills.map((pill) => {
                  const isSelected = selectedCategory === pill.id
                  return (
                    <button
                      key={pill.id}
                      type="button"
                      onClick={() => handleCategoryChange(pill.id)}
                      className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-all shadow-sm ${
                        isSelected
                          ? 'bg-red-600 text-white shadow-red-600/25 ring-2 ring-red-600/20'
                          : 'border border-gray-200 bg-white text-gray-700 hover:border-red-300 hover:text-red-700'
                      }`}
                    >
                      {pill.label}
                    </button>
                  )
                })}
              </div>

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
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
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
      </SplitLayoutContainer>

      {isWatchMode && <SmartwatchCompactView />}
    </div>
  )
}

export default BuyerShop
