import { Router } from 'express';
import { z } from 'zod';
import { asyncRoute } from '../lib/async-route.js';
import { authenticate } from '../middleware/auth.js';
import { ApiError } from '../middleware/errors.js';
import { validate } from '../middleware/validate.js';
import { supabaseAdmin, assertSupabase, assertRpc } from '../supabase.js';

const router = Router();
router.use(authenticate);

router.get('/', asyncRoute(async (request, response) => {
  const result = await supabaseAdmin.from('wallets').select('*').eq('user_id', request.auth.user.id).single();
  if (result.error) throw new ApiError(404, 'WALLET_NOT_FOUND', 'No wallet exists for this account.');
  response.json({ success: true, data: result.data });
}));

router.get('/transactions', validate(z.object({ limit: z.coerce.number().int().min(1).max(100).default(30), type: z.string().optional() }), 'query'), asyncRoute(async (request, response) => {
  const query = request.validated.query;
  let builder = supabaseAdmin.from('wallet_transactions').select('*').eq('user_id', request.auth.user.id).order('created_at', { ascending: false }).limit(query.limit);
  if (query.type) builder = builder.eq('type', query.type);
  response.json({ success: true, data: assertSupabase(await builder) });
}));

router.post('/withdrawals', validate(z.object({ amount: z.coerce.number().positive(), bankCode: z.string().min(2).max(20).default('035'), accountNumber: z.string().regex(/^\d{10}$/) })), asyncRoute(async (request, response) => {
  const input = request.validated.body;
  const data = assertRpc(await supabaseAdmin.rpc('create_wallet_withdrawal', { p_user_id: request.auth.user.id, p_amount: input.amount, p_bank_code: input.bankCode, p_account_last4: input.accountNumber.slice(-4) }), { WALLET_NOT_FOUND: 404, INSUFFICIENT_BALANCE: 409, INVALID_AMOUNT: 422 });
  response.status(201).json({ success: true, data });
}));

export default router;
