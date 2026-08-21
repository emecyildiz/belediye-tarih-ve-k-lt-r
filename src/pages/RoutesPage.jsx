import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { getImageUrl } from '../services/api';
import SafeImage from '../components/common/SafeImage';
import { IconArrow, IconClock, IconFilter, IconHeart, IconPin, IconRoute } from '../components/common/Icons';
import './RoutesPage.css';

const categories = [
  { key: 'tarihi', label: 'Tarih ve Arkeoloji', color: '#7c3aed' },
  { key: 'doga', label: 'Doğa ve Macera', color: '#16815b' },
  { key: 'gastronomi', label: 'Gastronomi', color: '#d56a12' },
  { key: 'inanc', label: 'İnanç', color: '#1e65aa' },
];
const initialFilters = { categories: [], duration: 'tumu', difficulty: 'tumu', district: 'tumu' };

function ViewIcon({ type }) {
  if (type === 'list') return <svg viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>;
  return <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>;
}

function ThemeIcon({ category }) {
  const paths = {
    tarihi: <><path d="M3 21h18M5 18h14M7 18V9m5 9V9m5 9V9M4 9h16L12 3z" /></>,
    doga: <><path d="M5 19c11 1 15-6 14-15C10 5 4 10 5 19zM6 18c4-5 7-8 12-11M12 13v8" /></>,
    gastronomi: <><path d="M7 3v8M4 3v5c0 2 6 2 6 0V3M7 11v10M16 3v18M16 3c5 3 5 9 0 10" /></>,
    inanc: <><path d="M5 21h14M7 21V11h10v10M8 11c1-6 7-6 8 0M18 21V7h2v14M17 7h4M19 3v4" /></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[category] || paths.tarihi}</svg>;
}

function durationHours(value = '') {
  const normalized = value.toLocaleLowerCase('tr-TR');
  if (normalized.includes('yarım')) return 4;
  if (normalized.includes('gün')) return 8;
  const values = normalized.match(/\d+/g)?.map(Number) || [];
  return values.length > 1 ? (values[0] + values[1]) / 2 : values[0] || 0;
}

function durationGroup(value) {
  const hours = durationHours(value);
  if (hours <= 3) return 'kisa';
  if (hours < 8) return 'yarim';
  return 'tam';
}

export default function RoutesPage() {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState([]);
  const [monuments, setMonuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState(initialFilters);
  const [filters, setFilters] = useState(initialFilters);
  const [sortBy, setSortBy] = useState('recommended');
  const [view, setView] = useState('grid');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('tkmbs-favorite-routes') || '[]'); } catch { return []; }
  });

  useEffect(() => {
    let active = true;
    Promise.all([api.getRoutes(), api.getMonuments()])
      .then(([routeData, monumentData]) => { if (active) { setRoutes(routeData || []); setMonuments(monumentData || []); } })
      .catch((error) => console.error('Rotalar yüklenirken hata:', error))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const monumentIndex = useMemo(() => new Map(monuments.map((item) => [item.id, item])), [monuments]);
  const districts = useMemo(() => [...new Set(routes.map((item) => item.district).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'tr')), [routes]);
  const categoryCounts = useMemo(() => routes.reduce((result, item) => { result[item.category] = (result[item.category] || 0) + 1; return result; }, {}), [routes]);

  const visibleRoutes = useMemo(() => {
    const result = routes.filter((route) => (
      (!filters.categories.length || filters.categories.includes(route.category))
      && (filters.duration === 'tumu' || durationGroup(route.duration) === filters.duration)
      && (filters.difficulty === 'tumu' || route.difficulty === filters.difficulty)
      && (filters.district === 'tumu' || route.district === filters.district)
    ));
    return [...result].sort((a, b) => {
      if (sortBy === 'popular') return (b.stops || 0) - (a.stops || 0);
      if (sortBy === 'short') return durationHours(a.duration) - durationHours(b.duration);
      if (sortBy === 'long') return durationHours(b.duration) - durationHours(a.duration);
      if (sortBy === 'name') return a.title.localeCompare(b.title, 'tr');
      return a.id - b.id;
    });
  }, [routes, filters, sortBy]);

  const updateFilter = (key, value) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setFilters((current) => ({ ...current, [key]: value }));
  };
  const toggleCategory = (key) => {
    const toggle = (current) => ({ ...current, categories: current.categories.includes(key) ? current.categories.filter((item) => item !== key) : [...current.categories, key] });
    setDraft(toggle);
    setFilters(toggle);
  };
  const clearFilters = () => { setDraft(initialFilters); setFilters(initialFilters); setFiltersOpen(false); };
  const applyFilters = () => { setFilters({ ...draft, categories: [...draft.categories] }); setFiltersOpen(false); };
  const toggleFavorite = (id) => setFavorites((current) => {
    const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
    localStorage.setItem('tkmbs-favorite-routes', JSON.stringify(next));
    return next;
  });

  return (
    <div className="cultural-routes-page">
      <header className="cultural-routes-header">
        <div><span><IconRoute size={14} /> Tematik gezi rehberi</span><h1>Kültürel Rotalar</h1><p>Hatay’ın tarihini, doğasını ve mutfak kültürünü tematik güzergâhlarla keşfedin.</p></div>
        <div className="cultural-routes-tools"><strong>{visibleRoutes.length} rota</strong><label><small>Sırala</small><select value={sortBy} onChange={(event) => setSortBy(event.target.value)}><option value="recommended">Önerilen</option><option value="popular">En Popüler</option><option value="short">Süre: Kısa–Uzun</option><option value="long">Süre: Uzun–Kısa</option><option value="name">Ada Göre</option></select></label><div className="route-view-buttons">{['grid', 'list'].map((type) => <button key={type} type="button" className={view === type ? 'active' : ''} onClick={() => setView(type)} aria-label={type === 'grid' ? 'Kart görünümü' : 'Liste görünümü'}><ViewIcon type={type} /></button>)}</div><button type="button" className="mobile-route-filter" onClick={() => setFiltersOpen(true)}><IconFilter size={15} /> Filtrele</button></div>
      </header>

      <div className="cultural-routes-layout">
        {filtersOpen && <button type="button" className="route-filter-backdrop" aria-label="Filtreleri kapat" onClick={() => setFiltersOpen(false)} />}
        <aside className={`cultural-route-filters ${filtersOpen ? 'open' : ''}`}>
          <header><div><IconFilter size={16} /><strong>Filtrele</strong></div><button type="button" onClick={() => setFiltersOpen(false)} aria-label="Filtreleri kapat">×</button></header>
          <fieldset><legend>Rota Teması</legend><label className={!draft.categories.length ? 'selected' : ''}><input type="checkbox" checked={!draft.categories.length} onChange={() => updateFilter('categories', [])} /><i /><b>Tüm Rotalar</b><small>{routes.length}</small></label>{categories.map((item) => <label key={item.key} className={draft.categories.includes(item.key) ? 'selected' : ''}><input type="checkbox" checked={draft.categories.includes(item.key)} onChange={() => toggleCategory(item.key)} /><i /><span className="filter-theme-icon" style={{ color: item.color }}><ThemeIcon category={item.key} /></span><b>{item.label}</b><small>{categoryCounts[item.key] || 0}</small></label>)}</fieldset>
          <label className="route-filter-select"><span>Süre</span><select value={draft.duration} onChange={(event) => updateFilter('duration', event.target.value)}><option value="tumu">Tüm Süreler</option><option value="kisa">1–3 Saat</option><option value="yarim">Yarım Gün</option><option value="tam">Tam Gün</option></select></label>
          <label className="route-filter-select"><span>Zorluk Seviyesi</span><select value={draft.difficulty} onChange={(event) => updateFilter('difficulty', event.target.value)}><option value="tumu">Tüm Seviyeler</option><option value="kolay">Kolay</option><option value="orta">Orta</option><option value="zor">Zor</option></select></label>
          <label className="route-filter-select"><span>Başlangıç Noktası</span><select value={draft.district} onChange={(event) => updateFilter('district', event.target.value)}><option value="tumu">Tüm İlçeler</option>{districts.map((item) => <option value={item} key={item}>{item}</option>)}</select></label>
          <button type="button" className="route-filter-apply" onClick={applyFilters}>Filtreleri Uygula</button><button type="button" className="route-filter-clear" onClick={clearFilters}>Filtreleri Temizle</button>
        </aside>

        <main className="cultural-route-results">
          {loading ? <div className="route-page-state"><span /><strong>Rotalar yükleniyor</strong></div> : visibleRoutes.length ? <div className={`cultural-route-grid ${view === 'list' ? 'list' : ''}`}>{visibleRoutes.map((route) => {
            const category = categories.find((item) => item.key === route.category) || categories[0];
            const stopNames = (route.monumentIds || []).map((id) => monumentIndex.get(id)?.name).filter(Boolean);
            const favorite = favorites.includes(route.id);
            const openRoute = (event) => {
              if (event.target.closest('a, button')) return;
              navigate(`/kultur-rotalari/${route.slug}`);
            };
            return <article className="cultural-route-card" key={route.id} role="link" tabIndex="0" aria-label={`${route.title} rota detayını aç`} onClick={openRoute} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); navigate(`/kultur-rotalari/${route.slug}`); } }}>
              <div className="cultural-route-image"><SafeImage src={getImageUrl(route.image)} alt={route.title} /><span style={{ background: category.color }}><ThemeIcon category={route.category} /></span><button type="button" className={favorite ? 'active' : ''} onClick={() => toggleFavorite(route.id)} aria-label={favorite ? 'Favorilerden çıkar' : 'Favoriye ekle'}><IconHeart size={18} /></button></div>
              <div className="cultural-route-content"><div className="route-card-heading"><span>{route.categoryLabel || category.label}</span><small>{route.difficultyLabel || route.difficulty}</small></div><h2>{route.title}</h2><div className="route-stop-names"><IconPin size={13} />{stopNames.length ? stopNames.slice(0, 4).join(' · ') : `${route.district} başlangıç noktası`}</div><p>{route.description}</p><footer><div><span><IconClock size={13} />{route.duration}</span><span><IconRoute size={13} />{route.distance}</span><span>{route.stops || stopNames.length} durak</span></div><Link to={`/kultur-rotalari/${route.slug}`}>Detayları Gör <IconArrow size={13} /></Link></footer></div>
            </article>;
          })}</div> : <div className="route-page-state empty"><IconRoute size={34} /><strong>Bu filtrelere uygun rota bulunamadı</strong><button type="button" onClick={clearFilters}>Filtreleri Temizle</button></div>}
        </main>
      </div>

      <section className="custom-route-banner"><div className="custom-route-icon"><IconRoute size={25} /></div><div><h2>Kendi Rotanı Oluştur</h2><p>İlgini çeken durakları harita üzerinde bir araya getirerek kişisel gezi planını hazırla.</p></div><Link to="/rota-olustur">Haritadan Başla <IconArrow size={14} /></Link></section>
    </div>
  );
}
