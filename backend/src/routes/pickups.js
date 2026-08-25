import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { asyncRoute } from '../lib/async-route.js';
import { allowRoles, authenticate } from '../middleware/auth.js';
import { ApiError } from '../middleware/errors.js';
import { validate } from '../middleware/validate.js';
import { config } from '../config.js';
import { supabaseAdmin, assertSupabase } from '../supabase.js';

const router = Router();
router.use(authenticate);

const itemSchema = z.object({ materialId: z.string().min(1), estimatedWeight: z.coerce.number().positive().max(10000) });
const createSchema = z.object({
  items: z.array(itemSchema).min(1).max(10),
  address: z.object({ label: z.string().min(5).max(250), latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180), notes: z.string().max(500).optional() }),
  pickupWindow: z.string().min(5).max(120), photoPaths: z.array(z.string().max(500)).max(8).default([]), customerNote: z.string().max(500).optional(),
});

router.post('/photos/upload-url', allowRoles('distributor'), validate(z.object({ fileName: z.string().min(1).max(150), contentType: z.enum(['image/jpeg','image/png','image/webp']) })), asyncRoute(async (request, response) => {
  const extension = request.validated.body.fileName.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${request.auth.user.id}/${randomUUID()}.${extension}`;
  const data = assertSupabase(await supabaseAdmin.storage.from(config.supabase.storageBucket).createSignedUploadUrl(path));
  response.status(201).json({ success: true, data: { ...data, path, bucket: config.supabase.storageBucket, contentType: request.validated.body.contentType } });
}));

router.post('/', allowRoles('distributor'), validate(createSchema), asyncRoute(async (request, response) => {
  const input = request.validated.body;
  const data = assertSupabase(await supabaseAdmin.rpc('create_pickup', {
    p_customer_id: request.auth.user.id,
    p_address: input.address,
    p_pickup_window: input.pickupWindow,
    p_photo_paths: input.photoPaths,
    p_customer_note: input.customerNote || null,
    p_items: input.items,
  }));
  response.status(201).json({ success: true, data });
}));

router.get('/', validate(z.object({ status: z.string().optional(), limit: z.coerce.number().int().min(1).max(100).default(30) }), 'query'), asyncRoute(async (request, response) => {
  const query = request.validated.query;
  let builder = supabaseAdmin.from('pickups').select('*, pickup_items(*, material:materials(*))')
    .eq(request.auth.user.role === 'collector' ? 'collector_id' : 'customer_id', request.auth.user.id)
    .order('created_at', { ascending: false }).limit(query.limit);
  if (query.status) builder = builder.eq('status', query.status);
  response.json({ success: true, data: assertSupabase(await builder) });
}));

router.get('/:pickupId', asyncRoute(async (request, response) => {
  const value = request.params.pickupId;
  let builder = supabaseAdmin.from('pickups').select('*, pickup_items(*, material:materials(*))');
  builder = value.startsWith('RKO-') ? builder.eq('public_id', value) : builder.eq('id', value);
  const pickup = assertSupabase(await builder.single());
  if (pickup.customer_id !== request.auth.user.id && pickup.collector_id !== request.auth.user.id) throw new ApiError(403, 'FORBIDDEN', 'You cannot view this pickup.');
  response.json({ success: true, data: pickup });
}));

router.post('/:pickupId/cancel', allowRoles('distributor'), asyncRoute(async (request, response) => {
  let pickupId = request.params.pickupId;
  if (pickupId.startsWith('RKO-')) {
    const pickup = assertSupabase(await supabaseAdmin.from('pickups').select('id').eq('public_id', pickupId).single());
    pickupId = pickup.id;
  }
  const data = assertSupabase(await supabaseAdmin.rpc('cancel_pickup', { p_pickup_id: pickupId, p_customer_id: request.auth.user.id }));
  response.json({ success: true, data });
}));

export default router;
