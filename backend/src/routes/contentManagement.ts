import express from 'express'
import type { AuthRequest } from '../middleware/auth'


import { prisma } from '../config/prisma'
import { z } from 'zod'
import multer from 'multer'
import path from 'path'
import fs from 'fs'

const router = express.Router()
const emitContactUpdate = (req: any, event: string, payload: Record<string, unknown>) => {
  const io = req.app?.get?.('io')
  if (!io) return
  io.emit(event, payload)
}
const uploadBasePath = process.env.UPLOAD_DIR || (process.env.VERCEL ? '/tmp/uploads' : 'uploads')
const contentUploadPath = path.join(uploadBasePath, 'content')
const ensureDirectory = (dir: string) => {
  try {
    fs.mkdirSync(dir, { recursive: true })
  } catch (error) {
    console.warn(`Unable to create directory ${dir}:`, error)
  }
}
ensureDirectory(contentUploadPath)

const contentUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      ensureDirectory(contentUploadPath)
      cb(null, contentUploadPath)
    },
    filename: (_req, file, cb) => cb(null, `content-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`),
  }),
  limits: { fileSize: 80 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/') || file.mimetype.startsWith('audio/')) return cb(null, true)
    cb(new Error('Only image, video, or audio files are allowed'))
  },
})

// Middleware to check admin permissions
const requireAdmin = (req: any, res: any, next: any) => {
  const user = req.user
  if (!user || !user.roles.includes('ADMIN')) {
    return res.status(403).json({ error: 'Admin access required' })
  }
  next()
}

const parseJsonValue = <T = any>(value: string | undefined, fallback: T): T => {
  try {
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

router.use(requireAdmin)

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
    socialLinks: [
      { label: 'Instagram', url: 'https://www.instagram.com/hinctonmeatproducts' },
      { label: 'Facebook', url: 'https://www.facebook.com/' },
      { label: 'WhatsApp', url: 'https://wa.me/254759901357' },
    ],
  },
  companyProfile:
    'Hincton Meat Products is a leading supplier of high-quality meat products specializing in goat, beef, chicken, and other livestock products. Located in Nairobi, Kenya, we serve both local and international markets with fresh, safe, and nutritious meat products.',
  mission:
    'To deliver fresh, high-quality meat products while upholding the highest standards of food safety, animal welfare, and environmental sustainability.',
  vision:
    'To be the leading global provider of premium meat products, known for excellence in quality, sustainability, and ethical sourcing practices.',
  procurementCommitment:
    'We prioritize ethical and sustainable livestock procurement by partnering with trusted farmers and suppliers who meet strict standards.',
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
    hero: '/hincton/hero-platter.webp',
    about: '/hincton/beef-fresh.webp',
    market: '/hincton/cattle-market.webp',
    logo: '/hincton/logo.png',
    contact: '/hincton/hero-platter.webp',
    farms: '/hincton/cattle-market.webp',
    sustainability: '/hincton/beef-fresh.webp',
    careers: '/hincton/logo.png',
    blog: '/hincton/hero-platter.webp',
    wellness: '/hincton/beef-fresh.webp',
    returns: '/hincton/hero-platter.webp',
  },
  pages: {
    about: { title: 'About Us', subtitle: 'Quality, freshness, and integrity from supplier to customer.', body: 'Hincton Meat Products is a leading supplier of high-quality meat products.', image: '/hincton/beef-fresh.webp', sections: [] },
    farms: { title: 'Our Farms', subtitle: 'Trusted supplier relationships and transparent sourcing.', body: 'We work with farms and suppliers that meet our quality, food safety, and handling standards.', image: '/hincton/cattle-market.webp', sections: [] },
    sustainability: { title: 'Sustainability', subtitle: 'Responsible sourcing, cold-chain handling, and reduced waste.', body: 'Our sustainability approach focuses on efficient operations, responsible procurement, and safe product handling.', image: '/hincton/beef-fresh.webp', sections: [] },
    contact: { title: 'Contact', subtitle: 'Talk to our team about orders, supply, delivery, or partnerships.', body: 'Contact Hincton Meat Products for retail, wholesale, foodservice, and export enquiries.', image: '/hincton/hero-platter.webp', sections: [] },
    careers: { title: 'Careers', subtitle: 'Join the team behind Hincton Meat Products.', body: 'Explore roles in operations, delivery, customer care, procurement, technology, and retail support.', image: '/hincton/logo.png', sections: [] },
    wellness: { title: 'Wellness', subtitle: 'Practical food handling, nutrition, and kitchen guidance.', body: 'Read practical guidance for safe storage, balanced meals, preparation, and freshness.', image: '/hincton/beef-fresh.webp', sections: [] },
    returns: { title: 'Returns', subtitle: 'Clear support for order, quality, and delivery issues.', body: 'Because fresh products are perishable, returns are reviewed quickly with order details, timing, and supporting photos where relevant.', image: '/hincton/hero-platter.webp', sections: [] },
    blog: { title: 'Blog', subtitle: 'Stories, guides, updates, and recipes from the Hincton team.', body: 'Browse posts from the admin-managed blog.', image: '/hincton/hero-platter.webp', sections: [] },
  },
  terms: [
    {
      title: '1. Agreement To These Terms',
      body: 'By creating an account, browsing products, adding items to cart, placing an order, paying through M-PESA, card, cash on delivery, or using support chat, you agree to these Terms and Conditions. If you do not agree, you should not use the website or place an order. These terms apply to buyers, guests, account holders, and any person acting on behalf of a buyer.',
    },
    {
      title: '2. Account Registration And Security',
      body: 'You must provide accurate names, email addresses, phone numbers, delivery details, and payment information. You are responsible for keeping your password, OTP, and device access secure. Activity from your account may be treated as your activity. Notify Hincton Meat Products immediately if you believe your account, phone, email, or device has been misused.',
    },
    {
      title: '3. Product Information, Weights, And Availability',
      body: 'Product names, images, descriptions, prices, pack sizes, weight units, and availability are managed through the platform and may change based on stock, supplier availability, preparation method, or market price. Meat products can have natural weight variation. We aim to keep product data accurate, but availability is confirmed at order processing and checkout stock validation.',
    },
    {
      title: '4. Orders, Holds, And Stock',
      body: 'Adding a product to cart does not complete a purchase. Stock is confirmed when an order is submitted and accepted by the system. If multiple customers attempt to buy limited stock, the system validates available quantity before creating the order. Hincton Meat Products may cancel, adjust, or contact you about an order if stock, pricing, delivery, payment, address, or compliance issues arise.',
    },
    {
      title: '5. Pricing, Payment, And Taxes',
      body: 'Prices are shown in the currency displayed by the platform, commonly Kenya shillings for local orders. Delivery fees, promotions, discounts, taxes, and payment charges may apply. M-PESA payments require the buyer to approve the STK prompt or complete the provided payment flow. An order may remain pending until payment is confirmed.',
    },
    {
      title: '6. Delivery, Location, And Order Tracking',
      body: 'You must provide a real delivery address and, where available, a map pin or GPS location. If browser location permission is denied, you may enter the address manually and use the map preview to confirm the destination. Delivery times are estimates and may be affected by traffic, weather, stock preparation, payment confirmation, address accuracy, customer availability, or events beyond our control.',
    },
    {
      title: '7. Fresh Food Handling',
      body: 'Meat and perishable products require proper handling after delivery. You are responsible for receiving the order on time, refrigerating or freezing products as appropriate, and following food safety guidance. Hincton Meat Products is not responsible for spoilage caused by delayed collection, incorrect storage, or inability to reach the buyer at the provided contact details.',
    },
    {
      title: '8. Returns, Refunds, And Complaints',
      body: 'Because meat is perishable, returns may be limited. If there is a quality, quantity, delivery, or payment issue, contact support promptly with the order number, photos where relevant, and a clear description. Refunds, replacements, credits, or order adjustments are reviewed case by case according to product condition, timing, evidence, and applicable consumer protection rules.',
    },
    {
      title: '9. Messaging, Reviews, And User Content',
      body: 'You may send messages, contact forms, chats, reviews, images, or profile details through the website. You agree not to submit abusive, illegal, misleading, fraudulent, obscene, threatening, or infringing content. Hincton Meat Products may moderate, remove, or restrict content or accounts that harm users, staff, systems, or business operations.',
    },
    {
      title: '10. Acceptable Use',
      body: 'You must not attack, scrape, overload, reverse engineer, bypass authentication, abuse coupons, impersonate another person, upload malware, exploit bugs, or use the website for illegal activity. We may limit, suspend, or terminate access if we detect misuse, suspicious payments, fraud, security risk, or repeated policy violations.',
    },
    {
      title: '11. Admin Actions And Service Changes',
      body: 'Admins may update products, prices, stock, delivery settings, order statuses, content, promotions, and customer support responses. The website may change, pause, or remove features to improve service, fix bugs, meet legal requirements, or protect users and business operations.',
    },
    {
      title: '12. Limitation Of Liability',
      body: 'To the maximum extent allowed by law, Hincton Meat Products is not liable for indirect, incidental, special, punitive, or consequential losses, including lost profits, lost data, business interruption, device issues, third-party payment downtime, mapping errors, or delays outside reasonable control.',
    },
    {
      title: '13. Governing Law And Contact',
      body: 'These terms are intended to operate under applicable Kenyan law for local transactions unless another written agreement applies. For questions, disputes, or support, contact Hincton Meat Products using the phone, email, or contact page provided on the website.',
    },
  ],
  privacy: [
    {
      title: '1. Privacy Commitment',
      body: 'This Privacy Policy explains how Hincton Meat Products collects, uses, stores, protects, and shares personal information when you visit the website, create an account, upload a profile image, place an order, pin a delivery location, contact support, or use messaging features.',
    },
    {
      title: '2. Information We Collect',
      body: 'We may collect your name, email address, phone number, account password hash, profile image, delivery address, GPS coordinates when you allow location access, order history, cart and wishlist activity, payment references, support messages, reviews, device details, IP address, session records, and communication preferences.',
    },
    {
      title: '3. Profile Images And Uploaded Files',
      body: 'When you upload a profile image, the file is stored by our configured image service or on our server uploads storage. The image may be displayed in your account, navigation menu, support messages, reviews, admin tools, and other account-related areas. Do not upload images that you do not have permission to use.',
    },
    {
      title: '4. Location And Maps',
      body: 'If you allow browser location access, we use coordinates to help confirm delivery drop-off points and improve delivery accuracy. If you deny permission, you can manually enter your address and use the map preview. Map providers may process map requests according to their own terms and privacy policies.',
    },
    {
      title: '5. How We Use Information',
      body: 'We use personal information to create and secure accounts, process orders, validate stock, request payments, deliver products, provide order tracking, send notifications, respond to messages, prevent fraud, improve performance, personalize the experience, maintain records, and comply with legal or operational obligations.',
    },
    {
      title: '6. Communications',
      body: 'We may contact you through in-app notifications, email, phone, SMS, WhatsApp, or support chat about account activity, order status, payment updates, delivery coordination, security alerts, service changes, promotions where allowed, and responses to your enquiries.',
    },
    {
      title: '7. Sharing With Service Providers',
      body: 'We may share necessary data with service providers such as payment processors, M-PESA integrations, delivery teams, hosting providers, email/SMS/WhatsApp gateways, image storage providers, analytics tools, security tools, and map providers. They should only process information needed to provide their services.',
    },
    {
      title: '8. Security And Retention',
      body: 'We use reasonable technical and organizational safeguards, including authentication, password hashing, session management, access controls, and operational monitoring. No system is perfectly secure. We retain information for as long as needed for orders, support, legal, tax, audit, fraud prevention, and service operations.',
    },
    {
      title: '9. Cookies, Sessions, And Local Storage',
      body: 'The website may use cookies, browser storage, guest session IDs, authentication tokens, language preferences, cart state, and similar technologies to keep you signed in, preserve cart activity, remember preferences, secure sessions, and improve responsiveness.',
    },
    {
      title: '10. Your Rights And Choices',
      body: 'You may access, update, or delete your account information, opt out of marketing communications, request data portability, or withdraw consent where applicable. Contact us to exercise these rights. We will respond within reasonable timeframes as required by law.',
    },
    {
      title: '11. Children\'s Privacy',
      body: 'Our services are not intended for children under 13. We do not knowingly collect personal information from children under 13. If we become aware of such collection, we will delete the information promptly.',
    },
    {
      title: '12. Changes To This Policy',
      body: 'We may update this Privacy Policy periodically. We will notify you of material changes through the website, email, or other appropriate means. Continued use of our services after changes constitutes acceptance of the updated policy.',
    },
    {
      title: '13. Contact Us',
      body: 'For privacy-related questions, concerns, or requests, contact Hincton Meat Products using the contact information provided on the website or through your account settings.',
    },
  ],
}

const siteProfileSchema = z.object({
  brand: z.object({
    name: z.string().min(1),
    tagline: z.string().min(1),
    mantra: z.string().min(1),
    website: z.string().optional(),
    phone: z.string().min(1),
    phoneHref: z.string().min(1),
    email: z.string().email(),
    emailHref: z.string().min(1),
    address: z.string().min(1),
    socialHandle: z.string().optional(),
    logo: z.string().min(1),
    socialLinks: z.array(z.object({
      label: z.string().min(1),
      url: z.string().min(1),
    })).default([]).optional(),
  }),
  companyProfile: z.string().trim().min(40),
  mission: z.string().min(1),
  vision: z.string().min(1),
  procurementCommitment: z.string().min(1),
  markets: z.array(z.string().min(1)).default([]),
  qualityPoints: z.array(z.string().min(1)).default([]),
  images: z.object({
    hero: z.string().min(1),
    about: z.string().min(1),
    market: z.string().min(1),
    logo: z.string().min(1),
  }).catchall(z.string().optional()),
  pages: z.record(z.string(), z.object({
    title: z.string().min(1),
    subtitle: z.string().optional().default(''),
    body: z.string().optional().default(''),
    image: z.string().optional().default(''),
    video: z.string().optional(),
    sections: z.array(z.object({
      title: z.string().min(1),
      body: z.string().optional().default(''),
      image: z.string().optional(),
      video: z.string().optional(),
      linkLabel: z.string().optional(),
      linkUrl: z.string().optional(),
    })).default([]),
  })).default({}),
  terms: z.array(z.object({
    title: z.string().min(1),
    body: z.string().min(1),
  })).default([]),
  privacy: z.array(z.object({
    title: z.string().min(1),
    body: z.string().min(1),
  })).default([]),
})

router.get('/site-profile', async (_req, res) => {
  try {
    const setting = await prisma.systemSetting.findUnique({ where: { key: 'site_profile' } })
    const profile = setting ? { ...defaultSiteProfile, ...parseJsonValue(setting.value, {}) } : defaultSiteProfile
    res.json({ profile })
  } catch (error) {
    console.error('Get site profile error:', error)
    res.status(500).json({ error: 'Failed to get site profile' })
  }
})

router.put('/site-profile', async (req, res) => {
  try {
    const profile = siteProfileSchema.parse(req.body)
    const setting = await prisma.systemSetting.upsert({
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
    })

    res.json({ message: 'Site profile updated', profile: parseJsonValue(setting.value, {}) })
  } catch (error) {
    console.error('Update site profile error:', error)
    res.status(500).json({ error: 'Failed to update site profile' })
  }
})

router.post('/uploads', contentUpload.single('media'), async (req, res) => {
  try {
    const file = req.file
    if (!file) return res.status(400).json({ error: 'Media file is required' })
    const mediaType = file.mimetype.startsWith('video/') ? 'video' : file.mimetype.startsWith('audio/') ? 'audio' : 'image'
    res.status(201).json({ url: `/uploads/content/${file.filename}`, mediaType })
  } catch (error) {
    console.error('Content upload error:', error)
    res.status(500).json({ error: 'Failed to upload image' })
  }
})

// === BANNER MANAGEMENT ===
router.get('/banners', async (req, res) => {
  try {
    const banners = await prisma.systemSetting.findMany({
      where: { group: 'banner' },
      orderBy: { key: 'asc' }
    })

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
    }))

    res.json({ banners: formattedBanners })
  } catch (error) {
    console.error('Get banners error:', error)
    res.status(500).json({ error: 'Failed to get banners' })
  }
})

router.post('/banners', async (req, res) => {
  try {
    const bannerData = z.object({
      title: z.string().min(1),
      subtitle: z.string().optional(),
      imageUrl: z.string().url(),
      linkUrl: z.string().url().optional(),
      isActive: z.boolean().default(true),
      position: z.enum(['home', 'category', 'product']).default('home')
    }).parse(req.body)

    const key = `banner_${Date.now()}`
    const value = JSON.stringify(bannerData)

    const banner = await prisma.systemSetting.create({
      data: {
        key,
        value,
        type: 'json',
        group: 'banner',
        description: `Banner: ${bannerData.title}`,
        isPublic: true
      }
    })

    res.status(201).json({ message: 'Banner created', banner })
  } catch (error) {
    console.error('Create banner error:', error)
    res.status(500).json({ error: 'Failed to create banner' })
  }
})

router.put('/banners/:id', async (req, res) => {
  try {
    const { id } = req.params
    const bannerData = z.object({
      title: z.string().min(1).optional(),
      subtitle: z.string().optional(),
      imageUrl: z.string().url().optional(),
      linkUrl: z.string().url().optional(),
      isActive: z.boolean().optional(),
      position: z.enum(['home', 'category', 'product']).optional()
    }).parse(req.body)

    const existingBanner = await prisma.systemSetting.findUnique({
      where: { id }
    })

    if (!existingBanner) return res.status(404).json({ error: 'Banner not found' })

    const currentData = JSON.parse(existingBanner.value)
    const updatedData = { ...currentData, ...bannerData }
    const value = JSON.stringify(updatedData)

    const banner = await prisma.systemSetting.update({
      where: { id },
      data: { value }
    })

    res.json({ message: 'Banner updated', banner })
  } catch (error) {
    console.error('Update banner error:', error)
    res.status(500).json({ error: 'Failed to update banner' })
  }
})

router.delete('/banners/:id', async (req, res) => {
  try {
    const { id } = req.params

    await prisma.systemSetting.delete({
      where: { id }
    })

    res.json({ message: 'Banner deleted successfully' })
  } catch (error) {
    console.error('Delete banner error:', error)
    res.status(500).json({ error: 'Failed to delete banner' })
  }
})

// === BLOG MANAGEMENT ===
router.get('/blog', async (req, res) => {
  try {
    const { page = '1', limit = '20', status, search } = req.query
    const pageNum = Math.max(1, parseInt(String(page), 10) || 1)
    const limitNum = Math.max(1, parseInt(String(limit), 10) || 20)
    const skip = (pageNum - 1) * limitNum

    const where: any = {}
    
    if (status === 'published') where.status = 'PUBLISHED'
    if (status === 'draft') where.status = 'DRAFT'
    if (search) {
      where.OR = [
        { title: { contains: String(search), mode: 'insensitive' } },
        { content: { contains: String(search), mode: 'insensitive' } },
        { excerpt: { contains: String(search), mode: 'insensitive' } }
      ]
    }

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: { id: true, username: true, profile: { select: { firstName: true, lastName: true } } } },
          _count: { select: { comments: true } }
        }
      }),
      prisma.blogPost.count({ where })
    ])

    res.json({
      posts,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) }
    })
  } catch (error) {
    console.error('Get blog posts error:', error)
    res.status(500).json({ error: 'Failed to get blog posts' })
  }
})

router.post('/blog', async (req: any, res) => {
  try {
    const postData = z.object({
      title: z.string().min(1),
      slug: z.string().min(1),
      content: z.string().min(1),
      excerpt: z.string().optional(),
      featuredImage: z.string().min(1).optional(),
      isPublished: z.boolean().default(false),
      isFeatured: z.boolean().default(false),
      tags: z.array(z.string()).optional(),
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional()
    }).parse(req.body)

    const { isPublished, metaTitle, metaDescription, tags, ...blogData } = postData
    const post = await prisma.blogPost.create({
      data: {
        ...blogData,
        authorId: req.user!.id,
        tags: tags ? JSON.stringify(tags) : null,
        status: isPublished ? 'PUBLISHED' : 'DRAFT',
        publishedAt: isPublished ? new Date() : null,
        seoTitle: metaTitle,
        seoDescription: metaDescription,
      },
      include: {
        author: { select: { id: true, username: true } }
      }
    })

    res.status(201).json({ message: 'Blog post created', post })
  } catch (error) {
    console.error('Create blog post error:', error)
    res.status(500).json({ error: 'Failed to create blog post' })
  }
})

router.put('/blog/:id', async (req, res) => {
  try {
    const { id } = req.params
    const postData = z.object({
      title: z.string().min(1).optional(),
      slug: z.string().min(1).optional(),
      content: z.string().min(1).optional(),
      excerpt: z.string().optional(),
      featuredImage: z.string().min(1).optional(),
      isPublished: z.boolean().optional(),
      isFeatured: z.boolean().optional(),
      tags: z.array(z.string()).optional(),
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional()
    }).parse(req.body)

    const { isPublished, metaTitle, metaDescription, tags, ...blogData } = postData
    const post = await prisma.blogPost.update({
      where: { id },
      data: {
        ...blogData,
        ...(tags && { tags: JSON.stringify(tags) }),
        ...(typeof isPublished === 'boolean' && { status: isPublished ? 'PUBLISHED' : 'DRAFT', publishedAt: isPublished ? new Date() : null }),
        ...(metaTitle !== undefined && { seoTitle: metaTitle }),
        ...(metaDescription !== undefined && { seoDescription: metaDescription }),
      },
      include: {
        author: { select: { id: true, username: true } }
      }
    })

    res.json({ message: 'Blog post updated', post })
  } catch (error) {
    console.error('Update blog post error:', error)
    res.status(500).json({ error: 'Failed to update blog post' })
  }
})

router.delete('/blog/:id', async (req, res) => {
  try {
    const { id } = req.params

    await prisma.blogPost.delete({
      where: { id }
    })

    res.json({ message: 'Blog post deleted successfully' })
  } catch (error) {
    console.error('Delete blog post error:', error)
    res.status(500).json({ error: 'Failed to delete blog post' })
  }
})

// === CATEGORY MANAGEMENT ===
router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { products: true } },
        parent: { select: { id: true, name: true } },
        children: {
          select: { id: true, name: true },
          orderBy: { name: 'asc' }
        }
      }
    })

    res.json({ categories })
  } catch (error) {
    console.error('Get categories error:', error)
    res.status(500).json({ error: 'Failed to get categories' })
  }
})

router.post('/categories', async (req, res) => {
  try {
    const categoryData = z.object({
      name: z.string().min(1),
      slug: z.string().min(1),
      description: z.string().optional(),
      image: z.string().min(1).optional(),
      parentId: z.string().optional(),
      isActive: z.boolean().default(true),
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional()
    }).parse(req.body)

    const category = await prisma.category.create({
      data: categoryData,
      include: {
        parent: true,
        children: true
      }
    })

    res.status(201).json({ message: 'Category created', category })
  } catch (error) {
    console.error('Create category error:', error)
    res.status(500).json({ error: 'Failed to create category' })
  }
})

router.put('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params
    const categoryData = z.object({
      name: z.string().min(1).optional(),
      slug: z.string().min(1).optional(),
      description: z.string().optional(),
      image: z.string().min(1).optional(),
      parentId: z.string().optional(),
      isActive: z.boolean().optional(),
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional()
    }).parse(req.body)

    const category = await prisma.category.update({
      where: { id },
      data: categoryData,
      include: {
        parent: true,
        children: true
      }
    })

    res.json({ message: 'Category updated', category })
  } catch (error) {
    console.error('Update category error:', error)
    res.status(500).json({ error: 'Failed to update category' })
  }
})

router.delete('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params
    await prisma.category.update({
      where: { id },
      data: { isActive: false, deletedAt: new Date() },
    })
    res.json({ message: 'Category archived successfully' })
  } catch (error) {
    console.error('Delete category error:', error)
    res.status(500).json({ error: 'Failed to archive category' })
  }
})

// === NAVIGATION MANAGEMENT ===
router.get('/navigation', async (req, res) => {
  try {
    const navigation = await prisma.systemSetting.findMany({
      where: { group: 'navigation' },
      orderBy: { key: 'asc' }
    })

    const formattedNavigation = navigation.map(item => ({
      id: item.id,
      key: item.key,
      ...JSON.parse(item.value)
    }))

    res.json({ navigation: formattedNavigation })
  } catch (error) {
    console.error('Get navigation error:', error)
    res.status(500).json({ error: 'Failed to get navigation' })
  }
})

router.post('/navigation', async (req, res) => {
  try {
    const navData = z.object({
      label: z.string().min(1),
      url: z.string().min(1),
      order: z.number().int().default(0),
      isActive: z.boolean().default(true),
      parentKey: z.string().optional()
    }).parse(req.body)

    const key = `nav_${Date.now()}`
    const value = JSON.stringify(navData)

    const navigation = await prisma.systemSetting.create({
      data: {
        key,
        value,
        type: 'json',
        group: 'navigation',
        description: `Navigation: ${navData.label}`,
        isPublic: true
      }
    })

    res.status(201).json({ message: 'Navigation item created', navigation })
  } catch (error) {
    console.error('Create navigation error:', error)
    res.status(500).json({ error: 'Failed to create navigation' })
  }
})

router.put('/navigation/:id', async (req, res) => {
  try {
    const { id } = req.params
    const navData = z.object({
      label: z.string().min(1).optional(),
      url: z.string().min(1).optional(),
      order: z.number().int().optional(),
      isActive: z.boolean().optional(),
      parentKey: z.string().optional()
    }).parse(req.body)

    const existingNav = await prisma.systemSetting.findUnique({
      where: { id }
    })

    if (!existingNav) return res.status(404).json({ error: 'Navigation item not found' })

    const currentData = JSON.parse(existingNav.value)
    const updatedData = { ...currentData, ...navData }
    const value = JSON.stringify(updatedData)

    const navigation = await prisma.systemSetting.update({
      where: { id },
      data: { value }
    })

    res.json({ message: 'Navigation item updated', navigation })
  } catch (error) {
    console.error('Update navigation error:', error)
    res.status(500).json({ error: 'Failed to update navigation' })
  }
})

// === CONTACT FORM SUBMISSION ===
router.post('/contact/submit', async (req, res) => {
  try {
    const userId = (req as any).user?.id
    const contactData = z.object({
      name: z.string().min(1),
      email: z.string().email(),
      phone: z.string().optional(),
      subject: z.string().min(1),
      message: z.string().min(1)
    }).parse(req.body)

    const ticket = await prisma.supportTicket.create({
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
    })

    console.log('Contact form submission saved:', contactData)
    emitContactUpdate(req, 'contact:message-created', {
      ticketId: ticket.id,
      status: ticket.status,
      subject: ticket.subject,
      createdAt: ticket.createdAt,
    })

    res.json({ message: 'Contact form submitted successfully', ticketId: ticket.id })
  } catch (error) {
    console.error('Contact form submission error:', error)
    res.status(500).json({ error: 'Failed to submit contact form' })
  }
})

// === ADMIN: GET ALL CONTACT MESSAGES ===
router.get('/admin/contact-messages', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'OPEN', search } = req.query

    const where: any = {
      category: { in: ['GENERAL_INQUIRY', 'FEEDBACK'] }
    }

    if (status) {
      where.status = status
    }

    if (search) {
      where.OR = [
        { subject: { contains: search as string, mode: 'insensitive' } },
        { message: { contains: search as string, mode: 'insensitive' } }
      ]
    }

    const tickets = await prisma.supportTicket.findMany({
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
    })

    const total = await prisma.supportTicket.count({ where })
    const respondentIds = Array.from(new Set(tickets.flatMap(ticket => ticket.responses.map(response => response.userId)).filter(Boolean)))
    const respondents = respondentIds.length > 0
      ? await prisma.user.findMany({
        where: { id: { in: respondentIds } },
        select: {
          id: true,
          email: true,
          profile: { select: { fullName: true } }
        }
      })
      : []
    const respondentsById = new Map(respondents.map(user => [user.id, user]))

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
    })
  } catch (error) {
    console.error('Get contact messages error:', error)
    res.status(500).json({ error: 'Failed to retrieve contact messages' })
  }
})

// === ADMIN: RESPOND TO CONTACT MESSAGE ===
router.post('/admin/contact-messages/:ticketId/respond', requireAdmin, async (req, res) => {
  try {
    const { ticketId } = req.params
    const { message } = req.body
    const adminId = (req as any).user?.id

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Response message is required' })
    }

    // Verify ticket exists
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId }
    })

    if (!ticket) {
      return res.status(404).json({ error: 'Contact message not found' })
    }

    // Create response
    const response = await prisma.supportTicketResponse.create({
      data: {
        ticketId,
        message,
        userId: adminId,
        isAdmin: true
      }
    })

    // Update ticket status
    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status: 'IN_PROGRESS' }
    })
    emitContactUpdate(req, 'contact:message-updated', {
      ticketId,
      status: 'IN_PROGRESS',
      responseId: response.id,
    })

    res.json({
      success: true,
      message: 'Response added successfully',
      response
    })
  } catch (error) {
    console.error('Respond to contact message error:', error)
    res.status(500).json({ error: 'Failed to respond to contact message' })
  }
})

// === ADMIN: CLOSE/RESOLVE CONTACT MESSAGE ===
router.patch('/admin/contact-messages/:ticketId/close', requireAdmin, async (req, res) => {
  try {
    const { ticketId } = req.params

    const ticket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status: 'RESOLVED' }
    })
    emitContactUpdate(req, 'contact:message-updated', {
      ticketId,
      status: ticket.status,
    })

    res.json({
      success: true,
      message: 'Contact message closed successfully',
      ticket
    })
  } catch (error) {
    console.error('Close contact message error:', error)
    res.status(500).json({ error: 'Failed to close contact message' })
  }
})

export default router
