import { useState, useEffect, type FormEvent } from 'react'
import {
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  BarChart3, 
  Target, 
  DollarSign,
  MousePointer,
  TrendingUp,
  Play,
  Pause,
  Upload
} from 'lucide-react'
import toast from 'react-hot-toast'
import { adsApi } from '../services/adminApi'
import { resolveMediaUrl } from '../services/api'
import { useConfirmationDialog } from '../hooks/useConfirmationDialog'
import ConfirmationDialog from '../components/ui/ConfirmationDialog'

interface AdPlacement {
  id: string
  name: string
  type: string
  position: string
  size: { width: number; height: number }
  isActive: boolean
  schedule?: any
  targeting?: {
    creative?: {
      title?: string
      description?: string
      imageUrl?: string
      mediaUrl?: string
      mediaType?: 'image' | 'gif' | 'video' | 'audio' | 'sticker'
      shape?: 'rectangle' | 'square' | 'circle' | 'triangle'
      landingUrl?: string
      buttonText?: string
    }
    [key: string]: any
  }
  createdAt: string
  _count: {
    impressions: number
    clicks: number
  }
}

interface AdCampaign {
  id: string
  name: string
  advertiserId: string
  advertiser: {
    id: string
    name?: string
    username?: string
    email: string
  }
  budget: {
    total: number
    daily?: number
    cpc?: number
    cpm?: number
    cpa?: number
  }
  targeting?: any
  creative: {
    title: string
    description: string
    imageUrl?: string
    mediaUrl?: string
    mediaType?: 'image' | 'gif' | 'video' | 'audio' | 'sticker'
    stickerUrl?: string
    landingUrl: string
    buttonText?: string
  }
  isActive: boolean
  startDate: string
  endDate: string
  _count: {
    impressions: number
    clicks: number
    conversions: number
  }
}

interface AdAnalytics {
  period: string
  metrics: {
    impressions: number
    clicks: number
    conversions: number
    revenue: number
    ctr: number
    conversionRate: number
    cpm: number
    cpc: number
  }
  generatedAt: string
}

const AdManagement = () => {
  const [activeTab, setActiveTab] = useState<'placements' | 'campaigns' | 'analytics'>('placements')
  const [placements, setPlacements] = useState<AdPlacement[]>([])
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([])
  const [analytics, setAnalytics] = useState<AdAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPlacementModal, setShowPlacementModal] = useState(false)
  const [showCampaignModal, setShowCampaignModal] = useState(false)
  const [editingPlacement, setEditingPlacement] = useState<AdPlacement | null>(null)
  const [editingCampaign, setEditingCampaign] = useState<AdCampaign | null>(null)
  const [saving, setSaving] = useState(false)
  const { isOpen, options, confirm, handleConfirm, handleCancel } = useConfirmationDialog()
  const [placementForm, setPlacementForm] = useState({
    name: '',
    type: 'BANNER',
    position: 'homepage-top',
    width: 728,
    height: 90,
    isActive: true,
    mediaUrl: '',
    mediaType: 'image' as 'image' | 'gif' | 'video' | 'audio' | 'sticker',
    landingUrl: '/shop',
    buttonText: 'Shop now',
    shape: 'rectangle' as 'rectangle' | 'square' | 'circle' | 'triangle',
  })
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    title: '',
    description: '',
    imageUrl: '',
    mediaUrl: '',
    mediaType: 'image' as 'image' | 'gif' | 'video' | 'audio' | 'sticker',
    stickerUrl: '',
    landingUrl: '',
    buttonText: 'Shop now',
    totalBudget: 10000,
    dailyBudget: 1000,
    isActive: true,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  })

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const fetchData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'placements') {
        await fetchPlacements()
      } else if (activeTab === 'campaigns') {
        await fetchCampaigns()
      } else if (activeTab === 'analytics') {
        await fetchAnalytics()
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const fetchPlacements = async () => {
    const data = await adsApi.getPlacements()
    setPlacements(data.placements || [])
  }

  const fetchCampaigns = async () => {
    const data = await adsApi.getCampaigns()
    setCampaigns(data.campaigns || [])
  }

  const fetchAnalytics = async () => {
    const data = await adsApi.getAnalytics('30')
    setAnalytics(data)
  }

  const togglePlacementStatus = async (placementId: string, isActive: boolean) => {
    try {
      await adsApi.updatePlacement(placementId, { isActive: !isActive })
      await fetchPlacements()
      toast.success(`Placement ${isActive ? 'deactivated' : 'activated'} successfully`)
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update placement')
    }
  }

  const toggleCampaignStatus = async (campaignId: string, isActive: boolean) => {
    try {
      await adsApi.updateCampaign(campaignId, { isActive: !isActive })
      await fetchCampaigns()
      toast.success(`Campaign ${isActive ? 'paused' : 'activated'} successfully`)
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update campaign')
    }
  }

  const deletePlacement = async (placementId: string) => {
    const confirmed = await confirm({
      title: 'Delete ad placement',
      message: 'This will permanently remove the placement from your ad system. Do you want to continue?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
      icon: 'delete',
    })
    if (!confirmed) return

    try {
      await adsApi.deletePlacement(placementId)
      await fetchPlacements()
      toast.success('Placement deleted successfully')
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete placement')
    }
  }

  const deleteCampaign = async (campaignId: string) => {
    const confirmed = await confirm({
      title: 'Delete ad campaign',
      message: 'This will permanently remove the campaign and all its active creatives. Do you want to continue?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
      icon: 'delete',
    })
    if (!confirmed) return

    try {
      await adsApi.deleteCampaign(campaignId)
      await fetchCampaigns()
      toast.success('Campaign deleted successfully')
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete campaign')
    }
  }

  const openPlacementModal = (placement?: AdPlacement) => {
    setEditingPlacement(placement || null)
    setPlacementForm(placement ? {
      name: placement.name,
      type: placement.type,
      position: placement.position,
      width: Number(placement.size?.width || 728),
      height: Number(placement.size?.height || 90),
      isActive: placement.isActive,
      mediaUrl: placement.targeting?.creative?.mediaUrl || placement.targeting?.creative?.imageUrl || '',
      mediaType: placement.targeting?.creative?.mediaType || 'image',
      landingUrl: placement.targeting?.creative?.landingUrl || '/shop',
      buttonText: placement.targeting?.creative?.buttonText || 'Shop now',
      shape: placement.targeting?.creative?.shape || 'rectangle',
    } : {
      name: '',
      type: 'BANNER',
      position: 'homepage-top',
      width: 728,
      height: 90,
      isActive: true,
      mediaUrl: '',
      mediaType: 'image',
      landingUrl: '/shop',
      buttonText: 'Shop now',
      shape: 'rectangle',
    })
    setShowPlacementModal(true)
  }

  const uploadPlacementMedia = async (file?: File) => {
    if (!file) return
    setSaving(true)
    try {
      const uploaded = await adsApi.uploadMedia(file)
      const mediaUrl = resolveMediaUrl(uploaded.url)
      setPlacementForm((current) => ({
        ...current,
        mediaUrl,
        mediaType: uploaded.mediaType || (file.type.startsWith('video/') ? 'video' : file.type === 'image/gif' ? 'gif' : 'image'),
      }))
      toast.success('Placement media uploaded')
    } catch (error: any) {
      toast.error(error?.message || 'Could not upload placement media')
    } finally {
      setSaving(false)
    }
  }

  const openCampaignModal = (campaign?: AdCampaign) => {
    const creative = campaign?.creative || {} as AdCampaign['creative']
    setEditingCampaign(campaign || null)
    setCampaignForm(campaign ? {
      name: campaign.name,
      title: creative.title || '',
      description: creative.description || '',
      imageUrl: creative.imageUrl || '',
      mediaUrl: creative.mediaUrl || creative.imageUrl || '',
      mediaType: creative.mediaType || 'image',
      stickerUrl: creative.stickerUrl || '',
      landingUrl: creative.landingUrl || '',
      buttonText: creative.buttonText || 'Shop now',
      totalBudget: Number(campaign.budget?.total || 10000),
      dailyBudget: Number(campaign.budget?.daily || 1000),
      isActive: campaign.isActive,
      startDate: campaign.startDate.slice(0, 10),
      endDate: campaign.endDate.slice(0, 10),
    } : {
      name: '',
      title: '',
      description: '',
      imageUrl: '',
      mediaUrl: '',
      mediaType: 'image',
      stickerUrl: '',
      landingUrl: '',
      buttonText: 'Shop now',
      totalBudget: 10000,
      dailyBudget: 1000,
      isActive: true,
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    })
    setShowCampaignModal(true)
  }

  const uploadCampaignMedia = async (file?: File) => {
    if (!file) return
    setSaving(true)
    try {
      const uploaded = await adsApi.uploadMedia(file)
      const mediaUrl = resolveMediaUrl(uploaded.url)
      setCampaignForm((current) => ({
        ...current,
        mediaUrl,
        imageUrl: uploaded.mediaType === 'video' || uploaded.mediaType === 'audio' ? current.imageUrl : mediaUrl,
        mediaType: uploaded.mediaType || (file.type.startsWith('audio/') ? 'audio' : file.type.startsWith('video/') ? 'video' : file.type === 'image/gif' ? 'gif' : 'image'),
      }))
      toast.success('Ad media uploaded')
    } catch (error: any) {
      toast.error(error?.message || 'Could not upload ad media')
    } finally {
      setSaving(false)
    }
  }

  const handleCampaignMediaDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    uploadCampaignMedia(event.dataTransfer.files?.[0])
  }

  const createCentreScreenDemo = async () => {
    setSaving(true)
    try {
      const demoArtwork = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="640" height="640" viewBox="0 0 640 640"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#7f1d1d"/><stop offset="1" stop-color="#f59e0b"/></linearGradient></defs><rect width="640" height="640" fill="url(#g)"/><circle cx="320" cy="320" r="250" fill="#fff" fill-opacity=".12"/><text x="320" y="300" text-anchor="middle" font-family="Arial" font-size="58" font-weight="700" fill="white">WELCOME</text><text x="320" y="365" text-anchor="middle" font-family="Arial" font-size="28" fill="white">Your live ad is ready</text></svg>')}`
      await adsApi.createPlacement({
        name: 'Centre screen demo', type: 'POPUP', position: 'centre-screen-demo', size: { width: 480, height: 480 }, isActive: true,
        targeting: { creative: { title: 'Welcome to Hincton', description: 'This is a live, admin-controlled test ad.', mediaUrl: demoArtwork, imageUrl: demoArtwork, mediaType: 'image', shape: 'rectangle', landingUrl: '/shop', buttonText: 'Explore shop' } }
      })
      await fetchPlacements()
      toast.success('Centre-screen test ad created. You can delete it here any time.')
    } catch (error: any) {
      toast.error(error?.message || 'Could not create the test ad')
    } finally {
      setSaving(false)
    }
  }

  const savePlacement = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    try {
      const payload = {
        name: placementForm.name,
        type: placementForm.type,
        position: placementForm.position,
        size: { width: Number(placementForm.width), height: Number(placementForm.height) },
        isActive: placementForm.isActive,
        targeting: placementForm.mediaUrl ? {
          ...(editingPlacement?.targeting || {}),
          creative: {
            title: placementForm.name,
            description: '',
            imageUrl: placementForm.mediaType === 'video' || placementForm.mediaType === 'audio' ? undefined : placementForm.mediaUrl,
            mediaUrl: placementForm.mediaUrl,
            mediaType: placementForm.mediaType,
            landingUrl: placementForm.landingUrl || '/shop',
            buttonText: placementForm.buttonText || 'Shop now',
            shape: placementForm.shape,
          },
        } : editingPlacement?.targeting,
      }

      if (editingPlacement) {
        await adsApi.updatePlacement(editingPlacement.id, payload)
        toast.success('Ad placement updated successfully')
      } else {
        await adsApi.createPlacement(payload)
        toast.success('Ad placement created successfully')
      }

      setShowPlacementModal(false)
      await fetchPlacements()
    } catch (error: any) {
      toast.error(error?.message || 'Could not save ad placement')
    } finally {
      setSaving(false)
    }
  }

  const saveCampaign = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    try {
      const startDate = new Date(`${campaignForm.startDate}T00:00:00.000Z`)
      const endDate = new Date(`${campaignForm.endDate}T23:59:59.999Z`)
      const payload = {
        name: campaignForm.name,
        budget: {
          total: Number(campaignForm.totalBudget),
          daily: Number(campaignForm.dailyBudget),
        },
        creative: {
          title: campaignForm.title,
          description: campaignForm.description,
          imageUrl: campaignForm.imageUrl || campaignForm.mediaUrl || undefined,
          mediaUrl: campaignForm.mediaUrl || campaignForm.imageUrl || undefined,
          mediaType: campaignForm.mediaType,
          stickerUrl: campaignForm.stickerUrl || undefined,
          landingUrl: campaignForm.landingUrl,
          buttonText: campaignForm.buttonText,
        },
        isActive: campaignForm.isActive,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      }

      if (editingCampaign) {
        await adsApi.updateCampaign(editingCampaign.id, payload)
        toast.success('Ad campaign updated successfully')
      } else {
        await adsApi.createCampaign(payload)
        toast.success('Ad campaign created successfully')
      }

      setShowCampaignModal(false)
      await fetchCampaigns()
    } catch (error: any) {
      toast.error(error?.message || 'Could not save ad campaign')
    } finally {
      setSaving(false)
    }
  }

  const renderPlacements = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Ad Placements</h2>
        <div className="flex flex-wrap justify-end gap-2">
          <button onClick={createCentreScreenDemo} disabled={saving} className="rounded-lg border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700 hover:bg-violet-100 disabled:opacity-60">Create test popup</button>
          <button
            onClick={() => openPlacementModal()}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Placement
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {placements.map((placement) => (
          <div key={placement.id} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">{placement.name}</h3>
                <p className="text-sm text-gray-500">{placement.type}</p>
              </div>
              <button
                onClick={() => togglePlacementStatus(placement.id, placement.isActive)}
                className={`p-2 rounded-lg ${placement.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}
              >
                {placement.isActive ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Size:</span>
                <span className="font-medium">{placement.size.width}×{placement.size.height}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Position:</span>
                <span className="font-medium">{placement.position}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Impressions:</span>
                <span className="font-medium">{placement._count.impressions.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Clicks:</span>
                <span className="font-medium">{placement._count.clicks.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">CTR:</span>
                <span className="font-medium">
                  {placement._count.impressions > 0 
                    ? ((placement._count.clicks / placement._count.impressions) * 100).toFixed(2)
                    : '0.00'}%
                </span>
              </div>
              {placement.targeting?.creative?.mediaUrl && (
                <div className="overflow-hidden rounded border border-gray-200 bg-gray-50">
                  {placement.targeting.creative.mediaType === 'video' ? (
                    <video src={resolveMediaUrl(placement.targeting.creative.mediaUrl)} className="h-28 w-full object-cover" muted controls />
                  ) : (
                    <img src={resolveMediaUrl(placement.targeting.creative.mediaUrl)} alt={`${placement.name} creative`} className="h-28 w-full object-cover" />
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 mt-4 pt-4 border-t">
              <button
                onClick={() => openPlacementModal(placement)}
                className="flex-1 flex items-center justify-center gap-1 text-blue-600 hover:text-blue-700"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => deletePlacement(placement.id)}
                className="flex-1 flex items-center justify-center gap-1 text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderCampaigns = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Ad Campaigns</h2>
        <button
          onClick={() => openCampaignModal()}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Campaign
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-4 font-medium text-gray-900">Campaign</th>
              <th className="text-left p-4 font-medium text-gray-900">Advertiser</th>
              <th className="text-left p-4 font-medium text-gray-900">Budget</th>
              <th className="text-left p-4 font-medium text-gray-900">Performance</th>
              <th className="text-left p-4 font-medium text-gray-900">Status</th>
              <th className="text-left p-4 font-medium text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((campaign) => (
              <tr key={campaign.id} className="border-b">
                <td className="p-4">
                  <div>
                    <p className="font-medium text-gray-900">{campaign.name}</p>
                    <p className="text-sm text-gray-500">{campaign.creative.title}</p>
                  </div>
                </td>
                <td className="p-4">
                  <div>
                    <p className="font-medium text-gray-900">{campaign.advertiser.name || campaign.advertiser.username || campaign.advertiser.email}</p>
                    <p className="text-sm text-gray-500">{campaign.advertiser.email}</p>
                  </div>
                </td>
                <td className="p-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="font-medium">${campaign.budget.total.toLocaleString()}</span>
                    </div>
                    {campaign.budget.daily && (
                      <p className="text-sm text-gray-500">${campaign.budget.daily}/day</p>
                    )}
                  </div>
                </td>
                <td className="p-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">{campaign._count.impressions.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MousePointer className="w-4 h-4 text-green-600" />
                      <span className="text-sm">{campaign._count.clicks.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-purple-600" />
                      <span className="text-sm">{campaign._count.conversions}</span>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <button
                    onClick={() => toggleCampaignStatus(campaign.id, campaign.isActive)}
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      campaign.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {campaign.isActive ? 'Active' : 'Paused'}
                  </button>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openCampaignModal(campaign)}
                      className="p-1 text-blue-600 hover:text-blue-700"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteCampaign(campaign.id)}
                      className="p-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderAnalytics = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Ad Analytics</h2>
      
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Eye className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Impressions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.metrics.impressions.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <MousePointer className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-500">Clicks</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.metrics.clicks.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-500">Conversions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.metrics.conversions.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-500">Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${analytics.metrics.revenue.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Click-Through Rate (CTR)</p>
              <p className="text-xl font-bold text-gray-900">{analytics.metrics.ctr}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Conversion Rate</p>
              <p className="text-xl font-bold text-gray-900">{analytics.metrics.conversionRate}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Cost Per Click (CPC)</p>
              <p className="text-xl font-bold text-gray-900">${analytics.metrics.cpc}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('placements')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'placements'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Target className="w-4 h-4 inline mr-2" />
            Placements
          </button>
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'campaigns'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <BarChart3 className="w-4 h-4 inline mr-2" />
            Campaigns
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'analytics'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <BarChart3 className="w-4 h-4 inline mr-2" />
            Analytics
          </button>
        </nav>
      </div>

      {activeTab === 'placements' && renderPlacements()}
      {activeTab === 'campaigns' && renderCampaigns()}
      {activeTab === 'analytics' && renderAnalytics()}

      {showPlacementModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <form onSubmit={savePlacement} className="bg-white rounded-lg p-6 max-w-lg w-full space-y-4">
            <h3 className="text-lg font-semibold">{editingPlacement ? 'Edit Ad Placement' : 'Add Ad Placement'}</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input required value={placementForm.name} onChange={(event) => setPlacementForm({ ...placementForm, name: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <select value={placementForm.type} onChange={(event) => setPlacementForm({ ...placementForm, type: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2">
                  {['BANNER', 'SIDEBAR', 'FOOTER', 'HEADER', 'IN_CONTENT', 'POPUP', 'VIDEO'].map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Position</label>
                <input required value={placementForm.position} onChange={(event) => setPlacementForm({ ...placementForm, position: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Display shape</label>
              <select value={placementForm.shape} onChange={(event) => setPlacementForm({ ...placementForm, shape: event.target.value as typeof placementForm.shape })} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2">
                <option value="rectangle">Rectangle</option><option value="square">Square</option><option value="circle">Circle</option><option value="triangle">Triangle</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">Works for images, GIFs, videos, audio, and stickers. POPUP placements open in the centre of the screen.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Width</label>
                <input required type="number" min="1" value={placementForm.width} onChange={(event) => setPlacementForm({ ...placementForm, width: Number(event.target.value) })} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Height</label>
                <input required type="number" min="1" value={placementForm.height} onChange={(event) => setPlacementForm({ ...placementForm, height: Number(event.target.value) })} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={placementForm.isActive} onChange={(event) => setPlacementForm({ ...placementForm, isActive: event.target.checked })} />
              Active
            </label>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_10rem]">
              <div>
                <label className="block text-sm font-medium text-gray-700">Image or video URL</label>
                <input value={placementForm.mediaUrl} onChange={(event) => setPlacementForm({ ...placementForm, mediaUrl: event.target.value })} placeholder="Upload below or paste a media URL" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Media type</label>
                <select value={placementForm.mediaType} onChange={(event) => setPlacementForm({ ...placementForm, mediaType: event.target.value as any })} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2">
                  {['image', 'gif', 'video', 'audio', 'sticker'].map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <input value={placementForm.landingUrl} onChange={(event) => setPlacementForm({ ...placementForm, landingUrl: event.target.value })} placeholder="/shop or https://example.com" className="rounded-lg border border-gray-300 px-3 py-2" />
              <input value={placementForm.buttonText} onChange={(event) => setPlacementForm({ ...placementForm, buttonText: event.target.value })} placeholder="Button text" className="rounded-lg border border-gray-300 px-3 py-2" />
            </div>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-5 text-sm font-medium text-gray-700 hover:border-blue-400 hover:bg-blue-50">
              <Upload className="h-5 w-5" />
              Upload placement image or video
              <input type="file" accept="image/*,video/*" onChange={(event) => uploadPlacementMedia(event.target.files?.[0])} className="hidden" />
            </label>
            {placementForm.mediaUrl && (
              <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                {placementForm.mediaType === 'video' ? (
                  <video src={placementForm.mediaUrl} controls className="h-40 w-full object-cover" />
                ) : (
                  <img src={placementForm.mediaUrl} alt="Placement media preview" className="h-40 w-full object-cover" />
                )}
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowPlacementModal(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50">Cancel</button>
              <button disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60">{saving ? 'Saving...' : 'Save placement'}</button>
            </div>
          </form>
        </div>
      )}

      {showCampaignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <form onSubmit={saveCampaign} className="max-h-[90vh] overflow-y-auto bg-white rounded-lg p-6 max-w-2xl w-full space-y-4">
            <h3 className="text-lg font-semibold">{editingCampaign ? 'Edit Ad Campaign' : 'Add Ad Campaign'}</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Campaign name</label>
                <input required value={campaignForm.name} onChange={(event) => setCampaignForm({ ...campaignForm, name: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Button text</label>
                <input value={campaignForm.buttonText} onChange={(event) => setCampaignForm({ ...campaignForm, buttonText: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Creative title</label>
              <input required value={campaignForm.title} onChange={(event) => setCampaignForm({ ...campaignForm, title: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea required value={campaignForm.description} onChange={(event) => setCampaignForm({ ...campaignForm, description: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" rows={3} />
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Landing URL</label>
                <input required type="text" value={campaignForm.landingUrl} onChange={(event) => setCampaignForm({ ...campaignForm, landingUrl: event.target.value })} placeholder="/shop or https://example.com" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Media URL</label>
                <input type="url" value={campaignForm.mediaUrl} onChange={(event) => setCampaignForm({ ...campaignForm, mediaUrl: event.target.value, imageUrl: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_12rem]">
              <div>
                <span className="block text-sm font-medium text-gray-700">Upload image, WebP, GIF, sticker, video, or audio</span>
                <label
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={handleCampaignMediaDrop}
                  className="mt-1 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center hover:border-blue-400 hover:bg-blue-50"
                >
                  <Upload className="mb-2 h-6 w-6 text-gray-500" />
                  <span className="text-sm font-medium text-gray-800">Drop media here or browse</span>
                  <span className="mt-1 text-xs text-gray-500">Images, WebP, GIFs, stickers, MP4/WebM video, or audio up to 50MB</span>
                  <input type="file" accept="image/*,image/webp,video/*,video/webm,audio/*" onChange={(event) => uploadCampaignMedia(event.target.files?.[0])} className="hidden" />
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Media type</label>
                <select value={campaignForm.mediaType} onChange={(event) => setCampaignForm({ ...campaignForm, mediaType: event.target.value as any })} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2">
                  {['image', 'gif', 'video', 'audio', 'sticker'].map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
            </div>
            {campaignForm.mediaUrl && (
              <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                {campaignForm.mediaType === 'audio' ? (
                  <div className="p-4">
                    <audio src={campaignForm.mediaUrl} controls className="w-full" />
                  </div>
                ) : campaignForm.mediaType === 'video' ? (
                  <video src={campaignForm.mediaUrl} controls className="h-48 w-full object-cover" />
                ) : (
                  <img src={campaignForm.mediaUrl} alt="Ad media preview" className="h-48 w-full object-cover" />
                )}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700">Optional sticker URL</label>
              <input type="url" value={campaignForm.stickerUrl} onChange={(event) => setCampaignForm({ ...campaignForm, stickerUrl: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" />
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Total budget</label>
                <input required type="number" min="1" value={campaignForm.totalBudget} onChange={(event) => setCampaignForm({ ...campaignForm, totalBudget: Number(event.target.value) })} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Daily budget</label>
                <input type="number" min="0" value={campaignForm.dailyBudget} onChange={(event) => setCampaignForm({ ...campaignForm, dailyBudget: Number(event.target.value) })} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Start date</label>
                <input required type="date" value={campaignForm.startDate} onChange={(event) => setCampaignForm({ ...campaignForm, startDate: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">End date</label>
                <input required type="date" value={campaignForm.endDate} onChange={(event) => setCampaignForm({ ...campaignForm, endDate: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={campaignForm.isActive} onChange={(event) => setCampaignForm({ ...campaignForm, isActive: event.target.checked })} />
              Active
            </label>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowCampaignModal(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50">Cancel</button>
              <button disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60">{saving ? 'Saving...' : 'Save campaign'}</button>
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

export default AdManagement
