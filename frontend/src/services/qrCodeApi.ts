import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Create axios instance with auth
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export interface QRCodeData {
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

export interface QRCodeAnalytics {
  qrCodeId: string
  scanCount: number
  deviceType: string
  location?: string
  timestamp: string
  userAgent?: string
  ipAddress?: string
}

export const qrCodeApi = {
  // Get all QR codes
  getQRCodes: async () => {
    const response = await api.get('/admin/qr-codes')
    return response.data
  },

  // Generate new QR code
  generateQRCode: async (qrData: QRCodeData) => {
    const response = await api.post('/admin/qr-codes/generate', qrData)
    return response.data
  },

  // Update QR code
  updateQRCode: async (id: string, qrData: Partial<QRCodeData>) => {
    const response = await api.put(`/admin/qr-codes/${id}`, qrData)
    return response.data
  },

  // Delete QR code
  deleteQRCode: async (id: string) => {
    const response = await api.delete(`/admin/qr-codes/${id}`)
    return response.data
  },

  // Get QR code analytics
  getQRCodeAnalytics: async (qrCodeId: string, dateRange?: string) => {
    const response = await api.get(`/admin/qr-codes/${qrCodeId}/analytics${dateRange ? `?range=${dateRange}` : ''}`)
    return response.data
  },

  // Record QR code scan
  recordQRScan: async (analytics: QRCodeAnalytics) => {
    const response = await api.post('/qr-codes/scan', analytics)
    return response.data
  },

  // Get QR code by ID
  getQRCodeById: async (id: string) => {
    const response = await api.get(`/admin/qr-codes/${id}`)
    return response.data
  },

  // Duplicate QR code
  duplicateQRCode: async (id: string) => {
    const response = await api.post(`/admin/qr-codes/${id}/duplicate`)
    return response.data
  },

  // Export QR codes
  exportQRCodes: async (format: 'csv' | 'pdf' | 'excel') => {
    const response = await api.get(`/admin/qr-codes/export?format=${format}`)
    return response.data
  },

  // Get QR code scan statistics
  getScanStatistics: async (dateRange?: string) => {
    const response = await api.get(`/admin/qr-codes/statistics${dateRange ? `?range=${dateRange}` : ''}`)
    return response.data
  },

  // Get most scanned QR codes
  getMostScannedQRCodes: async (limit: number = 10) => {
    const response = await api.get(`/admin/qr-codes/most-scanned?limit=${limit}`)
    return response.data
  },

  // Get QR code performance metrics
  getPerformanceMetrics: async (qrCodeId: string) => {
    const response = await api.get(`/admin/qr-codes/${qrCodeId}/performance`)
    return response.data
  }
}

export default api
