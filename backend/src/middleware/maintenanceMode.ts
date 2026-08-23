import { prisma } from '../config/prisma'

const safeJsonParse = (value: string | undefined, fallback: any) => {
  try { return value ? JSON.parse(value) : fallback } catch { return fallback }
}

let cachedMaintenanceState = { enabled: false, secretKey: '', lastChecked: 0 }
const CACHE_TTL = 15_000

async function getMaintenanceState(): Promise<{ enabled: boolean; secretKey: string }> {
  const now = Date.now()
  if (now - cachedMaintenanceState.lastChecked < CACHE_TTL) {
    return { enabled: cachedMaintenanceState.enabled, secretKey: cachedMaintenanceState.secretKey }
  }
  try {
    const setting = await prisma.systemSetting.findUnique({ where: { key: 'site_profile' } })
    const profile = safeJsonParse(setting?.value, null)
    const enabled = Boolean(profile?.featureToggles?.maintenanceMode)
    const secretKey = String(profile?.featureToggles?.maintenanceSecretKey || '')
    cachedMaintenanceState = { enabled, secretKey, lastChecked: now }
    return { enabled, secretKey }
  } catch {
    return { enabled: cachedMaintenanceState.enabled, secretKey: cachedMaintenanceState.secretKey }
  }
}

export function clearMaintenanceCache() {
  cachedMaintenanceState = { enabled: false, secretKey: '', lastChecked: 0 }
}

const PUBLIC_PATHS = new Set(['/health', '/api/content/site-profile', '/api/content/site-theme'])

export function maintenanceModeMiddleware(req: any, res: any, next: any) {
  getMaintenanceState().then(({ enabled, secretKey }) => {
    if (!enabled) return next()

    if (secretKey && req.query.maintenance_key === secretKey) {
      return next()
    }

    if (PUBLIC_PATHS.has(req.path)) return next()

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
