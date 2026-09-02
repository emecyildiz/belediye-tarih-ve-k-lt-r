import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api, { getImageUrl } from '../services/api';
import SafeImage from '../components/common/SafeImage';
import CategoryMarkerIcon from '../components/map/CategoryMarkerIcon';
import useFavoriteIds from '../hooks/useFavoriteIds';
import { useAuth } from '../auth/useAuth';
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
  const [searchParams, setSearchParams] = useSearchParams();
  const favoritesOnly = searchParams.get('favoriler') === '1';
  const { authenticated } = useAuth();
  const showFavoritesOnly = favoritesOnly && authenticated;
  const [monuments, setMonuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, totalItems: 0, hasNextPage: false });
  const [facets, setFacets] = useState({ districts: [], periods: [], categories: {}, totalItems: 0 });
  const [filters, setFilters] = useState(initialFilters);
  const [sortBy, setSortBy] = useState('popular');
  const [view, setView] = useState('grid');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [favorites, toggleFavorite] = useFavoriteIds('monument');
  const requestPage = (params) => showFavoritesOnly ? api.getFavoriteItems('monument', params) : api.getMonumentsPage(params);

  const loadPage = (page, append = false) => {
    if (append) setLoadingMore(true); else setLoading(true);
    return requestPage({
      page,
      pageSize: 9,
      sort: sortBy,
      district: filters.district,
      categories: filters.categories.join(','),
      period: filters.period,
      registration: filters.registration,
    }).then((data) => {
      setMonuments((current) => (append ? [...current, ...(data.items || [])] : (data.items || [])));
      setPagination(data.pagination || { page, totalItems: 0, hasNextPage: false });
      setFacets(data.facets || { districts: [], periods: [], categories: {}, totalItems: 0 });
    }).finally(() => { setLoading(false); setLoadingMore(false); });
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    requestPage({ page: 1, pageSize: 9, sort: sortBy, district: filters.district, categories: filters.categories.join(','), period: filters.period, registration: filters.registration })
      .then((data) => { if (active) { setMonuments(data.items || []); setPagination(data.pagination || {}); setFacets(data.facets || {}); } })
      .catch((error) => console.error('Veri yüklenirken hata:', error))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [showFavoritesOnly, filters, sortBy]);

  const toggleFavoritesOnly = () => {
    const next = new URLSearchParams(searchParams);
    if (favoritesOnly) next.delete('favoriler'); else next.set('favoriler', '1');
    setSearchParams(next);
  };

  const handleFavorite = async (id) => {
    const result = await toggleFavorite(id);
    if (showFavoritesOnly && !result?.favorited) {
      setMonuments((current) => current.filter((item) => Number(item.id) !== Number(id)));
      setPagination((current) => ({ ...current, totalItems: Math.max(0, Number(current.totalItems || 0) - 1) }));
    }
  };

  const districts = facets.districts || [];
  const periods = facets.periods || [];
  const categoryCounts = facets.categories || {};
  const categories = Object.keys(categoryCounts);
  const visibleMonuments = monuments;

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };
  const toggleDraftCategory = (category) => {
    const toggle = (current) => ({ ...current, categories: current.categories.includes(category) ? current.categories.filter((item) => item !== category) : [...current.categories, category] });
    setFilters(toggle);
  };
  const clearFilters = () => { setFilters(initialFilters); setFiltersOpen(false); };
  return (
    <div className="monuments-page">
      <header className="monuments-header">
        <div className="monuments-heading">
          <span className="monuments-eyebrow"><IconMonument size={14} /> Kültürel miras arşivi</span>
          <h1>Tarihi Eserler</h1>
          <p>Hatay’ın binlerce yıllık tarihi ve kültürel mirasını keşfedin.</p>
        </div>
        <div className="monuments-toolbar">
          <span className="result-count"><strong>{pagination.totalItems || 0}</strong> eser bulundu</span>
          <label className="sort-control"><span>Sırala</span><select value={sortBy} onChange={(event) => setSortBy(event.target.value)}><option value="popular">Popüler</option><option value="newest">En Yeni</option><option value="rating">Puana Göre</option><option value="name">Ada Göre</option></select></label>
          {authenticated && <button type="button" className={`favorites-only-filter ${showFavoritesOnly ? 'active' : ''}`} onClick={toggleFavoritesOnly} aria-pressed={showFavoritesOnly}><IconHeart size={17} /> Favorilerim</button>}
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
          <label className="filter-select-group"><span><IconPin size={14} /> İlçe</span><select value={filters.district} onChange={(event) => updateFilter('district', event.target.value)}><option value="tumu">Tüm İlçeler</option>{districts.map((district) => <option key={district} value={district}>{district}</option>)}</select></label>
          <fieldset className="filter-category-group">
            <legend><IconMonument size={14} /> Eser Türü</legend>
            <label className={!filters.categories.length ? 'checked' : ''}><input type="checkbox" checked={!filters.categories.length} onChange={() => updateFilter('categories', [])} /><span className="custom-check" /><b>Tüm Eserler</b><small>{facets.totalItems || 0}</small></label>
            {categories.map((category) => <label key={category} className={filters.categories.includes(category) ? 'checked' : ''}><input type="checkbox" checked={filters.categories.includes(category)} onChange={() => toggleDraftCategory(category)} /><span className="custom-check" /><CategoryMarkerIcon category={category} color={categoryColors[category]} size={19} /><b>{categoryLabels[category] || category}</b><small>{categoryCounts[category] || 0}</small></label>)}
          </fieldset>
          <label className="filter-select-group"><span>Dönem</span><select value={filters.period} onChange={(event) => updateFilter('period', event.target.value)}><option value="tumu">Tüm Dönemler</option>{periods.map((period) => <option key={period} value={period}>{period}</option>)}</select></label>
          <label className="filter-select-group"><span>Koruma Durumu</span><select value={filters.registration} onChange={(event) => updateFilter('registration', event.target.value)}><option value="tumu">Tüm Durumlar</option><option value="Tescilli">Tescilli</option><option value="Aday">Aday</option></select></label>
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
                  <button type="button" className={`monument-favorite ${isFavorite ? 'active' : ''}`} onClick={() => handleFavorite(monument.id)} aria-label={isFavorite ? 'Favorilerden çıkar' : 'Favorilere ekle'} aria-pressed={isFavorite}><IconHeart size={19} /></button>
                  <div className="monument-card-content"><h2><Link to={`/tarihi-eserler/${monument.slug}`}>{monument.name}</Link></h2><div className="monument-meta"><span><IconPin size={13} />{monument.district || 'Hatay'}</span><i /><span>{categoryLabels[category] || 'Tarihi Eser'}</span></div><p>{monument.description || `${monument.name}, Hatay’ın korunması gereken kültürel miras değerlerinden biridir.`}</p><Link to={`/tarihi-eserler/${monument.slug}`} className="monument-detail-link">Detayları İncele <IconArrow size={14} /></Link></div>
                </article>;
              })}
            </div>
          ) : <div className="monuments-state empty"><IconMonument size={34} /><strong>Bu filtrelere uygun eser bulunamadı</strong><p>Filtreleri temizleyerek tüm eserleri yeniden görüntüleyebilirsiniz.</p><button type="button" onClick={clearFilters}>Filtreleri Temizle</button></div>}
          {!loading && pagination.hasNextPage && <button type="button" className="page-load-more" disabled={loadingMore} onClick={() => loadPage(pagination.page + 1, true).catch((error) => console.error('Daha fazla eser yüklenemedi:', error))}>{loadingMore ? 'Yükleniyor…' : `Daha Fazla Eser Göster (${monuments.length}/${pagination.totalItems})`}</button>}
        </main>
      </div>
    </div>
  );
}
