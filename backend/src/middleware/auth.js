import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { store } from '../db/store.js';
import { ApiError } from './errors.js';
import { publicUser } from '../lib/entities.js';

export function issueToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

export async function authenticate(request, response, next) {
  try {
    const value = request.headers.authorization || '';
    const [scheme, token] = value.split(' ');
    if (scheme !== 'Bearer' || !token) throw new ApiError(401, 'AUTH_REQUIRED', 'A Bearer access token is required.');
    const payload = jwt.verify(token, config.jwtSecret);
    const database = await store.snapshot();
    const user = database.users.find((item) => item.id === payload.sub && item.active !== false);
    if (!user) throw new ApiError(401, 'INVALID_SESSION', 'This account or session is no longer valid.');
    request.auth = { user: publicUser(user), tokenPayload: payload };
    next();
  } catch (error) {
    if (error instanceof ApiError) return next(error);
    return next(new ApiError(401, 'INVALID_TOKEN', 'The access token is invalid or expired.'));
  }
}

export const allowRoles = (...roles) => (request, response, next) => {
  if (!request.auth || !roles.includes(request.auth.user.role)) {
    return next(new ApiError(403, 'FORBIDDEN', 'Your account cannot perform this action.'));
  }
  return next();
};
