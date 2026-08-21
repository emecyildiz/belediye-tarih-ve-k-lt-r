import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import TopNavbar from '../components/layout/TopNavbar';
import Footer from '../components/layout/Footer';
import { api } from '../services/api';
import SafeImage from '../components/common/SafeImage';
import { IconPin, IconArrow } from '../components/common/Icons';
import './EventDetailPage.css';

export default function EventDetailPage() {
  const { slug } = useParams();
  const [event, setEvent] = useState(null);

  useEffect(() => {
    // In a real scenario, this would fetch by slug.
    api.getEvents().then(events => {
      const found = events.find(e => e.slug === slug) || events[0];
      setEvent(found);
    }).catch(console.error);
  }, [slug]);

  if (!event) return <div>Yükleniyor...</div>;

  return (
    <div className="page-layout">
      <TopNavbar />
      <div className="event-detail-page">
        <div className="breadcrumb">
          <Link to="/">Ana Sayfa</Link> &gt; <Link to="/etkinlikler">Etkinlikler</Link> &gt; <span>{event.title}</span>
        </div>
        
        <main className="event-detail-main">
          <div className="event-hero-image">
            <SafeImage src={event.image} alt={event.title} />
          </div>
          
          <div className="event-info-header">
            <span className="event-badge">{event.categoryLabel || 'Etkinlik'}</span>
            <h1>{event.title}</h1>
            <div className="event-meta-info">
              <span><IconPin size={16} /> {event.location}</span>
              <span><strong>Tarih:</strong> {event.dateLabel || 'Belirtilmedi'}</span>
              <span><strong>Saat:</strong> {event.time || '10:00'}</span>
            </div>
          </div>
          
          <div className="event-content">
            <h3>Etkinlik Hakkında</h3>
            <p>{event.description}</p>
            <p>Hatay'ın zengin kültürel dokusunu yansıtan bu özel etkinlik, ziyaretçilerine unutulmaz bir deneyim sunmayı hedefliyor. Etkinlik boyunca çeşitli atölyeler, söyleşiler ve rehberli turlar düzenlenecektir. Tüm halkımız davetlidir.</p>
          </div>
          
          <div className="event-actions">
            <button type="button" className="btn-primary">Kayıt Ol</button>
            <button type="button" className="btn-outline">Takvime Ekle</button>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
