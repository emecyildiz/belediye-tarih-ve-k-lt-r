import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { IconBell, IconSearch, IconUser } from '../common/Icons';
import './TopBar.css';

export default function TopBar() {
  const [query, setQuery] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadNotifications = () => Promise.all([api.getNotifications(), api.getNotificationCount()])
      .then(([items, count]) => {
        setNotifications(items || []);
        setUnreadCount(Number(count) || 0);
      })
      .catch((error) => console.error('Bildirimler yüklenemedi:', error));
    loadNotifications();
    const syncNotifications = (event) => {
      if (Number.isFinite(event.detail?.count)) setUnreadCount(event.detail.count);
      api.getNotifications().then((items) => setNotifications(items || [])).catch(() => {});
    };
    window.addEventListener('tkmbs-notifications-updated', syncNotifications);
    return () => window.removeEventListener('tkmbs-notifications-updated', syncNotifications);
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

  const runSearch = () => {
    const value = query.trim();
    navigate(value ? '/arama?q=' + encodeURIComponent(value) : '/arama');
  };

  const submitSearch = (event) => {
    event.preventDefault();
    runSearch();
  };

  const openNotification = async (item) => {
    if (!item.read) {
      await api.markNotificationRead(item.id);
      const next = notifications.map((notification) => notification.id === item.id ? { ...notification, read: true } : notification);
      const count = next.filter((notification) => !notification.read).length;
      setNotifications(next);
      setUnreadCount(count);
      window.dispatchEvent(new CustomEvent('tkmbs-notifications-updated', { detail: { count } }));
    }
    setNotificationsOpen(false);
    navigate(item.link || '/bildirimler');
  };

  return (
    <header className="portal-topbar">
      <form className="portal-search" onSubmit={submitSearch} role="search">
        <IconSearch size={19} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); runSearch(); } }}
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
                  <button type="button" className={'notification-item ' + (!item.read ? 'unread' : '')} key={item.id} onClick={() => openNotification(item)}>
                    <span className="notification-item-dot" />
                    <span>
                      <strong>{item.title}</strong>
                      <small>{item.message}</small>
                      <time>{item.date}</time>
                    </span>
                  </button>
                )) : <p className="notification-empty">Bildirim bulunmuyor.</p>}
              </div>
              <button type="button" className="notification-view-all" onClick={() => { setNotificationsOpen(false); navigate('/bildirimler'); }}>Tüm Bildirimleri Gör</button>
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
