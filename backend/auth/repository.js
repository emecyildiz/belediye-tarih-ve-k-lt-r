import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { USER_ROLES } from './config.js';
import { hashPassword } from './crypto.js';

const { Pool } = pg;

const demoUsers = (passwordHash) => [
  { id: '00000000-0000-4000-8000-000000000001', name: 'TKMBS Kullanıcısı', email: 'kullanici@tkmbs.local', role: USER_ROLES.CITIZEN, passwordHash, active: true, twoFactorEnabled: false },
  { id: '00000000-0000-4000-8000-000000000002', name: 'İçerik Editörü', email: 'editor@tkmbs.local', role: USER_ROLES.EDITOR, passwordHash, active: true, twoFactorEnabled: false },
  { id: '00000000-0000-4000-8000-000000000003', name: 'Sistem Yöneticisi', email: 'admin@tkmbs.local', role: USER_ROLES.ADMIN, passwordHash, active: true, twoFactorEnabled: false },
];

const mapUserRow = (row) => row && ({
  id: row.id,
  name: row.name,
  email: row.email,
  role: row.role,
  passwordHash: row.password_hash,
  active: row.active,
  twoFactorEnabled: Boolean(row.two_factor_enabled),
  twoFactorSecret: row.two_factor_secret,
  twoFactorPendingSecret: row.two_factor_pending_secret,
  twoFactorLastUsedStep: row.two_factor_last_used_step == null ? null : Number(row.two_factor_last_used_step),
  twoFactorRecoveryCodes: Array.isArray(row.two_factor_recovery_codes) ? row.two_factor_recovery_codes : [],
  twoFactorFailedAttempts: Number(row.two_factor_failed_attempts || 0),
  twoFactorLockedUntil: row.two_factor_locked_until instanceof Date ? row.two_factor_locked_until.toISOString() : row.two_factor_locked_until,
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

const mapCustomRouteRow = (row, selectedIds = []) => row && ({
  id: String(row.id),
  userId: String(row.user_id),
  title: row.title,
  selectedIds: selectedIds.map(Number),
  travelMode: 'driving',
  preview: row.preview || null,
  createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
});

export async function createInMemoryAuthRepository({ demoPassword } = {}) {
  if (!demoPassword || demoPassword.length < 12) {
    throw new Error('Bellek deposu için en az 12 karakterli demoPassword zorunludur.');
  }
  const passwordHash = await hashPassword(demoPassword);
  const users = demoUsers(passwordHash);
  const sessions = new Map();
  const notificationReads = new Map();
  const analyticsEvents = new Map();
  const securityAudit = [];
  const favorites = new Map([
    ['00000000-0000-4000-8000-000000000001', { monument: new Set([1, 2, 4, 9, 13]), route: new Set([2, 3, 4, 5, 6]), event: new Set([1, 3]) }],
  ]);
  const customRoutes = new Map();

  return {
    kind: 'in-memory-demo',
    async findUserByEmail(email) {
      return users.find((user) => user.email === email) || null;
    },
    async findUserById(id) {
      return users.find((user) => user.id === String(id)) || null;
    },
    async createCitizenUser({ name, email, passwordHash }) {
      if (users.some((user) => user.email.toLowerCase() === email.toLowerCase())) return null;
      const user = { id: randomUUID(), name, email, role: USER_ROLES.CITIZEN, passwordHash, active: true, twoFactorEnabled: false };
      users.push(user);
      return { ...user };
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
    async consumeSession(tokenHash) {
      const session = sessions.get(tokenHash);
      if (!session || session.revokedAt) return null;
      session.revokedAt = new Date().toISOString();
      return { ...session };
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
    async setTwoFactorPendingSecret(userId, encryptedSecret) {
      const user = users.find((item) => item.id === String(userId));
      if (!user) return null;
      user.twoFactorPendingSecret = encryptedSecret;
      return { ...user };
    },
    async enableTwoFactor(userId, encryptedSecret, usedStep, recoveryCodeHashes = []) {
      const user = users.find((item) => item.id === String(userId));
      if (!user) return null;
      user.twoFactorEnabled = true;
      user.twoFactorSecret = encryptedSecret;
      user.twoFactorPendingSecret = null;
      user.twoFactorLastUsedStep = Number(usedStep);
      user.twoFactorRecoveryCodes = [...recoveryCodeHashes];
      user.twoFactorFailedAttempts = 0;
      user.twoFactorLockedUntil = null;
      return { ...user };
    },
    async markTwoFactorStepUsed(userId, usedStep) {
      const user = users.find((item) => item.id === String(userId));
      if (!user || (user.twoFactorLastUsedStep != null && user.twoFactorLastUsedStep >= Number(usedStep))) return false;
      user.twoFactorLastUsedStep = Number(usedStep);
      return true;
    },
    async registerTwoFactorFailure(userId, { maxAttempts, lockMs, now }) {
      const user = users.find((item) => item.id === String(userId));
      if (!user) return null;
      const nowMs = new Date(now).getTime();
      if (user.twoFactorLockedUntil && new Date(user.twoFactorLockedUntil).getTime() <= nowMs) user.twoFactorFailedAttempts = 0;
      user.twoFactorFailedAttempts = Number(user.twoFactorFailedAttempts || 0) + 1;
      user.twoFactorLockedUntil = user.twoFactorFailedAttempts >= maxAttempts ? new Date(nowMs + lockMs).toISOString() : null;
      return { attempts: user.twoFactorFailedAttempts, lockedUntil: user.twoFactorLockedUntil };
    },
    async clearTwoFactorFailures(userId) {
      const user = users.find((item) => item.id === String(userId));
      if (!user) return;
      user.twoFactorFailedAttempts = 0;
      user.twoFactorLockedUntil = null;
    },
    async consumeRecoveryCode(userId, codeHash) {
      const user = users.find((item) => item.id === String(userId));
      if (!user || !user.twoFactorRecoveryCodes?.includes(codeHash)) return false;
      user.twoFactorRecoveryCodes = user.twoFactorRecoveryCodes.filter((item) => item !== codeHash);
      return true;
    },
    async resetTwoFactor(userId) {
      const user = users.find((item) => item.id === String(userId));
      if (!user) return null;
      Object.assign(user, { twoFactorEnabled: false, twoFactorSecret: null, twoFactorPendingSecret: null, twoFactorLastUsedStep: null, twoFactorRecoveryCodes: [], twoFactorFailedAttempts: 0, twoFactorLockedUntil: null });
      return { ...user };
    },
    async recordSecurityEvent(event) {
      securityAudit.push({ id: randomUUID(), ...event, createdAt: new Date().toISOString() });
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
    async listUserRoutes(userId) {
      return [...customRoutes.values()].filter((route) => route.userId === String(userId)).map((route) => ({ ...route, selectedIds: [...route.selectedIds] }));
    },
    async findUserRoute(userId, routeId) {
      const route = customRoutes.get(String(routeId));
      return route?.userId === String(userId) ? { ...route, selectedIds: [...route.selectedIds] } : null;
    },
    async createUserRoute(userId, data) {
      const now = new Date().toISOString();
      const route = { id: randomUUID(), userId: String(userId), ...data, travelMode: 'driving', createdAt: now, updatedAt: now };
      customRoutes.set(route.id, route);
      return { ...route, selectedIds: [...route.selectedIds] };
    },
    async updateUserRoute(userId, routeId, data) {
      const current = customRoutes.get(String(routeId));
      if (!current || current.userId !== String(userId)) return null;
      const route = { ...current, ...data, id: current.id, userId: current.userId, travelMode: 'driving', updatedAt: new Date().toISOString() };
      customRoutes.set(route.id, route);
      return { ...route, selectedIds: [...route.selectedIds] };
    },
    async deleteUserRoute(userId, routeId) {
      const current = customRoutes.get(String(routeId));
      if (!current || current.userId !== String(userId)) return false;
      return customRoutes.delete(String(routeId));
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
      two_factor_enabled boolean NOT NULL DEFAULT false,
      two_factor_secret text,
      two_factor_pending_secret text,
      two_factor_last_used_step bigint,
      two_factor_recovery_codes jsonb NOT NULL DEFAULT '[]'::jsonb,
      two_factor_failed_attempts integer NOT NULL DEFAULT 0,
      two_factor_locked_until timestamptz,
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
    CREATE UNIQUE INDEX IF NOT EXISTS tkmbs_portal_users_email_lower_idx ON tkmbs_portal_users (lower(email));
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
    CREATE TABLE IF NOT EXISTS tkmbs_user_routes (
      id uuid PRIMARY KEY,
      user_id uuid NOT NULL REFERENCES tkmbs_portal_users(id) ON DELETE CASCADE,
      title varchar(120) NOT NULL,
      travel_mode varchar(20) NOT NULL DEFAULT 'driving' CHECK (travel_mode = 'driving'),
      preview jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS tkmbs_user_routes_user_updated_idx ON tkmbs_user_routes(user_id, updated_at DESC);
    CREATE TABLE IF NOT EXISTS tkmbs_user_route_stops (
      route_id uuid NOT NULL REFERENCES tkmbs_user_routes(id) ON DELETE CASCADE,
      monument_id integer NOT NULL,
      stop_order integer NOT NULL CHECK (stop_order >= 1),
      PRIMARY KEY (route_id, stop_order),
      UNIQUE (route_id, monument_id)
    );
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
    CREATE TABLE IF NOT EXISTS tkmbs_security_audit (
      id uuid PRIMARY KEY,
      user_id uuid REFERENCES tkmbs_portal_users(id) ON DELETE SET NULL,
      email text,
      event_type varchar(80) NOT NULL,
      success boolean NOT NULL,
      metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS tkmbs_security_audit_created_at_idx ON tkmbs_security_audit(created_at DESC);
    CREATE INDEX IF NOT EXISTS tkmbs_security_audit_user_id_idx ON tkmbs_security_audit(user_id, created_at DESC);
  `);
  await pool.query(`
    ALTER TABLE tkmbs_portal_users ADD COLUMN IF NOT EXISTS two_factor_enabled boolean NOT NULL DEFAULT false;
    ALTER TABLE tkmbs_portal_users ADD COLUMN IF NOT EXISTS two_factor_secret text;
    ALTER TABLE tkmbs_portal_users ADD COLUMN IF NOT EXISTS two_factor_pending_secret text;
    ALTER TABLE tkmbs_portal_users ADD COLUMN IF NOT EXISTS two_factor_last_used_step bigint;
    ALTER TABLE tkmbs_portal_users ADD COLUMN IF NOT EXISTS two_factor_recovery_codes jsonb NOT NULL DEFAULT '[]'::jsonb;
    ALTER TABLE tkmbs_portal_users ADD COLUMN IF NOT EXISTS two_factor_failed_attempts integer NOT NULL DEFAULT 0;
    ALTER TABLE tkmbs_portal_users ADD COLUMN IF NOT EXISTS two_factor_locked_until timestamptz;
  `);

  if (process.env.AUTH_SEED_DEMO_USERS === 'true' && process.env.NODE_ENV !== 'production') {
    const demoPassword = process.env.DEMO_USER_PASSWORD;
    if (!demoPassword || demoPassword.length < 12) {
      throw new Error('Demo hesapları için en az 12 karakterli DEMO_USER_PASSWORD zorunludur.');
    }
    const passwordHash = await hashPassword(demoPassword);
    for (const user of demoUsers(passwordHash)) {
      await pool.query(
        `INSERT INTO tkmbs_portal_users (id, name, email, role, password_hash, active)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (email) DO UPDATE SET
           name = EXCLUDED.name,
           role = EXCLUDED.role,
           password_hash = EXCLUDED.password_hash,
           active = EXCLUDED.active`,
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
    async createCitizenUser({ name, email, passwordHash }) {
      const result = await pool.query(
        `INSERT INTO tkmbs_portal_users (id, name, email, role, password_hash, active)
         VALUES ($1, $2, $3, 'citizen', $4, true)
         ON CONFLICT DO NOTHING RETURNING *`,
        [randomUUID(), name, email, passwordHash],
      );
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
    async consumeSession(tokenHash) {
      const result = await pool.query(
        `UPDATE tkmbs_auth_refresh_sessions
         SET revoked_at = now()
         WHERE token_hash = $1 AND revoked_at IS NULL
         RETURNING *`,
        [tokenHash],
      );
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
    async setTwoFactorPendingSecret(userId, encryptedSecret) {
      const result = await pool.query(
        `UPDATE tkmbs_portal_users SET two_factor_pending_secret = $2 WHERE id = $1 RETURNING *`,
        [userId, encryptedSecret],
      );
      return mapUserRow(result.rows[0]);
    },
    async enableTwoFactor(userId, encryptedSecret, usedStep, recoveryCodeHashes = []) {
      const result = await pool.query(
        `UPDATE tkmbs_portal_users
         SET two_factor_enabled = true, two_factor_secret = $2,
             two_factor_pending_secret = NULL, two_factor_last_used_step = $3,
             two_factor_recovery_codes = $4::jsonb,
             two_factor_failed_attempts = 0, two_factor_locked_until = NULL
         WHERE id = $1 RETURNING *`,
        [userId, encryptedSecret, usedStep, JSON.stringify(recoveryCodeHashes)],
      );
      return mapUserRow(result.rows[0]);
    },
    async markTwoFactorStepUsed(userId, usedStep) {
      const result = await pool.query(
        `UPDATE tkmbs_portal_users SET two_factor_last_used_step = $2
         WHERE id = $1 AND (two_factor_last_used_step IS NULL OR two_factor_last_used_step < $2)
         RETURNING id`,
        [userId, usedStep],
      );
      return result.rowCount === 1;
    },
    async registerTwoFactorFailure(userId, { maxAttempts, lockMs, now }) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const selected = await client.query('SELECT two_factor_failed_attempts, two_factor_locked_until FROM tkmbs_portal_users WHERE id = $1 FOR UPDATE', [userId]);
        if (!selected.rows[0]) { await client.query('ROLLBACK'); return null; }
        const nowDate = new Date(now);
        const previousLock = selected.rows[0].two_factor_locked_until;
        const previousAttempts = previousLock && new Date(previousLock).getTime() <= nowDate.getTime() ? 0 : Number(selected.rows[0].two_factor_failed_attempts || 0);
        const attempts = previousAttempts + 1;
        const lockedUntil = attempts >= maxAttempts ? new Date(nowDate.getTime() + lockMs).toISOString() : null;
        await client.query('UPDATE tkmbs_portal_users SET two_factor_failed_attempts = $2, two_factor_locked_until = $3 WHERE id = $1', [userId, attempts, lockedUntil]);
        await client.query('COMMIT');
        return { attempts, lockedUntil };
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally { client.release(); }
    },
    async clearTwoFactorFailures(userId) {
      await pool.query('UPDATE tkmbs_portal_users SET two_factor_failed_attempts = 0, two_factor_locked_until = NULL WHERE id = $1', [userId]);
    },
    async consumeRecoveryCode(userId, codeHash) {
      const result = await pool.query(
        `UPDATE tkmbs_portal_users
         SET two_factor_recovery_codes = two_factor_recovery_codes - $2
         WHERE id = $1 AND two_factor_recovery_codes ? $2 RETURNING id`,
        [userId, codeHash],
      );
      return result.rowCount === 1;
    },
    async resetTwoFactor(userId) {
      const result = await pool.query(
        `UPDATE tkmbs_portal_users SET two_factor_enabled = false, two_factor_secret = NULL,
          two_factor_pending_secret = NULL, two_factor_last_used_step = NULL,
          two_factor_recovery_codes = '[]'::jsonb, two_factor_failed_attempts = 0,
          two_factor_locked_until = NULL WHERE id = $1 RETURNING *`,
        [userId],
      );
      return mapUserRow(result.rows[0]);
    },
    async recordSecurityEvent(event) {
      await pool.query(
        `INSERT INTO tkmbs_security_audit (id, user_id, email, event_type, success, metadata)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
        [randomUUID(), event.userId || null, event.email || null, event.eventType, Boolean(event.success), JSON.stringify(event.metadata || {})],
      );
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
    async listUserRoutes(userId) {
      const routes = await pool.query('SELECT * FROM tkmbs_user_routes WHERE user_id = $1 ORDER BY updated_at DESC', [userId]);
      const result = [];
      for (const row of routes.rows) {
        const stops = await pool.query('SELECT monument_id FROM tkmbs_user_route_stops WHERE route_id = $1 ORDER BY stop_order', [row.id]);
        result.push(mapCustomRouteRow(row, stops.rows.map((item) => item.monument_id)));
      }
      return result;
    },
    async findUserRoute(userId, routeId) {
      const route = await pool.query('SELECT * FROM tkmbs_user_routes WHERE id = $1 AND user_id = $2 LIMIT 1', [routeId, userId]);
      if (!route.rows[0]) return null;
      const stops = await pool.query('SELECT monument_id FROM tkmbs_user_route_stops WHERE route_id = $1 ORDER BY stop_order', [routeId]);
      return mapCustomRouteRow(route.rows[0], stops.rows.map((item) => item.monument_id));
    },
    async createUserRoute(userId, data) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const id = randomUUID();
        const inserted = await client.query(
          `INSERT INTO tkmbs_user_routes (id, user_id, title, travel_mode, preview)
           VALUES ($1, $2, $3, 'driving', $4::jsonb) RETURNING *`,
          [id, userId, data.title, JSON.stringify(data.preview || null)],
        );
        for (let index = 0; index < data.selectedIds.length; index += 1) {
          await client.query('INSERT INTO tkmbs_user_route_stops (route_id, monument_id, stop_order) VALUES ($1, $2, $3)', [id, data.selectedIds[index], index + 1]);
        }
        await client.query('COMMIT');
        return mapCustomRouteRow(inserted.rows[0], data.selectedIds);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally { client.release(); }
    },
    async updateUserRoute(userId, routeId, data) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const updated = await client.query(
          `UPDATE tkmbs_user_routes SET title = $3, preview = $4::jsonb, updated_at = now()
           WHERE id = $1 AND user_id = $2 RETURNING *`,
          [routeId, userId, data.title, JSON.stringify(data.preview || null)],
        );
        if (!updated.rows[0]) { await client.query('ROLLBACK'); return null; }
        await client.query('DELETE FROM tkmbs_user_route_stops WHERE route_id = $1', [routeId]);
        for (let index = 0; index < data.selectedIds.length; index += 1) {
          await client.query('INSERT INTO tkmbs_user_route_stops (route_id, monument_id, stop_order) VALUES ($1, $2, $3)', [routeId, data.selectedIds[index], index + 1]);
        }
        await client.query('COMMIT');
        return mapCustomRouteRow(updated.rows[0], data.selectedIds);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally { client.release(); }
    },
    async deleteUserRoute(userId, routeId) {
      const result = await pool.query('DELETE FROM tkmbs_user_routes WHERE id = $1 AND user_id = $2 RETURNING id', [routeId, userId]);
      return result.rowCount === 1;
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
  const allowInMemory = process.env.NODE_ENV !== 'production' && process.env.AUTH_ALLOW_IN_MEMORY === 'true';
  if (process.env.DATABASE_URL) {
    try {
      return await createPostgresAuthRepository(process.env.DATABASE_URL);
    } catch (error) {
      if (!allowInMemory) throw error;
      console.warn(`PostgreSQL kimlik deposuna bağlanılamadı; açıkça etkinleştirilen geçici bellek deposu kullanılacak: ${error.message}`);
    }
  }
  if (!allowInMemory) {
    throw new Error('DATABASE_URL zorunludur. Yalnızca yerel test için AUTH_ALLOW_IN_MEMORY=true kullanılabilir.');
  }
  const demoPassword = process.env.DEMO_USER_PASSWORD;
  if (!demoPassword || demoPassword.length < 12) {
    throw new Error('Bellek deposu için en az 12 karakterli DEMO_USER_PASSWORD zorunludur.');
  }
  return createInMemoryAuthRepository({ demoPassword });
}
