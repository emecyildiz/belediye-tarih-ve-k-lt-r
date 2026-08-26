import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ApiRequestError, loginCmsSession, loginSession, logoutCmsSession, logoutSession, refreshSession } from '../services/authClient';

const AuthContext = createContext(null);
const isContentManager = (role) => role === 'admin' || role === 'editor';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    refreshSession()
      .then(async (session) => {
        if (isContentManager(session.user.role)) {
          await logoutSession().catch(() => {});
          if (active) setUser(null);
          return;
        }
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

  const value = useMemo(() => ({
    user,
    loading,
    authenticated: Boolean(user),
    hasRole: (...roles) => Boolean(user && roles.includes(user.role)),
    login: async (credentials) => {
      const session = await loginSession(credentials);
      if (isContentManager(session.user.role)) {
        try {
          await loginCmsSession(credentials, session.user);
          await logoutSession().catch(() => {});
        } catch (error) {
          await logoutSession();
          throw error;
        }
        setUser(null);
        return session.user;
      }
      setUser(session.user);
      return session.user;
    },
    logout: async () => {
      await Promise.allSettled([logoutSession(), logoutCmsSession()]);
      setUser(null);
    },
  }), [loading, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth, AuthProvider içinde kullanılmalıdır.');
  return context;
}
