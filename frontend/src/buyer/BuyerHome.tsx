import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { Award, ChevronLeft, ChevronRight, Globe2, Shield, Snowflake, Truck } from 'lucide-react'
import HeroSection from './HeroSection'
import ProductCard from './ProductCard'
import { Product } from '../types/index'
import { productsApi as api } from '../services/buyerApi'
import { useSiteContent } from '../contexts/SiteContentContext'
import { HINCTON_PRODUCTS } from '../utils/hinctonBrand'

interface BuyerHomeProps {
  onProductClick?: (product: Product) => void
  onAddToCart?: (product: Product, quantity: number) => void
  onToggleWishlist?: (productId: string) => void
  wishlistItems?: Set<string>
}

const BuyerHome = ({
  onProductClick,
  onAddToCart,
  onToggleWishlist,
  wishlistItems = new Set(),
}: BuyerHomeProps) => {
  const navigate = useNavigate()
  const { profile } = useSiteContent()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<any[]>([...HINCTON_PRODUCTS])
  const [productTiles, setProductTiles] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const topProductScrollerRef = useRef<HTMLDivElement>(null)
  const bottomProductScrollerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(false)
      try {
        // Fetch featured products
        const [productsData, allProductsData] = await Promise.all([
          api.getFeaturedProducts(),
          api.getProducts({ limit: 12 }),
        ])
        
        // Transform API data to component format
        const transformedProducts = (productsData.products || []).slice(0, 3).map((product: any) => ({
          id: product.id,
          name: product.name,
          price: Number(product.price) || 0,
          originalPrice: product.comparePrice ? Number(product.comparePrice) : undefined,
          image: product.productImages?.[0]?.url || 'https://via.placeholder.com/700x600',
          images: product.productImages?.map((img: any) => img.url) || [],
          rating: 4.5, // Would need reviews API
          reviews: 0, // Would need reviews API
          category: product.category?.name || 'Uncategorized',
          categorySlug: product.category?.slug || product.categoryId || product.category?.id,
          inStock: product.stockQuantity > 0,
          stockQuantity: Number(product.stockQuantity) || 0,
          lowStockThreshold: Number(product.lowStockThreshold) || undefined,
          description: product.description || '',
          weight: [product.weight, product.weightUnit].filter(Boolean).join(' ') || product.weightUnit || '',
          weightValue: Number(product.weight) || undefined,
          weightUnit: product.weightUnit || undefined,
          origin: product.brand || 'Hincton Meat Products',
        }))
        
        setProducts(transformedProducts)

        const backendProductTiles = (allProductsData.products || []).map((product: any) => ({
          name: product.name,
          category: product.category?.slug || product.categoryId || product.category?.id || '',
          description: product.shortDescription || product.description || product.category?.name || 'Fresh Hincton product.',
          image: product.productImages?.[0]?.url || product.images?.[0] || 'https://via.placeholder.com/800x650',
          href: `/product/${product.id}`,
          cta: 'View Product',
        }))

        setProductTiles(backendProductTiles)

        // Fetch categories
        const categoriesData = await api.getCategories()
        const transformedCategories = (categoriesData.categories || []).slice(0, 6).map((category: any) => ({
          name: category.name,
          category: category.slug || category.id,
          description: category.description || '',
          image: category.image || 'https://via.placeholder.com/800x650',
        }))
        
        setCategories(transformedCategories.length ? transformedCategories : [...HINCTON_PRODUCTS])
      } catch (error) {
        console.error('Failed to fetch home data:', error)
        // Set fallback data on error
        setProducts([])
        setCategories([...HINCTON_PRODUCTS])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

const features = [
  {
    icon: Award,
    title: 'Only Fresh Meat',
    description: 'Fresh, safe, and nutritious meat products handled with care.',
  },
  {
    icon: Truck,
    title: 'Efficient Dispatch',
    description: 'Temperature-controlled storage and reliable dispatch systems.',
  },
  {
    icon: Shield,
    title: 'Food Safety',
    description: 'Strict standards for safety, quality, and ethical sourcing.',
  },
  {
    icon: Snowflake,
    title: 'Cold Chain',
    description: 'Advanced chilling and freezing technology preserves freshness.',
  },
]

  const handleSearch = (query: string) => {
    const params = new URLSearchParams()
    if (query.trim()) {
      params.set('q', query.trim())
    }
    navigate(`/shop${params.toString() ? `?${params.toString()}` : ''}`)
  }

  const handleProductClick = (product: Product) => {
    onProductClick?.(product)
    navigate(`/product/${product.id}`)
  }

  const scrollProductTiles = (row: 'top' | 'bottom', direction: 'left' | 'right') => {
    const scroller = row === 'top' ? topProductScrollerRef.current : bottomProductScrollerRef.current
    if (!scroller) return
    scroller.scrollBy({
      left: direction === 'left' ? -scroller.clientWidth * 0.85 : scroller.clientWidth * 0.85,
      behavior: 'smooth',
    })
  }

  const displayedTiles = productTiles.length ? productTiles : categories.map((category: any) => ({
    ...category,
    href: `/shop?category=${category.category}`,
    cta: 'View Products',
  }))
  const topProductTiles = displayedTiles.filter((_, index) => index % 2 === 0)
  const bottomProductTiles = displayedTiles.filter((_, index) => index % 2 === 1)

  if (loading) {
    return (
      <div className="bg-white">
        <div className="animate-pulse">
          <div className="h-96 bg-gray-200"></div>
          <div className="p-20">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white">
      <HeroSection onSearch={handleSearch} />

      <section className="bg-gray-50 py-14">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <div key={feature.title} className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                  <Icon className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-gray-950">{feature.title}</h3>
                <p className="text-sm leading-6 text-gray-600">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </section>

      <section id="products" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="text-center md:text-left">
              <p className="text-sm font-bold uppercase tracking-wide text-red-700">Products offered</p>
              <h2 className="mt-3 text-4xl font-extrabold text-gray-950">Fresh cuts and processed products</h2>
              <p className="mt-4 text-lg text-gray-600">
                {productTiles.length ? 'Browse products posted by admin.' : 'Goat, beef, chicken, lamb/mutton, fish, and pet food from the Hincton profile.'}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {(['top', 'bottom'] as const).map((row) => (
                <div key={row} className="flex items-center justify-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wide text-gray-500">{row}</span>
                  <button
                    type="button"
                    onClick={() => scrollProductTiles(row, 'left')}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-800 shadow-sm transition hover:border-red-500 hover:text-red-700"
                    aria-label={`Scroll ${row} products left`}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollProductTiles(row, 'right')}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-800 shadow-sm transition hover:border-red-500 hover:text-red-700"
                    aria-label={`Scroll ${row} products right`}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6" aria-label={productTiles.length ? 'Products' : 'Product categories'}>
            {[
              { ref: topProductScrollerRef, tiles: topProductTiles, label: 'Upper products' },
              { ref: bottomProductScrollerRef, tiles: bottomProductTiles, label: 'Lower products' },
            ].map((row) => (
              <div
                key={row.label}
                ref={row.ref}
                className="-mx-4 flex gap-5 overflow-x-auto scroll-smooth px-4 pb-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
                aria-label={row.label}
              >
                {row.tiles.map((category: any) => (
                  <Link
                    key={`${row.label}-${category.href}-${category.name}`}
                    to={category.href}
                    className="group block w-[82vw] shrink-0 sm:w-[24rem] lg:w-[30rem]"
                  >
                    <div className="relative mb-4 aspect-[4/3] overflow-hidden rounded-lg shadow-lg">
                      <img
                        src={category.image}
                        alt={category.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                        <h3 className="mb-1 text-2xl font-bold">{category.name}</h3>
                        <p className="text-sm text-gray-200">{category.description}</p>
                      </div>
                    </div>
                    <span className="block rounded bg-red-600 py-3 text-center font-bold text-white transition-colors group-hover:bg-red-700">
                      {category.cta}
                    </span>
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-red-700">Market presence</p>
            <h2 className="mt-3 text-4xl font-extrabold text-gray-950">Serving Kenya and export markets</h2>
            <div className="mt-8 space-y-5">
              {profile.markets.map((market) => (
                <div key={market} className="flex gap-3 text-lg leading-8 text-gray-700">
                  <Globe2 className="mt-1 h-6 w-6 shrink-0 text-red-700" />
                  <p>{market}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="overflow-hidden rounded bg-gray-950">
            <img src={profile.images.market} alt="Livestock market presence" className="h-72 w-full object-cover opacity-90" />
            <div className="p-8">
              <h3 className="text-3xl font-extrabold text-white">Commitment to Livestock Procurement</h3>
              <p className="mt-4 text-lg leading-8 text-gray-200">
                We prioritize ethical and sustainable livestock procurement by partnering with trusted farmers and suppliers who meet strict standards.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-red-700">Processing and quality control</p>
            <h2 className="mt-3 text-4xl font-extrabold text-gray-950">Freshness protected from storage to dispatch</h2>
          </div>
          <div className="space-y-4">
                {profile.qualityPoints.map((point) => (
              <div key={point} className="rounded bg-white p-5 shadow-sm">
                <p className="text-lg leading-7 text-gray-700">{point}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-red-700">Butcher picks</p>
              <h2 className="mt-3 text-4xl font-extrabold text-gray-950">Featured products</h2>
            </div>
            <Link to="/shop" className="inline-flex rounded-lg bg-gray-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-gray-800">
              Shop all products
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={onAddToCart}
                onToggleWishlist={onToggleWishlist}
                isInWishlist={wishlistItems.has(product.id)}
                onClick={() => handleProductClick(product)}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#333437] py-20">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-4xl font-extrabold text-white">{profile.brand.mantra}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-red-100">
            Order trusted meat products for homes, wholesalers, retailers, and foodservice operations.
          </p>
          <Link
            to="/shop"
            className="mt-8 inline-flex rounded-lg bg-white px-10 py-4 text-lg font-bold text-red-600 transition hover:bg-gray-100"
          >
            Start Shopping Today
          </Link>
        </div>
      </section>
    </div>
  )
}

export default BuyerHome
