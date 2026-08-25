import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { randomUUID } from 'node:crypto';
import { config } from './config.js';
import { store } from './db/store.js';
import authRoutes from './routes/auth.js';
import catalogRoutes from './routes/catalog.js';
import pickupRoutes from './routes/pickups.js';
import collectorRoutes from './routes/collector.js';
import walletRoutes from './routes/wallet.js';
import dashboardRoutes from './routes/dashboard.js';
import notificationRoutes from './routes/notifications.js';
import { errorHandler, notFound } from './middleware/errors.js';

export async function createApp() {
  await store.initialize();
  const app = express();
  app.disable('x-powered-by');
  app.use((request, response, next) => { request.id = request.headers['x-request-id'] || randomUUID(); response.setHeader('x-request-id', request.id); next(); });
  app.use(helmet());
  app.use(cors({
    origin(origin, callback) {
      if (!origin || config.corsOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Origin is not allowed by CORS.'));
    },
    credentials: true,
  }));
  app.use(express.json({ limit: '1mb' }));
  app.use(morgan(config.isTest ? 'tiny' : 'combined'));
  app.use(rateLimit({ windowMs: 15 * 60_000, limit: config.isTest ? 10_000 : 500, standardHeaders: 'draft-7', legacyHeaders: false }));

  app.get('/health', (request, response) => response.json({ success: true, data: { service: 'reko-backend', status: 'ok', environment: config.env, timestamp: new Date().toISOString() } }));
  app.get(config.apiPrefix, (request, response) => response.json({ success: true, data: { name: 'REKO API', version: '1.0.0', documentation: '/api/v1/docs' } }));
  app.get(`${config.apiPrefix}/docs`, (request, response) => response.json({ success: true, data: { message: 'See backend/README.md for endpoint examples and update instructions.' } }));

  const authLimiter = rateLimit({ windowMs: 10 * 60_000, limit: config.isTest ? 10_000 : 30, standardHeaders: 'draft-7', legacyHeaders: false });
  app.use(`${config.apiPrefix}/auth`, authLimiter, authRoutes);
  app.use(`${config.apiPrefix}/catalog`, catalogRoutes);
  app.use(`${config.apiPrefix}/pickups`, pickupRoutes);
  app.use(`${config.apiPrefix}/collector`, collectorRoutes);
  app.use(`${config.apiPrefix}/wallet`, walletRoutes);
  app.use(`${config.apiPrefix}/dashboard`, dashboardRoutes);
  app.use(`${config.apiPrefix}/notifications`, notificationRoutes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
