import { Router } from 'express';
import { z } from 'zod';
import { store } from '../db/store.js';
import { id, publicPickupId } from '../lib/ids.js';
import { addAudit, materialMap } from '../lib/entities.js';
import { asyncRoute } from '../lib/async-route.js';
import { allowRoles, authenticate } from '../middleware/auth.js';
import { ApiError } from '../middleware/errors.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(authenticate);

const itemSchema = z.object({ materialId: z.string().min(1), estimatedWeight: z.coerce.number().positive().max(10000) });
const addressSchema = z.object({
  label: z.string().min(5).max(250),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  notes: z.string().max(500).optional(),
});
const createSchema = z.object({
  items: z.array(itemSchema).min(1).max(10),
  address: addressSchema,
  pickupWindow: z.string().min(5).max(120),
  photos: z.array(z.string().url()).max(8).default([]),
  customerNote: z.string().max(500).optional(),
});

function decorate(pickup, database) {
  const lookup = materialMap(database);
  return { ...pickup, items: pickup.items.map((item) => ({ ...item, material: lookup.get(item.materialId) || null })) };
}

router.post('/', allowRoles('distributor'), validate(createSchema), asyncRoute(async (request, response) => {
  const input = request.validated.body;
  const pickup = await store.transaction((database) => {
    const lookup = materialMap(database);
    const items = input.items.map((item) => {
      const material = lookup.get(item.materialId);
      if (!material?.active) throw new ApiError(422, 'INVALID_MATERIAL', `Material ${item.materialId} is not available.`);
      return { ...item, rateAtBooking: material.rate, estimatedPayout: Math.round(item.estimatedWeight * material.rate) };
    });
    const now = new Date().toISOString();
    const entity = {
      id: id(), publicId: publicPickupId(), customerId: request.auth.user.id, collectorId: null,
      items, address: input.address, pickupWindow: input.pickupWindow, photos: input.photos,
      customerNote: input.customerNote || null, status: 'pending',
      estimatedWeight: items.reduce((sum, item) => sum + item.estimatedWeight, 0),
      estimatedPayout: items.reduce((sum, item) => sum + item.estimatedPayout, 0),
      collectorFee: 1000 + items.length * 250, createdAt: now, updatedAt: now,
    };
    database.pickups.push(entity);
    database.notifications.push({ id: id(), userId: entity.customerId, type: 'pickup_created', title: 'Pickup requested', message: `${entity.publicId} is waiting for a collector.`, read: false, createdAt: now });
    addAudit(database, 'pickup.created', request.auth.user.id, 'pickup', entity.id, { itemCount: items.length });
    return decorate(entity, database);
  });
  response.status(201).json({ success: true, data: pickup });
}));

router.get('/', validate(z.object({ status: z.string().optional(), limit: z.coerce.number().int().min(1).max(100).default(30) }), 'query'), asyncRoute(async (request, response) => {
  const query = request.validated.query;
  const database = await store.snapshot();
  let pickups = database.pickups.filter((pickup) => request.auth.user.role === 'collector' ? pickup.collectorId === request.auth.user.id : pickup.customerId === request.auth.user.id);
  if (query.status) pickups = pickups.filter((pickup) => pickup.status === query.status);
  pickups = pickups.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, query.limit).map((pickup) => decorate(pickup, database));
  response.json({ success: true, data: pickups });
}));

router.get('/:pickupId', asyncRoute(async (request, response) => {
  const database = await store.snapshot();
  const pickup = database.pickups.find((item) => item.id === request.params.pickupId || item.publicId === request.params.pickupId);
  if (!pickup) throw new ApiError(404, 'PICKUP_NOT_FOUND', 'The pickup could not be found.');
  const allowed = pickup.customerId === request.auth.user.id || pickup.collectorId === request.auth.user.id;
  if (!allowed) throw new ApiError(403, 'FORBIDDEN', 'You cannot view this pickup.');
  response.json({ success: true, data: decorate(pickup, database) });
}));

router.post('/:pickupId/cancel', allowRoles('distributor'), asyncRoute(async (request, response) => {
  const pickup = await store.transaction((database) => {
    const entity = database.pickups.find((item) => item.id === request.params.pickupId || item.publicId === request.params.pickupId);
    if (!entity || entity.customerId !== request.auth.user.id) throw new ApiError(404, 'PICKUP_NOT_FOUND', 'The pickup could not be found.');
    if (!['pending', 'accepted'].includes(entity.status)) throw new ApiError(409, 'CANNOT_CANCEL', 'This pickup has progressed too far to cancel.');
    entity.status = 'cancelled'; entity.cancelledAt = new Date().toISOString(); entity.updatedAt = entity.cancelledAt;
    addAudit(database, 'pickup.cancelled', request.auth.user.id, 'pickup', entity.id);
    return decorate(entity, database);
  });
  response.json({ success: true, data: pickup });
}));

export default router;
