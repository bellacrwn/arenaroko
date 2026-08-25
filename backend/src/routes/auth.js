import { Router } from 'express';
import { z } from 'zod';
import { asyncRoute } from '../lib/async-route.js';
import { authenticate } from '../middleware/auth.js';
import { ApiError } from '../middleware/errors.js';
import { validate } from '../middleware/validate.js';
import { supabaseAdmin, supabasePublic, assertSupabase } from '../supabase.js';
import { createMockAlatAccount, lookupWemaAccount, verifyWemaChallenge } from '../services/wema.js';

const router = Router();
const role = z.enum(['distributor', 'collector']);
const email = z.string().email().transform((value) => value.toLowerCase());
const password = z.string().min(8).max(72);

async function accountPayload(userId, authUser, session) {
  const profile = assertSupabase(await supabaseAdmin.from('profiles').select('*').eq('id', userId).single());
  const wallet = assertSupabase(await supabaseAdmin.from('wallets').select('*').eq('user_id', userId).single());
  return { user: { ...profile, email: authUser.email }, wallet, session, accessToken: session?.access_token || null, requiresEmailConfirmation: !session };
}

const registrationSchema = z.object({
  role, firstName: z.string().min(2).max(80), lastName: z.string().min(2).max(80), email,
  phone: z.string().min(7).max(24), password, businessName: z.string().min(2).max(120).optional(),
}).superRefine((value, context) => {
  if (value.role === 'collector' && !value.businessName) context.addIssue({ code: 'custom', path: ['businessName'], message: 'Collector accounts require a business or display name.' });
});

router.post('/register', validate(registrationSchema), asyncRoute(async (request, response) => {
  const input = request.validated.body;
  const { data, error } = await supabasePublic.auth.signUp({ email: input.email, password: input.password, options: { data: { role: input.role, firstName: input.firstName, lastName: input.lastName, phone: input.phone, businessName: input.businessName, onboardingSource: 'reko' } } });
  if (error) throw new ApiError(error.status || 400, 'SIGNUP_FAILED', error.message);
  response.status(201).json({ success: true, data: await accountPayload(data.user.id, data.user, data.session) });
}));

router.post('/login', validate(z.object({ email, password: z.string().min(1) })), asyncRoute(async (request, response) => {
  const { data, error } = await supabasePublic.auth.signInWithPassword(request.validated.body);
  if (error) throw new ApiError(401, 'INVALID_CREDENTIALS', 'The email or password is incorrect.');
  response.json({ success: true, data: await accountPayload(data.user.id, data.user, data.session) });
}));

router.post('/phone/send', validate(z.object({ phone: z.string().min(7).max(24), role: role.default('distributor') })), asyncRoute(async (request, response) => {
  const input = request.validated.body;
  const { error } = await supabasePublic.auth.signInWithOtp({ phone: input.phone, options: { data: { role: input.role, firstName: 'REKO', lastName: 'User', phone: input.phone, onboardingSource: 'phone-otp' } } });
  if (error) throw new ApiError(error.status || 400, 'OTP_SEND_FAILED', error.message);
  response.json({ success: true, data: { sent: true } });
}));

router.post('/phone/verify', validate(z.object({ phone: z.string().min(7).max(24), token: z.string().min(6).max(10) })), asyncRoute(async (request, response) => {
  const { data, error } = await supabasePublic.auth.verifyOtp({ ...request.validated.body, type: 'sms' });
  if (error) throw new ApiError(401, 'OTP_VERIFY_FAILED', error.message);
  response.json({ success: true, data: await accountPayload(data.user.id, data.user, data.session) });
}));

router.get('/me', authenticate, asyncRoute(async (request, response) => {
  const wallet = assertSupabase(await supabaseAdmin.from('wallets').select('*').eq('user_id', request.auth.user.id).single());
  response.json({ success: true, data: { user: request.auth.user, wallet } });
}));

router.post('/logout', authenticate, asyncRoute(async (request, response) => {
  await supabaseAdmin.auth.admin.signOut(request.auth.accessToken);
  response.status(204).end();
}));

router.post('/wema/lookup', validate(z.object({ accountNumber: z.string().regex(/^\d{10}$/) })), asyncRoute(async (request, response) => {
  response.json({ success: true, data: await lookupWemaAccount(request.validated.body.accountNumber) });
}));

router.post('/wema/verify', validate(z.object({
  challengeId: z.string().uuid(), otp: z.string().regex(/^\d{6}$/), role, email, password,
  phone: z.string().min(7).max(24).optional(), businessName: z.string().min(2).max(120).optional(),
})), asyncRoute(async (request, response) => {
  const input = request.validated.body;
  const verified = await verifyWemaChallenge(input.challengeId, input.otp);
  const existing = await supabaseAdmin.from('profiles').select('id').eq('wema_account_hash', verified.account_hash).maybeSingle();
  if (existing.data) throw new ApiError(409, 'WEMA_ACCOUNT_LINKED', 'This Wema account is already connected to REKO. Sign in instead.');
  const names = (verified.account_name || 'Wema Customer').split(/\s+/);
  const { data, error } = await supabasePublic.auth.signUp({
    email: input.email, password: input.password,
    options: { data: { role: input.role, firstName: names[0], lastName: names.slice(1).join(' ') || 'Customer', phone: input.phone, businessName: input.businessName, onboardingSource: 'wema-existing' } },
  });
  if (error) throw new ApiError(error.status || 400, 'SIGNUP_FAILED', error.message);
  assertSupabase(await supabaseAdmin.from('profiles').update({ wema_account_hash: verified.account_hash, wema_account_last4: verified.account_last4, wema_account_status: 'verified' }).eq('id', data.user.id));
  assertSupabase(await supabaseAdmin.from('wallets').update({ provider: 'wema', provider_account_last4: verified.account_last4 }).eq('user_id', data.user.id));
  response.status(201).json({ success: true, data: await accountPayload(data.user.id, data.user, data.session) });
}));

router.post('/alat/apply', validate(z.object({
  role, firstName: z.string().min(2).max(80), lastName: z.string().min(2).max(80), email,
  phone: z.string().min(7).max(24), dateOfBirth: z.string().date(), bvn: z.string().regex(/^\d{11}$/), nin: z.string().regex(/^\d{11}$/),
  address: z.object({ label: z.string().min(5), latitude: z.number().min(-90).max(90).optional(), longitude: z.number().min(-180).max(180).optional() }),
  password, businessName: z.string().min(2).max(120).optional(), consent: z.literal(true),
})), asyncRoute(async (request, response) => {
  const input = request.validated.body;
  const alat = await createMockAlatAccount();
  const { data, error } = await supabasePublic.auth.signUp({
    email: input.email, password: input.password,
    options: { data: { role: input.role, firstName: input.firstName, lastName: input.lastName, phone: input.phone, businessName: input.businessName, onboardingSource: 'alat-new' } },
  });
  if (error) throw new ApiError(error.status || 400, 'ALAT_SIGNUP_FAILED', error.message);
  assertSupabase(await supabaseAdmin.from('profiles').update({
    address: input.address, identity_summary: { bvnLast4: input.bvn.slice(-4), ninLast4: input.nin.slice(-4), verified: true, dateOfBirth: input.dateOfBirth },
    wema_account_hash: alat.accountHash, wema_account_last4: alat.accountLast4, wema_account_status: alat.status,
  }).eq('id', data.user.id));
  assertSupabase(await supabaseAdmin.from('wallets').update({ provider: 'wema', provider_account_last4: alat.accountLast4 }).eq('user_id', data.user.id));
  response.status(201).json({ success: true, data: await accountPayload(data.user.id, data.user, data.session) });
}));

export default router;
