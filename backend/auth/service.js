import { ACCESS_TOKEN_TTL_SECONDS, REFRESH_TOKEN_TTL_SECONDS, TWO_FACTOR_LOCK_SECONDS, TWO_FACTOR_MAX_ATTEMPTS, isTwoFactorRequiredForRole } from './config.js';
import { createOpaqueRefreshToken, hashPassword, hashRefreshToken, signAccessToken, verifyPassword } from './crypto.js';
import { mapAuthResponseDto, mapAuthUserDto, mapLoginRequestDto, mapRegisterRequestDto, mapTwoFactorRequestDto } from './dto.js';
import {
  buildTwoFactorSetup,
  createBase32Secret,
  createCmsTwoFactorProof,
  createRecoveryCodes,
  createTwoFactorChallenge,
  decryptTwoFactorSecret,
  encryptTwoFactorSecret,
  hashRecoveryCode,
  normalizeRecoveryCode,
  verifyTotp,
  verifyTwoFactorChallenge,
} from './twoFactor.js';

export class AuthenticationError extends Error {
  constructor(message = 'E-posta veya şifre hatalı.') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class RegistrationError extends Error {
  constructor(message = 'Bu e-posta adresiyle daha önce hesap oluşturulmuş.', fields = {}) {
    super(message);
    this.name = 'RegistrationError';
    this.fields = fields;
  }
}

export function createAuthService(repository, clock = () => Date.now()) {
  const recordEvent = async (event) => {
    try { await repository.recordSecurityEvent(event); } catch (error) { console.error('Güvenlik olayı kaydedilemedi:', error.message); }
  };
  const issueSession = async (user) => {
    const refreshToken = createOpaqueRefreshToken();
    const tokenHash = hashRefreshToken(refreshToken);
    const expiresAt = new Date(clock() + REFRESH_TOKEN_TTL_SECONDS * 1000).toISOString();
    const session = await repository.createSession({ userId: String(user.id), tokenHash, expiresAt });
    const response = mapAuthResponseDto({ accessToken: signAccessToken(user, Math.floor(clock() / 1000)), expiresIn: ACCESS_TOKEN_TTL_SECONDS, user });
    if (isTwoFactorRequiredForRole(user.role)) response.cmsTwoFactorProof = createCmsTwoFactorProof(user, Math.floor(clock() / 1000));
    return {
      refreshToken,
      session,
      response,
    };
  };

  const challengeResult = async (user) => {
    if (user.twoFactorEnabled && user.twoFactorSecret) {
      await recordEvent({ userId: String(user.id), email: user.email, eventType: 'two_factor_challenge', success: true, metadata: { purpose: 'login', role: user.role } });
      return {
        response: {
          twoFactorRequired: true,
          setupRequired: false,
          challengeToken: createTwoFactorChallenge(user, 'login', Math.floor(clock() / 1000)),
          user: mapAuthUserDto(user),
        },
      };
    }

    const secret = createBase32Secret();
    await repository.setTwoFactorPendingSecret(user.id, encryptTwoFactorSecret(secret));
    await recordEvent({ userId: String(user.id), email: user.email, eventType: 'two_factor_setup_started', success: true, metadata: { role: user.role } });
    return {
      response: {
        twoFactorRequired: true,
        setupRequired: true,
        challengeToken: createTwoFactorChallenge(user, 'setup', Math.floor(clock() / 1000)),
        setup: await buildTwoFactorSetup(secret, user.email),
        user: mapAuthUserDto(user),
      },
    };
  };

  return {
    async register(input) {
      const registration = mapRegisterRequestDto(input);
      const passwordHash = await hashPassword(registration.password);
      const user = await repository.createCitizenUser({
        name: registration.name,
        email: registration.email,
        passwordHash,
      });
      if (!user) throw new RegistrationError(undefined, { email: 'Bu e-posta adresi zaten kullanılıyor.' });
      await recordEvent({ userId: String(user.id), email: user.email, eventType: 'citizen_registration', success: true });
      return issueSession(user);
    },
    async login(input) {
      const credentials = mapLoginRequestDto(input);
      const user = await repository.findUserByEmail(credentials.email);
      const valid = user?.active && await verifyPassword(credentials.password, user.passwordHash);
      if (!valid) {
        await recordEvent({ userId: user?.id ? String(user.id) : null, email: credentials.email, eventType: 'password_login', success: false });
        throw new AuthenticationError();
      }
      if (isTwoFactorRequiredForRole(user.role)) return challengeResult(user);
      return issueSession(user);
    },
    async completeTwoFactor(input) {
      const request = mapTwoFactorRequestDto(input);
      let challenge;
      try {
        challenge = verifyTwoFactorChallenge(request.challengeToken, Math.floor(clock() / 1000));
      } catch (error) {
        throw new AuthenticationError(error.message);
      }
      const user = await repository.findUserById(challenge.sub);
      if (!user?.active || user.email !== challenge.email || user.role !== challenge.role || !isTwoFactorRequiredForRole(user.role)) {
        throw new AuthenticationError('Doğrulama oturumu geçersiz. Lütfen yeniden giriş yapın.');
      }

      if (user.twoFactorLockedUntil && new Date(user.twoFactorLockedUntil).getTime() > clock()) {
        const seconds = Math.max(1, Math.ceil((new Date(user.twoFactorLockedUntil).getTime() - clock()) / 1000));
        throw new AuthenticationError(`Çok fazla hatalı deneme yapıldı. ${seconds} saniye sonra yeniden deneyin.`);
      }

      const encryptedSecret = challenge.purpose === 'setup' ? user.twoFactorPendingSecret : user.twoFactorSecret;
      if (!encryptedSecret || (challenge.purpose === 'login' && !user.twoFactorEnabled)) {
        throw new AuthenticationError('İki adımlı doğrulama kurulumu bulunamadı. Lütfen yeniden giriş yapın.');
      }
      let secret;
      try {
        secret = decryptTwoFactorSecret(encryptedSecret);
      } catch {
        throw new AuthenticationError('İki adımlı doğrulama anahtarı okunamadı. Sistem yöneticisine başvurun.');
      }
      const usedStep = verifyTotp(secret, request.code, clock());
      const recoveryCode = challenge.purpose === 'login' && usedStep == null ? normalizeRecoveryCode(request.code) : '';
      const recovered = recoveryCode ? await repository.consumeRecoveryCode(user.id, hashRecoveryCode(recoveryCode)) : false;
      if (usedStep == null && !recovered) {
        const failure = await repository.registerTwoFactorFailure(user.id, {
          maxAttempts: TWO_FACTOR_MAX_ATTEMPTS,
          lockMs: TWO_FACTOR_LOCK_SECONDS * 1000,
          now: new Date(clock()).toISOString(),
        });
        await recordEvent({ userId: String(user.id), email: user.email, eventType: 'two_factor_verify', success: false, metadata: { attempts: failure?.attempts || 1, locked: Boolean(failure?.lockedUntil) } });
        if (failure?.lockedUntil) throw new AuthenticationError(`Çok fazla hatalı deneme yapıldı. ${TWO_FACTOR_LOCK_SECONDS} saniye sonra yeniden deneyin.`);
        throw new AuthenticationError('Doğrulama kodu hatalı veya süresi dolmuş.');
      }

      let recoveryCodes;
      if (challenge.purpose === 'setup') {
        recoveryCodes = createRecoveryCodes();
        await repository.enableTwoFactor(user.id, encryptedSecret, usedStep, recoveryCodes.map(hashRecoveryCode));
        await repository.revokeUserSessions(user.id);
        await recordEvent({ userId: String(user.id), email: user.email, eventType: 'two_factor_setup_completed', success: true, metadata: { recoveryCodeCount: recoveryCodes.length } });
      } else if (challenge.purpose === 'login') {
        if (usedStep != null) {
          const accepted = await repository.markTwoFactorStepUsed(user.id, usedStep);
          if (!accepted) throw new AuthenticationError('Bu doğrulama kodu daha önce kullanıldı. Yeni kodu bekleyin.');
        }
        await recordEvent({ userId: String(user.id), email: user.email, eventType: recovered ? 'two_factor_recovery_used' : 'two_factor_verify', success: true });
      } else {
        throw new AuthenticationError('Doğrulama işlemi geçersiz.');
      }

      await repository.clearTwoFactorFailures(user.id);
      const issued = await issueSession({ ...user, twoFactorEnabled: true });
      if (recoveryCodes) issued.response.recoveryCodes = recoveryCodes;
      return issued;
    },
    async refresh(refreshToken) {
      if (!refreshToken) throw new AuthenticationError('Oturum yenileme anahtarı bulunamadı.');
      const currentHash = hashRefreshToken(refreshToken);
      const knownSession = await repository.findSessionByTokenHash(currentHash);
      if (knownSession?.revokedAt) await repository.revokeUserSessions(knownSession.userId);
      const session = await repository.consumeSession(currentHash);
      if (!session || new Date(session.expiresAt).getTime() <= clock()) {
        throw new AuthenticationError('Oturum süresi dolmuş. Lütfen yeniden giriş yapın.');
      }
      const user = await repository.findUserById(session.userId);
      if (!user?.active) throw new AuthenticationError('Kullanıcı hesabı kullanılamıyor.');
      const next = await issueSession(user);
      await repository.revokeSession(currentHash, next.session.id);
      return next;
    },
    async logout(refreshToken) {
      if (refreshToken) await repository.revokeSession(hashRefreshToken(refreshToken));
    },
    accessTokenTtl: ACCESS_TOKEN_TTL_SECONDS,
  };
}
