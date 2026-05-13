import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';

// Routes
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


// Middleware
import { authenticate, authorize, optionalAuthenticate } from './middleware/auth';

dotenv.config();

const app = express();
const server = createServer(app);

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

const allowedOrigins = Array.from(new Set([...configuredOrigins, ...localOrigins]));

const corsOptions: cors.CorsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Guest-Session-Id'],
};

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  }
});

// Initialize Prisma
const prisma = new PrismaClient();

// Test database connection
prisma.$connect()
  .then(() => console.log('Database connected successfully'))
  .catch((error) => console.error('Database connection failed:', error));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  skip: (req) => {
    return req.method === 'OPTIONS';
  }
});

// Middleware
app.use(helmet());
app.use(limiter);
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/uploads', express.static('uploads'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
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
app.use('/api/analytics', analyticsRoutes);

app.get('/api/content/site-profile', async (_req, res) => {
  try {
    const setting = await prisma.systemSetting.findUnique({ where: { key: 'site_profile' } });
    res.json({ profile: setting ? JSON.parse(setting.value) : null });
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
      profile: setting ? JSON.parse(setting.value) : null,
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
    res.json({ settings: setting ? { ...defaults, ...JSON.parse(setting.value) } : defaults });
  } catch (error) {
    console.error('Public commerce settings error:', error);
    res.status(500).json({ error: 'Failed to get commerce settings' });
  }
});

app.get('/api/categories', async (_req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    res.json({ categories });
  } catch (error) {
    console.error('Public categories error:', error);
    res.status(500).json({ error: 'Failed to get categories' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Socket.io for real-time delivery tracking
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-order', (orderId) => {
    socket.join(`order-${orderId}`);
  });

  socket.on('delivery-location-update', (data) => {
    socket.to(`order-${data.orderId}`).emit('location-update', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!', 
    error: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ONLY START THE SERVER IF NOT ON VERCEL
if (!process.env.VERCEL) {
  const preferredPort = Number(process.env.PORT || 5000);

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
        console.log(`Server running on port ${port}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      };

      server.once('error', handleError);
      server.once('listening', handleListening);
      server.listen(port);
    };

    tryListen(attemptPort);
  }

  listenOnFreePort(preferredPort);
}

export default app;