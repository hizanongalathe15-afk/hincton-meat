import type { SVGProps } from 'react'
import { Link } from 'react-router-dom'
import { Instagram, Mail, MapPin, Phone, X } from 'lucide-react'
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

const TikTokIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 4c4.418 0 8 3.582 8 8v6a2 2 0 0 1-2 2h-2V9h-2v8H9a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2z" />
    <path d="M9 4v4h4" />
  </svg>
)

const SnapchatIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 3c-3.314 0-5.998 2.686-5.998 6s-.035 3.46-.26 4.067a2.101 2.101 0 0 0 .826 2.156c.558.385 1.034.416 1.33.765.301.353.293.81.295 1.314.003.94.07 2.253.07 2.253h7.894s.068-1.316.07-2.253c.003-.504-.007-.96.295-1.314.296-.349.772-.38 1.33-.765a2.101 2.101 0 0 0 .826-2.156c-.225-.607-.26-1.056-.26-4.067 0-3.314-2.684-6-5.998-6Z" />
    <path d="M8.5 9.5c.5-.5 1.5-1 3.5-1s3 0 3.5 1" />
    <path d="M9 13c.5.5 1.5 1 3 1s2.5-.5 3-1" />
  </svg>
)

const socialLinks = [
  {
    label: 'Instagram',
    href: 'https://instagram.com/hinctonmeatproducts',
    icon: Instagram,
    bgClass: 'bg-gradient-to-br from-[#f58529] via-[#dd2a7b] to-[#8134af] text-white',
  },
  {
    label: 'TikTok',
    href: 'https://www.tiktok.com/@hinctonmeatproducts',
    icon: TikTokIcon,
    bgClass: 'bg-black text-white',
  },
  {
    label: 'Snapchat',
    href: 'https://www.snapchat.com/add/hinctonmeatproducts',
    icon: SnapchatIcon,
    bgClass: 'bg-[#FFFC00] text-black',
  },
  {
    label: 'X',
    href: 'https://x.com/hinctonmeatproducts',
    icon: X,
    bgClass: 'bg-[#000000] text-white',
  },
]

const Footer = () => {
  const { profile } = useSiteContent()
  const brand = profile.brand

  return (
    <footer className="mt-auto bg-gray-950 py-14 text-white" aria-label="Site footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <img src={profile.images.logo || brand.logo} alt={brand.name} className="h-16 w-auto rounded bg-white p-1" />
              <span className="max-w-full break-words text-base font-bold uppercase leading-tight sm:text-lg">
                {brand.name}
              </span>
            </div>
            <p className="max-w-full text-sm leading-7 text-gray-300 sm:text-base">
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
            <h2 className="mb-4 text-base font-semibold sm:text-lg">Contact</h2>
            <ul className="space-y-3 text-sm text-gray-300 sm:text-base">
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
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-gray-800 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-400">Connect with us for fresh updates, special offers, and product drops.</p>
          <div className="flex flex-wrap items-center gap-3">
            {socialLinks.map((link) => {
              const Icon = link.icon
              return (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition ${link.bgClass} hover:opacity-90`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span>{link.label}</span>
                </a>
              )
            })}
          </div>
        </div>

        <div className="mt-8 border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
          <p>© 2026 {brand.name}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
