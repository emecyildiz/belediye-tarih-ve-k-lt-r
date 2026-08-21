import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import SafeImage from '../components/common/SafeImage';
import { IconArrow, IconCalendar, IconClock, IconFilter, IconHeart, IconPin, IconSearch } from '../components/common/Icons';
import './EventsPage.css';

const categoryColors = { festival: '#7c3aed', sanat: '#d43c55', kultur: '#16815b', gezi: '#167f8f', atolye: '#d56a12', konferans: '#2468ad', sergi: '#a55716' };
const initialFilters = { category: 'tumu', district: 'tumu', period: 'tumu' };

function eventDate(item) {
  const value = new Date(`${item.date}T${item.time || '12:00'}:00`);
  return Number.isNaN(value.getTime()) ? null : value;
}

function dateParts(item) {
  const value = eventDate(item);
  if (!value) return { day: '--', month: '', weekday: '' };
  return {
    day: String(value.getDate()).padStart(2, '0'),
    month: new Intl.DateTimeFormat('tr-TR', { month: 'short' }).format(value).replace('.', '').toUpperCase(),
    weekday: new Intl.DateTimeFormat('tr-TR', { weekday: 'long' }).format(value),
  };
}

function eventStatus(item) {
  const value = eventDate(item);
  if (!value) return 'Tarih bekleniyor';
  const difference = value.getTime() - Date.now();
  if (difference < 0) return 'Gerçekleşti';
  const days = Math.ceil(difference / 86400000);
  if (days <= 7) return 'Bu hafta';
  if (days <= 31) return 'Yaklaşan';
  return 'Planlandı';
}

function calendarDays(cursor) {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const leading = (new Date(year, month, 1).getDay() + 6) % 7;
  const count = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: leading }, () => null);
  for (let day = 1; day <= count; day += 1) days.push(new Date(year, month, day));
  while (days.length < 42) days.push(null);
  return days;
}

function dateKey(value) {
  if (!value) return '';
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
}

function CalendarGrid({ cursor, eventDates, selectedDate, onSelect, expanded = false }) {
  const today = dateKey(new Date());
  return <div className={`event-calendar-grid ${expanded ? 'expanded' : ''}`}><div className="calendar-weekdays">{['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((day) => <span key={day}>{day}</span>)}</div><div className="calendar-days">{calendarDays(cursor).map((date, index) => {
    if (!date) return <span className="calendar-empty" key={`empty-${index}`} />;
    const key = dateKey(date);
    const dayEvents = eventDates.get(key) || [];
    const colors = [...new Set(dayEvents.map((item) => categoryColors[item.category] || '#2468ad'))].slice(0, 3);
    return <button type="button" key={key} className={`${key === today ? 'today' : ''} ${key === selectedDate ? 'selected' : ''} ${dayEvents.length ? 'has-event' : ''}`} onClick={(event) => { event.stopPropagation(); onSelect(key); }} aria-label={`${date.getDate()} ${dayEvents.length ? `${dayEvents.length} etkinlik` : 'etkinlik yok'}`}><span>{date.getDate()}</span>{colors.length > 0 && <i>{colors.map((color) => <b key={color} style={{ background: color }} />)}</i>}</button>;
  })}</div></div>;
}

function ViewIcon({ type }) {
  if (type === 'list') return <svg viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>;
  return <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>;
}

export default function EventsPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState(initialFilters);
  const [filters, setFilters] = useState(initialFilters);
  const [sortBy, setSortBy] = useState('date');
  const [view, setView] = useState('grid');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [calendarCursor, setCalendarCursor] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [calendarExpanded, setCalendarExpanded] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('tkmbs-favorite-events') || '[]'); } catch { return []; }
  });

  useEffect(() => {
    let active = true;
    api.getEvents()
      .then((data) => {
        if (!active) return;
        const items = data || [];
        setEvents(items);
        const nextEvent = items.filter((item) => (eventDate(item)?.getTime() || 0) >= Date.now()).sort((a, b) => eventDate(a) - eventDate(b))[0];
        if (nextEvent) {
          const nextDate = eventDate(nextEvent);
          setCalendarCursor(new Date(nextDate.getFullYear(), nextDate.getMonth(), 1));
          setSelectedDate(nextEvent.date);
        }
      })
      .catch((error) => console.error('Etkinlikler yüklenemedi:', error))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!calendarExpanded) return undefined;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event) => { if (event.key === 'Escape') setCalendarExpanded(false); };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [calendarExpanded]);

  const categories = useMemo(() => [...new Map(events.map((item) => [item.category, item.categoryLabel || item.category])).entries()], [events]);
  const districts = useMemo(() => [...new Set(events.map((item) => item.district).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'tr')), [events]);
  const categoryCounts = useMemo(() => events.reduce((result, item) => ({ ...result, [item.category]: (result[item.category] || 0) + 1 }), {}), [events]);
  const featured = useMemo(() => events.filter((item) => item.featured && eventDate(item)?.getTime() > Date.now() && item.image).sort((a, b) => eventDate(a) - eventDate(b))[0] || events.find((item) => item.featured), [events]);
  const eventDates = useMemo(() => events.reduce((result, item) => { if (!result.has(item.date)) result.set(item.date, []); result.get(item.date).push(item); return result; }, new Map()), [events]);
  const selectedDayEvents = eventDates.get(selectedDate) || [];
  const calendarTitle = new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric' }).format(calendarCursor);
  const changeMonth = (direction) => setCalendarCursor((current) => new Date(current.getFullYear(), current.getMonth() + direction, 1));

  const visibleEvents = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('tr-TR');
    const now = Date.now();
    const result = events.filter((item) => {
      const date = eventDate(item)?.getTime() || 0;
      return (!normalizedQuery || `${item.title} ${item.description} ${item.venue} ${item.district}`.toLocaleLowerCase('tr-TR').includes(normalizedQuery))
        && (filters.category === 'tumu' || item.category === filters.category)
        && (filters.district === 'tumu' || item.district === filters.district)
        && (filters.period === 'tumu' || (filters.period === 'yaklasan' ? date >= now : date < now));
    });
    return [...result].sort((first, second) => {
      if (sortBy === 'name') return first.title.localeCompare(second.title, 'tr');
      if (sortBy === 'district') return first.district.localeCompare(second.district, 'tr');
      if (sortBy === 'newest') return (eventDate(second)?.getTime() || 0) - (eventDate(first)?.getTime() || 0);
      return (eventDate(first)?.getTime() || 0) - (eventDate(second)?.getTime() || 0);
    });
  }, [events, filters, query, sortBy]);

  const toggleFavorite = (id) => setFavorites((current) => {
    const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
    localStorage.setItem('tkmbs-favorite-events', JSON.stringify(next));
    return next;
  });
  const clearFilters = () => { setDraft(initialFilters); setFilters(initialFilters); setQuery(''); setFiltersOpen(false); };
  const applyFilters = () => { setFilters(draft); setFiltersOpen(false); };
  const updateFilter = (key, value) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setFilters((current) => ({ ...current, [key]: value }));
  };

  return (
    <div className="events-page">
      <header className="events-page-header">
        <div><span><IconCalendar size={14} /> Kültür ve şehir takvimi</span><h1>Etkinlikler</h1><p>Hatay’daki kültür, sanat, gezi ve atölye programlarını tek takvimde keşfedin.</p></div>
        <div className="events-header-tools"><strong>{visibleEvents.length} etkinlik</strong><label><small>Sırala</small><select value={sortBy} onChange={(event) => setSortBy(event.target.value)}><option value="date">Tarihe Göre</option><option value="newest">En Yeni Tarih</option><option value="name">Ada Göre</option><option value="district">İlçeye Göre</option></select></label><div className="event-view-buttons">{['grid', 'list'].map((type) => <button type="button" key={type} className={view === type ? 'active' : ''} onClick={() => setView(type)} aria-label={type === 'grid' ? 'Kart görünümü' : 'Liste görünümü'}><ViewIcon type={type} /></button>)}</div><button type="button" className="mobile-event-filter" onClick={() => setFiltersOpen(true)}><IconFilter size={14} /> Filtrele</button></div>
      </header>

      <section className="events-overview">
        {featured && <div className="featured-event"><SafeImage src={featured.image} alt={featured.title} /><div className="featured-event-shade" /><div className="featured-date"><strong>{dateParts(featured).day}</strong><span>{dateParts(featured).month}</span></div><div className="featured-event-content"><span>ÖNE ÇIKAN</span><h2>{featured.title}</h2><p>{featured.description}</p><div><small><IconPin size={13} /> {featured.venue}</small><small><IconClock size={13} /> {featured.time}</small></div><Link to={`/etkinlikler/${featured.id}`}>İncele <IconArrow size={13} /></Link></div></div>}
        <aside className="event-calendar-card" role="button" tabIndex="0" onClick={() => setCalendarExpanded(true)} onKeyDown={(event) => event.key === 'Enter' && setCalendarExpanded(true)}><header><div><span>ETKİNLİK TAKVİMİ</span><strong>{calendarTitle}</strong></div><div><button type="button" aria-label="Önceki ay" onClick={(event) => { event.stopPropagation(); changeMonth(-1); }}>‹</button><button type="button" aria-label="Sonraki ay" onClick={(event) => { event.stopPropagation(); changeMonth(1); }}>›</button></div></header><CalendarGrid cursor={calendarCursor} eventDates={eventDates} selectedDate={selectedDate} onSelect={(key) => { setSelectedDate(key); setCalendarExpanded(true); }} /><footer><span><i /> Etkinlik bulunan gün</span><button type="button">Genişlet</button></footer></aside>
      </section>

      {calendarExpanded && <div className="event-calendar-modal" role="dialog" aria-modal="true" aria-label="Aylık etkinlik takvimi" onClick={() => setCalendarExpanded(false)}><section className="expanded-calendar-panel" onClick={(event) => event.stopPropagation()}><header><div><span>AYLIK ETKİNLİK TAKVİMİ</span><h2>{calendarTitle}</h2></div><div><button type="button" aria-label="Önceki ay" onClick={() => changeMonth(-1)}>‹</button><button type="button" aria-label="Sonraki ay" onClick={() => changeMonth(1)}>›</button><button type="button" className="close-calendar" aria-label="Takvimi kapat" onClick={() => setCalendarExpanded(false)}>×</button></div></header><div className="expanded-calendar-body"><CalendarGrid cursor={calendarCursor} eventDates={eventDates} selectedDate={selectedDate} expanded onSelect={setSelectedDate} /><aside><header><span>SEÇİLEN GÜN</span><strong>{selectedDate ? new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${selectedDate}T12:00:00`)) : 'Bir tarih seçin'}</strong></header><div>{selectedDayEvents.length ? selectedDayEvents.map((item) => <Link key={item.id} to={`/etkinlikler/${item.id}`}><i style={{ background: categoryColors[item.category] || '#2468ad' }} /><div><span>{item.time} · {item.categoryLabel}</span><strong>{item.title}</strong><small><IconPin size={11} /> {item.venue}</small></div><IconArrow size={14} /></Link>) : <p>Bu tarihte planlanmış etkinlik bulunmuyor.</p>}</div></aside></div></section></div>}

      <section className="event-category-strip" aria-label="Etkinlik kategorileri"><button type="button" className={draft.category === 'tumu' ? 'active' : ''} onClick={() => { setDraft((current) => ({ ...current, category: 'tumu' })); setFilters((current) => ({ ...current, category: 'tumu' })); }}>Tümü <b>{events.length}</b></button>{categories.map(([key, label]) => <button type="button" key={key} className={draft.category === key ? 'active' : ''} style={{ '--event-color': categoryColors[key] || '#2468ad' }} onClick={() => { setDraft((current) => ({ ...current, category: key })); setFilters((current) => ({ ...current, category: key })); }}>{label} <b>{categoryCounts[key] || 0}</b></button>)}</section>

      <div className="events-layout">
        {filtersOpen && <button type="button" className="event-filter-backdrop" aria-label="Filtreleri kapat" onClick={() => setFiltersOpen(false)} />}
        <aside className={`event-filter-panel ${filtersOpen ? 'open' : ''}`}><header><div><IconFilter size={15} /><strong>Etkinlikleri Filtrele</strong></div><button type="button" onClick={() => setFiltersOpen(false)} aria-label="Filtreleri kapat">×</button></header><label className="event-search-field"><span>Etkinlik ara</span><div><IconSearch size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Başlık veya mekân…" /></div></label><label><span>Kategori</span><select value={draft.category} onChange={(event) => updateFilter('category', event.target.value)}><option value="tumu">Tüm kategoriler</option>{categories.map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label><label><span>İlçe</span><select value={draft.district} onChange={(event) => updateFilter('district', event.target.value)}><option value="tumu">Tüm ilçeler</option>{districts.map((item) => <option value={item} key={item}>{item}</option>)}</select></label><label><span>Tarih durumu</span><select value={draft.period} onChange={(event) => updateFilter('period', event.target.value)}><option value="tumu">Tüm tarihler</option><option value="yaklasan">Yaklaşan etkinlikler</option><option value="gecmis">Geçmiş etkinlikler</option></select></label><button type="button" className="apply-event-filters" onClick={applyFilters}>Filtreleri Uygula</button><button type="button" className="clear-event-filters" onClick={clearFilters}>Temizle</button></aside>

        <main className={`event-results ${view}`}>
          {loading ? <div className="event-page-state"><span /><strong>Etkinlikler yükleniyor…</strong></div> : visibleEvents.length ? visibleEvents.map((item) => {
            const date = dateParts(item);
            const favorite = favorites.includes(item.id);
            const openEvent = (event) => { if (!event.target.closest('button, a')) navigate(`/etkinlikler/${item.id}`); };
            return <article className="event-list-card" key={item.id} role="link" tabIndex="0" onClick={openEvent} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') navigate(`/etkinlikler/${item.id}`); }} aria-label={`${item.title} etkinlik detayını aç`}><div className="event-card-image"><SafeImage src={item.image} alt={item.title} /><span style={{ background: categoryColors[item.category] || '#2468ad' }}>{item.categoryLabel}</span><button type="button" className={favorite ? 'active' : ''} onClick={() => toggleFavorite(item.id)} aria-label={favorite ? 'Favorilerden çıkar' : 'Favoriye ekle'}><IconHeart size={17} /></button><div className="event-card-date"><strong>{date.day}</strong><small>{date.month}</small></div></div><div className="event-card-body"><div className="event-card-status"><span>{eventStatus(item)}</span><small>{date.weekday}</small></div><h2>{item.title}</h2><p className="event-card-location"><IconPin size={12} /> {item.district} · {item.venue}</p><p className="event-card-description">{item.description}</p><footer><span><IconClock size={12} /> {item.time}</span><Link to={`/etkinlikler/${item.id}`}>Detayları Gör <IconArrow size={12} /></Link></footer></div></article>;
          }) : <div className="event-page-state empty"><IconCalendar size={32} /><strong>Bu ölçütlere uygun etkinlik bulunamadı</strong><button type="button" onClick={clearFilters}>Filtreleri Temizle</button></div>}
        </main>
      </div>
    </div>
  );
}
