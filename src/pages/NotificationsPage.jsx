import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { IconBell, IconCalendar, IconDocument, IconMonument, IconRoute, IconSearch } from '../components/common/Icons';
import './NotificationsPage.css';

const typeConfig = {
  event: { label: 'Etkinlik', icon: IconCalendar, color: '#a85e0d' },
  monument: { label: 'Tarihi Eser', icon: IconMonument, color: '#176296' },
  route: { label: 'Kültürel Rota', icon: IconRoute, color: '#16735c' },
  system: { label: 'Sistem', icon: IconDocument, color: '#6b4ca5' },
};

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    api.getNotifications()
      .then((items) => { if (active) setNotifications(items || []); })
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const unreadCount = notifications.filter((item) => !item.read).length;
  const visibleNotifications = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('tr-TR');
    return notifications.filter((item) => (
      (activeTab === 'all' || (activeTab === 'unread' ? !item.read : item.read))
      && (!normalized || `${item.title} ${item.message} ${typeConfig[item.type]?.label || ''}`.toLocaleLowerCase('tr-TR').includes(normalized))
    ));
  }, [activeTab, notifications, query]);

  const publishCount = (items) => window.dispatchEvent(new CustomEvent('tkmbs-notifications-updated', { detail: { count: items.filter((item) => !item.read).length } }));

  const markRead = async (id) => {
    const current = notifications.find((item) => item.id === id);
    if (!current || current.read) return notifications;
    await api.markNotificationRead(id);
    const next = notifications.map((item) => item.id === id ? { ...item, read: true } : item);
    setNotifications(next);
    publishCount(next);
    return next;
  };

  const openNotification = async (item) => {
    await markRead(item.id);
    if (item.link) navigate(item.link);
  };

  const markAllRead = async () => {
    await api.markAllNotificationsRead();
    const next = notifications.map((item) => ({ ...item, read: true }));
    setNotifications(next);
    publishCount(next);
  };

  const tabs = [
    { key: 'all', label: 'Tümü', count: notifications.length },
    { key: 'unread', label: 'Okunmamış', count: unreadCount },
    { key: 'read', label: 'Okunmuş', count: notifications.length - unreadCount },
  ];

  return <div className="notifications-page">
    <header className="notifications-header"><div><span><IconBell size={14} /> GÜNCEL GELİŞMELER</span><h1>Bildirimler</h1><p>Etkinlik, kültürel miras ve rota güncellemelerini buradan takip edin.</p></div><div className="notifications-header-actions"><span><strong>{unreadCount}</strong><small>okunmamış bildirim</small></span><button type="button" onClick={markAllRead} disabled={!unreadCount}>Tümünü Okundu İşaretle</button></div></header>

    <section className="notification-overview" aria-label="Bildirim özeti"><article><div><IconBell size={18} /></div><span><small>Toplam Bildirim</small><strong>{notifications.length}</strong></span></article><article><div><i /></div><span><small>Okunmamış</small><strong>{unreadCount}</strong></span></article><article><div><IconDocument size={18} /></div><span><small>Okunmuş</small><strong>{notifications.length - unreadCount}</strong></span></article></section>

    <section className="notifications-panel"><header><nav aria-label="Bildirim durumu">{tabs.map((tab) => <button type="button" key={tab.key} className={activeTab === tab.key ? 'active' : ''} onClick={() => setActiveTab(tab.key)}>{tab.label}<b>{tab.count}</b></button>)}</nav><label><IconSearch size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Bildirimlerde ara…" /></label></header>
      {loading ? <div className="notifications-state"><span /><strong>Bildirimler yükleniyor…</strong></div> : error ? <div className="notifications-state error"><IconBell size={34} /><strong>Bildirimler yüklenemedi</strong><p>Lütfen daha sonra tekrar deneyin.</p></div> : visibleNotifications.length ? <div className="notifications-list">{visibleNotifications.map((item) => { const config = typeConfig[item.type] || typeConfig.system; const TypeIcon = config.icon; return <article className={`notification-card ${item.read ? 'read' : 'unread'}`} key={item.id} style={{ '--notification-color': config.color }}><button type="button" className="notification-card-main" onClick={() => openNotification(item)}><span className="notification-type-icon"><TypeIcon size={18} /></span><span className="notification-card-copy"><span>{config.label}<i>·</i>{item.date}</span><strong>{item.title}</strong><p>{item.message}</p></span><span className="notification-open">›</span></button>{!item.read && <button type="button" className="notification-mark-read" onClick={() => markRead(item.id)} aria-label={`${item.title} bildirimini okundu işaretle`}><i /> Okundu işaretle</button>}</article>; })}</div> : <div className="notifications-state empty"><div><IconBell size={29} /></div><strong>{query ? 'Aramanızla eşleşen bildirim bulunamadı' : activeTab === 'unread' ? 'Okunmamış bildiriminiz yok' : 'Bu bölümde bildirim bulunmuyor'}</strong><p>{query ? 'Farklı bir sözcükle tekrar arayabilirsiniz.' : 'Yeni gelişmeler olduğunda bildirimler burada görünecek.'}</p></div>}
    </section>
  </div>;
}
