import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import apiRoutes from '../src/routes/index';

dotenv.config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Top-level health check (keep for Vercel/hosting)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Real routes (all route groups)
// backend/src/routes/index.ts mounts everything under /api/v1
app.use(apiRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

export default app;

