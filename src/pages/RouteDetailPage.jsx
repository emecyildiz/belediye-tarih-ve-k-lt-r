import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { getImageUrl } from '../services/api';
import SafeImage from '../components/common/SafeImage';
import OpenLayersMap from '../components/map/OpenLayersMap';
import useDragScroll from '../hooks/useDragScroll';
import { IconArrow, IconClock, IconMap, IconPin, IconRoute } from '../components/common/Icons';
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
  const [relatedRoutes, setRelatedRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mapType, setMapType] = useState('map');
  const { ref: relatedListRef, dragProps: relatedDragProps } = useDragScroll('x');
  const stopScroll = useDragScroll('y');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    Promise.all([api.getRoute(slug), api.getRoutes()])
      .then(([data, allRoutes]) => {
        if (!active) return;
        setRoute(data);
        setRelatedRoutes((allRoutes || [])
          .filter((item) => item.slug !== data.slug)
          .sort((first, second) => (
            Number(second.category === data.category) + Number(second.district === data.district)
            - Number(first.category === data.category) - Number(first.district === data.district)
          ))
          .slice(0, 10));
      })
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
        <div className="route-detail-hero">
          <SafeImage src={getImageUrl(route.image)} alt={route.title} />
          <div className="route-hero-info"><span><IconPin size={13} /> {route.district}</span><strong>{route.title}</strong><p>{route.description}</p></div>
        </div>
        <div className="route-detail-map-card">
          <OpenLayersMap geojson={route.geojson} routeMode fitToData mapType={mapType} onMapTypeChange={setMapType} height="342px" />
        </div>
      </section>

      <section className="route-detail-grid">
        <div className="route-detail-content-column">
          <section className="route-detail-metrics" aria-label="Rota özeti">
            <article><IconRoute size={18} /><div><small>Toplam mesafe</small><strong>{route.distanceKm} km</strong></div></article>
            <article><IconClock size={18} /><div><small>Tahmini süre</small><strong>{formatMinutes(route.durationMinutes)}</strong></div></article>
            <article><IconPin size={18} /><div><small>Durak sayısı</small><strong>{route.stops?.length || 0} durak</strong></div></article>
            <article><IconMap size={18} /><div><small>Zorluk</small><strong>{route.difficultyLabel || route.difficulty}</strong></div></article>
          </section>

          <div className="related-routes-panel">
            <header><div><span>KEŞFETMEYE DEVAM ET</span><h2>Yakındaki ve benzer rotalar</h2></div><div className="related-route-actions"><button type="button" aria-label="Önceki rotalar" onClick={() => relatedListRef.current?.scrollBy({ left: -250, behavior: 'smooth' })}>‹</button><button type="button" aria-label="Sonraki rotalar" onClick={() => relatedListRef.current?.scrollBy({ left: 250, behavior: 'smooth' })}>›</button><Link to="/kultur-rotalari">Tümü</Link></div></header>
            <div className="related-route-list drag-scroll" ref={relatedListRef} {...relatedDragProps}>{relatedRoutes.map((item) => <Link to={`/kultur-rotalari/${item.slug}`} key={item.id}><SafeImage src={item.image} alt="" /><div><span>{item.categoryLabel}</span><strong>{item.title}</strong><p><IconClock size={11} /> {item.duration}<b>·</b><IconRoute size={11} /> {item.distance}</p></div><IconArrow size={15} /></Link>)}</div>
          </div>
        </div>

        <aside className="route-stop-panel">
          <header><span>GEZİ PLANI</span><h2>Rota durakları</h2></header>
          <ol ref={stopScroll.ref} {...stopScroll.dragProps} className="drag-scroll drag-scroll-y">
            {(route.stops || []).map((stop) => <li key={stop.monumentId}><i>{stop.order}</i><SafeImage src={stop.image} alt="" /><div><strong>{stop.name}</strong><span><IconPin size={11} /> {stop.district}</span><small>Önerilen ziyaret: {stop.visitMinutes} dk</small></div><Link to={`/tarihi-eserler/${stop.slug}`} aria-label={`${stop.name} detayını aç`}><IconArrow size={14} /></Link></li>)}
          </ol>
          {!route.stops?.length && <div className="route-empty-stops">Bu rotaya henüz durak eklenmedi. Rota oluşturucudan durak ekleyebilirsiniz.</div>}
        </aside>
      </section>
    </div>
  );
}
