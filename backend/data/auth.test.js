import test from 'node:test';
import assert from 'node:assert/strict';
import { createAuthRepository, createInMemoryAuthRepository } from '../auth/repository.js';
import { createAuthService, AuthenticationError } from '../auth/service.js';
import { verifyAccessToken } from '../auth/crypto.js';
import { mapLoginRequestDto, mapRegisterRequestDto, DtoValidationError } from '../auth/dto.js';
import { REFRESH_TOKEN_TTL_SECONDS } from '../auth/config.js';
import { parseCookieHeader, serializeCookie } from '../auth/middleware.js';
import { decryptTwoFactorSecret, generateTotp } from '../auth/twoFactor.js';

const TEST_PASSWORD = 'Belediye2026!';
const createTestAuthRepository = () => createInMemoryAuthRepository({ demoPassword: TEST_PASSWORD });

test('sunucu açık izin olmadan bellek içi kimlik deposuna düşmez', async () => {
  const previousDatabaseUrl = process.env.DATABASE_URL;
  const previousAllowInMemory = process.env.AUTH_ALLOW_IN_MEMORY;
  delete process.env.DATABASE_URL;
  delete process.env.AUTH_ALLOW_IN_MEMORY;
  try {
    await assert.rejects(() => createAuthRepository(), /DATABASE_URL zorunludur/);
  } finally {
    if (previousDatabaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previousDatabaseUrl;
    if (previousAllowInMemory === undefined) delete process.env.AUTH_ALLOW_IN_MEMORY;
    else process.env.AUTH_ALLOW_IN_MEMORY = previousAllowInMemory;
  }
});

test('giriş yanıtı yalnızca güvenli kullanıcı DTO alanlarını taşır', async () => {
  const repository = await createTestAuthRepository();
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
  const repository = await createTestAuthRepository();
  const service = createAuthService(repository);
  await assert.rejects(
    () => service.login({ email: 'kullanici@tkmbs.local', password: 'YanlisParola!' }),
    AuthenticationError,
  );
});

test('refresh token 14 günlük oturum açar, her kullanımda döndürülür ve eskisi iptal edilir', async () => {
  const repository = await createTestAuthRepository();
  const now = Date.parse('2026-08-25T09:00:00.000Z');
  const service = createAuthService(repository, () => now);
  const login = await service.login({ email: 'kullanici@tkmbs.local', password: 'Belediye2026!' });
  const stored = await repository.findSessionByTokenHash(login.session.tokenHash);

  assert.equal(new Date(stored.expiresAt).getTime() - now, REFRESH_TOKEN_TTL_SECONDS * 1000);

  const refreshed = await service.refresh(login.refreshToken);
  assert.notEqual(refreshed.refreshToken, login.refreshToken);
  await assert.rejects(() => service.refresh(login.refreshToken), AuthenticationError);
  assert.equal(refreshed.response.user.role, 'citizen');
});

test('aynı refresh token eşzamanlı olarak yalnızca bir kez kullanılabilir', async () => {
  const repository = await createTestAuthRepository();
  const service = createAuthService(repository);
  const login = await service.login({ email: 'kullanici@tkmbs.local', password: 'Belediye2026!' });

  const results = await Promise.allSettled([
    service.refresh(login.refreshToken),
    service.refresh(login.refreshToken),
  ]);

  assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
  assert.equal(results.filter((result) => result.status === 'rejected').length, 1);
});

test('yönetici TOTP kurulumu tamamlanmadan oturum tokenı alamaz', async () => {
  const repository = await createTestAuthRepository();
  let now = Date.parse('2026-08-25T09:00:00.000Z');
  const service = createAuthService(repository, () => now);
  const login = await service.login({ email: 'admin@tkmbs.local', password: 'Belediye2026!' });

  assert.equal(login.refreshToken, undefined);
  assert.equal(login.response.twoFactorRequired, true);
  assert.equal(login.response.setupRequired, true);
  assert.match(login.response.setup.qrCodeDataUrl, /^data:image\/png;base64,/);

  const pendingUser = await repository.findUserByEmail('admin@tkmbs.local');
  const secret = decryptTwoFactorSecret(pendingUser.twoFactorPendingSecret);
  const completed = await service.completeTwoFactor({
    challengeToken: login.response.challengeToken,
    code: generateTotp(secret, Math.floor(now / 1000 / 30)),
  });

  assert.ok(completed.response.accessToken);
  assert.ok(completed.refreshToken);
  assert.ok(completed.response.cmsTwoFactorProof);
  assert.equal(completed.response.recoveryCodes.length, 8);
  assert.match(completed.response.recoveryCodes[0], /^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
  assert.equal((await repository.findUserByEmail('admin@tkmbs.local')).twoFactorEnabled, true);

  now += 31_000;
  const nextLogin = await service.login({ email: 'admin@tkmbs.local', password: 'Belediye2026!' });
  assert.equal(nextLogin.response.setupRequired, false);
  const verified = await service.completeTwoFactor({
    challengeToken: nextLogin.response.challengeToken,
    code: generateTotp(secret, Math.floor(now / 1000 / 30)),
  });
  assert.ok(verified.response.accessToken);

  now += 31_000;
  const recoveryLogin = await service.login({ email: 'admin@tkmbs.local', password: 'Belediye2026!' });
  const recovered = await service.completeTwoFactor({
    challengeToken: recoveryLogin.response.challengeToken,
    code: completed.response.recoveryCodes[0],
  });
  assert.ok(recovered.response.accessToken);

  now += 31_000;
  const reusedRecoveryLogin = await service.login({ email: 'admin@tkmbs.local', password: 'Belediye2026!' });
  await assert.rejects(
    () => service.completeTwoFactor({ challengeToken: reusedRecoveryLogin.response.challengeToken, code: completed.response.recoveryCodes[0] }),
    AuthenticationError,
  );
});

test('beş hatalı 2FA denemesi hesabı geçici olarak kilitler', async () => {
  const repository = await createTestAuthRepository();
  const now = Date.parse('2026-08-25T09:00:00.000Z');
  const service = createAuthService(repository, () => now);
  const login = await service.login({ email: 'editor@tkmbs.local', password: 'Belediye2026!' });

  for (let attempt = 1; attempt <= 4; attempt += 1) {
    await assert.rejects(() => service.completeTwoFactor({ challengeToken: login.response.challengeToken, code: '000000' }), /hatalı veya süresi dolmuş/);
  }
  await assert.rejects(() => service.completeTwoFactor({ challengeToken: login.response.challengeToken, code: '000000' }), /Çok fazla hatalı deneme/);
  const user = await repository.findUserByEmail('editor@tkmbs.local');
  assert.equal(user.twoFactorFailedAttempts, 5);
  assert.ok(user.twoFactorLockedUntil);
});

test('login DTO geçersiz alanları otomatik doğrular ve normalize eder', () => {
  assert.deepEqual(
    mapLoginRequestDto({ email: '  ADMIN@TKMBS.LOCAL ', password: 'Belediye2026!' }),
    { email: 'admin@tkmbs.local', password: 'Belediye2026!' },
  );
  assert.throws(() => mapLoginRequestDto({ email: 'hatalı', password: '123' }), DtoValidationError);
});

test('halk kullanıcısı kaydı güvenli DTO ile citizen hesabı ve oturum oluşturur', async () => {
  const repository = await createTestAuthRepository();
  const service = createAuthService(repository);
  const registration = {
    name: '  Ayşe   Yılmaz ', email: ' AYSE@EXAMPLE.COM ',
    password: 'Guvenli2026', passwordConfirmation: 'Guvenli2026', termsAccepted: true,
    role: 'admin',
  };
  assert.deepEqual(mapRegisterRequestDto(registration), { name: 'Ayşe Yılmaz', email: 'ayse@example.com', password: 'Guvenli2026' });

  const result = await service.register(registration);
  assert.equal(result.response.user.role, 'citizen');
  assert.equal(result.response.user.email, 'ayse@example.com');
  assert.ok(result.response.accessToken);
  await assert.rejects(() => service.register(registration), /daha önce/);
});

test('kayıt DTO zayıf parola, eşleşmeyen parola ve onaysız koşulları reddeder', () => {
  assert.throws(() => mapRegisterRequestDto({
    name: 'A', email: 'yanlis', password: '123', passwordConfirmation: '456', termsAccepted: false,
  }), DtoValidationError);
});

test('refresh çerezi HttpOnly olarak serileştirilir ve tekrar ayrıştırılır', () => {
  const cookie = serializeCookie('tkmbs_refresh', 'abc def', { httpOnly: true, sameSite: 'Lax', path: '/api/auth', maxAge: 60 });
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Lax/);
  assert.equal(parseCookieHeader(cookie).tkmbs_refresh, 'abc def');
});

test('bildirim okuma durumu kullanıcıya özel saklanır', async () => {
  const repository = await createTestAuthRepository();
  const citizenId = '00000000-0000-4000-8000-000000000001';
  const editorId = '00000000-0000-4000-8000-000000000002';

  await repository.markNotificationRead(citizenId, 1);
  await repository.markAllNotificationsRead(citizenId, [2, 3]);

  assert.deepEqual((await repository.listNotificationReadIds(citizenId)).sort(), [1, 2, 3]);
  assert.deepEqual(await repository.listNotificationReadIds(editorId), []);
});

test('favoriler kullanıcıya ve içerik türüne özel saklanır', async () => {
  const repository = await createTestAuthRepository();
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

test('kişisel rotalar kullanıcıya özel oluşturulur, güncellenir ve silinir', async () => {
  const repository = await createTestAuthRepository();
  const citizenId = '00000000-0000-4000-8000-000000000001';
  const editorId = '00000000-0000-4000-8000-000000000002';
  const created = await repository.createUserRoute(citizenId, { title: 'Antakya Gezim', selectedIds: [1, 2], preview: { distanceKm: 3.2 } });

  assert.equal((await repository.listUserRoutes(citizenId)).length, 1);
  assert.equal(await repository.findUserRoute(editorId, created.id), null);
  const updated = await repository.updateUserRoute(citizenId, created.id, { title: 'Antakya Gezim Güncel', selectedIds: [2, 4], preview: { distanceKm: 4.1 } });
  assert.deepEqual(updated.selectedIds, [2, 4]);
  assert.equal(updated.title, 'Antakya Gezim Güncel');
  assert.equal(await repository.deleteUserRoute(editorId, created.id), false);
  assert.equal(await repository.deleteUserRoute(citizenId, created.id), true);
  assert.equal((await repository.listUserRoutes(citizenId)).length, 0);
});
