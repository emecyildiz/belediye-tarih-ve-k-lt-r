import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import OpenLayersMap from '../components/map/OpenLayersMap';
import CategoryMarkerIcon from '../components/map/CategoryMarkerIcon';
import useFavoriteIds from '../hooks/useFavoriteIds';
import SafeImage from '../components/common/SafeImage';
import { api, DEFAULT_IMAGE, getImageUrl } from '../services/api';
import { CATEGORY_LABELS } from '../constants';
import { IconArrow, IconHeart, IconMonument, IconPin, IconRoute } from '../components/common/Icons';
import './MonumentDetailPage.css';

const tabItems = [
  { key: 'tarihce', label: 'Tarihçe', icon: 'timeline' },
  { key: 'mimari', label: 'Mimari Özellikler', icon: 'architecture' },
  { key: 'galeri', label: 'Galeri', icon: 'gallery' },
  { key: 'belgeler', label: 'Belgeler', icon: 'document' },
  { key: 'restorasyon', label: 'Restorasyon Geçmişi', icon: 'restore' },
];

function DetailIcon({ name, size = 16 }) {
  const paths = {
    check: <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></>,
    verified: <><path d="m12 2 2.2 2 3-.2.7 2.9 2.5 1.7-1.2 2.8 1.2 2.8-2.5 1.7-.7 2.9-3-.2-2.2 2-2.2-2-3 .2-.7-2.9-2.5-1.7 1.2-2.8-1.2-2.8 2.5-1.7.7-2.9 3 .2z" /><path d="m9 12 2 2 4-4" /></>,
    share: <><circle cx="18" cy="5" r="2" /><circle cx="6" cy="12" r="2" /><circle cx="18" cy="19" r="2" /><path d="m8 11 8-5M8 13l8 5" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    ticket: <><path d="M4 7h16v3a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4z" /><path d="M12 7v10" /></>,
    star: <path d="m12 3 2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.9-5.4 2.9 1-6-4.3-4.2 6-.9z" />,
    timeline: <><circle cx="6" cy="5" r="2" /><circle cx="18" cy="12" r="2" /><circle cx="6" cy="19" r="2" /><path d="M8 5h4a3 3 0 0 1 3 3v1M16 15v1a3 3 0 0 1-3 3H8" /></>,
    architecture: <><path d="M3 21h18M5 18h14M7 18V9m5 9V9m5 9V9M4 9h16L12 3z" /></>,
    gallery: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m4 17 5-4 4 3 3-2 4 3" /></>,
    document: <><path d="M6 2h8l4 4v16H6z" /><path d="M14 2v5h5M9 12h6M9 16h6" /></>,
    restore: <><path d="M4 7v5h5" /><path d="M5.5 16a8 8 0 1 0 .5-9l-2 5" /></>,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7h.01" /></>,
    external: <><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 13v6H5V6h6" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.info}</svg>;
}

export default function MonumentDetailPage() {
  const { slug } = useParams();
  const [monument, setMonument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState('tarihce');
  const [expanded, setExpanded] = useState(false);
  const [shareLabel, setShareLabel] = useState('Paylaş');
  const [favoriteIds, toggleFavoriteId] = useFavoriteIds('monument');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    setActiveTab('tarihce');
    api.getMonument(slug)
      .then((data) => { if (active && data) setMonument(data); else if (active) setError(true); })
      .catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [slug]);

  const geojson = useMemo(() => {
    if (!Array.isArray(monument?.coordinates)) return null;
    return { type: 'FeatureCollection', features: [{ type: 'Feature', id: monument.id, properties: { id: monument.id, name: monument.name, category: monument.category }, geometry: { type: 'Point', coordinates: [monument.coordinates[1], monument.coordinates[0]] } }] };
  }, [monument]);

  const galleryImages = useMemo(() => {
    if (!monument) return [];
    return [...new Set([monument.image, ...(monument.images || [])].filter(Boolean))];
  }, [monument]);

  const favorite = Boolean(monument && favoriteIds.includes(monument.id));
  const toggleFavorite = () => monument && toggleFavoriteId(monument.id);

  const shareMonument = async () => {
    const payload = { title: monument.name, text: monument.description, url: window.location.href };
    try {
      if (navigator.share) await navigator.share(payload);
      else await navigator.clipboard.writeText(window.location.href);
      setShareLabel(navigator.share ? 'Paylaşıldı' : 'Bağlantı Kopyalandı');
    } catch { setShareLabel('Paylaş'); }
    window.setTimeout(() => setShareLabel('Paylaş'), 1800);
  };

  if (loading) return <div className="monument-detail-state"><span /><strong>Eser bilgileri yükleniyor</strong></div>;
  if (error || !monument) return <div className="monument-detail-state error"><IconMonument size={38} /><strong>Eser bulunamadı</strong><p>Bu kayıt kaldırılmış veya adresi değişmiş olabilir.</p><Link to="/tarihi-eserler">Tarihi Eserlere Dön</Link></div>;

  const categoryLabel = CATEGORY_LABELS[monument.category] || 'Tarihi Eser';
  const infoRows = [
    ['Yapım Tarihi', monument.century || monument.period || 'Bilinmiyor'],
    ['Yapı Türü', monument.typeLabel || categoryLabel],
    ['Mimari Üslup', monument.architecture || 'Bilgi güncelleniyor'],
    ['Kullanım Durumu', monument.usage || 'Bilgi güncelleniyor'],
    ['Koruma Durumu', monument.protectionStatus || 'Kayıtlı'],
    ['Envanter No', monument.registrationNo || `TKMBS-${monument.id}`],
  ];

  return (
    <article className="monument-detail-page">
      <nav className="monument-breadcrumb" aria-label="Sayfa yolu"><Link to="/">Ana Sayfa</Link><span>›</span><Link to="/tarihi-eserler">Tarihi Eserler</Link><span>›</span><strong>{monument.name}</strong></nav>

      <header className="monument-detail-header">
        <div>
          <div className="monument-title-row"><h1>{monument.name}</h1>{monument.registrationStatus === 'Tescilli' && <span className="verified-badge"><DetailIcon name="verified" size={14} /> Onaylı Eser</span>}</div>
          <div className="monument-detail-tags"><span><CategoryMarkerIcon category={monument.category} color="currentColor" size={17} />{categoryLabel}</span><span><IconPin size={14} />{monument.district || 'Hatay'}</span>{monument.route && <span><IconRoute size={14} />{monument.route}</span>}</div>
        </div>
        <div className="monument-actions">
          <button type="button" className={favorite ? 'active' : ''} onClick={toggleFavorite}><IconHeart size={16} />{favorite ? 'Favorilerde' : 'Favoriye Ekle'}</button>
          <button type="button" onClick={shareMonument}><DetailIcon name="share" size={16} />{shareLabel}</button>
          <Link to="/kultur-rotalari"><IconRoute size={16} />Rotaları Gör</Link>
        </div>
      </header>

      <div className="monument-detail-layout">
        <div className="monument-detail-main">
          <section className={`monument-gallery ${galleryImages.length < 2 ? 'single' : ''}`}>
            <SafeImage src={getImageUrl(galleryImages[0])} alt={monument.name} className="monument-gallery-main" />
            {galleryImages.length > 1 && <div className="monument-gallery-side">{galleryImages.slice(1, 3).map((image, index) => <SafeImage key={image} src={getImageUrl(image)} alt={`${monument.name} görünüm ${index + 2}`} />)}{galleryImages.length > 3 && <button type="button" onClick={() => setActiveTab('galeri')}>+{galleryImages.length - 3}<small>Tüm Fotoğraflar</small></button>}</div>}
          </section>

          <div className="monument-summary-grid">
            <section className="monument-about"><h2>Hakkında</h2><p className={expanded ? 'expanded' : ''}>{monument.longDescription || monument.description}</p>{(monument.longDescription || '').length > 220 && <button type="button" onClick={() => setExpanded((value) => !value)}>{expanded ? 'Daha Az' : 'Daha Fazla'} <IconArrow size={13} /></button>}</section>
            <section className="monument-highlights"><h2>Öne Çıkan Özellikler</h2><ul>{(monument.highlights || []).map((item) => <li key={item}><DetailIcon name="check" size={14} />{item}</li>)}</ul></section>
          </div>

          <section className="monument-tabs-card">
            <div className="monument-tabs" role="tablist">{tabItems.map((item) => <button key={item.key} type="button" role="tab" aria-selected={activeTab === item.key} className={activeTab === item.key ? 'active' : ''} onClick={() => setActiveTab(item.key)}><DetailIcon name={item.icon} size={15} />{item.label}</button>)}</div>
            <div className="monument-tab-content" role="tabpanel">
              {activeTab === 'tarihce' && <div className="monument-history"><div className="monument-timeline">{(monument.timeline || []).map((item) => <div key={`${item.year}-${item.text}`}><span /><strong>{item.year}</strong><p>{item.text}</p></div>)}</div><aside><DetailIcon name="info" size={20} /><div><strong>Biliyor muydunuz?</strong><p>{monument.funFact}</p></div></aside></div>}
              {activeTab === 'mimari' && <div className="architecture-content"><DetailIcon name="architecture" size={30} /><div><h3>{monument.architecture}</h3><p>{monument.name}, özgün yapısal karakteri ve bulunduğu çevreyle kurduğu tarihsel ilişkiyle Hatay kültürel mirasının önemli parçalarındandır.</p><ul>{(monument.highlights || []).map((item) => <li key={item}>{item}</li>)}</ul></div></div>}
              {activeTab === 'galeri' && <div className="detail-gallery-grid">{(galleryImages.length ? galleryImages : [DEFAULT_IMAGE]).map((image, index) => <SafeImage key={`${image}-${index}`} src={getImageUrl(image)} alt={`${monument.name} galeri ${index + 1}`} />)}</div>}
              {activeTab === 'belgeler' && <div className="document-list">{(monument.documents || []).map((document) => <div key={document.id}><DetailIcon name="document" size={22} /><span><strong>{document.title}</strong><small>{document.type} · {document.status}</small></span><button type="button" disabled>Görüntüle</button></div>)}</div>}
              {activeTab === 'restorasyon' && <div className="restoration-list">{(monument.restorations || []).map((item) => <div key={`${item.year}-${item.title}`}><time>{item.year}</time><span><strong>{item.title}</strong><p>{item.description}</p></span></div>)}</div>}
            </div>
          </section>
        </div>

        <aside className="monument-info-sidebar">
          <section className="monument-info-card location-card"><h2>Konum Bilgisi</h2><p><IconPin size={15} />{monument.address || `${monument.district}, Hatay`}</p>{geojson && <div className="monument-mini-map"><OpenLayersMap geojson={geojson} showControls={false} height="100%" /></div>}<Link to={`/harita?location=${encodeURIComponent(monument.slug || monument.id)}`}>Haritada Görüntüle <DetailIcon name="external" size={14} /></Link></section>
          <section className="monument-info-card"><h2>Detaylı Bilgiler</h2>{infoRows.map(([label, value]) => <div className="monument-info-row" key={label}><span>{label}</span><strong>{value}</strong></div>)}</section>
          <section className="monument-info-card visitor-card"><h2>Ziyaretçi Bilgileri</h2><div className="monument-info-row"><span><DetailIcon name="clock" size={14} /> Ziyaret Saatleri</span><strong>{monument.workingHours}</strong></div><div className="monument-info-row"><span><DetailIcon name="ticket" size={14} /> Giriş</span><strong>{monument.entryFee}</strong></div><div className="monument-info-row rating-row"><span><DetailIcon name="star" size={14} /> Ziyaretçi Notu</span><strong><b>★</b> {monument.rating || '—'} <small>({monument.reviewCount || 0})</small></strong></div></section>
          <section className="nearby-monuments"><div><h2>Yakındaki Eserler</h2><Link to="/tarihi-eserler">Tümü <IconArrow size={12} /></Link></div><div className="nearby-monument-grid">{(monument.nearby || []).map((item) => <Link key={item.id} to={`/tarihi-eserler/${item.slug}`}><SafeImage src={getImageUrl(item.image)} alt={item.name} /><strong>{item.name}</strong><small>{item.distance}</small></Link>)}</div></section>
        </aside>
      </div>
    </article>
  );
}
