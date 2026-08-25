import { ACCESS_TOKEN_TTL_SECONDS, REFRESH_TOKEN_TTL_SECONDS } from './config.js';
import { createOpaqueRefreshToken, hashRefreshToken, signAccessToken, verifyPassword } from './crypto.js';
import { mapAuthResponseDto, mapLoginRequestDto } from './dto.js';

export class AuthenticationError extends Error {
  constructor(message = 'E-posta veya şifre hatalı.') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export function createAuthService(repository, clock = () => Date.now()) {
  const issueSession = async (user) => {
    const refreshToken = createOpaqueRefreshToken();
    const tokenHash = hashRefreshToken(refreshToken);
    const expiresAt = new Date(clock() + REFRESH_TOKEN_TTL_SECONDS * 1000).toISOString();
    const session = await repository.createSession({ userId: String(user.id), tokenHash, expiresAt });
    return {
      refreshToken,
      session,
      response: mapAuthResponseDto({ accessToken: signAccessToken(user, Math.floor(clock() / 1000)), expiresIn: ACCESS_TOKEN_TTL_SECONDS, user }),
    };
  };

  return {
    async login(input) {
      const credentials = mapLoginRequestDto(input);
      const user = await repository.findUserByEmail(credentials.email);
      const valid = user?.active && await verifyPassword(credentials.password, user.passwordHash);
      if (!valid) throw new AuthenticationError();
      return issueSession(user);
    },
    async refresh(refreshToken) {
      if (!refreshToken) throw new AuthenticationError('Oturum yenileme anahtarı bulunamadı.');
      const currentHash = hashRefreshToken(refreshToken);
      const session = await repository.findSessionByTokenHash(currentHash);
      if (session?.revokedAt) await repository.revokeUserSessions(session.userId);
      if (!session || session.revokedAt || new Date(session.expiresAt).getTime() <= clock()) {
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
