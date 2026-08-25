import { Router } from 'express';
import { z } from 'zod';
import { store } from '../db/store.js';
import { distanceKm } from '../lib/geo.js';
import { id } from '../lib/ids.js';
import { addAudit, materialMap, walletFor } from '../lib/entities.js';
import { asyncRoute } from '../lib/async-route.js';
import { allowRoles, authenticate } from '../middleware/auth.js';
import { ApiError } from '../middleware/errors.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(authenticate, allowRoles('collector'));

router.get('/orders/nearby', validate(z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  radiusKm: z.coerce.number().positive().max(100).default(8),
  materialId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
}), 'query'), asyncRoute(async (request, response) => {
  const query = request.validated.query;
  const database = await store.snapshot();
  const lookup = materialMap(database);
  const orders = database.pickups.filter((pickup) => pickup.status === 'pending')
    .filter((pickup) => !query.materialId || pickup.items.some((item) => item.materialId === query.materialId))
    .map((pickup) => ({
      ...pickup,
      distanceKm: Number(distanceKm(query.latitude, query.longitude, pickup.address.latitude, pickup.address.longitude).toFixed(2)),
      items: pickup.items.map((item) => ({ ...item, material: lookup.get(item.materialId) || null })),
    }))
    .filter((pickup) => pickup.distanceKm <= query.radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, query.limit);
  response.json({ success: true, data: orders, meta: { latitude: query.latitude, longitude: query.longitude, radiusKm: query.radiusKm, count: orders.length } });
}));

router.post('/orders/:pickupId/accept', validate(z.object({ latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180) })), asyncRoute(async (request, response) => {
  const location = request.validated.body;
  const pickup = await store.transaction((database) => {
    const entity = database.pickups.find((item) => item.id === request.params.pickupId || item.publicId === request.params.pickupId);
    if (!entity) throw new ApiError(404, 'PICKUP_NOT_FOUND', 'The pickup could not be found.');
    if (entity.status !== 'pending' || entity.collectorId) throw new ApiError(409, 'ORDER_UNAVAILABLE', 'Another collector has already accepted this order.');
    const now = new Date().toISOString();
    entity.collectorId = request.auth.user.id; entity.status = 'accepted'; entity.acceptedAt = now; entity.updatedAt = now;
    entity.distanceAtAcceptanceKm = Number(distanceKm(location.latitude, location.longitude, entity.address.latitude, entity.address.longitude).toFixed(2));
    database.notifications.push({ id: id(), userId: entity.customerId, type: 'collector_assigned', title: 'Collector assigned', message: `${request.auth.user.firstName} accepted ${entity.publicId}.`, read: false, createdAt: now });
    addAudit(database, 'pickup.accepted', request.auth.user.id, 'pickup', entity.id, { distanceKm: entity.distanceAtAcceptanceKm });
    return entity;
  });
  response.json({ success: true, data: pickup });
}));

const transitions = { accepted: 'en_route', en_route: 'arrived' };
router.patch('/orders/:pickupId/status', validate(z.object({ status: z.enum(['en_route', 'arrived']), latitude: z.number().min(-90).max(90).optional(), longitude: z.number().min(-180).max(180).optional() })), asyncRoute(async (request, response) => {
  const input = request.validated.body;
  const pickup = await store.transaction((database) => {
    const entity = database.pickups.find((item) => item.id === request.params.pickupId || item.publicId === request.params.pickupId);
    if (!entity || entity.collectorId !== request.auth.user.id) throw new ApiError(404, 'PICKUP_NOT_FOUND', 'The assigned pickup could not be found.');
    if (transitions[entity.status] !== input.status) throw new ApiError(409, 'INVALID_TRANSITION', `Pickup cannot move from ${entity.status} to ${input.status}.`);
    const now = new Date().toISOString();
    entity.status = input.status; entity.updatedAt = now;
    entity[`${input.status}At`] = now;
    if (input.latitude !== undefined) entity.lastCollectorLocation = { latitude: input.latitude, longitude: input.longitude, updatedAt: now };
    database.notifications.push({ id: id(), userId: entity.customerId, type: `pickup_${input.status}`, title: input.status === 'en_route' ? 'Collector on the way' : 'Collector arrived', message: `${entity.publicId} is now ${input.status.replace('_', ' ')}.`, read: false, createdAt: now });
    addAudit(database, `pickup.${input.status}`, request.auth.user.id, 'pickup', entity.id);
    return entity;
  });
  response.json({ success: true, data: pickup });
}));

router.post('/orders/:pickupId/approve-payout', validate(z.object({
  items: z.array(z.object({ materialId: z.string(), verifiedWeight: z.coerce.number().positive().max(10000), quality: z.enum(['clean', 'mixed', 'needs_sorting']) })).min(1).max(10),
  customerConfirmed: z.literal(true),
})), asyncRoute(async (request, response) => {
  const input = request.validated.body;
  const result = await store.transaction((database) => {
    const pickup = database.pickups.find((item) => item.id === request.params.pickupId || item.publicId === request.params.pickupId);
    if (!pickup || pickup.collectorId !== request.auth.user.id) throw new ApiError(404, 'PICKUP_NOT_FOUND', 'The assigned pickup could not be found.');
    if (pickup.status !== 'arrived') throw new ApiError(409, 'PICKUP_NOT_READY', 'Mark the pickup as arrived before approving payment.');
    const expectedIds = new Set(pickup.items.map((item) => item.materialId));
    if (input.items.length !== expectedIds.size || input.items.some((item) => !expectedIds.has(item.materialId))) {
      throw new ApiError(422, 'ITEM_MISMATCH', 'Verified items must match every material in the original pickup.');
    }
    const lookup = materialMap(database);
    const qualityFactor = { clean: 1, mixed: 0.9, needs_sorting: 0.75 };
    const verifiedItems = input.items.map((item) => {
      const material = lookup.get(item.materialId);
      if (!material) throw new ApiError(422, 'INVALID_MATERIAL', `Material ${item.materialId} is invalid.`);
      const rate = material.rate;
      const payout = Math.round(item.verifiedWeight * rate * qualityFactor[item.quality]);
      return { ...item, rateAtPayout: rate, qualityFactor: qualityFactor[item.quality], payout };
    });
    const customerPayout = verifiedItems.reduce((sum, item) => sum + item.payout, 0);
    const verifiedWeight = verifiedItems.reduce((sum, item) => sum + item.verifiedWeight, 0);
    const customerWallet = walletFor(database, pickup.customerId);
    const collectorWallet = walletFor(database, pickup.collectorId);
    if (!customerWallet || !collectorWallet) throw new ApiError(500, 'WALLET_MISSING', 'A pickup wallet is missing.');
    const now = new Date().toISOString();
    customerWallet.balance += customerPayout; customerWallet.availableBalance += customerPayout; customerWallet.updatedAt = now;
    collectorWallet.balance += pickup.collectorFee; collectorWallet.availableBalance += pickup.collectorFee; collectorWallet.updatedAt = now;
    const customerTransaction = { id: id(), walletId: customerWallet.id, userId: pickup.customerId, pickupId: pickup.id, type: 'pickup_credit', direction: 'credit', amount: customerPayout, currency: 'NGN', status: 'completed', description: `${pickup.publicId} recycling payout`, createdAt: now };
    const collectorTransaction = { id: id(), walletId: collectorWallet.id, userId: pickup.collectorId, pickupId: pickup.id, type: 'collector_fee', direction: 'credit', amount: pickup.collectorFee, currency: 'NGN', status: 'completed', description: `${pickup.publicId} collector service fee`, createdAt: now };
    database.transactions.push(customerTransaction, collectorTransaction);
    pickup.status = 'paid'; pickup.verifiedItems = verifiedItems; pickup.verifiedWeight = verifiedWeight; pickup.customerPayout = customerPayout;
    pickup.customerConfirmed = true; pickup.payoutApprovedBy = request.auth.user.id; pickup.payoutApprovedAt = now; pickup.completedAt = now; pickup.updatedAt = now;
    database.notifications.push({ id: id(), userId: pickup.customerId, type: 'pickup_paid', title: 'Pickup paid', message: `${pickup.publicId} added ₦${customerPayout.toLocaleString('en-NG')} to your wallet.`, read: false, createdAt: now });
    addAudit(database, 'pickup.payout_approved', request.auth.user.id, 'pickup', pickup.id, { customerPayout, collectorFee: pickup.collectorFee, verifiedWeight });
    return { pickup, customerTransaction, collectorTransaction };
  });
  response.json({ success: true, data: result });
}));

export default router;
