import { FC, FormEvent, useState, useEffect } from 'react'
import { 
  QrCode, 
  Download,
  Copy, 
  Trash2, 
  Plus, 
  Edit, 
  Eye, 
  MapPin,
  Printer,
  Share2,

  BarChart3,
  X
} from 'lucide-react'
import QRCodeLib from 'qrcode'
import { qrCodesApi } from '../services/adminApi'
import { useConfirmationDialog } from '../hooks/useConfirmationDialog'
import ConfirmationDialog from '../components/ui/ConfirmationDialog'
import toast from 'react-hot-toast'

interface QRCode {
  id: string
  name: string
  type: 'product' | 'category' | 'discount' | 'cart' | 'checkout' | 'wishlist' | 'location' | 'support'
  destination: string
  customUrl?: string
  settings: {
    size: 'small' | 'medium' | 'large'
    color: string
    logo?: string
    expirationDate?: string
    maxScans?: number
  }
  analytics: {
    totalScans: number
    uniqueScanners: number
    firstScanDate: string
    lastScanDate: string
    avgScanDuration: number
    timeOfDayData: { hour: number; scans: number }[]
    deviceData: { device: string; percentage: number }[]
    locationData: { location: string; scans: number }[]
    conversionFromScan: number
    bounceRate: number
  }
  createdAt: string
  isActive: boolean
}

const QRCodeManager: FC = () => {
  const [qrCodes, setQrCodes] = useState<QRCode[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedQR, setSelectedQR] = useState<QRCode | null>(null)
  const [sharingQR, setSharingQR] = useState<QRCode | null>(null)
  const [previewQR, setPreviewQR] = useState<QRCode | null>(null)
  const [activeTab, setActiveTab] = useState<'list' | 'analytics'>('list')
  const { isOpen, options, confirm, handleConfirm, handleCancel } = useConfirmationDialog()

  useEffect(() => {
    fetchQRCodes()
  }, [])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      fetchQRCodes(false)
    }, 60000)
    return () => window.clearInterval(intervalId)
  }, [])

  useEffect(() => {
    if (!selectedQR) return
    const refreshed = qrCodes.find((qrCode) => qrCode.id === selectedQR.id)
    if (refreshed && refreshed !== selectedQR) setSelectedQR(refreshed)
  }, [qrCodes, selectedQR])

  const normalizeQRCode = (qr: any): QRCode => ({
    id: qr.id,
    name: qr.name,
    type: String(qr.type || 'product').toLowerCase() as QRCode['type'],
    destination: qr.destination || qr.referenceId || qr.url || '',
    customUrl: qr.customUrl || qr.url,
    settings: {
      size: qr.settings?.size || 'medium',
      color: qr.settings?.color || '#DC2626',
      logo: qr.settings?.logo,
      expirationDate: qr.settings?.expirationDate || qr.expiresAt,
      maxScans: qr.settings?.maxScans || qr.maxScans
    },
    analytics: qr.analytics || {
      totalScans: Array.isArray(qr.scans) ? qr.scans.length : Number(qr.scans || 0),
      uniqueScanners: Array.isArray(qr.scans) ? qr.scans.length : Number(qr.scans || 0),
      firstScanDate: qr.createdAt,
      lastScanDate: qr.updatedAt || qr.createdAt,
      avgScanDuration: 0,
      timeOfDayData: [],
      deviceData: [],
      locationData: [],
      conversionFromScan: 0,
      bounceRate: 0
    },
    createdAt: qr.createdAt,
    isActive: qr.isActive
  })

  const fetchQRCodes = async (showLoading = true) => {
    if (showLoading) setLoading(true)
    try {
      const data = await qrCodesApi.getQRCodes()
      setQrCodes((data.qrCodes || []).map(normalizeQRCode))
    } catch (error) {
      console.error('Failed to fetch QR codes:', error)
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  const generateQRCode = async (qrData: Partial<QRCode>) => {
    try {
      // Transform component data to API format
      const apiData = {
        name: qrData.name,
        type: qrData.type,
        destination: qrData.destination,
        customUrl: qrData.customUrl,
        settings: qrData.settings,
        isActive: true
      }
      const response = await qrCodesApi.createQRCode(apiData)
      const newQR = normalizeQRCode(response.qrCode)
      setQrCodes(prev => [newQR, ...prev])
      setShowCreateModal(false)
    } catch (error) {
      console.error('Failed to generate QR code:', error)
    }
  }

  const getQRDataUrl = (qrCode: QRCode) => {
    const qrData = qrCodesApi.getScanUrl(qrCode.id)
    const size = qrCode.settings.size === 'small' ? 128 : qrCode.settings.size === 'medium' ? 256 : 512
    return QRCodeLib.toDataURL(qrData, {
      width: size,
      margin: 2,
      color: {
        dark: qrCode.settings.color,
        light: '#FFFFFF'
      }
    })
  }

  const downloadQRCode = async (qrCode: QRCode, format: 'png' | 'svg' | 'pdf' = 'png') => {
    try {
      const qrData = qrCodesApi.getScanUrl(qrCode.id)
      const size = qrCode.settings.size === 'small' ? 128 : qrCode.settings.size === 'medium' ? 256 : 512
      const baseName = `qrcode-${qrCode.id}-${qrCode.name.replace(/\s+/g, '-').toLowerCase()}`
      const dataUrl = format === 'svg'
        ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(await QRCodeLib.toString(qrData, { type: 'svg', width: size, margin: 2, color: { dark: qrCode.settings.color, light: '#FFFFFF' } }))}`
        : await getQRDataUrl(qrCode)
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = `${baseName}.${format === 'svg' ? 'svg' : 'png'}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('QR image downloaded')
    } catch (error: any) {
      toast.error(error?.message || 'Could not download QR image')
    }
  }

  const printQRCode = async (qrCode: QRCode) => {
    const qrData = qrCodesApi.getScanUrl(qrCode.id)
    const size = qrCode.settings.size === 'small' ? 128 : qrCode.settings.size === 'medium' ? 256 : 512
    try {
      const url = await QRCodeLib.toDataURL(qrData, { width: size, margin: 2, color: { dark: qrCode.settings.color, light: '#FFFFFF' } })
      const printWindow = window.open('', '_blank', 'noopener,noreferrer')
      if (!printWindow) {
        toast.error('Allow popups to print this QR code')
        return
      }
      printWindow.document.write(`<html><head><title>${qrCode.name}</title></head><body style="font-family:sans-serif;text-align:center;padding:32px"><h1>${qrCode.name}</h1><img src="${url}" width="${size}" height="${size}" /><p style="word-break:break-all">${qrData}</p><script>setTimeout(()=>{window.focus();window.print()},250)</script></body></html>`)
      printWindow.document.close()
    } catch (error: any) {
      toast.error(error?.message || 'Could not print QR code')
    }
  }

  const shareQRCode = async (qrCode: QRCode) => {
    const url = qrCodesApi.getScanUrl(qrCode.id)
    if (navigator.share) {
      await navigator.share({ title: qrCode.name, text: qrCode.name, url })
      return
    }
    setSharingQR(qrCode)
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Copied to clipboard')
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      toast.success('Copied to clipboard')
    }
  }

  const deleteQRCode = async (qrId: string) => {
    const qrCode = qrCodes.find(qr => qr.id === qrId)
    const confirmed = await confirm({
      title: 'Delete QR Code',
      message: `Are you sure you want to delete "${qrCode?.name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
      icon: 'delete'
    })

    if (!confirmed) return

    try {
      await qrCodesApi.deleteQRCode(qrId)
      setQrCodes(prev => prev.filter(qr => qr.id !== qrId))
    } catch (error) {
      console.error('Failed to delete QR code:', error)
    }
  }

  const duplicateQRCode = async (qrCode: QRCode) => {
    try {
      const duplicateQR = {
        name: `${qrCode.name} (Copy)`,
        type: qrCode.type,
        destination: qrCode.destination,
        customUrl: qrCode.customUrl,
        settings: qrCode.settings,
        isActive: true,
      }
      const response = await qrCodesApi.createQRCode(duplicateQR)
      setQrCodes(prev => [normalizeQRCode(response.qrCode), ...prev])
      toast.success('QR code duplicated')
    } catch (error) {
      console.error('Failed to duplicate QR code:', error)
      toast.error('Could not duplicate QR code')
    }
  }

  const getQRTypeLabel = (type: string) => {
    switch (type) {
      case 'product': return 'Product Page'
      case 'category': return 'Category'
      case 'discount': return 'Discount Coupon'
      case 'cart': return 'Shopping Cart'
      case 'checkout': return 'Checkout Page'
      case 'wishlist': return 'Wishlist'
      case 'location': return 'Store Location'
      case 'support': return 'Support Chat'
      default: return 'Custom URL'
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
    <>
      <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">QR Code Management</h1>
          <p className="text-gray-600">Generate, manage, and track QR codes for your store</p>
        </div>
        
        <div className="flex gap-4">
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Generate QR Code
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('list')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'list'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <QrCode className="w-4 h-4 inline mr-2" />
            QR Codes ({qrCodes.length})
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'analytics'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <BarChart3 className="w-4 h-4 inline mr-2" />
            Analytics
          </button>
        </nav>
      </div>

      {/* QR Codes List */}
      {activeTab === 'list' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    QR Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Destination
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Settings
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Analytics
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {qrCodes.map((qrCode) => (
                  <tr key={qrCode.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <QRPreview qrCode={qrCode} className="h-12 w-12 rounded border border-gray-200 bg-white p-1" />
                        <div>
                          <div className="font-medium text-gray-900">{qrCode.name}</div>
                          <div className="text-sm text-gray-500">{getQRTypeLabel(qrCode.type)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {qrCode.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {qrCode.destination}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="space-y-1">
                        <div>Size: {qrCode.settings.size}</div>
                        <div>Color: <span className="inline-block w-4 h-4 rounded" style={{ backgroundColor: qrCode.settings.color }}></span></div>
                        {qrCode.settings.expirationDate && (
                          <div>Expires: {new Date(qrCode.settings.expirationDate).toLocaleDateString()}</div>
                        )}
                        {qrCode.settings.maxScans && (
                          <div>Max scans: {qrCode.settings.maxScans}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="space-y-1">
                        <div>{qrCode.analytics.totalScans} scans</div>
                        <div>{qrCode.analytics.uniqueScanners} unique</div>
                        <div>Conversion: {qrCode.analytics.conversionFromScan}%</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        qrCode.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {qrCode.isActive ? 'Active' : 'Expired'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setPreviewQR(qrCode)}
                          className="text-gray-600 hover:text-gray-900"
                          title="View Analytics"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => copyToClipboard(qrCodesApi.getScanUrl(qrCode.id))}
                          className="text-green-600 hover:text-green-900"
                          title="Copy scan link"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => downloadQRCode(qrCode, 'png')}
                          className="text-blue-600 hover:text-blue-900"
                          title="Download PNG"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => printQRCode(qrCode)}
                          className="text-slate-600 hover:text-slate-900"
                          title="Print QR"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setSharingQR(qrCode)}
                          className="text-cyan-600 hover:text-cyan-900"
                          title="Share QR link"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => duplicateQRCode(qrCode)}
                          className="text-purple-600 hover:text-purple-900"
                          title="Duplicate"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedQR(qrCode)
                            setShowEditModal(true)
                          }}
                          className="text-orange-600 hover:text-orange-900"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteQRCode(qrCode.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
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
      )}

      {/* QR Analytics */}
      {activeTab === 'analytics' && selectedQR && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">QR Code Analytics</h2>
              <p className="text-gray-600">{selectedQR.name}</p>
            </div>
            <button
              onClick={() => setSelectedQR(null)}
              className="text-gray-600 hover:text-gray-900"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-3xl font-bold text-blue-900">{selectedQR.analytics.totalScans}</div>
              <div className="text-sm text-blue-600">Total Scans</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-3xl font-bold text-green-900">{selectedQR.analytics.uniqueScanners}</div>
              <div className="text-sm text-green-600">Unique Scanners</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <div className="text-3xl font-bold text-purple-900">{selectedQR.analytics.conversionFromScan}%</div>
              <div className="text-sm text-purple-600">Conversion Rate</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg text-center">
              <div className="text-3xl font-bold text-orange-900">{selectedQR.analytics.bounceRate}%</div>
              <div className="text-sm text-orange-600">Bounce Rate</div>
            </div>
          </div>

          {/* Time Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Time of Day Heatmap */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Scan Activity by Hour</h3>
              <div className="grid grid-cols-6 gap-2">
                {selectedQR.analytics.timeOfDayData.map((hour) => (
                  <div key={hour.hour} className="text-center">
                    <div className="text-xs text-gray-600 mb-1">{hour.hour}:00</div>
                    <div 
                      className="h-8 bg-red-500 rounded"
                      style={{ 
                        height: `${Math.max(4, (hour.scans / Math.max(...selectedQR.analytics.timeOfDayData.map(h => h.scans))) * 32)}px` 
                      }}
                    ></div>
                    <div className="text-xs text-gray-600">{hour.scans}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Device Breakdown */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Device Breakdown</h3>
              <div className="space-y-3">
                {selectedQR.analytics.deviceData.map((device) => (
                  <div key={device.device} className="flex justify-between items-center">
                    <span className="text-gray-700">{device.device}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 bg-blue-500 rounded-full"
                          style={{ width: `${device.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">{device.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Geographic Distribution */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Geographic Distribution</h3>
            <div className="space-y-3">
              {selectedQR.analytics.locationData.map((location) => (
                <div key={location.location} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-600" />
                    <span className="text-gray-700">{location.location}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">{location.scans} scans</div>
                    <div className="text-sm text-gray-600">
                      {((location.scans / selectedQR.analytics.totalScans) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Scan Timeline</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-700">First Scan:</span>
                <span className="text-gray-900">
                  {selectedQR.analytics.firstScanDate ? new Date(selectedQR.analytics.firstScanDate).toLocaleString() : 'No scans yet'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Last Scan:</span>
                <span className="text-gray-900">
                  {selectedQR.analytics.lastScanDate ? new Date(selectedQR.analytics.lastScanDate).toLocaleString() : 'No scans yet'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Avg Duration:</span>
                <span className="text-gray-900">{selectedQR.analytics.avgScanDuration}s</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create QR Code Modal */}
      {showCreateModal && (
        <QRCodeModal
          onClose={() => setShowCreateModal(false)}
          onSave={generateQRCode}
          mode="add"
        />
      )}

      {/* Edit QR Code Modal */}
      {showEditModal && selectedQR && (
        <QRCodeModal
          onClose={() => setShowEditModal(false)}
          onSave={async (updatedQR) => {
            const response = await qrCodesApi.updateQRCode(selectedQR.id, updatedQR)
            setQrCodes(prev => prev.map(qr => qr.id === selectedQR.id ? normalizeQRCode(response.qrCode) : qr))
            setShowEditModal(false)
            setSelectedQR(null)
          }}
          qrCode={selectedQR}
          mode="edit"
        />
      )}

      {sharingQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Share QR link</h3>
                <p className="text-sm text-gray-600">{sharingQR.name}</p>
              </div>
              <button type="button" onClick={() => setSharingQR(null)} className="rounded p-2 text-gray-500 hover:bg-gray-100">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 break-all">
              {qrCodesApi.getScanUrl(sharingQR.id)}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button type="button" onClick={() => copyToClipboard(qrCodesApi.getScanUrl(sharingQR.id))} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold hover:bg-gray-50">Copy link</button>
              <button type="button" onClick={() => shareQRCode(sharingQR)} className="rounded-lg bg-cyan-600 px-3 py-2 text-sm font-semibold text-white hover:bg-cyan-700">Device share</button>
              <a className="rounded-lg border border-gray-300 px-3 py-2 text-center text-sm font-semibold hover:bg-gray-50" href={`https://wa.me/?text=${encodeURIComponent(qrCodesApi.getScanUrl(sharingQR.id))}`} target="_blank" rel="noreferrer">WhatsApp</a>
              <a className="rounded-lg border border-gray-300 px-3 py-2 text-center text-sm font-semibold hover:bg-gray-50" href={`mailto:?subject=${encodeURIComponent(sharingQR.name)}&body=${encodeURIComponent(qrCodesApi.getScanUrl(sharingQR.id))}`}>Email</a>
            </div>
          </div>
        </div>
      )}

      {previewQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{previewQR.name}</h3>
                <p className="text-sm text-gray-600">{getQRTypeLabel(previewQR.type)} · {previewQR.destination}</p>
              </div>
              <button type="button" onClick={() => setPreviewQR(null)} className="rounded p-2 text-gray-500 hover:bg-gray-100">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex justify-center rounded-lg border border-gray-200 bg-white p-6">
              <QRPreview qrCode={previewQR} className="h-64 w-64 rounded bg-white object-contain" />
            </div>
            <div className="mt-4 break-all rounded bg-gray-50 p-3 text-sm text-gray-700">
              {qrCodesApi.getScanUrl(previewQR.id)}
            </div>
            <div className="mt-4 flex flex-wrap justify-end gap-3">
              <button type="button" onClick={() => copyToClipboard(qrCodesApi.getScanUrl(previewQR.id))} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold hover:bg-gray-50">Copy link</button>
              <button type="button" onClick={() => downloadQRCode(previewQR, 'png')} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700">Download PNG</button>
              <button type="button" onClick={() => printQRCode(previewQR)} className="rounded-lg bg-slate-700 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800">Print</button>
            </div>
          </div>
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
  </>
)
}

const QRPreview: FC<{ qrCode: QRCode; className?: string }> = ({ qrCode, className = '' }) => {
  const [src, setSrc] = useState('')

  useEffect(() => {
    let cancelled = false
    const size = qrCode.settings.size === 'small' ? 128 : qrCode.settings.size === 'medium' ? 256 : 512
    QRCodeLib.toDataURL(qrCodesApi.getScanUrl(qrCode.id), {
      width: size,
      margin: 2,
      color: {
        dark: qrCode.settings.color,
        light: '#FFFFFF'
      }
    }, (error, url) => {
      if (!cancelled && !error) setSrc(url)
    })
    return () => {
      cancelled = true
    }
  }, [qrCode.id, qrCode.settings.color, qrCode.settings.size])

  if (!src) {
    return <div className={`flex items-center justify-center text-lg ${className}`}>{getQRTypeFallback(qrCode.type)}</div>
  }

  return <img src={src} alt={`${qrCode.name} QR code`} className={className} />
}

const getQRTypeFallback = (type: string) => {
  switch (type) {
    case 'product': return 'P'
    case 'category': return 'C'
    case 'discount': return '%'
    case 'cart': return 'C'
    case 'checkout': return '$'
    case 'wishlist': return 'W'
    case 'location': return 'L'
    case 'support': return 'S'
    default: return 'Q'
  }
}

// QR Code Modal Component
interface QRCodeModalProps {
  onClose: () => void
  onSave: (qrData: Partial<QRCode>) => void | Promise<void>
  qrCode?: QRCode
  mode: 'add' | 'edit'
}

const QRCodeModal: FC<QRCodeModalProps> = ({ onClose, onSave, qrCode, mode = 'add' }) => {
  const [formData, setFormData] = useState({
    name: qrCode?.name || '',
    type: qrCode?.type || 'product' as QRCode['type'],
    destination: qrCode?.destination || '',
    customUrl: qrCode?.customUrl || '',
    settings: {
      size: qrCode?.settings?.size || 'medium' as QRCode['settings']['size'],
      color: qrCode?.settings?.color || '#DC2626',
      expirationDate: qrCode?.settings?.expirationDate || '',
      maxScans: qrCode?.settings?.maxScans || undefined
    }
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'add' ? 'Generate QR Code' : 'Edit QR Code'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <Trash2 className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                QR Code Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="e.g., Summer Sale QR Code"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as QRCode['type'] }))}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="product">Product Page</option>
                <option value="category">Category</option>
                <option value="discount">Discount Coupon</option>
                <option value="cart">Shopping Cart</option>
                <option value="checkout">Checkout Page</option>
                <option value="wishlist">Wishlist</option>
                <option value="location">Store Location</option>
                <option value="support">Support Chat</option>
              </select>
            </div>
          </div>

          {/* Destination */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Destination *
            </label>
            <input
              type="text"
              value={formData.destination}
              onChange={(e) => setFormData(prev => ({ ...prev, destination: e.target.value }))}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder={formData.type === 'product' ? '/products/product-name' : 
                       formData.type === 'category' ? '/categories/category-name' :
                       formData.type === 'discount' ? '/discount/CODE' :
                       formData.type === 'cart' ? '/cart' :
                       formData.type === 'checkout' ? '/checkout' :
                       formData.type === 'wishlist' ? '/wishlist' :
                       formData.type === 'location' ? '/locations/store-name' :
                       formData.type === 'support' ? '/support' : ''}
            />
          </div>

          {/* Custom URL (for discount codes) */}
          {formData.type === 'discount' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom URL (Optional)
              </label>
              <input
                type="url"
                value={formData.customUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, customUrl: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="https://yourstore.com/special-offer"
              />
            </div>
          )}

          {/* Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Size
              </label>
              <select
                value={formData.settings.size}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  settings: { ...prev.settings, size: e.target.value as QRCode['settings']['size'] }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="small">Small (128x128)</option>
                <option value="medium">Medium (256x256)</option>
                <option value="large">Large (512x512)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color
              </label>
              <input
                type="color"
                value={formData.settings.color}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  settings: { ...prev.settings, color: e.target.value }
                }))}
                className="w-full h-10 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expiration Date (Optional)
              </label>
              <input
                type="date"
                value={formData.settings.expirationDate}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  settings: { ...prev.settings, expirationDate: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Scans (Optional)
              </label>
              <input
                type="number"
                value={formData.settings.maxScans || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  settings: { ...prev.settings, maxScans: e.target.value ? Number(e.target.value) : undefined }
                }))}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Unlimited"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
            >
              <QrCode className="w-4 h-4" />
              {mode === 'add' ? 'Generate QR Code' : 'Update QR Code'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default QRCodeManager
