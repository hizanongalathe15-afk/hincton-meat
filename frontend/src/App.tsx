import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { useCart } from './contexts/CartContext'
import { useWishlist } from './contexts/WishlistContext'

// Layout Components
import Navigation from './components/Navigation'
import Footer from './components/Footer'

// Buyer Components
import BuyerHome from './buyer/BuyerHome'
import BuyerShop from './buyer/BuyerShop'
import BuyerProductDetail from './buyer/BuyerProductDetail'
import BuyerCart from './buyer/BuyerCart'
import OrderTrackerRouteWrapper from './OrderTrackerRouteWrapper'

import BuyerSubscription from './buyer/BuyerSubscription'
import AffiliateProgram from './buyer/AffiliateProgram'

// Admin Components
import AdminLayout from './admin/AdminLayout'
import AdminDashboard from './admin/Dashboard'
import AdminProfilePage from './admin/AdminProfilePage'
import ProductsPage from './admin/ProductsPage'
import OrdersPage from './admin/OrdersPage'
import UsersPage from './admin/UsersPage'
import AnalyticsPage from './admin/AnalyticsPage'
import DeliveryPage from './admin/DeliveryPage'
import InventoryPage from './admin/InventoryPage'
import SettingsPage from './admin/SettingsPage'
import CommunicationsPage from './admin/CommunicationsPage'
import ContentPage from './admin/ContentPage'
import QRCodeManager from './admin/QRCodeManager'
import SystemMetrics from './admin/SystemMetrics'
import AdManagement from './admin/AdManagement'
import AdminReviewsPage from './admin/ReviewsPage'
import AdminCompaniesPage from './admin/CompaniesPage'
import ThemePage from './admin/ThemePage'
import SocialOffersPage from './admin/SocialOffersPage'
import DealsPage from './admin/DealsPage'
import AdminSupportPage from './admin/AdminSupportPage'
import AdminFaqsPage from './admin/AdminFaqsPage'
import AdminKnowledgeBasePage from './admin/AdminKnowledgeBasePage'
import SupportAnalyticsPage from './admin/SupportAnalyticsPage'
import CookieConsent from './components/CookieConsent'
import ReviewPrompt from './components/ReviewPrompt'

import BuyerDashboard from './buyer/BuyerDashboard'

import { QuickViewRoot } from './components/ecommerce/QuickViewModal'
import NewsletterExitIntentPopup from './components/ecommerce/NewsletterExitIntentPopup'
import PwaInstallPrompt from './components/ecommerce/PwaInstallPrompt'
import { useSiteContent } from './contexts/SiteContentContext'

const SiteWideModernFeatures: React.FC = () => {
  const { profile } = useSiteContent()
  return (
    <>
      <QuickViewRoot />
      {profile.featureToggles?.newsletterExitIntent !== false && <NewsletterExitIntentPopup />}
      {profile.featureToggles?.pwaInstallPrompt !== false && <PwaInstallPrompt />}
    </>
  )
}

// Legacy Page Components (keeping for compatibility)
import HomePage from './pages/HomePage'
import ShopPage from './pages/ShopPage'
import ProductDetailPage from './pages/ProductDetailPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import OrderConfirmationPage from './pages/OrderConfirmationPage'
import OrderTrackingPage from './pages/OrderTrackingPage'
import EnhancedProfilePage from './pages/EnhancedProfilePage'
import BuyerMessages from './pages/BuyerMessages'
import BuyerReviews from './pages/BuyerReviews'
import BuyerWallet from './pages/BuyerWallet'
import WebProfilePage from './pages/WebProfilePage'
import ContactPage from './pages/ContactPage'
import FeedbackPage from './pages/FeedbackPage'
import HelpCenterPage from './pages/HelpCenterPage'
import AppInfoPage from './pages/AppInfoPage'
import LegalPage from './pages/LegalPage'
import DynamicContentPage from './pages/DynamicContentPage'
import BlogPage from './pages/BlogPage'
import BlogPostPage from './pages/BlogPostPage'
import CompaniesPage from './pages/CompaniesPage'
import CommunityForumPage from './pages/CommunityForumPage'
import QrLoginApprovePage from './pages/QrLoginApprovePage'
import NewReturnPage from './pages/NewReturnPage'

// Components
import AuthSlider from './components/AuthSlider'
import LoadingSpinner from './components/ui/LoadingSpinner'
import LiveChatWidget from './buyer/LiveChatWidget'
import VisitTracker from './components/VisitTracker'
import PermissionCenter from './components/PermissionCenter'
import AccessibilityWidget from './components/AccessibilityWidget'
import WhatsAppWidget from './components/WhatsAppWidget'

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? children : <Navigate to="/login" replace />
}

const AdminRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth()
  const isAdmin = String(user?.role || '').toLowerCase() === 'admin'

  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return isAdmin ? children : <Navigate to="/profile" replace />
}

const BuyerRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth()
  const isAdmin = String(user?.role || '').toLowerCase() === 'admin'

  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return isAdmin ? <Navigate to="/admin/profile" replace /> : children
}

function App() {
  const { user, loading } = useAuth()
  const cart = useCart()
  const wishlist = useWishlist()
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin')
  const authenticatedHome = user?.role === 'admin' ? '/admin/dashboard' : '/profile'
  const isAdmin = String(user?.role || '').toLowerCase() === 'admin'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <VisitTracker />
      <SiteWideModernFeatures />
      {!isAdminRoute && <Navigation />}
      <main className="flex-1">
        <Routes>
          {/* Public/Buyer Routes */}
          <Route
            path="/"
            element={
              user
                ? <Navigate to={isAdmin ? '/admin/dashboard' : '/profile'} replace />
                : <BuyerHome onAddToCart={cart.addItem} onToggleWishlist={wishlist.toggleWishlist} wishlistItems={wishlist.items} />
            }
          />
          <Route path="/shop" element={<BuyerShop onAddToCart={cart.addItem} onToggleWishlist={wishlist.toggleWishlist} wishlistItems={wishlist.items} />} />
          <Route path="/product/:id" element={<BuyerProductDetail onAddToCart={cart.addItem} onToggleWishlist={wishlist.toggleWishlist} wishlistItems={wishlist.items} />} />
          <Route
            path="/order-tracking/:id"
            element={<OrderTrackerRouteWrapper />}

          />
          
          {/* Authentication Routes */}
          <Route path="/login" element={!user ? <AuthSlider /> : <Navigate to={authenticatedHome} />} />
          <Route path="/qr-login" element={<QrLoginApprovePage />} />
          <Route path="/register" element={!user ? <AuthSlider /> : <Navigate to={authenticatedHome} />} />
          <Route path="/forgot-password" element={!user ? <AuthSlider /> : <Navigate to={authenticatedHome} />} />
          <Route path="/reset-password" element={!user ? <AuthSlider /> : <Navigate to={authenticatedHome} />} />
          
          {/* Information Pages */}
          <Route path="/about" element={<DynamicContentPage pageKey="about" />} />
          <Route path="/web-profile" element={<WebProfilePage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/feedback" element={<FeedbackPage />} />
          <Route path="/help" element={<HelpCenterPage />} />
          <Route path="/forum" element={<CommunityForumPage />} />
          <Route path="/forum/:slug" element={<CommunityForumPage />} />
          <Route path="/forum/thread/:threadId" element={<CommunityForumPage />} />
          <Route path="/app-info" element={<AppInfoPage />} />
          <Route path="/our-companies" element={<CompaniesPage />} />
          <Route path="/terms" element={<LegalPage type="terms" />} />
          <Route path="/privacy" element={<LegalPage type="privacy" />} />
          <Route path="/farms" element={<DynamicContentPage pageKey="farms" />} />
          <Route path="/sustainability" element={<DynamicContentPage pageKey="sustainability" />} />
          <Route path="/careers" element={<DynamicContentPage pageKey="careers" />} />
          <Route path="/wellness" element={<DynamicContentPage pageKey="wellness" />} />
          <Route path="/returns" element={<DynamicContentPage pageKey="returns" />} />
          <Route path="/maintenance" element={<DynamicContentPage pageKey="maintenance" />} />
          <Route path="/download-thank-you" element={<DynamicContentPage pageKey="downloadThankYou" />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          
          {/* Protected Buyer Routes */}
          <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
          <Route path="/order-confirmation" element={<ProtectedRoute><OrderConfirmationPage /></ProtectedRoute>} />
          <Route path="/profile" element={<BuyerRoute><EnhancedProfilePage /></BuyerRoute>} />
          <Route path="/dashboard" element={<BuyerRoute><BuyerDashboard /></BuyerRoute>} />
          <Route path="/account" element={<BuyerRoute><Navigate to="/profile?tab=settings" replace /></BuyerRoute>} />
          <Route path="/support/tickets" element={<BuyerRoute><Navigate to="/profile?tab=tickets" replace /></BuyerRoute>} />
          <Route path="/returns/new" element={<BuyerRoute><NewReturnPage /></BuyerRoute>} />
          <Route path="/returns" element={<BuyerRoute><Navigate to="/profile?tab=returns" replace /></BuyerRoute>} />
          <Route path="/invoices" element={<BuyerRoute><Navigate to="/profile?tab=invoices" replace /></BuyerRoute>} />
          <Route path="/alerts" element={<BuyerRoute><Navigate to="/profile?tab=alerts" replace /></BuyerRoute>} />
          <Route path="/loyalty" element={<BuyerRoute><Navigate to="/profile?tab=loyalty" replace /></BuyerRoute>} />
          <Route path="/goodbye" element={<div className="mx-auto max-w-2xl px-4 py-16 text-center"><h1 className="text-2xl font-bold text-gray-900">Account closed</h1><p className="mt-3 text-gray-600">Your Hincton account has been deleted. We are sorry to see you go.</p></div>} />
          <Route path="/messages" element={<BuyerRoute><BuyerMessages /></BuyerRoute>} />
          <Route path="/reviews" element={<BuyerRoute><BuyerReviews /></BuyerRoute>} />
          <Route path="/wallet" element={<BuyerRoute><BuyerWallet /></BuyerRoute>} />
          <Route path="/subscription" element={<ProtectedRoute><BuyerSubscription /></ProtectedRoute>} />
          <Route path="/affiliate" element={<ProtectedRoute><AffiliateProgram /></ProtectedRoute>} />
          
          {/* Cart Component (Global) */}
          {/* cart needs props until BuyerCart is refactored to fetch cart itself */}
          <Route
            path="/cart"
            element={
              <BuyerCart
                items={cart.items}
                reminder={cart.reminder}
                onUpdateQuantity={cart.updateQuantity}
                onRemoveItem={cart.removeItem}
                onToggleWishlist={wishlist.toggleWishlist}
                wishlistItems={wishlist.items}
              />
            }
          />
          
          {/* Admin Routes */}
          <Route
            path="/admin"
            element={<AdminRoute><AdminLayout /></AdminRoute>}
          >
            <Route index element={<AdminDashboard />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="profile" element={<AdminProfilePage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="reviews" element={<AdminReviewsPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="delivery" element={<DeliveryPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="theme" element={<ThemePage />} />
            <Route path="social-offers" element={<SocialOffersPage />} />
            <Route path="communications" element={<CommunicationsPage />} />
            <Route path="qr-codes" element={<QRCodeManager />} />
            <Route path="content" element={<ContentPage />} />
            <Route path="support" element={<AdminSupportPage />} />
            <Route path="support-analytics" element={<SupportAnalyticsPage />} />
            <Route path="faqs" element={<AdminFaqsPage />} />
            <Route path="knowledge-base" element={<AdminKnowledgeBasePage />} />
            <Route path="companies" element={<AdminCompaniesPage />} />
            <Route path="system-metrics" element={<SystemMetrics />} />
            <Route path="ads" element={<AdManagement />} />
            <Route path="deals" element={<DealsPage />} />
          </Route>
          
          {/* Legacy Routes (for backward compatibility) */}
          <Route path="/legacy/home" element={<HomePage />} />
          <Route path="/legacy/shop" element={<ShopPage />} />
          <Route path="/legacy/product/:id" element={<ProductDetailPage />} />
          <Route path="/legacy/cart" element={<CartPage />} />
          <Route path="/legacy/order-tracking/:id" element={<OrderTrackingPage />} />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      {!isAdminRoute && <Footer />}
      {!isAdminRoute && <LiveChatWidget />}
      {!isAdminRoute && <ReviewPrompt />}
      {!isAdminRoute && <PermissionCenter />}
      <CookieConsent />
      <AccessibilityWidget />
      {!isAdminRoute && <WhatsAppWidget />}
    </div>
  )
}

export default App
