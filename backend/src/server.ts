import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { prisma } from './config/prisma'
import { cacheService } from './services/cacheService'

import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import orderRoutes from './routes/orders';
import cartRoutes from './routes/cart';
import mpesaRoutes from './routes/mpesa';
import adminRoutes from './routes/admin';
import adminDashboardRoutes from './routes/adminDashboard';
import contentManagementRoutes from './routes/contentManagement';
import subscriptionRoutes from './routes/subscriptions';
import returnsRoutes from './routes/returns';
import promotionsRoutes from './routes/promotions';
import affiliateRoutes from './routes/affiliates';
import blogRoutes from './routes/blog';
import chatRoutes from './routes/chat';
import notificationRoutes from './routes/notifications';
import wishlistRoutes from './routes/wishlist';
import qrCodeRoutes from './routes/qrCodes';
import uploadRoutes from './routes/upload';
import systemMetricsRoutes from './routes/systemMetrics';
import adRoutes from './routes/ads';
import messageRoutes from './routes/messages';
import walletRoutes from './routes/wallet';
import reviewRoutes from './routes/reviews';
import userSessionRoutes from './routes/userSessions';
import analyticsRoutes from './routes/analyticsRoutes';
import companyRoutes from './routes/companies';
import featureRoutes from './routes/features';
import flashSalesRoutes from './routes/flashSales';
import dealBannerRoutes from './routes/dealBanners';
import communityRoutes from './routes/community';
import photoReviewRoutes, { seedPhotoReviews } from './routes/photoReviews';
import meatGuideRoutes, { seedMeatGuide } from './routes/meatGuide';
import recipeRoutes, { seedRecipes } from './routes/recipes';
import careersRoutes from './routes/careers';
import giftCardsRoutes from './routes/giftCards';
import supportRoutes from './routes/support';
import productConfigRoutes, { seedProductConfig } from './routes/productConfig';

import { authenticate, authorize, optionalAuthenticate } from './middleware/auth';
import { rejectUnsafeKeys } from './middleware/sanitizer';
import { maintenanceModeMiddleware } from './middleware/maintenanceMode';

dotenv.config();

if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32 || process.env.JWT_SECRET === 'your-secret-key')) {
  throw new Error('A strong JWT_SECRET (at least 32 characters) is required in production.');
}

const app = express();
app.set('trust proxy', process.env.TRUST_PROXY === 'true' ? 1 : false);
app.set('query parser', 'simple');

let io: Server | null = null;
let server: any = null;

const localOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

const configuredOrigins = [
  process.env.FRONTEND_URL,
  ...(process.env.ALLOWED_ORIGINS?.split(',') || []),
]
  .map((origin) => origin?.trim())
  .filter(Boolean) as string[];

const isKnownPreviewOrigin = (origin: string | undefined) => {
  return (
    typeof origin === 'string' &&
    origin.includes('hincton-meat') &&
    /^https:\/\/[a-z0-9-]+\.(onrender\.com|vercel\.app)$/.test(origin)
  );
};

const allowedOrigins = Array.from(new Set([...configuredOrigins, ...localOrigins]));

const corsOptions: cors.CorsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || isKnownPreviewOrigin(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Guest-Session-Id', 'Idempotency-Key'],
};

if (!process.env.VERCEL) {
  server = createServer(app);
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        callback(null, !origin || allowedOrigins.includes(origin) || isKnownPreviewOrigin(origin));
      },
      methods: ["GET", "POST"],
      credentials: true,
    }
  });
  app.set('io', io);
}

prisma.$connect()
  .then(() => {
    console.log('Database connected successfully');
    seedPhotoReviews();
    seedMeatGuide();
    seedRecipes();
    seedProductConfig();
  })
  .catch((error) => console.error('Database connection failed:', error));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.API_RATE_LIMIT_MAX || 300),
  skip: (req) => {
    return req.method === 'OPTIONS';
  }
});

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: Number(process.env.CONTACT_RATE_LIMIT_MAX || 8),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many contact requests. Please try again later.' },
});

// Tighter limiter for auth endpoints to blunt brute-force and credential-stuffing attacks.
// Kept above legitimate usage (QR-login polling, profile fetches); per-account lockout in
// the login route provides the fine-grained brute-force protection.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.AUTH_RATE_LIMIT_MAX || 100),
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS',
  message: { error: 'Too many authentication attempts. Please try again in 15 minutes.' },
});

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  hsts: process.env.NODE_ENV === 'production' ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
}));
app.use(compression({ threshold: 1024 }));
app.use(limiter);
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use((req, res, next) => {
  const requestId = req.header('X-Request-Id') || crypto.randomUUID();
  res.setHeader('X-Request-Id', requestId);
  next();
});
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use(rejectUnsafeKeys);
app.use(maintenanceModeMiddleware);

const staticMediaHeaders = (res: express.Response) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
};

const uploadStaticPath = path.resolve(process.env.UPLOAD_DIR || 'uploads');
app.use('/uploads', express.static(uploadStaticPath, { setHeaders: staticMediaHeaders }));
const contactUploadPath = path.join(uploadStaticPath, 'contact');
fs.mkdirSync(contactUploadPath, { recursive: true });
const contactUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, contactUploadPath),
    filename: (_req, file, cb) => cb(null, `contact-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`),
  }),
  limits: { fileSize: 10 * 1024 * 1024, files: 5 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) return cb(null, true);
    cb(new Error('Only image and video attachments are allowed'));
  },
});

const hinctonStaticCandidates = [
  path.resolve(process.cwd(), 'frontend/public/hincton'),
  path.resolve(process.cwd(), '../frontend/public/hincton'),
];
const hinctonStaticPath = hinctonStaticCandidates.find((candidate) => fs.existsSync(candidate));
if (hinctonStaticPath) {
  app.use('/hincton', express.static(hinctonStaticPath, { setHeaders: staticMediaHeaders }));
}

app.use('/api/auth', authLimiter, authRoutes);
app.use('/auth', authLimiter, authRoutes);
app.use('/api/products', optionalAuthenticate, productRoutes);
app.use('/api/orders', optionalAuthenticate, orderRoutes);
app.use('/api/cart', optionalAuthenticate, cartRoutes);
app.use('/api/mpesa', optionalAuthenticate, mpesaRoutes);
app.use('/api/admin', authenticate, authorize('ADMIN'), adminRoutes);
app.use('/api/admin/content', authenticate, authorize('ADMIN'), contentManagementRoutes);
app.use('/api/subscriptions', authenticate, subscriptionRoutes);
app.use('/api/returns', authenticate, returnsRoutes);
app.use('/api/promotions', promotionsRoutes);
app.use('/api/affiliate', authenticate, affiliateRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/chat', optionalAuthenticate, chatRoutes);
app.use('/api/notifications', authenticate, notificationRoutes);
app.use('/api/wishlist', authenticate, wishlistRoutes);
app.use('/api/wallet', authenticate, walletRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/user-sessions', userSessionRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api', optionalAuthenticate, qrCodeRoutes);
app.use('/api/admin/system', authenticate, authorize('ADMIN'), systemMetricsRoutes);
app.use('/api/ads', adRoutes);
app.use('/api/marketing', adRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/features', featureRoutes);
app.use('/features', featureRoutes);
app.use('/api', optionalAuthenticate, flashSalesRoutes);
app.use('/api', dealBannerRoutes);
app.use('/api', communityRoutes);
app.use('/api', supportRoutes);
app.use('/api', photoReviewRoutes);
app.use('/api', meatGuideRoutes);
app.use('/api', recipeRoutes);
app.use('/api', productConfigRoutes);
app.use('/api/careers', careersRoutes);
app.use('/api/gift-cards', giftCardsRoutes);

const safeJsonParse = <T = any>(value: string | undefined, fallback: T): T => {
  try {
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

app.get('/api/content/site-profile', async (_req, res) => {
  try {
    const setting = await prisma.systemSetting.findUnique({ where: { key: 'site_profile' } });
    res.json({ profile: setting ? safeJsonParse(setting.value, null) : null });
  } catch (error) {
    console.error('Public site profile error:', error);
    res.status(500).json({ error: 'Failed to get site profile' });
  }
});

app.get('/api/content/web-profile', async (_req, res) => {
  try {
    const [setting, products, categories, featuredProducts, inStockProducts] = await Promise.all([
      prisma.systemSetting.findUnique({ where: { key: 'site_profile' } }),
      prisma.product.count({ where: { isPublished: true, deletedAt: null } }),
      prisma.category.count({ where: { isActive: true, deletedAt: null } }),
      prisma.product.count({ where: { isPublished: true, isFeatured: true, deletedAt: null } }),
      prisma.product.count({ where: { isPublished: true, deletedAt: null, stockQuantity: { gt: 0 } } }),
    ]);

    const featuredCatalog = await prisma.product.findMany({
      where: { isPublished: true, isFeatured: true, deletedAt: null },
      take: 3,
      orderBy: [{ updatedAt: 'desc' }],
      include: {
        category: { select: { name: true, slug: true } },
        productImages: {
          orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
          take: 1,
          select: { url: true, alt: true },
        },
      },
    });

    res.json({
      profile: setting ? safeJsonParse(setting.value, null) : null,
      stats: {
        products,
        categories,
        featuredProducts,
        inStockProducts,
      },
      featuredProducts: featuredCatalog,
    });
  } catch (error) {
    console.error('Public web profile error:', error);
    res.status(500).json({ error: 'Failed to get web profile' });
  }
});

app.get('/api/content/commerce-settings', async (_req, res) => {
  try {
    const setting = await prisma.systemSetting.findUnique({ where: { key: 'commerce_settings' } });
    const defaults = {
      shipping: {
        standardShippingFee: 200,
        expressShippingFee: 450,
        deliveryTimeframe: 'Today before 5 PM',
        expressDeliveryTimeframe: 'Within 2 hours',
        coldChainCutoffHour: 10,
        sameDayDeliveryBy: '5:00 PM',
        insulatedBoxText: 'Delivered cold in an insulated box',
      },
      inventory: {
        lowStockThreshold: 10,
      },
      shop: {
        priceRanges: [
          { id: '0-1000', name: 'Under KSh 1,000', min: 0, max: 1000 },
          { id: '1000-3000', name: 'KSh 1,000 - KSh 3,000', min: 1000, max: 3000 },
          { id: '3000-6000', name: 'KSh 3,000 - KSh 6,000', min: 3000, max: 6000 },
          { id: '6000-13000', name: 'KSh 6,000 - KSh 13,000', min: 6000, max: 13000 },
          { id: '13000-plus', name: 'Over KSh 13,000', min: 13000, max: null },
        ],
      },
      notifications: {
        emailNotifications: true,
        smsNotifications: true,
        whatsappNotifications: true,
        orderNotifications: true,
        lowStockAlerts: true,
      },
    };
    res.json({ settings: setting ? { ...defaults, ...safeJsonParse(setting.value, {}) } : defaults });
  } catch (error) {
    console.error('Public commerce settings error:', error);
    res.status(500).json({ error: 'Failed to get commerce settings' });
  }
});

app.get('/api/content/site-theme', async (_req, res) => {
  const defaults = {
    primary: '#dc2626', accent: '#f59e0b', page: '#fffaf7', surface: '#ffffff', text: '#1c1917', muted: '#78716c', border: '#e7e5e4', buttonText: '#ffffff', header: '#ffffff', ad: '#fff1f2', success: '#16a34a', info: '#2563eb',
  }
  try {
    const setting = await prisma.systemSetting.findUnique({ where: { key: 'site_theme' } })
    res.json({ theme: setting ? { ...defaults, ...safeJsonParse(setting.value, {}) } : defaults })
  } catch (error) {
    console.error('Public site theme error:', error)
    res.json({ theme: defaults })
  }
})

const getOrCreateContactUser = async (contact: { name: string; email: string; phone?: string | null }) => {
  const email = contact.email.trim().toLowerCase()
  const name = contact.name.trim()
  const parts = name.split(/\s+/)

  return prisma.user.upsert({
    where: { email },
    update: {
      profile: {
        upsert: {
          create: {
            firstName: parts[0] || name,
            lastName: parts.slice(1).join(' '),
            fullName: name,
            mpesaPhone: contact.phone || undefined,
          },
          update: {
            fullName: name,
            mpesaPhone: contact.phone || undefined,
          },
        },
      },
    },
    create: {
      email,
      roles: ['BUYER'] as any,
      profile: {
        create: {
          firstName: parts[0] || name,
          lastName: parts.slice(1).join(' '),
          fullName: name,
          mpesaPhone: contact.phone || undefined,
        },
      },
      security: {
        create: {
          is_active: true,
          isEmailVerified: false,
        },
      },
    },
    include: { profile: true },
  })
}

app.post('/api/content/contact/submit', contactLimiter, optionalAuthenticate, contactUpload.array('attachments', 5), async (req: any, res) => {
  try {
    const body = req.body || {}
    const contactData = {
      name: String(body.name || '').trim(),
      email: String(body.email || '').trim().toLowerCase(),
      phone: body.phone ? String(body.phone).trim() : '',
      subject: String(body.subject || '').trim(),
      message: String(body.message || '').trim(),
    }

    if (!contactData.name || !contactData.subject || !contactData.message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactData.email)) {
      return res.status(400).json({ error: 'Name, valid email, subject, and message are required' })
    }

    const sender = req.user?.id
      ? await prisma.user.findUnique({ where: { id: req.user.id }, include: { profile: true } })
      : await getOrCreateContactUser(contactData)

    if (!sender) return res.status(401).json({ error: 'Could not identify message sender' })

    const attachments = ((req.files as Express.Multer.File[] | undefined) || []).map((file) => `/uploads/contact/${file.filename}`)
    const ticket = await prisma.supportTicket.create({
      data: {
        userId: sender.id,
        subject: contactData.subject,
        message: [
          `From: ${contactData.name} <${contactData.email}>`,
          contactData.phone ? `Phone: ${contactData.phone}` : null,
          attachments.length ? `Attachments:\n${attachments.join('\n')}` : null,
          '',
          contactData.message,
        ].filter(Boolean).join('\n'),
        category: 'GENERAL_INQUIRY',
        priority: 'LOW',
        status: 'OPEN',
      },
    })
    io?.emit('contact:message-created', {
      ticketId: ticket.id,
      status: ticket.status,
      subject: ticket.subject,
      createdAt: ticket.createdAt,
    })

    const admins = await prisma.user.findMany({
      where: { roles: { hasSome: ['ADMIN', 'SUPER_ADMIN', 'SUPPORT'] as any } },
      select: { id: true },
    })
    if (admins.length) {
      await prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          type: 'SYSTEM' as any,
          title: `Contact message from ${contactData.name}`,
          message: contactData.message.slice(0, 180),
          actionUrl: '/admin/communications',
          data: { ticketId: ticket.id, senderEmail: contactData.email },
          channel: 'IN_APP',
          sentAt: new Date(),
        })),
      })
    }

    res.json({ message: 'Message sent successfully', ticketId: ticket.id })
  } catch (error) {
    console.error('Public contact form submission error:', error)
    res.status(500).json({ error: 'Failed to submit contact form' })
  }
});

app.get('/api/categories', async (_req, res) => {
  try {
    const categories = await cacheService.remember('categories:public:all', 300, () => prisma.category.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    }));
    res.json({ categories });
  } catch (error) {
    console.error('Public categories error:', error);
    res.status(500).json({ error: 'Failed to get categories' });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

if (io) {
  const onlineUsers = new Map<string, Set<string>>();

  io.use((socket, next) => {
    const token = typeof socket.handshake.auth?.token === 'string' ? socket.handshake.auth.token : '';
    if (!token) return next();
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'development-only-secret') as { userId?: string };
      if (decoded.userId) socket.data.userId = decoded.userId;
    } catch {
      // Anonymous connections remain allowed for public support; privileged events require a verified token.
    }
    next();
  });

  const presenceFor = (lastSeen?: Date | null, connected = false) => {
    if (connected) return 'online';
    if (lastSeen && Date.now() - lastSeen.getTime() <= 15 * 60 * 1000) return 'away';
    return 'offline';
  };

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('presence:join', async () => {
      const userId = socket.data.userId as string | undefined;
      if (!userId) return;
      const sockets = onlineUsers.get(userId) || new Set<string>();
      sockets.add(socket.id);
      onlineUsers.set(userId, sockets);
      socket.join(`user-${userId}`);
      socket.join(`user:${userId}`);
      await prisma.userSession.updateMany({
        where: { userId, isRevoked: false, expiresAt: { gt: new Date() } },
        data: { lastActivity: new Date() },
      }).catch(() => undefined);
      io?.emit('presence:update', { userId, status: 'online' });
    });

    socket.on('presence:check', async (data: { userIds?: string[] }) => {
      if (!socket.data.userId) return;
      const ids = Array.isArray(data?.userIds) ? data.userIds.slice(0, 100) : [];
      const sessions = ids.length
        ? await prisma.userSession.findMany({
            where: { userId: { in: ids }, isRevoked: false },
            orderBy: { lastActivity: 'desc' },
            distinct: ['userId'],
          }).catch(() => [])
        : [];
      const byUser = new Map(sessions.map((session) => [session.userId, session]));
      socket.emit('presence:snapshot', ids.map((userId) => ({
        userId,
        status: presenceFor(byUser.get(userId)?.lastActivity, Boolean(onlineUsers.get(userId)?.size)),
      })));
    });

    socket.on('chat:join', (roomId: string) => {
      if (roomId) socket.join(`chat-${roomId}`);
    });

    socket.on('chat:typing', (data: { roomId?: string; userId?: string; name?: string; isTyping?: boolean }) => {
      if (!data?.roomId) return;
      socket.to(`chat-${data.roomId}`).emit('chat:typing', {
        roomId: data.roomId,
        userId: data.userId,
        name: data.name,
        isTyping: Boolean(data.isTyping),
      });
    });

    socket.on('chat:message', () => {
      socket.emit('chat:error', { error: 'Messages must be saved through the API before broadcast.' });
    });

    socket.on('join-order', (orderId) => {
      socket.join(`order-${orderId}`);
    });
    socket.on('delivery-location-update', (data) => {
      socket.to(`order-${data.orderId}`).emit('location-update', data);
    });
    socket.on('disconnect', () => {
      for (const [userId, sockets] of onlineUsers.entries()) {
        if (!sockets.delete(socket.id)) continue;
        if (sockets.size === 0) {
          onlineUsers.delete(userId);
          io?.emit('presence:update', { userId, status: 'away' });
        } else {
          onlineUsers.set(userId, sockets);
        }
      }
      console.log('Client disconnected:', socket.id);
    });
  });
}

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!', 
    error: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

if (!process.env.VERCEL) {
  const preferredPort = Number(process.env.PORT || 5000);
  const preferredHost = process.env.HOST || '0.0.0.0';

  function listenOnFreePort(fromPort: number) {
    const attemptPort = Number.isFinite(fromPort) ? fromPort : 5000;

    const tryListen = (port: number): void => {
      const handleError = (err: any) => {
        if (err?.code === 'EADDRINUSE') {
          console.warn(`Port ${port} is in use; trying ${port + 1}...`);
          server.removeListener('listening', handleListening);
          tryListen(port + 1);
          return;
        }
        throw err;
      };

      const handleListening = () => {
        server.removeListener('error', handleError);
        console.log(`Server running on ${preferredHost}:${port}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      };

      server.once('error', handleError);
      server.once('listening', handleListening);
      server.listen(port, preferredHost);
    };

    tryListen(attemptPort);
  }

  listenOnFreePort(preferredPort);
}

export default app;
