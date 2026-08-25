import { createHash } from 'node:crypto';
import { config } from '../config.js';
import { supabaseAdmin, assertSupabase } from '../supabase.js';
import { ApiError } from '../middleware/errors.js';

export const hashAccountNumber = (accountNumber) => createHash('sha256').update(accountNumber).digest('hex');

function requireMockOrConfigured() {
  if (config.wema.mode === 'mock') return;
  if (!config.wema.baseUrl || !config.wema.clientId || !config.wema.clientSecret) throw new ApiError(503, 'WEMA_NOT_CONFIGURED', 'Live Wema credentials are not configured.');
}

export async function lookupWemaAccount(accountNumber) {
  requireMockOrConfigured();
  if (config.wema.mode !== 'mock') throw new ApiError(501, 'WEMA_ADAPTER_REQUIRED', 'Implement live Wema account lookup in src/services/wema.js.');
  const expiresAt = new Date(Date.now() + 10 * 60_000).toISOString();
  const result = await supabaseAdmin.from('wema_onboarding_sessions').insert({
    account_hash: hashAccountNumber(accountNumber), account_last4: accountNumber.slice(-4),
    account_name: accountNumber === '0123456789' ? 'ADE USER' : 'REKO CUSTOMER', masked_phone: '******4821', expires_at: expiresAt,
  }).select('id,account_name,masked_phone,expires_at').single();
  const data = assertSupabase(result);
  return { challengeId: data.id, accountName: data.account_name, maskedPhone: data.masked_phone, expiresAt: data.expires_at };
}

export async function verifyWemaChallenge(challengeId, otp) {
  requireMockOrConfigured();
  if (config.wema.mode !== 'mock') throw new ApiError(501, 'WEMA_ADAPTER_REQUIRED', 'Implement live Wema OTP verification in src/services/wema.js.');
  const session = assertSupabase(await supabaseAdmin.from('wema_onboarding_sessions').select('*').eq('id', challengeId).single());
  if (session.status !== 'pending') throw new ApiError(409, 'CHALLENGE_USED', 'This verification request is no longer pending.');
  if (new Date(session.expires_at) < new Date()) {
    await supabaseAdmin.from('wema_onboarding_sessions').update({ status: 'expired' }).eq('id', challengeId);
    throw new ApiError(410, 'CHALLENGE_EXPIRED', 'The verification code has expired.');
  }
  if (!/^\d{6}$/.test(otp)) throw new ApiError(422, 'INVALID_OTP', 'Enter a valid six-digit code.');
  assertSupabase(await supabaseAdmin.from('wema_onboarding_sessions').update({ status: 'verified', verified_at: new Date().toISOString() }).eq('id', challengeId));
  return session;
}

export async function createMockAlatAccount() {
  requireMockOrConfigured();
  if (config.wema.mode !== 'mock') throw new ApiError(501, 'WEMA_ADAPTER_REQUIRED', 'Implement live ALAT account opening in src/services/wema.js.');
  const accountNumber = String(Math.floor(1_000_000_000 + Math.random() * 900_000_000));
  return { accountNumber, accountHash: hashAccountNumber(accountNumber), accountLast4: accountNumber.slice(-4), bankName: 'Wema Bank', product: 'ALAT Savings', status: 'active' };
}
