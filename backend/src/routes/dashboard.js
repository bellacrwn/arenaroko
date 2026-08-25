import { Router } from 'express';
import { z } from 'zod';
import { store } from '../db/store.js';
import { walletFor } from '../lib/entities.js';
import { asyncRoute } from '../lib/async-route.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(authenticate);

router.get('/', asyncRoute(async (request, response) => {
  const database = await store.snapshot();
  const isCollector = request.auth.user.role === 'collector';
  const pickups = database.pickups.filter((pickup) => isCollector ? pickup.collectorId === request.auth.user.id : pickup.customerId === request.auth.user.id);
  const completed = pickups.filter((pickup) => pickup.status === 'paid');
  const active = pickups.filter((pickup) => !['paid', 'cancelled'].includes(pickup.status));
  const totalWeight = completed.reduce((sum, pickup) => sum + Number(pickup.verifiedWeight || 0), 0);
  const totalValue = completed.reduce((sum, pickup) => sum + Number(isCollector ? pickup.collectorFee : pickup.customerPayout || 0), 0);
  const wallet = walletFor(database, request.auth.user.id);
  response.json({ success: true, data: {
    role: request.auth.user.role, wallet,
    stats: { totalPickups: pickups.length, completedPickups: completed.length, activePickups: active.length, totalWeight, totalValue, co2AvoidedKg: Number((totalWeight * 0.5).toFixed(2)) },
    active: active.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 5),
    recent: pickups.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6),
  } });
}));

router.get('/order-analytics', validate(z.object({ metric: z.enum(['payout', 'weight']).default('payout'), limit: z.coerce.number().int().min(2).max(50).default(6) }), 'query'), asyncRoute(async (request, response) => {
  const query = request.validated.query;
  const database = await store.snapshot();
  const isCollector = request.auth.user.role === 'collector';
  const pickups = database.pickups.filter((pickup) => isCollector ? pickup.collectorId === request.auth.user.id : pickup.customerId === request.auth.user.id)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)).slice(-query.limit);
  const points = pickups.map((pickup) => ({
    id: pickup.id, publicId: pickup.publicId, status: pickup.status, createdAt: pickup.createdAt,
    value: query.metric === 'weight' ? Number(pickup.verifiedWeight || pickup.estimatedWeight || 0) : Number(isCollector ? pickup.collectorFee : pickup.customerPayout || pickup.estimatedPayout || 0),
    materials: pickup.items.map((item) => item.materialId),
  }));
  response.json({ success: true, data: { metric: query.metric, points } });
}));

export default router;
