import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Camera, User, Mail, Phone, ShoppingBag, Heart, Package, Settings, MapPin, Eye, EyeOff, Upload, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { ordersApi, userApi, wishlistApi } from '../services/buyerApi';
import { useConfirmationDialog } from '../hooks/useConfirmationDialog';
import ConfirmationDialog from '../components/ui/ConfirmationDialog';
import { useLanguage } from '../contexts/LanguageContext';
import { getApiHost } from '../services/api';

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
}

const ProfilePage: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'orders' | 'wishlist' | 'settings'>('orders');
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { isOpen, options, handleConfirm, handleCancel } = useConfirmationDialog();
  const API_HOST = getApiHost()

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        const [profileResponse, ordersResponse, wishlistResponse] = await Promise.all([
          userApi.getProfile(),
          ordersApi.getMyOrders().catch(() => ({ orders: [] })),
          wishlistApi.getWishlist().catch(() => ({ wishlist: { items: [] } }))
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
            createdAt: order.createdAt
          })),
          wishlist: (wishlistResponse.wishlist?.items || []).map((item: any) => ({
            id: item.id,
            product: {
              id: item.product.id,
              name: item.product.name,
              price: Number(item.product.price) || 0,
              images: item.product.images || item.product.productImages?.map((image: any) => image.url) || []
            }
          }))
        });
      } catch {
        toast.error('Could not load your profile')
      } finally {
        setLoading(false);
      }
    }

    fetchProfile()
  }, [user, navigate]);

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'orders' || tab === 'wishlist' || tab === 'settings') {
      setActiveTab(tab)
    }
  }, [searchParams])

  
  const handleViewOrder = (orderId: string) => {
    navigate(`/order-tracking/${orderId}`);
  };

  const handleViewProduct = (productId: string) => {
    navigate(`/product/${productId}`);
  };

  const handleRemoveFromWishlist = (productId: string) => {
    if (!window.confirm('Remove this item from your wishlist?')) return

    wishlistApi.removeFromWishlist(productId).then(() => {
      if (!profile) return
      setProfile({
        ...profile,
        wishlist: profile.wishlist.filter(item => item.product.id !== productId)
      });
      toast.success('Removed from wishlist');
    }).catch(() => toast.error('Could not remove wishlist item'))
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !profile) return
    setSaving(true)
    try {
      const response = await userApi.updateAvatar(file)
      setProfile({ ...profile, avatar: response.avatar })
      toast.success('Profile picture updated')
    } catch {
      toast.error('Could not update profile picture')
    } finally {
      setSaving(false)
    }
  }

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser')
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        try {
          // Reverse geocode to get address
          const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`)
          const data = await response.json()
          const address = `${data.city}, ${data.countryName}`
          
          setProfile(prev => prev ? {
            ...prev,
            location: { latitude, longitude, address },
            address
          } : null)
          toast.success('Location updated')
        } catch {
          setProfile(prev => prev ? {
            ...prev,
            location: { latitude, longitude, address: `${latitude}, ${longitude}` },
            address: `${latitude}, ${longitude}`
          } : null)
          toast.success('Location coordinates saved')
        }
      },
      (error) => {
        toast.error('Could not get your location: ' + error.message)
      }
    )
  }

  const handlePasswordChange = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('Please fill all password fields');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setSaving(true);
    try {
      await userApi.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      toast.success('Password changed successfully');
      setShowPasswordChange(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      toast.error('Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    try {
      // Get user data
      const userData = await userApi.getProfile();
      
      // Get user orders
      const ordersData = await ordersApi.getMyOrders();
      
      // Get user wishlist
      const wishlistData = await wishlistApi.getWishlist();
      
      // Create export data object
      const exportData = {
        profile: userData.user,
        orders: ordersData.orders || [],
        wishlist: wishlistData.wishlist?.items || [],
        exportDate: new Date().toISOString()
      };
      
      // Create and download JSON file
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `my-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Your data has been exported successfully');
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  const handleProfileImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || !profile) return

    setSaving(true)
    try {
      const uploadedUrls: string[] = []
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        // Here you would upload to your image service
        // For now, we'll simulate with a placeholder
        uploadedUrls.push(URL.createObjectURL(file))
      }
      
      setProfile({
        ...profile,
        profileImages: [...(profile.profileImages || []), ...uploadedUrls]
      })
      toast.success(t('profile.profileImagesUploaded'))
    } catch {
      toast.error(t('profile.couldNotUploadImages'))
    } finally {
      setSaving(false)
    }
  }

  const removeProfileImage = (index: number) => {
    if (!profile) return
    setProfile({
      ...profile,
      profileImages: profile.profileImages?.filter((_, i) => i !== index)
    })
  }

  const handleDietChange = (diet: string, checked: boolean) => {
    if (!profile) return
    const currentDiets = profile.favoriteDiets || []
    const newDiets = checked 
      ? [...currentDiets, diet]
      : currentDiets.filter(d => d !== diet)
    
    setProfile({
      ...profile,
      favoriteDiets: newDiets
    })
  }

  const saveProfile = async () => {
    if (!profile) return
    setSaving(true)
    try {
      await userApi.updateProfile({
        name: profile.name,
        phone: profile.phone,
        preferredDeliveryLocation: profile.address,
        location: profile.location,
        favoriteDiets: profile.favoriteDiets,
        profileImages: profile.profileImages
      })
      toast.success('Profile saved')
    } catch {
      toast.error('Could not save profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Profile Not Found</h1>
          <button
            onClick={() => navigate('/')}
            className="text-blue-600 hover:text-blue-700"
          >
            Return to Home
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
                    activeTab === 'orders' 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Package className="w-5 h-5" />
                  <span>My Orders</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('wishlist')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left ${
                    activeTab === 'wishlist' 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Heart className="w-5 h-5" />
                  <span>Wishlist</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left ${
                    activeTab === 'settings' 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Settings className="w-5 h-5" />
                  <span>{t('profile.settings')}</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('profile.orderHistory')}</h2>
                
                {profile.orders.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">{t('profile.noOrdersYet')}</p>
                    <button
                      onClick={() => navigate('/shop')}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700"
                    >
                      {t('profile.startShopping')}
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
                              KES {order.totalAmount.toLocaleString()}
                            </p>
                          </div>
                          
                          <div className="text-right">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              order.status === 'DELIVERED' 
                                ? 'bg-green-100 text-green-800'
                                : order.status === 'OUT_FOR_DELIVERY'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {order.status.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handleViewOrder(order.id)}
                          className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          Track Order
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
                <h2 className="text-xl font-semibold text-gray-900 mb-4">My Wishlist</h2>
                
                {profile.wishlist.length === 0 ? (
                  <div className="text-center py-8">
                    <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Your wishlist is empty</p>
                    <button
                      onClick={() => navigate('/shop')}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700"
                    >
                      Browse Products
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {profile.wishlist.map((item) => (
                      <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="w-full h-40 object-cover rounded-lg mb-3"
                        />
                        
                        <h3 className="font-medium text-gray-900 mb-2">{item.product.name}</h3>
                        <p className="text-lg font-semibold text-gray-900 mb-3">
                          KES {item.product.price.toLocaleString()}
                        </p>
                        
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewProduct(item.product.id)}
                            className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-700"
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

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Settings</h2>
                
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={profile.email}
                          onChange={(event) => setProfile({ ...profile, email: event.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={profile.phone || ''}
                          onChange={(event) => setProfile({ ...profile, phone: event.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                            className="min-w-0 flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    
                    {/* Profile Images */}
                    <div className="mt-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Profile Images
                      </label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {profile.profileImages?.map((image, index) => (
                          <div key={index} className="relative">
                            <img src={image} alt={`Profile ${index + 1}`} className="w-20 h-20 object-cover rounded-lg" />
                            <button
                              onClick={() => removeProfileImage(index)}
                              className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <label className="inline-block cursor-pointer bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg">
                        <Upload className="w-4 h-4 inline mr-2" />
                        Upload Images
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleProfileImageUpload}
                          className="hidden"
                          disabled={saving}
                        />
                      </label>
                    </div>
                    
                    {/* Favorite Diets */}
                    <div className="mt-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Favorite Meat Types/Diets
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {['Beef', 'Chicken', 'Goat', 'Lamb/Mutton', 'Fish', 'Vegetarian'].map((diet) => (
                          <label key={diet} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={profile.favoriteDiets?.includes(diet) || false}
                              onChange={(e) => handleDietChange(diet, e.target.checked)}
                              className="mr-2"
                            />
                            {diet}
                          </label>
                        ))}
                      </div>
                    </div>
                    
                    <button onClick={saveProfile} disabled={saving} className="mt-4 rounded-lg bg-red-600 px-5 py-2 font-bold text-white hover:bg-red-700 disabled:opacity-60">
                      {saving ? 'Saving...' : 'Save Profile'}
                    </button>
                  </div>
                  
                  <div className="pt-6 border-t">
                    <h3 className="font-medium text-gray-900 mb-3">Account Actions</h3>
                    <div className="space-y-3">
                      <button 
                        onClick={() => setShowPasswordChange(!showPasswordChange)}
                        className="w-full text-left px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
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
                                  id="profile-current-password"
                                  name="currentPassword"
                                  type={showPassword ? 'text' : 'password'}
                                  autoComplete="current-password"
                                  value={passwordData.currentPassword}
                                  onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
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
                                  id="profile-new-password"
                                  name="newPassword"
                                  type={showNewPassword ? 'text' : 'password'}
                                  autoComplete="new-password"
                                  value={passwordData.newPassword}
                                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowNewPassword(!showNewPassword)}
                                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
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
                                  id="profile-confirm-password"
                                  name="confirmPassword"
                                  type={showConfirmPassword ? 'text' : 'password'}
                                  autoComplete="new-password"
                                  value={passwordData.confirmPassword}
                                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                                >
                                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                              </div>
                            </div>
                            
                            <div className="flex gap-2">
                              <button
                                onClick={handlePasswordChange}
                                disabled={saving}
                                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-60"
                              >
                                {saving ? 'Changing...' : 'Change Password'}
                              </button>
                              <button
                                onClick={() => setShowPasswordChange(false)}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <button 
                        onClick={handleExportData}
                        className="w-full text-left px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                      >
                        Export My Data
                      </button>
                      <button className="w-full text-left px-4 py-3 border border-red-300 rounded-lg text-red-600 hover:bg-red-50">
                        Delete Account
                      </button>
                    </div>
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
  );
};

export default ProfilePage;
