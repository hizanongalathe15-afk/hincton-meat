"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const prisma_1 = require("../config/prisma");
const router = express_1.default.Router();
// Minimal schema-aligned affiliate endpoints.
// Prisma models: Affiliate, Referral, Commission, AffiliatePayout
router.get('/mine', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ error: 'Invalid token' });
        const affiliate = await prisma_1.prisma.affiliate.findUnique({ where: { userId } });
        if (!affiliate)
            return res.status(404).json({ error: 'Affiliate profile not found' });
        const referrals = await prisma_1.prisma.referral.findMany({ where: { affiliateId: affiliate.id } });
        const payouts = await prisma_1.prisma.affiliatePayout.findMany({ where: { affiliateId: affiliate.id } });
        res.json({
            affiliate,
            stats: {
                referralsCount: referrals.length,
                totalEarned: referrals.reduce((s, r) => s + Number(r.commission ?? 0), 0),
                paidOut: payouts.reduce((s, p) => s + Number(p.amount), 0),
            },
        });
    }
    catch (error) {
        console.error('Get affiliate mine error:', error);
        res.status(500).json({ error: 'Failed to get affiliate data' });
    }
});
exports.default = router;
//# sourceMappingURL=affiliates.js.map