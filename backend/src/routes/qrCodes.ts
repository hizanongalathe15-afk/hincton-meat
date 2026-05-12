import express from 'express'
import { z } from 'zod'
import { prisma } from '../config/prisma'

const router = express.Router()

const settingKey = 'qr_codes'

const qrCodeSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  type: z.enum(['product', 'category', 'discount', 'cart', 'checkout', 'wishlist', 'location', 'support']),
  destination: z.string().min(1),
  customUrl: z.string().optional(),
  settings: z.object({
    size: z.enum(['small', 'medium', 'large']).default('medium'),
    color: z.string().default('#DC2626'),
    logo: z.string().optional(),
    expirationDate: z.string().optional(),
    maxScans: z.coerce.number().optional(),
  }).default({ size: 'medium', color: '#DC2626' }),
  isActive: z.boolean().default(true),
})

const scanSchema = z.object({
  qrCodeId: z.string().min(1),
  deviceType: z.string().optional(),
  location: z.string().optional(),
  userAgent: z.string().optional(),
})

router.use('/admin/qr-codes', (req: any, res, next) => {
  const roles = req.user?.roles || []
  if (!roles.includes('ADMIN') && !roles.includes('SUPER_ADMIN')) {
    return res.status(403).json({ error: 'Admin access required' })
  }
  next()
})

type QRCodeRecord = z.infer<typeof qrCodeSchema> & {
  id: string
  createdAt: string
  scans: Array<{
    scannerId: string
    deviceType: string
    location?: string
    timestamp: string
    userAgent?: string
    ipAddress?: string
  }>
}

const emptyAnalytics = {
  totalScans: 0,
  uniqueScanners: 0,
  firstScanDate: '',
  lastScanDate: '',
  avgScanDuration: 0,
  timeOfDayData: [] as Array<{ hour: number; scans: number }>,
  deviceData: [] as Array<{ device: string; percentage: number }>,
  locationData: [] as Array<{ location: string; scans: number }>,
  conversionFromScan: 0,
  bounceRate: 0,
}

const loadCodes = async (): Promise<QRCodeRecord[]> => {
  const setting = await prisma.systemSetting.findUnique({ where: { key: settingKey } })
  if (!setting) return []
  try {
    const parsed = JSON.parse(setting.value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const saveCodes = async (codes: QRCodeRecord[]) => {
  await prisma.systemSetting.upsert({
    where: { key: settingKey },
    update: { value: JSON.stringify(codes) },
    create: {
      key: settingKey,
      value: JSON.stringify(codes),
      type: 'json',
      group: 'marketing',
      description: 'Admin generated QR codes and scan analytics',
      isPublic: false,
    },
  })
}

const toAnalytics = (code: QRCodeRecord) => {
  const scans = code.scans || []
  const unique = new Set(scans.map((scan) => scan.scannerId)).size
  const first = scans[0]?.timestamp || ''
  const last = scans[scans.length - 1]?.timestamp || ''
  const byHour = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    scans: scans.filter((scan) => new Date(scan.timestamp).getHours() === hour).length,
  }))
  const devices = new Map<string, number>()
  const locations = new Map<string, number>()
  scans.forEach((scan) => {
    devices.set(scan.deviceType || 'Unknown', (devices.get(scan.deviceType || 'Unknown') || 0) + 1)
    if (scan.location) locations.set(scan.location, (locations.get(scan.location) || 0) + 1)
  })

  return {
    totalScans: scans.length,
    uniqueScanners: unique,
    firstScanDate: first,
    lastScanDate: last,
    avgScanDuration: 0,
    timeOfDayData: byHour,
    deviceData: Array.from(devices.entries()).map(([device, count]) => ({ device, percentage: scans.length ? Number(((count / scans.length) * 100).toFixed(1)) : 0 })),
    locationData: Array.from(locations.entries()).map(([location, count]) => ({ location, scans: count })),
    conversionFromScan: 0,
    bounceRate: 0,
  }
}

const serializeCode = (code: QRCodeRecord) => ({
  ...code,
  analytics: code.scans?.length ? toAnalytics(code) : emptyAnalytics,
})

router.get('/admin/qr-codes', async (_req, res) => {
  const codes = await loadCodes()
  res.json({ qrCodes: codes.map(serializeCode) })
})

router.post('/admin/qr-codes/generate', async (req, res) => {
  try {
    const data = qrCodeSchema.parse(req.body)
    const codes = await loadCodes()
    const code: QRCodeRecord = {
      ...data,
      id: data.id || `qr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
      scans: [],
    }
    codes.unshift(code)
    await saveCodes(codes)
    res.status(201).json({ qrCode: serializeCode(code) })
  } catch (error) {
    res.status(400).json({ error: 'Invalid QR code data' })
  }
})

router.put('/admin/qr-codes/:id', async (req, res) => {
  const updates = qrCodeSchema.partial().parse(req.body)
  const codes = await loadCodes()
  const index = codes.findIndex((code) => code.id === req.params.id)
  if (index === -1) return res.status(404).json({ error: 'QR code not found' })
  codes[index] = { ...codes[index], ...updates }
  await saveCodes(codes)
  res.json({ qrCode: serializeCode(codes[index]) })
})

router.delete('/admin/qr-codes/:id', async (req, res) => {
  const codes = await loadCodes()
  await saveCodes(codes.filter((code) => code.id !== req.params.id))
  res.json({ message: 'QR code deleted' })
})

router.post('/qr-codes/scan', async (req, res) => {
  try {
    const data = scanSchema.parse(req.body)
    const codes = await loadCodes()
    const code = codes.find((item) => item.id === data.qrCodeId)
    if (!code) return res.status(404).json({ error: 'QR code not found' })

    const scannerId = String(req.header('X-Guest-Session-Id') || req.ip || 'unknown')
    code.scans = code.scans || []
    code.scans.push({
      scannerId,
      deviceType: data.deviceType || 'Unknown',
      location: data.location,
      timestamp: new Date().toISOString(),
      userAgent: data.userAgent || req.header('user-agent') || undefined,
      ipAddress: req.ip,
    })

    await saveCodes(codes)
    res.json({ message: 'QR scan recorded', qrCode: serializeCode(code), redirectTo: code.customUrl || code.destination })
  } catch {
    res.status(400).json({ error: 'Invalid QR scan data' })
  }
})

export default router
