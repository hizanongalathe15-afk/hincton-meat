import express from 'express'
import { z } from 'zod'
import { prisma } from '../config/prisma'
import { authenticate } from '../middleware/auth'

const router = express.Router()

const isAdmin = (req: any) => (req.user?.roles || []).some((r: string) => ['ADMIN', 'SUPER_ADMIN'].includes(r))

// Public: full guide (active categories with their active cuts)
router.get('/meat-guide', async (_req, res) => {
  try {
    const categories = await prisma.meatCutCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        cuts: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    })
    res.json({
      categories: categories.map((cat) => ({
        id: cat.id,
        key: cat.key,
        label: cat.label,
        title: cat.title,
        subtitle: cat.subtitle,
        cuts: cat.cuts.map((cut) => ({
          id: cut.id,
          name: cut.name,
          localName: cut.localName,
          bestFor: cut.bestFor,
          cookingMethod: cut.cookingMethod,
          recommendedTemp: cut.recommendedTemp,
          flavorProfile: cut.flavorProfile,
          priceApprox: cut.priceApprox,
          unit: cut.unit,
          image: cut.image,
          tips: cut.tips,
          categorySlug: cut.categorySlug,
        })),
      })),
    })
  } catch (err) {
    console.error('Meat guide load error:', err)
    res.status(500).json({ error: 'Failed to load meat cuts guide' })
  }
})

const categorySchema = z.object({
  key: z.string().trim().min(2).max(40),
  label: z.string().trim().min(2).max(80),
  title: z.string().trim().min(2).max(160),
  subtitle: z.string().trim().min(2).max(300),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.coerce.boolean().default(true),
})

const cutSchema = z.object({
  categoryKey: z.string().trim().min(2).max(40),
  name: z.string().trim().min(2).max(120),
  localName: z.string().trim().max(120).optional().nullable(),
  bestFor: z.string().trim().min(2).max(200),
  cookingMethod: z.string().trim().min(2).max(60),
  recommendedTemp: z.string().trim().min(2).max(80),
  flavorProfile: z.string().trim().min(2).max(300),
  priceApprox: z.coerce.number().positive().max(1000000),
  unit: z.string().trim().min(1).max(40).default('per kg'),
  image: z.string().trim().min(1).max(500),
  tips: z.string().trim().min(2).max(600),
  categorySlug: z.string().trim().min(1).max(60),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.coerce.boolean().default(true),
})

// Admin: manage categories
router.get('/admin/meat-guide/categories', authenticate, async (req: any, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' })
  try {
    const categories = await prisma.meatCutCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { cuts: true } } },
    })
    res.json({ categories })
  } catch {
    res.status(500).json({ error: 'Failed to load categories' })
  }
})

router.post('/admin/meat-guide/categories', authenticate, async (req: any, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' })
  try {
    const data = categorySchema.parse(req.body)
    const category = await prisma.meatCutCategory.create({ data })
    res.json({ category })
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.issues[0]?.message || 'Invalid category' })
    res.status(400).json({ error: err?.code === 'P2002' ? 'A category with this key already exists' : err?.message || 'Failed to create category' })
  }
})

router.put('/admin/meat-guide/categories/:id', authenticate, async (req: any, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' })
  try {
    const data = categorySchema.partial().parse(req.body)
    const category = await prisma.meatCutCategory.update({ where: { id: req.params.id }, data })
    res.json({ category })
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to update category' })
  }
})

router.delete('/admin/meat-guide/categories/:id', authenticate, async (req: any, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' })
  try {
    await prisma.meatCutCategory.delete({ where: { id: req.params.id } })
    res.json({ ok: true })
  } catch {
    res.status(500).json({ error: 'Failed to delete category' })
  }
})

// Admin: manage cuts
router.get('/admin/meat-guide/cuts', authenticate, async (req: any, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' })
  try {
    const cuts = await prisma.meatCutGuideCut.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: { category: { select: { id: true, key: true, label: true } } },
    })
    res.json({ cuts })
  } catch {
    res.status(500).json({ error: 'Failed to load cuts' })
  }
})

router.post('/admin/meat-guide/cuts', authenticate, async (req: any, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' })
  try {
    const data = cutSchema.parse(req.body)
    const category = await prisma.meatCutCategory.findUnique({ where: { key: data.categoryKey } })
    if (!category) return res.status(404).json({ error: `Category "${data.categoryKey}" not found` })
    const { categoryKey, ...cutData } = data
    const cut = await prisma.meatCutGuideCut.create({ data: { ...cutData, categoryId: category.id } })
    res.json({ cut })
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.issues[0]?.message || 'Invalid cut' })
    res.status(400).json({ error: err?.message || 'Failed to create cut' })
  }
})

router.put('/admin/meat-guide/cuts/:id', authenticate, async (req: any, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' })
  try {
    const data = cutSchema.partial().parse(req.body)
    const { categoryKey, ...cutData } = data
    const updateData: Record<string, unknown> = { ...cutData }
    if (categoryKey) {
      const category = await prisma.meatCutCategory.findUnique({ where: { key: categoryKey } })
      if (!category) return res.status(404).json({ error: `Category "${categoryKey}" not found` })
      updateData.categoryId = category.id
    }
    const cut = await prisma.meatCutGuideCut.update({ where: { id: req.params.id }, data: updateData as any })
    res.json({ cut })
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to update cut' })
  }
})

router.delete('/admin/meat-guide/cuts/:id', authenticate, async (req: any, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' })
  try {
    await prisma.meatCutGuideCut.delete({ where: { id: req.params.id } })
    res.json({ ok: true })
  } catch {
    res.status(500).json({ error: 'Failed to delete cut' })
  }
})

const seedCategories = [
  {
    key: 'beef',
    label: 'Prime Beef',
    title: 'Prime Beef Cuts',
    subtitle: 'Grass-fed and grain-finished Kenya highlands beef, dry-aged and chilled.',
    sortOrder: 0,
  },
  {
    key: 'goat',
    label: 'Goat / Mbuzi',
    title: 'Fresh Goat Cuts (Mbuzi)',
    subtitle: 'Naturally raised rift valley goat meat, tender and freshly butchered.',
    sortOrder: 1,
  },
  {
    key: 'lamb',
    label: 'Lamb / Mutton',
    title: 'Selected Lamb & Mutton',
    subtitle: 'Mild, buttery pasture-fed lamb cuts with delicate marbling.',
    sortOrder: 2,
  },
  {
    key: 'poultry',
    label: 'Capon & Chicken',
    title: 'Capon & Farm Fresh Chicken',
    subtitle: 'Healthy, grain-fed dressed capon and portioned poultry cuts.',
    sortOrder: 3,
  },
]

const seedCuts: Array<Record<string, any>> = [
  {
    categoryKey: 'beef', sortOrder: 0, name: 'Prime Ribeye Steak', localName: 'Steak ya Mbavu',
    bestFor: 'High heat grilling & cast-iron searing', cookingMethod: 'Grill / Choma',
    recommendedTemp: '54°C (Medium Rare)', flavorProfile: 'Rich, intensely juicy with deep intramuscular marbling',
    priceApprox: 1400, unit: 'per kg', image: '/hincton/beef-cuts.webp',
    tips: 'Season generously with sea salt and black pepper 40 mins prior. Sear in a screaming hot cast iron with garlic and rosemary butter.',
    categorySlug: 'beef',
  },
  {
    categoryKey: 'beef', sortOrder: 1, name: 'T-Bone / Porterhouse', localName: null,
    bestFor: 'Ultimate weekend BBQ & flame searing', cookingMethod: 'Grill / Choma',
    recommendedTemp: '56°C (Medium Rare to Medium)', flavorProfile: 'Best of both worlds: buttery tenderloin on one side, beefy striploin on the other',
    priceApprox: 1500, unit: 'per kg', image: '/hincton/beef-fresh.webp',
    tips: 'Cook over medium-high direct coals. Let rest 8 minutes before slicing across the grain.',
    categorySlug: 'beef',
  },
  {
    categoryKey: 'beef', sortOrder: 2, name: 'Boneless Beef Cubes', localName: 'Nyama ya Supu / Mchuzi',
    bestFor: 'Rich Swahili stews, curries, and pilau', cookingMethod: 'Slow Cook / Stew',
    recommendedTemp: '85°C+ (Fork Tender)', flavorProfile: 'Melt-in-your-mouth tenderness when simmered with onions, garlic, and ginger',
    priceApprox: 800, unit: 'per kg', image: '/hincton/beef-cuts.webp',
    tips: 'Brown the cubes in hot ghee first to lock in savory flavor before simmering low and slow.',
    categorySlug: 'beef',
  },
  {
    categoryKey: 'beef', sortOrder: 3, name: 'Lean Beef Mince (90/10)', localName: null,
    bestFor: 'Gourmet burgers, homemade meatballs, and samosas', cookingMethod: 'Pan Sear',
    recommendedTemp: '71°C (Well Done)', flavorProfile: 'Pure beef flavor with ideal moisture retention',
    priceApprox: 900, unit: 'per kg', image: '/hincton/hero-platter.webp',
    tips: 'Avoid pressing burgers on the grill to retain the natural juices and fat profile.',
    categorySlug: 'beef',
  },
  {
    categoryKey: 'beef', sortOrder: 4, name: 'Ossobuco with Marrow', localName: null,
    bestFor: 'Slow-braised Sunday stews with rich bone marrow sauce', cookingMethod: 'Slow Cook / Stew',
    recommendedTemp: 'Slow braise 2.5 hrs', flavorProfile: 'Gelatinous richness with unctuous roasted bone marrow centers',
    priceApprox: 700, unit: 'per kg', image: '/hincton/beef-cuts.webp',
    tips: 'Dust lightly in flour, sear brown, then braise with tomatoes, carrots, and beef stock.',
    categorySlug: 'beef',
  },
  {
    categoryKey: 'goat', sortOrder: 0, name: 'Mbuzi Choma Ribs', localName: 'Mbavu za Mbuzi',
    bestFor: 'Authentic Kenyan Nyama Choma & BBQ', cookingMethod: 'Grill / Choma',
    recommendedTemp: 'Slow charcoal grill (74°C)', flavorProfile: 'Crisp seasoned exterior, sweet and deeply succulent interior',
    priceApprox: 900, unit: 'per kg', image: '/hincton/goat-meat.webp',
    tips: 'Brush with saltwater and garlic during grilling. Serve with fresh kachumbari and ugali.',
    categorySlug: 'goat',
  },
  {
    categoryKey: 'goat', sortOrder: 1, name: 'Cubed Goat (Bone-in)', localName: 'Nyama ya Mbuzi',
    bestFor: 'Aromatic Goat Biryani, Wet Fry, and Pepper Stew', cookingMethod: 'Slow Cook / Stew',
    recommendedTemp: 'Simmer 1.5 - 2 hrs', flavorProfile: 'Savory and wholesome with rich marrow essence from bone-in cuts',
    priceApprox: 900, unit: 'per kg', image: '/hincton/goat-meat.webp',
    tips: 'Boil with ginger, garlic, and coriander stems before pan-frying with sweet red onions.',
    categorySlug: 'goat',
  },
  {
    categoryKey: 'goat', sortOrder: 2, name: 'Whole Cleaned Goat Carcass', localName: null,
    bestFor: 'Family celebrations, ruracio, corporate barbecues, and feasts', cookingMethod: 'Grill / Choma',
    recommendedTemp: 'Spit roast or segmented cuts', flavorProfile: 'Comprehensive premium assortment: ribs, legs, shoulder, chops',
    priceApprox: 850, unit: 'per kg (10-14kg avg)', image: '/hincton/goat-meat.webp',
    tips: 'Custom portioned and packed per your specifications by our master butcher.',
    categorySlug: 'goat',
  },
  {
    categoryKey: 'lamb', sortOrder: 0, name: 'Frenched Lamb Chops', localName: null,
    bestFor: 'Pan-searing with rosemary, mint butter, or hot coals', cookingMethod: 'Pan Sear',
    recommendedTemp: '58°C (Medium)', flavorProfile: 'Delicate, sweet herbal notes with melt-in-the-mouth tenderness',
    priceApprox: 1500, unit: 'per kg', image: '/hincton/lamb-mutton.webp',
    tips: 'Sear 3-4 minutes per side, baste with thyme and browned butter.',
    categorySlug: 'lamb',
  },
  {
    categoryKey: 'lamb', sortOrder: 1, name: 'Whole Bone-in Lamb Leg', localName: null,
    bestFor: 'Slow Sunday roast, garlic studded and herb-crusted', cookingMethod: 'Roast / Bake',
    recommendedTemp: 'Roast at 160°C to 60°C internal', flavorProfile: 'Hearty, aromatic, and easy to carve into succulent slices',
    priceApprox: 900, unit: 'per kg', image: '/hincton/lamb-mutton.webp',
    tips: 'Pierce small slits and insert sliced garlic cloves and fresh rosemary sprigs before roasting.',
    categorySlug: 'lamb',
  },
  {
    categoryKey: 'poultry', sortOrder: 0, name: 'Dressed Farm Capon', localName: null,
    bestFor: 'Kuku Choma, Rotisserie, or Roast Chicken', cookingMethod: 'Roast / Bake',
    recommendedTemp: '74°C (Safe & Juicy)', flavorProfile: 'Plump, exceptionally tender with crispy golden skin',
    priceApprox: 450, unit: 'per kg (1.2-1.5kg)', image: '/hincton/chicken.webp',
    tips: 'Pat skin bone-dry with paper towels before roasting for extra crispy skin.',
    categorySlug: 'chicken',
  },
  {
    categoryKey: 'poultry', sortOrder: 1, name: 'Chicken Wings & Drumsticks', localName: null,
    bestFor: 'Crispy BBQ wings, peri-peri fry, and family platters', cookingMethod: 'Grill / Choma',
    recommendedTemp: '74°C internal', flavorProfile: 'Juicy, rich dark meat that absorbs marinades and glazes effortlessly',
    priceApprox: 600, unit: 'per kg', image: '/hincton/chicken.webp',
    tips: 'Marinate overnight in lemon juice, garlic, paprika, and bird’s eye chili.',
    categorySlug: 'chicken',
  },
]

export const seedMeatGuide = async () => {
  try {
    const count = await prisma.meatCutCategory.count()
    if (count > 0) return
    for (const cat of seedCategories) {
      const category = await prisma.meatCutCategory.create({ data: cat })
      const cuts = seedCuts.filter((c) => c.categoryKey === cat.key)
      await prisma.meatCutGuideCut.createMany({
        data: cuts.map(({ categoryKey, ...rest }) => ({ ...rest, categoryId: category.id })) as any,
      })
    }
    console.log('Seeded Master Butcher meat cuts guide')
  } catch (err) {
    console.error('Meat guide seed skipped:', err)
  }
}

export default router
