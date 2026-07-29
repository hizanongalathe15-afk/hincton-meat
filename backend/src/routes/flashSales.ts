import express from 'express'
import { z } from 'zod'
import { prisma } from '../config/prisma'

const router = express.Router()
const saleSchema = z.object({
  name: z.string().min(2).max(100), description: z.string().max(280).optional(), bannerImage: z.string().url().optional().or(z.literal('')),
  discountValue: z.coerce.number().min(0).max(100), startTime: z.string(), endTime: z.string(), stockLimit: z.coerce.number().int().positive().optional(), perUserLimit: z.coerce.number().int().positive().default(1),
  products: z.array(z.object({ productId: z.string().min(1), salePrice: z.coerce.number().nonnegative(), stockAllocated: z.coerce.number().int().positive() })).min(1),
})
const isAdmin = (req: any) => (req.user?.roles || []).some((role: string) => ['ADMIN', 'SUPER_ADMIN'].includes(role))
const include: any = { products: { include: { product: { include: { productImages: { orderBy: [{ isPrimary: 'desc' as const }, { sortOrder: 'asc' as const }], take: 1 }, category: true } } } } }
const serialize = (sale: any) => ({ ...sale, discountValue: Number(sale.discountValue), products: sale.products.map((item: any) => ({ ...item, salePrice: Number(item.salePrice), originalPrice: Number(item.originalPrice), remaining: Math.max(0, Math.min(item.stockAllocated - item.stockSold, Number(item.product.stockQuantity || 0))) })) })

router.get('/flash-sales/active', async (_req, res) => {
  try { const now = new Date(); const sales = await prisma.flashSale.findMany({ where: { status: 'active', startTime: { lte: now }, endTime: { gt: now } }, include, orderBy: { endTime: 'asc' } }); res.json({ sales: sales.map(serialize) }) } catch { res.status(500).json({ error: 'Could not load live deals' }) }
})
router.get('/admin/flash-sales', async (req: any, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Admin access required' })
  const sales = await prisma.flashSale.findMany({ include, orderBy: { createdAt: 'desc' } }); res.json({ sales: sales.map(serialize) })
})
router.post('/admin/flash-sales', async (req: any, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Admin access required' })
  try {
    const data = saleSchema.parse(req.body); const startTime = new Date(data.startTime); const endTime = new Date(data.endTime)
    if (!(startTime < endTime)) return res.status(400).json({ error: 'End time must be after start time' })
    const products = await prisma.product.findMany({ where: { id: { in: data.products.map((item) => item.productId) }, deletedAt: null }, select: { id: true, price: true } })
    if (products.length !== data.products.length) return res.status(400).json({ error: 'One or more selected products no longer exist' })
    const slug = `${data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Date.now().toString(36)}`
    const sale = await prisma.flashSale.create({ data: { name: data.name, slug, description: data.description || null, bannerImage: data.bannerImage || null, discountType: 'percentage', discountValue: data.discountValue, startTime, endTime, stockLimit: data.stockLimit, perUserLimit: data.perUserLimit, status: startTime <= new Date() ? 'active' : 'scheduled', createdBy: req.user.id, products: { create: data.products.map((item) => ({ productId: item.productId, salePrice: item.salePrice, originalPrice: products.find((product) => product.id === item.productId)!.price, stockAllocated: item.stockAllocated })) } }, include })
    res.status(201).json({ sale: serialize(sale) })
  } catch (error) { if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid flash sale', details: error.issues }); res.status(500).json({ error: 'Could not create flash sale' }) }
})
router.post('/admin/flash-sales/:id/stop', async (req: any, res) => { if (!isAdmin(req)) return res.status(403).json({ error: 'Admin access required' }); const sale = await prisma.flashSale.update({ where: { id: req.params.id }, data: { status: 'archived', endTime: new Date() } }); res.json({ sale }) })
export default router
