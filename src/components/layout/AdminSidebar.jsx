import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import api from '../../services/api';
import './Sidebar.css';
import './AdminSidebar.css';

function AdminMenuIcon({ name }) {
  const paths = {
    dashboard: <><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 17v-4h3v4m2 0V9h3v8m2 0V6h2v11"/></>,
    monument: <><path d="M3 21h18M5 8h14M6 8l6-5 6 5M7 11v7m5-7v7m5-7v7"/></>,
    route: <><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M8 17c5 0 2-7 7-8"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18m-14 4h4m-4 3h7"/></>,
    users: <><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M18 8a3 3 0 010 6m4 7v-2a4 4 0 00-3-3.87"/></>,
    content: <><path d="M4 8l8-5 8 5-8 5zM4 8v9l8 4 8-4V8M8 11v5l4 2 4-2v-5"/></>,
    bell: <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M14 21h-4"/></>,
    report: <><path d="M6 2h8l4 4v16H6zM14 2v5h5M9 17v-4m3 4V9m3 8v-6"/></>,
    backup: <><path d="M4 7v5h5M5.5 16a8 8 0 10.5-9l-2 5"/><path d="M12 8v5l3 2"/></>,
  };
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

const CMS_URL = (import.meta.env.VITE_CMS_URL || 'http://localhost:3000').replace(/\/$/, '');
const moduleItems = [
  ['monument', 'Eser Yönetimi', 'collections/monuments'],
  ['route', 'Rota Yönetimi', 'collections/cultural-routes'],
  ['calendar', 'Etkinlik Yönetimi', 'collections/events'],
  ['users', 'Kullanıcılar', 'collections/users'],
  ['content', 'İçerik Yönetimi', 'globals/site-settings'],
];

export default function AdminSidebar({ open = false, collapsed = false, onNavigate }) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    api.getNotificationCount().then((count) => setUnreadCount(Number(count) || 0)).catch(() => {});
  }, []);

  return <aside className={`portal-sidebar admin-sidebar ${open ? 'is-open' : ''} ${collapsed ? 'is-collapsed' : ''}`} aria-hidden={collapsed && !open}>
    <div className="sidebar-brand"><img src="/assets/image6.png" alt="Hatay Büyükşehir Belediyesi" /></div>
    <div className="admin-sidebar-product"><span>TKMBS</span><strong>Yönetim Paneli</strong></div>
    <nav className="admin-sidebar-nav" aria-label="Yönetim menüsü">
      <NavLink to="/yonetim-paneli" onClick={onNavigate} className={({ isActive }) => `admin-sidebar-link${isActive ? ' active' : ''}`}><AdminMenuIcon name="dashboard"/><span>Gösterge Paneli</span></NavLink>
      {moduleItems.map(([icon, label, path]) => <a href={`${CMS_URL}/admin/${path}`} target="_blank" rel="noreferrer" onClick={onNavigate} className="admin-sidebar-link" key={path}><AdminMenuIcon name={icon}/><span>{label}</span></a>)}
      <a href={`${CMS_URL}/admin/collections/notifications`} target="_blank" rel="noreferrer" onClick={onNavigate} className="admin-sidebar-link"><AdminMenuIcon name="bell"/><span>Bildirimler</span>{unreadCount > 0 && <b>{unreadCount}</b>}</a>
      <NavLink to="/raporlar" onClick={onNavigate} className={({ isActive }) => `admin-sidebar-link report${isActive ? ' active' : ''}`}><AdminMenuIcon name="report"/><span>Raporlar</span></NavLink>
      <NavLink to="/yonetim-paneli/yedekleme" onClick={onNavigate} className={({ isActive }) => `admin-sidebar-link${isActive ? ' active' : ''}`}><AdminMenuIcon name="backup"/><span>Yedekleme</span></NavLink>
    </nav>
    <div className="admin-sidebar-account"><span>Y</span><div><strong>Yönetici</strong><small>Yetkili çalışma alanı</small></div><i>•••</i></div>
  </aside>;
}
