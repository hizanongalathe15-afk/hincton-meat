require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const showcaseReviews = [
  {
    authorName: 'Wanjiru K.',
    location: 'Kilimani, Nairobi',
    rating: 5,
    cutPurchased: 'Prime Dry-Aged Ribeye',
    dishPrepared: 'Cast-Iron Butter Basted Ribeye Steak',
    cookingTip: 'Rest for a solid 8 minutes with crushed garlic butter — melt-in-the-mouth tenderness!',
    photoUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
    verifiedBuyer: true,
    isFeatured: true,
    likesCount: 38,
  },
  {
    authorName: 'Brian O.',
    location: 'Karen, Nairobi',
    rating: 5,
    cutPurchased: 'Fresh Goat / Mbuzi Choma Ribs',
    dishPrepared: 'Acacia Charcoal Mbuzi Choma with Kachumbari',
    cookingTip: 'Slow roast with coarse sea salt and rosemary brine. Best mbuzi in Nairobi hands down.',
    photoUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
    verifiedBuyer: true,
    isFeatured: true,
    likesCount: 54,
  },
  {
    authorName: 'Amina M.',
    location: 'Westlands, Nairobi',
    rating: 5,
    cutPurchased: 'Farm Fresh Country Capon',
    dishPrepared: 'Swahili Coconut Kuku Stew',
    cookingTip: 'Simmered gently with fresh turmeric and coconut cream. Incredibly rich flavor.',
    photoUrl: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
    verifiedBuyer: true,
    isFeatured: true,
    likesCount: 29,
  },
]

async function main() {
  const count = await prisma.photoReview.count({ where: { deletedAt: null } })
  if (count > 0) {
    console.log(`Photo reviews already exist (${count}). Nothing to seed.`)
    return
  }
  await prisma.photoReview.createMany({ data: showcaseReviews })
  const total = await prisma.photoReview.count()
  console.log(`Seeded ${showcaseReviews.length} showcase photo reviews. Total now: ${total}`)
}

main()
  .catch((err) => {
    console.error('Seed failed:', err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
