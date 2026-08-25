import { Router } from 'express';
import { store } from '../db/store.js';
import { asyncRoute } from '../lib/async-route.js';
import { authenticate } from '../middleware/auth.js';
import { ApiError } from '../middleware/errors.js';

const router = Router();
router.use(authenticate);

router.get('/', asyncRoute(async (request, response) => {
  const database = await store.snapshot();
  const notifications = database.notifications.filter((item) => item.userId === request.auth.user.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  response.json({ success: true, data: notifications, meta: { unread: notifications.filter((item) => !item.read).length } });
}));

router.patch('/:notificationId/read', asyncRoute(async (request, response) => {
  const notification = await store.transaction((database) => {
    const item = database.notifications.find((entry) => entry.id === request.params.notificationId && entry.userId === request.auth.user.id);
    if (!item) throw new ApiError(404, 'NOTIFICATION_NOT_FOUND', 'The notification was not found.');
    item.read = true; item.readAt = new Date().toISOString();
    return item;
  });
  response.json({ success: true, data: notification });
}));

export default router;
