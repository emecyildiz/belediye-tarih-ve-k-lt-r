export const ACCESS_TOKEN_TTL_SECONDS = 2 * 60;
export const REFRESH_TOKEN_TTL_SECONDS = 14 * 24 * 60 * 60;
export const REFRESH_COOKIE_NAME = 'tkmbs_refresh';
export const AUTH_ISSUER = 'tkmbs-api';
export const AUTH_AUDIENCE = 'tkmbs-portal';
export const TWO_FACTOR_CHALLENGE_TTL_SECONDS = 5 * 60;
export const TWO_FACTOR_PROOF_TTL_SECONDS = 60;
export const TWO_FACTOR_MAX_ATTEMPTS = 5;
export const TWO_FACTOR_LOCK_SECONDS = 5 * 60;

export const USER_ROLES = Object.freeze({
  CITIZEN: 'citizen',
  EDITOR: 'editor',
  ADMIN: 'admin',
});

export const AUTHORIZED_ROLES = Object.freeze(Object.values(USER_ROLES));

export function getAuthSecret() {
  const secret = process.env.AUTH_ACCESS_SECRET;
  if (secret && secret.length >= 32) return secret;
  if (process.env.NODE_ENV === 'production') throw new Error('En az 32 karakterli AUTH_ACCESS_SECRET zorunludur.');
  return secret || 'tkmbs-local-development-secret-change-before-production';
}

export function getTwoFactorSecret() {
  const secret = process.env.TWO_FACTOR_SECRET;
  if (secret && secret.length >= 32) return secret;
  if (process.env.NODE_ENV === 'production') throw new Error('En az 32 karakterli ve ayrı bir TWO_FACTOR_SECRET zorunludur.');
  return secret || 'tkmbs-local-two-factor-secret-change-before-production';
}

export function isTwoFactorRequiredForRole(role) {
  const configured = String(process.env.TWO_FACTOR_REQUIRED_ROLES || 'admin,editor')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  return configured.includes(role);
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
