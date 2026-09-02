import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';
import QRCode from 'qrcode';
import {
  AUTH_ISSUER,
  TWO_FACTOR_CHALLENGE_TTL_SECONDS,
  TWO_FACTOR_PROOF_TTL_SECONDS,
  getTwoFactorSecret,
} from './config.js';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const encodeJson = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
const decodeJson = (value) => JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));

function signPayload(payload) {
  const encoded = encodeJson(payload);
  const signature = createHmac('sha256', getTwoFactorSecret()).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
}

function verifySignedPayload(token, expectedType, nowSeconds = Math.floor(Date.now() / 1000)) {
  const [encoded, signature, extra] = String(token || '').split('.');
  if (!encoded || !signature || extra) throw new Error('Doğrulama isteği geçersiz.');
  const actual = Buffer.from(signature, 'base64url');
  const expected = createHmac('sha256', getTwoFactorSecret()).update(encoded).digest();
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new Error('Doğrulama isteği geçersiz.');
  const payload = decodeJson(encoded);
  if (payload.type !== expectedType || payload.iss !== AUTH_ISSUER || !Number.isInteger(payload.exp) || payload.exp <= nowSeconds) {
    throw new Error('Doğrulama isteğinin süresi dolmuş. Lütfen yeniden giriş yapın.');
  }
  return payload;
}

export function createTwoFactorChallenge(user, purpose, nowSeconds = Math.floor(Date.now() / 1000)) {
  return signPayload({
    type: 'two-factor-challenge',
    purpose,
    sub: String(user.id),
    email: user.email,
    role: user.role,
    iss: AUTH_ISSUER,
    iat: nowSeconds,
    exp: nowSeconds + TWO_FACTOR_CHALLENGE_TTL_SECONDS,
    jti: randomBytes(12).toString('hex'),
  });
}

export function verifyTwoFactorChallenge(token, nowSeconds = Math.floor(Date.now() / 1000)) {
  return verifySignedPayload(token, 'two-factor-challenge', nowSeconds);
}

export function createCmsTwoFactorProof(user, nowSeconds = Math.floor(Date.now() / 1000)) {
  return signPayload({
    type: 'cms-two-factor-proof',
    sub: String(user.id),
    email: user.email,
    role: user.role,
    iss: AUTH_ISSUER,
    iat: nowSeconds,
    exp: nowSeconds + TWO_FACTOR_PROOF_TTL_SECONDS,
    jti: randomBytes(12).toString('hex'),
  });
}

export function createBase32Secret(byteLength = 20) {
  const bytes = randomBytes(byteLength);
  let bits = '';
  for (const byte of bytes) bits += byte.toString(2).padStart(8, '0');
  let output = '';
  for (let index = 0; index < bits.length; index += 5) {
    output += BASE32_ALPHABET[Number.parseInt(bits.slice(index, index + 5).padEnd(5, '0'), 2)];
  }
  return output;
}

function decodeBase32(value) {
  const normalized = String(value || '').toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = '';
  for (const character of normalized) {
    const index = BASE32_ALPHABET.indexOf(character);
    if (index < 0) throw new Error('İki adımlı doğrulama anahtarı geçersiz.');
    bits += index.toString(2).padStart(5, '0');
  }
  const bytes = [];
  for (let index = 0; index + 8 <= bits.length; index += 8) bytes.push(Number.parseInt(bits.slice(index, index + 8), 2));
  return Buffer.from(bytes);
}

export function generateTotp(secret, step = Math.floor(Date.now() / 1000 / 30)) {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const digest = createHmac('sha1', decodeBase32(secret)).update(counter).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary = (digest.readUInt32BE(offset) & 0x7fffffff) % 1_000_000;
  return String(binary).padStart(6, '0');
}

export function verifyTotp(secret, code, nowMs = Date.now(), window = 1) {
  const normalized = String(code || '').replace(/\s/g, '');
  if (!/^\d{6}$/.test(normalized)) return null;
  const currentStep = Math.floor(nowMs / 1000 / 30);
  for (let offset = -window; offset <= window; offset += 1) {
    const step = currentStep + offset;
    const expected = Buffer.from(generateTotp(secret, step));
    const actual = Buffer.from(normalized);
    if (actual.length === expected.length && timingSafeEqual(actual, expected)) return step;
  }
  return null;
}

function encryptionKey() {
  return createHash('sha256').update(getTwoFactorSecret()).digest();
}

export function encryptTwoFactorSecret(secret) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
  return ['v1', iv.toString('base64url'), cipher.getAuthTag().toString('base64url'), encrypted.toString('base64url')].join('.');
}

export function decryptTwoFactorSecret(value) {
  const [version, iv, tag, encrypted] = String(value || '').split('.');
  if (version !== 'v1' || !iv || !tag || !encrypted) throw new Error('İki adımlı doğrulama anahtarı okunamadı.');
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(iv, 'base64url'));
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(encrypted, 'base64url')), decipher.final()]).toString('utf8');
}

export function buildAuthenticatorUri({ secret, email }) {
  const issuer = 'Hatay TKMBS';
  const label = `${issuer}:${email}`;
  return `otpauth://totp/${encodeURIComponent(label)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

export async function buildTwoFactorSetup(secret, email) {
  const uri = buildAuthenticatorUri({ secret, email });
  return {
    qrCodeDataUrl: await QRCode.toDataURL(uri, { width: 240, margin: 1, errorCorrectionLevel: 'M' }),
    manualKey: secret.match(/.{1,4}/g)?.join(' ') || secret,
  };
}

const RECOVERY_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function createRecoveryCodes(count = 8) {
  return Array.from({ length: count }, () => {
    const bytes = randomBytes(8);
    let code = '';
    for (let index = 0; index < 8; index += 1) code += RECOVERY_ALPHABET[bytes[index] % RECOVERY_ALPHABET.length];
    return `${code.slice(0, 4)}-${code.slice(4)}`;
  });
}

export function normalizeRecoveryCode(value) {
  const normalized = String(value || '').toUpperCase().replace(/[^A-Z2-9]/g, '');
  return normalized.length === 8 ? `${normalized.slice(0, 4)}-${normalized.slice(4)}` : '';
}

export function hashRecoveryCode(code) {
  return createHmac('sha256', getTwoFactorSecret()).update(normalizeRecoveryCode(code)).digest('hex');
}
