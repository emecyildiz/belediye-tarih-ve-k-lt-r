import { Link, useLocation } from 'react-router-dom';
import { NAV_ITEMS } from '../../constants';
import { NavIcon, IconSearch, IconUser, IconSun } from '../common/Icons';
import { publicAsset } from '../../config/runtime';

export default function TopNavbar() {
  const { pathname } = useLocation();

  return (
    <header className="top-navbar">
      <Link to="/" className="navbar-brand" style={{ textDecoration: 'none', color: 'inherit' }}>
        <img src={publicAsset('assets/image6.png')} alt="HBB" className="navbar-logo" />
        <div className="navbar-brand-text">
          <strong>TKMBS</strong>
          <span>Tarihi ve Kültürel Miras Bilgi Sistemi</span>
        </div>
      </Link>

      <nav className="navbar-menu">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`navbar-link ${pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path)) ? 'active' : ''}`}
          >
            <NavIcon name={item.icon} size={16} />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="navbar-actions">
        <button type="button" className="icon-btn" aria-label="Ara"><IconSearch size={18} /></button>
        <button type="button" className="icon-btn" aria-label="Tema"><IconSun size={18} /></button>
        <button type="button" className="login-btn">
          <IconUser size={16} />
          Giriş Yap
        </button>
      </div>
    </header>
  );
}
