import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import request from 'supertest';

const testDatabase = path.resolve('data', `reko-test-${process.pid}.json`);
process.env.NODE_ENV = 'test';
process.env.DATA_FILE = testDatabase;
process.env.JWT_SECRET = 'test-secret-with-at-least-thirty-two-characters';

let app;
let distributorToken;
let collectorToken;
let pickupId;

before(async () => {
  const { createApp } = await import('../src/app.js');
  const { store } = await import('../src/db/store.js');
  await store.reset();
  app = await createApp();
});

after(async () => {
  await fs.rm(testDatabase, { force: true });
});

test('health endpoint responds', async () => {
  const response = await request(app).get('/health').expect(200);
  assert.equal(response.body.data.status, 'ok');
});

test('registers distributor and collector accounts', async () => {
  const distributor = await request(app).post('/api/v1/auth/register').send({
    role: 'distributor', firstName: 'Ada', lastName: 'Okafor', email: 'ada@example.com', phone: '+2348000000001', password: 'Secure123!'
  }).expect(201);
  distributorToken = distributor.body.data.accessToken;
  assert.equal(distributor.body.data.user.role, 'distributor');

  const collector = await request(app).post('/api/v1/auth/register').send({
    role: 'collector', firstName: 'Musa', lastName: 'Adebayo', email: 'musa@example.com', phone: '+2348000000002', password: 'Secure123!', businessName: 'Musa Collections'
  }).expect(201);
  collectorToken = collector.body.data.accessToken;
  assert.equal(collector.body.data.user.role, 'collector');
});

test('distributor creates a multi-material pickup', async () => {
  const response = await request(app).post('/api/v1/pickups')
    .set('Authorization', `Bearer ${distributorToken}`)
    .send({
      items: [{ materialId: 'metal', estimatedWeight: 20 }, { materialId: 'plastic', estimatedWeight: 10 }],
      address: { label: 'Allen Avenue, Ikeja, Lagos', latitude: 6.6018, longitude: 3.3515 },
      pickupWindow: 'Tomorrow · 9:00–11:00 AM'
    }).expect(201);
  pickupId = response.body.data.id;
  assert.equal(response.body.data.items.length, 2);
  assert.equal(response.body.data.status, 'pending');
});

test('collector receives nearest order, accepts it, arrives, and approves payout', async () => {
  const nearby = await request(app).get('/api/v1/collector/orders/nearby?latitude=6.6000&longitude=3.3500&radiusKm=8')
    .set('Authorization', `Bearer ${collectorToken}`).expect(200);
  assert.equal(nearby.body.data[0].id, pickupId);

  await request(app).post(`/api/v1/collector/orders/${pickupId}/accept`)
    .set('Authorization', `Bearer ${collectorToken}`)
    .send({ latitude: 6.6000, longitude: 3.3500 }).expect(200);

  await request(app).patch(`/api/v1/collector/orders/${pickupId}/status`)
    .set('Authorization', `Bearer ${collectorToken}`).send({ status: 'en_route' }).expect(200);
  await request(app).patch(`/api/v1/collector/orders/${pickupId}/status`)
    .set('Authorization', `Bearer ${collectorToken}`).send({ status: 'arrived' }).expect(200);

  const payout = await request(app).post(`/api/v1/collector/orders/${pickupId}/approve-payout`)
    .set('Authorization', `Bearer ${collectorToken}`)
    .send({ customerConfirmed: true, items: [
      { materialId: 'metal', verifiedWeight: 21, quality: 'clean' },
      { materialId: 'plastic', verifiedWeight: 9.5, quality: 'mixed' }
    ] }).expect(200);
  assert.equal(payout.body.data.pickup.status, 'paid');
  assert.ok(payout.body.data.pickup.customerPayout > 0);
});

test('credits customer payout and collector fee wallets', async () => {
  const customerWallet = await request(app).get('/api/v1/wallet').set('Authorization', `Bearer ${distributorToken}`).expect(200);
  const collectorWallet = await request(app).get('/api/v1/wallet').set('Authorization', `Bearer ${collectorToken}`).expect(200);
  assert.ok(customerWallet.body.data.availableBalance > 0);
  assert.ok(collectorWallet.body.data.availableBalance > 0);
});
