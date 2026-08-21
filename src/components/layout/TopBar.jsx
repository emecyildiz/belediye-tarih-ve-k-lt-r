import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { IconBell, IconSearch, IconUser } from '../common/Icons';
import './TopBar.css';

export default function TopBar({ onMenuClick }) {
  const [query, setQuery] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([api.getNotifications(), api.getNotificationCount()])
      .then(([items, count]) => {
        setNotifications(items || []);
        setUnreadCount(Number(count) || 0);
      })
      .catch((error) => console.error('Bildirimler yüklenemedi:', error));
  }, []);

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, []);

  const submitSearch = (event) => {
    event.preventDefault();
    const value = query.trim();
    navigate(value ? '/tarihi-eserler?search=' + encodeURIComponent(value) : '/tarihi-eserler');
  };

  return (
    <header className="portal-topbar">
      <button type="button" className="mobile-menu-button" onClick={onMenuClick} aria-label="Menüyü aç">
        <span /><span /><span />
      </button>

      <form className="portal-search" onSubmit={submitSearch} role="search">
        <IconSearch size={19} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Tarihi eser, rota veya etkinlik ara..."
          aria-label="Site içinde ara"
        />
      </form>

      <div className="topbar-actions">
        <div className="notification-menu" ref={notificationRef}>
          <button
            type="button"
            className="topbar-icon-button notification-button"
            aria-label="Bildirimleri aç"
            aria-expanded={notificationsOpen}
            onClick={() => setNotificationsOpen((value) => !value)}
          >
            <IconBell size={20} />
            {unreadCount > 0 && <span className="notification-dot">{unreadCount}</span>}
          </button>
          {notificationsOpen && (
            <section className="notification-dropdown">
              <div className="notification-dropdown-header">
                <strong>Bildirimler</strong>
                <span>{unreadCount} okunmamış</span>
              </div>
              <div className="notification-dropdown-list">
                {notifications.length ? notifications.map((item) => (
                  <button type="button" className={'notification-item ' + (!item.read ? 'unread' : '')} key={item.id}>
                    <span className="notification-item-dot" />
                    <span>
                      <strong>{item.title}</strong>
                      <small>{item.message}</small>
                      <time>{item.date}</time>
                    </span>
                  </button>
                )) : <p className="notification-empty">Bildirim bulunmuyor.</p>}
              </div>
            </section>
          )}
        </div>
        <button type="button" className="topbar-icon-button help-button" aria-label="Yardım">?</button>
        <button type="button" className="management-link" aria-label="Giriş yap">
          <IconUser size={20} />
          <span>Giriş Yap</span>
          <b>⌄</b>
        </button>
      </div>
    </header>
  );
}
