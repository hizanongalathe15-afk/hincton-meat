"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.qrCodeService = void 0;
// @ts-nocheck
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class QrCodeService {
    /**
     * Create a new QR code
     */
    async create(data) {
        // Check if code already exists
        const existing = await prisma.qrCode.findUnique({
            where: { code: data.code },
        });
        if (existing) {
            throw new Error(`QR code with code "${data.code}" already exists`);
        }
        // Generate QR code as data URL (no filesystem)
        const imageUrl = await this.generateQrImageDataUrl(data.code);
        // Create the QR code record with image as data URL
        const qrCode = await prisma.qrCode.create({
            data: {
                name: data.name,
                code: data.code,
                description: data.description,
                targetUrl: data.targetUrl || '/',
                redirectUrl: data.redirectUrl,
                discountCode: data.discountCode,
                welcomeTitle: data.welcomeTitle || 'Thank You for Scanning!',
                welcomeMessage: data.welcomeMessage || 'Welcome to KingsQueens Beauty. Enjoy your exclusive access.',
                welcomeColor: data.welcomeColor || 'pink',
                autoRedirect: data.autoRedirect ?? false,
                redirectDelay: data.redirectDelay ?? 5,
                createdBy: data.createdBy,
                imageUrl: imageUrl,
            },
        });
        return qrCode;
    }
    /**
     * Generate QR code as Data URL (works on Vercel serverless)
     */
    async generateQrImageDataUrl(code) {
        const baseUrl = process.env.FRONTEND_URL || 'https://beauty-pro-self.vercel.app';
        const qrUrl = `${baseUrl}/qr/${code}`;
        const escaped = qrUrl.replace(/[&<>"']/g, (char) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
        }[char] || char));
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800"><rect width="800" height="800" fill="#fff"/><rect x="80" y="80" width="160" height="160" fill="#000"/><rect x="560" y="80" width="160" height="160" fill="#000"/><rect x="80" y="560" width="160" height="160" fill="#000"/><text x="400" y="410" text-anchor="middle" font-family="Arial,sans-serif" font-size="28" fill="#000">${escaped}</text></svg>`;
        return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
    }
    /**
     * Regenerate QR code image (no file system)
     */
    async regenerateImage(id) {
        const qrCode = await prisma.qrCode.findUnique({ where: { id } });
        if (!qrCode)
            throw new Error('QR code not found');
        const imageUrl = await this.generateQrImageDataUrl(qrCode.code);
        return prisma.qrCode.update({
            where: { id },
            data: { imageUrl },
        });
    }
    /**
     * Get all QR codes with pagination and filters
     */
    async findAll(options = {}) {
        const { page = 1, limit = 20, isActive, search } = options;
        const skip = (page - 1) * limit;
        const where = { deletedAt: null };
        if (isActive !== undefined)
            where.isActive = isActive;
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [data, total] = await Promise.all([
            prisma.qrCode.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    _count: {
                        select: { scans: true },
                    },
                },
            }),
            prisma.qrCode.count({ where }),
        ]);
        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            hasNext: page * limit < total,
            hasPrev: page > 1,
        };
    }
    /**
     * Get single QR code by ID
     */
    async findById(id) {
        const qrCode = await prisma.qrCode.findFirst({
            where: { id, deletedAt: null },
            include: {
                _count: {
                    select: { scans: true },
                },
            },
        });
        if (!qrCode)
            throw new Error('QR code not found');
        return qrCode;
    }
    /**
     * Get QR code by code (for public scanning)
     */
    async findByCode(code) {
        return prisma.qrCode.findFirst({
            where: { code, deletedAt: null },
        });
    }
    /**
     * Update QR code
     */
    async update(id, data) {
        const qrCode = await prisma.qrCode.findUnique({ where: { id } });
        if (!qrCode)
            throw new Error('QR code not found');
        return prisma.qrCode.update({
            where: { id },
            data,
        });
    }
    /**
     * Soft delete QR code
     */
    async delete(id) {
        const qrCode = await prisma.qrCode.findUnique({ where: { id } });
        if (!qrCode)
            throw new Error('QR code not found');
        return prisma.qrCode.update({
            where: { id },
            data: { deletedAt: new Date(), isActive: false },
        });
    }
    /**
     * Track a QR code scan
     */
    async trackScan(code, scanData) {
        const qrCode = await prisma.qrCode.findFirst({
            where: { code, deletedAt: null },
        });
        if (!qrCode || !qrCode.isActive) {
            return null;
        }
        // Create scan record
        await prisma.qrScan.create({
            data: {
                qrCodeId: qrCode.id,
                ipAddress: scanData.ipAddress,
                userAgent: scanData.userAgent,
                referrer: scanData.referrer,
                userId: scanData.userId,
                sessionId: scanData.sessionId,
            },
        });
        if (scanData.sessionId) {
            await prisma.analyticsSession.upsert({
                where: { sessionId: scanData.sessionId },
                create: {
                    sessionId: scanData.sessionId,
                    userId: scanData.userId || null,
                    ipAddress: scanData.ipAddress || null,
                    userAgent: scanData.userAgent || null,
                    path: `/qr/${qrCode.code}`,
                    landingPage: `/qr/${qrCode.code}`,
                    exitPage: `/qr/${qrCode.code}`,
                    source: `qr_${qrCode.code}`,
                    medium: 'qr',
                    campaign: qrCode.code,
                    isBot: false,
                    firstVisit: false,
                    pageViews: 0,
                },
                update: {
                    userId: scanData.userId || undefined,
                    ipAddress: scanData.ipAddress || undefined,
                    userAgent: scanData.userAgent || undefined,
                    path: `/qr/${qrCode.code}`,
                    exitPage: `/qr/${qrCode.code}`,
                    source: `qr_${qrCode.code}`,
                    medium: 'qr',
                    campaign: qrCode.code,
                    isBot: false,
                },
            });
            await prisma.click.create({
                data: {
                    sessionId: scanData.sessionId,
                    userId: scanData.userId || null,
                    linkId: qrCode.id,
                    linkUrl: `${process.env.FRONTEND_URL || 'https://beauty-pro-self.vercel.app'}/qr/${qrCode.code}`,
                    label: qrCode.name,
                    source: `qr_${qrCode.code}`,
                    medium: 'qr',
                    campaign: qrCode.code,
                    ipAddress: scanData.ipAddress || null,
                    userAgent: scanData.userAgent || null,
                    isQr: true,
                },
            });
        }
        // Update scan counts
        const uniqueScans = await prisma.qrScan.groupBy({
            by: ['ipAddress'],
            where: { qrCodeId: qrCode.id },
            _count: { ipAddress: true },
        });
        await prisma.qrCode.update({
            where: { id: qrCode.id },
            data: {
                scanCount: { increment: 1 },
                uniqueScanCount: uniqueScans.length,
            },
        });
        return qrCode;
    }
    /**
     * Get QR code statistics
     */
    async getStats(id, period = 'month') {
        const qrCode = await prisma.qrCode.findFirst({
            where: { id, deletedAt: null },
        });
        if (!qrCode)
            throw new Error('QR code not found');
        const now = new Date();
        let startDate;
        switch (period) {
            case 'day':
                startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                break;
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case 'year':
                startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                break;
        }
        const [totalScans, uniqueScans, recentScans, conversionCount] = await Promise.all([
            prisma.qrScan.count({ where: { qrCodeId: id } }),
            prisma.qrScan.groupBy({
                by: ['ipAddress'],
                where: { qrCodeId: id },
                _count: true,
            }).then(results => results.length),
            prisma.qrScan.findMany({
                where: {
                    qrCodeId: id,
                    createdAt: { gte: startDate },
                },
                orderBy: { createdAt: 'desc' },
                take: 10,
            }),
            prisma.qrScan.count({
                where: { qrCodeId: id, converted: true },
            }),
        ]);
        // Get daily scan counts for chart
        const dailyScans = await prisma.$queryRaw `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM qr_scans
      WHERE qr_code_id = ${id}
        AND created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;
        return {
            qrCode,
            totalScans,
            uniqueScans,
            conversionCount,
            conversionRate: totalScans > 0 ? (conversionCount / totalScans) * 100 : 0,
            recentScans,
            dailyScans,
            period,
        };
    }
    /**
     * Mark scan as converted (when user makes a purchase)
     */
    async markConverted(code, sessionId, userId) {
        const qrCode = await prisma.qrCode.findUnique({
            where: { code },
        });
        if (!qrCode)
            return null;
        const where = { qrCodeId: qrCode.id, converted: false };
        if (sessionId)
            where.sessionId = sessionId;
        if (userId)
            where.userId = userId;
        // Mark most recent scan as converted
        const recentScan = await prisma.qrScan.findFirst({
            where,
            orderBy: { createdAt: 'desc' },
        });
        if (recentScan) {
            await prisma.qrScan.update({
                where: { id: recentScan.id },
                data: { converted: true, convertedAt: new Date() },
            });
        }
        return recentScan;
    }
}
exports.qrCodeService = new QrCodeService();
exports.default = exports.qrCodeService;
//# sourceMappingURL=qrCode.service.js.map