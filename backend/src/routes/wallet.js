import { Router } from 'express';
import { z } from 'zod';
import { store } from '../db/store.js';
import { id } from '../lib/ids.js';
import { addAudit, walletFor } from '../lib/entities.js';
import { asyncRoute } from '../lib/async-route.js';
import { authenticate } from '../middleware/auth.js';
import { ApiError } from '../middleware/errors.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(authenticate);

router.get('/', asyncRoute(async (request, response) => {
  const database = await store.snapshot();
  const wallet = walletFor(database, request.auth.user.id);
  if (!wallet) throw new ApiError(404, 'WALLET_NOT_FOUND', 'No wallet exists for this account.');
  response.json({ success: true, data: wallet });
}));

router.get('/transactions', validate(z.object({ limit: z.coerce.number().int().min(1).max(100).default(30), type: z.string().optional() }), 'query'), asyncRoute(async (request, response) => {
  const query = request.validated.query;
  const database = await store.snapshot();
  let transactions = database.transactions.filter((item) => item.userId === request.auth.user.id);
  if (query.type) transactions = transactions.filter((item) => item.type === query.type);
  transactions = transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, query.limit);
  response.json({ success: true, data: transactions });
}));

router.post('/withdrawals', validate(z.object({
  amount: z.coerce.number().positive(),
  bankCode: z.string().min(2).max(20).default('035'),
  accountNumber: z.string().regex(/^\d{10}$/),
})), asyncRoute(async (request, response) => {
  const input = request.validated.body;
  const result = await store.transaction((database) => {
    const wallet = walletFor(database, request.auth.user.id);
    if (!wallet) throw new ApiError(404, 'WALLET_NOT_FOUND', 'No wallet exists for this account.');
    if (wallet.availableBalance < input.amount) throw new ApiError(409, 'INSUFFICIENT_BALANCE', 'The wallet does not have enough available balance.');
    const now = new Date().toISOString();
    wallet.balance -= input.amount; wallet.availableBalance -= input.amount; wallet.updatedAt = now;
    const transaction = {
      id: id(), walletId: wallet.id, userId: request.auth.user.id, type: 'withdrawal', direction: 'debit',
      amount: input.amount, currency: 'NGN', status: 'completed', bankCode: input.bankCode,
      accountLast4: input.accountNumber.slice(-4), description: `Withdrawal to ••••${input.accountNumber.slice(-4)}`, createdAt: now,
    };
    database.transactions.push(transaction);
    addAudit(database, 'wallet.withdrawal', request.auth.user.id, 'transaction', transaction.id, { amount: input.amount, accountLast4: transaction.accountLast4 });
    return { wallet, transaction };
  });
  response.status(201).json({ success: true, data: result });
}));

export default router;
