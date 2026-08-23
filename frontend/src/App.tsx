import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { useCart } from './contexts/CartContext'
import { useWishlist } from './contexts/WishlistContext'
import { AnimatePresence, motion } from 'framer-motion'

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
import CareersAdminPage from './admin/CareersAdminPage'
import GiftCardsAdminPage from './admin/GiftCardsAdminPage'
import CategoriesPage from './admin/CategoriesPage'
import AdminRecipesPage from './admin/AdminRecipesPage'
import AdminMeatGuidePage from './admin/AdminMeatGuidePage'
import AdminPhotoReviewsPage from './admin/AdminPhotoReviewsPage'
import AdminProductConfigPage from './admin/AdminProductConfigPage'
import CookieConsent from './components/CookieConsent'
import ReviewPrompt from './components/ReviewPrompt'

import BuyerDashboard from './buyer/BuyerDashboard'

import { QuickViewRoot } from './components/ecommerce/QuickViewModal'
import NewsletterExitIntentPopup from './components/ecommerce/NewsletterExitIntentPopup'
import PwaInstallPrompt from './components/ecommerce/PwaInstallPrompt'
import { useSiteContent } from './contexts/SiteContentContext'
import AntigravityScrollEffect from './components/effects/AntigravityScrollEffect'

const SiteWideModernFeatures: React.FC = () => {
  const { profile } = useSiteContent()
  return (
    <>
      <AntigravityScrollEffect />
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
import CareersPage from './pages/CareersPage'
import GiftCardsPage from './pages/GiftCardsPage'

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

const PageTransition = ({ children }: { children: JSX.Element }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.2, ease: 'easeOut' }}
  >
    {children}
  </motion.div>
)

function App() {
  const { user, loading } = useAuth()
  const cart = useCart()
  const wishlist = useWishlist()
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin')
  const authenticatedHome = user?.role === 'admin' ? '/admin/dashboard' : '/profile'

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
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={
              <PageTransition>
                <BuyerHome onAddToCart={cart.addItem} onToggleWishlist={wishlist.toggleWishlist} wishlistItems={wishlist.items} />
              </PageTransition>
            } />
          <Route path="/shop" element={<PageTransition><BuyerShop onAddToCart={cart.addItem} onToggleWishlist={wishlist.toggleWishlist} wishlistItems={wishlist.items} /></PageTransition>} />
          <Route path="/product/:id" element={<PageTransition><BuyerProductDetail onAddToCart={cart.addItem} onToggleWishlist={wishlist.toggleWishlist} wishlistItems={wishlist.items} /></PageTransition>} />
          <Route
            path="/order-tracking/:id"
            element={<PageTransition><OrderTrackerRouteWrapper /></PageTransition>}
          
          />
          
          {/* Authentication Routes */}
          <Route path="/login" element={!user ? <AuthSlider /> : <Navigate to={authenticatedHome} />} />
          <Route path="/qr-login" element={<PageTransition><QrLoginApprovePage /></PageTransition>} />
          <Route path="/register" element={!user ? <AuthSlider /> : <Navigate to={authenticatedHome} />} />
          <Route path="/forgot-password" element={!user ? <AuthSlider /> : <Navigate to={authenticatedHome} />} />
          <Route path="/reset-password" element={!user ? <AuthSlider /> : <Navigate to={authenticatedHome} />} />
          
          {/* Information Pages */}
          <Route path="/about" element={<PageTransition><DynamicContentPage pageKey="about" /></PageTransition>} />
          <Route path="/web-profile" element={<PageTransition><WebProfilePage /></PageTransition>} />
          <Route path="/contact" element={<PageTransition><ContactPage /></PageTransition>} />
          <Route path="/feedback" element={<PageTransition><FeedbackPage /></PageTransition>} />
          <Route path="/help" element={<PageTransition><HelpCenterPage /></PageTransition>} />
          <Route path="/forum" element={<PageTransition><CommunityForumPage /></PageTransition>} />
          <Route path="/forum/:slug" element={<PageTransition><CommunityForumPage /></PageTransition>} />
          <Route path="/forum/thread/:threadId" element={<PageTransition><CommunityForumPage /></PageTransition>} />
          <Route path="/app-info" element={<PageTransition><AppInfoPage /></PageTransition>} />
          <Route path="/our-companies" element={<PageTransition><CompaniesPage /></PageTransition>} />
          <Route path="/terms" element={<PageTransition><LegalPage type="terms" /></PageTransition>} />
          <Route path="/privacy" element={<PageTransition><LegalPage type="privacy" /></PageTransition>} />
          <Route path="/farms" element={<PageTransition><DynamicContentPage pageKey="farms" /></PageTransition>} />
          <Route path="/sustainability" element={<PageTransition><DynamicContentPage pageKey="sustainability" /></PageTransition>} />
          <Route path="/careers" element={<PageTransition><CareersPage /></PageTransition>} />
          <Route path="/gift-cards" element={<PageTransition><GiftCardsPage /></PageTransition>} />
          <Route path="/wellness" element={<PageTransition><DynamicContentPage pageKey="wellness" /></PageTransition>} />
          <Route path="/returns" element={<PageTransition><DynamicContentPage pageKey="returns" /></PageTransition>} />
          <Route path="/maintenance" element={<PageTransition><DynamicContentPage pageKey="maintenance" /></PageTransition>} />
          <Route path="/download-thank-you" element={<PageTransition><DynamicContentPage pageKey="downloadThankYou" /></PageTransition>} />
          <Route path="/blog" element={<PageTransition><BlogPage /></PageTransition>} />
          <Route path="/blog/:slug" element={<PageTransition><BlogPostPage /></PageTransition>} />
          
          {/* Buyer Routes (Guests can checkout; account pages protected) */}
          <Route path="/checkout" element={<PageTransition><CheckoutPage /></PageTransition>} />
          <Route path="/order-confirmation" element={<PageTransition><OrderConfirmationPage /></PageTransition>} />
          <Route path="/profile" element={<BuyerRoute><PageTransition><EnhancedProfilePage /></PageTransition></BuyerRoute>} />
          <Route path="/dashboard" element={<BuyerRoute><PageTransition><BuyerDashboard /></PageTransition></BuyerRoute>} />
          <Route path="/account" element={<BuyerRoute><Navigate to="/profile?tab=settings" replace /></BuyerRoute>} />
          <Route path="/support/tickets" element={<BuyerRoute><Navigate to="/profile?tab=tickets" replace /></BuyerRoute>} />
          <Route path="/returns/new" element={<BuyerRoute><PageTransition><NewReturnPage /></PageTransition></BuyerRoute>} />
          <Route path="/returns" element={<BuyerRoute><Navigate to="/profile?tab=returns" replace /></BuyerRoute>} />
          <Route path="/invoices" element={<BuyerRoute><Navigate to="/profile?tab=invoices" replace /></BuyerRoute>} />
          <Route path="/alerts" element={<BuyerRoute><Navigate to="/profile?tab=alerts" replace /></BuyerRoute>} />
          <Route path="/loyalty" element={<BuyerRoute><Navigate to="/profile?tab=loyalty" replace /></BuyerRoute>} />
          <Route path="/goodbye" element={<div className="mx-auto max-w-2xl px-4 py-16 text-center"><h1 className="text-2xl font-bold text-gray-900">Account closed</h1><p className="mt-3 text-gray-600">Your Hincton account has been deleted. We are sorry to see you go.</p></div>} />
          <Route path="/messages" element={<BuyerRoute><PageTransition><BuyerMessages /></PageTransition></BuyerRoute>} />
          <Route path="/reviews" element={<BuyerRoute><PageTransition><BuyerReviews /></PageTransition></BuyerRoute>} />
          <Route path="/wallet" element={<BuyerRoute><PageTransition><BuyerWallet /></PageTransition></BuyerRoute>} />
          <Route path="/subscription" element={<ProtectedRoute><PageTransition><BuyerSubscription /></PageTransition></ProtectedRoute>} />
          <Route path="/affiliate" element={<ProtectedRoute><PageTransition><AffiliateProgram /></PageTransition></ProtectedRoute>} />
          
          {/* Cart Component (Global) */}
          {/* cart needs props until BuyerCart is refactored to fetch cart itself */}
          <Route
            path="/cart"
            element={
              <PageTransition>
                <BuyerCart
                  items={cart.items}
                  reminder={cart.reminder}
                  onUpdateQuantity={cart.updateQuantity}
                  onRemoveItem={cart.removeItem}
                  onToggleWishlist={wishlist.toggleWishlist}
                  wishlistItems={wishlist.items}
                />
              </PageTransition>
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
            <Route path="careers" element={<CareersAdminPage />} />
            <Route path="gift-cards" element={<GiftCardsAdminPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="recipes" element={<AdminRecipesPage />} />
            <Route path="meat-guide" element={<AdminMeatGuidePage />} />
            <Route path="photo-reviews" element={<AdminPhotoReviewsPage />} />
            <Route path="product-config" element={<AdminProductConfigPage />} />
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
        </AnimatePresence>
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
