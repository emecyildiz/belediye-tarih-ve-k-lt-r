import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import SafeImage from '../components/common/SafeImage';
import OpenLayersMap from '../components/map/OpenLayersMap';
import useFavoriteIds from '../hooks/useFavoriteIds';
import CategoryMarkerIcon from '../components/map/CategoryMarkerIcon';
import { IconHeart, IconPin, IconRoute } from '../components/common/Icons';
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
];

const categoryNames = {
  camii: 'Cami', kilise: 'Kilise', muze: 'Müze', han: 'Han',
  kale: 'Kale', kopru: 'Köprü', doga: 'Doğal Alan', diger: 'Tarihi Eser',
};

export default function MapPage() {
  const navigate = useNavigate();
  const [allGeojson, setAllGeojson] = useState(null);
  const [monuments, setMonuments] = useState([]);
  const [activeLayers, setActiveLayers] = useState(() => new Set(layers.map((item) => item.key)));
  const [district, setDistrict] = useState('tumu');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [mapType, setMapType] = useState('map');
  const [favorites, toggleFavoriteId] = useFavoriteIds('monument');
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    Promise.all([api.getLocations(), api.getMonuments()])
      .then(([geojson, items]) => {
        setAllGeojson(geojson);
        setMonuments(items || []);
        if (items?.length) setSelectedLocation(items[0]);
      })
      .catch((error) => console.error('Harita verileri yüklenemedi:', error));
  }, []);

  const districts = useMemo(
    () => [...new Set(monuments.map((item) => item.district).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'tr')),
    [monuments],
  );

  const layerCounts = useMemo(() => monuments.reduce((counts, item) => {
    counts[item.category] = (counts[item.category] || 0) + 1;
    return counts;
  }, {}), [monuments]);

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
    const fullItem = monuments.find((item) => item.id === Number(properties.id));
    setSelectedLocation(fullItem || properties);
  };

  const toggleFavorite = () => selectedLocation && toggleFavoriteId(selectedLocation.id);

  const resetFilters = () => {
    setActiveLayers(new Set(layers.map((item) => item.key)));
    setDistrict('tumu');
  };

  return (
    <div className="heritage-map-page">
      <div className="heritage-map-canvas">
        {filteredGeojson ? (
          <OpenLayersMap
            geojson={filteredGeojson}
            mapType={mapType}
            onMapTypeChange={setMapType}
            onFeatureClick={selectFeature}
            showFeatureTooltip
          />
        ) : <div className="map-loading">Harita yükleniyor…</div>}
      </div>

      <button type="button" className="mobile-filter-toggle" onClick={() => setFiltersOpen((value) => !value)}>
        ☰ Harita Filtreleri
      </button>

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
          <div className="map-field">
            <span>Harita Görünümü</span>
            <div className="map-basemap-switch">
              <button type="button" className={mapType === 'map' ? 'active' : ''} onClick={() => setMapType('map')}>Harita</button>
              <button type="button" className={mapType === 'satellite' ? 'active' : ''} onClick={() => setMapType('satellite')}>Uydu</button>
            </div>
          </div>
          <button type="button" className="map-reset-button" onClick={resetFilters}>Filtreleri Temizle</button>
        </section>
      </aside>

      <section className={'map-legend-card ' + (selectedLocation ? 'detail-visible' : '')}>
        <strong>Gösterim</strong>
        {layers.map((layer) => (
          <span key={layer.key}><CategoryMarkerIcon category={layer.key} color={layer.color} size={17} />{layer.label}</span>
        ))}
      </section>

      <aside className={'map-detail-panel ' + (selectedLocation ? 'open' : '')}>
        {selectedLocation && (
          <>
            <div className="map-detail-top">
              <button type="button" onClick={() => setSelectedLocation(null)}>← Geri</button>
              <button type="button" className="map-detail-close" onClick={() => setSelectedLocation(null)} aria-label="Detayı kapat">×</button>
            </div>
            <SafeImage className="map-detail-image" src={selectedLocation.image} alt={selectedLocation.name} />
            <div className="map-detail-title">
              <h2>{selectedLocation.name}</h2>
              <span>{categoryNames[selectedLocation.category] || 'Eser'}</span>
            </div>
            <p className="map-detail-location"><IconPin size={14} /> {selectedLocation.district}</p>
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

    </div>
  );
}
