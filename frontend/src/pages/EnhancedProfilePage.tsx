import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Camera, User, Mail, Phone, ShoppingBag, Heart, Package, Settings, MapPin, Eye, EyeOff, Save, Trash2, Plus, Bell, CreditCard, ShieldCheck, Monitor, LogOut, Clock, Link2,
  LifeBuoy, RotateCcw, FileText, AlertTriangle, Award, ArrowLeft, Send, X, ChevronRight, MessageCircle, CheckCircle2, Sparkles, Gift, TrendingUp, BellRing, Minus, Percent, Download, HelpCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  ordersApi, productsApi, userApi, wishlistApi,
  supportTicketsApi, returnsApiExtended, invoicesApi, alertsApi, loyaltyApi
} from '../services/buyerApi';
import { locationService, ProfileUpdateData } from '../services/locationService';
import { useConfirmationDialog } from '../hooks/useConfirmationDialog';
import ConfirmationDialog from '../components/ui/ConfirmationDialog';
import { getApiHost } from '../services/api';
import { formatPrice } from '../utils/currency';
import DeviceLinkingSection from '../components/profile/DeviceLinkingSection';

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
  tickets?: Array<any>;
  returns?: Array<any>;
  invoices?: Array<any>;
  alerts?: Array<any>;
  loyaltySummary?: {
    points: number;
    tier: string;
    redemptions: Array<any>;
  };
}

interface SupportTicketResponse {
  id: string;
  senderName: string;
  senderRole: string;
  message: string;
  attachments?: string[] | null;
  createdAt: string;
}

interface SupportTicketFull {
  id: string;
  ticketNumber: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  message: string;
  attachments?: string[] | null;
  responses?: SupportTicketResponse[];
  csatScore?: number | null;
  csatComment?: string | null;
  createdAt: string;
  updatedAt: string;
}

const EnhancedProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, updateAvatar, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'orders' | 'wishlist' | 'recentlyViewed' | 'settings' | 'addresses' | 'payments' | 'notifications' | 'security' | 'tickets' | 'returns' | 'invoices' | 'alerts' | 'loyalty'>('orders');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicketFull | null>(null);
  const [ticketReply, setTicketReply] = useState('');
  const [ticketReplying, setTicketReplying] = useState(false);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: '', message: '', category: 'GENERAL_INQUIRY', priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' });
  const [csatRating, setCsatRating] = useState<{ score: number; comment: string; submitted: boolean }>({ score: 0, comment: '', submitted: false });
  const [loyaltyRewards] = useState<{ reward: string; label: string; cost: number; description: string }[]>([
    { reward: 'FREE_SHIP', label: 'Free Delivery', cost: 500, description: 'Complimentary shipping on your next order up to KES 500.' },
    { reward: 'DISCOUNT_5', label: '5% Discount', cost: 1000, description: 'Take 5% off your next entire order.' },
    { reward: 'DISCOUNT_10', label: '10% Discount', cost: 2000, description: 'Take 10% off any single order.' },
    { reward: 'GIFT_CARD_500', label: 'KES 500 Credit', cost: 5000, description: 'Store credit of KES 500 to spend on your next purchase.' },
  ]);
  const [alertsLoading, setAlertsLoading] = useState(false);
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
        const [profileResponse, ordersResponse, wishlistResponse, recentlyViewedResponse, addressesResponse, paymentsResponse, sessionsResponse, linkedAccountsResponse, ticketsResponse, returnsResponse, invoicesResponse, alertsResponse, loyaltyResponse] = await Promise.all([
          userApi.getProfile(),
          ordersApi.getMyOrders().catch(() => ({ orders: [] })),
          wishlistApi.getWishlist().catch(() => ({ wishlist: { items: [] } })),
          productsApi.getRecentlyViewed({ limit: 12 }).catch(() => ({ products: [] })),
          userApi.getAddresses().catch(() => ({ addresses: [] })),
          userApi.getPaymentMethods().catch(() => ({ paymentMethods: [] })),
          userApi.getSessions().catch(() => ({ sessions: [] })),
          userApi.getLinkedAccounts().catch(() => ({ accounts: [], providers: [] })),
          supportTicketsApi.getMyTickets().catch(() => ({ tickets: [] })),
          returnsApiExtended.getMyReturns().catch(() => ({ returns: [] })),
          invoicesApi.getMyInvoices().catch(() => ({ invoices: [] })),
          alertsApi.getMyAlerts().catch(() => ({ alerts: [] })),
          loyaltyApi.getLoyaltySummary().catch(() => ({ points: 0, tier: 'Bronze', redemptions: [] }))
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
          },
          tickets: (ticketsResponse.tickets || []).map((t: any) => ({
            ...t,
            createdAt: t.createdAt || t.updatedAt || new Date().toISOString(),
          })),
          returns: (returnsResponse.returns || []),
          invoices: (invoicesResponse.invoices || []),
          alerts: (alertsResponse.alerts || []),
          loyaltySummary: {
            points: Number(loyaltyResponse.points ?? apiUser.loyaltyPoints ?? 0),
            tier: loyaltyResponse.tier ?? (Number(loyaltyResponse.points ?? apiUser.loyaltyPoints ?? 0) >= 5000 ? 'Platinum' : Number(loyaltyResponse.points ?? apiUser.loyaltyPoints ?? 0) >= 2000 ? 'Gold' : Number(loyaltyResponse.points ?? apiUser.loyaltyPoints ?? 0) >= 500 ? 'Silver' : 'Bronze'),
            redemptions: loyaltyResponse.redemptions || [],
          },
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
    const valid = ['orders', 'wishlist', 'recentlyViewed', 'settings', 'addresses', 'payments', 'notifications', 'security', 'tickets', 'returns', 'invoices', 'alerts', 'loyalty']
    if (tab && valid.includes(tab)) {
      setActiveTab(tab as any)
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

  const categoryLabel = (c: string | null | undefined) => {
    if (!c) return 'General'
    const map: Record<string, string> = {
      SHIPPING: 'Shipping', PAYMENTS: 'Payments', RETURNS: 'Returns', ORDERS: 'Orders',
      PRODUCTS: 'Products', ACCOUNT: 'Account', GENERAL_INQUIRY: 'General',
      FEEDBACK: 'Feedback', TECHNICAL: 'Technical', WHOLESALE: 'Wholesale',
    }
    return map[c] || c.replace(/_/g, ' ')
  }

  const statusBadge = (status: string) => {
    const s = status || 'OPEN'
    const map: Record<string, string> = {
      OPEN: 'bg-yellow-100 text-yellow-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      WAITING_ON_CUSTOMER: 'bg-purple-100 text-purple-800',
      WAITING_ON_THIRD_PARTY: 'bg-orange-100 text-orange-800',
      RESOLVED: 'bg-green-100 text-green-800',
      CLOSED: 'bg-gray-100 text-gray-700',
      REQUESTED: 'bg-orange-100 text-orange-800',
      APPROVED: 'bg-blue-100 text-blue-800',
      REJECTED: 'bg-red-100 text-red-800',
      REFUNDED: 'bg-green-100 text-green-800',
      COMPLETED: 'bg-green-100 text-green-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      PROCESSING: 'bg-purple-100 text-purple-800',
    }
    return map[s] || 'bg-gray-100 text-gray-700'
  }

  const loadTicketDetail = async (id: string) => {
    try {
      const data = await supportTicketsApi.getTicket(id)
      setSelectedTicket(data.ticket)
      setTicketReply('')
      setCsatRating({ score: data.ticket?.csatScore || 0, comment: data.ticket?.csatComment || '', submitted: false })
    } catch {
      toast.error('Could not load ticket')
    }
  }

  const closeTicketDetail = () => {
    setSelectedTicket(null)
    setTicketReply('')
    setCsatRating({ score: 0, comment: '', submitted: false })
  }

  const refreshTickets = async () => {
    try {
      const data = await supportTicketsApi.getMyTickets()
      setProfile(prev => prev ? { ...prev, tickets: data.tickets || [] } : null)
    } catch {}
  }

  const submitNewTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTicket.subject.trim() || !newTicket.message.trim()) {
      toast.error('Please fill in subject and message')
      return
    }
    try {
      await supportTicketsApi.createTicket(newTicket)
      toast.success('Support ticket created')
      setShowNewTicket(false)
      setNewTicket({ subject: '', message: '', category: 'GENERAL_INQUIRY', priority: 'MEDIUM' })
      await refreshTickets()
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Could not create ticket')
    }
  }

  const submitTicketReply = async () => {
    if (!selectedTicket || !ticketReply.trim()) return
    setTicketReplying(true)
    try {
      const payload: any = { message: ticketReply.trim() }
      if (csatRating.score && !selectedTicket.csatScore) {
        payload.csatScore = csatRating.score
        if (csatRating.comment.trim()) payload.csatComment = csatRating.comment.trim()
      }
      await supportTicketsApi.replyToTicket(selectedTicket.id, payload)
      toast.success('Reply sent')
      await loadTicketDetail(selectedTicket.id)
      await refreshTickets()
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Could not send reply')
    } finally {
      setTicketReplying(false)
    }
  }

  const submitCsatOnly = async () => {
    if (!selectedTicket || csatRating.submitted || !csatRating.score) return
    setTicketReplying(true)
    try {
      await supportTicketsApi.replyToTicket(selectedTicket.id, {
        message: '',
        csatScore: csatRating.score,
        csatComment: csatRating.comment.trim() || undefined,
      })
      setCsatRating(s => ({ ...s, submitted: true }))
      toast.success('Thank you for your feedback')
    } catch {
      toast.error('Could not submit feedback')
    } finally {
      setTicketReplying(false)
    }
  }

  const refreshReturns = async () => {
    try {
      const data = await returnsApiExtended.getMyReturns()
      setProfile(prev => prev ? { ...prev, returns: data.returns || [] } : null)
    } catch {}
  }

  const refreshInvoices = async () => {
    try {
      const data = await invoicesApi.getMyInvoices()
      setProfile(prev => prev ? { ...prev, invoices: data.invoices || [] } : null)
    } catch {}
  }

  const downloadInvoice = async (invoiceNumber: string) => {
    try {
      await invoicesApi.downloadInvoice(invoiceNumber)
      toast.success('Invoice downloaded')
    } catch {
      toast.error('Could not download invoice')
    }
  }

  const refreshAlerts = async () => {
    setAlertsLoading(true)
    try {
      const data = await alertsApi.getMyAlerts()
      setProfile(prev => prev ? { ...prev, alerts: data.alerts || [] } : null)
    } finally {
      setAlertsLoading(false)
    }
  }

  const cancelAlert = async (type: 'bis' | 'pda', id: string) => {
    if (!window.confirm('Remove this alert?')) return
    try {
      await alertsApi.cancelAlert(type, id)
      toast.success('Alert removed')
      await refreshAlerts()
    } catch {
      toast.error('Could not remove alert')
    }
  }

  const refreshLoyalty = async () => {
    try {
      const data = await loyaltyApi.getLoyaltySummary()
      setProfile(prev => prev ? {
        ...prev,
        loyaltySummary: {
          points: Number(data.points || 0),
          tier: data.tier || (Number(data.points || 0) >= 5000 ? 'Platinum' : Number(data.points || 0) >= 2000 ? 'Gold' : Number(data.points || 0) >= 500 ? 'Silver' : 'Bronze'),
          redemptions: data.redemptions || [],
        }
      } : null)
    } catch {}
  }

  const redeemLoyaltyReward = (reward: string, cost: number, label: string) => {
    confirm({
      title: 'Redeem reward?',
      message: `Redeem "${label}" for ${cost} points?`,
      type: 'info',
      confirmText: 'Redeem',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          await loyaltyApi.redeemReward({ reward, points: cost })
          toast.success('Reward redeemed successfully')
          await refreshLoyalty()
        } catch {
          toast.error('Could not redeem reward at this time')
        }
      },
    })
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
                <div className="my-3 border-t border-gray-100" />
                <p className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wide text-gray-400">Support & Rewards</p>
                <button
                  onClick={() => setActiveTab('tickets')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left ${
                    activeTab === 'tickets' ? 'bg-red-50 text-red-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <LifeBuoy className="w-5 h-5" />
                  <span>Support Tickets</span>
                </button>
                <button
                  onClick={() => setActiveTab('returns')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left ${
                    activeTab === 'returns' ? 'bg-red-50 text-red-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <RotateCcw className="w-5 h-5" />
                  <span>Returns & Refunds</span>
                </button>
                <button
                  onClick={() => setActiveTab('invoices')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left ${
                    activeTab === 'invoices' ? 'bg-red-50 text-red-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <FileText className="w-5 h-5" />
                  <span>Invoices</span>
                </button>
                <button
                  onClick={() => setActiveTab('alerts')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left ${
                    activeTab === 'alerts' ? 'bg-red-50 text-red-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <AlertTriangle className="w-5 h-5" />
                  <span>Price & Stock Alerts</span>
                </button>
                <button
                  onClick={() => setActiveTab('loyalty')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left ${
                    activeTab === 'loyalty' ? 'bg-red-50 text-red-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Award className="w-5 h-5" />
                  <span>Loyalty & Rewards</span>
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

              {/* Dynamic QR & Laser Scanner Device Linking */}
              <DeviceLinkingSection />
              </div>
            )}

            {/* TICKETS TAB */}
            {activeTab === 'tickets' && !selectedTicket && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Support Tickets</h2>
                      <p className="mt-1 text-sm text-gray-600">Track every support conversation you have opened with our team.</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => refreshTickets()} className="text-red-600 hover:text-red-700 text-sm font-medium">Refresh</button>
                      <button onClick={() => setShowNewTicket(true)} className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-700">
                        <Plus className="w-4 h-4" /> New Ticket
                      </button>
                    </div>
                  </div>
                  {(profile.tickets || []).length === 0 ? (
                    <div className="mt-10 text-center py-8">
                      <LifeBuoy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600 mb-1">No support tickets yet.</p>
                      <p className="text-sm text-gray-500 mb-4">Start a conversation with our team any time.</p>
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                        <button onClick={() => setShowNewTicket(true)} className="inline-flex items-center gap-2 bg-red-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-red-700">
                          <MessageCircle className="w-4 h-4" /> Open a Ticket
                        </button>
                        <Link to="/help" className="inline-flex items-center gap-2 border border-gray-200 px-5 py-2 rounded-lg font-bold text-gray-700 hover:bg-gray-50">
                          <HelpCircle className="w-4 h-4" /> Visit Help Center
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-6 space-y-3">
                      {(profile.tickets || []).map((t: any) => (
                        <button key={t.id} onClick={() => loadTicketDetail(t.id)} className="w-full text-left rounded-lg border border-gray-200 p-4 hover:border-red-200 hover:shadow-sm transition-all">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-semibold text-gray-900">{t.subject}</h3>
                                {t.category && (
                                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-gray-700">
                                    {categoryLabel(t.category)}
                                  </span>
                                )}
                              </div>
                              <p className="mt-1 text-xs text-gray-500">#{t.ticketNumber || t.id} · {new Date(t.createdAt || t.updatedAt).toLocaleString()}</p>
                              <p className="mt-2 text-sm text-gray-700 line-clamp-2">{t.message}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {t.priority && t.priority !== 'MEDIUM' && (
                                <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${t.priority === 'URGENT' ? 'bg-red-100 text-red-800' : t.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-700'}`}>
                                  {t.priority}
                                </span>
                              )}
                              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${statusBadge(t.status)}`}>
                                {(t.status || 'OPEN').replace(/_/g, ' ')}
                              </span>
                              {t.csatScore && (
                                <span className="rounded-full bg-green-100 text-green-800 px-2 py-0.5 text-[11px] font-bold">Rated {t.csatScore}/5</span>
                              )}
                              <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TICKET DETAIL VIEW */}
            {activeTab === 'tickets' && selectedTicket && (
              <div className="space-y-4">
                <button onClick={closeTicketDetail} className="inline-flex items-center gap-2 text-sm text-red-700 hover:text-red-800 font-semibold">
                  <ArrowLeft className="w-4 h-4" /> Back to all tickets
                </button>
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-bold text-gray-900">{selectedTicket.subject}</h2>
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${statusBadge(selectedTicket.status)}`}>
                          {(selectedTicket.status || 'OPEN').replace(/_/g, ' ')}
                        </span>
                        {selectedTicket.category && (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-gray-700">
                            {categoryLabel(selectedTicket.category)}
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-xs text-gray-500">#{selectedTicket.ticketNumber || selectedTicket.id} · Opened {new Date(selectedTicket.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="mt-6 space-y-4">
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-gray-800">{selectedTicket.responses?.length ? 'You' : profile.name} · Original message</p>
                        <p className="text-xs text-gray-500">{new Date(selectedTicket.createdAt).toLocaleString()}</p>
                      </div>
                      <p className="whitespace-pre-wrap text-gray-800 leading-6">{selectedTicket.message}</p>
                      {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {selectedTicket.attachments.map((a: string, idx: number) => (
                            <a key={idx} href={a} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:text-red-700">
                              <FileText className="w-3.5 h-3.5" /> Attachment {idx + 1}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                    {(selectedTicket.responses || []).map((r: SupportTicketResponse) => (
                      <div key={r.id} className={`rounded-lg border p-4 ${r.senderRole === 'USER' ? 'bg-red-50 border-red-100 ml-6' : 'bg-white border-gray-200 mr-6'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-semibold text-gray-800">{r.senderName} {r.senderRole !== 'USER' && <span className="text-xs font-bold ml-1 text-red-700">· Support</span>}</p>
                          <p className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleString()}</p>
                        </div>
                        <p className="whitespace-pre-wrap text-gray-800 leading-6">{r.message}</p>
                        {r.attachments && r.attachments.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {r.attachments.map((a: string, idx: number) => (
                              <a key={idx} href={a} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700">
                                <FileText className="w-3.5 h-3.5" /> Attachment {idx + 1}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* CSAT Rating Prompt */}
                  {(selectedTicket.status === 'RESOLVED' || selectedTicket.status === 'CLOSED') && !selectedTicket.csatScore && (
                    <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4">
                      <p className="text-sm font-semibold text-green-800">How did we do?</p>
                      <p className="mt-1 text-xs text-green-700">This ticket has been resolved. Please rate your experience with our support team.</p>
                      <div className="mt-3 flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button key={n} onClick={() => setCsatRating(s => ({ ...s, score: n }))} className={`p-1.5 rounded transition-colors ${csatRating.score >= n ? 'text-yellow-500' : 'text-gray-300 hover:text-gray-400'}`}>
                            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                          </button>
                        ))}
                      </div>
                      <textarea value={csatRating.comment} onChange={e => setCsatRating(s => ({ ...s, comment: e.target.value }))} placeholder="Optional comments (400 chars)" rows={2} className="mt-3 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-500" maxLength={400} />
                      <div className="mt-3 flex justify-end">
                        <button onClick={submitCsatOnly} disabled={!csatRating.score || ticketReplying} className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2 text-xs font-bold text-white hover:bg-green-800 disabled:opacity-60">
                          <CheckCircle2 className="w-4 h-4" /> Submit Rating
                        </button>
                      </div>
                    </div>
                  )}
                  {selectedTicket.csatScore && (
                    <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4">
                      <p className="text-sm font-semibold text-green-800">Your rating</p>
                      <div className="mt-1 flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map(n => (
                          <span key={n} className={`${selectedTicket.csatScore && selectedTicket.csatScore >= n ? 'text-yellow-500' : 'text-gray-300'}`}>
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                          </span>
                        ))}
                        <span className="ml-2 text-xs font-bold text-green-800">{selectedTicket.csatScore}/5</span>
                      </div>
                      {selectedTicket.csatComment && <p className="mt-2 text-xs text-green-700">"{selectedTicket.csatComment}"</p>}
                    </div>
                  )}

                  {/* Reply Area */}
                  {selectedTicket.status !== 'CLOSED' && (
                    <div className="mt-6 rounded-lg border border-gray-200 p-4">
                      <label className="mb-2 block text-sm font-semibold text-gray-700">Your reply</label>
                      <textarea value={ticketReply} onChange={e => setTicketReply(e.target.value)} rows={4} placeholder="Type your reply…" className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-500" />
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                        <div className="text-xs text-gray-500">Attached files can be uploaded from the ticket form in the Help Center.</div>
                        <button onClick={submitTicketReply} disabled={!ticketReply.trim() || ticketReplying} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60">
                          <Send className="w-4 h-4" /> {ticketReplying ? 'Sending…' : 'Send Reply'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* RETURNS TAB */}
            {activeTab === 'returns' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Returns & Refunds</h2>
                      <p className="mt-1 text-sm text-gray-600">Request a return, track progress, and view completed refunds.</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => refreshReturns()} className="text-red-600 hover:text-red-700 text-sm font-medium">Refresh</button>
                      <button onClick={() => navigate('/returns/new')} className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-700">
                        <RotateCcw className="w-4 h-4" /> New Return
                      </button>
                    </div>
                  </div>

                  {(profile.returns || []).length === 0 ? (
                    <div className="mt-10 text-center py-8">
                      <RotateCcw className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600 mb-1">No return requests yet.</p>
                      <p className="text-sm text-gray-500 mb-4">Request a self-service return if anything doesn't meet expectations.</p>
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                        <button onClick={() => navigate('/returns/new')} className="inline-flex items-center gap-2 bg-red-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-red-700">
                          <RotateCcw className="w-4 h-4" /> Start a Return
                        </button>
                        <Link to="/help" className="inline-flex items-center gap-2 border border-gray-200 px-5 py-2 rounded-lg font-bold text-gray-700 hover:bg-gray-50">
                          Read Return Policy
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-6 space-y-3">
                      {(profile.returns || []).map((r: any) => (
                        <div key={r.id} className="rounded-lg border border-gray-200 p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-semibold text-gray-900">Return #{r.returnNumber || r.id?.slice(0, 8).toUpperCase()}</h3>
                                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${statusBadge(r.status)}`}>
                                  {(r.status || 'PENDING').replace(/_/g, ' ')}
                                </span>
                              </div>
                              <p className="mt-1 text-xs text-gray-500">Requested {new Date(r.createdAt || r.requestedAt || Date.now()).toLocaleString()}</p>
                              {r.order && <p className="mt-2 text-sm font-medium text-gray-700">Order: {r.order.orderNumber || r.orderId}</p>}
                              {r.reason && <p className="mt-1 text-sm text-gray-600">Reason: {r.reason.replace(/_/g, ' ')}</p>}
                              {r.refundAmount && <p className="mt-2 text-lg font-bold text-gray-900">Refund: {formatPrice(Number(r.refundAmount))}</p>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* INVOICES TAB */}
            {activeTab === 'invoices' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Invoices & Receipts</h2>
                      <p className="mt-1 text-sm text-gray-600">Download printable invoices for every order you have placed.</p>
                    </div>
                    <button onClick={() => refreshInvoices()} className="text-red-600 hover:text-red-700 text-sm font-medium">Refresh</button>
                  </div>

                  {(profile.invoices || []).length === 0 ? (
                    <div className="mt-10 text-center py-8">
                      <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600 mb-1">No invoices available yet.</p>
                      <p className="text-sm text-gray-500 mb-4">Invoices become available once your order is placed.</p>
                    </div>
                  ) : (
                    <div className="mt-6 overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500">Invoice</th>
                            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500">Order</th>
                            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500">Date</th>
                            <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-gray-500">Total</th>
                            <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-gray-500">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {(profile.invoices || []).map((inv: any) => (
                            <tr key={inv.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm">
                                <p className="font-semibold text-gray-900">{inv.invoiceNumber}</p>
                                {inv.status && <span className={`inline-block mt-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${statusBadge(inv.status)}`}>{inv.status}</span>}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-700">{inv.orderNumber || (inv.order && inv.order.orderNumber) || '—'}</td>
                              <td className="px-4 py-3 text-sm text-gray-700">{new Date(inv.issuedAt || inv.createdAt).toLocaleDateString()}</td>
                              <td className="px-4 py-3 text-sm text-right font-bold text-gray-900">{formatPrice(Number(inv.grandTotal || inv.totalAmount || 0))}</td>
                              <td className="px-4 py-3 text-right">
                                <button onClick={() => downloadInvoice(inv.invoiceNumber)} className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700">
                                  <Download className="w-3.5 h-3.5" /> Download
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ALERTS TAB */}
            {activeTab === 'alerts' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Price & Stock Alerts</h2>
                      <p className="mt-1 text-sm text-gray-600">Get notified when products come back in stock or drop to your target price.</p>
                    </div>
                    <button onClick={() => refreshAlerts()} disabled={alertsLoading} className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-60">Refresh</button>
                  </div>

                  {((profile.alerts || []) as any[]).length === 0 ? (
                    <div className="mt-10 text-center py-8">
                      <BellRing className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600 mb-1">No active alerts.</p>
                      <p className="text-sm text-gray-500 mb-4">Set alerts on any product page — click “Notify me” for out-of-stock items.</p>
                      <button onClick={() => navigate('/shop')} className="inline-flex items-center gap-2 bg-red-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-red-700">
                        Browse Shop
                      </button>
                    </div>
                  ) : (
                    <div className="mt-6 space-y-3">
                      {((profile.alerts || []) as any[]).map((a: any) => {
                        return (
                          <div key={a.id} className="rounded-lg border border-gray-200 p-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                    {a.product ? a.product.name : (a.productId || 'Product alert')}
                                  </h3>
                                  {(a.type === 'BIS' || !a.targetPrice) ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-orange-800">
                                      <BellRing className="w-3 h-3" /> Back in Stock
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-purple-800">
                                      <Percent className="w-3 h-3" /> Price Drop
                                    </span>
                                  )}
                                </div>
                                {a.product?.price !== undefined && (
                                  <p className="mt-1 text-sm text-gray-700">Current: <span className="font-bold">{formatPrice(Number(a.product.price))}</span>
                                    {a.targetPrice && <> · Target: <span className="font-bold text-red-700">{formatPrice(Number(a.targetPrice))}</span></>}
                                  </p>
                                )}
                                <p className="mt-1 text-xs text-gray-500">Set {new Date(a.createdAt).toLocaleString()}</p>
                                {a.email || a.phone ? (
                                  <p className="mt-2 text-xs text-gray-500 flex flex-wrap gap-2">
                                    {a.email && <span>📧 {a.email}</span>}
                                    {a.phone && <span>📱 {a.phone}</span>}
                                  </p>
                                ) : null}
                              </div>
                              <button onClick={() => cancelAlert(a.type === 'PDA' || a.targetPrice ? 'pda' : 'bis', a.id)} className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50 shrink-0">
                                <Minus className="w-3.5 h-3.5" /> Cancel Alert
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* LOYALTY TAB */}
            {activeTab === 'loyalty' && (
              <div className="space-y-6">
                <div className="overflow-hidden rounded-lg bg-gradient-to-r from-gray-950 via-[#9f2f20] to-gray-900 text-white p-6 shadow-lg">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Award className="w-6 h-6 text-yellow-300" />
                        <p className="text-xs font-bold uppercase tracking-widest text-red-200">Loyalty Program · Tier</p>
                      </div>
                      <h2 className="mt-2 text-3xl font-extrabold">{profile.loyaltySummary?.tier || 'Bronze'}</h2>
                      <p className="mt-1 text-sm text-red-100">Thank you for being a valued {profile.loyaltySummary?.tier || 'Bronze'} member.</p>
                    </div>
                    <div className="flex items-end gap-3">
                      <div className="text-right">
                        <p className="text-xs text-red-200 uppercase tracking-wide">Points Balance</p>
                        <p className="text-5xl font-black leading-none">{(profile.loyaltySummary?.points ?? 0).toLocaleString()}</p>
                      </div>
                      <Sparkles className="w-10 h-10 text-yellow-300 mb-1" />
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-4 gap-3">
                    {[{ label: 'Bronze', min: 0, icon: '🥉' }, { label: 'Silver', min: 500, icon: '🥈' }, { label: 'Gold', min: 2000, icon: '🥇' }, { label: 'Platinum', min: 5000, icon: '👑' }].map((t, i, arr) => {
                      const points = profile.loyaltySummary?.points || 0
                      const nextTierMin = arr[i + 1]?.min
                      const progress = nextTierMin ? Math.min(100, Math.max(0, ((points - t.min) / (nextTierMin - t.min)) * 100)) : 100
                      const reached = points >= t.min
                      return (
                        <div key={t.label} className="rounded-lg bg-white/10 p-3 backdrop-blur-sm border border-white/10">
                          <div className="flex items-center gap-1 text-lg">{t.icon} <span className={`text-xs font-bold ${reached ? 'text-yellow-200' : 'text-white/60'}`}>{t.label}</span></div>
                          <p className="mt-1 text-[10px] text-white/70">{t.min.toLocaleString()}+ pts</p>
                          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                            <div className="h-full rounded-full bg-yellow-300" style={{ width: `${reached && !nextTierMin ? 100 : (reached && nextTierMin ? progress : !reached ? 0 : progress)}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Rewards Shop</h2>
                      <p className="mt-1 text-sm text-gray-600">Redeem points for discounts and perks on your next order.</p>
                    </div>
                    <button onClick={() => refreshLoyalty()} className="text-red-600 hover:text-red-700 text-sm font-medium">Refresh</button>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {loyaltyRewards.map(rw => {
                      const pts = profile.loyaltySummary?.points || 0
                      const canAfford = pts >= rw.cost
                      return (
                        <div key={rw.reward} className={`rounded-xl border p-5 flex flex-col ${canAfford ? 'border-gray-200 bg-white hover:shadow-md hover:border-red-300' : 'border-gray-100 bg-gray-50 opacity-70'}`}>
                          <div className="flex items-start justify-between">
                            <Gift className="h-8 w-8 text-[#9f2f20]" />
                            <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700">{rw.cost.toLocaleString()} pts</span>
                          </div>
                          <h3 className="mt-4 text-lg font-bold text-gray-900">{rw.label}</h3>
                          <p className="mt-1 text-sm text-gray-600 flex-1 leading-5">{rw.description}</p>
                          <button onClick={() => redeemLoyaltyReward(rw.reward, rw.cost, rw.label)} disabled={!canAfford} className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition-colors ${canAfford ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}>
                            <TrendingUp className="w-4 h-4" /> {canAfford ? 'Redeem' : `Need ${rw.cost - pts} more pts`}
                          </button>
                        </div>
                      )
                    })}
                  </div>

                  {(profile.loyaltySummary?.redemptions || []).length > 0 && (
                    <>
                      <h3 className="mt-10 text-lg font-bold text-gray-900">Redemption history</h3>
                      <div className="mt-3 space-y-2">
                        {(profile.loyaltySummary?.redemptions || []).map((r: any) => (
                          <div key={r.id} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                            <div>
                              <p className="text-sm font-semibold text-gray-800">{r.rewardName || r.reward || 'Reward redeemed'}</p>
                              <p className="text-xs text-gray-500">{new Date(r.redeemedAt || r.createdAt).toLocaleString()}</p>
                            </div>
                            <p className="text-sm font-bold text-red-700">-{Number(r.pointsCost || r.points || 0).toLocaleString()} pts</p>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* NEW TICKET MODAL */}
      {showNewTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8">
          <form onSubmit={submitNewTicket} className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-950 px-6 py-5 text-white">
              <div>
                <h3 className="text-xl font-extrabold">Create Support Ticket</h3>
                <p className="text-sm text-gray-300 mt-0.5">Our team typically responds within one business day.</p>
              </div>
              <button type="button" onClick={() => setShowNewTicket(false)} className="rounded-lg p-2 text-gray-300 hover:bg-white/10 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-5 max-h-[72vh] overflow-y-auto">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">Category</label>
                  <select value={newTicket.category} onChange={e => setNewTicket(s => ({ ...s, category: e.target.value }))} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-500">
                    {['GENERAL_INQUIRY','SHIPPING','PAYMENTS','RETURNS','ORDERS','PRODUCTS','ACCOUNT','TECHNICAL','WHOLESALE','FEEDBACK'].map(c => (
                      <option key={c} value={c}>{categoryLabel(c)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">Priority</label>
                  <select value={newTicket.priority} onChange={e => setNewTicket(s => ({ ...s, priority: e.target.value as any }))} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-500">
                    <option value="LOW">Low — General Question</option>
                    <option value="MEDIUM">Medium — Needs Response</option>
                    <option value="HIGH">High — Affecting Order</option>
                    <option value="URGENT">Urgent — Time-Sensitive</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">Subject</label>
                <input type="text" required value={newTicket.subject} onChange={e => setNewTicket(s => ({ ...s, subject: e.target.value }))} placeholder="Brief summary of the issue" className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-500" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">Message</label>
                <textarea rows={6} required value={newTicket.message} onChange={e => setNewTicket(s => ({ ...s, message: e.target.value }))} placeholder="Include order numbers, product links, and any details that can help us respond quickly." className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-500" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4 bg-gray-50">
              <button type="button" onClick={() => setShowNewTicket(false)} className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-100">Cancel</button>
              <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-700">
                <Send className="w-4 h-4" /> Submit Ticket
              </button>
            </div>
          </form>
        </div>
      )}

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
