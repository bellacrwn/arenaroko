import { Router } from 'express';
import { z } from 'zod';
import { store } from '../db/store.js';
import { distanceKm } from '../lib/geo.js';
import { asyncRoute } from '../lib/async-route.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.get('/materials', asyncRoute(async (request, response) => {
  const database = await store.snapshot();
  response.json({ success: true, data: database.materials.filter((item) => item.active) });
}));

router.get('/stations', validate(z.object({
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  radiusKm: z.coerce.number().positive().max(100).default(25),
  materialId: z.string().optional(),
  search: z.string().max(100).optional(),
}), 'query'), asyncRoute(async (request, response) => {
  const query = request.validated.query;
  const database = await store.snapshot();
  let results = database.stations.filter((station) => station.active);
  if (query.materialId) results = results.filter((station) => station.materials.includes(query.materialId));
  if (query.search) {
    const term = query.search.toLowerCase();
    results = results.filter((station) => `${station.name} ${station.area} ${station.address}`.toLowerCase().includes(term));
  }
  if (query.latitude !== undefined && query.longitude !== undefined) {
    results = results.map((station) => ({ ...station, distanceKm: Number(distanceKm(query.latitude, query.longitude, station.latitude, station.longitude).toFixed(2)) }))
      .filter((station) => station.distanceKm <= query.radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }
  response.json({ success: true, data: results });
}));

export default router;
