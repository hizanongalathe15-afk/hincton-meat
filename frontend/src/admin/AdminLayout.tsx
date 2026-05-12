import { ReactNode, useEffect, useState, useRef } from 'react'
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  BarChart3, 
  Megaphone, 
  Bell, 
  Search, 
  ChevronDown,
  Menu,
  X,
  FileText,
  Settings,
  QrCode,
  Activity,
  ArrowRight,
  Trash2,
  Target,
  Loader,
  Clock,
  LogOut,
  User
} from 'lucide-react'
import { useAdminSearch } from '../hooks/useAdminSearch'
import { useConfirmationDialog } from '../hooks/useConfirmationDialog'
import ConfirmationDialog from '../components/ui/ConfirmationDialog'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import LanguageSelector from '../components/LanguageSelector'
import { notificationsApi } from '../services/adminApi'
import toast from 'react-hot-toast'

interface AdminLayoutProps {
  children?: ReactNode
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Array<{ id: string; title?: string; message?: string; isRead: boolean; createdAt: string }>>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const accountDropdownRef = useRef<HTMLDivElement>(null)
  const notificationsRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const { isOpen: isConfirmOpen, options: confirmOptions, confirm: showConfirm, handleConfirm, handleCancel } = useConfirmationDialog()
  const { t } = useLanguage()
  const adminEmail = user?.email || 'admin@meat.com'
  const adminName = user?.profile?.fullName || user?.name || adminEmail
  const adminAvatar = user?.avatar || user?.profile?.avatar
  const resolveAssetUrl = (url?: string) => {
    if (!url) return ''
    return url.startsWith('http') ? url : `http://localhost:5000${url}`
  }
  
  const {

    query,
    suggestions,
    results,
    history,
    isLoading,
    isOpen,
    setIsOpen,
    handleQueryChange,

    applySuggestion,
    applyHistoryItem,
    clearHistory,
    removeFromHistory,
    clearSearch
  } = useAdminSearch()

  const menuItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: t('admin.dashboard') },
    { path: '/admin/products', icon: Package, label: t('admin.products') },
    { path: '/admin/orders', icon: ShoppingCart, label: t('admin.orders') },
    { path: '/admin/users', icon: Users, label: t('admin.users') },
    { path: '/admin/analytics', icon: BarChart3, label: t('admin.analytics') },
    { path: '/admin/communications', icon: Megaphone, label: t('admin.communications') },
    { path: '/admin/ads', icon: Target, label: 'Ad Management' },
    { path: '/admin/qr-codes', icon: QrCode, label: t('admin.qrCodes') },
    { path: '/admin/content', icon: FileText, label: t('admin.content') },
    { path: '/admin/system-metrics', icon: Activity, label: 'System Metrics' },
    { path: '/admin/settings', icon: Settings, label: t('admin.settings') },
  ]

  const isActive = (path: string) => location.pathname === path

  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(event.target as Node)) {
        setAccountDropdownOpen(false)
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false)
      }
    }
    
    if (isOpen || accountDropdownOpen || notificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, accountDropdownOpen, notificationsOpen, setIsOpen])

  const refreshNotifications = async () => {
    try {
      const response = await notificationsApi.getNotifications()
      setNotifications(response.notifications || [])
      setUnreadCount(response.unreadCount || 0)
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    }
  }

  useEffect(() => {
    refreshNotifications().catch(() => undefined)
    const interval = window.setInterval(() => {
      refreshNotifications().catch(() => undefined)
    }, 30000)

    return () => window.clearInterval(interval)
  }, [])

  const markAllNotificationsRead = async () => {
    try {
      await notificationsApi.markAllAsRead()
      await refreshNotifications()
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      await notificationsApi.deleteNotification(notificationId)
      await refreshNotifications()
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  useEffect(() => {
    if (!sidebarOpen) return

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSidebarOpen(false)
      }
    }

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', closeOnEscape)

    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [sidebarOpen])

  const closeSidebar = () => setSidebarOpen(false)

  const handleLogout = async () => {
    setAccountDropdownOpen(false)

    const confirmed = await showConfirm({
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50/40 flex">
      {/* Sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-950/45 backdrop-blur-sm"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Mobile search modal */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-white">
          <div className="sticky top-0 p-4 border-b border-gray-200 bg-white">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search products, orders, users..."
                  value={query}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  autoFocus
                  className="w-full px-3 py-2 pl-10 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>

          <div className="overflow-y-auto">
            {isLoading && (
              <div className="p-4 text-center text-gray-500">
                <Loader className="w-4 h-4 inline animate-spin mr-2" />
                Searching...
              </div>
            )}

            {!isLoading && results.length > 0 && (
              <div>
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-700">
                  RESULTS ({results.length})
                </div>
                {results.map((result) => (
                  <Link
                    key={`${result.type}-${result.id}`}
                    to={
                      result.type === 'product'
                        ? `/admin/products/${result.id}`
                        : result.type === 'order'
                        ? `/admin/orders/${result.id}`
                        : `/admin/users/${result.id}`
                    }
                    onClick={() => setIsOpen(false)}
                    className="block px-4 py-3 border-b border-gray-100 hover:bg-red-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{result.title}</p>
                        {result.subtitle && (
                          <p className="text-xs text-gray-500">{result.subtitle}</p>
                        )}
                      </div>
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                        {result.type.charAt(0).toUpperCase() + result.type.slice(1)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {!isLoading && query.length >= 2 && results.length === 0 && (
              <div className="p-4 text-center text-gray-500 text-sm">
                {t('search.noResults')} "{query}"
              </div>
            )}

            {!isLoading && query.length < 2 && history.length > 0 && (
              <div>
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-700 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    {t('search.recentSearches')}
                  </span>
                  <button
                    onClick={clearHistory}
                    className="text-gray-500 hover:text-red-600 text-xs"
                  >
                    {t('common.clear')}
                  </button>
                </div>
                {history.map((item) => (
                  <div
                    key={item}
                    className="px-4 py-2 border-b border-gray-100 hover:bg-red-50 transition-colors flex items-center justify-between"
                  >
                    <button
                      onClick={() => applyHistoryItem(item)}
                      className="text-left flex-1 text-sm text-gray-700 hover:text-red-600"
                    >
                      <ArrowRight className="w-3 h-3 inline mr-2 text-gray-400" />
                      {item}
                    </button>
                    <button
                      onClick={() => removeFromHistory(item)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {!isLoading && suggestions.length > 0 && query.length >= 2 && (
              <div>
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-700">
                  SUGGESTIONS
                </div>
                {suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => applySuggestion(suggestion.text)}
                    className="block w-full text-left px-4 py-2 border-b border-gray-100 hover:bg-red-50 text-sm text-gray-700"
                  >
                    <Search className="w-3 h-3 inline mr-2 text-gray-400" />
                    {suggestion.text}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div
        id="admin-sidebar"
        className={`
        fixed inset-y-0 left-0 z-50 h-screen w-[18rem] max-w-[86vw] border-r border-white/40 bg-white/72 shadow-2xl shadow-red-950/10 backdrop-blur-2xl transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-white/60">
          <div>
            <h1 className="text-lg font-extrabold text-gray-950">Hincton Admin</h1>
            <p className="text-xs font-medium text-red-700">Operations control</p>
          </div>
          <button
            type="button"
            onClick={closeSidebar}
            className="grid size-10 place-items-center rounded-lg text-gray-500 hover:bg-white/80 hover:text-gray-700"
            aria-label="Close admin menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="mt-6 px-3 pb-24">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`
                      flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors
                      ${isActive(item.path)
                        ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                        : 'text-gray-700 hover:bg-white/80 hover:text-gray-950'
                      }
                    `}
                    onClick={closeSidebar}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/60">
          <Link
            to="/"
            className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-white/80 hover:text-gray-950"
            onClick={closeSidebar}
          >
            <LogOut className="w-5 h-5 mr-3" />
            Back to Shop
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-white/60 bg-white/80 shadow-sm backdrop-blur-xl">
          <div className="flex items-center justify-between h-16 px-4 gap-4">
            <button
              type="button"
              onClick={() => setSidebarOpen((open) => !open)}
              className="grid size-10 place-items-center rounded-lg text-gray-500 hover:bg-white/80 hover:text-gray-700"
              aria-label={sidebarOpen ? 'Close admin menu' : 'Open admin menu'}
              aria-expanded={sidebarOpen}
              aria-controls="admin-sidebar"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            <Link to="/admin/dashboard" className="text-lg font-semibold text-gray-900 hover:text-red-700 whitespace-nowrap">
              Admin Dashboard
            </Link>
            
            {/* Search bar */}
            <div className="hidden md:flex items-center flex-1 max-w-md" ref={searchRef}>
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Search products, orders, users..."
                  value={query}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  onFocus={() => setIsOpen(true)}
                  className="w-full px-3 py-2 pl-10 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                {query && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                {/* Search dropdown */}
                {isOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                    {isLoading && (
                      <div className="p-4 text-center text-gray-500">
                        <Loader className="w-4 h-4 inline animate-spin mr-2" />
                        Searching...
                      </div>
                    )}

                    {!isLoading && results.length > 0 && (
                      <div>
                        <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-700">
                          RESULTS ({results.length})
                        </div>
                        {results.map((result) => (
                          <Link
                            key={`${result.type}-${result.id}`}
                            to={
                              result.type === 'product'
                                ? `/admin/products/${result.id}`
                                : result.type === 'order'
                                ? `/admin/orders/${result.id}`
                                : `/admin/users/${result.id}`
                            }
                            onClick={() => setIsOpen(false)}
                            className="block px-4 py-3 border-b border-gray-100 hover:bg-red-50 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-gray-900">{result.title}</p>
                                {result.subtitle && (
                                  <p className="text-xs text-gray-500">{result.subtitle}</p>
                                )}
                              </div>
                              <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                                {result.type.charAt(0).toUpperCase() + result.type.slice(1)}
                              </span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}

                    {!isLoading && query.length >= 2 && results.length === 0 && (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        No results found for "{query}"
                      </div>
                    )}

                    {!isLoading && query.length < 2 && history.length > 0 && (
                      <div>
                        <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-700 flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            RECENT SEARCHES
                          </span>
                          <button
                            onClick={clearHistory}
                            className="text-gray-500 hover:text-red-600 text-xs"
                          >
                            Clear
                          </button>
                        </div>
                        {history.map((item) => (
                          <div
                            key={item}
                            className="px-4 py-2 border-b border-gray-100 hover:bg-red-50 transition-colors flex items-center justify-between"
                          >
                            <button
                              onClick={() => applyHistoryItem(item)}
                              className="text-left flex-1 text-sm text-gray-700 hover:text-red-600"
                            >
                              <ArrowRight className="w-3 h-3 inline mr-2 text-gray-400" />
                              {item}
                            </button>
                            <button
                              onClick={() => removeFromHistory(item)}
                              className="text-gray-400 hover:text-red-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {!isLoading && suggestions.length > 0 && query.length >= 2 && (
                      <div>
                        <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-700">
                          SUGGESTIONS
                        </div>
                        {suggestions.map((suggestion, idx) => (
                          <button
                            key={idx}
                            onClick={() => applySuggestion(suggestion.text)}
                            className="block w-full text-left px-4 py-2 border-b border-gray-100 hover:bg-red-50 text-sm text-gray-700"
                          >
                            <Search className="w-3 h-3 inline mr-2 text-gray-400" />
                            {suggestion.text}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Mobile search button */}
            <button
              onClick={() => setIsOpen(true)}
              className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-white/80 hover:text-gray-700"
              aria-label="Open search"
            >
              <Search className="w-5 h-5" />
            </button>

            <div className="relative" ref={notificationsRef}>
              <button
                type="button"
                onClick={() => {
                  setNotificationsOpen((open) => !open)
                  setAccountDropdownOpen(false)
                }}
                className="relative grid size-10 place-items-center rounded-lg text-gray-500 hover:bg-white/80 hover:text-gray-700"
                aria-label="Admin notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 z-50 mt-2 w-80 rounded-2xl border border-gray-200 bg-white p-3 shadow-lg">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="font-semibold text-gray-900">Notifications</p>
                    <button onClick={markAllNotificationsRead} className="text-xs font-semibold text-red-700 hover:text-red-800">Mark all read</button>
                  </div>
                  <div className="max-h-80 space-y-2 overflow-y-auto">
                    {notifications.length > 0 ? notifications.slice(0, 8).map((notification) => (
                      <div key={notification.id} className={`rounded-lg p-3 ${notification.isRead ? 'bg-white' : 'bg-red-50'}`}>
                        <div className="flex items-start justify-between gap-2">
                          <button
                            type="button"
                            onClick={async () => {
                              await notificationsApi.markAsRead(notification.id)
                              setNotificationsOpen(false)
                              navigate('/admin/communications')
                              await refreshNotifications()
                            }}
                            className="min-w-0 text-left"
                          >
                            <p className="truncate text-sm font-semibold text-gray-900">{notification.title || 'Notification'}</p>
                            <p className="mt-1 line-clamp-2 text-xs text-gray-600">{notification.message}</p>
                          </button>
                          <button onClick={() => deleteNotification(notification.id)} className="rounded p-1 text-gray-400 hover:bg-white hover:text-red-700" aria-label="Delete notification">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )) : (
                      <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">No notifications yet.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <LanguageSelector />

            {/* Account dropdown */}
            <div className="relative" ref={accountDropdownRef}>
              <button
                type="button"
                onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
                className="flex items-center space-x-2 rounded-full p-2 transition-colors hover:bg-gray-100"
              >
                <div className="w-8 h-8 overflow-hidden rounded-full bg-red-600 flex items-center justify-center flex-shrink-0">
                  {adminAvatar ? (
                    <img src={resolveAssetUrl(adminAvatar)} alt={adminName} className="h-full w-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-white" />
                  )}
                </div>
                <span className="hidden text-sm font-medium text-gray-900 sm:block">Hi, {adminName}</span>
              </button>

              {/* Dropdown menu */}
              {accountDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl shadow-lg bg-white border border-gray-200 p-4 z-50 max-h-96 overflow-y-auto">
                  {/* Admin Profile Header */}
                  <div className="flex flex-col space-y-1 mb-4">
                    <div className="font-semibold text-gray-900">Welcome, {adminName}!</div>
                    <div className="text-xs text-gray-500">{adminEmail}</div>
                    <div className="flex items-center gap-1 text-sm font-medium text-green-600 mt-1">
                      <div className="w-2 h-2 rounded-full bg-green-600"></div>
                      Admin Account
                    </div>
                  </div>

                  {/* Separator */}
                  <div className="h-px bg-gray-100 my-3"></div>

                  {/* Admin Tools Section */}
                  <div className="space-y-1 mb-3">
                    <div className="px-2 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Admin Tools
                    </div>
                    <Link
                      to="/admin/dashboard"
                      onClick={() => setAccountDropdownOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      <span>Dashboard</span>
                      <ChevronDown className="w-4 h-4 ml-auto transform rotate-180" />
                    </Link>
                    <Link
                      to="/admin/products"
                      onClick={() => setAccountDropdownOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
                    >
                      <Package className="w-4 h-4" />
                      <span>Products</span>
                      <ChevronDown className="w-4 h-4 ml-auto transform rotate-180" />
                    </Link>
                    <Link
                      to="/admin/orders"
                      onClick={() => setAccountDropdownOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>Orders</span>
                      <ChevronDown className="w-4 h-4 ml-auto transform rotate-180" />
                    </Link>
                    <Link
                      to="/admin/users"
                      onClick={() => setAccountDropdownOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
                    >
                      <Users className="w-4 h-4" />
                      <span>Manage Users</span>
                      <ChevronDown className="w-4 h-4 ml-auto transform rotate-180" />
                    </Link>
                    <Link
                      to="/admin/analytics"
                      onClick={() => setAccountDropdownOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
                    >
                      <BarChart3 className="w-4 h-4" />
                      <span>Analytics</span>
                      <ChevronDown className="w-4 h-4 ml-auto transform rotate-180" />
                    </Link>
                    <Link
                      to="/admin/communications"
                      onClick={() => setAccountDropdownOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
                    >
                      <Megaphone className="w-4 h-4" />
                      <span>Communications</span>
                      <ChevronDown className="w-4 h-4 ml-auto transform rotate-180" />
                    </Link>
                    <Link
                      to="/admin/qr-codes"
                      onClick={() => setAccountDropdownOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>QR Codes</span>
                      <ChevronDown className="w-4 h-4 ml-auto transform rotate-180" />
                    </Link>
                    <Link
                      to="/admin/content"
                      onClick={() => setAccountDropdownOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Content</span>
                      <ChevronDown className="w-4 h-4 ml-auto transform rotate-180" />
                    </Link>
                  </div>

                  {/* Separator */}
                  <div className="h-px bg-gray-100 my-3"></div>

                  {/* Settings Section */}
                  <div className="space-y-1 mb-3">
                    <div className="px-2 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Operations & Settings
                    </div>
                    <Link
                      to="/admin/delivery"
                      onClick={() => setAccountDropdownOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
                    >
                      <Package className="w-4 h-4" />
                      <span>Delivery</span>
                      <ChevronDown className="w-4 h-4 ml-auto transform rotate-180" />
                    </Link>
                    <Link
                      to="/admin/inventory"
                      onClick={() => setAccountDropdownOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
                    >
                      <Package className="w-4 h-4" />
                      <span>Inventory</span>
                      <ChevronDown className="w-4 h-4 ml-auto transform rotate-180" />
                    </Link>
                    <Link
                      to="/admin/settings"
                      onClick={() => setAccountDropdownOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Admin Settings</span>
                      <ChevronDown className="w-4 h-4 ml-auto transform rotate-180" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setAccountDropdownOpen(false)
                        navigate('/admin/profile')
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      <span>Edit Profile</span>
                      <ChevronDown className="w-4 h-4 ml-auto transform rotate-180" />
                    </button>
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
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-3 sm:p-5 lg:p-6">
          {children || <Outlet />}
        </main>
      </div>
    </div>
    <ConfirmationDialog
      isOpen={isConfirmOpen}
      onClose={handleCancel}
      onConfirm={handleConfirm}
      title={confirmOptions?.title || ''}
      message={confirmOptions?.message || ''}
      confirmText={confirmOptions?.confirmText}
      cancelText={confirmOptions?.cancelText}
      type={confirmOptions?.type}
      icon={confirmOptions?.icon}
    />
    </>
  )
}

export default AdminLayout
