import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Camera, User, Mail, Phone, ShoppingBag, Heart, Package, Settings, MapPin, Eye, EyeOff, Save, Trash2, Plus, Bell, CreditCard, ShieldCheck, Monitor, LogOut, Clock, Link2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { ordersApi, productsApi, userApi, wishlistApi } from '../services/buyerApi';
import { locationService, ProfileUpdateData } from '../services/locationService';
import { useConfirmationDialog } from '../hooks/useConfirmationDialog';
import ConfirmationDialog from '../components/ui/ConfirmationDialog';
import { getApiHost } from '../services/api';
import { formatPrice } from '../utils/currency';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  avatar?: string;
  isVerified: boolean;
  createdAt: string;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  profileImages?: string[];
  favoriteDiets?: string[];
  orders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    totalAmount: number;
    createdAt: string;
    items?: Array<{
      id: string;
      name: string;
      quantity: number;
      price: number;
      image?: string;
    }>;
  }>;
  wishlist: Array<{
    id: string;
    product: {
      id: string;
      name: string;
      price: number;
      images: string[];
    };
  }>;
  addresses?: Array<{
    id: string;
    street: string;
    city: string;
    postalCode: string;
    country: string;
    isDefault: boolean;
  }>;
  paymentMethods?: Array<{
    id: string;
    type: string;
    last4: string;
    expiryMonth: string;
    expiryYear: string;
    isDefault: boolean;
  }>;
  notifications?: {
    email: boolean;
    sms: boolean;
    push: boolean;
    orderUpdates: boolean;
    promotions: boolean;
    newsletter: boolean;
  };
  sessions?: Array<{
    id: string;
    deviceName: string;
    deviceType: string;
    ipAddress?: string;
    userAgent?: string;
    createdAt: string;
    lastActivity: string;
    expiresAt: string;
    isRevoked: boolean;
    isCurrent: boolean;
  }>;
  recentlyViewed?: Array<{
    id: string;
    name: string;
    price: number;
    images: string[];
    viewedAt?: string;
  }>;
  linkedAccounts?: Array<{
    id: string;
    provider: string;
    providerAccountId: string;
    createdAt: string;
    updatedAt: string;
  }>;
  linkedAccountProviders?: Array<{
    provider: string;
    label: string;
    configured: boolean;
    connected: boolean;
    connectUrl: string | null;
  }>;
}

const EnhancedProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, updateAvatar, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'orders' | 'wishlist' | 'recentlyViewed' | 'settings' | 'addresses' | 'payments' | 'notifications' | 'security'>('orders');
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { isOpen, options, confirm, handleConfirm, handleCancel } = useConfirmationDialog();
  const API_HOST = getApiHost()

  // Address management state
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    street: '',
    city: '',
    postalCode: '',
    country: '',
    isDefault: false
  });

  // Payment method state
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [newPayment, setNewPayment] = useState({
    type: 'mpesa',
    phoneNumber: '',
    accountName: '',
    isDefault: false
  });
  const [closeAccountForm, setCloseAccountForm] = useState({
    identifier: '',
    agreed: false,
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        const [profileResponse, ordersResponse, wishlistResponse, recentlyViewedResponse, addressesResponse, paymentsResponse, sessionsResponse, linkedAccountsResponse] = await Promise.all([
          userApi.getProfile(),
          ordersApi.getMyOrders().catch(() => ({ orders: [] })),
          wishlistApi.getWishlist().catch(() => ({ wishlist: { items: [] } })),
          productsApi.getRecentlyViewed({ limit: 12 }).catch(() => ({ products: [] })),
          userApi.getAddresses().catch(() => ({ addresses: [] })),
          userApi.getPaymentMethods().catch(() => ({ paymentMethods: [] })),
          userApi.getSessions().catch(() => ({ sessions: [] })),
          userApi.getLinkedAccounts().catch(() => ({ accounts: [], providers: [] }))
        ])
        
        const apiUser = profileResponse.user
        setProfile({
          id: apiUser.id,
          name: apiUser.name,
          email: apiUser.email,
          phone: apiUser.phone || '',
          address: apiUser.address?.street || '',
          avatar: apiUser.avatar,
          isVerified: apiUser.isVerified || false,
          createdAt: apiUser.createdAt || new Date().toISOString(),
          orders: (ordersResponse.orders || []).map((order: any) => ({
            id: order.id,
            orderNumber: order.orderNumber,
            status: order.status,
            totalAmount: Number(order.totalAmount) || 0,
            createdAt: order.createdAt,
            items: order.items || []
          })),
          wishlist: (wishlistResponse.wishlist?.items || []).map((item: any) => ({
            id: item.id,
            product: {
              id: item.product.id,
              name: item.product.name,
              price: Number(item.product.price) || 0,
              images: item.product.images || []
            }
          })),
          recentlyViewed: (recentlyViewedResponse.products || []).map((item: any) => ({
            id: item.id,
            name: item.name,
            price: Number(item.price) || 0,
            images: item.images || item.productImages?.map((image: any) => image.url) || []
          })),
          addresses: addressesResponse.addresses || [],
          paymentMethods: paymentsResponse.paymentMethods || [],
          sessions: sessionsResponse.sessions || [],
          linkedAccounts: linkedAccountsResponse.accounts || [],
          linkedAccountProviders: linkedAccountsResponse.providers || [],
          notifications: (await userApi.getNotificationSettings().catch(() => ({ notifications: null }))).notifications || apiUser.notifications || {
            email: true,
            sms: false,
            push: true,
            orderUpdates: true,
            promotions: false,
            newsletter: false
          }
        })
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        toast.error('Failed to load profile data');
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [user, navigate])

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'orders' || tab === 'wishlist' || tab === 'recentlyViewed' || tab === 'settings' || tab === 'addresses' || tab === 'payments' || tab === 'notifications' || tab === 'security') {
      setActiveTab(tab)
    }
  }, [searchParams])

  // Set up auto-profile update when GPS gets location
  useEffect(() => {
    // Set up the callback to auto-update profile when location is obtained
    const profileUpdateCallback = async (data: ProfileUpdateData) => {
      if (profile) {
        // Update local state immediately for responsiveness
        setProfile(prev => prev ? {
          ...prev,
          location: data.location,
          address: data.address
        } : null)
        
        // Then save to backend
        try {
          await userApi.updateProfile({
            location: data.location,
            address: data.address
          })
          console.log('Profile automatically updated with GPS location')
        } catch (error) {
          console.error('Failed to save location to profile:', error)
        }
      }
    }

    locationService.setProfileUpdateCallback(profileUpdateCallback)

    // Cleanup callback when component unmounts
    return () => {
      locationService.removeProfileUpdateCallback()
    }
  }, [profile, userApi])

  // Real API functions
  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !profile) return

    setSaving(true)
    try {
      const updatedUser = await updateAvatar(file)
      setProfile({ ...profile, avatar: updatedUser.avatar || updatedUser.profile?.avatar })
    } catch (error) {
      toast.error('Could not update profile picture')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    setSaving(true)
    try {
      await userApi.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      })
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setShowPasswordChange(false)
      toast.success('Password changed successfully')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Could not change password')
    } finally {
      setSaving(false)
    }
  }

  const saveProfile = async () => {
    if (!profile) return
    setSaving(true)
    try {
      await userApi.updateProfile({
        name: profile.name,
        phone: profile.phone,
        address: profile.address,
        location: profile.location,
        notifications: profile.notifications
      })
      toast.success('Profile saved successfully')
    } catch (error) {
      toast.error('Could not save profile')
    } finally {
      setSaving(false)
    }
  }

  const handleGetCurrentLocation = async () => {
    try {
      toast.loading('Getting your precise location...', { id: 'location' })
      
      // Get location and auto-update profile
      const location = await locationService.getLocationAndUpdateProfile()
      
      // Get accuracy level
      const accuracyLevel = locationService.getLocationAccuracyLevel(location.accuracy)
      
      // Show success message with auto-update info
      toast.success(
        `Location updated & profile saved! Accuracy: ${accuracyLevel} (${Math.round(location.accuracy)}m)`,
        { id: 'location' }
      )
      
    } catch (error) {
      console.error('Location error:', error)
      
      // Handle specific permission errors
      if (error instanceof Error) {
        if (error.message.includes('permission denied')) {
          toast.error(
            'Location permission denied. Please enable location in your browser settings for accurate delivery.',
            { id: 'location' }
          )
        } else if (error.message.includes('unavailable')) {
          toast.error(
            'Location unavailable. Please check your GPS/location services.',
            { id: 'location' }
          )
        } else {
          toast.error(
            'Could not get your location. Please try again.',
            { id: 'location' }
          )
        }
      } else {
        toast.error('Location error occurred. Please try again.', { id: 'location' })
      }
    }
  }

  // Address management functions
  const handleAddAddress = async () => {
    if (!profile) return
    
    setSaving(true)
    try {
      const response = await userApi.addAddress(newAddress)
      setProfile(prev => prev ? {
        ...prev,
        addresses: [...(prev.addresses || []), response.address]
      } : null)
      setNewAddress({ street: '', city: '', postalCode: '', country: '', isDefault: false })
      setShowAddAddress(false)
      toast.success('Address added successfully')
    } catch (error) {
      toast.error('Could not add address')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAddress = async (addressId: string) => {
    const confirmed = await confirm({
      title: 'Delete Address',
      message: 'Are you sure you want to delete this address?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'warning',
      icon: 'delete'
    })

    if (!confirmed) return

    setSaving(true)
    try {
      await userApi.deleteAddress(addressId)
      setProfile(prev => prev ? {
        ...prev,
        addresses: prev.addresses?.filter(addr => addr.id !== addressId) || []
      } : null)
      toast.success('Address deleted successfully')
    } catch (error) {
      toast.error('Could not delete address')
    } finally {
      setSaving(false)
    }
  }

  const handleSetDefaultAddress = async (addressId: string) => {
    setSaving(true)
    try {
      await userApi.setDefaultAddress(addressId)
      setProfile(prev => prev ? {
        ...prev,
        addresses: prev.addresses?.map(addr => ({
          ...addr,
          isDefault: addr.id === addressId
        })) || []
      } : null)
      toast.success('Default address updated')
    } catch (error) {
      toast.error('Could not update default address')
    } finally {
      setSaving(false)
    }
  }

  // Payment method functions
  const handleAddPaymentMethod = async () => {
    if (!profile) return
    
    // Validate M-PESA phone number
    if (!newPayment.phoneNumber || !newPayment.phoneNumber.match(/^(07|01)\d{8}$/)) {
      toast.error('Please enter a valid M-PESA phone number (07XXXXXXXX or 01XXXXXXXX)')
      return
    }
    
    setSaving(true)
    try {
      const response = await userApi.addPaymentMethod({
        type: 'mpesa',
        phoneNumber: newPayment.phoneNumber,
        accountName: newPayment.accountName,
        isDefault: newPayment.isDefault
      })
      setProfile(prev => prev ? {
        ...prev,
        paymentMethods: [...(prev.paymentMethods || []), response.paymentMethod]
      } : null)
      setNewPayment({ type: 'mpesa', phoneNumber: '', accountName: '', isDefault: false })
      setShowAddPayment(false)
      toast.success('M-PESA payment method added successfully')
    } catch (error) {
      toast.error('Could not add M-PESA payment method')
    } finally {
      setSaving(false)
    }
  }

  const handleDeletePaymentMethod = async (paymentId: string) => {
    const confirmed = await confirm({
      title: 'Delete Payment Method',
      message: 'Are you sure you want to delete this payment method?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'warning',
      icon: 'delete'
    })

    if (!confirmed) return

    setSaving(true)
    try {
      await userApi.deletePaymentMethod(paymentId)
      setProfile(prev => prev ? {
        ...prev,
        paymentMethods: prev.paymentMethods?.filter(pm => pm.id !== paymentId) || []
      } : null)
      toast.success('Payment method deleted successfully')
    } catch (error) {
      toast.error('Could not delete payment method')
    } finally {
      setSaving(false)
    }
  }

  // Notification settings
  const updateNotificationSettings = async (key: string, value: boolean) => {
    if (!profile) return
    
    setSaving(true)
    try {
      const updatedNotifications = { 
        email: profile.notifications?.email ?? false,
        sms: profile.notifications?.sms ?? false,
        push: profile.notifications?.push ?? false,
        orderUpdates: profile.notifications?.orderUpdates ?? false,
        promotions: profile.notifications?.promotions ?? false,
        newsletter: profile.notifications?.newsletter ?? false,
        [key]: value
      }
      await userApi.updateNotificationSettings(updatedNotifications)
      setProfile(prev => prev ? { ...prev, notifications: updatedNotifications } : null)
      toast.success('Notification settings updated')
    } catch (error) {
      toast.error('Could not update notification settings')
    } finally {
      setSaving(false)
    }
  }

  const handleCloseAccount = async () => {
    if (!closeAccountForm.identifier.trim() || !closeAccountForm.agreed) {
      toast.error('Enter your email or phone number and agree before closing the account')
      return
    }

    const confirmed = await confirm({
      title: 'Close Account Permanently',
      message: 'This permanently deletes your buyer account, profile, wishlist, cart, reviews, notifications, sessions, chat history, and saved settings. Orders are anonymized for business records.',
      confirmText: 'Delete account',
      cancelText: 'Keep account',
      type: 'danger',
      icon: 'delete',
    })
    if (!confirmed) return

    setSaving(true)
    try {
      await userApi.closeAccount(closeAccountForm)
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      logout()
      toast.success('Your account has been deleted')
      navigate('/goodbye', { replace: true })
    } catch (error: any) {
      toast.error(error?.message || 'Could not close account')
    } finally {
      setSaving(false)
    }
  }

  const refreshSessions = async () => {
    const response = await userApi.getSessions()
    setProfile(prev => prev ? { ...prev, sessions: response.sessions || [] } : null)
  }

  const refreshLinkedAccounts = async () => {
    const response = await userApi.getLinkedAccounts()
    setProfile(prev => prev ? { ...prev, linkedAccounts: response.accounts || [], linkedAccountProviders: response.providers || [] } : null)
  }

  const refreshRecentlyViewed = async () => {
    const response = await productsApi.getRecentlyViewed({ limit: 12 })
    setProfile(prev => prev ? {
      ...prev,
      recentlyViewed: (response.products || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        price: Number(item.price) || 0,
        images: item.images || item.productImages?.map((image: any) => image.url) || [],
        viewedAt: item.viewedAt,
      }))
    } : null)
  }

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await userApi.revokeSession(sessionId)
      toast.success('Device logged out')
      await refreshSessions()
    } catch {
      toast.error('Could not log out device')
    }
  }

  const handleAcceptSession = async (sessionId: string) => {
    try {
      await userApi.acceptSession(sessionId)
      toast.success('Device accepted')
      await refreshSessions()
    } catch {
      toast.error('Could not accept device')
    }
  }

  const handleRevokeOtherSessions = async () => {
    try {
      await userApi.revokeOtherSessions()
      toast.success('Other devices logged out')
      await refreshSessions()
    } catch {
      toast.error('Could not log out other devices')
    }
  }

  const handleUnlinkAccount = async (accountId: string) => {
    try {
      await userApi.unlinkAccount(accountId)
      toast.success('Linked account removed')
      await refreshLinkedAccounts()
    } catch {
      toast.error('Could not remove linked account')
    }
  }

  const handleViewOrder = (orderId: string) => {
    navigate(`/order-tracking/${orderId}`);
  };

  const handleViewProduct = (productId: string) => {
    navigate(`/product/${productId}`);
  };

  const handleRemoveFromWishlist = async (productId: string) => {
    if (!window.confirm('Remove this item from your wishlist?')) return
    
    try {
      await wishlistApi.removeFromWishlist(productId)
      setProfile(prev => prev ? {
        ...prev,
        wishlist: prev.wishlist.filter(item => item.product.id !== productId)
      } : null)
      toast.success('Item removed from wishlist')
    } catch (error) {
      toast.error('Could not remove item from wishlist')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Profile Not Found</h1>
          <button
            onClick={() => navigate('/shop')}
            className="text-red-600 hover:text-red-700"
          >
            Return to Shop
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative h-20 w-20 overflow-hidden rounded-full bg-gray-200">
                {profile.avatar ? (
                  <img src={profile.avatar.startsWith('http') ? profile.avatar : `${API_HOST}${profile.avatar}`} alt={profile.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <User className="w-10 h-10 text-gray-400" />
                  </div>
                )}
                <label className="absolute inset-x-0 bottom-0 flex cursor-pointer items-center justify-center bg-black/55 py-1 text-white">
                  <Camera className="h-4 w-4" />
                  <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" disabled={saving} />
                </label>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Mail className="w-4 h-4" />
                    <span>{profile.email}</span>
                  </div>
                  {profile.phone && (
                    <div className="flex items-center space-x-1">
                      <Phone className="w-4 h-4" />
                      <span>{profile.phone}</span>
                    </div>
                  )}
                  {profile.isVerified && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      Verified
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left ${
                    activeTab === 'orders' ? 'bg-red-50 text-red-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Package className="w-5 h-5" />
                  <span>Orders</span>
                </button>
                <button
                  onClick={() => setActiveTab('wishlist')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left ${
                    activeTab === 'wishlist' ? 'bg-red-50 text-red-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Heart className="w-5 h-5" />
                  <span>Wishlist</span>
                </button>
                <button
                  onClick={() => setActiveTab('recentlyViewed')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left ${
                    activeTab === 'recentlyViewed' ? 'bg-red-50 text-red-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Clock className="w-5 h-5" />
                  <span>Recently Viewed</span>
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left ${
                    activeTab === 'settings' ? 'bg-red-50 text-red-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Settings className="w-5 h-5" />
                  <span>Settings</span>
                </button>
                <button
                  onClick={() => setActiveTab('addresses')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left ${
                    activeTab === 'addresses' ? 'bg-red-50 text-red-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <MapPin className="w-5 h-5" />
                  <span>Addresses</span>
                </button>
                <button
                  onClick={() => setActiveTab('payments')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left ${
                    activeTab === 'payments' ? 'bg-red-50 text-red-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  <span>Payment Methods</span>
                </button>
                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left ${
                    activeTab === 'notifications' ? 'bg-red-50 text-red-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Bell className="w-5 h-5" />
                  <span>Notifications</span>
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left ${
                    activeTab === 'security' ? 'bg-red-50 text-red-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <ShieldCheck className="w-5 h-5" />
                  <span>Security Devices</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Order History</h2>
                  <button
                    onClick={() => ordersApi.getMyOrders().then(data => {
                      setProfile(prev => prev ? { ...prev, orders: data.orders } : null)
                    })}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Refresh
                  </button>
                </div>
                
                {profile.orders.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No orders yet</p>
                    <button
                      onClick={() => navigate('/shop')}
                      className="bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700"
                    >
                      Start Shopping
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {profile.orders.map((order) => (
                      <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-gray-900">{order.orderNumber}</h3>
                            <p className="text-sm text-gray-600">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                            <p className="text-sm font-medium">
                              {formatPrice(order.totalAmount)}
                            </p>
                            {order.items && order.items.length > 0 && (
                              <p className="text-xs text-gray-500 mt-1">
                                {order.items.length} items
                              </p>
                            )}
                          </div>
                          
                          <div className="text-right">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              order.status === 'DELIVERED' 
                                ? 'bg-green-100 text-green-800'
                                : order.status === 'OUT_FOR_DELIVERY'
                                ? 'bg-blue-100 text-blue-800'
                                : order.status === 'PROCESSING'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {order.status.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handleViewOrder(order.id)}
                          className="mt-3 text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          Track Order →
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Wishlist Tab */}
            {activeTab === 'wishlist' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">My Wishlist</h2>
                  <button
                    onClick={() => wishlistApi.getWishlist().then(data => {
                      setProfile(prev => prev ? { ...prev, wishlist: data.wishlist.items } : null)
                    })}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Refresh
                  </button>
                </div>
                
                {profile.wishlist.length === 0 ? (
                  <div className="text-center py-8">
                    <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Your wishlist is empty</p>
                    <button
                      onClick={() => navigate('/shop')}
                      className="bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700"
                    >
                      Browse Products
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {profile.wishlist.map((item) => (
                      <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                        <img
                          src={item.product.images[0] || '/placeholder.jpg'}
                          alt={item.product.name}
                          className="w-full h-40 object-cover rounded-lg mb-3"
                        />
                        
                        <h3 className="font-medium text-gray-900 mb-2">{item.product.name}</h3>
                        <p className="text-lg font-semibold text-gray-900 mb-3">
                          {formatPrice(item.product.price)}
                        </p>
                        
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewProduct(item.product.id)}
                            className="flex-1 bg-red-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-red-700"
                          >
                            View Product
                          </button>
                          <button
                            onClick={() => handleRemoveFromWishlist(item.product.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Heart className="w-4 h-4 fill-current" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Recently Viewed Tab */}
            {activeTab === 'recentlyViewed' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Recently Viewed</h2>
                    <p className="text-sm text-gray-600">Products you opened from this account or browser session.</p>
                  </div>
                  <button
                    onClick={refreshRecentlyViewed}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Refresh
                  </button>
                </div>

                {(profile.recentlyViewed || []).length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No recently viewed products yet</p>
                    <button
                      onClick={() => navigate('/shop')}
                      className="bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700"
                    >
                      Browse Products
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {profile.recentlyViewed?.map((item) => (
                      <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                        <img
                          src={item.images?.[0] || '/hincton/hero-platter.webp'}
                          alt={item.name}
                          className="w-full h-40 object-cover rounded-lg mb-3"
                        />
                        <h3 className="font-medium text-gray-900 mb-2">{item.name}</h3>
                        <p className="text-lg font-semibold text-gray-900 mb-1">{formatPrice(item.price)}</p>
                        {item.viewedAt && <p className="text-xs text-gray-500 mb-3">Viewed {new Date(item.viewedAt).toLocaleString()}</p>}
                        <button
                          onClick={() => handleViewProduct(item.id)}
                          className="w-full bg-red-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-red-700"
                        >
                          View Product
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Account Settings</h2>
                  <button
                    onClick={saveProfile}
                    disabled={saving}
                    className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={profile.name}
                          onChange={(event) => setProfile({ ...profile, name: event.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={profile.email}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={profile.phone || ''}
                          onChange={(event) => setProfile({ ...profile, phone: event.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Preferred Delivery Location
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={profile.address || ''}
                            onChange={(event) => setProfile({ ...profile, address: event.target.value })}
                            className="min-w-0 flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          />
                          <button
                            type="button"
                            onClick={handleGetCurrentLocation}
                            className="rounded-lg bg-red-600 px-3 text-white hover:bg-red-700"
                            aria-label="Get current location"
                          >
                            <MapPin className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Password Change */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Change Password</h3>
                    <button
                      onClick={() => setShowPasswordChange(!showPasswordChange)}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium"
                    >
                      Change Password
                    </button>
                    
                    {showPasswordChange && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Current Password
                            </label>
                            <div className="relative">
                              <input
                                type={showPassword ? "text" : "password"}
                                value={passwordData.currentPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                              >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              New Password
                            </label>
                            <div className="relative">
                              <input
                                type={showNewPassword ? "text" : "password"}
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                              />
                              <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                              >
                                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Confirm New Password
                            </label>
                            <div className="relative">
                              <input
                                type={showConfirmPassword ? "text" : "password"}
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                              />
                              <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                              >
                                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={handlePasswordChange}
                              disabled={saving}
                              className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
                            >
                              {saving ? 'Updating...' : 'Update Password'}
                            </button>
                            <button
                              onClick={() => setShowPasswordChange(false)}
                              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-red-200 pt-6">
                    <h3 className="font-medium text-red-700 mb-2">Close account</h3>
                    <p className="text-sm text-gray-600">
                      We are sad to see you leave. Closing your account permanently removes your buyer profile and personal account data from our systems. This cannot be undone.
                    </p>
                    <div className="mt-4 space-y-3 rounded-lg border border-red-200 bg-red-50 p-4">
                      <label className="block text-sm font-medium text-gray-700">
                        Confirm with your email or phone number
                        <input
                          type="text"
                          value={closeAccountForm.identifier}
                          onChange={(event) => setCloseAccountForm({ ...closeAccountForm, identifier: event.target.value })}
                          className="mt-1 w-full rounded-lg border border-red-200 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500"
                          placeholder={profile.email || profile.phone || 'Email or phone'}
                        />
                      </label>
                      <label className="flex items-start gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={closeAccountForm.agreed}
                          onChange={(event) => setCloseAccountForm({ ...closeAccountForm, agreed: event.target.checked })}
                          className="mt-1"
                        />
                        <span>I understand and agree that my account will be permanently deleted under the Terms and Privacy Policy.</span>
                      </label>
                      <button type="button" onClick={handleCloseAccount} disabled={saving} className="rounded-lg bg-red-700 px-4 py-2 text-sm font-bold text-white hover:bg-red-800 disabled:opacity-60">
                        {saving ? 'Closing account...' : 'Close account permanently'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Addresses Tab */}
            {activeTab === 'addresses' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Delivery Addresses</h2>
                  <button
                    onClick={() => setShowAddAddress(true)}
                    className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700"
                  >
                    <Plus className="w-4 h-4" />
                    Add Address
                  </button>
                </div>

                {showAddAddress && (
                  <div className="mb-6 p-4 border border-gray-200 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-4">Add New Address</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                        <input
                          type="text"
                          value={newAddress.street}
                          onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                          <input
                            type="text"
                            value={newAddress.city}
                            onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code</label>
                          <input
                            type="text"
                            value={newAddress.postalCode}
                            onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                        <input
                          type="text"
                          value={newAddress.country}
                          onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="defaultAddress"
                          checked={newAddress.isDefault}
                          onChange={(e) => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
                          className="mr-2"
                        />
                        <label htmlFor="defaultAddress" className="text-sm text-gray-700">Set as default address</label>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleAddAddress}
                          disabled={saving}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
                        >
                          {saving ? 'Adding...' : 'Add Address'}
                        </button>
                        <button
                          onClick={() => setShowAddAddress(false)}
                          className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {profile.addresses?.map((address) => (
                    <div key={address.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{address.street}</p>
                          <p className="text-sm text-gray-600">{address.city}, {address.postalCode}</p>
                          <p className="text-sm text-gray-600">{address.country}</p>
                          {address.isDefault && (
                            <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              Default
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {!address.isDefault && (
                            <button
                              onClick={() => handleSetDefaultAddress(address.id)}
                              className="text-red-600 hover:text-red-700 text-sm font-medium"
                            >
                              Set Default
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteAddress(address.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment Methods Tab */}
            {activeTab === 'payments' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Payment Methods</h2>
                  <button
                    onClick={() => setShowAddPayment(true)}
                    className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700"
                  >
                    <Plus className="w-4 h-4" />
                    Add Payment Method
                  </button>
                </div>

                {showAddPayment && (
                  <div className="mb-6 p-4 border border-gray-200 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-4">Add M-PESA Payment Method</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">M-PESA Phone Number</label>
                        <input
                          type="tel"
                          value={newPayment.phoneNumber}
                          onChange={(e) => setNewPayment({ ...newPayment, phoneNumber: e.target.value })}
                          placeholder="07XXXXXXXX or 01XXXXXXXX"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">Enter your M-PESA registered phone number</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Account Name</label>
                        <input
                          type="text"
                          value={newPayment.accountName}
                          onChange={(e) => setNewPayment({ ...newPayment, accountName: e.target.value })}
                          placeholder="John Doe"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">Name registered with your M-PESA account</p>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="defaultPayment"
                          checked={newPayment.isDefault}
                          onChange={(e) => setNewPayment({ ...newPayment, isDefault: e.target.checked })}
                          className="mr-2"
                        />
                        <label htmlFor="defaultPayment" className="text-sm text-gray-700">Set as default payment method</label>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleAddPaymentMethod}
                          disabled={saving}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
                        >
                          {saving ? 'Adding...' : 'Add Payment Method'}
                        </button>
                        <button
                          onClick={() => setShowAddPayment(false)}
                          className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {profile.paymentMethods?.map((payment) => (
                    <div key={payment.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <Phone className="w-4 h-4 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              M-PESA •••• {payment.last4 || 'XXXX'}
                            </p>
                            <p className="text-sm text-gray-600">
                              M-PESA Account
                            </p>
                            {payment.isDefault && (
                              <span className="inline-block mt-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                Default
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeletePaymentMethod(payment.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Notification Preferences</h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-4">Communication Channels</h3>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between">
                        <span className="text-gray-700">Email Notifications</span>
                        <input
                          type="checkbox"
                          checked={profile.notifications?.email || false}
                          onChange={(e) => updateNotificationSettings('email', e.target.checked)}
                          className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                        />
                      </label>
                      <label className="flex items-center justify-between">
                        <span className="text-gray-700">SMS Notifications</span>
                        <input
                          type="checkbox"
                          checked={profile.notifications?.sms || false}
                          onChange={(e) => updateNotificationSettings('sms', e.target.checked)}
                          className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                        />
                      </label>
                      <label className="flex items-center justify-between">
                        <span className="text-gray-700">Push Notifications</span>
                        <input
                          type="checkbox"
                          checked={profile.notifications?.push || false}
                          onChange={(e) => updateNotificationSettings('push', e.target.checked)}
                          className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                        />
                      </label>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-900 mb-4">Notification Types</h3>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between">
                        <span className="text-gray-700">Order Updates</span>
                        <input
                          type="checkbox"
                          checked={profile.notifications?.orderUpdates || false}
                          onChange={(e) => updateNotificationSettings('orderUpdates', e.target.checked)}
                          className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                        />
                      </label>
                      <label className="flex items-center justify-between">
                        <span className="text-gray-700">Promotions & Special Offers</span>
                        <input
                          type="checkbox"
                          checked={profile.notifications?.promotions || false}
                          onChange={(e) => updateNotificationSettings('promotions', e.target.checked)}
                          className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                        />
                      </label>
                      <label className="flex items-center justify-between">
                        <span className="text-gray-700">Newsletter</span>
                        <input
                          type="checkbox"
                          checked={profile.notifications?.newsletter || false}
                          onChange={(e) => updateNotificationSettings('newsletter', e.target.checked)}
                          className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Linked accounts</h2>
                    <p className="mt-1 text-sm text-gray-600">Manage real social sign-in accounts connected to your profile.</p>
                  </div>
                  <button
                    type="button"
                    onClick={refreshLinkedAccounts}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Refresh
                  </button>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {(profile.linkedAccountProviders || []).map((provider) => {
                    const account = profile.linkedAccounts?.find((item) => item.provider.toLowerCase() === provider.provider)
                    return (
                      <div key={provider.provider} className="rounded-lg border border-gray-200 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-700">
                              <Link2 className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{provider.label}</p>
                              <p className="mt-1 text-sm text-gray-600">
                                {account ? `Connected as ${account.providerAccountId}` : provider.configured ? 'Ready to connect' : 'Provider keys are not configured'}
                              </p>
                              {account && <p className="mt-1 text-xs text-gray-500">Linked {new Date(account.createdAt).toLocaleDateString()}</p>}
                            </div>
                          </div>
                          {account ? (
                            <button
                              type="button"
                              onClick={() => handleUnlinkAccount(account.id)}
                              className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                            >
                              Unlink
                            </button>
                          ) : (
                            <a
                              href={provider.connectUrl || undefined}
                              onClick={(event) => {
                                if (!provider.connectUrl) {
                                  event.preventDefault()
                                  toast.error(`${provider.label} sign-in is not configured on this deployment`)
                                }
                              }}
                              className={`rounded-lg px-3 py-2 text-sm font-semibold ${provider.connectUrl ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-gray-100 text-gray-500'}`}
                            >
                              Connect
                            </a>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  {(profile.linkedAccountProviders || []).length === 0 && (
                    <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">No linked account providers are available.</p>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Signed-in devices</h2>
                    <p className="mt-1 text-sm text-gray-600">Review every active account session and log out anything you do not recognize.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRevokeOtherSessions}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
                  >
                    <LogOut className="h-4 w-4" />
                    Log out other devices
                  </button>
                </div>

                <div className="mt-6 space-y-4">
                  {(profile.sessions || []).length === 0 ? (
                    <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">No device sessions found.</p>
                  ) : (
                    profile.sessions?.map((session) => (
                      <div key={session.id} className={`rounded-lg border p-4 ${session.isRevoked ? 'border-gray-200 bg-gray-50 opacity-70' : session.isCurrent ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'}`}>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-700">
                              <Monitor className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-semibold text-gray-900">{session.deviceName || session.deviceType || 'Unknown device'}</p>
                                {session.isCurrent && <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">Current</span>}
                                {session.isRevoked && <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-bold text-gray-600">Logged out</span>}
                              </div>
                              <p className="mt-1 text-sm text-gray-600">{session.ipAddress || 'Unknown IP'}</p>
                              <p className="mt-1 text-xs text-gray-500">Last active {new Date(session.lastActivity).toLocaleString()}</p>
                              <p className="mt-1 line-clamp-1 text-xs text-gray-400">{session.userAgent}</p>
                            </div>
                          </div>
                          {!session.isRevoked && (
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => handleAcceptSession(session.id)}
                                className="rounded-lg border border-green-200 px-3 py-2 text-sm font-semibold text-green-700 hover:bg-green-50"
                              >
                                Accept
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRevokeSession(session.id)}
                                className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                              >
                                Log out
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              </div>
            )}
          </div>
        </div>
      </div>

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
    </div>
  )
}

export default EnhancedProfilePage
