import React from 'react'
import { Truck, Shield, Clock, Award } from 'lucide-react'

const Features: React.FC = () => {
  const features = [
    {
      icon: <Truck className="w-8 h-8" />,
      title: 'Free Delivery',
      description: 'Free delivery on orders over KES 2,000 within Nairobi'
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'Quality Guaranteed',
      description: 'Premium quality meats from trusted local farms'
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: 'Fresh Daily',
      description: 'Fresh meats delivered daily to our store'
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: 'Best Prices',
      description: 'Competitive pricing without compromising quality'
    }
  ]

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Why Choose Prime Cuts
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We're committed to providing the highest quality meats with exceptional service
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="text-center group">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-black text-white rounded-full mb-6 group-hover:bg-red-600 transition-colors">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Features
