import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { getImageUrl } from '../services/api';
import SafeImage from '../components/common/SafeImage';
import OpenLayersMap from '../components/map/OpenLayersMap';
import useFavoriteIds from '../hooks/useFavoriteIds';
import { IconArrow, IconCalendar, IconClock, IconHeart, IconInfo, IconPin } from '../components/common/Icons';
import './EventDetailPage.css';

const categoryColors = { festival: '#7c3aed', sanat: '#d43c55', kultur: '#16815b', gezi: '#167f8f', atolye: '#d56a12', konferans: '#2468ad', sergi: '#a55716' };

function DetailIcon({ name, size = 16 }) {
  const paths = {
    share: <><circle cx="18" cy="5" r="2" /><circle cx="6" cy="12" r="2" /><circle cx="18" cy="19" r="2" /><path d="m8 11 8-5M8 13l8 5" /></>,
    ticket: <><path d="M4 7h16v3a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4z" /><path d="M12 7v10" /></>,
    users: <><circle cx="9" cy="8" r="3" /><path d="M3 20v-2a5 5 0 0 1 10 0v2M16 11a3 3 0 0 0 0-6M15 14a5 5 0 0 1 6 4v2" /></>,
    building: <><path d="M4 21V7l8-4 8 4v14M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01M9 21v-3h6v3" /></>,
    phone: <path d="M5 3h4l2 5-3 2a15 15 0 0 0 6 6l2-3 5 2v4a2 2 0 0 1-2 2C10 21 3 14 3 5a2 2 0 0 1 2-2z" />,
    accessibility: <><circle cx="12" cy="4" r="2" /><path d="M9 8h6l-1 5h3l3 7M10 10l-2 5M8 15a4 4 0 1 0 6 3" /></>,
    external: <><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 13v6H5V6h6" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.share}</svg>;
}

function parseEventDate(event) {
  if (!event?.date) return null;
  const value = new Date(`${event.date}T${event.time || '12:00'}:00`);
  return Number.isNaN(value.getTime()) ? null : value;
}

function dateInfo(event) {
  const value = parseEventDate(event);
  if (!value) return { day: '--', month: '', full: event?.dateLabel || 'Tarih açıklanacak', weekday: '' };
  return {
    day: String(value.getDate()).padStart(2, '0'),
    month: new Intl.DateTimeFormat('tr-TR', { month: 'short' }).format(value).replace('.', '').toUpperCase(),
    full: new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }).format(value),
    weekday: new Intl.DateTimeFormat('tr-TR', { weekday: 'long' }).format(value),
  };
}

export default function EventDetailPage() {
  const { slug } = useParams();
  const [event, setEvent] = useState(null);
  const [relatedEvents, setRelatedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [favoriteIds, toggleFavoriteId] = useFavoriteIds('event');
  const [shareLabel, setShareLabel] = useState('Paylaş');
  const relatedRef = useRef(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    Promise.all([api.getEvent(slug), api.getEvents()])
      .then(([item, allEvents]) => {
        if (!active || !item) { if (active) setError(true); return; }
        setEvent(item);
        setRelatedEvents((allEvents || []).filter((candidate) => candidate.id !== item.id).sort((first, second) => Number(second.category === item.category) + Number(second.district === item.district) - Number(first.category === item.category) - Number(first.district === item.district)).slice(0, 10));
      })
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [slug]);

  const geojson = useMemo(() => {
    if (!Array.isArray(event?.coordinates)) return null;
    return { type: 'FeatureCollection', features: [{ type: 'Feature', id: event.id, properties: { id: event.id, name: event.title, category: event.category }, geometry: { type: 'Point', coordinates: [event.coordinates[1], event.coordinates[0]] } }] };
  }, [event]);

  const favorite = Boolean(event && favoriteIds.includes(event.id));
  const toggleFavorite = () => event && toggleFavoriteId(event.id);

  const shareEvent = async () => {
    try {
      if (navigator.share) await navigator.share({ title: event.title, text: event.description, url: window.location.href });
      else await navigator.clipboard.writeText(window.location.href);
      setShareLabel(navigator.share ? 'Paylaşıldı' : 'Bağlantı Kopyalandı');
    } catch { setShareLabel('Paylaş'); }
    window.setTimeout(() => setShareLabel('Paylaş'), 1800);
  };

  const downloadCalendar = () => {
    const start = new Date(`${event.date}T${event.time || '10:00'}:00`);
    const end = new Date(`${event.date}T${event.endTime || event.time || '12:00'}:00`);
    const stamp = (value) => value.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const content = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//TKMBS//Etkinlik//TR', 'BEGIN:VEVENT', `UID:tkmbs-event-${event.id}@hatay.bel.tr`, `DTSTART:${stamp(start)}`, `DTEND:${stamp(end)}`, `SUMMARY:${event.title}`, `DESCRIPTION:${event.description}`, `LOCATION:${event.address}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    const url = URL.createObjectURL(new Blob([content], { type: 'text/calendar;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.slug || event.id}.ics`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="event-detail-state"><span /><strong>Etkinlik bilgileri yükleniyor…</strong></div>;
  if (error || !event) return <div className="event-detail-state error"><IconCalendar size={38} /><strong>Etkinlik bulunamadı</strong><p>Kayıt kaldırılmış veya adresi değişmiş olabilir.</p><Link to="/etkinlikler">Etkinliklere Dön</Link></div>;

  const date = dateInfo(event);
  const color = categoryColors[event.category] || '#2468ad';
  const hasPassed = (parseEventDate(event)?.getTime() || 0) < Date.now();
  const displayEndTime = event.endTime || event.time || 'Saat açıklanacak';
  const program = event.program?.length ? event.program : [{ time: event.time || '--:--', title: 'Etkinlik başlangıcı' }];

  return (
    <article className="event-detail-page" style={{ '--event-detail-color': color }}>
      <nav className="event-detail-breadcrumb" aria-label="Sayfa yolu"><Link to="/">Ana Sayfa</Link><span>›</span><Link to="/etkinlikler">Etkinlikler</Link><span>›</span><strong>{event.title}</strong></nav>
      <header className="event-detail-header"><div><span className="event-detail-category">{event.categoryLabel || 'Etkinlik'}</span><h1>{event.title}</h1><p><IconPin size={13} /> {event.venue} · {event.district}</p></div><div className="event-detail-actions"><button type="button" className={favorite ? 'active' : ''} onClick={toggleFavorite}><IconHeart size={16} />{favorite ? 'Favorilerde' : 'Favoriye Ekle'}</button><button type="button" onClick={shareEvent}><DetailIcon name="share" />{shareLabel}</button></div></header>

      <div className="event-detail-layout">
        <main className="event-detail-main">
          <section className="event-detail-hero"><SafeImage src={getImageUrl(event.image)} alt={event.title} /><div className="event-detail-hero-shade" /><div className="event-detail-date"><strong>{date.day}</strong><span>{date.month}</span></div><div className="event-detail-hero-copy"><span>{hasPassed ? 'GERÇEKLEŞTİ' : 'YAKLAŞAN ETKİNLİK'}</span><h2>{event.title}</h2><p>{event.description}</p></div></section>
          <section className="event-detail-about"><div><span>ETKİNLİK HAKKINDA</span><h2>Programın ayrıntıları</h2></div><p>{event.longDescription || event.description}</p><div className="event-detail-notice"><IconInfo size={18} /><p><strong>Katılım bilgisi</strong>{event.registrationRequired ? 'Etkinlik için ön kayıt gereklidir. Kontenjan dolmadan kayıt yaptırmanız önerilir.' : 'Etkinlik herkese açıktır ve ön kayıt gerektirmez.'}</p></div></section>
          <section className="event-program-card"><header><div><span>PROGRAM AKIŞI</span><h2>Etkinlik planı</h2></div><small>{event.time || 'Saat açıklanacak'} – {displayEndTime}</small></header><ol>{program.map((item, index) => <li key={`${item.time}-${item.title}`}><time>{item.time}</time><i>{index + 1}</i><strong>{item.title}</strong></li>)}</ol></section>
        </main>

        <aside className="event-detail-sidebar">
          <section className="event-schedule-card"><div className="event-schedule-date"><strong>{date.day}</strong><span>{date.month}</span></div><div><span>{date.weekday}</span><h2>{date.full}</h2><p><IconClock size={14} /> {event.time || 'Saat açıklanacak'} – {displayEndTime}</p></div><button type="button" onClick={downloadCalendar}><IconCalendar size={15} /> Takvime Ekle</button></section>
          <section className="event-facts-card"><h2>Etkinlik Bilgileri</h2><div><DetailIcon name="ticket" /><span><small>Katılım</small><strong>{event.entryFee || 'Bilgi açıklanacak'}</strong></span></div><div><DetailIcon name="users" /><span><small>Kontenjan / Hedef Kitle</small><strong>{event.capacity ? `${event.capacity} kişi` : 'Kontenjan bilgisi yok'} · {event.audience || 'Tüm yaş grupları'}</strong></span></div><div><DetailIcon name="accessibility" /><span><small>Erişilebilirlik</small><strong>{event.accessibility || 'Bilgi açıklanacak'}</strong></span></div></section>
          <section className="event-location-card"><header><div><span>KONUM</span><h2>{event.venue}</h2></div><IconPin size={18} /></header><p>{event.address}</p>{geojson && <div><OpenLayersMap geojson={geojson} showControls={false} height="100%" /></div>}<Link to="/harita">Haritada Görüntüle <DetailIcon name="external" size={14} /></Link></section>
          <section className="event-organizer-card"><h2>Organizatör</h2><div><DetailIcon name="building" size={20} /><strong>{event.organizer || 'Hatay Büyükşehir Belediyesi'}</strong></div><p><DetailIcon name="phone" size={14} /> {event.contactPhone || 'İletişim bilgisi açıklanacak'}{event.contactEmail && <><span>·</span>{event.contactEmail}</>}</p></section>
        </aside>
      </div>

      <section className="related-events-panel"><header><div><span>KEŞFETMEYE DEVAM ET</span><h2>Benzer etkinlikler</h2></div><div><button type="button" onClick={() => relatedRef.current?.scrollBy({ left: -280, behavior: 'smooth' })} aria-label="Önceki etkinlikler">‹</button><button type="button" onClick={() => relatedRef.current?.scrollBy({ left: 280, behavior: 'smooth' })} aria-label="Sonraki etkinlikler">›</button><Link to="/etkinlikler">Tümü</Link></div></header><div className="related-events-list" ref={relatedRef}>{relatedEvents.map((item) => { const itemDate = dateInfo(item); return <Link to={`/etkinlikler/${item.slug || item.id}`} key={item.id}><SafeImage src={getImageUrl(item.image)} alt={item.title} /><time><strong>{itemDate.day}</strong><span>{itemDate.month}</span></time><div><span>{item.categoryLabel}</span><strong>{item.title}</strong><small><IconPin size={11} /> {item.district} · {item.time}</small></div><IconArrow size={14} /></Link>; })}</div></section>
    </article>
  );
}
