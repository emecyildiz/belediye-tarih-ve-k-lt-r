import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getImageUrl } from '../services/api';
import SafeImage from '../components/common/SafeImage';
import { IconArrow, IconCalendar, IconClock, IconHeart, IconMonument, IconPin, IconRoute, IconSearch } from '../components/common/Icons';
import './FavoritesPage.css';

const storageKeys = {
  monument: 'tkmbs-favorite-monuments',
  route: 'tkmbs-favorite-routes',
  event: 'tkmbs-favorite-events',
};

function readFavoriteIds(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]').map(Number).filter(Number.isFinite); }
  catch { return []; }
}

function dateLabel(item) {
  if (!item.date) return 'Tarih açıklanacak';
  const value = new Date(`${item.date}T${item.time || '12:00'}:00`);
  if (Number.isNaN(value.getTime())) return item.dateLabel || 'Tarih açıklanacak';
  return new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }).format(value);
}

function FavoriteCard({ item, onRemove }) {
  const configs = {
    monument: { label: 'Tarihi Eser', icon: <IconMonument size={13} />, href: `/tarihi-eserler/${item.slug}`, title: item.name },
    route: { label: 'Kültürel Rota', icon: <IconRoute size={13} />, href: `/kultur-rotalari/${item.slug}`, title: item.title },
    event: { label: 'Etkinlik', icon: <IconCalendar size={13} />, href: `/etkinlikler/${item.slug || item.id}`, title: item.title },
  };
  const config = configs[item.favoriteType];

  return <article className={`favorite-item-card ${item.favoriteType}`}>
    <Link to={config.href} className="favorite-item-image"><SafeImage src={getImageUrl(item.image)} alt={config.title} /><span>{config.icon}{config.label}</span></Link>
    <button type="button" className="favorite-remove" onClick={() => onRemove(item.favoriteType, item.id)} aria-label={`${config.title} favorilerden çıkar`}><IconHeart size={17} /></button>
    <div className="favorite-item-body"><div className="favorite-item-type">{config.label}</div><h2><Link to={config.href}>{config.title}</Link></h2>
      {item.favoriteType === 'monument' && <><p><IconPin size={12} /> {item.district || 'Hatay'}</p><small>{item.period || item.categoryLabel || 'Kültürel miras kaydı'}</small></>}
      {item.favoriteType === 'route' && <><p><IconPin size={12} /> {item.district || 'Hatay'} başlangıç noktası</p><div className="favorite-item-meta"><span><IconClock size={12} /> {item.duration}</span><span><IconRoute size={12} /> {item.distance}</span></div></>}
      {item.favoriteType === 'event' && <><p><IconPin size={12} /> {item.venue} · {item.district}</p><div className="favorite-item-meta"><span><IconCalendar size={12} /> {dateLabel(item)}</span><span><IconClock size={12} /> {item.time}</span></div></>}
      <Link className="favorite-detail-link" to={config.href}>Detayları Gör <IconArrow size={12} /></Link>
    </div>
  </article>;
}

export default function FavoritesPage() {
  const [data, setData] = useState({ monuments: [], routes: [], events: [] });
  const [favoriteIds, setFavoriteIds] = useState(() => ({
    monument: readFavoriteIds(storageKeys.monument),
    route: readFavoriteIds(storageKeys.route),
    event: readFavoriteIds(storageKeys.event),
  }));
  const [activeType, setActiveType] = useState('all');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([api.getMonuments(), api.getRoutes(), api.getEvents()])
      .then(([monuments, routes, events]) => { if (active) setData({ monuments: monuments || [], routes: routes || [], events: events || [] }); })
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const groups = useMemo(() => ({
    monument: data.monuments.filter((item) => favoriteIds.monument.includes(Number(item.id))).map((item) => ({ ...item, favoriteType: 'monument' })),
    route: data.routes.filter((item) => favoriteIds.route.includes(Number(item.id))).map((item) => ({ ...item, favoriteType: 'route' })),
    event: data.events.filter((item) => favoriteIds.event.includes(Number(item.id))).map((item) => ({ ...item, favoriteType: 'event' })),
  }), [data, favoriteIds]);

  const allItems = useMemo(() => [...groups.monument, ...groups.route, ...groups.event], [groups]);
  const visibleItems = useMemo(() => {
    const source = activeType === 'all' ? allItems : groups[activeType];
    const normalized = query.trim().toLocaleLowerCase('tr-TR');
    if (!normalized) return source;
    return source.filter((item) => `${item.name || item.title} ${item.district || ''} ${item.venue || ''}`.toLocaleLowerCase('tr-TR').includes(normalized));
  }, [activeType, allItems, groups, query]);

  const removeFavorite = (type, id) => {
    setFavoriteIds((current) => {
      const nextIds = current[type].filter((itemId) => itemId !== Number(id));
      localStorage.setItem(storageKeys[type], JSON.stringify(nextIds));
      return { ...current, [type]: nextIds };
    });
  };

  const tabs = [
    { key: 'all', label: 'Tümü', count: allItems.length },
    { key: 'monument', label: 'Tarihi Eserler', count: groups.monument.length },
    { key: 'route', label: 'Kültürel Rotalar', count: groups.route.length },
    { key: 'event', label: 'Etkinlikler', count: groups.event.length },
  ];

  return <div className="favorites-page">
    <header className="favorites-header"><div><span><IconHeart size={14} /> KİŞİSEL KOLEKSİYON</span><h1>Favorilerim</h1><p>Beğendiğiniz eserleri, rotaları ve etkinlikleri tek bir yerde saklayın.</p></div><div className="favorites-total"><IconHeart size={20} /><span><strong>{allItems.length}</strong><small>Toplam favori</small></span></div></header>

    <section className="favorite-summary" aria-label="Favori özeti"><button type="button" className={activeType === 'monument' ? 'active' : ''} onClick={() => setActiveType('monument')}><IconMonument size={18} /><span><small>Tarihi Eser</small><strong>{groups.monument.length}</strong></span></button><button type="button" className={activeType === 'route' ? 'active' : ''} onClick={() => setActiveType('route')}><IconRoute size={18} /><span><small>Kültürel Rota</small><strong>{groups.route.length}</strong></span></button><button type="button" className={activeType === 'event' ? 'active' : ''} onClick={() => setActiveType('event')}><IconCalendar size={18} /><span><small>Etkinlik</small><strong>{groups.event.length}</strong></span></button></section>

    <section className="favorites-collection"><header><nav aria-label="Favori türleri">{tabs.map((tab) => <button type="button" key={tab.key} className={activeType === tab.key ? 'active' : ''} onClick={() => setActiveType(tab.key)}>{tab.label}<b>{tab.count}</b></button>)}</nav><label><IconSearch size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Favorilerde ara…" /></label></header>
      {loading ? <div className="favorites-state"><span /><strong>Favoriler yükleniyor…</strong></div> : error ? <div className="favorites-state error"><IconHeart size={34} /><strong>Favoriler yüklenemedi</strong><p>Lütfen daha sonra tekrar deneyin.</p></div> : visibleItems.length ? <div className="favorites-grid">{visibleItems.map((item) => <FavoriteCard key={`${item.favoriteType}-${item.id}`} item={item} onRemove={removeFavorite} />)}</div> : <div className="favorites-state empty"><div><IconHeart size={30} /></div><strong>{query ? 'Aramanızla eşleşen favori bulunamadı' : activeType === 'all' ? 'Henüz favoriniz bulunmuyor' : 'Bu bölümde henüz favoriniz yok'}</strong><p>{query ? 'Başka bir ad veya konum yazarak tekrar arayın.' : 'İlginizi çeken içeriklerdeki kalp simgesine dokunarak koleksiyonunuzu oluşturabilirsiniz.'}</p><Link to={activeType === 'route' ? '/kultur-rotalari' : activeType === 'event' ? '/etkinlikler' : '/tarihi-eserler'}>{activeType === 'route' ? 'Rotaları Keşfet' : activeType === 'event' ? 'Etkinlikleri Keşfet' : 'Tarihi Eserleri Keşfet'} <IconArrow size={13} /></Link></div>}
    </section>
  </div>;
}
