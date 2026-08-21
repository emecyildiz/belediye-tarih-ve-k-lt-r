import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { getImageUrl } from '../services/api';
import SafeImage from '../components/common/SafeImage';
import OpenLayersMap from '../components/map/OpenLayersMap';
import { IconArrow, IconClock, IconInfo, IconMap, IconPin, IconRoute } from '../components/common/Icons';
import './RouteDetailPage.css';

function formatMinutes(minutes = 0) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} dk`;
  return rest ? `${hours} sa ${rest} dk` : `${hours} saat`;
}

export default function RouteDetailPage() {
  const { slug } = useParams();
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mapType, setMapType] = useState('map');

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.getRoute(slug)
      .then((data) => active && setRoute(data))
      .catch(() => active && setError('Rota bilgileri yüklenemedi.'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [slug]);

  if (loading) return <div className="route-detail-state"><span /><strong>Rota hazırlanıyor…</strong></div>;
  if (error || !route) return <div className="route-detail-state"><strong>{error || 'Rota bulunamadı.'}</strong><Link to="/kultur-rotalari">Rotalara dön</Link></div>;

  return (
    <div className="route-detail-page">
      <nav className="route-detail-breadcrumb"><Link to="/">Ana Sayfa</Link><b>›</b><Link to="/kultur-rotalari">Kültürel Rotalar</Link><b>›</b><span>{route.title}</span></nav>

      <header className="route-detail-header">
        <div><span>{route.categoryLabel || 'Kültürel Rota'}</span><h1>{route.title}</h1><p>{route.description}</p></div>
        <Link className="route-detail-create" to={`/rota-olustur?route=${route.slug}`}><IconRoute size={17} /> Bu Rotayı Düzenle</Link>
      </header>

      <section className="route-detail-summary">
        <div className="route-detail-hero"><SafeImage src={getImageUrl(route.image)} alt={route.title} /></div>
        <div className="route-detail-metrics">
          <article><IconRoute size={19} /><div><small>Toplam mesafe</small><strong>{route.distanceKm} km</strong></div></article>
          <article><IconClock size={19} /><div><small>Tahmini süre</small><strong>{formatMinutes(route.durationMinutes)}</strong></div></article>
          <article><IconPin size={19} /><div><small>Durak sayısı</small><strong>{route.stops?.length || 0} durak</strong></div></article>
          <article><IconMap size={19} /><div><small>Zorluk</small><strong>{route.difficultyLabel || route.difficulty}</strong></div></article>
        </div>
      </section>

      <section className="route-detail-grid">
        <div className="route-detail-map-card">
          <header><div><span>ROTA HARİTASI</span><h2>Duraklar ve güzergâh</h2></div><small>OpenLayers · EPSG:4326</small></header>
          <OpenLayersMap geojson={route.geojson} routeMode fitToData mapType={mapType} onMapTypeChange={setMapType} height="430px" />
          {route.cbs?.provider === 'mock-cbs' && <p className="route-estimate-note"><IconInfo size={15} /><span><strong>Demo CBS hesaplaması:</strong> Çizgi durakları doğrudan bağlar. Belediye yol ağı servisi bağlandığında güzergâh ve süre otomatik olarak gerçek yol verisine göre hesaplanır.</span></p>}
        </div>

        <aside className="route-stop-panel">
          <header><span>GEZİ PLANI</span><h2>Rota durakları</h2></header>
          <ol>
            {(route.stops || []).map((stop) => <li key={stop.monumentId}><i>{stop.order}</i><SafeImage src={stop.image} alt="" /><div><strong>{stop.name}</strong><span><IconPin size={11} /> {stop.district}</span><small>Önerilen ziyaret: {stop.visitMinutes} dk</small></div><Link to={`/tarihi-eserler/${stop.slug}`} aria-label={`${stop.name} detayını aç`}><IconArrow size={14} /></Link></li>)}
          </ol>
          {!route.stops?.length && <div className="route-empty-stops">Bu demo rotaya henüz durak atanmadı. Rota oluşturucudan durak ekleyebilirsiniz.</div>}
        </aside>
      </section>
    </div>
  );
}
