import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { USER_ROLES } from './config.js';
import { hashPassword } from './crypto.js';

const { Pool } = pg;

const demoUsers = (passwordHash) => [
  { id: '00000000-0000-4000-8000-000000000001', name: 'TKMBS Kullanıcısı', email: 'kullanici@tkmbs.local', role: USER_ROLES.CITIZEN, passwordHash, active: true },
  { id: '00000000-0000-4000-8000-000000000002', name: 'İçerik Editörü', email: 'editor@tkmbs.local', role: USER_ROLES.EDITOR, passwordHash, active: true },
  { id: '00000000-0000-4000-8000-000000000003', name: 'Sistem Yöneticisi', email: 'admin@tkmbs.local', role: USER_ROLES.ADMIN, passwordHash, active: true },
];

const mapUserRow = (row) => row && ({
  id: row.id,
  name: row.name,
  email: row.email,
  role: row.role,
  passwordHash: row.password_hash,
  active: row.active,
});

const mapSessionRow = (row) => row && ({
  id: row.id,
  userId: row.user_id,
  tokenHash: row.token_hash,
  createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  expiresAt: row.expires_at instanceof Date ? row.expires_at.toISOString() : row.expires_at,
  revokedAt: row.revoked_at instanceof Date ? row.revoked_at.toISOString() : row.revoked_at,
  replacedById: row.replaced_by_id,
});

export async function createInMemoryAuthRepository() {
  const demoPassword = process.env.DEMO_USER_PASSWORD || 'Belediye2026!';
  const passwordHash = await hashPassword(demoPassword);
  const users = demoUsers(passwordHash);
  const sessions = new Map();
  const notificationReads = new Map();

  return {
    kind: 'in-memory-demo',
    async findUserByEmail(email) {
      return users.find((user) => user.email === email) || null;
    },
    async findUserById(id) {
      return users.find((user) => user.id === String(id)) || null;
    },
    async createSession(data) {
      const session = { id: randomUUID(), ...data, createdAt: new Date().toISOString(), revokedAt: null, replacedById: null };
      sessions.set(session.tokenHash, session);
      return { ...session };
    },
    async findSessionByTokenHash(tokenHash) {
      const session = sessions.get(tokenHash);
      return session ? { ...session } : null;
    },
    async revokeSession(tokenHash, replacementId = null) {
      const session = sessions.get(tokenHash);
      if (!session) return null;
      session.revokedAt = new Date().toISOString();
      session.replacedById = replacementId;
      return { ...session };
    },
    async revokeUserSessions(userId) {
      sessions.forEach((session) => {
        if (session.userId === String(userId) && !session.revokedAt) session.revokedAt = new Date().toISOString();
      });
    },
    async listNotificationReadIds(userId) {
      return [...(notificationReads.get(String(userId)) || new Set())];
    },
    async markNotificationRead(userId, notificationId) {
      const key = String(userId);
      const reads = notificationReads.get(key) || new Set();
      reads.add(Number(notificationId));
      notificationReads.set(key, reads);
    },
    async markAllNotificationsRead(userId, notificationIds) {
      const key = String(userId);
      const reads = notificationReads.get(key) || new Set();
      notificationIds.forEach((id) => reads.add(Number(id)));
      notificationReads.set(key, reads);
    },
  };
}

export async function createPostgresAuthRepository(connectionString) {
  const pool = new Pool({
    connectionString,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  });

  await pool.query('SELECT 1');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tkmbs_portal_users (
      id uuid PRIMARY KEY,
      name text NOT NULL,
      email text NOT NULL UNIQUE,
      role varchar(20) NOT NULL CHECK (role IN ('citizen', 'editor', 'admin')),
      password_hash text NOT NULL,
      active boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS tkmbs_auth_refresh_sessions (
      id uuid PRIMARY KEY,
      user_id uuid NOT NULL REFERENCES tkmbs_portal_users(id) ON DELETE CASCADE,
      token_hash char(64) NOT NULL UNIQUE,
      created_at timestamptz NOT NULL DEFAULT now(),
      expires_at timestamptz NOT NULL,
      revoked_at timestamptz,
      replaced_by_id uuid
    );
    CREATE INDEX IF NOT EXISTS tkmbs_auth_sessions_user_id_idx ON tkmbs_auth_refresh_sessions(user_id);
    CREATE INDEX IF NOT EXISTS tkmbs_auth_sessions_expires_at_idx ON tkmbs_auth_refresh_sessions(expires_at);
    CREATE TABLE IF NOT EXISTS tkmbs_user_notification_reads (
      user_id uuid NOT NULL REFERENCES tkmbs_portal_users(id) ON DELETE CASCADE,
      notification_id integer NOT NULL,
      read_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (user_id, notification_id)
    );
  `);

  if (process.env.AUTH_SEED_DEMO_USERS !== 'false') {
    const passwordHash = await hashPassword(process.env.DEMO_USER_PASSWORD || 'Belediye2026!');
    for (const user of demoUsers(passwordHash)) {
      await pool.query(
        `INSERT INTO tkmbs_portal_users (id, name, email, role, password_hash, active)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (email) DO NOTHING`,
        [user.id, user.name, user.email, user.role, user.passwordHash, user.active],
      );
    }
  }

  return {
    kind: 'postgresql',
    async findUserByEmail(email) {
      const result = await pool.query('SELECT * FROM tkmbs_portal_users WHERE lower(email) = lower($1) LIMIT 1', [email]);
      return mapUserRow(result.rows[0]);
    },
    async findUserById(id) {
      const result = await pool.query('SELECT * FROM tkmbs_portal_users WHERE id = $1 LIMIT 1', [id]);
      return mapUserRow(result.rows[0]);
    },
    async createSession(data) {
      const id = randomUUID();
      const result = await pool.query(
        `INSERT INTO tkmbs_auth_refresh_sessions (id, user_id, token_hash, expires_at)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [id, data.userId, data.tokenHash, data.expiresAt],
      );
      return mapSessionRow(result.rows[0]);
    },
    async findSessionByTokenHash(tokenHash) {
      const result = await pool.query('SELECT * FROM tkmbs_auth_refresh_sessions WHERE token_hash = $1 LIMIT 1', [tokenHash]);
      return mapSessionRow(result.rows[0]);
    },
    async revokeSession(tokenHash, replacementId = null) {
      const result = await pool.query(
        `UPDATE tkmbs_auth_refresh_sessions
         SET revoked_at = COALESCE(revoked_at, now()), replaced_by_id = COALESCE($2, replaced_by_id)
         WHERE token_hash = $1 RETURNING *`,
        [tokenHash, replacementId],
      );
      return mapSessionRow(result.rows[0]);
    },
    async revokeUserSessions(userId) {
      await pool.query('UPDATE tkmbs_auth_refresh_sessions SET revoked_at = COALESCE(revoked_at, now()) WHERE user_id = $1', [userId]);
    },
    async listNotificationReadIds(userId) {
      const result = await pool.query('SELECT notification_id FROM tkmbs_user_notification_reads WHERE user_id = $1', [userId]);
      return result.rows.map((row) => Number(row.notification_id));
    },
    async markNotificationRead(userId, notificationId) {
      await pool.query(
        `INSERT INTO tkmbs_user_notification_reads (user_id, notification_id)
         VALUES ($1, $2) ON CONFLICT (user_id, notification_id) DO NOTHING`,
        [userId, notificationId],
      );
    },
    async markAllNotificationsRead(userId, notificationIds) {
      if (!notificationIds.length) return;
      await pool.query(
        `INSERT INTO tkmbs_user_notification_reads (user_id, notification_id)
         SELECT $1, unnest($2::integer[]) ON CONFLICT (user_id, notification_id) DO NOTHING`,
        [userId, notificationIds],
      );
    },
    async close() {
      await pool.end();
    },
  };
}

export async function createAuthRepository() {
  if (process.env.DATABASE_URL) {
    try {
      return await createPostgresAuthRepository(process.env.DATABASE_URL);
    } catch (error) {
      if (process.env.NODE_ENV === 'production' || process.env.AUTH_REQUIRE_DATABASE === 'true') throw error;
      console.warn(`PostgreSQL kimlik deposuna bağlanılamadı, yerel yedek kullanılacak: ${error.message}`);
    }
  }
  return createInMemoryAuthRepository();
}
