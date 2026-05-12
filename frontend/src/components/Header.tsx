import React, { useState, useRef, useEffect } from 'react'
import { ShoppingCart, Menu, X, Search, User, Settings, LogOut, Heart, Package, MessageSquare, Wallet, BarChart3, ChevronDown } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { formatCurrency } from '../utils/helpers'
import { useLanguage } from '../contexts/LanguageContext'
import { useConfirmationDialog } from '../hooks/useConfirmationDialog'
import ConfirmationDialog from './ui/ConfirmationDialog'


const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)
  const profileDropdownRef = useRef<HTMLDivElement>(null)
  const { user, logout } = useAuth()
  const { getTotalItems, getTotalPrice } = useCart()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const { isOpen, options, confirm, handleConfirm, handleCancel } = useConfirmationDialog()
  const profilePath = String(user?.role || '').toLowerCase() === 'admin' ? '/admin/profile' : '/profile'

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false)
      }
    }
    
    if (isProfileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isProfileDropdownOpen])

  const handleLogout = async () => {
    setIsProfileDropdownOpen(false)
    setIsMenuOpen(false)

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
      logout()
      navigate('/login', { replace: true })
      toast.success(t('toast.loggedOut'))
    } catch {
      toast.error(t('toast.failedLogout'))
    }
  }

  return (
    <>
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 overflow-visible">
      <div className="max-w-7xl mx-auto px-6 overflow-visible">
        <div className="flex justify-between items-center h-16 overflow-visible">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-black text-white flex items-center justify-center font-bold text-xl">
              PRIME
            </div>
            <span className="text-xl font-bold tracking-wide">CUTS</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className="text-sm font-medium text-gray-700 hover:text-black transition-colors"
            >
              {t('header.home')}
            </Link>
            <Link
              to="/shop"
              className="text-sm font-medium text-gray-700 hover:text-black transition-colors"
            >
              {t('header.products')}
            </Link>
            <Link
              to="/about"
              className="text-sm font-medium text-gray-700 hover:text-black transition-colors"
            >
              {t('header.about')}
            </Link>
            {user?.role === 'admin' && (
              <Link
                to="/admin"
                className="text-sm font-medium text-gray-700 hover:text-black transition-colors"
              >
                Admin
              </Link>
            )}
          </nav>

          {/* Right side items */}
          <div className="hidden md:flex items-center space-x-4 relative">
            {/* Search */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 text-gray-600 hover:text-black transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Cart */}
            <Link to="/cart" className="relative p-2 text-gray-600 hover:text-black transition-colors">
              <ShoppingCart className="w-5 h-5" />
              {getTotalItems() > 0 && (
                <span className="absolute -top-1 -right-1 bg-black text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {getTotalItems()}
                </span>
              )}
            </Link>

            {/* Profile Dropdown */}
            {user ? (
              <div className="relative" ref={profileDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center space-x-2 rounded-full p-2 transition-colors hover:bg-gray-100"
                >
                  <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <span className="hidden text-sm font-medium text-gray-900 sm:block">Hi, {user.email || 'Customer'}</span>
                </button>

                {/* Dropdown menu */}
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 rounded-2xl shadow-lg bg-white border border-gray-200 p-4 z-50 max-h-96 overflow-y-auto">
                    {/* Profile Header */}
                    <div className="flex flex-col space-y-1 mb-4">
                      <div className="font-semibold text-gray-900">Welcome, {user.email}!</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                      <div className="flex items-center gap-1 text-sm font-medium text-green-600 mt-1">
                        <div className="w-2 h-2 rounded-full bg-green-600"></div>
                        Active Account
                      </div>
                    </div>

                    {/* Separator */}
                    <div className="h-px bg-gray-100 my-3"></div>

                    {/* My Account Section */}
                    <div className="space-y-1 mb-3">
                      <div className="px-2 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        My Account
                      </div>
                      <Link
                        to="/orders"
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
                      >
                        <Package className="w-4 h-4" />
                        <span>Orders</span>
                        <ChevronDown className="w-4 h-4 ml-auto transform rotate-180" />
                      </Link>
                      <Link
                        to="/messages"
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Messages</span>
                        <ChevronDown className="w-4 h-4 ml-auto transform rotate-180" />
                      </Link>
                      <Link
                        to="/reviews"
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
                      >
                        <BarChart3 className="w-4 h-4" />
                        <span>Ratings & Reviews</span>
                        <ChevronDown className="w-4 h-4 ml-auto transform rotate-180" />
                      </Link>
                      <Link
                        to="/wallet"
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
                      >
                        <Wallet className="w-4 h-4" />
                        <span>Wallet</span>
                        <ChevronDown className="w-4 h-4 ml-auto transform rotate-180" />
                      </Link>
                      <Link
                        to="/wishlist"
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
                      >
                        <Heart className="w-4 h-4" />
                        <span>Wishlist</span>
                        <ChevronDown className="w-4 h-4 ml-auto transform rotate-180" />
                      </Link>
                    </div>

                    {/* Separator */}
                    <div className="h-px bg-gray-100 my-3"></div>

                    {/* Settings Section */}
                    <div className="space-y-1 mb-3">
                      <div className="px-2 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Settings
                      </div>
                      <Link
                        to="/account"
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        <span>{t('header.accountSettings')}</span>
                        <ChevronDown className="w-4 h-4 ml-auto transform rotate-180" />
                      </Link>
                      <Link
                        to={profilePath}
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
                      >
                        <User className="w-4 h-4" />
                        <span>{t('header.editProfile')}</span>
                        <ChevronDown className="w-4 h-4 ml-auto transform rotate-180" />
                      </Link>
                    </div>

                    {/* Separator */}
                    <div className="h-px bg-gray-100 my-3"></div>

                    {/* Logout */}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-700 hover:bg-red-50 transition-colors font-medium"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{t('header.logout')}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-white bg-black rounded hover:bg-gray-800 transition-colors"
              >
                {t('header.login')}
              </Link>
            )}</div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-gray-600 hover:text-black transition-colors"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-6 py-4 space-y-3">
            <Link
              to="/"
              className="block py-2 text-base font-medium text-gray-700 hover:text-black transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/shop"
              className="block py-2 text-base font-medium text-gray-700 hover:text-black transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Shop
            </Link>
            <Link
              to="/about"
              className="block py-2 text-base font-medium text-gray-700 hover:text-black transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </Link>
            <Link
              to="/cart"
              className="block py-2 text-base font-medium text-gray-700 hover:text-black transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('header.contact')} ({getTotalItems()}) - {formatCurrency(getTotalPrice())}
            </Link>
            {user ? (
              <>
                <Link
                  to={profilePath}
                  className="block py-2 text-base font-medium text-gray-700 hover:text-black transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Profile
                </Link>
                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="block py-2 text-base font-medium text-gray-700 hover:text-black transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Admin Dashboard
                  </Link>
                )}
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setIsSearchOpen(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <div className="inline-block align-bottom bg-white rounded-sm text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-6 pt-6 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">{t('header.searchProducts')}</h3>
                  <button
                    onClick={() => setIsSearchOpen(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <div className="mt-4">
                  <input
                    type="text"
                    placeholder={t('header.searchPlaceholder')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    autoFocus
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
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

export default Header
