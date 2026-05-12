import React from 'react'
import { Link } from 'react-router-dom'
import { Leaf, Recycle, Droplets, Wind, Trees, Globe, Award, Target } from 'lucide-react'

const SustainabilityPage: React.FC = () => {
  const initiatives = [
    {
      icon: Trees,
      title: "Reforestation",
      description: "We plant 100 trees for every farm that partners with us, helping to combat climate change and preserve natural habitats.",
      impact: "50,000+ trees planted",
      color: "green"
    },
    {
      icon: Droplets,
      title: "Water Conservation",
      description: "Our farms use advanced irrigation systems that reduce water consumption by 40% compared to traditional methods.",
      impact: "40% less water usage",
      color: "blue"
    },
    {
      icon: Recycle,
      title: "Waste Reduction",
      description: "We implement comprehensive recycling programs and waste-to-energy systems at all our facilities.",
      impact: "90% waste recycled",
      color: "purple"
    },
    {
      icon: Wind,
      title: "Renewable Energy",
      description: "Our farms are powered by solar and wind energy, reducing our carbon footprint significantly.",
      impact: "75% renewable energy",
      color: "yellow"
    }
  ]

  const certifications = [
    {
      name: "Organic Kenya Certified",
      description: "Certified organic farming practices that meet international standards",
      icon: Award
    },
    {
      name: "Carbon Neutral",
      description: "We offset our carbon emissions through reforestation and renewable energy",
      icon: Leaf
    },
    {
      name: "Fair Trade Partner",
      description: "Ensuring fair wages and working conditions for all farm workers",
      icon: Target
    },
    {
      name: "Biodiversity Protected",
      description: "Protecting and enhancing biodiversity on and around our farms",
      icon: Globe
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-green-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-6">
            <Leaf className="w-16 h-16" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Sustainability Commitment</h1>
          <p className="text-xl max-w-3xl mx-auto">
            Dedicated to sustainable farming practices that protect our planet for future generations
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Our Approach */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Sustainable Approach</h2>
            <p className="text-gray-600 mb-4">
              At Hincton Meat Products, sustainability isn't just a buzzword - it's at the core of everything we do.
              We believe that producing high-quality meat goes hand-in-hand with protecting our environment 
              and supporting our communities.
            </p>
            <p className="text-gray-600 mb-4">
              Our approach to sustainability encompasses three key areas: environmental stewardship, 
              animal welfare, and social responsibility. We work tirelessly to ensure that every aspect 
              of our operations contributes to a healthier planet.
            </p>
            <p className="text-gray-600">
              From our farms to your table, we're committed to reducing our environmental footprint while 
              delivering the quality, freshness, and integrity you expect from Hincton Meat Products.
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Our Impact in Numbers</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Carbon Footprint Reduced</span>
                <span className="font-bold text-green-600">60%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Water Saved</span>
                <span className="font-bold text-blue-600">2M+ gallons</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Waste Diverted</span>
                <span className="font-bold text-purple-600">500+ tons</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Renewable Energy</span>
                <span className="font-bold text-yellow-600">75%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Initiatives */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Key Initiatives</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {initiatives.map((initiative, index) => {
              const Icon = initiative.icon
              return (
                <div key={index} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                  <div className={`bg-${initiative.color}-100 p-3 rounded-lg w-12 h-12 mb-4 flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 text-${initiative.color}-600`} />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{initiative.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{initiative.description}</p>
                  <div className="text-sm font-bold text-gray-900">{initiative.impact}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Certifications */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Our Certifications</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {certifications.map((cert, index) => {
              const Icon = cert.icon
              return (
                <div key={index} className="text-center">
                  <div className="bg-green-100 p-4 rounded-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Icon className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{cert.name}</h3>
                  <p className="text-gray-600 text-sm">{cert.description}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Future Goals */}
        <div className="bg-green-700 text-white rounded-lg p-8 mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Our 2030 Sustainability Goals</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">100%</div>
              <p className="text-green-100">Renewable energy across all farms</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">Zero</div>
              <p className="text-green-100">Waste to landfill by 2030</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">1M</div>
              <p className="text-green-100">Trees planted by 2030</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Join Our Sustainability Journey</h2>
          <p className="text-xl text-gray-600 mb-8">
            Every purchase supports our commitment to sustainable farming practices
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/shop" 
              className="inline-block bg-green-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-800 transition-colors"
            >
              Shop Sustainably
            </Link>
            <Link 
              to="/farms" 
              className="inline-block border-2 border-green-700 text-green-700 px-8 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors"
            >
              Visit Our Farms
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SustainabilityPage
