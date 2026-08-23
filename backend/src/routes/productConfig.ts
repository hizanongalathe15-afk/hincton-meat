import express from 'express'
import { z } from 'zod'
import { prisma } from '../config/prisma'
import { authenticate } from '../middleware/auth'

const router = express.Router()

const isAdmin = (req: any) => (req.user?.roles || []).some((r: string) => ['ADMIN', 'SUPER_ADMIN'].includes(r))

const DEFAULT_BUTCHER_PREP = {
  cutStyles: [
    'Standard Butcher Cut',
    'Thick Steaks (1.5")',
    'Stew Cubes (Bite-size)',
    'Stir-Fry Strips',
    'Fine Mince',
  ],
  fatTrimLevels: [
    'Standard Trim',
    'Extra Lean (Trimmed)',
    'Rich & Marbled',
  ],
  seasonings: [
    'Natural (Unseasoned)',
    'Nyama Choma Rub',
    'Garlic & Rosemary',
    'Swahili Masala',
  ],
}

const DEFAULT_SHOP_PILLS = [
  { id: '', label: '🥩 All Cuts' },
  { id: 'beef', label: 'Beef Steaks & Cuts' },
  { id: 'goat', label: 'Goat / Mbuzi' },
  { id: 'lamb', label: 'Lamb / Mutton' },
  { id: 'chicken', label: 'Capon & Chicken' },
  { id: 'sausages', label: 'Sausages & Burgers' },
  { id: 'fish', label: 'Lake Fish' },
  { id: 'pet-food', label: 'Pet Food' },
]

const DEFAULT_STORAGE_GUIDELINES = [
  'Refrigerate immediately upon receipt',
  'Consume within 3-5 days of opening',
  'Freeze for extended storage (up to 6 months)',
  'Thaw in refrigerator, not at room temperature',
]

async function getSetting(key: string): Promise<any> {
  const setting = await prisma.systemSetting.findUnique({ where: { key } })
  if (!setting) return null
  try { return JSON.parse(setting.value) } catch { return null }
}

async function upsertSetting(key: string, value: any, group: string) {
  return prisma.systemSetting.upsert({
    where: { key },
    update: { value: JSON.stringify(value), type: 'json' },
    create: { key, value: JSON.stringify(value), type: 'json', group, isPublic: true, description: key },
  })
}

router.get('/product-config', async (_req, res) => {
  try {
    const [butcherPrep, shopPills, storageGuidelines] = await Promise.all([
      getSetting('product_page_butcher_prep'),
      getSetting('shop_category_pills'),
      getSetting('product_page_storage_guidelines'),
    ])
    res.json({
      butcherPrep: butcherPrep || DEFAULT_BUTCHER_PREP,
      shopPills: shopPills || DEFAULT_SHOP_PILLS,
      storageGuidelines: storageGuidelines || DEFAULT_STORAGE_GUIDELINES,
    })
  } catch (err) {
    console.error('Product config load error:', err)
    res.status(500).json({ error: 'Failed to load product configuration' })
  }
})

const butcherPrepSchema = z.object({
  cutStyles: z.array(z.string().trim().min(1).max(120)).min(1),
  fatTrimLevels: z.array(z.string().trim().min(1).max(120)).min(1),
  seasonings: z.array(z.string().trim().min(1).max(120)).min(1),
})

const shopPillsSchema = z.array(
  z.object({
    id: z.string().trim().max(60),
    label: z.string().trim().min(1).max(120),
  })
).min(1)

const storageGuidelinesSchema = z.array(z.string().trim().min(1).max(300)).min(1)

router.put('/admin/product-config/butcher-prep', authenticate, async (req: any, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' })
  try {
    const data = butcherPrepSchema.parse(req.body)
    await upsertSetting('product_page_butcher_prep', data, 'product_config')
    res.json({ ok: true })
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Invalid data' })
  }
})

router.put('/admin/product-config/shop-pills', authenticate, async (req: any, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' })
  try {
    const data = shopPillsSchema.parse(req.body)
    await upsertSetting('shop_category_pills', data, 'product_config')
    res.json({ ok: true })
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Invalid data' })
  }
})

router.put('/admin/product-config/storage-guidelines', authenticate, async (req: any, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' })
  try {
    const data = storageGuidelinesSchema.parse(req.body)
    await upsertSetting('product_page_storage_guidelines', data, 'product_config')
    res.json({ ok: true })
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Invalid data' })
  }
})

export async function seedProductConfig() {
  try {
    await prisma.$connect()
    const existing = await prisma.systemSetting.findUnique({ where: { key: 'product_page_butcher_prep' } })
    if (!existing) {
      await upsertSetting('product_page_butcher_prep', DEFAULT_BUTCHER_PREP, 'product_config')
      console.log('[seed] product_page_butcher_prep seeded')
    }
    const pillsExisting = await prisma.systemSetting.findUnique({ where: { key: 'shop_category_pills' } })
    if (!pillsExisting) {
      await upsertSetting('shop_category_pills', DEFAULT_SHOP_PILLS, 'product_config')
      console.log('[seed] shop_category_pills seeded')
    }
    const storageExisting = await prisma.systemSetting.findUnique({ where: { key: 'product_page_storage_guidelines' } })
    if (!storageExisting) {
      await upsertSetting('product_page_storage_guidelines', DEFAULT_STORAGE_GUIDELINES, 'product_config')
      console.log('[seed] product_page_storage_guidelines seeded')
    }
  } catch (err) {
    console.error('[seed] product config seed error:', err)
  }
}

export default router
