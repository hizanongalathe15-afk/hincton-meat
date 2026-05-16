import { FormEvent, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ChevronDown, Heart, LogOut, Menu, MessageSquare, Package, Search, Settings, Shield, ShoppingCart, Star, User, Wallet, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { useSiteContent } from '../contexts/SiteContentContext'
import { useConfirmationDialog } from '../hooks/useConfirmationDialog'
import ConfirmationDialog from '../components/ui/ConfirmationDialog'
import { useLanguage } from '../contexts/LanguageContext'
import LanguageSelector from './LanguageSelector'
import { getApiHost } from '../services/api'
import Notifications from './Notifications'

const Navigation = () => {

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { user, logout } = useAuth()
  const { getTotalItems } = useCart()
  const { profile } = useSiteContent()
  const navigate = useNavigate()
  const location = useLocation()
  const cartItemCount = getTotalItems()
  const { isOpen, options, confirm, handleConfirm, handleCancel } = useConfirmationDialog()
  const { t } = useLanguage()
  const [searchTerm, setSearchTerm] = useState('')
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)
  const profileDropdownRef = useRef<HTMLDivElement>(null)
  const isAdmin = String(user?.role || '').toLowerCase() === 'admin'
  const homePath = user ? (isAdmin ? '/admin/dashboard' : '/profile') : '/'
  const API_HOST = getApiHost()

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const query = searchTerm.trim()
    if (query.length === 0) {
      navigate('/shop')
      return
    }
    setSearchTerm('')
    navigate(`/shop?q=${encodeURIComponent(query)}`)
  }

  useEffect(() => {
    if (!isProfileDropdownOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isProfileDropdownOpen])


  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])

  const handleLogout = async () => {
    setIsProfileDropdownOpen(false)
    const confirmed = await confirm({
      title: t('auth.logout'),
      message: t('modal.logoutMessage'),
      confirmText: t('auth.logout'),
      cancelText: t('common.stay'),
      type: 'warning',
      icon: 'logout',
    })

    if (!confirmed) return


    try {
      await logout()
      navigate('/login')
      toast.success(t('toast.loggedOut'))
    } catch {
      toast.error(t('toast.failedLogout'))
    }

  }

  const navLinks = [
    { to: homePath, label: t('nav.home') },
    { to: '/shop', label: t('nav.products') },
    { to: '/about', label: t('nav.about') },
    { to: '/contact', label: t('nav.contact') },
  ]


  return (
    <>
      <nav className="fixed top-0 z-50 w-full bg-white/95 shadow-sm backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between md:h-20">
            {/* Brand/Logo Section */}
            <Link to={homePath} className="flex items-center gap-3 flex-shrink-0">
              <img src={profile.images.logo || profile.brand.logo} alt={profile.brand.name} className="h-10 w-auto sm:h-12" />
              <span className="max-w-[10rem] truncate text-base font-extrabold uppercase tracking-normal text-gray-900 sm:text-lg lg:max-w-none lg:whitespace-nowrap">
                {profile.brand.name}
              </span>
            </Link>

            {/* Navigation Links Section */}
            <div className="hidden items-center gap-6 lg:flex flex-1 justify-center mx-8">
              {navLinks.map((link) => (
                <Link key={link.label} to={link.to} className="text-gray-700 transition-colors hover:text-red-600 whitespace-nowrap">
                  {link.label}
                </Link>
              ))}

              {user?.role === 'admin' ? (
                <Link to="/admin/dashboard" className="flex items-center gap-2 text-gray-700 transition-colors hover:text-red-600">
                  <Shield className="h-4 w-4" />
                  {t('nav.admin')}
                </Link>
              ) : null}
            </div>

            {/* Right Side Actions Section */}
            <div className="hidden items-center gap-4 lg:flex flex-shrink-0">
              {user && !isAdmin && (
                <form onSubmit={handleSearchSubmit} className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder={t('shop.searchForMeats') || 'Search meat products'}
                    className="w-40 lg:w-64 pl-10 pr-3 py-1.5 border border-gray-200 rounded-full bg-white text-sm text-gray-900 placeholder-gray-400 focus:border-red-600 focus:ring-1 focus:ring-red-600"
                    aria-label="Search products"
                  />
                </form>
              )}

              <LanguageSelector />

              {user && !isAdmin ? <Notifications /> : null}

              {user ? (
                <div className="relative" ref={profileDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsProfileDropdownOpen((open) => !open)}
                    className="flex items-center gap-3 rounded-full p-2 transition-colors hover:bg-gray-100"
                  >
                    <div className="h-9 w-9 overflow-hidden rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-700">
                      {user.avatar || user.profile?.avatar ? (
                        <img
                          src={(user.avatar || user.profile?.avatar)?.startsWith('http') ? (user.avatar || user.profile?.avatar) : `${API_HOST}${user.avatar || user.profile?.avatar}`}
                          alt={user.name || user.email || 'Profile'}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span>{(user.name || user.email || 'U')[0].toUpperCase()}</span>
                      )}
                    </div>
                    <span className="hidden text-sm font-medium text-gray-900 lg:block">
                      {user.name || user.email || 'Customer'}
                    </span>
                  </button>

                  {isProfileDropdownOpen && (
                    <div className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
                      <div className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 overflow-hidden rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-700">
                            {user.avatar || user.profile?.avatar ? (
                              <img
                                src={(user.avatar || user.profile?.avatar)?.startsWith('http') ? (user.avatar || user.profile?.avatar) : `${API_HOST}${user.avatar || user.profile?.avatar}`}
                                alt={user.name || user.email || 'Profile'}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span>{(user.name || user.email || 'U')[0].toUpperCase()}</span>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{user.name || user.email || 'Customer'}</p>
                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                          </div>
                        </div>
                      </div>
                      <div className="border-t border-gray-100"></div>
                      <div className="space-y-1 p-2">
                        <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                          My Account
                        </div>
                        <Link
                          to="/profile"
                          onClick={() => setIsProfileDropdownOpen(false)}
                          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
                        >
                          <User className="w-4 h-4" />
                          <span>Account</span>
                          <ChevronDown className="w-4 h-4 ml-auto rotate-180 text-gray-400" />
                        </Link>
                        <Link
                          to="/profile?tab=orders"
                          onClick={() => setIsProfileDropdownOpen(false)}
                          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
                        >
                          <Package className="w-4 h-4" />
                          <span>Orders</span>
                          <ChevronDown className="w-4 h-4 ml-auto rotate-180 text-gray-400" />
                        </Link>
                        <Link
                          to="/messages"
                          onClick={() => setIsProfileDropdownOpen(false)}
                          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>Messages</span>
                          <ChevronDown className="w-4 h-4 ml-auto rotate-180 text-gray-400" />
                        </Link>
                        <Link
                          to="/reviews"
                          onClick={() => setIsProfileDropdownOpen(false)}
                          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
                        >
                          <Star className="w-4 h-4" />
                          <span>Ratings & Reviews</span>
                          <ChevronDown className="w-4 h-4 ml-auto rotate-180 text-gray-400" />
                        </Link>
                        <Link
                          to="/wallet"
                          onClick={() => setIsProfileDropdownOpen(false)}
                          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
                        >
                          <Wallet className="w-4 h-4" />
                          <span>Wallet</span>
                          <ChevronDown className="w-4 h-4 ml-auto rotate-180 text-gray-400" />
                        </Link>
                        <Link
                          to="/profile?tab=wishlist"
                          onClick={() => setIsProfileDropdownOpen(false)}
                          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
                        >
                          <Heart className="w-4 h-4" />
                          <span>Wishlist</span>
                          <ChevronDown className="w-4 h-4 ml-auto rotate-180 text-gray-400" />
                        </Link>
                      </div>
                      <div className="border-t border-gray-100"></div>
                      <div className="space-y-1 p-2">
                        <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Settings
                        </div>
                        <Link
                          to="/profile?tab=settings"
                          onClick={() => setIsProfileDropdownOpen(false)}
                          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                          <span>Settings</span>
                          <ChevronDown className="w-4 h-4 ml-auto rotate-180 text-gray-400" />
                        </Link>
                      </div>
                      <div className="border-t border-gray-100"></div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileDropdownOpen(false)
                          handleLogout()
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-red-700 hover:bg-red-50 transition-colors font-medium"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center">
                  <button 
                    onClick={() => navigate('/login')}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
                    aria-label={t('auth.login')}
                  >
                    <User className="h-5 w-5 text-gray-700" />
                  </button>
                </div>
              )}

              <Link
                to="/cart"
                className="relative flex items-center gap-2 rounded-lg bg-red-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-red-700"
              >
                <ShoppingCart className="h-4 w-4" />
                {t('common.cart')}
                {cartItemCount > 0 ? (
                  <span className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-gray-950 px-1.5 text-xs font-bold text-white">
                    {cartItemCount}
                  </span>
                ) : null}
              </Link>
            </div>

            <button
              onClick={() => setIsMobileMenuOpen((open) => !open)}
              className="rounded-lg p-2 text-gray-700 transition-colors hover:bg-gray-100 md:hidden"
              aria-label="Toggle navigation"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="border-t border-gray-200 bg-white md:hidden">
            <div className="mx-auto max-w-7xl space-y-2 px-4 py-4">
              {navLinks.map((link) => (
                <Link key={link.label} to={link.to} className="block rounded-lg px-3 py-2 font-medium text-gray-700 hover:bg-red-50 hover:text-red-600">
                  {link.label}
                </Link>
              ))}
              <Link to="/cart" className="flex items-center justify-between rounded-lg bg-red-600 px-3 py-2 font-semibold text-white">
                <span className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Cart
                </span>
                {cartItemCount > 0 ? <span>{cartItemCount}</span> : null}
              </Link>
              {user ? (
                <>
                  <Link to="/profile" className="flex items-center gap-2 rounded-lg px-3 py-2 font-medium text-gray-700 hover:bg-red-50 hover:text-red-600">
                    <User className="h-4 w-4" />
                    Account
                  </Link>
                  <Link to="/profile?tab=orders" className="flex items-center gap-2 rounded-lg px-3 py-2 font-medium text-gray-700 hover:bg-red-50 hover:text-red-600">
                    <Package className="h-4 w-4" />
                    Orders
                  </Link>
                  <Link to="/messages" className="flex items-center gap-2 rounded-lg px-3 py-2 font-medium text-gray-700 hover:bg-red-50 hover:text-red-600">
                    <MessageSquare className="h-4 w-4" />
                    Messages
                  </Link>
                  <Link to="/reviews" className="flex items-center gap-2 rounded-lg px-3 py-2 font-medium text-gray-700 hover:bg-red-50 hover:text-red-600">
                    <Star className="h-4 w-4" />
                    Ratings & Reviews
                  </Link>
                  <Link to="/wallet" className="flex items-center gap-2 rounded-lg px-3 py-2 font-medium text-gray-700 hover:bg-red-50 hover:text-red-600">
                    <Wallet className="h-4 w-4" />
                    Wallet
                  </Link>
                  <Link to="/profile?tab=wishlist" className="flex items-center gap-2 rounded-lg px-3 py-2 font-medium text-gray-700 hover:bg-red-50 hover:text-red-600">
                    <Heart className="h-4 w-4" />
                    Wishlist
                  </Link>
                  <Link to="/profile?tab=settings" className="flex items-center gap-2 rounded-lg px-3 py-2 font-medium text-gray-700 hover:bg-red-50 hover:text-red-600">
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                  {user.role === 'admin' ? (
                    <Link to="/admin/dashboard" className="flex items-center gap-2 rounded-lg px-3 py-2 font-medium text-gray-700 hover:bg-red-50 hover:text-red-600">
                      <Settings className="h-4 w-4" />
                      Admin Dashboard
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false)
                      handleLogout()
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left font-medium text-red-700 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </>
              ) : (
                <div className="flex justify-center pt-2">
                  <button 
                    onClick={() => navigate('/login')}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
                    aria-label="Login or Register"
                  >
                    <User className="h-5 w-5 text-gray-700" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
      <div className="h-20" />

      <ConfirmationDialog
        isOpen={isOpen}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        title={options?.title || ''}
        message={options?.message || ''}
        confirmText={options?.confirmText}
        cancelText={options?.cancelText}
        type={options?.type}
        icon={options?.icon}
      />
    </>
  )
}


export default Navigation
