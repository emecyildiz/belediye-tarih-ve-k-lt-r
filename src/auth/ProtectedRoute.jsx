import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';

export default function ProtectedRoute({ children, roles = [] }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="auth-route-loading" role="status">Oturum kontrol ediliyor…</div>;
  if (!user) return <Navigate to={`/giris?returnTo=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  if (roles.length && !roles.includes(user.role)) return <Navigate to="/yetkisiz" replace />;
  return children;
}
