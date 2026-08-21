import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import SafeImage from '../components/common/SafeImage';
import './EventsPage.css';

const badgeColors = {
  festival: 'purple', sanat: 'red', kultur: 'green', gezi: 'teal',
  atolye: 'orange', konferans: 'blue', sergi: 'orange',
};

function getDateParts(event) {
  const parsed = event.date ? new Date(event.date + 'T12:00:00') : null;
  if (!parsed || Number.isNaN(parsed.getTime())) {
    return { day: '--', month: '', year: '' };
  }
  return {
    day: String(parsed.getDate()),
    month: new Intl.DateTimeFormat('tr-TR', { month: 'short' }).format(parsed).replace('.', '').toUpperCase(),
    year: parsed.getFullYear(),
  };
}

export default function EventsPage() {
  const [viewMode, setViewMode] = useState('grid');
  const [events, setEvents] = useState([]);
  const [category, setCategory] = useState('tumu');
  const [district, setDistrict] = useState('tumu');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getEvents()
      .then((data) => setEvents(data || []))
      .catch((error) => console.error('Etkinlikler yüklenemedi:', error))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(
    () => [...new Map(events.map((item) => [item.category, item.categoryLabel || item.category])).entries()],
    [events],
  );
  const districts = useMemo(() => [...new Set(events.map((item) => item.district).filter(Boolean))], [events]);
  const filtered = events.filter((item) => (
    (category === 'tumu' || item.category === category)
    && (district === 'tumu' || item.district === district)
  ));

  return (
    <div className="events-page">
      <div className="events-header">
        <div className="events-header-texts">
          <h1 className="events-title">Etkinlikler</h1>
          <p className="events-subtitle">Hatay'da düzenlenen kültürel, sanatsal ve geleneksel etkinlikleri keşfedin.</p>
        </div>
        <div className="events-header-controls">
          <span className="results-count">{filtered.length} sonuç bulundu</span>
          <div className="view-toggles">
            <button className={'view-btn ' + (viewMode === 'grid' ? 'active' : '')} onClick={() => setViewMode('grid')} aria-label="Kart görünümü">▦</button>
            <button className={'view-btn ' + (viewMode === 'list' ? 'active' : '')} onClick={() => setViewMode('list')} aria-label="Liste görünümü">☷</button>
          </div>
        </div>
      </div>

      <div className="events-body">
        <aside className="events-sidebar">
          <div className="filter-section">
            <h3 className="filter-title">Kategori</h3>
            <select className="filter-select" value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="tumu">Tüm Kategoriler</option>
              {categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
          <div className="filter-section">
            <h3 className="filter-title">İlçe</h3>
            <select className="filter-select" value={district} onChange={(event) => setDistrict(event.target.value)}>
              <option value="tumu">Tüm İlçeler</option>
              {districts.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </div>
          <button className="clear-filters-btn" onClick={() => { setCategory('tumu'); setDistrict('tumu'); }}>Filtreleri Temizle</button>
        </aside>

        <div className="events-content-container">
          <main className={'events-content ' + viewMode}>
            {loading ? <div className="loading">Etkinlikler yükleniyor…</div> : filtered.map((item) => {
              const date = getDateParts(item);
              return (
                <article key={item.id} className="event-card">
                  <div className="event-image-area">
                    <SafeImage src={item.image} alt={item.title} />
                    <span className={'event-category-badge badge-' + (badgeColors[item.category] || 'blue')}>
                      {item.categoryLabel || item.category}
                    </span>
                    <button className="event-favorite-btn" aria-label="Favorilere ekle">♡</button>
                  </div>
                  <div className="event-content-area">
                    <div className="event-date-box">
                      <span className="date-day">{date.day}</span>
                      <span className="date-month">{date.month}</span>
                      <span className="date-year">{date.year}</span>
                    </div>
                    <div className="event-info">
                      <h3 className="event-title">{item.title}</h3>
                      <p className="event-location">⌖ {item.district} · {item.venue || item.location}</p>
                      <p className="event-desc">{item.description}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </main>
        </div>
      </div>
    </div>
  );
}
