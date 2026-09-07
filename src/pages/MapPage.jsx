import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import SafeImage from '../components/common/SafeImage';
import OpenLayersMap from '../components/map/OpenLayersMap';
import useFavoriteIds from '../hooks/useFavoriteIds';
import CategoryMarkerIcon from '../components/map/CategoryMarkerIcon';
import { buildGoogleMapsDirectionsUrl } from '../utils/googleMaps';
import { IconCalendar, IconClock, IconHeart, IconPin, IconRoute } from '../components/common/Icons';
import './MapPage.css';

const layers = [
  { key: 'camii', label: 'Camiler', color: '#1e3a5f' },
  { key: 'kilise', label: 'Kiliseler', color: '#2563eb' },
  { key: 'muze', label: 'Müzeler', color: '#ea580c' },
  { key: 'han', label: 'Hanlar', color: '#7c3aed' },
  { key: 'kopru', label: 'Köprüler', color: '#0891b2' },
  { key: 'kale', label: 'Kaleler ve Surlar', color: '#64748b' },
  { key: 'doga', label: 'Doğal Güzellikler', color: '#16a34a' },
  { key: 'diger', label: 'Diğer Tarihi Eserler', color: '#94a3b8' },
  { key: 'event', label: 'Etkinlikler', color: '#dc3355' },
];

const placeLayerKeys = layers.filter((item) => item.key !== 'event').map((item) => item.key);

const categoryNames = {
  camii: 'Cami', kilise: 'Kilise', muze: 'Müze', han: 'Han',
  kale: 'Kale', kopru: 'Köprü', doga: 'Doğal Alan', diger: 'Tarihi Eser',
};

function formatRouteMinutes(minutes) {
  if (!Number.isFinite(Number(minutes))) return '—';
  const total = Number(minutes);
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  return hours ? `${hours} sa${rest ? ` ${rest} dk` : ''}` : `${rest} dk`;
}

function getLocationCoordinate(location) {
  const source = location?.coordinate || location?.coordinates;
  const latitude = Array.isArray(source) ? Number(source[0]) : Number(source?.latitude);
  const longitude = Array.isArray(source) ? Number(source[1]) : Number(source?.longitude);
  return Number.isFinite(latitude) && Number.isFinite(longitude) ? { latitude, longitude } : null;
}

function eventToFeature(event) {
  const coordinate = getLocationCoordinate(event);
  if (!coordinate) return null;
  return {
    type: 'Feature',
    id: `event-${event.id}`,
    properties: {
      id: `event-${event.id}`,
      eventId: event.id,
      name: event.title,
      category: 'event',
      categoryLabel: event.categoryLabel || 'Etkinlik',
      district: event.district,
      image: event.image,
      type: 'event',
    },
    geometry: { type: 'Point', coordinates: [coordinate.longitude, coordinate.latitude] },
  };
}

export default function MapPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const routeSlug = searchParams.get('route');
  const savedMapRouteId = searchParams.get('savedRoute');
  const locationReference = searchParams.get('location');
  const eventReference = searchParams.get('event');
  const [allGeojson, setAllGeojson] = useState(null);
  const [monuments, setMonuments] = useState([]);
  const [events, setEvents] = useState([]);
  const [activeLayers, setActiveLayers] = useState(() => new Set(layers.map((item) => item.key)));
  const [district, setDistrict] = useState('tumu');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [mapType, setMapType] = useState('map');
  const [favorites, toggleFavoriteId] = useFavoriteIds('monument');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [routeMode, setRouteMode] = useState(false);
  const [routeStopIds, setRouteStopIds] = useState([]);
  const [routePreview, setRoutePreview] = useState(null);
  const [routeStatus, setRouteStatus] = useState('idle');
  const [viewedRoute, setViewedRoute] = useState(null);

  useEffect(() => {
    const routeRequest = routeSlug ? api.getRoute(routeSlug) : savedMapRouteId ? api.getCustomRoute(savedMapRouteId) : Promise.resolve(null);
    const eventRequest = eventReference ? api.getEvent(eventReference) : Promise.resolve(null);
    Promise.all([api.getLocations(), api.getMonuments(), api.getEvents(), routeRequest, eventRequest])
      .then(([geojson, items, eventItems, requestedRoute, requestedEvent]) => {
        const mappedEvents = eventItems || [];
        const eventFeatures = mappedEvents.map(eventToFeature).filter(Boolean);
        setAllGeojson({
          type: 'FeatureCollection',
          features: [...(geojson?.features || []), ...eventFeatures],
        });
        setMonuments(items || []);
        setEvents(mappedEvents);
        if (requestedRoute) {
          const displayRoute = requestedRoute.selectedIds ? {
            ...(requestedRoute.preview || {}),
            ...requestedRoute,
            isCustom: true,
            stops: requestedRoute.selectedIds.map((id, index) => {
              const item = (items || []).find((monument) => Number(monument.id) === Number(id));
              return item ? { ...item, monumentId: Number(item.id), order: index + 1 } : null;
            }).filter(Boolean),
          } : requestedRoute;
          setViewedRoute(displayRoute);
          setRouteMode(true);
          setRouteStopIds((displayRoute.stops || []).map((item) => Number(item.monumentId)).filter(Number.isInteger));
          setRoutePreview(displayRoute);
          setRouteStatus(displayRoute?.cbs?.routingStatus === 'unavailable' ? 'unavailable' : 'ready');
          setSelectedLocation(null);
          setSelectedEvent(null);
        } else if (locationReference) {
          const requestedLocation = (items || []).find((item) => (
            String(item.slug) === locationReference || String(item.id) === locationReference
          ));
          if (requestedLocation) {
            setActiveLayers((current) => new Set(current).add(requestedLocation.category));
            setDistrict('tumu');
            setSelectedLocation(requestedLocation);
            setSelectedEvent(null);
          }
        } else if (requestedEvent) {
          setActiveLayers((current) => new Set(current).add('event'));
          setDistrict('tumu');
          setSelectedLocation(null);
          setSelectedEvent(requestedEvent);
        }
      })
      .catch((error) => console.error('Harita verileri yüklenemedi:', error));
  }, [routeSlug, savedMapRouteId, locationReference, eventReference]);

  useEffect(() => {
    if (!routeMode || viewedRoute) return undefined;
    let active = true;
    const timer = setTimeout(() => {
      setRouteStatus(routeStopIds.length >= 2 ? 'loading' : 'waiting');
      api.previewRoute({ stopIds: routeStopIds, travelMode: 'driving', title: 'Haritadan Oluşturulan Rota' })
        .then((data) => {
          if (!active) return;
          setRoutePreview(data);
          setRouteStatus(data?.cbs?.routingStatus === 'unavailable' ? 'unavailable' : (routeStopIds.length >= 2 ? 'ready' : 'waiting'));
        })
        .catch(() => {
          if (!active) return;
          setRouteStatus('unavailable');
        });
    }, 220);
    return () => { active = false; clearTimeout(timer); };
  }, [routeMode, routeStopIds, viewedRoute]);

  const districts = useMemo(
    () => [...new Set([...monuments, ...events].map((item) => item.district).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'tr')),
    [monuments, events],
  );

  const layerCounts = useMemo(() => monuments.reduce((counts, item) => {
    counts[item.category] = (counts[item.category] || 0) + 1;
    return counts;
  }, { event: events.length }), [monuments, events]);

  const allPlacesSelected = placeLayerKeys.every((key) => activeLayers.has(key));
  const contentFilter = activeLayers.size === 1 && activeLayers.has('event')
    ? 'events'
    : (!activeLayers.has('event') && activeLayers.size === placeLayerKeys.length && allPlacesSelected
      ? 'places'
      : (activeLayers.has('event') && activeLayers.size === layers.length && allPlacesSelected ? 'all' : 'custom'));

  const showContent = (type) => {
    if (type === 'events') setActiveLayers(new Set(['event']));
    else if (type === 'places') setActiveLayers(new Set(placeLayerKeys));
    else setActiveLayers(new Set(layers.map((item) => item.key)));
  };

  const filteredGeojson = useMemo(() => {
    if (!allGeojson) return null;
    return {
      ...allGeojson,
      features: allGeojson.features.filter((feature) => (
        activeLayers.has(feature.properties?.category)
        && (district === 'tumu' || feature.properties?.district === district)
      )),
    };
  }, [allGeojson, activeLayers, district]);

  const mapGeojson = useMemo(() => {
    if (!filteredGeojson) return null;
    let features = filteredGeojson.features;
    if (routeMode) {
      const selected = new Set(routeStopIds.map(Number));
      features = [
        ...features.filter((feature) => feature.properties?.category !== 'event' && !selected.has(Number(feature.properties?.id))),
        ...(routePreview?.geojson?.features || []),
      ];
    }
    return { type: 'FeatureCollection', features };
  }, [filteredGeojson, routeMode, routeStopIds, routePreview]);

  const routeStops = useMemo(() => routeStopIds
    .map((id) => monuments.find((item) => Number(item.id) === Number(id)))
    .filter(Boolean), [routeStopIds, monuments]);
  const googleMapsUrl = useMemo(() => buildGoogleMapsDirectionsUrl(routeStops), [routeStops]);

  const nearby = useMemo(() => {
    if (!selectedLocation) return [];
    return monuments
      .filter((item) => item.id !== selectedLocation.id)
      .sort((a, b) => Number(b.district === selectedLocation.district) - Number(a.district === selectedLocation.district))
      .slice(0, 3);
  }, [monuments, selectedLocation]);

  const toggleLayer = (key) => {
    setActiveLayers((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectFeature = (properties) => {
    if (properties.type === 'event' || properties.eventId) {
      const fullEvent = events.find((item) => Number(item.id) === Number(properties.eventId));
      setSelectedLocation(null);
      setSelectedEvent(fullEvent || selectedEvent);
      return;
    }
    const featureId = Number(properties.monumentId ?? properties.id);
    if (routeMode) {
      if (viewedRoute) {
        const fullItem = monuments.find((item) => item.id === featureId);
        setSelectedLocation(fullItem ? { ...fullItem, coordinate: properties.coordinate } : properties);
        return;
      }
      if (!Number.isInteger(featureId) || properties.type === 'route-line') return;
      setRouteStopIds((current) => current.includes(featureId)
        ? current.filter((id) => id !== featureId)
        : [...current, featureId]);
      setSelectedLocation(null);
      return;
    }
    const fullItem = monuments.find((item) => item.id === featureId);
    setSelectedEvent(null);
    setSelectedLocation(fullItem ? { ...fullItem, coordinate: properties.coordinate } : properties);
  };

  const startRouteMode = () => {
    setViewedRoute(null);
    setRouteMode(true);
    setSelectedLocation(null);
    setSelectedEvent(null);
    setFiltersOpen(false);
  };

  const closeRouteMode = () => {
    setRouteMode(false);
    setRouteStopIds([]);
    setRoutePreview(null);
    setRouteStatus('idle');
    if (viewedRoute) navigate('/harita', { replace: true });
    setViewedRoute(null);
  };

  const openDetailedRouteBuilder = () => {
    if (routeStopIds.length < 2) return;
    navigate(`/rota-olustur?stops=${routeStopIds.join(',')}`);
  };

  const toggleFavorite = () => selectedLocation && toggleFavoriteId(selectedLocation.id);

  const resetFilters = () => {
    setActiveLayers(new Set(layers.map((item) => item.key)));
    setDistrict('tumu');
  };

  const selectedCoordinate = getLocationCoordinate(selectedEvent || selectedLocation);
  const closeDetails = () => {
    setSelectedLocation(null);
    setSelectedEvent(null);
  };

  return (
    <div className={`heritage-map-page ${routeMode ? 'route-planning' : ''}`}>
      <div className="heritage-map-canvas">
        {filteredGeojson ? (
          <OpenLayersMap
            geojson={mapGeojson}
            mapType={mapType}
            onMapTypeChange={setMapType}
            onFeatureClick={selectFeature}
            showFeatureTooltip
            showCoordinates
            routeMode={routeMode}
            fitToRouteOnce={Boolean(viewedRoute)}
            focusCoordinate={(locationReference || eventReference) ? selectedCoordinate : null}
          />
        ) : <div className="map-loading">Harita yükleniyor…</div>}
      </div>

      <button type="button" className="mobile-filter-toggle" onClick={() => setFiltersOpen((value) => !value)}>
        ☰ Harita Filtreleri
      </button>

      {!routeMode && <button type="button" className="map-route-start" onClick={startRouteMode}><IconRoute size={18} /> Rota Oluştur</button>}

      <aside className={'map-control-panel ' + (filtersOpen ? 'mobile-open' : '')}>
        <header>
          <div>
            <h1>Harita</h1>
            <p>Hatay'ın tarihi ve kültürel mirasını harita üzerinde keşfedin.</p>
          </div>
          <button type="button" className="mobile-panel-close" onClick={() => setFiltersOpen(false)}>×</button>
        </header>

        <section className="map-control-section">
          <div className="map-control-heading">
            <div><h2>Katmanlar</h2><span>{filteredGeojson?.features.length || 0} kayıt gösteriliyor</span></div>
            <button type="button" onClick={() => setActiveLayers(new Set(layers.map((item) => item.key)))}>Tümünü seç</button>
          </div>
          <div className="map-content-switch" aria-label="Haritada gösterilecek içerik">
            <button type="button" className={contentFilter === 'all' ? 'active' : ''} onClick={() => showContent('all')}>Tümü</button>
            <button type="button" className={contentFilter === 'places' ? 'active' : ''} onClick={() => showContent('places')}>Mekânlar</button>
            <button type="button" className={contentFilter === 'events' ? 'active' : ''} onClick={() => showContent('events')}>Etkinlikler</button>
          </div>
          <div className="map-layer-list">
            {layers.map((layer) => (
              <label key={layer.key} className={activeLayers.has(layer.key) ? 'active' : ''}>
                <input
                  type="checkbox"
                  checked={activeLayers.has(layer.key)}
                  onChange={() => toggleLayer(layer.key)}
                />
                <span className="layer-icon"><CategoryMarkerIcon category={layer.key} color="#153a70" size={18} /></span>
                <span className="layer-name"><strong>{layer.label}</strong><small>{layerCounts[layer.key] || 0}</small></span>
                <span className="layer-chevron">⌄</span>
              </label>
            ))}
          </div>
        </section>

        <section className="map-control-section">
          <h2>Filtrele</h2>
          <label className="map-field">
            <span>İlçe</span>
            <select value={district} onChange={(event) => setDistrict(event.target.value)}>
              <option value="tumu">Tüm İlçeler</option>
              {districts.map((item) => <option value={item} key={item}>{item}</option>)}
            </select>
          </label>
          <button type="button" className="map-reset-button" onClick={resetFilters}>Filtreleri Temizle</button>
        </section>
      </aside>

      <section className={'map-legend-card ' + (selectedLocation || selectedEvent || routeMode ? 'detail-visible' : '')}>
        <strong>Gösterim</strong>
        {layers.map((layer) => (
          <span key={layer.key}><CategoryMarkerIcon category={layer.key} color={layer.color} size={17} />{layer.label}</span>
        ))}
      </section>

      <aside className={'map-detail-panel ' + (selectedLocation || selectedEvent ? 'open' : '')}>
        {selectedEvent && (
          <>
            <div className="map-detail-top">
              <button type="button" onClick={closeDetails}>← Geri</button>
              <button type="button" className="map-detail-close" onClick={closeDetails} aria-label="Detayı kapat">×</button>
            </div>
            <SafeImage className="map-detail-image" src={selectedEvent.image} alt={selectedEvent.title} />
            <div className="map-detail-title map-event-detail-title">
              <h2>{selectedEvent.title}</h2>
              <span>Etkinlik</span>
            </div>
            <p className="map-detail-location"><IconPin size={14} /> {selectedEvent.venue} · {selectedEvent.district}</p>
            {selectedCoordinate && <div className="map-detail-coordinates" aria-label="Etkinlik konum koordinatları">
              <span><small>Enlem</small><strong>{selectedCoordinate.latitude.toFixed(6)}</strong></span>
              <span><small>Boylam</small><strong>{selectedCoordinate.longitude.toFixed(6)}</strong></span>
            </div>}
            <div className="map-detail-meta map-event-detail-meta">
              <span><small><IconCalendar size={13} /> Tarih</small><strong>{selectedEvent.dateLabel || selectedEvent.date}</strong></span>
              <span><small><IconClock size={13} /> Saat</small><strong>{selectedEvent.time || 'Açıklanacak'}</strong></span>
            </div>
            <p className="map-detail-description">{selectedEvent.description}</p>
            <div className="map-detail-actions">
              <button type="button" className="primary" onClick={() => navigate(`/etkinlikler/${selectedEvent.slug || selectedEvent.id}`)}>
                <IconCalendar size={16} /> Etkinlik Ayrıntıları
              </button>
            </div>
          </>
        )}
        {selectedLocation && (
          <>
            <div className="map-detail-top">
              <button type="button" onClick={closeDetails}>← Geri</button>
              <button type="button" className="map-detail-close" onClick={closeDetails} aria-label="Detayı kapat">×</button>
            </div>
            <SafeImage className="map-detail-image" src={selectedLocation.image} alt={selectedLocation.name} />
            <div className="map-detail-title">
              <h2>{selectedLocation.name}</h2>
              <span>{categoryNames[selectedLocation.category] || 'Eser'}</span>
            </div>
            <p className="map-detail-location"><IconPin size={14} /> {selectedLocation.district}</p>
            {selectedCoordinate && <div className="map-detail-coordinates" aria-label="Konum koordinatları">
              <span><small>Enlem</small><strong>{selectedCoordinate.latitude.toFixed(6)}</strong></span>
              <span><small>Boylam</small><strong>{selectedCoordinate.longitude.toFixed(6)}</strong></span>
            </div>}
            <div className="map-detail-meta">
              <span><small>Dönem</small><strong>{selectedLocation.century || selectedLocation.period || 'Bilinmiyor'}</strong></span>
              <span><small>Koruma</small><strong>{selectedLocation.protectionStatus || 'Kayıtlı'}</strong></span>
            </div>
            <p className="map-detail-description">{selectedLocation.description}</p>
            <div className="map-detail-actions">
              <button type="button" className="primary" onClick={toggleFavorite}>
                <IconHeart size={16} /> {favorites.includes(selectedLocation.id) ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}
              </button>
              <button type="button" onClick={() => navigate(`/rota-olustur?stops=${selectedLocation.id}`)}><IconRoute size={16} /> Rota Oluştur</button>
            </div>
            <section className="map-nearby">
              <h3>Yakındaki Diğer Eserler</h3>
              {nearby.map((item) => (
                <button type="button" key={item.id} onClick={() => setSelectedLocation(item)}>
                  <SafeImage src={item.image} alt={item.name} />
                  <span><strong>{item.name}</strong><small><IconPin size={11} /> {item.district}</small></span>
                  <b>{item.distance || '—'}</b>
                </button>
              ))}
            </section>
          </>
        )}
      </aside>

      {routeMode && <section className={`map-route-planner ${viewedRoute ? 'route-view-only' : ''}`} aria-label={viewedRoute ? 'Seçili rota bilgisi' : 'Haritadan rota oluşturma'}>
        <div className="map-route-planner-heading">
          <div><span>{viewedRoute ? 'SEÇİLİ KÜLTÜREL ROTA' : 'GEZİ PLANIM'}</span><strong>{viewedRoute?.title || (routeStopIds.length ? `${routeStopIds.length} durak seçildi` : 'Haritadaki mekânları seçin')}</strong></div>
          <button type="button" onClick={closeRouteMode} aria-label="Rota oluşturmayı kapat">×</button>
        </div>
        <div className="map-route-stops">
          {routeStops.map((stop, index) => viewedRoute
            ? <span className="map-route-readonly-stop" key={stop.id}><i>{index + 1}</i><span>{stop.name}</span></span>
            : <button type="button" key={stop.id} onClick={() => setRouteStopIds((current) => current.filter((id) => id !== stop.id))} title="Duraktan çıkar"><i>{index + 1}</i><span>{stop.name}</span><b>×</b></button>)}
          {!routeStops.length && <p>İşaretlere dokunarak veya tıklayarak ilk durağınızı ekleyin.</p>}
        </div>
        <div className="map-route-summary">
          <span><small>Mesafe</small><strong>{routePreview?.distanceKm ?? '—'} {routePreview?.distanceKm != null ? 'km' : ''}</strong></span>
          <span><small>Yol süresi</small><strong>{formatRouteMinutes(routePreview?.travelMinutes)}</strong></span>
          <em className={routeStatus}>{routeStatus === 'loading' ? 'Yol hesaplanıyor…' : routeStatus === 'unavailable' ? 'Yol güzergâhı alınamadı' : routeStatus === 'ready' ? 'Gerçek yol güzergâhı hazır' : 'En az iki durak seçin'}</em>
          {!viewedRoute && <button type="button" className="map-route-clear" disabled={!routeStopIds.length} onClick={() => setRouteStopIds([])}>Temizle</button>}
          {googleMapsUrl && <a className="map-route-google" href={googleMapsUrl} target="_blank" rel="noreferrer">Google Haritalar’da Yol Tarifi</a>}
          {viewedRoute
            ? <button type="button" className="map-route-continue" onClick={() => navigate(viewedRoute.isCustom ? `/rota-olustur?saved=${encodeURIComponent(viewedRoute.id)}` : `/rota-olustur?route=${encodeURIComponent(viewedRoute.slug)}`)}>{viewedRoute.isCustom ? 'Rotayı Düzenle →' : 'Bu Rotayı Özelleştir →'}</button>
            : <button type="button" className="map-route-continue" disabled={routeStopIds.length < 2 || routeStatus === 'loading'} onClick={openDetailedRouteBuilder}>Ayrıntılı Düzenle →</button>}
        </div>
      </section>}

    </div>
  );
}
