import { Router } from 'express';
import { z } from 'zod';
import { distanceKm } from '../lib/geo.js';
import { asyncRoute } from '../lib/async-route.js';
import { validate } from '../middleware/validate.js';
import { supabaseAdmin, assertSupabase } from '../supabase.js';

const router = Router();

router.get('/materials', asyncRoute(async (request, response) => {
  const data = assertSupabase(await supabaseAdmin.from('materials').select('*').eq('active', true).order('name'));
  response.json({ success: true, data });
}));

router.get('/stations', validate(z.object({ latitude: z.coerce.number().min(-90).max(90).optional(), longitude: z.coerce.number().min(-180).max(180).optional(), radiusKm: z.coerce.number().positive().max(100).default(25), materialId: z.string().optional(), search: z.string().max(100).optional() }), 'query'), asyncRoute(async (request, response) => {
  const query = request.validated.query;
  let builder = supabaseAdmin.from('stations').select('*').eq('active', true);
  if (query.materialId) builder = builder.contains('material_ids', [query.materialId]);
  if (query.search) builder = builder.or(`name.ilike.%${query.search}%,area.ilike.%${query.search}%,address.ilike.%${query.search}%`);
  let data = assertSupabase(await builder);
  if (query.latitude !== undefined && query.longitude !== undefined) {
    data = data.map((station) => ({ ...station, distanceKm: Number(distanceKm(query.latitude, query.longitude, station.latitude, station.longitude).toFixed(2)) }))
      .filter((station) => station.distanceKm <= query.radiusKm).sort((a, b) => a.distanceKm - b.distanceKm);
  }
  response.json({ success: true, data });
}));

export default router;
