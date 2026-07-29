import { FormEvent, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ChevronDown, Download, Heart, History, LogOut, Menu, MessageSquare, Package, Search, Settings, Shield, ShoppingCart, Star, User, Wallet, X } from 'lucide-react'
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
import VoiceSearchButton from './ecommerce/VoiceSearchButton'
import AppDownloadModal from './ecommerce/AppDownloadModal'

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
  const [desktopSearchTerm, setDesktopSearchTerm] = useState('')
  const [mobileSearchTerm, setMobileSearchTerm] = useState('')
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('hincton:recent-searches') || '[]').slice(0, 6) } catch { return [] }
  })
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)
  const [isAppDownloadOpen, setIsAppDownloadOpen] = useState(false)
  const profileDropdownRef = useRef<HTMLDivElement>(null)
  const isAdmin = String(user?.role || '').toLowerCase() === 'admin'
  const homePath = user ? (isAdmin ? '/admin/dashboard' : '/profile') : '/'
  const API_HOST = getApiHost()

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>, searchTerm: string) => {
    event.preventDefault()
    submitProductSearch(searchTerm)
  }

  const submitProductSearch = (searchTerm: string) => {
    setIsMobileMenuOpen(false)
    const query = searchTerm.trim()
    if (query.length === 0) {
      navigate('/shop')
      return
    }
    const next = [query, ...recentSearches.filter((item) => item.toLowerCase() !== query.toLowerCase())].slice(0, 6)
    setRecentSearches(next)
    localStorage.setItem('hincton:recent-searches', JSON.stringify(next))
    const params = new URLSearchParams(location.search)
    params.delete('q')
    params.set('navSearch', query)
    navigate(`/shop?${params.toString()}`)
  }

  const clearProductSearch = (setTerm: (value: string) => void) => {
    setTerm('')
    if (location.pathname === '/shop') {
      const params = new URLSearchParams(location.search)
      params.delete('navSearch')
      navigate(`/shop${params.toString() ? `?${params.toString()}` : ''}`)
    }
  }

  const clearRecentSearches = () => {
    setRecentSearches([])
    localStorage.removeItem('hincton:recent-searches')
  }

  const removeRecentSearch = (search: string) => {
    const next = recentSearches.filter((item) => item !== search)
    setRecentSearches(next)
    if (next.length) localStorage.setItem('hincton:recent-searches', JSON.stringify(next))
    else localStorage.removeItem('hincton:recent-searches')
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
    { to: '/our-companies', label: 'Our network' },
  ]


  return (
    <>
      <nav className="fixed top-0 z-50 w-full border-b border-white/70 bg-white/80 shadow-[0_10px_35px_rgba(49,31,25,.08)] backdrop-blur-xl">
        <div className="mx-auto max-w-[100rem] px-4 sm:px-6 lg:px-8">
          <div className="flex h-[4.35rem] items-center justify-between md:h-[5.15rem]">
            {/* Brand/Logo Section */}
            <Link to={homePath} className="group flex flex-shrink-0 items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-white p-1 shadow-md shadow-stone-900/10 ring-1 ring-stone-100 transition group-hover:-rotate-3 sm:h-12 sm:w-12">
                <img src={profile.images.logo || profile.brand.logo} alt={profile.brand.name} className="h-full w-full object-contain" />
              </span>
              <span className="max-w-[10rem] truncate text-sm font-extrabold uppercase tracking-[.04em] text-gray-900 sm:text-base lg:max-w-none lg:whitespace-nowrap">
                {profile.brand.name}
              </span>
            </Link>

            {/* Navigation Links Section */}
            <div className="mx-8 hidden flex-1 items-center justify-center gap-1 rounded-full border border-stone-100 bg-stone-50/70 p-1.5 2xl:flex">
              {navLinks.map((link) => (
                <Link key={link.label} to={link.to} className={`rounded-full px-4 py-2 text-sm font-semibold transition whitespace-nowrap ${location.pathname === link.to ? 'bg-white text-red-700 shadow-sm ring-1 ring-stone-100' : 'text-gray-600 hover:bg-white/70 hover:text-red-600'}`}>
                  {link.label}
                </Link>
              ))}

              {user?.role === 'admin' ? (
                <Link to="/admin/dashboard" className="ml-1 flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-gray-600 transition hover:bg-white hover:text-red-600">
                  <Shield className="h-4 w-4" />
                  {t('nav.admin')}
                </Link>
              ) : null}
            </div>

            {/* Right Side Actions Section */}
            <div className="hidden flex-shrink-0 items-center gap-2 2xl:flex">
              {!isAdmin && (
                <form onSubmit={(event) => handleSearchSubmit(event, desktopSearchTerm)} className="group relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    value={desktopSearchTerm}
                    onChange={(event) => setDesktopSearchTerm(event.target.value)}
                    placeholder={t('shop.searchForMeats') || 'Search meat products'}
                    className="w-40 rounded-full border border-stone-200 bg-white/80 py-2 pl-10 pr-10 text-sm text-gray-900 placeholder-gray-400 shadow-inner outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100 lg:w-52"
                    aria-label="Search products"
                  />
                  {desktopSearchTerm ? <button type="button" onClick={() => clearProductSearch(setDesktopSearchTerm)} className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-red-700" aria-label="Clear search"><X className="h-4 w-4" /></button> : <VoiceSearchButton onResult={(query) => { setDesktopSearchTerm(query); submitProductSearch(query) }} />}
                  {recentSearches.length > 0 && desktopSearchTerm.length === 0 ? <div className="absolute right-0 top-[calc(100%+.55rem)] hidden w-64 rounded-2xl border border-stone-100 bg-white p-3 shadow-xl group-focus-within:block"><div className="mb-2 flex items-center justify-between px-1"><span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-stone-500"><History className="h-3.5 w-3.5" /> Recent</span><button type="button" onClick={clearRecentSearches} className="text-xs font-bold text-red-700 hover:text-red-900">Clear all</button></div>{recentSearches.map((item) => <div key={item} className="group/recent flex items-center rounded-xl hover:bg-stone-50"><button type="button" onClick={() => { setDesktopSearchTerm(item); navigate(`/shop?navSearch=${encodeURIComponent(item)}`) }} className="min-w-0 flex-1 truncate px-2 py-2 text-left text-sm text-stone-700">{item}</button><button type="button" onClick={() => removeRecentSearch(item)} className="mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-stone-400 hover:bg-white hover:text-red-700" aria-label={`Remove ${item} from recent searches`}><X className="h-4 w-4" /></button></div>)}</div> : null}
                </form>
              )}

              <button type="button" onClick={() => setIsAppDownloadOpen(true)} className="flex items-center gap-2 rounded-full border border-red-100 bg-red-50 px-3 py-2 text-sm font-bold text-red-700 transition hover:-translate-y-0.5 hover:bg-red-100" aria-label="Open app download options">
                <Download className="h-4 w-4" /> <span className="hidden xl:inline">Get the app</span>
              </button>

              <LanguageSelector />
              {user && !isAdmin ? <Notifications /> : null}

              {user ? (
                <div className="relative" ref={profileDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsProfileDropdownOpen((open) => !open)}
                    className="flex items-center gap-2 rounded-full border border-transparent p-1.5 transition hover:border-stone-100 hover:bg-white hover:shadow-sm"
                  >
                    <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-red-100 to-amber-100 text-sm font-bold text-red-800 ring-2 ring-white">
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
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 text-gray-700 transition hover:-translate-y-0.5 hover:bg-red-50 hover:text-red-700"
                    aria-label={t('auth.login')}
                  >
                    <User className="h-5 w-5 text-gray-700" />
                  </button>
                </div>
              )}

              <Link
                to="/cart"
                className="relative flex items-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-red-600/25 transition hover:-translate-y-0.5 hover:bg-red-700"
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
              className="rounded-2xl border border-stone-100 bg-white p-2.5 text-gray-700 shadow-sm transition hover:bg-red-50 hover:text-red-700 2xl:hidden"
              aria-label="Toggle navigation"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="border-t border-stone-100 bg-white/95 px-3 pb-4 pt-3 shadow-xl backdrop-blur-xl 2xl:hidden">
            <div className="mx-auto max-w-[100rem] space-y-2 rounded-3xl bg-stone-50/80 p-3">
              {!isAdmin && <form onSubmit={(event) => handleSearchSubmit(event, mobileSearchTerm)} className="relative mb-3">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={mobileSearchTerm}
                  onChange={(event) => setMobileSearchTerm(event.target.value)}
                  placeholder={t('shop.searchForMeats') || 'Search meat products'}
                  className="w-full rounded-2xl border border-stone-200 bg-white py-3 pl-11 pr-10 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  aria-label="Search products"
                />
                {mobileSearchTerm ? <button type="button" onClick={() => clearProductSearch(setMobileSearchTerm)} className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-red-700" aria-label="Clear search"><X className="h-4 w-4" /></button> : <VoiceSearchButton onResult={(query) => { setMobileSearchTerm(query); submitProductSearch(query) }} />}
              </form>}
              {navLinks.map((link) => (
                <Link key={link.label} to={link.to} className={`block rounded-2xl px-4 py-3 font-semibold transition ${location.pathname === link.to ? 'bg-white text-red-700 shadow-sm' : 'text-gray-700 hover:bg-red-50 hover:text-red-600'}`}>
                  {link.label}
                </Link>
              ))}
              <button type="button" onClick={() => { setIsMobileMenuOpen(false); setIsAppDownloadOpen(true) }} className="flex w-full items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 font-bold text-red-700">
                <Download className="h-4 w-4" /> Get the app <span className="ml-auto text-xs">Scan & install</span>
              </button>
              <Link to="/cart" className="flex items-center justify-between rounded-2xl bg-red-600 px-4 py-3 font-bold text-white shadow-lg shadow-red-600/20">
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
      <div className="h-[4.35rem] md:h-[5.15rem]" />

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
      <AppDownloadModal open={isAppDownloadOpen} onClose={() => setIsAppDownloadOpen(false)} />
    </>
  )
}


export default Navigation
