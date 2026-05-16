import { useState, useEffect } from 'react'
import {
  Cpu, 
  HardDrive, 
  Wifi, 
  Clock, 
  Activity,
  Server,
  Zap,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  LogOut,
  Trash2
} from 'lucide-react'
import { systemApi } from '../services/adminApi'
import toast from 'react-hot-toast'
import { getApiHost } from '../services/api'
import { useConfirmationDialog } from '../hooks/useConfirmationDialog'
import ConfirmationDialog from '../components/ui/ConfirmationDialog'

interface SystemMetrics {
  cpu: {
    usage: number
    cores: number
    model: string
  }
  memory: {
    total: number
    used: number
    free: number
    usage: number
  }
  storage: {
    total: number
    used: number
    free: number
    usage: number
  }
  network: {
    download: number
    upload: number
    latency: number
  }
  uptime: number
  loadAverage: number[]
  timestamp: string
}

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical'
  issues: string[]
  score: number
}

interface SystemWakeTime {
  bootTime: string | Date
  uptime: string
  lastRestart: string | Date
  totalUptime: string
  currentTime: string | Date
  timezone: string
}

interface AdminSession {
  id: string
  userId: string
  user: {
    id: string
    username: string
    email: string
    profile?: {
      firstName?: string
      lastName?: string
      fullName?: string
      avatar?: string
    }
  }
  deviceInfo: {
    userAgent: string
    ipAddress: string
    deviceType: string
    browser: string
    os: string
    location?: string
  }
  isOnline: boolean
  lastActivity: string
  sessionStart: string
  duration: number
}

const SystemMetrics = () => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null)
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const [wakeTime, setWakeTime] = useState<SystemWakeTime | null>(null)
  const [adminSessions, setAdminSessions] = useState<AdminSession[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<string>('')
  const [browserStorage, setBrowserStorage] = useState<{
    quota: number
    usage: number
    available: number
    percent: number
    persisted: boolean
  } | null>(null)
  const [currentDevice, setCurrentDevice] = useState<{
    browser: string
    os: string
    device: string
    userAgent: string
  } | null>(null)
  const { isOpen, options, confirm, handleConfirm, handleCancel } = useConfirmationDialog()

  const fetchMetrics = async () => {
    try {
      const [metricsResponse, healthResponse, wakeTimeResponse, sessionsResponse] = await Promise.all([
        systemApi.getMetrics(),
        systemApi.getHealth(),
        systemApi.getWakeTime(),
        systemApi.getAdminSessions().catch(() => ({ sessions: [] })) // Gracefully handle if endpoint doesn't exist yet
      ])

      setMetrics(metricsResponse.metrics)
      setHealth(healthResponse.health)
      setWakeTime(wakeTimeResponse.wakeTime)
      setAdminSessions(sessionsResponse.sessions || [])
      setLastUpdate(new Date().toLocaleTimeString())
    } catch (error: any) {
      console.error('Failed to fetch system metrics:', error)
      toast.error(error?.message || 'Failed to fetch system metrics')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const refreshMetrics = () => {
    setRefreshing(true)
    fetchMetrics()
  }

  const revokeSession = async (sessionId: string) => {
    const confirmed = await confirm({
      title: 'Log Out Admin Device',
      message: 'This will revoke the selected admin session immediately.',
      confirmText: 'Log out device',
      cancelText: 'Cancel',
      type: 'danger',
      icon: 'delete',
    })
    if (!confirmed) return
    try {
      await systemApi.revokeAdminSession(sessionId)
      toast.success('Device session revoked')
      await fetchMetrics()
    } catch (error: any) {
      toast.error(error?.message || 'Failed to revoke session')
    }
  }

  const clearSession = async (sessionId: string) => {
    const confirmed = await confirm({
      title: 'Clear Session Row',
      message: 'This permanently removes this browser session record from the history table.',
      confirmText: 'Clear session',
      cancelText: 'Cancel',
      type: 'danger',
      icon: 'delete',
    })
    if (!confirmed) return
    try {
      await systemApi.clearAdminSession(sessionId)
      toast.success('Session cleared')
      await fetchMetrics()
    } catch (error: any) {
      toast.error(error?.message || 'Failed to clear session')
    }
  }

  const clearSessions = async (scope: 'inactive' | 'all') => {
    const confirmed = await confirm({
      title: scope === 'all' ? 'Clear All Admin Sessions' : 'Clear Inactive Sessions',
      message: scope === 'all'
        ? 'This deletes every admin session record, including online devices. Active devices may need to sign in again.'
        : 'This deletes offline, expired, and revoked admin session records from the history table.',
      confirmText: scope === 'all' ? 'Clear all sessions' : 'Clear inactive',
      cancelText: 'Cancel',
      type: 'danger',
      icon: 'delete',
    })
    if (!confirmed) return
    try {
      const response = await systemApi.clearAdminSessions(scope)
      toast.success(`Cleared ${response.deletedCount || 0} session${response.deletedCount === 1 ? '' : 's'}`)
      await fetchMetrics()
    } catch (error: any) {
      toast.error(error?.message || 'Failed to clear sessions')
    }
  }

  useEffect(() => {
    fetchMetrics()
    const interval = setInterval(fetchMetrics, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const detectCurrentDevice = async () => {
      const ua = navigator.userAgent || ''
      const uaData = (navigator as any).userAgentData
      const browser = uaData?.brands?.find((brand: any) => !/Not/i.test(brand.brand))?.brand ||
        (/Edg\//.test(ua) ? 'Microsoft Edge' : /Chrome|CriOS/.test(ua) ? 'Chrome' : /Firefox|FxiOS/.test(ua) ? 'Firefox' : /Safari/.test(ua) ? 'Safari' : 'Unknown browser')
      const os = uaData?.platform ||
        (/Android/i.test(ua) ? 'Android' : /iPhone|iPad|iPod/i.test(ua) ? 'iOS' : /Win/i.test(ua) ? 'Windows' : /Mac/i.test(ua) ? 'macOS' : /Linux/i.test(ua) ? 'Linux' : 'Unknown OS')
      const device = uaData?.mobile ? 'Mobile device' : /iPad|Tablet/i.test(ua) ? 'Tablet' : /Mobile|Android|iPhone/i.test(ua) ? 'Mobile device' : 'Desktop or laptop'
      setCurrentDevice({ browser, os, device, userAgent: ua })

      if (navigator.storage?.estimate) {
        const estimate = await navigator.storage.estimate()
        const quota = estimate.quota || 0
        const usage = estimate.usage || 0
        const persisted = navigator.storage.persisted ? await navigator.storage.persisted() : false
        setBrowserStorage({
          quota,
          usage,
          available: Math.max(0, quota - usage),
          percent: quota > 0 ? Math.round((usage / quota) * 1000) / 10 : 0,
          persisted,
        })
      }
    }

    detectCurrentDevice().catch(() => undefined)
  }, [])

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600'
      case 'warning': return 'text-yellow-600'
      case 'critical': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100'
      case 'warning': return 'bg-yellow-100'
      case 'critical': return 'bg-red-100'
      default: return 'bg-gray-100'
    }
  }

  const getUsageColor = (usage: number) => {
    if (usage > 80) return 'text-red-600'
    if (usage > 60) return 'text-yellow-600'
    return 'text-green-600'
  }

  const getProgressColor = (usage: number) => {
    if (usage > 80) return 'bg-red-500'
    if (usage > 60) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const resolveAssetUrl = (url?: string) => {
    const API_HOST = getApiHost()
    if (!url) return ''
    return url.startsWith('http') ? url : `${API_HOST}${url}`
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Metrics</h1>
          <p className="text-gray-600">Monitor Render server health and signed-in admin browser sessions</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            Last updated: {lastUpdate}
          </div>
          <button
            onClick={() => clearSessions('inactive')}
            className="flex items-center space-x-2 rounded-lg border border-red-200 px-4 py-2 text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            <span>Clear inactive</span>
          </button>
          <button
            onClick={() => clearSessions('all')}
            className="flex items-center space-x-2 rounded-lg border border-red-300 px-4 py-2 text-red-800 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            <span>Clear all sessions</span>
          </button>
          <button
            onClick={refreshMetrics}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Health Status */}
      {health && (
        <div className={`p-4 rounded-lg ${getStatusBg(health.status)}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {health.status === 'healthy' && <CheckCircle className="w-6 h-6 text-green-600" />}
              {health.status === 'warning' && <AlertTriangle className="w-6 h-6 text-yellow-600" />}
              {health.status === 'critical' && <AlertTriangle className="w-6 h-6 text-red-600" />}
              <div>
                <h3 className={`font-semibold ${getStatusColor(health.status)}`}>
                  System Status: {health.status.toUpperCase()}
                </h3>
                <p className="text-sm text-gray-600">Health Score: {health.score}/100</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Issues</div>
              {health.issues.length > 0 ? (
                <div className="text-sm text-red-600">
                  {health.issues.map((issue, index) => (
                    <div key={index}>{issue}</div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-green-600">No issues detected</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* System Wake Time */}
      {wakeTime && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center space-x-3">
              <Clock className="w-8 h-8 text-blue-600" />
              <div>
                <h3 className="font-semibold text-gray-900">System Uptime</h3>
                <p className="text-2xl font-bold text-gray-900">{wakeTime.uptime}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center space-x-3">
              <Server className="w-8 h-8 text-green-600" />
              <div>
                <h3 className="font-semibold text-gray-900">Boot Time</h3>
                <p className="text-sm text-gray-600">{new Date(wakeTime.bootTime).toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center space-x-3">
              <Activity className="w-8 h-8 text-purple-600" />
              <div>
                <h3 className="font-semibold text-gray-900">Total Uptime</h3>
                <p className="text-sm text-gray-600">{wakeTime.totalUptime}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center space-x-3">
              <Clock className="w-8 h-8 text-red-600" />
              <div>
                <h3 className="font-semibold text-gray-900">Current Server Time</h3>
                <p className="text-sm text-gray-600">{new Date(wakeTime.currentTime).toLocaleString()}</p>
                <p className="text-xs text-gray-500">{wakeTime.timezone}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Metrics Grid */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* CPU */}
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Cpu className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">CPU</h3>
              </div>
              <span className={`text-sm font-medium ${getUsageColor(metrics.cpu.usage)}`}>
                {metrics.cpu.usage.toFixed(1)}%
              </span>
            </div>
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${getProgressColor(metrics.cpu.usage)}`}
                  style={{ width: `${metrics.cpu.usage}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-600">
                <div>Cores: {metrics.cpu.cores}</div>
                <div>Load: {metrics.loadAverage[0]?.toFixed(2) || 'N/A'}</div>
              </div>
            </div>
          </div>

          {/* Memory */}
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-yellow-600" />
                <h3 className="font-semibold text-gray-900">Memory</h3>
              </div>
              <span className={`text-sm font-medium ${getUsageColor(metrics.memory.usage)}`}>
                {metrics.memory.usage.toFixed(1)}%
              </span>
            </div>
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${getProgressColor(metrics.memory.usage)}`}
                  style={{ width: `${metrics.memory.usage}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-600">
                <div>Used: {formatBytes(metrics.memory.used * 1024 * 1024)}</div>
                <div>Total: {formatBytes(metrics.memory.total * 1024 * 1024)}</div>
              </div>
            </div>
          </div>

          {/* Storage */}
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <HardDrive className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-gray-900">Server Storage</h3>
              </div>
              <span className={`text-sm font-medium ${getUsageColor(metrics.storage.usage)}`}>
                {metrics.storage.usage.toFixed(1)}%
              </span>
            </div>
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${getProgressColor(metrics.storage.usage)}`}
                  style={{ width: `${metrics.storage.usage}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-600">
                <div>Used: {formatBytes(metrics.storage.used)}</div>
                <div>Total: {formatBytes(metrics.storage.total)}</div>
              </div>
            </div>
          </div>

          {/* Network */}
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Wifi className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-gray-900">Network</h3>
              </div>
              <span className="text-sm font-medium text-gray-600">
                {metrics.network.latency.toFixed(0)}ms
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">↓ {metrics.network.download.toFixed(1)} KB/s</span>
                <span className="text-gray-600">↑ {metrics.network.upload.toFixed(1)} KB/s</span>
              </div>
              <div className="text-xs text-gray-600">
                <div>Latency: {metrics.network.latency.toFixed(0)}ms</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Information */}
      {metrics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CPU Details */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">CPU Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Model:</span>
                <span className="font-medium">{metrics.cpu.model}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Cores:</span>
                <span className="font-medium">{metrics.cpu.cores}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Current Usage:</span>
                <span className={`font-medium ${getUsageColor(metrics.cpu.usage)}`}>
                  {metrics.cpu.usage.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Load Average (1m):</span>
                <span className="font-medium">{metrics.loadAverage[0]?.toFixed(2) || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Load Average (5m):</span>
                <span className="font-medium">{metrics.loadAverage[1]?.toFixed(2) || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Load Average (15m):</span>
                <span className="font-medium">{metrics.loadAverage[2]?.toFixed(2) || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Memory Details */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Memory Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Memory:</span>
                <span className="font-medium">{formatBytes(metrics.memory.total * 1024 * 1024)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Used Memory:</span>
                <span className="font-medium">{formatBytes(metrics.memory.used * 1024 * 1024)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Free Memory:</span>
                <span className="font-medium">{formatBytes(metrics.memory.free * 1024 * 1024)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Usage Percentage:</span>
                <span className={`font-medium ${getUsageColor(metrics.memory.usage)}`}>
                  {metrics.memory.usage.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Server Storage Details</h3>
            <p className="mb-4 text-sm text-gray-500">These numbers are from the backend host filesystem, not your phone or laptop disk.</p>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Server Total Storage:</span>
                <span className="font-medium">{formatBytes(metrics.storage.total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Server Used Storage:</span>
                <span className="font-medium">{formatBytes(metrics.storage.used)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Server Free Storage:</span>
                <span className="font-medium">{formatBytes(metrics.storage.free)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Usage Percentage:</span>
                <span className={`font-medium ${getUsageColor(metrics.storage.usage)}`}>
                  {metrics.storage.usage.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">This Browser Device</h3>
            <p className="mb-4 text-sm text-gray-500">Browsers expose origin storage quota, not full physical disk size.</p>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Detected Device:</span>
                <span className="font-medium">{currentDevice?.device || 'Unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Browser:</span>
                <span className="font-medium">{currentDevice?.browser || 'Unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">OS:</span>
                <span className="font-medium">{currentDevice?.os || 'Unknown'}</span>
              </div>
              {browserStorage ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Browser Quota:</span>
                    <span className="font-medium">{formatBytes(browserStorage.quota)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">App Storage Used:</span>
                    <span className="font-medium">{formatBytes(browserStorage.usage)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estimated Available:</span>
                    <span className="font-medium">{formatBytes(browserStorage.available)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Usage Percentage:</span>
                    <span className={`font-medium ${getUsageColor(browserStorage.percent)}`}>{browserStorage.percent.toFixed(1)}%</span>
                  </div>
                </>
              ) : (
                <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">This browser does not expose storage quota details.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Admin Sessions */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Admin Sessions & Devices</h3>
        <p className="mb-4 text-sm text-gray-500">Device names come from browser user-agent data. Exact hardware model and full disk size are not exposed by normal web browsers.</p>
        {adminSessions.length > 0 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-800">Active Sessions</span>
                </div>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  {adminSessions.filter(s => s.isOnline).length}
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Server className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-800">Total Admins</span>
                </div>
                <p className="text-2xl font-bold text-blue-600 mt-2">
                  {new Set(adminSessions.map(s => s.userId)).size}
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-purple-600" />
                  <span className="font-medium text-purple-800">Device Types</span>
                </div>
                <p className="text-2xl font-bold text-purple-600 mt-2">
                  {new Set(adminSessions.map(s => s.deviceInfo.deviceType)).size}
                </p>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Admin
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Device & Browser
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Activity
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {adminSessions.map((session) => (
                    <tr key={session.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 overflow-hidden rounded-full bg-red-500 flex items-center justify-center">
                              {session.user.profile?.avatar ? (
                                <img src={resolveAssetUrl(session.user.profile.avatar)} alt={session.user.profile.fullName || session.user.email} className="h-full w-full object-cover" />
                              ) : (
                                <span className="text-sm font-medium text-white">
                                  {(session.user.profile?.firstName?.[0] || session.user.username?.[0] || 'A').toUpperCase()}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {session.user.profile?.fullName ||
                              (session.user.profile?.firstName && session.user.profile?.lastName 
                                ? `${session.user.profile.firstName} ${session.user.profile.lastName}`
                                : session.user.username || 'Unknown')}
                            </div>
                            <div className="text-sm text-gray-500">{session.user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{session.deviceInfo.deviceType}</div>
                        <div className="text-sm text-gray-500">{session.deviceInfo.browser} on {session.deviceInfo.os}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {session.deviceInfo.location || session.deviceInfo.ipAddress}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          session.isOnline 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {session.isOnline ? 'Online' : 'Offline'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(session.lastActivity).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => revokeSession(session.id)}
                            disabled={!session.isOnline}
                            className="inline-flex items-center gap-1 rounded border border-red-200 px-3 py-1 text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <LogOut className="h-4 w-4" />
                            Log out
                          </button>
                          <button
                            type="button"
                            onClick={() => clearSession(session.id)}
                            className="inline-flex items-center gap-1 rounded border border-gray-300 px-3 py-1 text-gray-700 hover:bg-gray-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            Clear
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Server className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No admin sessions found</h3>
            <p className="mt-1 text-sm text-gray-500">Admin session tracking may not be available yet.</p>
          </div>
        )}
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

export default SystemMetrics
