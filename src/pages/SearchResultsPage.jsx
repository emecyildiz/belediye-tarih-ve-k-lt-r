import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api, { getImageUrl } from '../services/api';
import SafeImage from '../components/common/SafeImage';
import { IconArrow, IconCalendar, IconClock, IconMonument, IconPin, IconRoute, IconSearch } from '../components/common/Icons';
import './SearchResultsPage.css';

const tabs = [
  { key: 'tumu', label: 'Tümü', count: 'totalItems' },
  { key: 'monument', label: 'Tarihi Eserler', count: 'monuments' },
  { key: 'route', label: 'Kültürel Rotalar', count: 'routes' },
  { key: 'event', label: 'Etkinlikler', count: 'events' },
];

const kindLabels = { monument: 'Tarihi Eser', route: 'Kültürel Rota', event: 'Etkinlik' };

function KindIcon({ kind }) {
  if (kind === 'route') return <IconRoute size={15} />;
  if (kind === 'event') return <IconCalendar size={15} />;
  return <IconMonument size={15} />;
}

export default function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q')?.trim() || '';
  const type = searchParams.get('type') || 'tumu';
  const [draft, setDraft] = useState(query);
  const [items, setItems] = useState([]);
  const [facets, setFacets] = useState({ monuments: 0, routes: 0, events: 0, totalItems: 0 });
  const [pagination, setPagination] = useState({ page: 1, totalItems: 0, hasNextPage: false });
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => setDraft(query), [query]);

  useEffect(() => {
    let active = true;
    if (!query) { setItems([]); setFacets({ monuments: 0, routes: 0, events: 0, totalItems: 0 }); return undefined; }
    setLoading(true);
    api.search({ q: query, type, page: 1, pageSize: 12 })
      .then((data) => { if (active) { setItems(data.items || []); setFacets(data.facets || {}); setPagination(data.pagination || {}); } })
      .catch((error) => console.error('Arama sonuçları yüklenemedi:', error))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [query, type]);

  const submit = (event) => {
    event.preventDefault();
    const value = draft.trim();
    setSearchParams(value ? { q: value, ...(type !== 'tumu' ? { type } : {}) } : {});
  };

  const selectType = (nextType) => setSearchParams({ q: query, ...(nextType !== 'tumu' ? { type: nextType } : {}) });
  const loadMore = () => {
    setLoadingMore(true);
    api.search({ q: query, type, page: pagination.page + 1, pageSize: 12 })
      .then((data) => { setItems((current) => [...current, ...(data.items || [])]); setPagination(data.pagination || {}); setFacets(data.facets || {}); })
      .catch((error) => console.error('Daha fazla arama sonucu yüklenemedi:', error))
      .finally(() => setLoadingMore(false));
  };

  return <div className="search-results-page">
    <header className="search-results-header"><span><IconSearch size={14} /> TKMBS genel arama</span><h1>Arama Sonuçları</h1><p>Tarihi eserleri, kültürel rotaları ve etkinlikleri tek noktadan bulun.</p><form onSubmit={submit}><IconSearch size={18} /><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Aramak istediğiniz içeriği yazın…" aria-label="Genel arama" /><button type="submit">Ara</button></form></header>
    {query ? <>
      <section className="search-summary"><div><strong>“{query}”</strong> için <b>{facets.totalItems || 0}</b> sonuç bulundu.</div><nav aria-label="Arama sonucu türleri">{tabs.map((tab) => <button type="button" key={tab.key} className={type === tab.key ? 'active' : ''} onClick={() => selectType(tab.key)}>{tab.label}<b>{facets[tab.count] || 0}</b></button>)}</nav></section>
      <main className="search-result-grid">{loading ? <div className="search-result-state"><span /><strong>Sonuçlar aranıyor…</strong></div> : items.length ? items.map((item) => <article key={`${item.kind}-${item.id}`}><Link className="search-result-image" to={item.href}><SafeImage src={getImageUrl(item.image)} alt={item.title} /><span><KindIcon kind={item.kind} /> {kindLabels[item.kind]}</span></Link><div className="search-result-content"><small>{item.categoryLabel}</small><h2><Link to={item.href}>{item.title}</Link></h2><div><span><IconPin size={12} /> {item.district || 'Hatay'}</span>{item.kind === 'event' && <span><IconClock size={12} /> {item.date} · {item.time}</span>}</div><p>{item.description || `${item.title} hakkında ayrıntılı bilgi.`}</p><Link to={item.href}>Ayrıntıları Gör <IconArrow size={13} /></Link></div></article>) : <div className="search-result-state empty"><IconSearch size={35} /><strong>Aramanızla eşleşen içerik bulunamadı</strong><p>Farklı veya daha kısa bir arama ifadesi deneyebilirsiniz.</p></div>}</main>
      {!loading && pagination.hasNextPage && <button type="button" className="page-load-more" disabled={loadingMore} onClick={loadMore}>{loadingMore ? 'Yükleniyor…' : `Daha Fazla Sonuç Göster (${items.length}/${pagination.totalItems})`}</button>}
    </> : <div className="search-result-state empty initial"><IconSearch size={40} /><strong>Aramaya başlayın</strong><p>Üstteki alana eser, rota, etkinlik, ilçe veya mekân adı yazabilirsiniz.</p></div>}
  </div>;
}
