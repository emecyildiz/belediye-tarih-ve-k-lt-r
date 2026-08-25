import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../auth/AuthContext';
import { IconBell, IconSearch, IconUser } from '../common/Icons';
import './TopBar.css';

export default function TopBar() {
  const [query, setQuery] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const notificationRef = useRef(null);
  const accountRef = useRef(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return undefined;
    }
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
  }, [user]);

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
      if (accountRef.current && !accountRef.current.contains(event.target)) setAccountOpen(false);
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
            onClick={() => user ? setNotificationsOpen((value) => !value) : navigate('/giris?returnTo=%2Fbildirimler')}
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
        <div className="account-menu" ref={accountRef}>
          <button type="button" className="management-link" aria-label={user ? 'Hesap menüsünü aç' : 'Giriş yap'} aria-expanded={user ? accountOpen : undefined} onClick={() => user ? setAccountOpen((value) => !value) : navigate('/giris')}>
            <IconUser size={20} />
            <span>{user ? user.name : 'Giriş Yap'}</span>
            <b>{user ? '⌄' : '›'}</b>
          </button>
          {user && accountOpen && <section className="account-dropdown">
            <header><strong>{user.name}</strong><span>{user.email}</span></header>
            <button type="button" onClick={() => { setAccountOpen(false); navigate('/profil'); }}>Profilim</button>
            {(user.role === 'admin' || user.role === 'editor') && <button type="button" onClick={() => { setAccountOpen(false); navigate('/yonetim-paneli'); }}>Yönetim alanı</button>}
            <button type="button" className="account-logout" onClick={async () => { setAccountOpen(false); await logout(); navigate('/'); }}>Çıkış Yap</button>
          </section>}
        </div>
      </div>
    </header>
  );
}
