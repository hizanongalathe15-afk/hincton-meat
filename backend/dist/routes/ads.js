"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const prisma_1 = require("../config/prisma");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const auth_2 = require("../middleware/auth");
const router = express_1.default.Router();
// Ad placement schemas
const adPlacementSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    type: zod_1.z.enum(['BANNER', 'SIDEBAR', 'FOOTER', 'HEADER', 'IN_CONTENT', 'POPUP', 'VIDEO']),
    position: zod_1.z.string(),
    size: zod_1.z.object({
        width: zod_1.z.number(),
        height: zod_1.z.number()
    }),
    isActive: zod_1.z.boolean().default(true),
    targeting: zod_1.z.object({
        locations: zod_1.z.array(zod_1.z.string()).optional(),
        demographics: zod_1.z.object({
            ageRange: zod_1.z.object({
                min: zod_1.z.number().optional(),
                max: zod_1.z.number().optional()
            }).optional(),
            gender: zod_1.z.array(zod_1.z.string()).optional(),
            interests: zod_1.z.array(zod_1.z.string()).optional()
        }).optional(),
        behavior: zod_1.z.object({
            pageViews: zod_1.z.number().optional(),
            timeOnSite: zod_1.z.number().optional(),
            previousPurchases: zod_1.z.boolean().optional()
        }).optional()
    }).optional(),
    schedule: zod_1.z.object({
        startDate: zod_1.z.string().datetime().optional(),
        endDate: zod_1.z.string().datetime().optional(),
        daysOfWeek: zod_1.z.array(zod_1.z.number()).optional(), // 0-6 (Sunday-Saturday)
        hoursOfDay: zod_1.z.array(zod_1.z.number()).optional() // 0-23
    }).optional()
});
const adCampaignSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    advertiserId: zod_1.z.string().optional(),
    budget: zod_1.z.object({
        total: zod_1.z.number(),
        daily: zod_1.z.number().optional(),
        cpc: zod_1.z.number().optional(), // Cost per click
        cpm: zod_1.z.number().optional(), // Cost per mille (1000 impressions)
        cpa: zod_1.z.number().optional() // Cost per action
    }),
    targeting: zod_1.z.object({
        locations: zod_1.z.array(zod_1.z.string()).optional(),
        demographics: zod_1.z.object({
            ageRange: zod_1.z.object({
                min: zod_1.z.number().optional(),
                max: zod_1.z.number().optional()
            }).optional(),
            gender: zod_1.z.array(zod_1.z.string()).optional(),
            interests: zod_1.z.array(zod_1.z.string()).optional()
        }).optional(),
        keywords: zod_1.z.array(zod_1.z.string()).optional(),
        devices: zod_1.z.array(zod_1.z.enum(['DESKTOP', 'MOBILE', 'TABLET'])).optional()
    }).optional(),
    creative: zod_1.z.object({
        title: zod_1.z.string(),
        description: zod_1.z.string(),
        imageUrl: zod_1.z.string().url().optional(),
        landingUrl: zod_1.z.string().url(),
        buttonText: zod_1.z.string().optional()
    }),
    isActive: zod_1.z.boolean().default(true),
    startDate: zod_1.z.string().datetime(),
    endDate: zod_1.z.string().datetime()
});
// === AD PLACEMENTS ===
router.get('/placements', auth_1.authenticate, async (req, res) => {
    try {
        const { page = '1', limit = '50', type, isActive } = req.query;
        const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
        const limitNum = Math.max(1, parseInt(String(limit), 10) || 50);
        const skip = (pageNum - 1) * limitNum;
        const where = {};
        if (type)
            where.type = type;
        if (isActive !== undefined)
            where.isActive = isActive === 'true';
        const [placements, total] = await Promise.all([
            prisma_1.prisma.adPlacement?.findMany({
                where,
                skip,
                take: limitNum,
                orderBy: { createdAt: 'desc' },
                include: {
                    _count: {
                        select: {
                            impressions: true,
                            clicks: true
                        }
                    }
                }
            }),
            prisma_1.prisma.adPlacement?.count({ where })
        ]);
        res.json({
            placements: placements || [],
            pagination: { page: pageNum, limit: limitNum, total: total || 0, pages: Math.ceil((total || 0) / limitNum) }
        });
    }
    catch (error) {
        console.error('Get ad placements error:', error);
        res.status(500).json({ error: 'Failed to get ad placements' });
    }
});
router.post('/placements', auth_1.authenticate, (0, auth_2.authorize)('ADMIN'), async (req, res) => {
    try {
        const data = adPlacementSchema.parse(req.body);
        const placement = await prisma_1.prisma.adPlacement?.create({
            data: {
                ...data,
                size: data.size,
                targeting: data.targeting,
                schedule: data.schedule
            }
        });
        res.status(201).json({ message: 'Ad placement created successfully', placement });
    }
    catch (error) {
        console.error('Create ad placement error:', error);
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Invalid placement data', details: error.issues });
        }
        res.status(500).json({ error: 'Failed to create ad placement' });
    }
});
router.put('/placements/:id', auth_1.authenticate, (0, auth_2.authorize)('ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        const data = adPlacementSchema.partial().parse(req.body);
        const placement = await prisma_1.prisma.adPlacement?.update({
            where: { id },
            data: {
                ...data,
                ...(data.size && { size: data.size }),
                ...(data.targeting && { targeting: data.targeting }),
                ...(data.schedule && { schedule: data.schedule })
            }
        });
        res.json({ message: 'Ad placement updated successfully', placement });
    }
    catch (error) {
        console.error('Update ad placement error:', error);
        res.status(500).json({ error: 'Failed to update ad placement' });
    }
});
router.delete('/placements/:id', auth_1.authenticate, (0, auth_2.authorize)('ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_1.prisma.$transaction([
            prisma_1.prisma.adConversion.deleteMany({ where: { placementId: id } }),
            prisma_1.prisma.adClick.deleteMany({ where: { placementId: id } }),
            prisma_1.prisma.adImpression.deleteMany({ where: { placementId: id } }),
            prisma_1.prisma.adPlacement.delete({ where: { id } }),
        ]);
        res.json({ message: 'Ad placement deleted successfully' });
    }
    catch (error) {
        console.error('Delete ad placement error:', error);
        res.status(500).json({ error: 'Failed to delete ad placement' });
    }
});
// === AD CAMPAIGNS ===
router.get('/campaigns', auth_1.authenticate, async (req, res) => {
    try {
        const { page = '1', limit = '50', isActive, advertiserId } = req.query;
        const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
        const limitNum = Math.max(1, parseInt(String(limit), 10) || 50);
        const skip = (pageNum - 1) * limitNum;
        const where = {};
        if (isActive !== undefined)
            where.isActive = isActive === 'true';
        if (advertiserId)
            where.advertiserId = advertiserId;
        const [campaigns, total] = await Promise.all([
            prisma_1.prisma.adCampaign?.findMany({
                where,
                skip,
                take: limitNum,
                orderBy: { createdAt: 'desc' },
                include: {
                    advertiser: {
                        select: {
                            id: true,
                            username: true,
                            email: true
                        }
                    },
                    _count: {
                        select: {
                            impressions: true,
                            clicks: true,
                            conversions: true
                        }
                    }
                }
            }),
            prisma_1.prisma.adCampaign?.count({ where })
        ]);
        res.json({
            campaigns: campaigns || [],
            pagination: { page: pageNum, limit: limitNum, total: total || 0, pages: Math.ceil((total || 0) / limitNum) }
        });
    }
    catch (error) {
        console.error('Get ad campaigns error:', error);
        res.status(500).json({ error: 'Failed to get ad campaigns' });
    }
});
router.post('/campaigns', auth_1.authenticate, (0, auth_2.authorize)('ADMIN'), async (req, res) => {
    try {
        const data = adCampaignSchema.parse(req.body);
        const advertiserId = data.advertiserId || req.user?.id;
        if (!advertiserId) {
            return res.status(400).json({ error: 'Advertiser is required' });
        }
        const campaign = await prisma_1.prisma.adCampaign?.create({
            data: {
                ...data,
                advertiserId,
                budget: data.budget,
                targeting: data.targeting,
                creative: data.creative
            }
        });
        res.status(201).json({ message: 'Ad campaign created successfully', campaign });
    }
    catch (error) {
        console.error('Create ad campaign error:', error);
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Invalid campaign data', details: error.issues });
        }
        res.status(500).json({ error: 'Failed to create ad campaign' });
    }
});
router.put('/campaigns/:id', auth_1.authenticate, (0, auth_2.authorize)('ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        const data = adCampaignSchema.partial().parse(req.body);
        const campaign = await prisma_1.prisma.adCampaign?.update({
            where: { id },
            data: {
                ...data,
                ...(data.budget && { budget: data.budget }),
                ...(data.targeting && { targeting: data.targeting }),
                ...(data.creative && { creative: data.creative })
            }
        });
        res.json({ message: 'Ad campaign updated successfully', campaign });
    }
    catch (error) {
        console.error('Update ad campaign error:', error);
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Invalid campaign data', details: error.issues });
        }
        res.status(500).json({ error: 'Failed to update ad campaign' });
    }
});
router.delete('/campaigns/:id', auth_1.authenticate, (0, auth_2.authorize)('ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_1.prisma.$transaction([
            prisma_1.prisma.adConversion.deleteMany({ where: { campaignId: id } }),
            prisma_1.prisma.adClick.deleteMany({ where: { campaignId: id } }),
            prisma_1.prisma.adImpression.deleteMany({ where: { campaignId: id } }),
            prisma_1.prisma.adCampaign.delete({ where: { id } }),
        ]);
        res.json({ message: 'Ad campaign deleted successfully' });
    }
    catch (error) {
        console.error('Delete ad campaign error:', error);
        res.status(500).json({ error: 'Failed to delete ad campaign' });
    }
});
// === AD SERVING ===
router.get('/serve', async (req, res) => {
    try {
        const { placementId, location, device, userAgent } = req.query;
        // Check if user has consented to advertising cookies
        const adConsent = req.cookies?.advertising_consent === 'true';
        if (!adConsent) {
            return res.json({
                ad: null,
                reason: 'no_consent',
                message: 'User has not consented to advertising cookies'
            });
        }
        // Get placement details
        const placement = await prisma_1.prisma.adPlacement?.findUnique({
            where: { id: placementId },
            select: {
                id: true,
                name: true,
                type: true,
                position: true,
                size: true,
                isActive: true,
                targeting: true,
                schedule: true
            }
        });
        if (!placement || !placement.isActive) {
            return res.json({ ad: null, reason: 'placement_not_found' });
        }
        // Check targeting criteria
        const now = new Date();
        const userLocation = location;
        const userDevice = device;
        // Find matching campaigns
        const campaigns = await prisma_1.prisma.adCampaign?.findMany({
            where: {
                isActive: true,
                startDate: { lte: now },
                endDate: { gte: now },
                OR: [
                    { targeting: { path: ['locations'], array_contains: [userLocation] } }
                ]
            },
            select: {
                id: true,
                name: true,
                advertiserId: true,
                budget: true,
                targeting: true,
                creative: true,
                isActive: true,
                startDate: true,
                endDate: true,
                createdAt: true,
                updatedAt: true,
                advertiser: {
                    select: {
                        id: true,
                        username: true,
                        email: true
                    }
                }
            }
        });
        if (!campaigns || campaigns.length === 0) {
            return res.json({ ad: null, reason: 'no_matching_campaigns' });
        }
        // Select best campaign (simplified - in production would use more sophisticated bidding)
        const selectedCampaign = campaigns[0];
        // Record impression
        await prisma_1.prisma.adImpression?.create({
            data: {
                campaignId: selectedCampaign.id,
                placementId: placement.id,
                userAgent: userAgent,
                ip: req.ip,
                location: userLocation,
                device: userDevice,
                timestamp: new Date()
            }
        });
        res.json({
            ad: {
                id: selectedCampaign.id,
                title: selectedCampaign.creative?.title,
                description: selectedCampaign.creative?.description,
                imageUrl: selectedCampaign.creative?.imageUrl,
                landingUrl: selectedCampaign.creative?.landingUrl,
                buttonText: selectedCampaign.creative?.buttonText,
                advertiser: selectedCampaign.advertiser?.username,
                placement: {
                    id: placement.id,
                    type: placement.type,
                    size: placement.size
                }
            },
            tracking: {
                impressionId: `imp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            }
        });
    }
    catch (error) {
        console.error('Serve ad error:', error);
        res.status(500).json({ error: 'Failed to serve ad' });
    }
});
router.post('/track/:type', async (req, res) => {
    try {
        const { type } = req.params; // 'click' or 'conversion'
        const { impressionId, campaignId, placementId } = req.body;
        if (type === 'click') {
            await prisma_1.prisma.adClick?.create({
                data: {
                    campaignId,
                    placementId,
                    impressionId,
                    timestamp: new Date(),
                    ip: req.ip,
                    userAgent: req.get('User-Agent')
                }
            });
        }
        else if (type === 'conversion') {
            await prisma_1.prisma.adConversion?.create({
                data: {
                    campaignId,
                    placementId,
                    impressionId,
                    timestamp: new Date(),
                    value: req.body.value || 0,
                    ip: req.ip,
                    userAgent: req.get('User-Agent')
                }
            });
        }
        res.json({ success: true });
    }
    catch (error) {
        console.error('Track ad error:', error);
        res.status(500).json({ error: 'Failed to track ad interaction' });
    }
});
// === ANALYTICS ===
router.get('/analytics', auth_1.authenticate, (0, auth_2.authorize)('ADMIN'), async (req, res) => {
    try {
        const { period = '30', campaignId, placementId } = req.query;
        const days = Math.max(1, parseInt(String(period), 10) || 30);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const where = {
            timestamp: { gte: startDate }
        };
        if (campaignId)
            where.campaignId = campaignId;
        if (placementId)
            where.placementId = placementId;
        const [impressions, clicks, conversions, revenue] = await Promise.all([
            prisma_1.prisma.adImpression?.count({ where }),
            prisma_1.prisma.adClick?.count({ where }),
            prisma_1.prisma.adConversion?.count({ where }),
            prisma_1.prisma.adConversion?.aggregate({
                where,
                _sum: { value: true }
            })
        ]);
        const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
        const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;
        const cpm = impressions > 0 ? (Number(revenue._sum.value) || 0) / (impressions / 1000) : 0;
        const cpc = clicks > 0 ? (Number(revenue._sum.value) || 0) / clicks : 0;
        res.json({
            period: `${days} days`,
            metrics: {
                impressions,
                clicks,
                conversions,
                revenue: Number(revenue._sum.value) || 0,
                ctr: parseFloat(ctr.toFixed(2)),
                conversionRate: parseFloat(conversionRate.toFixed(2)),
                cpm: parseFloat(cpm.toFixed(2)),
                cpc: parseFloat(cpc.toFixed(2))
            },
            generatedAt: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Get ad analytics error:', error);
        res.status(500).json({ error: 'Failed to get ad analytics' });
    }
});
exports.default = router;
//# sourceMappingURL=ads.js.map