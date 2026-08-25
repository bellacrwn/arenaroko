import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { store } from '../db/store.js';
import { id } from '../lib/ids.js';
import { addAudit, publicUser, walletFor } from '../lib/entities.js';
import { asyncRoute } from '../lib/async-route.js';
import { authenticate, issueToken } from '../middleware/auth.js';
import { ApiError } from '../middleware/errors.js';
import { validate } from '../middleware/validate.js';
import { createMockAlatAccount, lookupWemaAccount, verifyWemaChallenge } from '../services/wema.js';

const router = Router();
const role = z.enum(['distributor', 'collector']);
const email = z.string().email().transform((value) => value.toLowerCase());
const password = z.string().min(8).max(72);
const accountHash = (accountNumber) => createHash('sha256').update(accountNumber).digest('hex');

const registrationSchema = z.object({
  role,
  firstName: z.string().min(2).max(80),
  lastName: z.string().min(2).max(80),
  email,
  phone: z.string().min(7).max(24),
  password,
  businessName: z.string().min(2).max(120).optional(),
}).superRefine((value, context) => {
  if (value.role === 'collector' && !value.businessName) context.addIssue({ code: 'custom', path: ['businessName'], message: 'Collector accounts require a business or display name.' });
});

router.post('/register', validate(registrationSchema), asyncRoute(async (request, response) => {
  const input = request.validated.body;
  const passwordHash = await bcrypt.hash(input.password, 12);
  const result = await store.transaction((database) => {
    if (database.users.some((user) => user.email === input.email)) throw new ApiError(409, 'EMAIL_EXISTS', 'An account already uses this email address.');
    const now = new Date().toISOString();
    const user = { id: id(), ...input, password: undefined, passwordHash, active: true, onboardingSource: 'reko', createdAt: now, updatedAt: now };
    delete user.password;
    database.users.push(user);
    const wallet = { id: id(), userId: user.id, currency: 'NGN', balance: 0, availableBalance: 0, createdAt: now, updatedAt: now };
    database.wallets.push(wallet);
    addAudit(database, 'auth.register', user.id, 'user', user.id, { role: user.role });
    return { user: publicUser(user), wallet };
  });
  response.status(201).json({ success: true, data: { ...result, accessToken: issueToken(result.user) } });
}));

router.post('/login', validate(z.object({ email, password: z.string().min(1) })), asyncRoute(async (request, response) => {
  const input = request.validated.body;
  const database = await store.snapshot();
  const user = database.users.find((item) => item.email === input.email && item.active !== false);
  if (!user?.passwordHash || !(await bcrypt.compare(input.password, user.passwordHash))) throw new ApiError(401, 'INVALID_CREDENTIALS', 'The email or password is incorrect.');
  response.json({ success: true, data: { user: publicUser(user), wallet: walletFor(database, user.id), accessToken: issueToken(user) } });
}));

router.get('/me', authenticate, asyncRoute(async (request, response) => {
  const database = await store.snapshot();
  response.json({ success: true, data: { user: request.auth.user, wallet: walletFor(database, request.auth.user.id) } });
}));

router.post('/wema/lookup', validate(z.object({ accountNumber: z.string().regex(/^\d{10}$/) })), asyncRoute(async (request, response) => {
  const result = await lookupWemaAccount(request.validated.body.accountNumber);
  response.json({ success: true, data: result });
}));

router.post('/wema/verify', validate(z.object({
  challengeId: z.string().uuid(),
  otp: z.string().regex(/^\d{6}$/),
  role,
  email: z.string().email().optional(),
  phone: z.string().min(7).max(24).optional(),
  businessName: z.string().min(2).max(120).optional(),
})), asyncRoute(async (request, response) => {
  const input = request.validated.body;
  const verified = await verifyWemaChallenge(input.challengeId, input.otp);
  const hash = accountHash(verified.accountNumber);
  const result = await store.transaction((database) => {
    let user = database.users.find((item) => item.wemaAccountHash === hash);
    if (!user) {
      const now = new Date().toISOString();
      const names = verified.accountName.split(/\s+/);
      user = {
        id: id(), role: input.role, firstName: names[0] || 'Wema', lastName: names.slice(1).join(' ') || 'Customer',
        email: input.email?.toLowerCase() || `wema-${verified.accountNumber.slice(-4)}-${Date.now()}@placeholder.reko.local`,
        phone: input.phone || null, businessName: input.businessName || null, passwordHash: null, active: true,
        onboardingSource: 'wema-existing', wemaAccountHash: hash, wemaAccountLast4: verified.accountNumber.slice(-4),
        wemaAccountStatus: 'verified', createdAt: now, updatedAt: now,
      };
      database.users.push(user);
      database.wallets.push({ id: id(), userId: user.id, currency: 'NGN', balance: 0, availableBalance: 0, provider: 'wema', providerAccountLast4: user.wemaAccountLast4, createdAt: now, updatedAt: now });
    }
    addAudit(database, 'auth.wema_verified', user.id, 'user', user.id, { accountLast4: user.wemaAccountLast4 });
    return { user: publicUser(user), wallet: walletFor(database, user.id) };
  });
  response.status(201).json({ success: true, data: { ...result, accessToken: issueToken(result.user) } });
}));

router.post('/alat/apply', validate(z.object({
  role,
  firstName: z.string().min(2).max(80), lastName: z.string().min(2).max(80), email, phone: z.string().min(7).max(24),
  dateOfBirth: z.string().date(), bvn: z.string().regex(/^\d{11}$/), nin: z.string().regex(/^\d{11}$/),
  address: z.object({ label: z.string().min(5), latitude: z.number().min(-90).max(90).optional(), longitude: z.number().min(-180).max(180).optional() }),
  password, businessName: z.string().min(2).max(120).optional(), consent: z.literal(true),
})), asyncRoute(async (request, response) => {
  const input = request.validated.body;
  const passwordHash = await bcrypt.hash(input.password, 12);
  const alatAccount = await createMockAlatAccount(input);
  const result = await store.transaction((database) => {
    if (database.users.some((user) => user.email === input.email)) throw new ApiError(409, 'EMAIL_EXISTS', 'An account already uses this email address.');
    const now = new Date().toISOString();
    const user = {
      id: id(), role: input.role, firstName: input.firstName, lastName: input.lastName, email: input.email, phone: input.phone,
      dateOfBirth: input.dateOfBirth, businessName: input.businessName || null, address: input.address,
      identity: { bvnLast4: input.bvn.slice(-4), ninLast4: input.nin.slice(-4), verified: true }, passwordHash, active: true,
      onboardingSource: 'alat-new', wemaAccountHash: accountHash(alatAccount.accountNumber), wemaAccountLast4: alatAccount.accountNumber.slice(-4),
      wemaAccountStatus: alatAccount.status, createdAt: now, updatedAt: now,
    };
    database.users.push(user);
    const wallet = { id: id(), userId: user.id, currency: 'NGN', balance: 0, availableBalance: 0, provider: 'wema', providerAccountLast4: user.wemaAccountLast4, createdAt: now, updatedAt: now };
    database.wallets.push(wallet);
    addAudit(database, 'auth.alat_opened', user.id, 'user', user.id, { accountLast4: user.wemaAccountLast4 });
    return { user: publicUser(user), wallet };
  });
  response.status(201).json({ success: true, data: { ...result, accessToken: issueToken(result.user) } });
}));

export default router;
