import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import api from '../services/api';
import SafeImage from '../components/common/SafeImage';
import OpenLayersMap from '../components/map/OpenLayersMap';
import { IconClock, IconPin, IconRoute, IconSearch } from '../components/common/Icons';
import { buildGoogleMapsDirectionsUrl } from '../utils/googleMaps';
import GoogleDirectionsButton from '../components/common/GoogleDirectionsButton';
import './RouteBuilderPage.css';

const ROUTE_DRAFT_KEY = 'tkmbs_route_builder_draft';
const TRAVEL_MODE = 'driving';

function formatMinutes(minutes = 0) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours ? `${hours} sa${rest ? ` ${rest} dk` : ''}` : `${rest} dk`;
}

export default function RouteBuilderPage() {
  const { loading: authLoading, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const sourceRoute = params.get('route');
  const sourceStops = params.get('stops');
  const savedRouteId = params.get('saved');
  const returnTo = `${location.pathname}${location.search}`;
  const [monuments, setMonuments] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [title, setTitle] = useState('Yeni Kültür Rotası');
  const [query, setQuery] = useState('');
  const [preview, setPreview] = useState(null);
  const [routingState, setRoutingState] = useState('idle');
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [persistedRouteId, setPersistedRouteId] = useState(null);
  const [savedSignature, setSavedSignature] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [mapType, setMapType] = useState('map');

  useEffect(() => {
    if (savedRouteId && authLoading) return undefined;
    if (savedRouteId && !user) {
      navigate(`/giris?returnTo=${encodeURIComponent(returnTo)}`, { replace: true });
      return undefined;
    }
    let active = true;
    Promise.all([api.getMonuments(), sourceRoute ? api.getRoute(sourceRoute) : Promise.resolve(null), savedRouteId ? api.getCustomRoute(savedRouteId) : Promise.resolve(null)])
      .then(([items, route, storedRoute]) => {
        if (!active) return;
        setMonuments(items);
        let draft = null;
        try {
          const storedDraft = JSON.parse(sessionStorage.getItem(ROUTE_DRAFT_KEY) || 'null');
          if (storedDraft?.returnTo === returnTo) draft = storedDraft;
          sessionStorage.removeItem(ROUTE_DRAFT_KEY);
        } catch {
          // Gizli/katı tarayıcı modlarında depolama kapalı olabilir.
        }

        if (storedRoute) {
          const storedIds = [...new Set((storedRoute.selectedIds || []).map(Number).filter(Number.isInteger))]
            .filter((id) => items.some((item) => item.id === id));
          const storedTitle = String(storedRoute.title || 'Kayıtlı Rotam');
          setTitle(storedTitle);
          setSelectedIds(storedIds);
          setPreview(storedRoute.preview || null);
          setPersistedRouteId(String(storedRoute.id));
          setSavedSignature(JSON.stringify([storedTitle.trim(), storedIds]));
        } else if (draft) {
          const draftIds = [...new Set((draft.selectedIds || []).map(Number).filter(Number.isInteger))];
          setTitle(String(draft.title || 'Yeni Kültür Rotası'));
          setSelectedIds(draftIds.filter((id) => items.some((item) => item.id === id)));
        } else if (route) {
          setTitle(`${route.title} - Kişisel Rotam`);
          setSelectedIds((route.stops || []).map((item) => item.monumentId));
        } else if (sourceStops) {
          const requestedIds = [...new Set(sourceStops.split(',').map(Number).filter(Number.isInteger))];
          setSelectedIds(requestedIds.filter((id) => items.some((item) => item.id === id)));
        }
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [authLoading, navigate, returnTo, savedRouteId, sourceRoute, sourceStops, user]);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      setRoutingState('loading');
      api.previewRoute({ stopIds: selectedIds, travelMode: TRAVEL_MODE, title })
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
  }, [selectedIds, title]);

  const selected = useMemo(() => selectedIds.map((id) => monuments.find((item) => item.id === id)).filter(Boolean), [selectedIds, monuments]);
  const currentSignature = useMemo(() => JSON.stringify([title.trim(), selectedIds]), [title, selectedIds]);
  const hasUnsavedChanges = persistedRouteId ? currentSignature !== savedSignature : selectedIds.length > 0;
  const googleMapsUrl = useMemo(() => buildGoogleMapsDirectionsUrl(selected), [selected]);
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
    setSaveError('');
    if (!user) {
      try {
        sessionStorage.setItem(ROUTE_DRAFT_KEY, JSON.stringify({ returnTo, title, selectedIds }));
      } catch {
        // Depolama kapalı olsa da kullanıcı giriş yapıp rota sayfasına dönebilir.
      }
      navigate(`/giris?returnTo=${encodeURIComponent(returnTo)}`);
      return;
    }

    setSaving(true);
    try {
      const payload = { title, selectedIds, travelMode: TRAVEL_MODE };
      const result = persistedRouteId
        ? await api.updateCustomRoute(persistedRouteId, payload)
        : await api.saveCustomRoute(payload);
      if (result) {
        setPersistedRouteId(String(result.id));
        setSavedSignature(JSON.stringify([result.title.trim(), result.selectedIds]));
        setTitle(result.title);
        setSelectedIds(result.selectedIds);
        setPreview(result.preview || preview);
        setSaved(true);
        if (!persistedRouteId) navigate(`/rota-olustur?saved=${encodeURIComponent(result.id)}`, { replace: true });
      }
    } catch (error) {
      setSaveError(error?.message || 'Rota kaydedilemedi. Lütfen tekrar deneyin.');
    } finally {
      setSaving(false);
    }
  };
  if (loading) return <div className="route-builder-state"><span /><strong>Rota oluşturucu hazırlanıyor…</strong></div>;

  return (
    <div className="route-builder-page">
      <nav className="route-builder-breadcrumb"><Link to="/">Ana Sayfa</Link><b>›</b><Link to="/kultur-rotalari">Kültürel Rotalar</Link><b>›</b><span>Rota Oluştur</span></nav>
      <header className="route-builder-header"><div><span>GEZİNİ PLANLA</span><h1>Kendi Rotanı Oluştur</h1><p>Görmek istediğiniz yerleri seçin, durak sırasını belirleyin ve gezi planınızı hazırlayın.</p></div><div className="route-builder-save-area"><div className="route-builder-actions"><button type="button" className="primary" onClick={saveRoute} disabled={!selectedIds.length || title.trim().length < 2 || authLoading || saving || (persistedRouteId && !hasUnsavedChanges)}>{saving ? 'Kaydediliyor…' : persistedRouteId && !hasUnsavedChanges ? 'Rotalarımda Kayıtlı ✓' : persistedRouteId ? 'Değişiklikleri Kaydet' : 'Rotalarıma Kaydet'}</button></div>{saved && !hasUnsavedChanges && <small className="route-builder-save-success">Değişiklikler hesabınıza kaydedildi.</small>}{saveError && <small className="route-builder-save-error" role="alert">{saveError}</small>}</div></header>

      <section className="route-builder-summary">
        <article><IconRoute size={18} /><div><small>Mesafe</small><strong>{preview?.distanceKm || 0} km</strong></div></article>
        <article><IconClock size={18} /><div><small>Yol süresi</small><strong>{formatMinutes(preview?.travelMinutes)}</strong></div></article>
        <article><IconPin size={18} /><div><small>Durak</small><strong>{selectedIds.length}</strong></div></article>
      </section>

      <section className="route-builder-layout">
        <aside className="route-builder-controls">
          <label className="builder-field"><span>Rota adı</span><input maxLength="120" value={title} onChange={(event) => { setTitle(event.target.value); setSaved(false); }} /></label>
          <div className="selected-stops"><header><div><span>SEÇİLEN DURAKLAR</span><strong>{selected.length}</strong></div><small>Sürükleme yerine oklarla sırala</small></header>{selected.length ? <ol>{selected.map((item, index) => <li key={item.id}><i>{index + 1}</i><SafeImage src={item.image} alt="" /><div><strong>{item.name}</strong><span>{item.district}</span></div><div className="stop-order-actions"><button type="button" onClick={() => moveStop(index, -1)} disabled={!index} aria-label="Yukarı taşı">↑</button><button type="button" onClick={() => moveStop(index, 1)} disabled={index === selected.length - 1} aria-label="Aşağı taşı">↓</button><button type="button" className="remove" onClick={() => toggleStop(item.id)} aria-label="Durağı kaldır">×</button></div></li>)}</ol> : <p className="builder-empty">Haritadaki işaretlerden veya aşağıdaki listeden durak ekleyin.</p>}</div>

          <div className="candidate-stops"><header><span>DURAK EKLE</span><label><IconSearch size={14} /><input placeholder="Eser ara…" value={query} onChange={(event) => setQuery(event.target.value)} /></label></header><div>{candidates.slice(0, 20).map((item) => <button type="button" key={item.id} onClick={() => toggleStop(item.id)}><SafeImage src={item.image} alt="" /><span><strong>{item.name}</strong><small>{item.district}</small></span><b>+</b></button>)}</div></div>
        </aside>

        <div className="route-builder-map"><header><div><span>CANLI ÖNİZLEME</span><h2>Haritadan durak seç</h2></div><div className="route-builder-map-help"><small>İşaretin üzerine gelerek mekânı inceleyebilir, tıklayarak rotaya ekleyebilirsiniz.</small>{selectedIds.length >= 2 && <b className={`routing-state ${routingState}`}>{routingState === 'loading' ? 'Yol hesaplanıyor…' : routingState === 'unavailable' ? 'Yol güzergâhı alınamadı' : 'Yol güzergâhı hazır'}</b>}</div></header><OpenLayersMap geojson={mapGeoJSON} routeMode fitToRouteOnce showFeatureTooltip mapType={mapType} onMapTypeChange={setMapType} onFeatureClick={(props) => props?.monumentId && toggleStop(props.monumentId)} height="690px" /></div>
      </section>
      <GoogleDirectionsButton href={googleMapsUrl} />
    </div>
  );
}
