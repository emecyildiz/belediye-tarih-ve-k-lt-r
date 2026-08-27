import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import SafeImage from '../components/common/SafeImage';
import OpenLayersMap from '../components/map/OpenLayersMap';
import { IconClock, IconPin, IconRoute, IconSearch } from '../components/common/Icons';
import { buildGoogleMapsDirectionsUrl } from '../utils/googleMaps';
import './RouteBuilderPage.css';

const modes = [{ key: 'walking', label: 'Yürüyüş', icon: '🚶' }, { key: 'cycling', label: 'Bisiklet', icon: '🚲' }, { key: 'driving', label: 'Araç', icon: '🚗' }];

function formatMinutes(minutes = 0) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours ? `${hours} sa${rest ? ` ${rest} dk` : ''}` : `${rest} dk`;
}

export default function RouteBuilderPage() {
  const [params] = useSearchParams();
  const sourceRoute = params.get('route');
  const sourceStops = params.get('stops');
  const [monuments, setMonuments] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [title, setTitle] = useState('Yeni Kültür Rotası');
  const [travelMode, setTravelMode] = useState('walking');
  const [visitMinutes, setVisitMinutes] = useState(25);
  const [query, setQuery] = useState('');
  const [preview, setPreview] = useState(null);
  const [routingState, setRoutingState] = useState('idle');
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [mapType, setMapType] = useState('map');

  useEffect(() => {
    let active = true;
    Promise.all([api.getMonuments(), sourceRoute ? api.getRoute(sourceRoute) : Promise.resolve(null)])
      .then(([items, route]) => {
        if (!active) return;
        setMonuments(items);
        if (route) {
          setTitle(`${route.title} - Kopya`);
          setSelectedIds((route.stops || []).map((item) => item.monumentId));
          setTravelMode(route.travelMode || 'walking');
        } else if (sourceStops) {
          const requestedIds = [...new Set(sourceStops.split(',').map(Number).filter(Number.isInteger))];
          setSelectedIds(requestedIds.filter((id) => items.some((item) => item.id === id)));
        }
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [sourceRoute, sourceStops]);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      setRoutingState('loading');
      api.previewRoute({ stopIds: selectedIds, travelMode, visitMinutes: Number(visitMinutes), title })
        .then((data) => {
          if (!active) return;
          setPreview(data);
          setRoutingState(data?.cbs?.routingStatus === 'unavailable' ? 'unavailable' : 'ready');
        })
        .catch(() => {
          if (!active) return;
          setRoutingState('unavailable');
        });
    }, 180);
    return () => { active = false; clearTimeout(timer); };
  }, [selectedIds, travelMode, visitMinutes, title]);

  const selected = useMemo(() => selectedIds.map((id) => monuments.find((item) => item.id === id)).filter(Boolean), [selectedIds, monuments]);
  const googleMapsUrl = useMemo(() => buildGoogleMapsDirectionsUrl(selected, travelMode), [selected, travelMode]);
  const totalVisitMinutes = Math.max(0, Number(preview?.durationMinutes || 0) - Number(preview?.travelMinutes || 0));
  const candidates = useMemo(() => monuments.filter((item) => !selectedIds.includes(item.id) && item.name.toLocaleLowerCase('tr-TR').includes(query.toLocaleLowerCase('tr-TR'))), [monuments, selectedIds, query]);
  const mapGeoJSON = useMemo(() => ({
    type: 'FeatureCollection',
    features: [
      ...monuments.filter((item) => Array.isArray(item.coordinates)).map((item) => ({ type: 'Feature', id: item.id, properties: { id: item.id, monumentId: item.id, type: 'candidate', category: item.category, categoryLabel: item.categoryLabel, name: item.name, district: item.district, image: item.image, slug: item.slug }, geometry: { type: 'Point', coordinates: [item.coordinates[1], item.coordinates[0]] } })),
      ...(preview?.geojson?.features || []),
    ],
  }), [monuments, preview]);

  const toggleStop = (id) => setSelectedIds((current) => current.includes(Number(id)) ? current.filter((item) => item !== Number(id)) : [...current, Number(id)]);
  const moveStop = (index, direction) => setSelectedIds((current) => {
    const target = index + direction;
    if (target < 0 || target >= current.length) return current;
    const next = [...current];
    [next[index], next[target]] = [next[target], next[index]];
    return next;
  });
  const saveRoute = async () => {
    const result = await api.saveCustomRoute({ title, selectedIds, travelMode, visitMinutes, preview });
    if (result) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    }
  };
  if (loading) return <div className="route-builder-state"><span /><strong>Rota oluşturucu hazırlanıyor…</strong></div>;

  return (
    <div className="route-builder-page">
      <nav className="route-builder-breadcrumb"><Link to="/">Ana Sayfa</Link><b>›</b><Link to="/kultur-rotalari">Kültürel Rotalar</Link><b>›</b><span>Rota Oluştur</span></nav>
      <header className="route-builder-header"><div><span>GEZİNİ PLANLA</span><h1>Kendi Rotanı Oluştur</h1><p>Görmek istediğiniz yerleri seçin, durak sırasını belirleyin ve gezi planınızı hazırlayın.</p></div><div className="route-builder-actions">{googleMapsUrl && <a href={googleMapsUrl} target="_blank" rel="noreferrer">Google Haritalar</a>}<button type="button" className="primary" onClick={saveRoute} disabled={!selectedIds.length}>{saved ? 'Kaydedildi ✓' : 'Rotayı Kaydet'}</button></div></header>

      <section className="route-builder-summary">
        <article><IconRoute size={18} /><div><small>Mesafe</small><strong>{preview?.distanceKm || 0} km</strong></div></article>
        <article><IconClock size={18} /><div><small>Yol süresi</small><strong>{formatMinutes(preview?.travelMinutes)}</strong></div></article>
        <article><IconPin size={18} /><div><small>Ziyaret süresi</small><strong>{formatMinutes(totalVisitMinutes)}</strong></div></article>
        <article><IconClock size={18} /><div><small>Gezi toplamı</small><strong>{formatMinutes(preview?.durationMinutes)}</strong></div></article>
        <article><IconPin size={18} /><div><small>Durak</small><strong>{selectedIds.length}</strong></div></article>
      </section>

      <section className="route-builder-layout">
        <aside className="route-builder-controls">
          <label className="builder-field"><span>Rota adı</span><input value={title} onChange={(event) => setTitle(event.target.value)} /></label>
          <div className="builder-field"><span>Ulaşım türü</span><div className="travel-mode-row">{modes.map((mode) => <button type="button" key={mode.key} className={travelMode === mode.key ? 'active' : ''} onClick={() => setTravelMode(mode.key)}><i>{mode.icon}</i>{mode.label}</button>)}</div></div>
          <label className="builder-field"><span>Her durak için ziyaret süresi</span><select value={visitMinutes} onChange={(event) => setVisitMinutes(event.target.value)}><option value="15">15 dakika</option><option value="25">25 dakika</option><option value="40">40 dakika</option><option value="60">60 dakika</option></select></label>

          <div className="selected-stops"><header><div><span>SEÇİLEN DURAKLAR</span><strong>{selected.length}</strong></div><small>Sürükleme yerine oklarla sırala</small></header>{selected.length ? <ol>{selected.map((item, index) => <li key={item.id}><i>{index + 1}</i><SafeImage src={item.image} alt="" /><div><strong>{item.name}</strong><span>{item.district}</span></div><div className="stop-order-actions"><button type="button" onClick={() => moveStop(index, -1)} disabled={!index} aria-label="Yukarı taşı">↑</button><button type="button" onClick={() => moveStop(index, 1)} disabled={index === selected.length - 1} aria-label="Aşağı taşı">↓</button><button type="button" className="remove" onClick={() => toggleStop(item.id)} aria-label="Durağı kaldır">×</button></div></li>)}</ol> : <p className="builder-empty">Haritadaki işaretlerden veya aşağıdaki listeden durak ekleyin.</p>}</div>

          <div className="candidate-stops"><header><span>DURAK EKLE</span><label><IconSearch size={14} /><input placeholder="Eser ara…" value={query} onChange={(event) => setQuery(event.target.value)} /></label></header><div>{candidates.slice(0, 20).map((item) => <button type="button" key={item.id} onClick={() => toggleStop(item.id)}><SafeImage src={item.image} alt="" /><span><strong>{item.name}</strong><small>{item.district}</small></span><b>+</b></button>)}</div></div>
        </aside>

        <div className="route-builder-map"><header><div><span>CANLI ÖNİZLEME</span><h2>Haritadan durak seç</h2></div><div className="route-builder-map-help"><small>İşaretin üzerine gelerek mekânı inceleyebilir, tıklayarak rotaya ekleyebilirsiniz.</small>{selectedIds.length >= 2 && <b className={`routing-state ${routingState}`}>{routingState === 'loading' ? 'Yol hesaplanıyor…' : routingState === 'unavailable' ? 'Yol güzergâhı alınamadı' : 'Yol güzergâhı hazır'}</b>}</div></header><OpenLayersMap geojson={mapGeoJSON} routeMode fitToRouteOnce showFeatureTooltip mapType={mapType} onMapTypeChange={setMapType} onFeatureClick={(props) => props?.monumentId && toggleStop(props.monumentId)} height="690px" /></div>
      </section>
    </div>
  );
}
