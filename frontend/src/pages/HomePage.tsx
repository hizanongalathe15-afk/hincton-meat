import React from 'react'
import { Link } from 'react-router-dom'
import { ShoppingCart, Clock, Truck, Shield, ArrowRight, Beef } from 'lucide-react'
import { useQuery } from 'react-query'
import { productService } from '../services/productService'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ProductCard from '../buyer/ProductCard'
import AdPlacement from '../components/AdPlacement'
import DealsSection from '../components/DealsSection'
import { MEAT_CATEGORIES } from '../utils/constants'
import { useLanguage } from '../contexts/LanguageContext'


const HomePage: React.FC = () => {
  const { t } = useLanguage()
  const {
    data: featuredProducts,
    isLoading: featuredLoading,
    error: featuredError
  } = useQuery('featuredProducts', productService.getFeaturedProducts)

  const features = [
    {
      icon: <Truck className="w-8 h-8" />,
      title: t('home.fastDelivery'),
      description: t('home.freeDeliveryOver')
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: t('home.qualityGuaranteed'),
      description: t('home.premiumQualityMeats')
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: t('home.freshDaily'),
      description: t('home.freshMeatsDaily')
    }
  ]

  if (featuredLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (featuredError) {
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
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
              Premium Quality Meats
              <span className="block text-2xl sm:text-3xl md:text-4xl mt-2 text-primary-200">
                Delivered Fresh to Your Door
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl mb-8 text-primary-100 max-w-3xl mx-auto">
              Shop from our wide selection of premium beef, chicken, lamb, goat, pork and more. 
              Quality you can trust, delivered when you need it.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/shop"
                className="btn bg-white text-primary-600 hover:bg-gray-100 px-6 py-3 sm:px-8 text-base sm:text-lg font-semibold inline-flex items-center justify-center"
              >
                Shop Now
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                to="/about"
                className="btn border-2 border-white text-white hover:bg-white hover:text-primary-600 px-6 py-3 sm:px-8 text-base sm:text-lg font-semibold"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Top Banner Ad */}
      <section className="py-6 bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AdPlacement placementId="home-top-banner" type="BANNER" className="w-full" fallback={<div className="bg-gray-700 h-32 rounded" />} />
        </div>
      </section>

      {/* Admin-controlled centre-screen demo. Delete the "centre-screen-demo" placement from Ad Management when finished testing. */}
      <AdPlacement placementId="centre-screen-demo" type="POPUP" autoOpen />

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 text-primary-600 rounded-full mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Shop by Category
            </h2>
            <p className="text-xl text-gray-600">
              Choose from our wide selection of premium meats
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {MEAT_CATEGORIES.slice(0, 10).map((category) => (
              <Link
                key={category}
                to={`/shop?category=${category}`}
                className="card p-6 text-center hover:shadow-lg transition-shadow hover-lift"
              >
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Beef className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="font-semibold text-gray-900">{category}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Deals Sections - Admin controlled (Top Deals, Clearance Sale, Flash Sales) */}
      <section className="py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <DealsSection />
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Featured Products
              </h2>
              <p className="text-xl text-gray-600">
                Our most popular and premium meat selections
              </p>
            </div>
            <Link
              to="/shop?featured=true"
              className="btn btn-primary inline-flex items-center"
            >
              View All
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </div>
          
          {featuredProducts && featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.slice(0, 8).map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">No featured products available at the moment.</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Order Hincton Meat Products?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers who trust us for their meat needs. 
            Quality, freshness, and convenience delivered.
          </p>
          <Link
            to="/shop"
            className="btn bg-white text-primary-600 hover:bg-gray-100 px-8 py-3 text-lg font-semibold inline-flex items-center"
          >
            Start Shopping
            <ShoppingCart className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary-600 mb-2">50+</div>
              <div className="text-gray-600">Meat Varieties</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-600 mb-2">1000+</div>
              <div className="text-gray-600">Happy Customers</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-600 mb-2">24/7</div>
              <div className="text-gray-600">Fresh Delivery</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-600 mb-2">4.8★</div>
              <div className="text-gray-600">Customer Rating</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage
