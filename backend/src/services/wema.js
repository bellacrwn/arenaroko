import { config } from '../config.js';
import { store } from '../db/store.js';
import { id, mockAccountNumber } from '../lib/ids.js';
import { ApiError } from '../middleware/errors.js';

function requireMockOrConfigured() {
  if (config.wema.mode === 'mock') return;
  if (!config.wema.baseUrl || !config.wema.clientId || !config.wema.clientSecret) {
    throw new ApiError(503, 'WEMA_NOT_CONFIGURED', 'Live Wema integration credentials are not configured.');
  }
}

export async function lookupWemaAccount(accountNumber) {
  requireMockOrConfigured();
  if (config.wema.mode !== 'mock') {
    throw new ApiError(501, 'WEMA_ADAPTER_REQUIRED', 'Implement the live lookup in src/services/wema.js using Wema’s approved API contract.');
  }
  return store.transaction((database) => {
    const challenge = {
      id: id(),
      accountNumber,
      accountName: accountNumber === '0123456789' ? 'ADE USER' : 'REKO CUSTOMER',
      maskedPhone: '******4821',
      status: 'pending',
      expiresAt: new Date(Date.now() + 10 * 60_000).toISOString(),
      createdAt: new Date().toISOString(),
    };
    database.wemaChallenges.push(challenge);
    return { challengeId: challenge.id, accountName: challenge.accountName, maskedPhone: challenge.maskedPhone, expiresAt: challenge.expiresAt };
  });
}

export async function verifyWemaChallenge(challengeId, otp) {
  requireMockOrConfigured();
  if (config.wema.mode !== 'mock') {
    throw new ApiError(501, 'WEMA_ADAPTER_REQUIRED', 'Implement live OTP verification in src/services/wema.js.');
  }
  return store.transaction((database) => {
    const challenge = database.wemaChallenges.find((item) => item.id === challengeId);
    if (!challenge || challenge.status !== 'pending') throw new ApiError(404, 'CHALLENGE_NOT_FOUND', 'The Wema verification request was not found.');
    if (new Date(challenge.expiresAt) < new Date()) throw new ApiError(410, 'CHALLENGE_EXPIRED', 'The verification code has expired.');
    if (!/^\d{6}$/.test(otp)) throw new ApiError(422, 'INVALID_OTP', 'Enter a valid six-digit verification code.');
    challenge.status = 'verified';
    challenge.verifiedAt = new Date().toISOString();
    return { accountNumber: challenge.accountNumber, accountName: challenge.accountName };
  });
}

export async function createMockAlatAccount() {
  requireMockOrConfigured();
  if (config.wema.mode !== 'mock') {
    throw new ApiError(501, 'WEMA_ADAPTER_REQUIRED', 'Implement live ALAT account opening in src/services/wema.js.');
  }
  return { accountNumber: mockAccountNumber(), bankName: 'Wema Bank', product: 'ALAT Savings', status: 'active' };
}
