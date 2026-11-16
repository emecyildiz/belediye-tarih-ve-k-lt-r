import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { publicAsset, STATIC_DEMO } from '../../config/runtime';
import './AppLayout.css';

export default function AppLayout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const { pathname } = useLocation();

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

  const handleSidebarNavigate = () => {
    setMenuOpen(false);
    setSidebarCollapsed(true);
  };

  return (
    <div className={`app-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="app-brand">
        <img src={publicAsset('assets/image6.png')} alt="Hatay Büyükşehir Belediyesi" />
      </div>
      <Sidebar open={menuOpen} collapsed={sidebarCollapsed} onExpand={expandSidebar} onNavigate={handleSidebarNavigate} />
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
        {STATIC_DEMO && <div className="static-demo-notice" role="status"><strong>Tanıtım sürümü</strong><span>GitHub Pages üzerinde yalnızca örnek içerikler gösterilir; hesap, kalıcı favori, yönetim ve sunucu tabanlı rota özellikleri devre dışıdır.</span></div>}
        <main className="app-content">{children}</main>
        <footer className="app-footer">
          © 2026 Hatay Büyükşehir Belediyesi · Tarihi ve Kültürel Miras Bilgi Sistemi
        </footer>
      </div>
    </div>
  );
}
