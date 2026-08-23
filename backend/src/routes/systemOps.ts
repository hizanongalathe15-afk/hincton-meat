import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import os from 'os'
import fs from 'fs'
import path from 'path'
import { z } from 'zod'
import { prisma } from '../config/prisma'

const router = express.Router()

const OPS_TOKEN_TTL_SECONDS = 15 * 60

const getJwtSecret = () => process.env.JWT_SECRET || ''

const signOpsToken = (userId: string) => {
  return jwt.sign({ sub: userId, type: 'admin_ops' }, getJwtSecret(), { expiresIn: OPS_TOKEN_TTL_SECONDS })
}

const requireOpsToken = (req: any, res: any, next: any) => {
  const token = req.header('x-ops-token')
  if (!token) return res.status(423).json({ error: 'Admin key verification required' })
  try {
    const payload: any = jwt.verify(token, getJwtSecret())
    if (payload?.type !== 'admin_ops' || payload?.sub !== req.user?.id) {
      return res.status(423).json({ error: 'Admin key verification required' })
    }
    return next()
  } catch {
    return res.status(423).json({ error: 'Admin key verification expired. Unlock again.' })
  }
}

router.post('/verify-admin-key', async (req: any, res) => {
  try {
    const { adminKey } = z.object({ adminKey: z.string().min(1) }).parse(req.body || {})
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      include: { security: true },
    })
    if (!user?.security?.password_hash) return res.status(401).json({ error: 'Invalid admin key' })
    const valid = await bcrypt.compare(adminKey, user.security.password_hash)
    if (!valid) return res.status(401).json({ error: 'Invalid admin key' })
    res.json({ opsToken: signOpsToken(user.id), expiresIn: OPS_TOKEN_TTL_SECONDS })
  } catch {
    res.status(401).json({ error: 'Invalid admin key' })
  }
})

router.get('/info', async (_req, res) => {
  try {
    let packageInfo: any = {}
    try {
      const raw = fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8')
      const parsed = JSON.parse(raw)
      packageInfo = {
        name: parsed.name,
        version: parsed.version,
        dependencies: {
          express: parsed.dependencies?.express,
          prisma: parsed.dependencies?.prisma,
          'socket.io': parsed.dependencies?.['socket.io'],
          typescript: parsed.devDependencies?.typescript,
        },
      }
    } catch {}
    const [users, orders, products, tickets] = await Promise.all([
      prisma.user.count(),
      prisma.order.count(),
      prisma.product.count(),
      prisma.supportTicket.count({ where: { deletedAt: null } }).catch(() => 0),
    ])
    res.json({
      info: {
        app: packageInfo,
        nodeVersion: process.version,
        platform: `${os.type()} ${os.release()} (${os.arch()})`,
        environment: process.env.NODE_ENV || 'development',
        hosting: process.env.RENDER ? 'Render' : process.env.VERCEL ? 'Vercel' : 'Local',
        deployCommit: process.env.RENDER_GIT_COMMIT || null,
        startedAt: new Date(Date.now() - process.uptime() * 1000).toISOString(),
        uptimeSeconds: Math.round(process.uptime()),
        memory: {
          rssMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
          heapUsedMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          totalMb: Math.round(os.totalmem() / 1024 / 1024),
        },
        records: { users, orders, products, openTickets: tickets },
      },
    })
  } catch (err) {
    console.error('GET /admin/system/info', err)
    res.status(500).json({ error: 'Failed to load system info' })
  }
})

router.post('/updates/check', requireOpsToken, async (_req, res) => {
  try {
    let version = 'unknown'
    try {
      const parsed = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8'))
      version = parsed.version || 'unknown'
    } catch {}
    res.json({
      currentVersion: version,
      nodeVersion: process.version,
      status: 'up_to_date',
      message: 'Backend is running the latest deployed build. Push to the main branch and redeploy to ship new updates.',
      checkedAt: new Date().toISOString(),
    })
  } catch {
    res.status(500).json({ error: 'Failed to check updates' })
  }
})

router.get('/backup', requireOpsToken, async (_req, res) => {
  try {
    const settings = await prisma.systemSetting.findMany({ orderBy: { key: 'asc' } })
    const backup = {
      meta: {
        type: 'hincton-system-backup',
        version: 1,
        createdAt: new Date().toISOString(),
        nodeVersion: process.version,
      },
      systemSettings: settings.map((s) => ({
        key: s.key,
        value: s.value,
        type: (s as any).type || 'json',
        group: (s as any).group || 'general',
        isPublic: Boolean((s as any).isPublic),
      })),
    }
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', `attachment; filename="hincton-backup-${Date.now()}.json"`)
    res.json(backup)
  } catch (err) {
    console.error('GET /admin/system/backup', err)
    res.status(500).json({ error: 'Failed to create backup' })
  }
})

router.post('/restore', requireOpsToken, async (req, res) => {
  try {
    const schema = z.object({
      backup: z.object({
        meta: z.object({ type: z.string() }).passthrough(),
        systemSettings: z.array(z.object({
          key: z.string().min(1),
          value: z.any(),
          type: z.string().optional(),
          group: z.string().optional(),
          isPublic: z.boolean().optional(),
        })),
      }),
    })
    const { backup } = schema.parse(req.body || {})
    if (backup.meta.type !== 'hincton-system-backup') {
      return res.status(400).json({ error: 'Not a valid Hincton backup file' })
    }
    let restored = 0
    for (const item of backup.systemSettings) {
      const value = typeof item.value === 'string' ? item.value : JSON.stringify(item.value)
      await prisma.systemSetting.upsert({
        where: { key: item.key },
        update: { value, type: item.type || 'json', group: item.group || 'general', isPublic: Boolean(item.isPublic) },
        create: { key: item.key, value, type: item.type || 'json', group: item.group || 'general', isPublic: Boolean(item.isPublic) },
      })
      restored += 1
    }
    res.json({ ok: true, restored })
  } catch (err: any) {
    console.error('POST /admin/system/restore', err)
    res.status(400).json({ error: err?.message || 'Failed to restore backup' })
  }
})

export default router
