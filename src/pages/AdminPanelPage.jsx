import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import OpenLayersMap from '../components/map/OpenLayersMap';
import {
  IconArrow, IconCalendar, IconClock, IconDocument, IconInfo,
  IconMap, IconMonument, IconPin, IconRoute,
} from '../components/common/Icons';
import './AdminPanelPage.css';

const numberFormat = new Intl.NumberFormat('tr-TR');

const metricIcons = {
  monuments: IconMonument,
  routes: IconRoute,
  events: IconCalendar,
  visits: IconDocument,
  pending: IconClock,
  integrity: IconInfo,
};

const sourceLabels = { monument: 'Tarihi Eser', route: 'Kültürel Rota', event: 'Etkinlik' };

function formatDate(value, includeTime = false) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || '—';
  return new Intl.DateTimeFormat('tr-TR', includeTime
    ? { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }
    : { day: 'numeric', month: 'short' }).format(date);
}

function AdminTrendChart({ data = [] }) {
  const width = 620; const height = 150; const padX = 22; const padY = 18;
  const max = Math.max(...data.map((item) => item.total), 1);
  const step = data.length > 1 ? (width - padX * 2) / (data.length - 1) : 0;
  const points = data.map((item, index) => `${padX + index * step},${height - padY - (item.total / max) * (height - padY * 2)}`).join(' ');
  const area = `${padX},${height-padY} ${points} ${width-padX},${height-padY}`;
  return <div className="admin-trend-chart"><svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-label="Ziyaret eğilimi grafiği">{[0,1,2,3].map((line) => <line key={line} x1={padX} x2={width-padX} y1={padY+line*((height-padY*2)/3)} y2={padY+line*((height-padY*2)/3)} />)}<polygon points={area} /><polyline points={points} />{data.map((item,index) => <text key={item.label} x={padX+index*step} y={height-3} textAnchor="middle">{item.label}</text>)}</svg></div>;
}

export default function AdminPanelPage() {
  const [dashboard, setDashboard] = useState(null);
  const [geojson, setGeojson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    let active = true;
    Promise.all([api.getAdminDashboard(), api.getLocations()])
      .then(([dashboardData, locationData]) => { if (active) { setDashboard(dashboardData); setGeojson(dashboardData.geojson || locationData); } })
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const review = async (id, decision) => {
    setProcessingId(id);
    try {
      await api.reviewAdminItem(id, decision);
      setDashboard((current) => ({
        ...current,
        pendingReviews: current.pendingReviews.filter((item) => item.id !== id),
        metrics: current.metrics.map((metric) => metric.key === 'pending' ? { ...metric, value: Math.max(0, metric.value - 1) } : metric),
      }));
    } finally { setProcessingId(null); }
  };

  if (loading) return <div className="admin-dashboard-state"><span /><strong>Yönetim özeti hazırlanıyor…</strong></div>;
  if (error || !dashboard) return <div className="admin-dashboard-state error"><IconInfo size={34} /><strong>Yönetim verileri yüklenemedi</strong><p>Veri bağlantısını kontrol edip tekrar deneyin.</p></div>;

  return <div className="admin-dashboard-page">
    <header className="admin-dashboard-header">
      <div><span><i className={dashboard.cms?.connected ? '' : 'offline'} /> YÖNETİCİ ÇALIŞMA ALANI · {dashboard.cms?.source || 'Veri katmanı'}</span><h1>Yönetim özeti</h1><p>İçerik, CBS ve kullanım verilerinin güncel durumunu tek ekrandan izleyin.</p></div>
      <div className="admin-header-actions"><small>Son veri güncellemesi<b>{formatDate(dashboard.generatedAt, true)}</b></small><a href={dashboard.cms?.adminUrl || 'http://localhost:3000/admin'} target="_blank" rel="noreferrer"><IconMonument size={14} /> İçerikleri yönet</a><Link to="/raporlar"><IconDocument size={14} /> Raporları aç</Link></div>
    </header>

    <section className="admin-metric-grid" aria-label="Yönetim istatistikleri">
      {dashboard.metrics.map((metric) => { const MetricIcon = metricIcons[metric.key] || IconDocument; return <article key={metric.key} className={metric.key === 'integrity' ? 'integrity' : ''}><span><MetricIcon size={18} /></span><div><small>{metric.label}</small><strong>{numberFormat.format(metric.value)}{metric.suffix}</strong><p>{metric.detail}</p></div></article>; })}
    </section>

    <div className="admin-dashboard-grid">
      <section className="admin-dashboard-card admin-map-card">
        <header><div><span>CBS GÖRÜNÜMÜ</span><h2>Saha ve içerik haritası</h2></div><Link to="/harita">Haritayı aç <IconArrow size={12} /></Link></header>
        <div className="admin-map-frame">{geojson && <OpenLayersMap geojson={geojson} cluster fitToData height="100%" />}<div className="admin-map-overlay"><strong>{geojson?.features?.length || 0}</strong><span>aktif konum</span></div></div>
      </section>

      <section className="admin-dashboard-card admin-review-card">
        <header><div><span>İŞ AKIŞI</span><h2>Onay bekleyen kayıtlar</h2></div><b>{dashboard.pendingReviews.length}</b></header>
        <div className="admin-review-list">{dashboard.pendingReviews.length ? dashboard.pendingReviews.map((item) => <article key={item.id}><div className="admin-review-type"><span>{sourceLabels[item.sourceType]}</span><small>{formatDate(item.submittedAt, true)}</small></div><Link to={item.href}>{item.title}</Link><p>{item.operation} · {item.submittedBy}</p><footer><button type="button" disabled={processingId === item.id} onClick={() => review(item.id, 'rejected')}>Reddet</button><button type="button" disabled={processingId === item.id} onClick={() => review(item.id, 'approved')}>Onayla</button></footer></article>) : <div className="admin-review-empty"><span>✓</span><strong>Bekleyen kayıt yok</strong><p>Tüm içerikler değerlendirilmiş durumda.</p></div>}</div>
      </section>

      <section className="admin-dashboard-card admin-traffic-card">
        <header><div><span>KULLANIM</span><h2>Ziyaret eğilimi</h2></div><Link to="/raporlar">Detaylı analiz</Link></header>
        <AdminTrendChart data={dashboard.trend} />
      </section>

      <section className="admin-dashboard-card admin-content-card">
        <header><div><span>İÇERİK</span><h2>En çok görüntülenenler</h2></div><small>Görüntüleme</small></header>
        <ol>{dashboard.topContent.map((item,index) => <li key={`${item.sourceType}-${item.sourceId}`}><b>{index+1}</b><Link to={item.href}>{item.title}<small>{sourceLabels[item.sourceType]}</small></Link><strong>{numberFormat.format(item.views)}</strong></li>)}</ol>
      </section>

      <section className="admin-dashboard-card admin-events-card">
        <header><div><span>TAKVİM</span><h2>Etkinlik kayıtları</h2></div><Link to="/etkinlikler">Tümünü gör</Link></header>
        <div>{dashboard.eventSchedule.map((item) => <Link to={item.href} key={item.id}><time><b>{formatDate(item.date).split(' ')[0]}</b><small>{formatDate(item.date).split(' ')[1]}</small></time><span><strong>{item.title}</strong><small><IconPin size={10} /> {item.district} · {item.time}</small></span><i>›</i></Link>)}</div>
      </section>

      <section className="admin-dashboard-card admin-activity-card">
        <header><div><span>SİSTEM</span><h2>Son işlemler</h2></div></header>
        <div className="admin-activity-list">{dashboard.activity.map((item) => <article key={item.id}><i /><div><p>{item.action}</p><Link to={item.href}>{item.title}</Link><small>{item.actor} · {formatDate(item.createdAt, true)}</small></div></article>)}</div>
        <div className="admin-system-status">{dashboard.systemStatus.map((item) => <p key={item.key}><i className={item.status} /><span>{item.label}</span><strong>{item.value}</strong></p>)}</div>
      </section>
    </div>
  </div>;
}
