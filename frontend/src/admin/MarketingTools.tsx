import { useState, useEffect } from 'react'
import {
  Mail,
  MessageSquare,
  Plus,
  Eye,
  Trash2,
  ShoppingCart,
  Gift,
  Send,
  Zap,
  BarChart3,
  Share2,
  // other icons removed to satisfy lint
} from 'lucide-react'

import { formatPrice } from '../utils/currency'

interface MarketingToolsProps {}

interface Campaign {
  id: string
  name: string
  type: 'abandoned_cart' | 'referral' | 'flash_sale' | 'email' | 'social'
  status: 'active' | 'scheduled' | 'completed' | 'paused'
  settings: {
    discount?: number
    discountType?: 'percentage' | 'fixed'
    expiryDate?: string
    targetAudience?: string[]
    budget?: number
    autoSend?: boolean
  }
  performance: {
    sentCount: number
    openRate: number
    clickRate: number
    conversionRate: number
    revenue: number
    cost: number
    roi: number
  }
  createdAt: string
  lastSent?: string
}

interface AbandonedCart {
  id: string
  customerEmail: string
  customerName: string
  items: CartItem[]
  totalAmount: number
  abandonedAt: string
  recoveryEmailsSent: number
  recoveryStatus: 'pending' | 'sent' | 'recovered' | 'failed'
}

interface ReferralProgram {
  id: string
  name: string
  description: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  minOrderAmount: number
  maxDiscountAmount: number
  expiryDays: number
  isActive: boolean
  totalReferrals: number
  totalRewards: number
}

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image: string
}

const MarketingTools: React.FC<MarketingToolsProps> = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [abandonedCarts, setAbandonedCarts] = useState<AbandonedCart[]>([])
  const [referralProgram, setReferralProgram] = useState<ReferralProgram | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'campaigns' | 'abandoned_carts' | 'referrals'>('campaigns')
  const [showCreateModal, setShowCreateModal] = useState(false)
  // const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)


  useEffect(() => {
    fetchMarketingData()
  }, [])

  const fetchMarketingData = async () => {
    setLoading(true)
    try {
      // Mock API calls - replace with real marketing API
      const mockCampaigns: Campaign[] = [
        {
          id: '1',
          name: 'Summer Flash Sale',
          type: 'flash_sale',
          status: 'active',
          settings: {
            discount: 20,
            discountType: 'percentage',
            expiryDate: '2024-08-31',
            targetAudience: ['all_customers', 'returning_customers'],
            budget: 50000,
            autoSend: true
          },
          performance: {
            sentCount: 15420,
            openRate: 68.5,
            clickRate: 12.3,
            conversionRate: 8.7,
            revenue: 125000,
            cost: 25000,
            roi: 400
          },
          createdAt: '2024-07-01T10:00:00Z',
          lastSent: '2024-07-15T14:30:00Z'
        },
        {
          id: '2',
          name: 'Abandoned Cart Recovery',
          type: 'abandoned_cart',
          status: 'active',
          settings: {
            discount: 10,
            discountType: 'percentage',
            expiryDate: '2024-12-31',
            autoSend: true
          },
          performance: {
            sentCount: 850,
            openRate: 45.2,
            clickRate: 23.8,
            conversionRate: 18.5,
            revenue: 45000,
            cost: 8500,
            roi: 429
          },
          createdAt: '2024-06-15T09:00:00Z',
          lastSent: '2024-07-20T16:45:00Z'
        }
      ]

      const mockAbandonedCarts: AbandonedCart[] = [
        {
          id: '1',
          customerEmail: 'john.doe@example.com',
          customerName: 'John Doe',
          items: [
            {
              id: '1',
              name: 'Premium Wagyu Steak',
              price: 12500,
              quantity: 2,
              image: 'https://example.com/wagyu.jpg'
            },
            {
              id: '2',
              name: 'Fresh Chicken Breast',
              price: 2800,
              quantity: 1,
              image: 'https://example.com/chicken.jpg'
            }
          ],
          totalAmount: 37800,
          abandonedAt: '2024-07-20T14:30:00Z',
          recoveryEmailsSent: 2,
          recoveryStatus: 'sent'
        },
        {
          id: '2',
          customerEmail: 'jane.smith@example.com',
          customerName: 'Jane Smith',
          items: [
            {
              id: '3',
              name: 'Grass-Fed Beef',
              price: 8900,
              quantity: 1,
              image: 'https://example.com/beef.jpg'
            }
          ],
          totalAmount: 8900,
          abandonedAt: '2024-07-21T10:15:00Z',
          recoveryEmailsSent: 1,
          recoveryStatus: 'recovered'
        }
      ]

      const mockReferralProgram: ReferralProgram = {
        id: '1',
        name: 'Hincton Meat Products Referral Program',
        description: 'Share your love for fresh meat products and earn rewards!',
        discountType: 'percentage',
        discountValue: 10,
        minOrderAmount: 1000,
        maxDiscountAmount: 5000,
        expiryDays: 30,
        isActive: true,
        totalReferrals: 156,
        totalRewards: 78000
      }

      setCampaigns(mockCampaigns)
      setAbandonedCarts(mockAbandonedCarts)
      setReferralProgram(mockReferralProgram)
    } catch (error) {
      console.error('Failed to fetch marketing data:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendAbandonedCartEmail = async (cartId: string) => {
    try {
      // Mock API call to send recovery email
      console.log('Sending abandoned cart recovery email for cart:', cartId)
      
      setAbandonedCarts(prev => 
        prev.map(cart => 
          cart.id === cartId 
            ? { ...cart, recoveryEmailsSent: cart.recoveryEmailsSent + 1, recoveryStatus: 'sent' }
            : cart
        )
      )
      
      alert('Recovery email sent successfully!')
    } catch (error) {
      console.error('Failed to send recovery email:', error)
      alert('Failed to send recovery email')
    }
  }

  const generateReferralCode = async (userId: string) => {
    try {
      // Mock API call to generate referral code
      const referralCode = `REF-${userId}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      
      console.log('Generated referral code:', referralCode)
      alert(`Referral code generated: ${referralCode}`)
      
      return referralCode
    } catch (error) {
      console.error('Failed to generate referral code:', error)
      alert('Failed to generate referral code')
      return null
    }
  }

  const createCampaign = async (campaignData: Partial<Campaign>) => {
    try {
      // Mock API call to create campaign
      const newCampaign: Campaign = {
        id: Date.now().toString(),
        name: campaignData.name || 'New Campaign',
        type: campaignData.type || 'email',
        status: 'scheduled',
        settings: campaignData.settings || {},
        performance: {
          sentCount: 0,
          openRate: 0,
          clickRate: 0,
          conversionRate: 0,
          revenue: 0,
          cost: 0,
          roi: 0
        },
        createdAt: new Date().toISOString()
      }
      
      setCampaigns(prev => [newCampaign, ...prev])
      setShowCreateModal(false)
      
      console.log('Campaign created:', newCampaign)
      alert('Campaign created successfully!')
    } catch (error) {
      console.error('Failed to create campaign:', error)
      alert('Failed to create campaign')
    }
  }

  const getCampaignTypeIcon = (type: string) => {
    switch (type) {
      case 'abandoned_cart': return <ShoppingCart className="w-5 h-5" />
      case 'referral': return <Gift className="w-5 h-5" />
      case 'flash_sale': return <Zap className="w-5 h-5" />
      case 'email': return <Mail className="w-5 h-5" />
      case 'social': return <Share2 className="w-5 h-5" />
      default: return <MessageSquare className="w-5 h-5" />
    }
  }

  const getCampaignTypeColor = (type: string) => {
    switch (type) {
      case 'abandoned_cart': return 'bg-orange-100 text-orange-800'
      case 'referral': return 'bg-green-100 text-green-800'
      case 'flash_sale': return 'bg-red-100 text-red-800'
      case 'email': return 'bg-blue-100 text-blue-800'
      case 'social': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'scheduled': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'paused': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-4">
                <div className="h-32 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Marketing & Growth Tools</h1>
          <p className="text-gray-600">Drive sales and customer engagement with smart marketing</p>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Campaign
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'campaigns'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <BarChart3 className="w-4 h-4 inline mr-2" />
            Campaigns ({campaigns.length})
          </button>
          <button
            onClick={() => setActiveTab('abandoned_carts')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'abandoned_carts'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <ShoppingCart className="w-4 h-4 inline mr-2" />
            Abandoned Carts ({abandonedCarts.filter(cart => cart.recoveryStatus === 'pending').length})
          </button>
          <button
            onClick={() => setActiveTab('referrals')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'referrals'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Gift className="w-4 h-4 inline mr-2" />
            Referral Program
          </button>
        </nav>
      </div>

      {/* Campaigns Tab */}
      {activeTab === 'campaigns' && (
        <div className="space-y-6">
          {/* Campaign Performance Overview */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Campaign Performance</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg ${getCampaignTypeColor(campaign.type)}`}>
                        {getCampaignTypeIcon(campaign.type)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{campaign.name}</div>
                        <div className="text-sm text-gray-600">{campaign.type.replace('_', ' ')}</div>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(campaign.status)}`}>
                      {campaign.status.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Sent</div>
                      <div className="font-medium">{campaign.performance.sentCount.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Revenue</div>
                      <div className="font-medium">{formatPrice(campaign.performance.revenue)}</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm mt-3">
                    <div>
                      <div className="text-gray-600">Open Rate</div>
                      <div className="font-medium">{campaign.performance.openRate}%</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Conversion</div>
                      <div className="font-medium">{campaign.performance.conversionRate}%</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm mt-3">
                    <div>
                      <div className="text-gray-600">Cost</div>
                      <div className="font-medium">{formatPrice(campaign.performance.cost)}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">ROI</div>
                      <div className={`font-medium ${campaign.performance.roi > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {campaign.performance.roi > 0 ? '+' : ''}{campaign.performance.roi}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Abandoned Carts Tab */}
      {activeTab === 'abandoned_carts' && (
        <div className="space-y-6">
          {/* Abandoned Cart Statistics */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Abandoned Cart Recovery</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">
                  {abandonedCarts.filter(cart => cart.recoveryStatus === 'pending').length}
                </div>
                <div className="text-sm text-gray-600">Pending Recovery</div>
                <div className="text-xs text-gray-500">Emails not sent yet</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {abandonedCarts.filter(cart => cart.recoveryStatus === 'sent').length}
                </div>
                <div className="text-sm text-gray-600">Emails Sent</div>
                <div className="text-xs text-gray-500">Awaiting response</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {abandonedCarts.filter(cart => cart.recoveryStatus === 'recovered').length}
                </div>
                <div className="text-sm text-gray-600">Recovered</div>
                <div className="text-xs text-gray-500">Successful recovery</div>
              </div>
            </div>
          </div>

          {/* Abandoned Carts List */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Abandoned Carts</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Abandoned</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {abandonedCarts.map((cart) => (
                    <tr key={cart.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium text-gray-900">{cart.customerName}</div>
                          <div className="text-sm text-gray-600">{cart.customerEmail}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {cart.items.map((item, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-8 h-8 object-cover rounded"
                              />
                              <span>{item.name} x{item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">
                        {formatPrice(cart.totalAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(cart.abandonedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          cart.recoveryStatus === 'pending' ? 'bg-orange-100 text-orange-800' :
                          cart.recoveryStatus === 'sent' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {cart.recoveryStatus.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          {cart.recoveryStatus === 'pending' && (
                            <button
                              onClick={() => sendAbandonedCartEmail(cart.id)}
                              className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 flex items-center gap-1"
                            >
                              <Send className="w-3 h-3" />
                              Send Email
                            </button>
                          )}
                          <button
                            onClick={() => {
                              /* selection removed (unused state) */
                            }}

                            className="text-gray-600 hover:text-gray-900"
                            title="View Campaign Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Referral Program Tab */}
      {activeTab === 'referrals' && referralProgram && (
        <div className="space-y-6">
          {/* Referral Program Overview */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Referral Program</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{referralProgram.totalReferrals}</div>
                <div className="text-sm text-gray-600">Total Referrals</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{formatPrice(referralProgram.totalRewards)}</div>
                <div className="text-sm text-gray-600">Total Rewards</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{referralProgram.discountValue}%</div>
                <div className="text-sm text-gray-600">Discount</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">{formatPrice(referralProgram.minOrderAmount)}</div>
                <div className="text-sm text-gray-600">Min Order</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">{formatPrice(referralProgram.maxDiscountAmount)}</div>
                <div className="text-sm text-gray-600">Max Discount</div>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Program Details</h3>
              <div className="space-y-2 text-sm text-gray-700">
                <p><strong>Program:</strong> {referralProgram.name}</p>
                <p><strong>Description:</strong> {referralProgram.description}</p>
                <p><strong>Discount Type:</strong> {referralProgram.discountType === 'percentage' ? 'Percentage' : 'Fixed'} ({referralProgram.discountValue}{referralProgram.discountType === 'percentage' ? '%' : ' KSH'})</p>
                <p><strong>Expiry:</strong> {referralProgram.expiryDays} days after issue</p>
                <p><strong>Status:</strong> <span className={`px-2 py-1 text-xs font-medium rounded-full ${referralProgram.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{referralProgram.isActive ? 'Active' : 'Inactive'}</span></p>
              </div>
            </div>
          </div>

          {/* Generate Referral Code */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Generate Referral Code</h3>
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Enter user ID to generate code for"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
              <button
                onClick={() => generateReferralCode('user123')}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <Gift className="w-4 h-4" />
                Generate Code
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Create New Campaign</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <Trash2 className="w-6 h-6" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              const campaignData: Partial<Campaign> = {
                name: String(formData.get('name') || ''),

                type: formData.get('type') as Campaign['type'],
                settings: {
                  discount: formData.get('discount') ? Number(formData.get('discount')) : undefined,
                  discountType: String(formData.get('discountType') || '') as 'percentage' | 'fixed',
                  expiryDate: String(formData.get('expiryDate') || ''),
                  targetAudience: String(formData.get('targetAudience') || '')
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
                  budget: formData.get('budget') ? Number(formData.get('budget')) : undefined,
                  autoSend: formData.get('autoSend') === 'on' || formData.get('autoSend') === 'true'
                }
              }

              createCampaign(campaignData)
            }} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Campaign Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="e.g., Summer Flash Sale"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Campaign Type *
                  </label>
                  <select
                    name="type"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="abandoned_cart">Abandoned Cart Recovery</option>
                    <option value="referral">Referral Campaign</option>
                    <option value="flash_sale">Flash Sale</option>
                    <option value="email">Email Campaign</option>
                    <option value="social">Social Media Campaign</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount Amount
                  </label>
                  <input
                    type="number"
                    name="discount"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount Type
                  </label>
                  <select
                    name="discountType"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount (KSH)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expiration Date
                  </label>
                  <input
                    type="date"
                    name="expiryDate"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Audience
                  </label>
                  <input
                    type="text"
                    name="targetAudience"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="all_customers, returning_customers"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Budget (KSH)
                  </label>
                  <input
                    type="number"
                    name="budget"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="autoSend"
                      className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Auto Send Campaign</span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Create Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default MarketingTools
