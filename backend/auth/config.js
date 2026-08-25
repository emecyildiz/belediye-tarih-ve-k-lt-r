export const ACCESS_TOKEN_TTL_SECONDS = 2 * 60;
export const REFRESH_TOKEN_TTL_SECONDS = 14 * 24 * 60 * 60;
export const REFRESH_COOKIE_NAME = 'tkmbs_refresh';
export const AUTH_ISSUER = 'tkmbs-api';
export const AUTH_AUDIENCE = 'tkmbs-portal';

export const USER_ROLES = Object.freeze({
  CITIZEN: 'citizen',
  EDITOR: 'editor',
  ADMIN: 'admin',
});

export const AUTHORIZED_ROLES = Object.freeze(Object.values(USER_ROLES));

export function getAuthSecret() {
  const secret = process.env.AUTH_ACCESS_SECRET || process.env.PAYLOAD_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('AUTH_ACCESS_SECRET production ortamında zorunludur.');
  }
  return 'tkmbs-local-development-secret-change-before-production';
}

export function refreshCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'Lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/api/auth',
    maxAge: REFRESH_TOKEN_TTL_SECONDS,
  };
}
