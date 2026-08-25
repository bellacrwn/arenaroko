import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';
import { config, validateConfig } from './config.js';

validateConfig();

const options = {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  realtime: { transport: WebSocket },
};

export const supabaseAdmin = createClient(config.supabase.url, config.supabase.serviceRoleKey, options);
export const supabasePublic = createClient(config.supabase.url, config.supabase.anonKey, options);

export function userSupabase(accessToken) {
  return createClient(config.supabase.url, config.supabase.anonKey, {
    ...options,
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

export function assertSupabase(result, fallback = 'Supabase request failed.') {
  if (result.error) {
    const error = new Error(result.error.message || fallback);
    error.code = result.error.code || 'SUPABASE_ERROR';
    error.status = result.error.status || 500;
    error.details = result.error.details || result.error.hint;
    throw error;
  }
  return result.data;
}

export function assertRpc(result, statusByMessage = {}) {
  if (!result.error) return result.data;
  const matched = Object.keys(statusByMessage).find((key) => result.error.message?.includes(key));
  if (matched) {
    const error = new Error(matched.replaceAll('_', ' ').toLowerCase());
    error.code = matched;
    error.status = statusByMessage[matched];
    throw error;
  }
  return assertSupabase(result);
}
