import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import AboutPage from './pages/AboutPage';
import AdminPanelPage from './pages/AdminPanelPage';
import GisAnalyticsPage from './pages/GisAnalyticsPage';
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

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
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
          <Route path="/favoriler" element={<FavoritesPage />} />
          <Route path="/yonetim-paneli" element={<AdminPanelPage />} />
          <Route path="/cbs-analitik" element={<GisAnalyticsPage />} />
          <Route path="/bildirimler" element={<Navigate to="/etkinlikler" replace />} />
          <Route path="/raporlar" element={<Navigate to="/cbs-analitik" replace />} />
          <Route path="/hakkinda" element={<AboutPage />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}

export default App;
