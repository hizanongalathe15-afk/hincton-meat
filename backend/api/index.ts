import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import apiRoutes from '../src/routes/index';
import { rejectUnsafeKeys } from '../src/middleware/sanitizer';

dotenv.config();

const app = express();

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));
app.use(cors({
  origin: (process.env.FRONTEND_URL || 'http://localhost:3000').split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Guest-Session-Id'],
}));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: Number(process.env.API_RATE_LIMIT_MAX || 300), standardHeaders: true, legacyHeaders: false }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use(rejectUnsafeKeys);

const staticMediaHeaders = (res: express.Response) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
};

const uploadStaticPath = path.resolve(process.env.UPLOAD_DIR || 'uploads');
app.use('/uploads', express.static(uploadStaticPath, { setHeaders: staticMediaHeaders }));

const hinctonStaticCandidates = [
  path.resolve(process.cwd(), 'frontend/public/hincton'),
  path.resolve(process.cwd(), '../frontend/public/hincton'),
];
const hinctonStaticPath = hinctonStaticCandidates.find((candidate) => fs.existsSync(candidate));
if (hinctonStaticPath) {
  app.use('/hincton', express.static(hinctonStaticPath, { setHeaders: staticMediaHeaders }));
}

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount all routes
app.use(apiRoutes);

// Error handler
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

// 404 handler
app.use('*', (_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

export default app;
