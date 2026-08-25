import { supabaseAdmin, userSupabase } from '../supabase.js';
import { ApiError } from './errors.js';

export async function authenticate(request, response, next) {
  try {
    const value = request.headers.authorization || '';
    const [scheme, token] = value.split(' ');
    if (scheme !== 'Bearer' || !token) throw new ApiError(401, 'AUTH_REQUIRED', 'A Bearer Supabase access token is required.');
    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !authData.user) throw new ApiError(401, 'INVALID_TOKEN', 'The access token is invalid or expired.');
    const { data: profile, error: profileError } = await supabaseAdmin.from('profiles').select('*').eq('id', authData.user.id).single();
    if (profileError || !profile?.active) throw new ApiError(401, 'INVALID_SESSION', 'This account is not active or its profile is unavailable.');
    request.auth = { user: { ...profile, email: authData.user.email }, authUser: authData.user, accessToken: token };
    request.supabase = userSupabase(token);
    next();
  } catch (error) {
    next(error instanceof ApiError ? error : new ApiError(401, 'INVALID_TOKEN', 'The access token is invalid or expired.'));
  }
}

export const allowRoles = (...roles) => (request, response, next) => {
  if (!request.auth || !roles.includes(request.auth.user.role)) return next(new ApiError(403, 'FORBIDDEN', 'Your account cannot perform this action.'));
  next();
};
