import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config({ path: ['.env', 'cms/.env'] });

const { Pool } = pg;
const oldSecret = process.env.PAYLOAD_SECRET;
const newSecret = process.env.TWO_FACTOR_SECRET;

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL tanımlı değil.');
if (!oldSecret) throw new Error('Eski kayıtları açmak için PAYLOAD_SECRET tanımlı değil.');
if (!newSecret || newSecret.length < 32) throw new Error('En az 32 karakterli TWO_FACTOR_SECRET tanımlı değil.');
if (oldSecret === newSecret) throw new Error('TWO_FACTOR_SECRET, PAYLOAD_SECRET değerinden farklı olmalıdır.');

const keyFrom = (secret) => createHash('sha256').update(secret).digest();

function decrypt(value, secret) {
  const [version, iv, tag, encrypted] = String(value || '').split('.');
  if (version !== 'v1' || !iv || !tag || !encrypted) throw new Error('Şifreli 2FA kaydı geçersiz.');
  const decipher = createDecipheriv('aes-256-gcm', keyFrom(secret), Buffer.from(iv, 'base64url'));
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(encrypted, 'base64url')), decipher.final()]).toString('utf8');
}

function encrypt(value, secret) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', keyFrom(secret), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return ['v1', iv.toString('base64url'), cipher.getAuthTag().toString('base64url'), encrypted.toString('base64url')].join('.');
}

function migrateValue(value) {
  if (!value) return { value: null, changed: false };
  try {
    decrypt(value, newSecret);
    return { value, changed: false };
  } catch {
    return { value: encrypt(decrypt(value, oldSecret), newSecret), changed: true };
  }
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();
let migrated = 0;

try {
  await client.query('BEGIN');
  const result = await client.query(`
    SELECT id, two_factor_secret, two_factor_pending_secret
    FROM tkmbs_portal_users
    WHERE two_factor_secret IS NOT NULL OR two_factor_pending_secret IS NOT NULL
    FOR UPDATE
  `);

  for (const row of result.rows) {
    const active = migrateValue(row.two_factor_secret);
    const pending = migrateValue(row.two_factor_pending_secret);
    if (!active.changed && !pending.changed) continue;
    await client.query(
      `UPDATE tkmbs_portal_users
       SET two_factor_secret = $2,
           two_factor_pending_secret = $3,
           two_factor_recovery_codes = '[]'::jsonb
       WHERE id = $1`,
      [row.id, active.value, pending.value],
    );
    migrated += 1;
  }

  await client.query('COMMIT');
  console.log(`${migrated} kullanıcının 2FA kaydı yeni anahtara taşındı.`);
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
  await pool.end();
}
