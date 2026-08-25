import { Router } from 'express';
import { z } from 'zod';
import { distanceKm } from '../lib/geo.js';
import { asyncRoute } from '../lib/async-route.js';
import { allowRoles, authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { supabaseAdmin, assertSupabase, assertRpc } from '../supabase.js';

const router = Router();
router.use(authenticate, allowRoles('collector'));

async function resolvePickupId(value) {
  if (!value.startsWith('RKO-')) return value;
  return assertSupabase(await supabaseAdmin.from('pickups').select('id').eq('public_id', value).single()).id;
}

router.get('/orders/nearby', validate(z.object({
  latitude: z.coerce.number().min(-90).max(90), longitude: z.coerce.number().min(-180).max(180),
  radiusKm: z.coerce.number().positive().max(100).default(8), materialId: z.string().optional(), limit: z.coerce.number().int().min(1).max(100).default(30),
}), 'query'), asyncRoute(async (request, response) => {
  const query = request.validated.query;
  let builder = supabaseAdmin.from('pickups').select('*, pickup_items(*, material:materials(*))').eq('status', 'pending').order('created_at', { ascending: true }).limit(200);
  if (query.materialId) builder = builder.eq('pickup_items.material_id', query.materialId);
  const raw = assertSupabase(await builder);
  const data = raw.map((pickup) => ({ ...pickup, distanceKm: Number(distanceKm(query.latitude, query.longitude, pickup.latitude, pickup.longitude).toFixed(2)) }))
    .filter((pickup) => pickup.distanceKm <= query.radiusKm).sort((a, b) => a.distanceKm - b.distanceKm).slice(0, query.limit);
  response.json({ success: true, data, meta: { latitude: query.latitude, longitude: query.longitude, radiusKm: query.radiusKm, count: data.length } });
}));

router.post('/orders/:pickupId/accept', validate(z.object({ latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180) })), asyncRoute(async (request, response) => {
  const pickupId = await resolvePickupId(request.params.pickupId);
  const input = request.validated.body;
  const data = assertRpc(await supabaseAdmin.rpc('accept_pickup', { p_pickup_id: pickupId, p_collector_id: request.auth.user.id, p_latitude: input.latitude, p_longitude: input.longitude }), { PICKUP_NOT_FOUND: 404, ORDER_UNAVAILABLE: 409, COLLECTOR_REQUIRED: 403 });
  response.json({ success: true, data });
}));

router.patch('/orders/:pickupId/status', validate(z.object({ status: z.enum(['en_route','arrived']), latitude: z.number().min(-90).max(90).optional(), longitude: z.number().min(-180).max(180).optional() })), asyncRoute(async (request, response) => {
  const pickupId = await resolvePickupId(request.params.pickupId);
  const input = request.validated.body;
  const data = assertRpc(await supabaseAdmin.rpc('advance_pickup', { p_pickup_id: pickupId, p_collector_id: request.auth.user.id, p_status: input.status, p_latitude: input.latitude || null, p_longitude: input.longitude || null }), { PICKUP_NOT_FOUND: 404, INVALID_TRANSITION: 409 });
  response.json({ success: true, data });
}));

router.post('/orders/:pickupId/approve-payout', validate(z.object({
  items: z.array(z.object({ materialId: z.string(), verifiedWeight: z.coerce.number().positive().max(10000), quality: z.enum(['clean','mixed','needs_sorting']) })).min(1).max(10),
  customerConfirmed: z.literal(true),
})), asyncRoute(async (request, response) => {
  const pickupId = await resolvePickupId(request.params.pickupId);
  const input = request.validated.body;
  const data = assertRpc(await supabaseAdmin.rpc('approve_pickup_payout', { p_pickup_id: pickupId, p_collector_id: request.auth.user.id, p_items: input.items, p_customer_confirmed: input.customerConfirmed }), {
    PICKUP_NOT_FOUND: 404, PICKUP_NOT_READY: 409, ITEM_MISMATCH: 422, INVALID_MATERIAL: 422, INVALID_VERIFICATION: 422, CUSTOMER_CONFIRMATION_REQUIRED: 422, WALLET_MISSING: 500,
  });
  response.json({ success: true, data });
}));

export default router;
