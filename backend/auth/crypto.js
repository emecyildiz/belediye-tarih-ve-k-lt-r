import { createHash, createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { ACCESS_TOKEN_TTL_SECONDS, AUTH_AUDIENCE, AUTH_ISSUER, getAuthSecret } from './config.js';

const scrypt = promisify(scryptCallback);
const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
const decode = (value) => JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));

export async function hashPassword(password) {
  const salt = randomBytes(16).toString('base64url');
  const derived = await scrypt(password, salt, 64);
  return `scrypt$${salt}$${Buffer.from(derived).toString('base64url')}`;
}

export async function verifyPassword(password, storedHash = '') {
  const [algorithm, salt, expected] = storedHash.split('$');
  if (algorithm !== 'scrypt' || !salt || !expected) return false;
  const derived = Buffer.from(await scrypt(password, salt, 64));
  const expectedBuffer = Buffer.from(expected, 'base64url');
  return derived.length === expectedBuffer.length && timingSafeEqual(derived, expectedBuffer);
}

export function hashRefreshToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

export function createOpaqueRefreshToken() {
  return randomBytes(48).toString('base64url');
}

export function signAccessToken(user, nowSeconds = Math.floor(Date.now() / 1000)) {
  const header = encode({ alg: 'HS256', typ: 'JWT' });
  const payload = encode({
    sub: String(user.id),
    name: user.name,
    email: user.email,
    role: user.role,
    type: 'access',
    iss: AUTH_ISSUER,
    aud: AUTH_AUDIENCE,
    iat: nowSeconds,
    exp: nowSeconds + ACCESS_TOKEN_TTL_SECONDS,
    jti: randomBytes(12).toString('hex'),
  });
  const signature = createHmac('sha256', getAuthSecret()).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
}

export function verifyAccessToken(token, nowSeconds = Math.floor(Date.now() / 1000)) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) throw new Error('Geçersiz access token.');
  const [headerPart, payloadPart, signaturePart] = parts;
  const header = decode(headerPart);
  const payload = decode(payloadPart);
  if (header.alg !== 'HS256' || header.typ !== 'JWT') throw new Error('Desteklenmeyen token.');
  const actual = Buffer.from(signaturePart, 'base64url');
  const expected = createHmac('sha256', getAuthSecret()).update(`${headerPart}.${payloadPart}`).digest();
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new Error('Token imzası geçersiz.');
  if (payload.type !== 'access' || payload.iss !== AUTH_ISSUER || payload.aud !== AUTH_AUDIENCE) throw new Error('Token kapsamı geçersiz.');
  if (!Number.isInteger(payload.exp) || payload.exp <= nowSeconds) throw new Error('Access token süresi dolmuş.');
  return payload;
}
