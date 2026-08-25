import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(dirname, '..');

function list(value, fallback = []) {
  return value ? value.split(',').map((item) => item.trim()).filter(Boolean) : fallback;
}

export const config = Object.freeze({
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  jwtSecret: process.env.JWT_SECRET || 'development-only-change-this-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigins: list(process.env.CORS_ORIGINS, ['http://localhost:5173']),
  dataFile: path.resolve(backendRoot, process.env.DATA_FILE || './data/reko-db.json'),
  wema: {
    mode: process.env.WEMA_MODE || 'mock',
    baseUrl: process.env.WEMA_API_BASE_URL || '',
    clientId: process.env.WEMA_CLIENT_ID || '',
    clientSecret: process.env.WEMA_CLIENT_SECRET || '',
    webhookSecret: process.env.WEMA_WEBHOOK_SECRET || '',
  },
  payoutMode: process.env.PAYOUT_MODE || 'ledger',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
});

export function validateProductionConfig() {
  if (!config.isProduction) return;
  if (config.jwtSecret === 'development-only-change-this-secret' || config.jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters in production.');
  }
  if (config.corsOrigins.length === 0) throw new Error('CORS_ORIGINS is required in production.');
}
