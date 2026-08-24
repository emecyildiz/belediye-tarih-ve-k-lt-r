import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { getImageUrl } from '../services/api';
import SafeImage from '../components/common/SafeImage';
import OpenLayersMap from '../components/map/OpenLayersMap';
import { IconArrow, IconBookmark, IconCalendar, IconClock, IconHeart, IconMonument, IconPin, IconRoute, IconUser } from '../components/common/Icons';
import './FavoritesPage.css';

const kindConfig = {
  monument: { titleKey: 'name', href: (item) => `/tarihi-eserler/${item.slug}`, label: 'Tarihi Eser' },
  route: { titleKey: 'title', href: (item) => `/kultur-rotalari/${item.slug}`, label: 'Kültürel Rota' },
  event: { titleKey: 'title', href: (item) => `/etkinlikler/${item.slug || item.id}`, label: 'Etkinlik' },
};

function dateLabel(value) {
  if (!value) return 'Tarih açıklanacak';
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

function StripCard({ item, type, onRemove }) {
  const config = kindConfig[type];
  const title = item[config.titleKey];
  return <article className="profile-favorite-card">
    <Link to={config.href(item)}><SafeImage src={getImageUrl(item.image)} alt={title} /></Link>
    <button type="button" onClick={() => onRemove(type, item.id)} aria-label={`${title} favorilerden çıkar`}><IconHeart size={14} /></button>
    <div><small>{config.label}</small><h3><Link to={config.href(item)}>{title}</Link></h3><p><IconPin size={10} /> {item.district || 'Hatay'}</p>{type === 'route' && <span><IconClock size={10} /> {item.duration} <i>·</i> <IconRoute size={10} /> {item.distance}</span>}</div>
  </article>;
}

function FavoriteStrip({ title, items, type, onRemove, allHref }) {
  const trackRef = useRef(null);
  const scroll = (direction) => trackRef.current?.scrollBy({ left: direction * Math.max(300, trackRef.current.clientWidth * .78), behavior: 'smooth' });
  return <section className="favorite-strip-section"><header><h2>{title}</h2><div><Link to={allHref}>Tümünü Gör <IconArrow size={11} /></Link><button type="button" onClick={() => scroll(-1)} aria-label={`${title} listesini sola kaydır`}>‹</button><button type="button" onClick={() => scroll(1)} aria-label={`${title} listesini sağa kaydır`}>›</button></div></header><div className="favorite-strip-track" ref={trackRef}>{items.length ? items.map((item) => <StripCard key={item.id} item={item} type={type} onRemove={onRemove} />) : <p className="favorite-strip-empty">Bu bölümde henüz favoriniz yok.</p>}</div></section>;
}

function TrendChart({ data = [] }) {
  const width = 560;
  const height = 188;
  const max = Math.max(1, ...data.flatMap((item) => [item.pageViews, item.heritageVisits]));
  const step = data.length > 1 ? 480 / (data.length - 1) : 0;
  const point = (value, index) => `${48 + index * step},${145 - value / max * 105}`;
  return <svg className="profile-trend-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Aylık ziyaret istatistikleri">
    {[0, .25, .5, .75, 1].map((ratio) => <g key={ratio}><line x1="42" x2="540" y1={145 - ratio * 105} y2={145 - ratio * 105} /><text x="8" y={149 - ratio * 105}>{Math.round(max * ratio)}</text></g>)}
    {data.map((item, index) => <g key={item.label}><rect x={38 + index * step} y={145 - item.heritageVisits / max * 105} width="18" height={item.heritageVisits / max * 105} rx="3" /><text className="month" x={47 + index * step} y="169">{item.label}</text></g>)}
    <polyline points={data.map((item, index) => point(item.pageViews, index)).join(' ')} />
    {data.map((item, index) => <circle key={item.label} cx={48 + index * step} cy={145 - item.pageViews / max * 105} r="3.5" />)}
  </svg>;
}

function favoriteGeoJSON(monuments) {
  return { type: 'FeatureCollection', features: monuments.filter((item) => Array.isArray(item.coordinates)).map((item) => ({ type: 'Feature', id: item.id, properties: { id: item.id, name: item.name, slug: item.slug, category: item.category, district: item.district }, geometry: { type: 'Point', coordinates: [item.coordinates[1], item.coordinates[0]] } })) };
}

export default function FavoritesPage() {
  const navigate = useNavigate();
  const [data, setData] = useState({ monuments: [], routes: [], events: [] });
  const [favoriteIds, setFavoriteIds] = useState({ monument: [], route: [], event: [] });
  const [overview, setOverview] = useState({ visitedCount: 0, recentViews: [], visitTrend: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([api.getMonuments(), api.getRoutes(), api.getEvents(), api.getFavorites(), api.getProfileOverview()])
      .then(([monuments, routes, events, favorites, profile]) => { if (active) { setData({ monuments: monuments || [], routes: routes || [], events: events || [] }); setFavoriteIds(favorites || {}); setOverview(profile || {}); } })
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const groups = useMemo(() => ({
    monument: data.monuments.filter((item) => favoriteIds.monument?.includes(Number(item.id))),
    route: data.routes.filter((item) => favoriteIds.route?.includes(Number(item.id))),
    event: data.events.filter((item) => favoriteIds.event?.includes(Number(item.id))),
  }), [data, favoriteIds]);
  const totalFavorites = groups.monument.length + groups.route.length + groups.event.length;
  const mapData = useMemo(() => favoriteGeoJSON(groups.monument), [groups.monument]);
  const upcomingEvents = [...groups.event].sort((a, b) => String(a.date).localeCompare(String(b.date))).slice(0, 3);

  const removeFavorite = async (type, id) => {
    const result = await api.toggleFavorite(type, id);
    if (result) setFavoriteIds((current) => ({ ...current, [type]: result.ids || [] }));
  };

  if (loading) return <div className="favorites-state"><span /><strong>Profil ve favoriler yükleniyor…</strong></div>;
  if (error) return <div className="favorites-state error"><IconHeart size={34} /><strong>Favoriler yüklenemedi</strong><p>Lütfen veri bağlantısını kontrol edin.</p></div>;

  return <div className="favorites-page profile-layout-page">
    <header className="profile-favorites-header"><div><h1>Profil & Favoriler</h1><p>Favorilerinizi görüntüleyin, geçmiş aktivitelerinizi ve ziyaretlerinizi inceleyin.</p><nav aria-label="Profil bölümleri"><button type="button" className="active"><IconHeart size={14} /> Favorilerim</button><button type="button" title="Giriş sistemiyle etkinleşecek"><IconUser size={14} /> Profil Bilgilerim</button><button type="button" title="Giriş sistemiyle etkinleşecek"><IconClock size={14} /> Geçmişim</button><button type="button" title="Giriş sistemiyle etkinleşecek">⚙ Ayarlar</button></nav></div><section className="profile-stat-cards"><article><IconHeart size={21} /><span><small>Toplam Favori</small><strong>{totalFavorites}</strong><b>İçerik</b></span></article><article><IconBookmark size={21} /><span><small>Geçmiş Ziyaret</small><strong>{overview.visitedCount || 0}</strong><b>İçerik</b></span></article></section></header>

    <div className="profile-favorites-grid"><main>
      <FavoriteStrip title="Favori Eserlerim" items={groups.monument} type="monument" onRemove={removeFavorite} allHref="/tarihi-eserler" />
      <FavoriteStrip title="Favori Rotalarım" items={groups.route} type="route" onRemove={removeFavorite} allHref="/kultur-rotalari" />
      <div className="profile-bottom-grid"><section className="profile-upcoming"><header><h2>Bekleyen Etkinliklerim</h2><Link to="/etkinlikler">Tümünü Gör <IconArrow size={10} /></Link></header><div>{upcomingEvents.length ? upcomingEvents.map((item) => <article key={item.id}><SafeImage src={getImageUrl(item.image)} alt={item.title} /><div className="profile-event-date"><strong>{new Date(`${item.date}T12:00:00`).getDate()}</strong><span>{new Intl.DateTimeFormat('tr-TR', { month: 'short' }).format(new Date(`${item.date}T12:00:00`))}</span></div><div><Link to={`/etkinlikler/${item.slug || item.id}`}>{item.title}</Link><small><IconPin size={10} /> {item.district}</small><span><IconClock size={10} /> {item.time} · {dateLabel(item.date)}</span></div></article>) : <p>Favori etkinliğiniz bulunmuyor.</p>}</div></section>
      <section className="profile-recent"><header><h2>Son Görüntülediklerim</h2><span>Son aktiviteler</span></header><div>{(overview.recentViews || []).map((item) => <Link to={item.href} key={`${item.type}-${item.id}`}><SafeImage src={getImageUrl(item.image)} alt={item.title} /><span><strong>{item.title}</strong><small><IconPin size={9} /> {item.district}</small><time>{new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short' }).format(new Date(item.viewedAt))}</time></span></Link>)}</div></section></div>
    </main><aside className="profile-side-column"><section className="profile-chart-card"><header><div><span>KULLANICI İSTATİSTİKLERİ</span><h2>Ziyaret Geçmişim</h2></div><small>Son 7 ay</small></header><div className="profile-chart-legend"><span><i /> Sayfa görüntüleme</span><span><i /> Eser ziyareti</span></div><TrendChart data={overview.visitTrend} /></section>
      <section className="profile-map-card"><header><div><span>FAVORİ KONUM DAĞILIMI</span><h2>Favori Konumlarım</h2></div><Link to="/harita">Haritada Aç <IconArrow size={10} /></Link></header><div className="profile-map"><OpenLayersMap geojson={mapData} fitToData cluster height="100%" onFeatureClick={(feature) => feature?.slug && navigate(`/tarihi-eserler/${feature.slug}`)} /></div><footer>{groups.monument.slice(0, 3).map((item) => <span key={item.id}><i style={{ background: item.id % 2 ? '#1768b2' : '#c9861b' }} /> {item.name}</span>)}</footer></section>
    </aside></div>
  </div>;
}
