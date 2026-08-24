import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import AdminSidebar from './AdminSidebar';
import TopBar from './TopBar';
import './AppLayout.css';

export default function AppLayout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const { pathname } = useLocation();
  const adminLayout = pathname.startsWith('/yonetim-paneli') || pathname === '/raporlar' || pathname === '/cbs-analitik';

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  const toggleSidebar = () => {
    if (window.matchMedia('(max-width: 900px)').matches) {
      setMenuOpen((value) => !value);
      return;
    }
    setSidebarCollapsed((value) => !value);
  };

  const expandSidebar = () => {
    setSidebarCollapsed(false);
  };

  return (
    <div className={`app-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="app-brand">
        <img src="/assets/image6.png" alt="Hatay Büyükşehir Belediyesi" />
      </div>
      {adminLayout
        ? <AdminSidebar open={menuOpen} collapsed={sidebarCollapsed} onExpand={expandSidebar} onNavigate={() => setMenuOpen(false)} />
        : <Sidebar open={menuOpen} collapsed={sidebarCollapsed} onExpand={expandSidebar} onNavigate={() => setMenuOpen(false)} />}
      <button
        type="button"
        className="sidebar-layout-toggle"
        onClick={toggleSidebar}
        aria-label={sidebarCollapsed && !menuOpen ? 'Menüyü aç' : 'Menüyü kapat'}
        aria-expanded={!sidebarCollapsed || menuOpen}
      >
        <span /><span /><span />
      </button>
      {menuOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Menüyü kapat"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <div className="app-main">
        <TopBar />
        <main className="app-content">{children}</main>
        <footer className="app-footer">
          © 2026 Hatay Büyükşehir Belediyesi · Tarihi ve Kültürel Miras Bilgi Sistemi
        </footer>
      </div>
    </div>
  );
}
