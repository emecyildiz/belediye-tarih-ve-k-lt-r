import { useEffect } from 'react';
import { BrowserRouter, Navigate, Routes, Route, useLocation } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import HomePage from './pages/HomePage';
import MapPage from './pages/MapPage';
import MonumentsPage from './pages/MonumentsPage';
import MonumentDetailPage from './pages/MonumentDetailPage';
import RoutesPage from './pages/RoutesPage';
import RouteDetailPage from './pages/RouteDetailPage';
import RouteBuilderPage from './pages/RouteBuilderPage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import FavoritesPage from './pages/FavoritesPage';
import NotificationsPage from './pages/NotificationsPage';
import AboutPage from './pages/AboutPage';
import SearchResultsPage from './pages/SearchResultsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProtectedRoute from './auth/ProtectedRoute';
import { AuthProvider } from './auth/AuthContext';
import api from './services/api';
import './App.css';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname]);

  return null;
}

function anonymousId(storage, key) {
  try {
    const existing = storage.getItem(key);
    if (existing) return existing;
    const value = globalThis.crypto?.randomUUID?.();
    if (!value) return null;
    storage.setItem(key, value);
    return value;
  } catch {
    return null;
  }
}

function PageAnalyticsTracker() {
  const { pathname } = useLocation();

  useEffect(() => {
    const visitorId = anonymousId(localStorage, 'tkmbs_visitor_id');
    const sessionId = anonymousId(sessionStorage, 'tkmbs_session_id');
    if (!visitorId || !sessionId) return undefined;

    const dedupeKey = `tkmbs_page_view:${pathname}`;
    const previous = Number(sessionStorage.getItem(dedupeKey) || 0);
    if (Date.now() - previous < 2_000) return undefined;
    sessionStorage.setItem(dedupeKey, String(Date.now()));

    const timer = setTimeout(() => {
      api.trackPageView({ visitorId, sessionId, path: pathname }).catch(() => {});
    }, 350);
    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollToTop />
        <PageAnalyticsTracker />
        <AppLayout>
          <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/harita" element={<MapPage />} />
          <Route path="/tarihi-eserler" element={<MonumentsPage />} />
          <Route path="/tarihi-eserler/:slug" element={<MonumentDetailPage />} />
          <Route path="/kultur-rotalari" element={<RoutesPage />} />
          <Route path="/kultur-rotalari/:slug" element={<RouteDetailPage />} />
          <Route path="/rota-olustur" element={<RouteBuilderPage />} />
          <Route path="/etkinlikler" element={<EventsPage />} />
          <Route path="/etkinlikler/:slug" element={<EventDetailPage />} />
          <Route path="/profil/*" element={<ProtectedRoute roles={['citizen']}><FavoritesPage /></ProtectedRoute>} />
          <Route path="/favoriler" element={<Navigate to="/profil" replace />} />
          <Route path="/bildirimler" element={<ProtectedRoute roles={['citizen']}><NotificationsPage /></ProtectedRoute>} />
          <Route path="/hakkinda" element={<AboutPage />} />
          <Route path="/arama" element={<SearchResultsPage />} />
          <Route path="/giris" element={<LoginPage />} />
          <Route path="/kayit-ol" element={<RegisterPage />} />
          <Route path="/yetkisiz" element={<div className="auth-route-loading">Bu sayfayı görüntüleme yetkiniz bulunmuyor.</div>} />
          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppLayout>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
