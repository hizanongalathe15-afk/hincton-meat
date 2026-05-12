import express from 'express'
import { prisma } from '../config/prisma'

const router = express.Router()

// Minimal schema-aligned affiliate endpoints.
// Prisma models: Affiliate, Referral, Commission, AffiliatePayout

router.get('/mine', async (req, res) => {
  try {
    const userId = (req as any).user?.id
    if (!userId) return res.status(401).json({ error: 'Invalid token' })

    const affiliate = await prisma.affiliate.findUnique({ where: { userId } })
    if (!affiliate) return res.status(404).json({ error: 'Affiliate profile not found' })

    const referrals = await prisma.referral.findMany({ where: { affiliateId: affiliate.id } })
    const payouts = await prisma.affiliatePayout.findMany({ where: { affiliateId: affiliate.id } })

    res.json({
      affiliate,
      stats: {
        referralsCount: referrals.length,
        totalEarned: referrals.reduce((s, r) => s + Number(r.commission ?? 0), 0),
        paidOut: payouts.reduce((s, p) => s + Number(p.amount), 0),
      },
    })
  } catch (error) {
    console.error('Get affiliate mine error:', error)
    res.status(500).json({ error: 'Failed to get affiliate data' })
  }
})

export default router

