import test, { before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import request from 'supertest';
import { distanceKm } from '../src/lib/geo.js';

process.env.NODE_ENV = 'test';
process.env.SUPABASE_URL ||= 'https://example.supabase.co';
process.env.SUPABASE_ANON_KEY ||= 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY ||= 'test-service-role-key';

let app;
before(async () => {
  const module = await import('../src/app.js');
  app = await module.createApp();
});

test('health endpoint works without a database round trip', async () => {
  const response = await request(app).get('/health').expect(200);
  assert.equal(response.body.data.status, 'ok');
});

test('request validation rejects malformed registration before Supabase', async () => {
  const response = await request(app).post('/api/v1/auth/register').send({ email: 'invalid' }).expect(422);
  assert.equal(response.body.error.code, 'VALIDATION_ERROR');
});

test('protected routes require a Supabase Bearer token', async () => {
  const response = await request(app).get('/api/v1/pickups').expect(401);
  assert.equal(response.body.error.code, 'AUTH_REQUIRED');
});

test('distance helper calculates a realistic Lagos distance', () => {
  const distance = distanceKm(6.6018, 3.3515, 6.5887, 3.3636);
  assert.ok(distance > 1 && distance < 3);
});

test('Supabase migration contains financial functions, RLS, storage, and realtime', async () => {
  const first = await fs.readFile(new URL('../supabase/migrations/202608260001_initial_schema.sql', import.meta.url), 'utf8');
  const second = await fs.readFile(new URL('../supabase/migrations/202608260002_api_functions.sql', import.meta.url), 'utf8');
  for (const expected of ['enable row level security', 'approve_pickup_payout', 'pickup-photos', 'supabase_realtime']) assert.ok(first.includes(expected));
  for (const expected of ['create_pickup', 'cancel_pickup', 'create_wallet_withdrawal']) assert.ok(second.includes(expected));
});
