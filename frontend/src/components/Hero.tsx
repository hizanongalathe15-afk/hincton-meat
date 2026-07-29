import React from 'react'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useSiteContent } from '../contexts/SiteContentContext'

const Hero: React.FC = () => {
  const { profile } = useSiteContent()
  const brand = profile.brand

  return (
    <section className="relative bg-black text-white">
      <div className="absolute inset-0 opacity-20">
        <img
          src="/hincton/hero-platter.webp"
          alt="Hincton Meat Products background"
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-32">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            {brand.name || ''}
            <br />
            <span className="text-gray-300">{brand.tagline || ''}</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Fresh, safe, and nutritious meat products from Nairobi for local and international markets.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link
              to="/shop"
              className="px-8 py-4 bg-red-600 hover:bg-red-700 transition-colors rounded-sm flex items-center gap-3 text-lg font-medium"
            >
              Shop Now
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/about"
              className="px-8 py-4 border-2 border-white hover:bg-white hover:text-black transition-colors rounded-sm text-lg font-medium"
            >
              Learn More
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
