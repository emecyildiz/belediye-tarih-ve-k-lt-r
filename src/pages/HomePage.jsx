import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import SafeImage from '../components/common/SafeImage';
import OpenLayersMap from '../components/map/OpenLayersMap';
import {
  IconArrow, IconCalendar, IconClock, IconHeart, IconInfo,
  IconMap, IconMonument, IconPin, IconRoute,
} from '../components/common/Icons';
import './HomePage.css';

const emptyData = { monuments: [], routes: [], events: [], geojson: null };

function ScrollableSection({ title, to, linkText = 'Tümünü Gör', kind, children }) {
  const trackRef = useRef(null);
  const move = (direction) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * Math.max(track.clientWidth * 0.82, 260), behavior: 'smooth' });
  };

  return (
    <section className="home-section">
      <div className="home-section-title">
        <h2>{title}</h2>
        <div className="section-title-actions">
          <button type="button" onClick={() => move(-1)} aria-label={title + ' kartlarını sola kaydır'}>‹</button>
          <button type="button" onClick={() => move(1)} aria-label={title + ' kartlarını sağa kaydır'}>›</button>
          <Link to={to}>{linkText} <span>›</span></Link>
        </div>
      </div>
      <div ref={trackRef} className={'horizontal-card-track ' + kind}>{children}</div>
    </section>
  );
}

function MonumentCard({ item }) {
  return (
    <Link className="heritage-card" to={'/tarihi-eserler/' + item.slug}>
      <SafeImage src={item.image} alt={item.name} />
      <div className="heritage-card-body">
        <strong>{item.name}</strong>
        <span className="heritage-meta"><IconPin size={12} /> {item.district || 'Hatay'}</span>
        <div className="heritage-tags">
          <small>{item.categoryLabel || item.category || 'Tarihi Eser'}</small>
          {item.period && <small>{item.period}</small>}
        </div>
        <p>{item.shortDescription || item.description}</p>
      </div>
    </Link>
  );
}

function RouteCard({ item }) {
  return (
    <Link className="route-card" to={`/kultur-rotalari/${item.slug || item.id}`}>
      <SafeImage src={item.image} alt={item.title || item.name} />
      <div className="route-card-overlay">
        <strong>{item.title || item.name}</strong>
        <span><IconPin size={12} /> {item.stops || 6} Durak</span>
        <span><IconRoute size={12} /> {item.distance}</span>
        <span><IconClock size={12} /> {item.duration}</span>
      </div>
    </Link>
  );
}

function EventRow({ item }) {
  return (
    <Link className="home-event-row" to={`/etkinlikler/${item.slug || item.id}`}>
      <SafeImage src={item.image} alt={item.title} />
      <div>
        <strong>{item.title}</strong>
        <span><IconCalendar size={12} /> {item.dateLabel || item.dateStr || item.date}</span>
        <span><IconPin size={12} /> {item.district || item.location}</span>
      </div>
      <b>›</b>
    </Link>
  );
}

function SimpleSectionTitle({ children, to, linkText }) {
  return (
    <div className="home-section-title">
      <h2>{children}</h2>
      <Link to={to}>{linkText} <span>›</span></Link>
    </div>
  );
}

export default function HomePage() {
  const [data, setData] = useState(emptyData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([api.getMonuments(), api.getRoutes(), api.getEvents(), api.getLocations()])
      .then(([monuments, routes, events, geojson]) => {
        if (active) setData({ monuments, routes, events, geojson });
      })
      .catch((error) => console.error('Ana sayfa verileri yüklenemedi:', error))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  if (loading) return <div className="loading">İçerikler hazırlanıyor…</div>;
  const hero = data.monuments[0];
  const upcomingEvents = data.events
    .filter((item) => new Date(`${item.date}T23:59:59`).getTime() >= Date.now())
    .sort((first, second) => new Date(first.date) - new Date(second.date));

  return (
    <div className="home-page">
      <div className="home-dashboard-grid">
        <section className="home-primary-column">
          <article className="home-hero">
            <SafeImage className="home-hero-image" src={hero?.image} alt="" />
            <div className="home-hero-shade" />
            <div className="home-hero-content">
              <p>Hatay'ın</p>
              <h1>Kültürel Mirasını<br />Keşfedin</h1>
              <span>Tarihi eserleri keşfedin, rotalar oluşturun ve kültürel mirasımızı birlikte koruyalım.</span>
              <Link className="hero-button" to="/tarihi-eserler">
                Daha Fazla Keşfedin <IconArrow size={15} />
              </Link>
            </div>
            {hero && <div className="hero-caption"><strong>{hero.name}</strong><span>{hero.district}</span></div>}
          </article>

          <ScrollableSection title="Öne Çıkan Eserler" to="/tarihi-eserler" kind="monuments">
            {data.monuments.map((item) => <MonumentCard key={item.id} item={item} />)}
          </ScrollableSection>

          <ScrollableSection title="Popüler Rotalar" to="/kultur-rotalari" linkText="Tüm Rotalar" kind="routes">
            {data.routes.map((item) => <RouteCard key={item.id} item={item} />)}
          </ScrollableSection>
        </section>

        <aside className="home-side-column">
          <section className="home-map-card">
            <SimpleSectionTitle to="/harita" linkText="Haritayı Aç">Harita</SimpleSectionTitle>
            <div className="home-map-frame">
              {data.geojson && <OpenLayersMap geojson={data.geojson} cluster />}
              <Link className="map-fullscreen-link" to="/harita">⛶ Tam Ekran</Link>
            </div>
          </section>

          <section className="home-events-card">
            <SimpleSectionTitle to="/etkinlikler" linkText="Tümünü Gör">Yaklaşan Etkinlikler</SimpleSectionTitle>
            <div className="home-event-list" tabIndex="0" aria-label="Kaydırılabilir yaklaşan etkinlikler listesi">
              {upcomingEvents.map((item) => <EventRow key={item.id} item={item} />)}
            </div>
          </section>
        </aside>
      </div>

      <section className="home-quick-actions" aria-label="Hızlı bağlantılar">
        <Link to="/tarihi-eserler"><IconMonument size={23} /><span><strong>Eserleri İncele</strong><small>Tarihi miras arşivi</small></span></Link>
        <Link to="/kultur-rotalari"><IconRoute size={23} /><span><strong>Rotaları Keşfet</strong><small>Tematik gezi planları</small></span></Link>
        <Link to="/harita"><IconMap size={23} /><span><strong>Katmanlar</strong><small>Harita görünümü</small></span></Link>
        <Link to="/etkinlikler"><IconCalendar size={23} /><span><strong>Etkinlikler</strong><small>Kültür takvimi</small></span></Link>
        <Link to="/profil"><IconHeart size={23} /><span><strong>Profil & Favoriler</strong><small>Kaydettiğiniz içerikler</small></span></Link>
        <Link to="/hakkinda"><IconInfo size={23} /><span><strong>Proje Hakkında</strong><small>TKMBS bilgileri</small></span></Link>
      </section>
    </div>
  );
}
