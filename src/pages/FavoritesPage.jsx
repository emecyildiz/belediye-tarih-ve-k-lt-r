import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  const max = Math.max(1, ...data.flatMap((item) => [item.monumentVisits, item.routeVisits, item.eventVisits]));
  const groupWidth = data.length ? 488 / data.length : 0;
  const series = [
    { key: 'monumentVisits', className: 'monument-bar' },
    { key: 'routeVisits', className: 'route-bar' },
    { key: 'eventVisits', className: 'event-bar' },
  ];
  return <svg className="profile-trend-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Aylık ziyaret istatistikleri">
    {[0, .25, .5, .75, 1].map((ratio) => <g key={ratio}><line x1="42" x2="540" y1={145 - ratio * 105} y2={145 - ratio * 105} /><text x="8" y={149 - ratio * 105}>{Math.round(max * ratio)}</text></g>)}
    {data.map((item, index) => <g key={item.label}>{series.map((entry, seriesIndex) => {
      const value = item[entry.key] || 0;
      const barHeight = value / max * 105;
      return <rect key={entry.key} className={entry.className} x={49 + index * groupWidth + seriesIndex * 12} y={145 - barHeight} width="9" height={barHeight} rx="2"><title>{item.label}: {value} ziyaret</title></rect>;
    })}<text className="month" x={61 + index * groupWidth} y="169">{item.label}</text></g>)}
  </svg>;
}

function favoriteGeoJSON(monuments) {
  return { type: 'FeatureCollection', features: monuments.filter((item) => Array.isArray(item.coordinates)).map((item) => ({ type: 'Feature', id: item.id, properties: { id: item.id, name: item.name, slug: item.slug, category: item.category, district: item.district }, geometry: { type: 'Point', coordinates: [item.coordinates[1], item.coordinates[0]] } })) };
}

function ProfileInfoPanel({ profile = {}, totalFavorites, visitedCount }) {
  const memberDate = profile.membershipDate ? new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${profile.membershipDate}T12:00:00`)) : '—';
  return <section className="profile-subpage"><header><span>HESAP BİLGİLERİ</span><h2>Profil Bilgilerim</h2><p>Profil bilgilerinizi ve hesap özetinizi buradan görüntüleyebilirsiniz.</p></header><div className="profile-info-layout"><div className="profile-avatar-card"><div><IconUser size={34} /></div><strong>{profile.displayName || 'TKMBS Kullanıcısı'}</strong><small>Kültürel miras gezgini</small><span>{totalFavorites} favori · {visitedCount} ziyaret</span></div><dl className="profile-info-fields"><div><dt>Ad Soyad</dt><dd>{profile.displayName || '—'}</dd></div><div><dt>E-posta</dt><dd>{profile.email || '—'}</dd></div><div><dt>İlçe</dt><dd>{profile.district || '—'}</dd></div><div><dt>Üyelik Tarihi</dt><dd>{memberDate}</dd></div></dl></div></section>;
}

function HistoryPanel({ overview }) {
  return <section className="profile-subpage"><header><span>ZİYARET GEÇMİŞİ</span><h2>Geçmişim</h2><p>Görüntülediğiniz içerikler ve aylık ziyaret dağılımınız.</p></header><div className="profile-history-layout"><section className="profile-history-chart"><header><h3>İçerik Türüne Göre Ziyaretlerim</h3><small>Son 7 ay</small></header><div className="profile-chart-legend"><span><i /> Tarihi eser</span><span><i /> Kültürel rota</span><span><i /> Etkinlik</span></div><TrendChart data={overview.visitTrend} /></section><section className="profile-history-list"><header><h3>Son Görüntülenenler</h3><small>{overview.recentViews?.length || 0} kayıt</small></header><div>{(overview.recentViews || []).map((item) => <Link to={item.href} key={`${item.type}-${item.id}`}><SafeImage src={getImageUrl(item.image)} alt={item.title} /><span><strong>{item.title}</strong><small><IconPin size={10} /> {item.district}</small><time>{new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(item.viewedAt))}</time></span><IconArrow size={13} /></Link>)}</div></section></div></section>;
}

const preferenceLabels = {
  eventReminders: ['Etkinlik hatırlatmaları', 'Favori etkinlikler yaklaşırken bildirim alın.'],
  routeSuggestions: ['Rota önerileri', 'İlgi alanlarınıza göre kültürel rota önerileri alın.'],
  favoriteUpdates: ['Favori içerik güncellemeleri', 'Favori eser ve rotalardaki değişikliklerden haberdar olun.'],
  weatherAlerts: ['Gezi hava durumu uyarıları', 'Planlanan geziler için hava koşulu uyarısı alın.'],
};

function SettingsPanel({ preferences, setPreferences, onSave, saveStatus }) {
  return <section className="profile-subpage"><header><span>KULLANICI TERCİHLERİ</span><h2>Ayarlar</h2><p>Bildirim ve içerik önerisi tercihlerinizi yönetin.</p></header><div className="profile-settings-card">{Object.entries(preferenceLabels).map(([key, labels]) => <label key={key}><span><strong>{labels[0]}</strong><small>{labels[1]}</small></span><input type="checkbox" checked={Boolean(preferences[key])} onChange={(event) => setPreferences((current) => ({ ...current, [key]: event.target.checked }))} /><i /></label>)}<footer><small>{saveStatus === 'saved' ? 'Tercihler kaydedildi.' : 'Bildirim tercihleriniz hesabınıza kaydedilir.'}</small><button type="button" onClick={onSave} disabled={saveStatus === 'saving'}>{saveStatus === 'saving' ? 'Kaydediliyor…' : 'Ayarları Kaydet'}</button></footer></div></section>;
}

export default function FavoritesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [data, setData] = useState({ monuments: [], routes: [], events: [] });
  const [favoriteIds, setFavoriteIds] = useState({ monument: [], route: [], event: [] });
  const [overview, setOverview] = useState({ visitedCount: 0, recentViews: [], visitTrend: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [preferences, setPreferences] = useState({});
  const [saveStatus, setSaveStatus] = useState('idle');

  useEffect(() => {
    let active = true;
    Promise.all([api.getMonuments(), api.getRoutes(), api.getEvents(), api.getFavorites(), api.getProfileOverview()])
      .then(([monuments, routes, events, favorites, profile]) => { if (active) { setData({ monuments: monuments || [], routes: routes || [], events: events || [] }); setFavoriteIds(favorites || {}); setOverview(profile || {}); setPreferences(profile?.preferences || {}); } })
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
  const activeTab = location.pathname.endsWith('/bilgiler') ? 'info' : location.pathname.endsWith('/gecmis') ? 'history' : location.pathname.endsWith('/ayarlar') ? 'settings' : 'favorites';

  const removeFavorite = async (type, id) => {
    const result = await api.toggleFavorite(type, id);
    if (result) setFavoriteIds((current) => ({ ...current, [type]: result.ids || [] }));
  };

  const savePreferences = async () => {
    setSaveStatus('saving');
    try {
      const saved = await api.updatePreferences(preferences);
      setPreferences(saved || preferences);
      setSaveStatus('saved');
      window.setTimeout(() => setSaveStatus('idle'), 2200);
    } catch {
      setSaveStatus('error');
    }
  };

  if (loading) return <div className="favorites-state"><span /><strong>Profil ve favoriler yükleniyor…</strong></div>;
  if (error) return <div className="favorites-state error"><IconHeart size={34} /><strong>Favoriler yüklenemedi</strong><p>Lütfen veri bağlantısını kontrol edin.</p></div>;

  return <div className="favorites-page profile-layout-page">
    <header className="profile-favorites-header"><div><h1>Profil</h1><p>Favorilerinizi, profil bilgilerinizi, geçmiş aktivitelerinizi ve tercihlerinizi yönetin.</p><nav aria-label="Profil bölümleri"><Link to="/profil" className={activeTab === 'favorites' ? 'active' : ''}><IconHeart size={14} /> Favorilerim</Link><Link to="/profil/bilgiler" className={activeTab === 'info' ? 'active' : ''}><IconUser size={14} /> Profil Bilgilerim</Link><Link to="/profil/gecmis" className={activeTab === 'history' ? 'active' : ''}><IconClock size={14} /> Geçmişim</Link><Link to="/profil/ayarlar" className={activeTab === 'settings' ? 'active' : ''}>⚙ Ayarlar</Link></nav></div><section className="profile-stat-cards"><article><IconHeart size={21} /><span><small>Toplam Favori</small><strong>{totalFavorites}</strong><b>İçerik</b></span></article><article><IconBookmark size={21} /><span><small>Geçmiş Ziyaret</small><strong>{overview.visitedCount || 0}</strong><b>İçerik</b></span></article></section></header>

    {activeTab === 'favorites' ? <div className="profile-favorites-grid"><main>
      <FavoriteStrip title="Favori Eserlerim" items={groups.monument} type="monument" onRemove={removeFavorite} allHref="/tarihi-eserler" />
      <FavoriteStrip title="Favori Rotalarım" items={groups.route} type="route" onRemove={removeFavorite} allHref="/kultur-rotalari" />
      <div className="profile-bottom-grid"><section className="profile-upcoming"><header><h2>Bekleyen Etkinliklerim</h2><Link to="/etkinlikler">Tümünü Gör <IconArrow size={10} /></Link></header><div>{upcomingEvents.length ? upcomingEvents.map((item) => <article key={item.id}><SafeImage src={getImageUrl(item.image)} alt={item.title} /><div className="profile-event-date"><strong>{new Date(`${item.date}T12:00:00`).getDate()}</strong><span>{new Intl.DateTimeFormat('tr-TR', { month: 'short' }).format(new Date(`${item.date}T12:00:00`))}</span></div><div><Link to={`/etkinlikler/${item.slug || item.id}`}>{item.title}</Link><small><IconPin size={10} /> {item.district}</small><span><IconClock size={10} /> {item.time} · {dateLabel(item.date)}</span></div></article>) : <p>Favori etkinliğiniz bulunmuyor.</p>}</div></section>
      <section className="profile-recent"><header><h2>Son Görüntülediklerim</h2><span>Son aktiviteler</span></header><div>{(overview.recentViews || []).map((item) => <Link to={item.href} key={`${item.type}-${item.id}`}><SafeImage src={getImageUrl(item.image)} alt={item.title} /><span><strong>{item.title}</strong><small><IconPin size={9} /> {item.district}</small><time>{new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short' }).format(new Date(item.viewedAt))}</time></span></Link>)}</div></section></div>
    </main><aside className="profile-side-column"><section className="profile-chart-card"><header><div><span>AYLIK ZİYARET İSTATİSTİKLERİ</span><h2>İçerik Türüne Göre Ziyaretlerim</h2></div><small>Son 7 ay</small></header><div className="profile-chart-legend"><span><i /> Tarihi eser</span><span><i /> Kültürel rota</span><span><i /> Etkinlik</span></div><TrendChart data={overview.visitTrend} /></section>
      <section className="profile-map-card"><header><div><span>FAVORİ KONUM DAĞILIMI</span><h2>Favori Konumlarım</h2></div><Link to="/harita">Haritada Aç <IconArrow size={10} /></Link></header><div className="profile-map"><OpenLayersMap geojson={mapData} fitToData cluster height="100%" onFeatureClick={(feature) => feature?.slug && navigate(`/tarihi-eserler/${feature.slug}`)} /></div><footer>{groups.monument.slice(0, 3).map((item) => <span key={item.id}><i style={{ background: item.id % 2 ? '#1768b2' : '#c9861b' }} /> {item.name}</span>)}</footer></section>
    </aside></div> : activeTab === 'info' ? <ProfileInfoPanel profile={overview.profile} totalFavorites={totalFavorites} visitedCount={overview.visitedCount || 0} /> : activeTab === 'history' ? <HistoryPanel overview={overview} /> : <SettingsPanel preferences={preferences} setPreferences={setPreferences} onSave={savePreferences} saveStatus={saveStatus} />}
  </div>;
}
