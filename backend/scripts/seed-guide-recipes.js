require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const categories = [
  { key: 'beef', label: 'Prime Beef', title: 'Prime Beef Cuts', subtitle: 'Grass-fed and grain-finished Kenya highlands beef, dry-aged and chilled.', sortOrder: 0 },
  { key: 'goat', label: 'Goat / Mbuzi', title: 'Fresh Goat Cuts (Mbuzi)', subtitle: 'Naturally raised rift valley goat meat, tender and freshly butchered.', sortOrder: 1 },
  { key: 'lamb', label: 'Lamb / Mutton', title: 'Selected Lamb & Mutton', subtitle: 'Mild, buttery pasture-fed lamb cuts with delicate marbling.', sortOrder: 2 },
  { key: 'poultry', label: 'Capon & Chicken', title: 'Capon & Farm Fresh Chicken', subtitle: 'Healthy, grain-fed dressed capon and portioned poultry cuts.', sortOrder: 3 },
]

const cuts = [
  { categoryKey: 'beef', sortOrder: 0, name: 'Prime Ribeye Steak', localName: 'Steak ya Mbavu', bestFor: 'High heat grilling & cast-iron searing', cookingMethod: 'Grill / Choma', recommendedTemp: '54°C (Medium Rare)', flavorProfile: 'Rich, intensely juicy with deep intramuscular marbling', priceApprox: 1400, unit: 'per kg', image: '/hincton/beef-cuts.webp', tips: 'Season generously with sea salt and black pepper 40 mins prior. Sear in a screaming hot cast iron with garlic and rosemary butter.', categorySlug: 'beef' },
  { categoryKey: 'beef', sortOrder: 1, name: 'T-Bone / Porterhouse', localName: null, bestFor: 'Ultimate weekend BBQ & flame searing', cookingMethod: 'Grill / Choma', recommendedTemp: '56°C (Medium Rare to Medium)', flavorProfile: 'Best of both worlds: buttery tenderloin on one side, beefy striploin on the other', priceApprox: 1500, unit: 'per kg', image: '/hincton/beef-fresh.webp', tips: 'Cook over medium-high direct coals. Let rest 8 minutes before slicing across the grain.', categorySlug: 'beef' },
  { categoryKey: 'beef', sortOrder: 2, name: 'Boneless Beef Cubes', localName: 'Nyama ya Supu / Mchuzi', bestFor: 'Rich Swahili stews, curries, and pilau', cookingMethod: 'Slow Cook / Stew', recommendedTemp: '85°C+ (Fork Tender)', flavorProfile: 'Melt-in-your-mouth tenderness when simmered with onions, garlic, and ginger', priceApprox: 800, unit: 'per kg', image: '/hincton/beef-cuts.webp', tips: 'Brown the cubes in hot ghee first to lock in savory flavor before simmering low and slow.', categorySlug: 'beef' },
  { categoryKey: 'beef', sortOrder: 3, name: 'Lean Beef Mince (90/10)', localName: null, bestFor: 'Gourmet burgers, homemade meatballs, and samosas', cookingMethod: 'Pan Sear', recommendedTemp: '71°C (Well Done)', flavorProfile: 'Pure beef flavor with ideal moisture retention', priceApprox: 900, unit: 'per kg', image: '/hincton/hero-platter.webp', tips: 'Avoid pressing burgers on the grill to retain the natural juices and fat profile.', categorySlug: 'beef' },
  { categoryKey: 'beef', sortOrder: 4, name: 'Ossobuco with Marrow', localName: null, bestFor: 'Slow-braised Sunday stews with rich bone marrow sauce', cookingMethod: 'Slow Cook / Stew', recommendedTemp: 'Slow braise 2.5 hrs', flavorProfile: 'Gelatinous richness with unctuous roasted bone marrow centers', priceApprox: 700, unit: 'per kg', image: '/hincton/beef-cuts.webp', tips: 'Dust lightly in flour, sear brown, then braise with tomatoes, carrots, and beef stock.', categorySlug: 'beef' },
  { categoryKey: 'goat', sortOrder: 0, name: 'Mbuzi Choma Ribs', localName: 'Mbavu za Mbuzi', bestFor: 'Authentic Kenyan Nyama Choma & BBQ', cookingMethod: 'Grill / Choma', recommendedTemp: 'Slow charcoal grill (74°C)', flavorProfile: 'Crisp seasoned exterior, sweet and deeply succulent interior', priceApprox: 900, unit: 'per kg', image: '/hincton/goat-meat.webp', tips: 'Brush with saltwater and garlic during grilling. Serve with fresh kachumbari and ugali.', categorySlug: 'goat' },
  { categoryKey: 'goat', sortOrder: 1, name: 'Cubed Goat (Bone-in)', localName: 'Nyama ya Mbuzi', bestFor: 'Aromatic Goat Biryani, Wet Fry, and Pepper Stew', cookingMethod: 'Slow Cook / Stew', recommendedTemp: 'Simmer 1.5 - 2 hrs', flavorProfile: 'Savory and wholesome with rich marrow essence from bone-in cuts', priceApprox: 900, unit: 'per kg', image: '/hincton/goat-meat.webp', tips: 'Boil with ginger, garlic, and coriander stems before pan-frying with sweet red onions.', categorySlug: 'goat' },
  { categoryKey: 'goat', sortOrder: 2, name: 'Whole Cleaned Goat Carcass', localName: null, bestFor: 'Family celebrations, ruracio, corporate barbecues, and feasts', cookingMethod: 'Grill / Choma', recommendedTemp: 'Spit roast or segmented cuts', flavorProfile: 'Comprehensive premium assortment: ribs, legs, shoulder, chops', priceApprox: 850, unit: 'per kg (10-14kg avg)', image: '/hincton/goat-meat.webp', tips: 'Custom portioned and packed per your specifications by our master butcher.', categorySlug: 'goat' },
  { categoryKey: 'lamb', sortOrder: 0, name: 'Frenched Lamb Chops', localName: null, bestFor: 'Pan-searing with rosemary, mint butter, or hot coals', cookingMethod: 'Pan Sear', recommendedTemp: '58°C (Medium)', flavorProfile: 'Delicate, sweet herbal notes with melt-in-the-mouth tenderness', priceApprox: 1500, unit: 'per kg', image: '/hincton/lamb-mutton.webp', tips: 'Sear 3-4 minutes per side, baste with thyme and browned butter.', categorySlug: 'lamb' },
  { categoryKey: 'lamb', sortOrder: 1, name: 'Whole Bone-in Lamb Leg', localName: null, bestFor: 'Slow Sunday roast, garlic studded and herb-crusted', cookingMethod: 'Roast / Bake', recommendedTemp: 'Roast at 160°C to 60°C internal', flavorProfile: 'Hearty, aromatic, and easy to carve into succulent slices', priceApprox: 900, unit: 'per kg', image: '/hincton/lamb-mutton.webp', tips: 'Pierce small slits and insert sliced garlic cloves and fresh rosemary sprigs before roasting.', categorySlug: 'lamb' },
  { categoryKey: 'poultry', sortOrder: 0, name: 'Dressed Farm Capon', localName: null, bestFor: 'Kuku Choma, Rotisserie, or Roast Chicken', cookingMethod: 'Roast / Bake', recommendedTemp: '74°C (Safe & Juicy)', flavorProfile: 'Plump, exceptionally tender with crispy golden skin', priceApprox: 450, unit: 'per kg (1.2-1.5kg)', image: '/hincton/chicken.webp', tips: 'Pat skin bone-dry with paper towels before roasting for extra crispy skin.', categorySlug: 'chicken' },
  { categoryKey: 'poultry', sortOrder: 1, name: 'Chicken Wings & Drumsticks', localName: null, bestFor: 'Crispy BBQ wings, peri-peri fry, and family platters', cookingMethod: 'Grill / Choma', recommendedTemp: '74°C internal', flavorProfile: 'Juicy, rich dark meat that absorbs marinades and glazes effortlessly', priceApprox: 600, unit: 'per kg', image: '/hincton/chicken.webp', tips: 'Marinate overnight in lemon juice, garlic, paprika, and bird’s eye chili.', categorySlug: 'chicken' },
]

const recipes = [
  {
    title: 'Authentic Kenyan Nyama Choma', subtitle: 'Charcoal-grilled goat ribs with sea salt, garlic water, and fresh kachumbari.',
    prepTime: '15 mins', cookTime: '45 mins', servings: '4-6 people', difficulty: 'Easy',
    tags: ['BBQ / Choma', 'Goat / Mbuzi', 'Traditional Kenyan'],
    ingredients: ['1.5kg Hincton Fresh Goat Ribs (Mbavu za Mbuzi)', '2 tbsp Coarse Sea Salt', '4 cloves Garlic, crushed in warm water for basting', 'Fresh lemon juice', 'For Kachumbari: 3 diced tomatoes, 1 red onion, 1 fresh chili, coriander, lemon'],
    instructions: ['Prepare medium-hot lump charcoal in your grill.', 'Place the goat ribs bone-side down first over gentle coals.', 'Baste every 10 minutes with garlic-salted water to keep the meat moist.', 'Turn occasionally until golden brown and charred at the edges (approx 45 mins).', 'Rest 5 mins, carve between bones, and serve piping hot with ugali and kachumbari.'],
    cutName: 'Mbuzi Choma Ribs 1Kg', cutCategory: 'goat', cutPrice: 900, cutWeight: '1 kg', cutImage: '/hincton/goat-meat.webp', productKeywords: ['goat', 'mbuzi'], sortOrder: 0,
  },
  {
    title: 'Garlic Butter Basted Ribeye', subtitle: 'Cast-iron seared prime Kenyan ribeye steak with foaming thyme butter.',
    prepTime: '10 mins', cookTime: '8 mins', servings: '2 people', difficulty: 'Medium',
    tags: ['Steakhouse', 'Prime Beef', 'Quick Dinner'],
    ingredients: ['2 thick-cut Hincton Ribeye Steaks (approx 400g each)', '1 tbsp Flaky Sea Salt & fresh cracked black pepper', '3 tbsp Unsalted butter', '3 sprigs Fresh Thyme & 2 sprigs Rosemary', '4 crushed garlic cloves'],
    instructions: ['Bring steaks to room temperature 30 mins before cooking. Pat completely dry.', 'Heat a heavy cast iron skillet until smoking hot. Add high smoke-point oil.', 'Sear steaks undisturbed for 2.5 minutes until a deep golden crust develops.', 'Flip, add butter, garlic, and fresh herbs to the pan.', 'Tilt skillet and continuously spoon the foaming butter over the steaks for 2 minutes.', 'Rest on a warm board for 7 minutes before carving.'],
    cutName: 'Prime Ribeye Steak (Boneless)', cutCategory: 'beef', cutPrice: 1400, cutWeight: '1 kg', cutImage: '/hincton/beef-cuts.webp', productKeywords: ['ribeye'], sortOrder: 1,
  },
  {
    title: 'Slow-Braised Rich Ossobuco', subtitle: 'Tender beef shank with melting bone marrow in a savory tomato herb broth.',
    prepTime: '20 mins', cookTime: '2 hrs 15 mins', servings: '4 people', difficulty: 'Medium',
    tags: ['Slow Cooking', 'Comfort Stew', 'Bone Marrow'],
    ingredients: ['1kg Hincton Ossobuco cuts with center bone marrow', '2 large Red onions & 3 Carrots, roughly chopped', '4 ripe tomatoes, pureed', '400ml rich beef bone broth', 'Fresh bay leaves, rosemary, and black pepper'],
    instructions: ['Season ossobuco shanks with salt and pepper, dusting lightly with flour.', 'Brown shanks on high heat in oil until deeply caramelized, then remove.', 'Saute onions, carrots, and garlic in the same pan until fragrant.', 'Return shanks, add pureed tomatoes and broth, cover tightly with a lid.', 'Simmer on very low heat for 2 hours until the beef pulls effortlessly apart.'],
    cutName: 'Beef Ossobuco with Marrow', cutCategory: 'beef', cutPrice: 700, cutWeight: '1 kg', cutImage: '/hincton/beef-cuts.webp', productKeywords: ['ossobuco', 'shank'], sortOrder: 2,
  },
  {
    title: 'Coastal Swahili Coconut Kuku', subtitle: 'Farm fresh chicken simmered in rich coconut milk, cardamom, and ginger.',
    prepTime: '15 mins', cookTime: '35 mins', servings: '4 people', difficulty: 'Easy',
    tags: ['Swahili Cuisine', 'Farm Poultry', 'Family Favorite'],
    ingredients: ['1 whole Hincton Farm Capon, jointed into 8 pieces', '400ml thick coconut cream (tui mzito)', '1 tbsp freshly grated ginger & minced garlic', '1 tsp ground turmeric & ground coriander', 'Fresh green chilies and chopped coriander leaves'],
    instructions: ['Brown chicken pieces in a pan with a touch of ghee until golden.', 'Add ginger, garlic, turmeric, and green chilies, stirring for 2 minutes.', 'Pour in the light coconut milk and simmer for 25 minutes until chicken is tender.', 'Finish with thick coconut cream and fresh coriander, simmering gently for 5 minutes.', 'Serve with fragrant basmati rice or chapati.'],
    cutName: 'Farm Fresh Dressed Capon', cutCategory: 'chicken', cutPrice: 450, cutWeight: '1.2 kg', cutImage: '/hincton/chicken.webp', productKeywords: ['capon', 'chicken', 'kuku'], sortOrder: 3,
  },
]

async function main() {
  const catCount = await prisma.meatCutCategory.count()
  if (catCount === 0) {
    for (const cat of categories) {
      const category = await prisma.meatCutCategory.create({ data: cat })
      const catCuts = cuts.filter((c) => c.categoryKey === cat.key)
      await prisma.meatCutGuideCut.createMany({
        data: catCuts.map(({ categoryKey, ...rest }) => ({ ...rest, categoryId: category.id })),
      })
    }
    console.log(`Seeded ${categories.length} guide categories and ${cuts.length} cuts`)
  } else {
    console.log(`Guide already seeded (${catCount} categories)`)
  }

  const recipeCount = await prisma.recipe.count()
  if (recipeCount === 0) {
    for (const seed of recipes) {
      const { productKeywords, ...data } = seed
      let productId = null
      for (const keyword of productKeywords) {
        const product = await prisma.product.findFirst({
          where: { name: { contains: keyword, mode: 'insensitive' }, deletedAt: null },
          orderBy: { createdAt: 'asc' },
        })
        if (product) {
          productId = product.id
          console.log(`  Linked "${seed.title}" -> product "${product.name}" (${product.id})`)
          break
        }
      }
      if (!productId) console.log(`  No product match for "${seed.title}" (shop link fallback)`)
      await prisma.recipe.create({ data: { ...data, productId } })
    }
    console.log(`Seeded ${recipes.length} recipes`)
  } else {
    console.log(`Recipes already seeded (${recipeCount})`)
  }
}

main()
  .catch((err) => {
    console.error('Seed failed:', err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
