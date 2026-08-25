import { Router } from 'express';
import { z } from 'zod';
import { asyncRoute } from '../lib/async-route.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { supabaseAdmin, assertSupabase } from '../supabase.js';

const router = Router();
router.use(authenticate);

router.get('/', asyncRoute(async (request, response) => {
  const isCollector = request.auth.user.role === 'collector';
  const column = isCollector ? 'collector_id' : 'customer_id';
  const [pickupsResult, walletResult] = await Promise.all([
    supabaseAdmin.from('pickups').select('*, pickup_items(*, material:materials(*))').eq(column, request.auth.user.id).order('created_at', { ascending: false }),
    supabaseAdmin.from('wallets').select('*').eq('user_id', request.auth.user.id).single(),
  ]);
  const pickups = assertSupabase(pickupsResult);
  const wallet = assertSupabase(walletResult);
  const completed = pickups.filter((pickup) => pickup.status === 'paid');
  const active = pickups.filter((pickup) => !['paid','cancelled'].includes(pickup.status));
  const totalWeight = completed.reduce((sum, pickup) => sum + Number(pickup.verified_weight || 0), 0);
  const totalValue = completed.reduce((sum, pickup) => sum + Number(isCollector ? pickup.collector_fee : pickup.customer_payout || 0), 0);
  response.json({ success: true, data: { role: request.auth.user.role, wallet, stats: {
    totalPickups: pickups.length, completedPickups: completed.length, activePickups: active.length, totalWeight, totalValue, co2AvoidedKg: Number((totalWeight * .5).toFixed(2)),
  }, active: active.slice(0,5), recent: pickups.slice(0,6) } });
}));

router.get('/order-analytics', validate(z.object({ metric: z.enum(['payout','weight']).default('payout'), limit: z.coerce.number().int().min(2).max(50).default(6) }), 'query'), asyncRoute(async (request, response) => {
  const query = request.validated.query;
  const isCollector = request.auth.user.role === 'collector';
  const column = isCollector ? 'collector_id' : 'customer_id';
  const pickups = assertSupabase(await supabaseAdmin.from('pickups').select('id,public_id,status,created_at,verified_weight,estimated_weight,customer_payout,estimated_payout,collector_fee,pickup_items(material_id)').eq(column, request.auth.user.id).order('created_at', { ascending: false }).limit(query.limit)).reverse();
  const points = pickups.map((pickup) => ({ id: pickup.id, publicId: pickup.public_id, status: pickup.status, createdAt: pickup.created_at,
    value: query.metric === 'weight' ? Number(pickup.verified_weight || pickup.estimated_weight || 0) : Number(isCollector ? pickup.collector_fee : pickup.customer_payout || pickup.estimated_payout || 0),
    materials: pickup.pickup_items.map((item) => item.material_id),
  }));
  response.json({ success: true, data: { metric: query.metric, points } });
}));

export default router;
