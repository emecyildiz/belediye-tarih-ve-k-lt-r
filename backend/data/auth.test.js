import test from 'node:test';
import assert from 'node:assert/strict';
import { createInMemoryAuthRepository } from '../auth/repository.js';
import { createAuthService, AuthenticationError } from '../auth/service.js';
import { verifyAccessToken } from '../auth/crypto.js';
import { mapLoginRequestDto, DtoValidationError } from '../auth/dto.js';
import { REFRESH_TOKEN_TTL_SECONDS } from '../auth/config.js';
import { parseCookieHeader, serializeCookie } from '../auth/middleware.js';

test('giriş yanıtı yalnızca güvenli kullanıcı DTO alanlarını taşır', async () => {
  const repository = await createInMemoryAuthRepository();
  const now = Date.parse('2026-08-25T09:00:00.000Z');
  const service = createAuthService(repository, () => now);
  const result = await service.login({ email: 'KULLANICI@TKMBS.LOCAL', password: 'Belediye2026!' });

  assert.deepEqual(Object.keys(result.response.user), ['id', 'name', 'email', 'role']);
  assert.equal(result.response.user.role, 'citizen');
  assert.equal(result.response.expiresIn, 120);
  assert.equal(result.response.tokenType, 'Bearer');
  assert.equal(result.response.user.passwordHash, undefined);

  const claims = verifyAccessToken(result.response.accessToken, Math.floor(now / 1000));
  assert.equal(claims.sub, '00000000-0000-4000-8000-000000000001');
  assert.equal(claims.exp - claims.iat, 120);
});

test('hatalı parola genel kimlik doğrulama hatası üretir', async () => {
  const repository = await createInMemoryAuthRepository();
  const service = createAuthService(repository);
  await assert.rejects(
    () => service.login({ email: 'kullanici@tkmbs.local', password: 'YanlisParola!' }),
    AuthenticationError,
  );
});

test('refresh token 14 günlük oturum açar, her kullanımda döndürülür ve eskisi iptal edilir', async () => {
  const repository = await createInMemoryAuthRepository();
  const now = Date.parse('2026-08-25T09:00:00.000Z');
  const service = createAuthService(repository, () => now);
  const login = await service.login({ email: 'editor@tkmbs.local', password: 'Belediye2026!' });
  const stored = await repository.findSessionByTokenHash(login.session.tokenHash);

  assert.equal(new Date(stored.expiresAt).getTime() - now, REFRESH_TOKEN_TTL_SECONDS * 1000);

  const refreshed = await service.refresh(login.refreshToken);
  assert.notEqual(refreshed.refreshToken, login.refreshToken);
  await assert.rejects(() => service.refresh(login.refreshToken), AuthenticationError);
  assert.equal(refreshed.response.user.role, 'editor');
});

test('login DTO geçersiz alanları otomatik doğrular ve normalize eder', () => {
  assert.deepEqual(
    mapLoginRequestDto({ email: '  ADMIN@TKMBS.LOCAL ', password: 'Belediye2026!' }),
    { email: 'admin@tkmbs.local', password: 'Belediye2026!' },
  );
  assert.throws(() => mapLoginRequestDto({ email: 'hatalı', password: '123' }), DtoValidationError);
});

test('refresh çerezi HttpOnly olarak serileştirilir ve tekrar ayrıştırılır', () => {
  const cookie = serializeCookie('tkmbs_refresh', 'abc def', { httpOnly: true, sameSite: 'Lax', path: '/api/auth', maxAge: 60 });
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Lax/);
  assert.equal(parseCookieHeader(cookie).tkmbs_refresh, 'abc def');
});

test('bildirim okuma durumu kullanıcıya özel saklanır', async () => {
  const repository = await createInMemoryAuthRepository();
  const citizenId = '00000000-0000-4000-8000-000000000001';
  const editorId = '00000000-0000-4000-8000-000000000002';

  await repository.markNotificationRead(citizenId, 1);
  await repository.markAllNotificationsRead(citizenId, [2, 3]);

  assert.deepEqual((await repository.listNotificationReadIds(citizenId)).sort(), [1, 2, 3]);
  assert.deepEqual(await repository.listNotificationReadIds(editorId), []);
});

test('favoriler kullanıcıya ve içerik türüne özel saklanır', async () => {
  const repository = await createInMemoryAuthRepository();
  const citizenId = '00000000-0000-4000-8000-000000000001';
  const editorId = '00000000-0000-4000-8000-000000000002';
  const before = await repository.listFavorites(citizenId);

  assert.equal(before.monument.includes(1), true);
  const removed = await repository.toggleFavorite(citizenId, 'monument', 1);
  assert.equal(removed.favorited, false);
  assert.equal(removed.ids.includes(1), false);

  const added = await repository.toggleFavorite(citizenId, 'monument', 20);
  assert.equal(added.favorited, true);
  assert.equal(added.ids.includes(20), true);
  assert.deepEqual(await repository.listFavorites(editorId), { monument: [], route: [], event: [] });
});
