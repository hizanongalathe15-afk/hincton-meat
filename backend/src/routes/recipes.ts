import express from 'express'
import { z } from 'zod'
import { prisma } from '../config/prisma'
import { authenticate } from '../middleware/auth'

const router = express.Router()

const isAdmin = (req: any) => (req.user?.roles || []).some((r: string) => ['ADMIN', 'SUPER_ADMIN'].includes(r))

const stringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((v) => typeof v === 'string').map((v) => v.trim()).filter(Boolean) : []

const serializeRecipe = (recipe: any) => ({
  id: recipe.id,
  title: recipe.title,
  subtitle: recipe.subtitle,
  prepTime: recipe.prepTime,
  cookTime: recipe.cookTime,
  servings: recipe.servings,
  difficulty: recipe.difficulty,
  tags: stringArray(recipe.tags),
  ingredients: stringArray(recipe.ingredients),
  instructions: stringArray(recipe.instructions),
  featuredCut: {
    name: recipe.cutName,
    category: recipe.cutCategory,
    price: recipe.cutPrice,
    weight: recipe.cutWeight,
    image: recipe.cutImage,
  },
  productId: recipe.productId,
})

// Public: active recipes
router.get('/recipes', async (_req, res) => {
  try {
    const recipes = await prisma.recipe.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    })
    res.json({ recipes: recipes.map(serializeRecipe) })
  } catch (err) {
    console.error('Recipes load error:', err)
    res.status(500).json({ error: 'Failed to load recipes' })
  }
})

const recipeSchema = z.object({
  title: z.string().trim().min(3).max(160),
  subtitle: z.string().trim().min(3).max(300),
  prepTime: z.string().trim().min(1).max(40),
  cookTime: z.string().trim().min(1).max(40),
  servings: z.string().trim().min(1).max(40),
  difficulty: z.string().trim().min(1).max(30).default('Easy'),
  tags: z.array(z.string().trim().min(1).max(60)).max(10).default([]),
  ingredients: z.array(z.string().trim().min(1).max(200)).min(1).max(30),
  instructions: z.array(z.string().trim().min(1).max(500)).min(1).max(30),
  cutName: z.string().trim().min(2).max(120),
  cutCategory: z.string().trim().min(1).max(60),
  cutPrice: z.coerce.number().positive().max(1000000),
  cutWeight: z.string().trim().min(1).max(40),
  cutImage: z.string().trim().min(1).max(500),
  productId: z.string().trim().max(64).nullable().optional(),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.coerce.boolean().default(true),
})

// Admin: list all including inactive
router.get('/admin/recipes', authenticate, async (req: any, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' })
  try {
    const recipes = await prisma.recipe.findMany({ orderBy: { sortOrder: 'asc' } })
    res.json({ recipes })
  } catch {
    res.status(500).json({ error: 'Failed to load recipes' })
  }
})

router.post('/admin/recipes', authenticate, async (req: any, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' })
  try {
    const data = recipeSchema.parse(req.body)
    if (data.productId) {
      const product = await prisma.product.findUnique({ where: { id: data.productId } })
      if (!product) return res.status(400).json({ error: 'Linked product not found' })
    }
    const recipe = await prisma.recipe.create({ data: data as any })
    res.json({ recipe: serializeRecipe(recipe) })
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.issues[0]?.message || 'Invalid recipe' })
    res.status(400).json({ error: err?.message || 'Failed to create recipe' })
  }
})

router.put('/admin/recipes/:id', authenticate, async (req: any, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' })
  try {
    const data = recipeSchema.partial().parse(req.body)
    if (data.productId) {
      const product = await prisma.product.findUnique({ where: { id: data.productId } })
      if (!product) return res.status(400).json({ error: 'Linked product not found' })
    }
    const recipe = await prisma.recipe.update({ where: { id: req.params.id }, data: data as any })
    res.json({ recipe: serializeRecipe(recipe) })
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.issues[0]?.message || 'Invalid recipe' })
    res.status(400).json({ error: err?.message || 'Failed to update recipe' })
  }
})

router.delete('/admin/recipes/:id', authenticate, async (req: any, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' })
  try {
    await prisma.recipe.delete({ where: { id: req.params.id } })
    res.json({ ok: true })
  } catch {
    res.status(500).json({ error: 'Failed to delete recipe' })
  }
})

const seedRecipeData: Array<Record<string, any>> = [
  {
    title: 'Authentic Kenyan Nyama Choma',
    subtitle: 'Charcoal-grilled goat ribs with sea salt, garlic water, and fresh kachumbari.',
    prepTime: '15 mins', cookTime: '45 mins', servings: '4-6 people', difficulty: 'Easy',
    tags: ['BBQ / Choma', 'Goat / Mbuzi', 'Traditional Kenyan'],
    ingredients: [
      '1.5kg Hincton Fresh Goat Ribs (Mbavu za Mbuzi)',
      '2 tbsp Coarse Sea Salt',
      '4 cloves Garlic, crushed in warm water for basting',
      'Fresh lemon juice',
      'For Kachumbari: 3 diced tomatoes, 1 red onion, 1 fresh chili, coriander, lemon',
    ],
    instructions: [
      'Prepare medium-hot lump charcoal in your grill.',
      'Place the goat ribs bone-side down first over gentle coals.',
      'Baste every 10 minutes with garlic-salted water to keep the meat moist.',
      'Turn occasionally until golden brown and charred at the edges (approx 45 mins).',
      'Rest 5 mins, carve between bones, and serve piping hot with ugali and kachumbari.',
    ],
    cutName: 'Mbuzi Choma Ribs 1Kg', cutCategory: 'goat', cutPrice: 900, cutWeight: '1 kg',
    cutImage: '/hincton/goat-meat.webp', productKeywords: ['goat', 'mbuzi'], sortOrder: 0,
  },
  {
    title: 'Garlic Butter Basted Ribeye',
    subtitle: 'Cast-iron seared prime Kenyan ribeye steak with foaming thyme butter.',
    prepTime: '10 mins', cookTime: '8 mins', servings: '2 people', difficulty: 'Medium',
    tags: ['Steakhouse', 'Prime Beef', 'Quick Dinner'],
    ingredients: [
      '2 thick-cut Hincton Ribeye Steaks (approx 400g each)',
      '1 tbsp Flaky Sea Salt & fresh cracked black pepper',
      '3 tbsp Unsalted butter',
      '3 sprigs Fresh Thyme & 2 sprigs Rosemary',
      '4 crushed garlic cloves',
    ],
    instructions: [
      'Bring steaks to room temperature 30 mins before cooking. Pat completely dry.',
      'Heat a heavy cast iron skillet until smoking hot. Add high smoke-point oil.',
      'Sear steaks undisturbed for 2.5 minutes until a deep golden crust develops.',
      'Flip, add butter, garlic, and fresh herbs to the pan.',
      'Tilt skillet and continuously spoon the foaming butter over the steaks for 2 minutes.',
      'Rest on a warm board for 7 minutes before carving.',
    ],
    cutName: 'Prime Ribeye Steak (Boneless)', cutCategory: 'beef', cutPrice: 1400, cutWeight: '1 kg',
    cutImage: '/hincton/beef-cuts.webp', productKeywords: ['ribeye'], sortOrder: 1,
  },
  {
    title: 'Slow-Braised Rich Ossobuco',
    subtitle: 'Tender beef shank with melting bone marrow in a savory tomato herb broth.',
    prepTime: '20 mins', cookTime: '2 hrs 15 mins', servings: '4 people', difficulty: 'Medium',
    tags: ['Slow Cooking', 'Comfort Stew', 'Bone Marrow'],
    ingredients: [
      '1kg Hincton Ossobuco cuts with center bone marrow',
      '2 large Red onions & 3 Carrots, roughly chopped',
      '4 ripe tomatoes, pureed',
      '400ml rich beef bone broth',
      'Fresh bay leaves, rosemary, and black pepper',
    ],
    instructions: [
      'Season ossobuco shanks with salt and pepper, dusting lightly with flour.',
      'Brown shanks on high heat in oil until deeply caramelized, then remove.',
      'Saute onions, carrots, and garlic in the same pan until fragrant.',
      'Return shanks, add pureed tomatoes and broth, cover tightly with a lid.',
      'Simmer on very low heat for 2 hours until the beef pulls effortlessly apart.',
    ],
    cutName: 'Beef Ossobuco with Marrow', cutCategory: 'beef', cutPrice: 700, cutWeight: '1 kg',
    cutImage: '/hincton/beef-cuts.webp', productKeywords: ['ossobuco', 'shank'], sortOrder: 2,
  },
  {
    title: 'Coastal Swahili Coconut Kuku',
    subtitle: 'Farm fresh chicken simmered in rich coconut milk, cardamom, and ginger.',
    prepTime: '15 mins', cookTime: '35 mins', servings: '4 people', difficulty: 'Easy',
    tags: ['Swahili Cuisine', 'Farm Poultry', 'Family Favorite'],
    ingredients: [
      '1 whole Hincton Farm Capon, jointed into 8 pieces',
      '400ml thick coconut cream (tui mzito)',
      '1 tbsp freshly grated ginger & minced garlic',
      '1 tsp ground turmeric & ground coriander',
      'Fresh green chilies and chopped coriander leaves',
    ],
    instructions: [
      'Brown chicken pieces in a pan with a touch of ghee until golden.',
      'Add ginger, garlic, turmeric, and green chilies, stirring for 2 minutes.',
      'Pour in the light coconut milk and simmer for 25 minutes until chicken is tender.',
      'Finish with thick coconut cream and fresh coriander, simmering gently for 5 minutes.',
      'Serve with fragrant basmati rice or chapati.',
    ],
    cutName: 'Farm Fresh Dressed Capon', cutCategory: 'chicken', cutPrice: 450, cutWeight: '1.2 kg',
    cutImage: '/hincton/chicken.webp', productKeywords: ['capon', 'chicken', 'kuku'], sortOrder: 3,
  },
]

export const seedRecipes = async () => {
  try {
    const count = await prisma.recipe.count()
    if (count > 0) return
    for (const seed of seedRecipeData) {
      const { productKeywords, ...data } = seed
      let productId: string | null = null
      for (const keyword of productKeywords || []) {
        const product = await prisma.product.findFirst({
          where: { name: { contains: keyword, mode: 'insensitive' }, deletedAt: null },
          orderBy: { createdAt: 'asc' },
        })
        if (product) {
          productId = product.id
          break
        }
      }
      await prisma.recipe.create({ data: { ...data, productId } as any })
    }
    console.log('Seeded butcher recipes')
  } catch (err) {
    console.error('Recipe seed skipped:', err)
  }
}

export default router
