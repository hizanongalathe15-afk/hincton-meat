"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const prisma_1 = require("../config/prisma");
const zod_1 = require("zod");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const router = express_1.default.Router();
fs_1.default.mkdirSync('uploads/content', { recursive: true });
const contentUpload = (0, multer_1.default)({
    storage: multer_1.default.diskStorage({
        destination: (_req, _file, cb) => cb(null, 'uploads/content/'),
        filename: (_req, file, cb) => cb(null, `content-${Date.now()}-${Math.round(Math.random() * 1e9)}${path_1.default.extname(file.originalname)}`),
    }),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => file.mimetype.startsWith('image/') ? cb(null, true) : cb(new Error('Only image files are allowed')),
});
// Middleware to check admin permissions
const requireAdmin = (req, res, next) => {
    const user = req.user;
    if (!user || !user.roles.includes('ADMIN')) {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};
router.use(requireAdmin);
const defaultSiteProfile = {
    brand: {
        name: 'Hincton Meat Products',
        tagline: 'Only Fresh Meat',
        mantra: 'Quality. Freshness. Integrity.',
        website: 'www.hinctonmeatproducts.com',
        phone: '0759 901 357',
        phoneHref: 'tel:+254759901357',
        email: 'dialformeat@gmail.com',
        emailHref: 'mailto:dialformeat@gmail.com',
        address: 'Summit House, Waiyaki Way, Nairobi, Kenya',
        socialHandle: '@hinctonmeatproducts',
        logo: '/hincton/logo.png',
    },
    companyProfile: 'Hincton Meat Products is a leading supplier of high-quality meat products specializing in goat, beef, chicken, and other livestock products. Located in Nairobi, Kenya, we serve both local and international markets with fresh, safe, and nutritious meat products.',
    mission: 'To deliver fresh, high-quality meat products while upholding the highest standards of food safety, animal welfare, and environmental sustainability.',
    vision: 'To be the leading global provider of premium meat products, known for excellence in quality, sustainability, and ethical sourcing practices.',
    procurementCommitment: 'We prioritize ethical and sustainable livestock procurement by partnering with trusted farmers and suppliers who meet strict standards.',
    markets: [
        'International Market: Exporting premium meat products to the Middle East, East Africa, and other regions.',
        'Local Market: Serving wholesalers, retailers, foodservice providers, and individual consumers across Kenya.',
    ],
    qualityPoints: [
        'Advanced chilling facilities ensuring optimal temperature control.',
        'Modern freezing technology preserving freshness and nutritional value.',
        'Temperature-controlled storage and efficient dispatch systems.',
    ],
    images: {
        hero: '/hincton/hero-platter.jpg',
        about: '/hincton/beef-fresh.jpg',
        market: '/hincton/cattle-market.jpg',
        logo: '/hincton/logo.png',
    },
};
const siteProfileSchema = zod_1.z.object({
    brand: zod_1.z.object({
        name: zod_1.z.string().min(1),
        tagline: zod_1.z.string().min(1),
        mantra: zod_1.z.string().min(1),
        website: zod_1.z.string().optional(),
        phone: zod_1.z.string().min(1),
        phoneHref: zod_1.z.string().min(1),
        email: zod_1.z.string().email(),
        emailHref: zod_1.z.string().min(1),
        address: zod_1.z.string().min(1),
        socialHandle: zod_1.z.string().optional(),
        logo: zod_1.z.string().min(1),
    }),
    companyProfile: zod_1.z.string().min(1),
    mission: zod_1.z.string().min(1),
    vision: zod_1.z.string().min(1),
    procurementCommitment: zod_1.z.string().min(1),
    markets: zod_1.z.array(zod_1.z.string().min(1)).default([]),
    qualityPoints: zod_1.z.array(zod_1.z.string().min(1)).default([]),
    images: zod_1.z.object({
        hero: zod_1.z.string().min(1),
        about: zod_1.z.string().min(1),
        market: zod_1.z.string().min(1),
        logo: zod_1.z.string().min(1),
    }),
});
router.get('/site-profile', async (_req, res) => {
    try {
        const setting = await prisma_1.prisma.systemSetting.findUnique({ where: { key: 'site_profile' } });
        const profile = setting ? { ...defaultSiteProfile, ...JSON.parse(setting.value) } : defaultSiteProfile;
        res.json({ profile });
    }
    catch (error) {
        console.error('Get site profile error:', error);
        res.status(500).json({ error: 'Failed to get site profile' });
    }
});
router.put('/site-profile', async (req, res) => {
    try {
        const profile = siteProfileSchema.parse(req.body);
        const setting = await prisma_1.prisma.systemSetting.upsert({
            where: { key: 'site_profile' },
            update: { value: JSON.stringify(profile), type: 'json', group: 'site', isPublic: true },
            create: {
                key: 'site_profile',
                value: JSON.stringify(profile),
                type: 'json',
                group: 'site',
                description: 'Editable public site profile content',
                isPublic: true,
            },
        });
        res.json({ message: 'Site profile updated', profile: JSON.parse(setting.value) });
    }
    catch (error) {
        console.error('Update site profile error:', error);
        res.status(500).json({ error: 'Failed to update site profile' });
    }
});
router.post('/uploads', contentUpload.single('image'), async (req, res) => {
    try {
        const file = req.file;
        if (!file)
            return res.status(400).json({ error: 'Image is required' });
        res.status(201).json({ url: `/uploads/content/${file.filename}` });
    }
    catch (error) {
        console.error('Content upload error:', error);
        res.status(500).json({ error: 'Failed to upload image' });
    }
});
// === BANNER MANAGEMENT ===
router.get('/banners', async (req, res) => {
    try {
        const banners = await prisma_1.prisma.systemSetting.findMany({
            where: { group: 'banner' },
            orderBy: { key: 'asc' }
        });
        const formattedBanners = banners.map(banner => ({
            id: banner.id,
            key: banner.key,
            title: JSON.parse(banner.value).title || '',
            subtitle: JSON.parse(banner.value).subtitle || '',
            imageUrl: JSON.parse(banner.value).imageUrl || '',
            linkUrl: JSON.parse(banner.value).linkUrl || '',
            isActive: JSON.parse(banner.value).isActive || false,
            position: JSON.parse(banner.value).position || 'home',
            createdAt: banner.createdAt,
            updatedAt: banner.updatedAt
        }));
        res.json({ banners: formattedBanners });
    }
    catch (error) {
        console.error('Get banners error:', error);
        res.status(500).json({ error: 'Failed to get banners' });
    }
});
router.post('/banners', async (req, res) => {
    try {
        const bannerData = zod_1.z.object({
            title: zod_1.z.string().min(1),
            subtitle: zod_1.z.string().optional(),
            imageUrl: zod_1.z.string().url(),
            linkUrl: zod_1.z.string().url().optional(),
            isActive: zod_1.z.boolean().default(true),
            position: zod_1.z.enum(['home', 'category', 'product']).default('home')
        }).parse(req.body);
        const key = `banner_${Date.now()}`;
        const value = JSON.stringify(bannerData);
        const banner = await prisma_1.prisma.systemSetting.create({
            data: {
                key,
                value,
                type: 'json',
                group: 'banner',
                description: `Banner: ${bannerData.title}`,
                isPublic: true
            }
        });
        res.status(201).json({ message: 'Banner created', banner });
    }
    catch (error) {
        console.error('Create banner error:', error);
        res.status(500).json({ error: 'Failed to create banner' });
    }
});
router.put('/banners/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const bannerData = zod_1.z.object({
            title: zod_1.z.string().min(1).optional(),
            subtitle: zod_1.z.string().optional(),
            imageUrl: zod_1.z.string().url().optional(),
            linkUrl: zod_1.z.string().url().optional(),
            isActive: zod_1.z.boolean().optional(),
            position: zod_1.z.enum(['home', 'category', 'product']).optional()
        }).parse(req.body);
        const existingBanner = await prisma_1.prisma.systemSetting.findUnique({
            where: { id }
        });
        if (!existingBanner)
            return res.status(404).json({ error: 'Banner not found' });
        const currentData = JSON.parse(existingBanner.value);
        const updatedData = { ...currentData, ...bannerData };
        const value = JSON.stringify(updatedData);
        const banner = await prisma_1.prisma.systemSetting.update({
            where: { id },
            data: { value }
        });
        res.json({ message: 'Banner updated', banner });
    }
    catch (error) {
        console.error('Update banner error:', error);
        res.status(500).json({ error: 'Failed to update banner' });
    }
});
router.delete('/banners/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_1.prisma.systemSetting.delete({
            where: { id }
        });
        res.json({ message: 'Banner deleted successfully' });
    }
    catch (error) {
        console.error('Delete banner error:', error);
        res.status(500).json({ error: 'Failed to delete banner' });
    }
});
// === BLOG MANAGEMENT ===
router.get('/blog', async (req, res) => {
    try {
        const { page = '1', limit = '20', status, search } = req.query;
        const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
        const limitNum = Math.max(1, parseInt(String(limit), 10) || 20);
        const skip = (pageNum - 1) * limitNum;
        const where = {};
        if (status === 'published')
            where.isPublished = true;
        if (status === 'draft')
            where.isPublished = false;
        if (search) {
            where.OR = [
                { title: { contains: String(search), mode: 'insensitive' } },
                { content: { contains: String(search), mode: 'insensitive' } },
                { excerpt: { contains: String(search), mode: 'insensitive' } }
            ];
        }
        const [posts, total] = await Promise.all([
            prisma_1.prisma.blogPost.findMany({
                where,
                skip,
                take: limitNum,
                orderBy: { createdAt: 'desc' },
                include: {
                    author: { select: { id: true, username: true, profile: { select: { firstName: true, lastName: true } } } },
                    _count: { select: { comments: true } }
                }
            }),
            prisma_1.prisma.blogPost.count({ where })
        ]);
        res.json({
            posts,
            pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) }
        });
    }
    catch (error) {
        console.error('Get blog posts error:', error);
        res.status(500).json({ error: 'Failed to get blog posts' });
    }
});
router.post('/blog', async (req, res) => {
    try {
        const postData = zod_1.z.object({
            title: zod_1.z.string().min(1),
            slug: zod_1.z.string().min(1),
            content: zod_1.z.string().min(1),
            excerpt: zod_1.z.string().optional(),
            featuredImage: zod_1.z.string().url().optional(),
            isPublished: zod_1.z.boolean().default(false),
            isFeatured: zod_1.z.boolean().default(false),
            tags: zod_1.z.array(zod_1.z.string()).optional(),
            metaTitle: zod_1.z.string().optional(),
            metaDescription: zod_1.z.string().optional()
        }).parse(req.body);
        const post = await prisma_1.prisma.blogPost.create({
            data: {
                ...postData,
                authorId: req.user.id,
                tags: postData.tags ? JSON.stringify(postData.tags) : null
            },
            include: {
                author: { select: { id: true, username: true } }
            }
        });
        res.status(201).json({ message: 'Blog post created', post });
    }
    catch (error) {
        console.error('Create blog post error:', error);
        res.status(500).json({ error: 'Failed to create blog post' });
    }
});
router.put('/blog/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const postData = zod_1.z.object({
            title: zod_1.z.string().min(1).optional(),
            slug: zod_1.z.string().min(1).optional(),
            content: zod_1.z.string().min(1).optional(),
            excerpt: zod_1.z.string().optional(),
            featuredImage: zod_1.z.string().url().optional(),
            isPublished: zod_1.z.boolean().optional(),
            isFeatured: zod_1.z.boolean().optional(),
            tags: zod_1.z.array(zod_1.z.string()).optional(),
            metaTitle: zod_1.z.string().optional(),
            metaDescription: zod_1.z.string().optional()
        }).parse(req.body);
        const post = await prisma_1.prisma.blogPost.update({
            where: { id },
            data: {
                ...postData,
                ...(postData.tags && { tags: JSON.stringify(postData.tags) })
            },
            include: {
                author: { select: { id: true, username: true } }
            }
        });
        res.json({ message: 'Blog post updated', post });
    }
    catch (error) {
        console.error('Update blog post error:', error);
        res.status(500).json({ error: 'Failed to update blog post' });
    }
});
router.delete('/blog/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_1.prisma.blogPost.delete({
            where: { id }
        });
        res.json({ message: 'Blog post deleted successfully' });
    }
    catch (error) {
        console.error('Delete blog post error:', error);
        res.status(500).json({ error: 'Failed to delete blog post' });
    }
});
// === CATEGORY MANAGEMENT ===
router.get('/categories', async (req, res) => {
    try {
        const categories = await prisma_1.prisma.category.findMany({
            orderBy: { name: 'asc' },
            include: {
                _count: { select: { products: true } },
                parent: { select: { id: true, name: true } },
                children: {
                    select: { id: true, name: true },
                    orderBy: { name: 'asc' }
                }
            }
        });
        res.json({ categories });
    }
    catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: 'Failed to get categories' });
    }
});
router.post('/categories', async (req, res) => {
    try {
        const categoryData = zod_1.z.object({
            name: zod_1.z.string().min(1),
            slug: zod_1.z.string().min(1),
            description: zod_1.z.string().optional(),
            image: zod_1.z.string().url().optional(),
            parentId: zod_1.z.string().optional(),
            isActive: zod_1.z.boolean().default(true),
            metaTitle: zod_1.z.string().optional(),
            metaDescription: zod_1.z.string().optional()
        }).parse(req.body);
        const category = await prisma_1.prisma.category.create({
            data: categoryData,
            include: {
                parent: true,
                children: true
            }
        });
        res.status(201).json({ message: 'Category created', category });
    }
    catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({ error: 'Failed to create category' });
    }
});
router.put('/categories/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const categoryData = zod_1.z.object({
            name: zod_1.z.string().min(1).optional(),
            slug: zod_1.z.string().min(1).optional(),
            description: zod_1.z.string().optional(),
            image: zod_1.z.string().url().optional(),
            parentId: zod_1.z.string().optional(),
            isActive: zod_1.z.boolean().optional(),
            metaTitle: zod_1.z.string().optional(),
            metaDescription: zod_1.z.string().optional()
        }).parse(req.body);
        const category = await prisma_1.prisma.category.update({
            where: { id },
            data: categoryData,
            include: {
                parent: true,
                children: true
            }
        });
        res.json({ message: 'Category updated', category });
    }
    catch (error) {
        console.error('Update category error:', error);
        res.status(500).json({ error: 'Failed to update category' });
    }
});
// === NAVIGATION MANAGEMENT ===
router.get('/navigation', async (req, res) => {
    try {
        const navigation = await prisma_1.prisma.systemSetting.findMany({
            where: { group: 'navigation' },
            orderBy: { key: 'asc' }
        });
        const formattedNavigation = navigation.map(item => ({
            id: item.id,
            key: item.key,
            ...JSON.parse(item.value)
        }));
        res.json({ navigation: formattedNavigation });
    }
    catch (error) {
        console.error('Get navigation error:', error);
        res.status(500).json({ error: 'Failed to get navigation' });
    }
});
router.post('/navigation', async (req, res) => {
    try {
        const navData = zod_1.z.object({
            label: zod_1.z.string().min(1),
            url: zod_1.z.string().min(1),
            order: zod_1.z.number().int().default(0),
            isActive: zod_1.z.boolean().default(true),
            parentKey: zod_1.z.string().optional()
        }).parse(req.body);
        const key = `nav_${Date.now()}`;
        const value = JSON.stringify(navData);
        const navigation = await prisma_1.prisma.systemSetting.create({
            data: {
                key,
                value,
                type: 'json',
                group: 'navigation',
                description: `Navigation: ${navData.label}`,
                isPublic: true
            }
        });
        res.status(201).json({ message: 'Navigation item created', navigation });
    }
    catch (error) {
        console.error('Create navigation error:', error);
        res.status(500).json({ error: 'Failed to create navigation' });
    }
});
router.put('/navigation/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const navData = zod_1.z.object({
            label: zod_1.z.string().min(1).optional(),
            url: zod_1.z.string().min(1).optional(),
            order: zod_1.z.number().int().optional(),
            isActive: zod_1.z.boolean().optional(),
            parentKey: zod_1.z.string().optional()
        }).parse(req.body);
        const existingNav = await prisma_1.prisma.systemSetting.findUnique({
            where: { id }
        });
        if (!existingNav)
            return res.status(404).json({ error: 'Navigation item not found' });
        const currentData = JSON.parse(existingNav.value);
        const updatedData = { ...currentData, ...navData };
        const value = JSON.stringify(updatedData);
        const navigation = await prisma_1.prisma.systemSetting.update({
            where: { id },
            data: { value }
        });
        res.json({ message: 'Navigation item updated', navigation });
    }
    catch (error) {
        console.error('Update navigation error:', error);
        res.status(500).json({ error: 'Failed to update navigation' });
    }
});
// === CONTACT FORM SUBMISSION ===
router.post('/contact/submit', async (req, res) => {
    try {
        const userId = req.user?.id;
        const contactData = zod_1.z.object({
            name: zod_1.z.string().min(1),
            email: zod_1.z.string().email(),
            phone: zod_1.z.string().optional(),
            subject: zod_1.z.string().min(1),
            message: zod_1.z.string().min(1)
        }).parse(req.body);
        const ticket = await prisma_1.prisma.supportTicket.create({
            data: {
                userId,
                subject: contactData.subject,
                message: [
                    `From: ${contactData.name} <${contactData.email}>`,
                    contactData.phone ? `Phone: ${contactData.phone}` : null,
                    '',
                    contactData.message,
                ].filter(Boolean).join('\n'),
                category: 'GENERAL_INQUIRY',
                priority: 'LOW',
                status: 'OPEN'
            }
        });
        console.log('Contact form submission saved:', contactData);
        res.json({ message: 'Contact form submitted successfully', ticketId: ticket.id });
    }
    catch (error) {
        console.error('Contact form submission error:', error);
        res.status(500).json({ error: 'Failed to submit contact form' });
    }
});
// === ADMIN: GET ALL CONTACT MESSAGES ===
router.get('/admin/contact-messages', requireAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 20, status = 'OPEN', search } = req.query;
        const where = {
            category: 'GENERAL_INQUIRY'
        };
        if (status) {
            where.status = status;
        }
        if (search) {
            where.OR = [
                { subject: { contains: search, mode: 'insensitive' } },
                { message: { contains: search, mode: 'insensitive' } }
            ];
        }
        const tickets = await prisma_1.prisma.supportTicket.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        profile: {
                            select: {
                                fullName: true,
                                avatar: true
                            }
                        }
                    }
                },
                responses: {
                    select: {
                        id: true,
                        message: true,
                        createdAt: true,
                        userId: true,
                        isAdmin: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit)
        });
        const total = await prisma_1.prisma.supportTicket.count({ where });
        const respondentIds = Array.from(new Set(tickets.flatMap(ticket => ticket.responses.map(response => response.userId)).filter(Boolean)));
        const respondents = respondentIds.length > 0
            ? await prisma_1.prisma.user.findMany({
                where: { id: { in: respondentIds } },
                select: {
                    id: true,
                    email: true,
                    profile: { select: { fullName: true } }
                }
            })
            : [];
        const respondentsById = new Map(respondents.map(user => [user.id, user]));
        res.json({
            success: true,
            messages: tickets.map(ticket => ({
                ...ticket,
                contactInfo: {
                    senderName: ticket.user.profile?.fullName || ticket.user.email,
                    senderEmail: ticket.user.email,
                    senderPhone: null
                },
                responses: ticket.responses.map(response => ({
                    ...response,
                    respondent: respondentsById.get(response.userId) || null
                }))
            })),
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        });
    }
    catch (error) {
        console.error('Get contact messages error:', error);
        res.status(500).json({ error: 'Failed to retrieve contact messages' });
    }
});
// === ADMIN: RESPOND TO CONTACT MESSAGE ===
router.post('/admin/contact-messages/:ticketId/respond', requireAdmin, async (req, res) => {
    try {
        const { ticketId } = req.params;
        const { message } = req.body;
        const adminId = req.user?.id;
        if (!message || !message.trim()) {
            return res.status(400).json({ error: 'Response message is required' });
        }
        // Verify ticket exists
        const ticket = await prisma_1.prisma.supportTicket.findUnique({
            where: { id: ticketId }
        });
        if (!ticket) {
            return res.status(404).json({ error: 'Contact message not found' });
        }
        // Create response
        const response = await prisma_1.prisma.supportTicketResponse.create({
            data: {
                ticketId,
                message,
                userId: adminId,
                isAdmin: true
            }
        });
        // Update ticket status
        await prisma_1.prisma.supportTicket.update({
            where: { id: ticketId },
            data: { status: 'IN_PROGRESS' }
        });
        res.json({
            success: true,
            message: 'Response added successfully',
            response
        });
    }
    catch (error) {
        console.error('Respond to contact message error:', error);
        res.status(500).json({ error: 'Failed to respond to contact message' });
    }
});
// === ADMIN: CLOSE/RESOLVE CONTACT MESSAGE ===
router.patch('/admin/contact-messages/:ticketId/close', requireAdmin, async (req, res) => {
    try {
        const { ticketId } = req.params;
        const ticket = await prisma_1.prisma.supportTicket.update({
            where: { id: ticketId },
            data: { status: 'RESOLVED' }
        });
        res.json({
            success: true,
            message: 'Contact message closed successfully',
            ticket
        });
    }
    catch (error) {
        console.error('Close contact message error:', error);
        res.status(500).json({ error: 'Failed to close contact message' });
    }
});
exports.default = router;
//# sourceMappingURL=contentManagement.js.map