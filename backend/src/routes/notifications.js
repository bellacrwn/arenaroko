import { Router } from 'express';
import { asyncRoute } from '../lib/async-route.js';
import { authenticate } from '../middleware/auth.js';
import { ApiError } from '../middleware/errors.js';
import { supabaseAdmin, assertSupabase } from '../supabase.js';

const router = Router();
router.use(authenticate);

router.get('/', asyncRoute(async (request, response) => {
  const data = assertSupabase(await supabaseAdmin.from('notifications').select('*').eq('user_id', request.auth.user.id).order('created_at', { ascending: false }));
  response.json({ success: true, data, meta: { unread: data.filter((item) => !item.read).length } });
}));

router.patch('/:notificationId/read', asyncRoute(async (request, response) => {
  const result = await supabaseAdmin.from('notifications').update({ read: true, read_at: new Date().toISOString() }).eq('id', request.params.notificationId).eq('user_id', request.auth.user.id).select('*').maybeSingle();
  if (result.error || !result.data) throw new ApiError(404, 'NOTIFICATION_NOT_FOUND', 'The notification was not found.');
  response.json({ success: true, data: result.data });
}));

export default router;
