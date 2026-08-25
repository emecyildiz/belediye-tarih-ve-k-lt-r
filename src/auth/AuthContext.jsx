import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ApiRequestError, loginSession, logoutSession, refreshSession } from '../services/authClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    refreshSession()
      .then((session) => { if (active) setUser(session.user); })
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
      setUser(session.user);
      return session.user;
    },
    logout: async () => {
      await logoutSession();
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
