import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import AdminSidebar from './AdminSidebar';
import TopBar from './TopBar';
import './AppLayout.css';

export default function AppLayout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const adminLayout = pathname === '/yonetim-paneli' || pathname === '/raporlar' || pathname === '/cbs-analitik';

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  return (
    <div className="app-shell">
      {adminLayout
        ? <AdminSidebar open={menuOpen} onNavigate={() => setMenuOpen(false)} />
        : <Sidebar open={menuOpen} onNavigate={() => setMenuOpen(false)} />}
      {menuOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Menüyü kapat"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <div className="app-main">
        <TopBar onMenuClick={() => setMenuOpen((value) => !value)} />
        <main className="app-content">{children}</main>
        <footer className="app-footer">
          © 2026 Hatay Büyükşehir Belediyesi · Tarihi ve Kültürel Miras Bilgi Sistemi
        </footer>
      </div>
    </div>
  );
}
