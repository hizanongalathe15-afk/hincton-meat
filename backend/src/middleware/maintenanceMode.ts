import jwt from 'jsonwebtoken'
import { prisma } from '../config/prisma'

const safeJsonParse = (value: string | undefined, fallback: any) => {
  try { return value ? JSON.parse(value) : fallback } catch { return fallback }
}

type MaintenanceState = {
  enabled: boolean
  secretKey: string
  displayMode: string
  lastChecked: number
}

let cachedMaintenanceState: MaintenanceState = {
  enabled: false,
  secretKey: '',
  displayMode: 'full',
  lastChecked: 0,
}
const CACHE_TTL = 15_000
const DEFAULT_AUTO_OFF_MINUTES = 30

export const isMaintenanceExpired = (toggles: any): boolean => {
  if (!toggles?.maintenanceMode) return false
  const autoOffMinutes = Number(toggles.maintenanceAutoOffMinutes ?? DEFAULT_AUTO_OFF_MINUTES)
  if (!Number.isFinite(autoOffMinutes) || autoOffMinutes <= 0) return false
  const startedAt = Date.parse(String(toggles.maintenanceStartedAt || ''))
  if (Number.isNaN(startedAt)) return true
  return Date.now() > startedAt + autoOffMinutes * 60_000
}

let autoOffPersisting = false
async function persistMaintenanceAutoOff() {
  if (autoOffPersisting) return
  autoOffPersisting = true
  try {
    const setting = await prisma.systemSetting.findUnique({ where: { key: 'site_profile' } })
    const profile = safeJsonParse(setting?.value, {})
    if (profile?.featureToggles?.maintenanceMode) {
      profile.featureToggles.maintenanceMode = false
      await prisma.systemSetting.update({
        where: { key: 'site_profile' },
        data: { value: JSON.stringify(profile) },
      })
    }
  } catch {
  } finally {
    autoOffPersisting = false
  }
}

async function getMaintenanceState(): Promise<MaintenanceState> {
  const now = Date.now()
  if (now - cachedMaintenanceState.lastChecked < CACHE_TTL) {
    return cachedMaintenanceState
  }
  try {
    const setting = await prisma.systemSetting.findUnique({ where: { key: 'site_profile' } })
    const profile = safeJsonParse(setting?.value, null)
    const toggles = profile?.featureToggles || {}
    const expired = isMaintenanceExpired(toggles)
    const enabled = Boolean(toggles.maintenanceMode) && !expired
    const secretKey = String(toggles.maintenanceSecretKey || '')
    const displayMode = String(toggles.maintenanceDisplayMode || 'full')
    if (expired) persistMaintenanceAutoOff()
    cachedMaintenanceState = { enabled, secretKey, displayMode, lastChecked: now }
    return cachedMaintenanceState
  } catch {
    return cachedMaintenanceState
  }
}

export function clearMaintenanceCache() {
  cachedMaintenanceState = { enabled: false, secretKey: '', displayMode: 'full', lastChecked: 0 }
}

const PUBLIC_PATHS = new Set([
  '/health',
  '/api/content/site-profile',
  '/api/content/site-theme',
  '/api/content/maintenance-status',
  '/api/content/maintenance-notify',
])

const isAdminRequest = (req: any): boolean => {
  try {
    const header = String(req?.header?.('Authorization') || req?.headers?.authorization || '')
    const token = header.replace('Bearer ', '').trim()
    if (!token) return false
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as {
      role?: string
      roles?: string[]
    }
    const roles = (decoded.roles || []).map((role) => String(role).toUpperCase())
    if (roles.includes('ADMIN') || roles.includes('SUPER_ADMIN')) return true
    return String(decoded.role || '').toLowerCase() === 'admin'
  } catch {
    return false
  }
}

export function maintenanceModeMiddleware(req: any, res: any, next: any) {
  getMaintenanceState().then(({ enabled, secretKey, displayMode }) => {
    if (!enabled) return next()

    if (secretKey && req.query.maintenance_key === secretKey) {
      return next()
    }

    if (isAdminRequest(req)) return next()

    if (PUBLIC_PATHS.has(req.path)) return next()

    if (displayMode === 'banner' || displayMode === 'popup') {
      return next()
    }

    res.setHeader('Retry-After', '900')

    if (req.path.startsWith('/api/')) {
      return res.status(503).json({
        error: 'Site is under maintenance',
        message: 'We are upgrading our systems. Please check back shortly.',
        maintenance: true,
      })
    }

    return res.status(503).json({
      error: 'Site is under maintenance',
      message: 'We are upgrading our systems. Please check back shortly.',
      maintenance: true,
    })
  }).catch(() => next())
}
