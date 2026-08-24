import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import SafeImage from '../components/common/SafeImage';
import OpenLayersMap from '../components/map/OpenLayersMap';
import useDragScroll from '../hooks/useDragScroll';
import {
  IconArrow, IconCalendar, IconClock, IconHeart, IconInfo,
  IconMap, IconMonument, IconPin, IconRoute,
} from '../components/common/Icons';
import './HomePage.css';

const emptyData = { monuments: [], routes: [], events: [], geojson: null, content: null };
const quickActionIcons = { monument: IconMonument, route: IconRoute, map: IconMap, calendar: IconCalendar, heart: IconHeart, info: IconInfo };

function ScrollableSection({ title, to, linkText = 'Tümünü Gör', kind, children }) {
  const { ref: trackRef, dragProps } = useDragScroll('x');
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
      <div ref={trackRef} {...dragProps} className={'horizontal-card-track drag-scroll ' + kind}>{children}</div>
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
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);
  const [heroPaused, setHeroPaused] = useState(false);
  const [heroDragOffset, setHeroDragOffset] = useState(0);
  const heroTouchStart = useRef(null);
  const heroPointer = useRef(null);
  const suppressHeroClick = useRef(false);
  const eventScroll = useDragScroll('y');

  useEffect(() => {
    let active = true;
    Promise.all([api.getMonuments(), api.getRoutes(), api.getEvents(), api.getLocations(), api.getHomeContent()])
      .then(([monuments, routes, events, geojson, content]) => {
        if (active) setData({ monuments, routes, events, geojson, content });
      })
      .catch((error) => console.error('Ana sayfa verileri yüklenemedi:', error))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const heroSlides = data.content?.heroSlides || [];

  useEffect(() => {
    if (heroPaused || heroSlides.length < 2) return undefined;
    const timer = window.setInterval(() => setActiveHeroSlide((current) => (current + 1) % heroSlides.length), 6500);
    return () => window.clearInterval(timer);
  }, [heroPaused, heroSlides.length]);

  const moveHero = (direction) => {
    if (!heroSlides.length) return;
    setActiveHeroSlide((current) => (current + direction + heroSlides.length) % heroSlides.length);
  };

  const finishHeroSwipe = (clientX) => {
    if (heroTouchStart.current === null) return;
    const distance = clientX - heroTouchStart.current;
    if (Math.abs(distance) > 45) moveHero(distance < 0 ? 1 : -1);
    heroTouchStart.current = null;
  };

  const startHeroDrag = (event) => {
    if (event.pointerType === 'touch' || event.button !== 0 || event.target.closest('button')) return;
    heroPointer.current = { id: event.pointerId, startX: event.clientX };
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setHeroPaused(true);
  };

  const moveHeroDrag = (event) => {
    if (heroPointer.current?.id !== event.pointerId) return;
    const distance = event.clientX - heroPointer.current.startX;
    if (Math.abs(distance) > 4) suppressHeroClick.current = true;
    setHeroDragOffset(Math.max(-140, Math.min(140, distance)));
  };

  const endHeroDrag = (event) => {
    if (heroPointer.current?.id !== event.pointerId) return;
    const distance = event.clientX - heroPointer.current.startX;
    if (Math.abs(distance) > 45) moveHero(distance < 0 ? 1 : -1);
    heroPointer.current = null;
    setHeroDragOffset(0);
    setHeroPaused(false);
  };

  if (loading || !data.content) return <div className="loading">İçerikler hazırlanıyor…</div>;
  const sections = data.content.sections;
  const upcomingEvents = data.events
    .filter((item) => new Date(`${item.date}T23:59:59`).getTime() >= Date.now())
    .sort((first, second) => new Date(first.date) - new Date(second.date));

  return (
    <div className="home-page">
      <div className="home-dashboard-grid">
        <section className="home-primary-column">
          <article className={`home-hero ${heroPointer.current ? 'is-dragging' : ''}`} aria-roledescription="döngüsel vitrin" aria-label="Hatay kültürel miras vitrini" onMouseEnter={() => setHeroPaused(true)} onMouseLeave={() => setHeroPaused(false)} onFocus={() => setHeroPaused(true)} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setHeroPaused(false); }} onTouchStart={(event) => { heroTouchStart.current = event.touches[0].clientX; setHeroPaused(true); }} onTouchEnd={(event) => { finishHeroSwipe(event.changedTouches[0].clientX); setHeroPaused(false); }} onPointerDown={startHeroDrag} onPointerMove={moveHeroDrag} onPointerUp={endHeroDrag} onPointerCancel={endHeroDrag} onDragStart={(event) => event.preventDefault()} onClickCapture={(event) => { if (suppressHeroClick.current) { event.preventDefault(); event.stopPropagation(); suppressHeroClick.current = false; } }}>
            <div className="home-hero-track" style={{ transform: `translateX(calc(-${activeHeroSlide * 100}% + ${heroDragOffset}px))`, transition: heroPointer.current ? 'none' : undefined }}>
              {heroSlides.map((slide, index) => <div className="home-hero-slide" key={slide.id} aria-hidden={index !== activeHeroSlide}>
                <SafeImage className="home-hero-image" src={slide.image} alt={slide.placeName} />
                <div className="home-hero-shade" />
                <div className="home-hero-content">
                  <p>{slide.eyebrow}</p>
                  <h1>{slide.title}</h1>
                  <span>{slide.description}</span>
                  <Link className="hero-button" to={slide.actionHref} tabIndex={index === activeHeroSlide ? undefined : -1}>
                    {slide.actionLabel} <IconArrow size={15} />
                  </Link>
                </div>
                <div className="hero-caption"><strong>{slide.placeName}</strong><span>{slide.district}</span></div>
              </div>)}
            </div>
            {heroSlides.length > 1 && <><div className="hero-carousel-arrows"><button type="button" onClick={() => moveHero(-1)} aria-label="Önceki görsel">‹</button><button type="button" onClick={() => moveHero(1)} aria-label="Sonraki görsel">›</button></div><div className="hero-carousel-dots" aria-label="Vitrin görselleri">{heroSlides.map((slide, index) => <button type="button" key={slide.id} className={index === activeHeroSlide ? 'active' : ''} onClick={() => setActiveHeroSlide(index)} aria-label={`${index + 1}. görsel: ${slide.placeName}`} aria-current={index === activeHeroSlide ? 'true' : undefined} />)}</div></>}
          </article>

          <ScrollableSection title={sections.featuredMonuments.title} to={sections.featuredMonuments.href} linkText={sections.featuredMonuments.linkLabel} kind="monuments">
            {data.monuments.map((item) => <MonumentCard key={item.id} item={item} />)}
          </ScrollableSection>

          <ScrollableSection title={sections.popularRoutes.title} to={sections.popularRoutes.href} linkText={sections.popularRoutes.linkLabel} kind="routes">
            {data.routes.map((item) => <RouteCard key={item.id} item={item} />)}
          </ScrollableSection>
        </section>

        <aside className="home-side-column">
          <section className="home-map-card">
            <SimpleSectionTitle to={sections.map.href} linkText={sections.map.linkLabel}>{sections.map.title}</SimpleSectionTitle>
            <div className="home-map-frame">
              {data.geojson && <OpenLayersMap geojson={data.geojson} cluster />}
              <Link className="map-fullscreen-link" to="/harita">⛶ Tam Ekran</Link>
            </div>
          </section>

          <section className="home-events-card">
            <SimpleSectionTitle to={sections.events.href} linkText={sections.events.linkLabel}>{sections.events.title}</SimpleSectionTitle>
            <div ref={eventScroll.ref} {...eventScroll.dragProps} className="home-event-list drag-scroll drag-scroll-y" tabIndex="0" aria-label="Kaydırılabilir yaklaşan etkinlikler listesi">
              {upcomingEvents.map((item) => <EventRow key={item.id} item={item} />)}
            </div>
          </section>
        </aside>
      </div>

      <section className="home-quick-actions" aria-label="Hızlı bağlantılar">
        {data.content.quickActions.map((action) => { const ActionIcon = quickActionIcons[action.icon] || IconArrow; return <Link key={action.href} to={action.href}><ActionIcon size={23} /><span><strong>{action.title}</strong><small>{action.text}</small></span></Link>; })}
      </section>
    </div>
  );
}
