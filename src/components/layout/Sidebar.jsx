import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import api from '../../services/api';
import { NavIcon } from '../common/Icons';
import './Sidebar.css';

const menuItems = [
  { path: '/', icon: 'home', label: 'Ana Sayfa', end: true },
  { path: '/harita', icon: 'map', label: 'Harita' },
  { path: '/tarihi-eserler', icon: 'monument', label: 'Tarihi Eserler' },
  { path: '/kultur-rotalari', icon: 'route', label: 'Kültürel Rotalar' },
  { path: '/etkinlikler', icon: 'calendar', label: 'Etkinlikler' },
  { path: '/profil', icon: 'user', label: 'Profil' },
  { path: '/bildirimler', icon: 'bell', label: 'Bildirimler', notification: true },
  { path: '/hakkinda', icon: 'info', label: 'Hakkında' },
];

function HataySkyline() {
  return (
    <svg className="weather-skyline-svg" viewBox="0 0 220 82" role="presentation">
      <g fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 77h216M6 77V59h11V50h13v27m-19-18v-7l6-5 6 5v25m8 0V55h12v22m-8-16h4m-4 6h4" />
        <path d="M48 77V25h8v52m-9-52h10l-2-5h-6l-2 5Zm5-5V8m-2 7 2-7 2 7M47 42h10M47 49h10" />
        <path d="M58 77V56h48v21M63 56c1-17 37-17 38 0M70 47c3-14 24-14 27 0M80 35c4-6 9-6 13 0" />
        <path d="M62 77V66c0-7 9-7 9 0v11m5 0V64c0-8 10-8 10 0v13m5 0V66c0-7 9-7 9 0v11" />
        <path d="M109 77V25h8v52m-9-52h10l-2-5h-6l-2 5Zm5-5V8m-2 7 2-7 2 7m-4 27h10m-10 7h10" />
        <path d="M120 77V60h15V50h12v27m-23-11h7m7-9h5m8 20V55h18v22m-14-15h4m-4 7h4m16 8V57h15v20m-11-13h7" />
        <path d="M179 77c2-17 2-30 1-47m0 4c-5-6-10-6-14-3m14 3c4-7 9-9 14-6m-14 7c-6-2-10 0-13 4m13-4c5-2 10 0 13 4" />
        <path d="M202 77c1-12 1-21 0-32m0 3c-4-4-7-4-10-2m10 2c3-5 7-6 11-4m-11 5c-4-1-7 1-9 4m9-4c4-2 8-1 11 2" />
        <path d="M4 73c17-4 27-1 40 0m76 0c17-4 33-3 48 0m18 0c12-3 21-3 30 0" opacity=".55" />
      </g>
    </svg>
  );
}

export default function Sidebar({ open = false, onNavigate }) {
  const [weather, setWeather] = useState({ temp: 24, desc: 'Güneşli', location: 'Antakya' });
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    Promise.all([api.getWeather(), api.getNotificationCount()])
      .then(([weatherData, count]) => {
        if (weatherData) setWeather(weatherData);
        setUnreadCount(Number(count) || 0);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const syncCount = (event) => {
      if (Number.isFinite(event.detail?.count)) setUnreadCount(event.detail.count);
      else api.getNotificationCount().then((count) => setUnreadCount(Number(count) || 0)).catch(() => {});
    };
    window.addEventListener('tkmbs-notifications-updated', syncCount);
    return () => window.removeEventListener('tkmbs-notifications-updated', syncCount);
  }, []);

  return (
    <aside className={`portal-sidebar ${open ? 'is-open' : ''}`}>
      <div className="sidebar-brand">
        <img src="/assets/image6.png" alt="Hatay Büyükşehir Belediyesi" />
      </div>
      <div className="sidebar-product">
        <strong>TKMBS</strong>
        <span>Tarihi ve Kültürel Miras Bilgi Sistemi</span>
      </div>
      <nav className="sidebar-nav" aria-label="Ana menü">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          >
            <NavIcon name={item.icon} size={19} />
            <span>{item.label}</span>
            {item.notification && unreadCount > 0 && <b className="sidebar-badge">{unreadCount}</b>}
          </NavLink>
        ))}
      </nav>
      <section className="sidebar-weather" aria-label="Hava durumu">
        <div className="weather-topline">
          <NavIcon name="sun" size={34} />
          <div>
            <strong>{weather.temp}°C</strong>
            <span>{weather.desc}</span>
          </div>
        </div>
        <p>{weather.location}</p>
        <div className="weather-skyline" aria-hidden="true">
          <HataySkyline />
        </div>
      </section>
    </aside>
  );
}
