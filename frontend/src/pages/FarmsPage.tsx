import React from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Shield, Sun, Trees, Users } from 'lucide-react'

const FarmsPage: React.FC = () => {
  const farms = [
    {
      id: 1,
      name: "Nairobi Highlands Ranch",
      location: "Nairobi Highlands, Kenya",
      established: "2010",
      specialty: "Premium Beef",
      animals: "500+ Cattle",
      certifications: ["Organic", "Halal", "Free Range"],
      description: "Our flagship ranch specializing in premium grass-fed beef with traditional Kenyan farming methods.",
      image: "https://images.unsplash.com/photo-1546823998-b7c00af72b9d?w=800&h=600&fit=crop"
    },
    {
      id: 2,
      name: "Lake Victoria Poultry Farm",
      location: "Lake Victoria Region, Kenya",
      established: "2012",
      specialty: "Free-Range Chicken",
      animals: "10,000+ Chickens",
      certifications: ["Organic", "Free Range", "Antibiotic-Free"],
      description: "Sustainable poultry farm providing premium free-range chicken with no antibiotics or hormones.",
      image: "https://images.unsplash.com/photo-1577597802778-24d1df5fcc8f?w=800&h=600&fit=crop"
    },
    {
      id: 3,
      name: "Rift Valley Lamb Station",
      location: "Rift Valley, Kenya",
      established: "2015",
      specialty: "Premium Lamb",
      animals: "800+ Sheep",
      certifications: ["Organic", "Halal", "Grass-Fed"],
      description: "Specialized lamb station in the Rift Valley known for exceptional quality and taste.",
      image: "https://images.unsplash.com/photo-1587593815486-f8ff9a6f656f?w=800&h=600&fit=crop"
    },
    {
      id: 4,
      name: "Coastal Goat Farm",
      location: "Coastal Region, Kenya",
      established: "2018",
      specialty: "Premium Goat Meat",
      animals: "300+ Goats",
      certifications: ["Organic", "Halal", "Free Range"],
      description: "Coastal goat farm specializing in premium goat meat with traditional farming practices.",
      image: "https://images.unsplash.com/photo-1607623843076-385979c445c8?w=800&h=600&fit=crop"
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-green-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-6">
            <Trees className="w-16 h-16" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Our Partner Farms</h1>
          <p className="text-xl max-w-3xl mx-auto">
            Working with the finest farms across Kenya to bring you premium quality meats
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Introduction */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Where Quality Begins</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            We partner with carefully selected farms across Kenya that share our commitment to quality, 
            sustainability, and animal welfare. Each farm is certified and regularly inspected to ensure 
            the highest standards.
          </p>
        </div>

        {/* Farms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {farms.map((farm) => (
            <div key={farm.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              <div className="h-48 bg-gray-200">
                <img
                  src={farm.image}
                  alt={farm.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-500">{farm.location}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{farm.name}</h3>
                <p className="text-gray-600 mb-4">{farm.description}</p>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <span className="text-sm text-gray-500">Specialty</span>
                    <p className="font-semibold text-gray-900">{farm.specialty}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Animals</span>
                    <p className="font-semibold text-gray-900">{farm.animals}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {farm.certifications.map((cert, index) => (
                    <span
                      key={index}
                      className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium"
                    >
                      {cert}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Established {farm.established}</span>
                  <button className="text-red-600 hover:text-red-700 font-medium text-sm">
                    Learn More →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Features Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Our Farming Standards</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-green-100 p-4 rounded-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Certified Quality</h3>
              <p className="text-gray-600">
                All our farms are certified organic and meet strict quality standards for food safety.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 p-4 rounded-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Sun className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Sustainable Practices</h3>
              <p className="text-gray-600">
                We use sustainable farming methods that protect the environment and ensure long-term viability.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 p-4 rounded-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Fair Partnerships</h3>
              <p className="text-gray-600">
                We build long-term relationships with our farmers, ensuring fair prices and mutual growth.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-green-700 text-white rounded-lg p-8">
          <h2 className="text-3xl font-bold mb-4">Visit Our Farms</h2>
          <p className="text-xl mb-8">
            Experience our farming practices firsthand and meet the people behind your premium meat
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/contact" 
              className="inline-block bg-white text-green-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Schedule a Visit
            </Link>
            <Link 
              to="/shop" 
              className="inline-block border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-green-700 transition-colors"
            >
              Shop Our Products
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FarmsPage
