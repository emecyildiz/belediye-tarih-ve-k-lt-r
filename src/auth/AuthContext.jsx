import { useEffect, useMemo, useState } from 'react';
import { ApiRequestError, completeTwoFactorSession, loginCmsSession, loginSession, logoutCmsSession, logoutSession, refreshSession, registerSession } from '../services/authClient';
import { AuthContext } from './useAuth';

const isContentManager = (role) => role === 'admin' || role === 'editor';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    logoutCmsSession()
      .catch(() => {})
      .then(() => refreshSession())
      .then(async (session) => {
        if (isContentManager(session.user.role)) {
          await logoutSession().catch(() => {});
          if (active) setUser(null);
          return;
        }
        await logoutCmsSession().catch(() => {});
        if (active) setUser(session.user);
      })
      .catch((error) => {
        if (active && (!(error instanceof ApiRequestError) || error.status !== 401)) {
          console.error('Oturum geri yüklenemedi:', error);
        }
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const finishLogin = async (session, credentials) => {
    if (isContentManager(session.user.role)) {
      try {
        await loginCmsSession(credentials, session.user, session.cmsTwoFactorProof);
        await logoutSession().catch(() => {});
      } catch (error) {
        await logoutSession();
        throw error;
      }
      setUser(null);
      return session.user;
    }
    await logoutCmsSession().catch(() => {});
    setUser(session.user);
    return session.user;
  };

  const value = useMemo(() => ({
    user,
    loading,
    authenticated: Boolean(user),
    hasRole: (...roles) => Boolean(user && roles.includes(user.role)),
    login: async (credentials) => {
      const session = await loginSession(credentials);
      if (session.twoFactorRequired) return session;
      return { user: await finishLogin(session, credentials) };
    },
    register: async (registration) => {
      const session = await registerSession(registration);
      await logoutCmsSession().catch(() => {});
      setUser(session.user);
      return session.user;
    },
    verifyTwoFactor: async ({ challengeToken, code, credentials }) => {
      const session = await completeTwoFactorSession(challengeToken, code);
      return { user: await finishLogin(session, credentials), recoveryCodes: session.recoveryCodes || [] };
    },
    logout: async () => {
      await Promise.allSettled([logoutSession(), logoutCmsSession()]);
      setUser(null);
    },
  }), [loading, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
