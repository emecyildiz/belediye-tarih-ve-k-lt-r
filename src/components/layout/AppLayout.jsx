import { useState } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import './AppLayout.css';

export default function AppLayout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar open={menuOpen} onNavigate={() => setMenuOpen(false)} />
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
