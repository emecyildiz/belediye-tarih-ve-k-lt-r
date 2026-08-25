import { AUTHORIZED_ROLES } from './config.js';
import { mapAuthUserDto } from './dto.js';
import { verifyAccessToken } from './crypto.js';

const unauthorized = (res, message = 'Bu işlem için giriş yapmalısınız.') => res.status(401).json({ success: false, error: message });

export function authenticateAccessToken(req, res, next) {
  const [scheme, token] = String(req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) return unauthorized(res);
  try {
    const claims = verifyAccessToken(token);
    req.auth = { claims, user: mapAuthUserDto({ id: claims.sub, name: claims.name, email: claims.email, role: claims.role }) };
    return next();
  } catch (error) {
    return unauthorized(res, error.message);
  }
}

export function authorizeRoles(...roles) {
  const allowed = roles.filter((role) => AUTHORIZED_ROLES.includes(role));
  return (req, res, next) => {
    if (!req.auth?.user) return unauthorized(res);
    if (!allowed.includes(req.auth.user.role)) return res.status(403).json({ success: false, error: 'Bu işlem için yetkiniz bulunmuyor.' });
    return next();
  };
}

export function parseCookieHeader(header = '') {
  return Object.fromEntries(String(header).split(';').map((item) => item.trim()).filter(Boolean).map((item) => {
    const separator = item.indexOf('=');
    return separator < 0 ? [item, ''] : [item.slice(0, separator), decodeURIComponent(item.slice(separator + 1))];
  }));
}

export function serializeCookie(name, value, options = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  if (options.maxAge != null) parts.push(`Max-Age=${Math.max(0, Number(options.maxAge))}`);
  if (options.path) parts.push(`Path=${options.path}`);
  if (options.httpOnly) parts.push('HttpOnly');
  if (options.secure) parts.push('Secure');
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
  return parts.join('; ');
}
