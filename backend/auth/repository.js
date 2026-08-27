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
  const analyticsEvents = new Map();
  const favorites = new Map([
    ['00000000-0000-4000-8000-000000000001', { monument: new Set([1, 2, 4, 9, 13]), route: new Set([2, 3, 4, 5, 6]), event: new Set([1, 3]) }],
  ]);

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
    async listFavorites(userId) {
      const userFavorites = favorites.get(String(userId)) || {};
      return Object.fromEntries(['monument', 'route', 'event'].map((type) => [type, [...(userFavorites[type] || new Set())]]));
    },
    async toggleFavorite(userId, type, itemId) {
      const key = String(userId);
      const userFavorites = favorites.get(key) || { monument: new Set(), route: new Set(), event: new Set() };
      const ids = userFavorites[type] || new Set();
      const numericId = Number(itemId);
      const favorited = !ids.has(numericId);
      if (favorited) ids.add(numericId); else ids.delete(numericId);
      userFavorites[type] = ids;
      favorites.set(key, userFavorites);
      return { type, id: numericId, favorited, ids: [...ids] };
    },
    async recordAnalyticsEvent(event) {
      if (!analyticsEvents.has(event.dedupeKey)) analyticsEvents.set(event.dedupeKey, { ...event });
      return { recorded: true };
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
    CREATE TABLE IF NOT EXISTS tkmbs_user_favorites (
      user_id uuid NOT NULL REFERENCES tkmbs_portal_users(id) ON DELETE CASCADE,
      item_type varchar(20) NOT NULL CHECK (item_type IN ('monument', 'route', 'event')),
      item_id integer NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (user_id, item_type, item_id)
    );
    CREATE INDEX IF NOT EXISTS tkmbs_user_favorites_user_type_idx ON tkmbs_user_favorites(user_id, item_type);
    CREATE TABLE IF NOT EXISTS tkmbs_analytics_events (
      id uuid PRIMARY KEY,
      event_type varchar(32) NOT NULL CHECK (event_type IN ('page_view')),
      visitor_id uuid NOT NULL,
      session_id uuid NOT NULL,
      path varchar(240) NOT NULL,
      content_type varchar(20) CHECK (content_type IN ('monument', 'route', 'event')),
      content_slug varchar(160),
      dedupe_key char(64),
      occurred_at timestamptz NOT NULL DEFAULT now(),
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS tkmbs_analytics_events_occurred_at_idx ON tkmbs_analytics_events(occurred_at DESC);
    CREATE INDEX IF NOT EXISTS tkmbs_analytics_events_path_idx ON tkmbs_analytics_events(path);
    CREATE INDEX IF NOT EXISTS tkmbs_analytics_events_visitor_idx ON tkmbs_analytics_events(visitor_id, occurred_at DESC);
    CREATE UNIQUE INDEX IF NOT EXISTS tkmbs_analytics_events_dedupe_idx ON tkmbs_analytics_events(dedupe_key) WHERE dedupe_key IS NOT NULL;
    CREATE TABLE IF NOT EXISTS tkmbs_portal_seed_state (
      seed_key text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
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
    const seedClient = await pool.connect();
    try {
      await seedClient.query('BEGIN');
      const seedResult = await seedClient.query(
        `INSERT INTO tkmbs_portal_seed_state (seed_key) VALUES ('citizen-demo-favorites-v2')
         ON CONFLICT (seed_key) DO NOTHING RETURNING seed_key`,
      );
      if (seedResult.rowCount) {
        await seedClient.query(
          `INSERT INTO tkmbs_user_favorites (user_id, item_type, item_id)
           SELECT '00000000-0000-4000-8000-000000000001'::uuid, seed_values.item_type, seed_values.item_id
           FROM (VALUES
             ('monument', 1), ('monument', 2), ('monument', 4), ('monument', 9), ('monument', 13),
             ('route', 2), ('route', 3), ('route', 4), ('route', 5), ('route', 6),
             ('event', 1), ('event', 3)
           ) AS seed_values(item_type, item_id)
           ON CONFLICT DO NOTHING`,
        );
      }
      await seedClient.query('COMMIT');
    } catch (error) {
      await seedClient.query('ROLLBACK');
      throw error;
    } finally {
      seedClient.release();
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
    async listFavorites(userId) {
      const result = await pool.query(
        `SELECT item_type, item_id FROM tkmbs_user_favorites
         WHERE user_id = $1 ORDER BY item_type, item_id`,
        [userId],
      );
      const favorites = { monument: [], route: [], event: [] };
      result.rows.forEach((row) => favorites[row.item_type]?.push(Number(row.item_id)));
      return favorites;
    },
    async toggleFavorite(userId, type, itemId) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const removed = await client.query(
          `DELETE FROM tkmbs_user_favorites
           WHERE user_id = $1 AND item_type = $2 AND item_id = $3 RETURNING item_id`,
          [userId, type, itemId],
        );
        const favorited = removed.rowCount === 0;
        if (favorited) {
          await client.query(
            `INSERT INTO tkmbs_user_favorites (user_id, item_type, item_id)
             VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
            [userId, type, itemId],
          );
        }
        const listed = await client.query(
          `SELECT item_id FROM tkmbs_user_favorites
           WHERE user_id = $1 AND item_type = $2 ORDER BY item_id`,
          [userId, type],
        );
        await client.query('COMMIT');
        return { type, id: Number(itemId), favorited, ids: listed.rows.map((row) => Number(row.item_id)) };
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    },
    async recordAnalyticsEvent(event) {
      await pool.query(
        `INSERT INTO tkmbs_analytics_events
          (id, event_type, visitor_id, session_id, path, content_type, content_slug, occurred_at, dedupe_key)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT DO NOTHING`,
        [event.id, event.eventType, event.visitorId, event.sessionId, event.path, event.contentType, event.contentSlug, event.occurredAt, event.dedupeKey],
      );
      return { recorded: true };
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
