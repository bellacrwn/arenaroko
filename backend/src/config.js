import 'dotenv/config';

function list(value, fallback = []) {
  return value ? value.split(',').map((item) => item.trim()).filter(Boolean) : fallback;
}

export const config = Object.freeze({
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  corsOrigins: list(process.env.CORS_ORIGINS, ['http://localhost:5173']),
  supabase: {
    url: process.env.SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    storageBucket: process.env.SUPABASE_STORAGE_BUCKET || 'pickup-photos',
  },
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

export function validateConfig() {
  const missing = [
    ['SUPABASE_URL', config.supabase.url],
    ['SUPABASE_ANON_KEY', config.supabase.anonKey],
    ['SUPABASE_SERVICE_ROLE_KEY', config.supabase.serviceRoleKey],
  ].filter(([, value]) => !value).map(([name]) => name);
  if (missing.length) throw new Error(`Missing required Supabase configuration: ${missing.join(', ')}.`);
  if (config.isProduction && config.corsOrigins.length === 0) throw new Error('CORS_ORIGINS is required in production.');
}
