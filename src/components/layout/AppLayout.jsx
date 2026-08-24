import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import AdminSidebar from './AdminSidebar';
import TopBar from './TopBar';
import './AppLayout.css';

export default function AppLayout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('tkmbs-sidebar-collapsed') === 'true');
  const { pathname } = useLocation();
  const adminLayout = pathname.startsWith('/yonetim-paneli') || pathname === '/raporlar' || pathname === '/cbs-analitik';

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  const toggleSidebar = () => {
    if (window.matchMedia('(max-width: 900px)').matches) {
      setMenuOpen((value) => !value);
      return;
    }
    setSidebarCollapsed((value) => {
      localStorage.setItem('tkmbs-sidebar-collapsed', String(!value));
      return !value;
    });
  };

  return (
    <div className={`app-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {adminLayout
        ? <AdminSidebar open={menuOpen} collapsed={sidebarCollapsed} onNavigate={() => setMenuOpen(false)} />
        : <Sidebar open={menuOpen} collapsed={sidebarCollapsed} onNavigate={() => setMenuOpen(false)} />}
      {menuOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Menüyü kapat"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <div className="app-main">
        <TopBar onMenuClick={toggleSidebar} sidebarCollapsed={sidebarCollapsed} menuOpen={menuOpen} />
        <main className="app-content">{children}</main>
        <footer className="app-footer">
          © 2026 Hatay Büyükşehir Belediyesi · Tarihi ve Kültürel Miras Bilgi Sistemi
        </footer>
      </div>
    </div>
  );
}
