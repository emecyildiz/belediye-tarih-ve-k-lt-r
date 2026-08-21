import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getImageUrl } from '../services/api';
import SafeImage from '../components/common/SafeImage';
import CategoryMarkerIcon from '../components/map/CategoryMarkerIcon';
import { IconArrow, IconFilter, IconHeart, IconMonument, IconPin } from '../components/common/Icons';
import './MonumentsPage.css';

const categoryLabels = { camii: 'Cami', kilise: 'Kilise', muze: 'Müze', han: 'Han', kale: 'Kale', kopru: 'Köprü', doga: 'Doğal Alan', diger: 'Diğer' };
const categoryColors = { camii: '#166534', kilise: '#7c3aed', muze: '#0369a1', han: '#b45309', kale: '#9f1239', kopru: '#0f766e', doga: '#15803d', diger: '#475569' };
const initialFilters = { district: 'tumu', categories: [], period: 'tumu', registration: 'tumu' };

function ViewIcon({ type }) {
  if (type === 'list') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>;
}

export default function MonumentsPage() {
  const [monuments, setMonuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draftFilters, setDraftFilters] = useState(initialFilters);
  const [filters, setFilters] = useState(initialFilters);
  const [sortBy, setSortBy] = useState('popular');
  const [view, setView] = useState('grid');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('tkmbs-favorite-monuments') || '[]'); }
    catch { return []; }
  });

  useEffect(() => {
    let active = true;
    api.getMonuments()
      .then((data) => { if (active) setMonuments(data || []); })
      .catch((error) => console.error('Veri yüklenirken hata:', error))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const districts = useMemo(() => [...new Set(monuments.map((item) => item.district).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'tr')), [monuments]);
  const periods = useMemo(() => [...new Set(monuments.map((item) => item.period).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'tr')), [monuments]);
  const categories = useMemo(() => [...new Set(monuments.map((item) => item.category).filter(Boolean))], [monuments]);
  const categoryCounts = useMemo(() => monuments.reduce((result, item) => {
    result[item.category] = (result[item.category] || 0) + 1;
    return result;
  }, {}), [monuments]);

  const visibleMonuments = useMemo(() => {
    const result = monuments.filter((item) => (
      (filters.district === 'tumu' || item.district === filters.district)
      && (!filters.categories.length || filters.categories.includes(item.category))
      && (filters.period === 'tumu' || item.period === filters.period)
      && (filters.registration === 'tumu' || item.registrationStatus === filters.registration)
    ));
    return [...result].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name, 'tr');
      if (sortBy === 'newest') return b.id - a.id;
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      return (b.reviewCount || b.rating || 0) - (a.reviewCount || a.rating || 0);
    });
  }, [monuments, filters, sortBy]);

  const updateFilter = (key, value) => {
    setDraftFilters((current) => ({ ...current, [key]: value }));
    setFilters((current) => ({ ...current, [key]: value }));
  };
  const toggleDraftCategory = (category) => {
    const toggle = (current) => ({ ...current, categories: current.categories.includes(category) ? current.categories.filter((item) => item !== category) : [...current.categories, category] });
    setDraftFilters(toggle);
    setFilters(toggle);
  };
  const applyFilters = () => { setFilters({ ...draftFilters, categories: [...draftFilters.categories] }); setFiltersOpen(false); };
  const clearFilters = () => { setDraftFilters(initialFilters); setFilters(initialFilters); setFiltersOpen(false); };
  const toggleFavorite = (id) => setFavorites((current) => {
    const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
    localStorage.setItem('tkmbs-favorite-monuments', JSON.stringify(next));
    return next;
  });

  return (
    <div className="monuments-page">
      <header className="monuments-header">
        <div className="monuments-heading">
          <span className="monuments-eyebrow"><IconMonument size={14} /> Kültürel miras arşivi</span>
          <h1>Tarihi Eserler</h1>
          <p>Hatay’ın binlerce yıllık tarihi ve kültürel mirasını keşfedin.</p>
        </div>
        <div className="monuments-toolbar">
          <span className="result-count"><strong>{visibleMonuments.length}</strong> eser gösteriliyor</span>
          <label className="sort-control"><span>Sırala</span><select value={sortBy} onChange={(event) => setSortBy(event.target.value)}><option value="popular">Popüler</option><option value="newest">En Yeni</option><option value="rating">Puana Göre</option><option value="name">Ada Göre</option></select></label>
          <div className="view-toggles" aria-label="Görünüm seçimi">
            {['grid', 'list'].map((type) => <button key={type} type="button" className={view === type ? 'active' : ''} onClick={() => setView(type)} aria-label={type === 'grid' ? 'Kart görünümü' : 'Liste görünümü'}><ViewIcon type={type} /></button>)}
          </div>
          <button type="button" className="mobile-monument-filter" onClick={() => setFiltersOpen(true)}><IconFilter size={15} /> Filtrele</button>
        </div>
      </header>

      <div className="monuments-body">
        {filtersOpen && <button type="button" className="monument-filter-backdrop" aria-label="Filtreleri kapat" onClick={() => setFiltersOpen(false)} />}
        <aside className={`monuments-filters ${filtersOpen ? 'open' : ''}`}>
          <div className="filter-panel-title"><div><IconFilter size={16} /><strong>Filtreler</strong></div><button type="button" onClick={() => setFiltersOpen(false)} aria-label="Filtreleri kapat">×</button></div>
          <label className="filter-select-group"><span><IconPin size={14} /> İlçe</span><select value={draftFilters.district} onChange={(event) => updateFilter('district', event.target.value)}><option value="tumu">Tüm İlçeler</option>{districts.map((district) => <option key={district} value={district}>{district}</option>)}</select></label>
          <fieldset className="filter-category-group">
            <legend><IconMonument size={14} /> Eser Türü</legend>
            <label className={!draftFilters.categories.length ? 'checked' : ''}><input type="checkbox" checked={!draftFilters.categories.length} onChange={() => updateFilter('categories', [])} /><span className="custom-check" /><b>Tüm Eserler</b><small>{monuments.length}</small></label>
            {categories.map((category) => <label key={category} className={draftFilters.categories.includes(category) ? 'checked' : ''}><input type="checkbox" checked={draftFilters.categories.includes(category)} onChange={() => toggleDraftCategory(category)} /><span className="custom-check" /><CategoryMarkerIcon category={category} color={categoryColors[category]} size={19} /><b>{categoryLabels[category] || category}</b><small>{categoryCounts[category] || 0}</small></label>)}
          </fieldset>
          <label className="filter-select-group"><span>Dönem</span><select value={draftFilters.period} onChange={(event) => updateFilter('period', event.target.value)}><option value="tumu">Tüm Dönemler</option>{periods.map((period) => <option key={period} value={period}>{period}</option>)}</select></label>
          <label className="filter-select-group"><span>Koruma Durumu</span><select value={draftFilters.registration} onChange={(event) => updateFilter('registration', event.target.value)}><option value="tumu">Tüm Durumlar</option><option value="Tescilli">Tescilli</option><option value="Aday">Aday</option></select></label>
          <button type="button" className="apply-filters-btn" onClick={applyFilters}>Filtreleri Uygula</button>
          <button type="button" className="clear-filters-btn" onClick={clearFilters}>Filtreleri Temizle</button>
        </aside>

        <main className="monuments-results">
          {loading ? <div className="monuments-state"><span className="monument-loader" /><strong>Eserler yükleniyor</strong></div> : visibleMonuments.length ? (
            <div className={`monuments-grid ${view === 'list' ? 'list-view' : ''}`}>
              {visibleMonuments.map((monument) => {
                const category = monument.category || 'diger';
                const isFavorite = favorites.includes(monument.id);
                return <article key={monument.id} className="monument-card">
                  <Link to={`/tarihi-eserler/${monument.slug}`} className="monument-card-image" aria-label={`${monument.name} detayları`}><SafeImage src={getImageUrl(monument.image)} alt={monument.name} /><span className="monument-category"><CategoryMarkerIcon category={category} color="currentColor" size={16} />{categoryLabels[category] || 'Eser'}</span></Link>
                  <button type="button" className={`monument-favorite ${isFavorite ? 'active' : ''}`} onClick={() => toggleFavorite(monument.id)} aria-label={isFavorite ? 'Favorilerden çıkar' : 'Favorilere ekle'} aria-pressed={isFavorite}><IconHeart size={19} /></button>
                  <div className="monument-card-content"><h2><Link to={`/tarihi-eserler/${monument.slug}`}>{monument.name}</Link></h2><div className="monument-meta"><span><IconPin size={13} />{monument.district || 'Hatay'}</span><i /><span>{categoryLabels[category] || 'Tarihi Eser'}</span></div><p>{monument.description || `${monument.name}, Hatay’ın korunması gereken kültürel miras değerlerinden biridir.`}</p><Link to={`/tarihi-eserler/${monument.slug}`} className="monument-detail-link">Detayları İncele <IconArrow size={14} /></Link></div>
                </article>;
              })}
            </div>
          ) : <div className="monuments-state empty"><IconMonument size={34} /><strong>Bu filtrelere uygun eser bulunamadı</strong><p>Filtreleri temizleyerek tüm eserleri yeniden görüntüleyebilirsiniz.</p><button type="button" onClick={clearFilters}>Filtreleri Temizle</button></div>}
        </main>
      </div>
    </div>
  );
}
