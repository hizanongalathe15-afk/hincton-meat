import { Link } from 'react-router-dom'
import { Instagram, Mail, MapPin, Phone } from 'lucide-react'
import { useSiteContent } from '../contexts/SiteContentContext'

const productLinks = [
  { label: 'Beef', to: '/shop?category=beef' },
  { label: 'Goat', to: '/shop?category=goat' },
  { label: 'Lamb/Mutton', to: '/shop?category=lamb' },
  { label: 'Chicken', to: '/shop?category=chicken' },
  { label: 'Fish', to: '/shop?category=fish' },
]

const companyLinks = [
  { label: 'About Us', to: '/about' },
  { label: 'Our Farms', to: '/farms' },
  { label: 'Sustainability', to: '/sustainability' },
  { label: 'Contact', to: '/contact' },
]

const Footer = () => {
  const { profile } = useSiteContent()
  const brand = profile.brand

  return (
    <footer className="mt-auto bg-gray-950 py-14 text-white" aria-label="Site footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <img src={profile.images.logo || brand.logo} alt={brand.name} className="h-16 w-auto rounded bg-white p-1" />
              <span className="text-lg font-bold uppercase leading-tight">{brand.name}</span>
            </div>
            <p className="max-w-xs text-base leading-7 text-gray-300">
              {brand.tagline}. Fresh, safe, and nutritious meat products from Nairobi for local and international markets.
            </p>
          </div>

          <div>
            <h2 className="mb-4 text-lg font-semibold">Products</h2>
            <ul className="space-y-3 text-base text-gray-300">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="mb-4 text-lg font-semibold">Company</h2>
            <ul className="space-y-3 text-base text-gray-300">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="mb-4 text-lg font-semibold">Contact</h2>
            <ul className="space-y-3 text-base text-gray-300">
              <li className="flex items-center gap-2">
                <Phone className="h-5 w-5 shrink-0 text-red-500" aria-hidden="true" />
                <a href={brand.phoneHref} className="transition-colors hover:text-white">
                  {brand.phone}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-5 w-5 shrink-0 text-red-500" aria-hidden="true" />
                <a href={brand.emailHref} className="transition-colors hover:text-white">
                  {brand.email}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-red-500" aria-hidden="true" />
                <span>{brand.address}</span>
              </li>
              <li className="flex items-center gap-2">
                <Instagram className="h-5 w-5 shrink-0 text-red-500" aria-hidden="true" />
                <span>{brand.socialHandle}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
          <p>© 2026 {brand.name}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
