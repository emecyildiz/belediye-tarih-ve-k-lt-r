import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import OpenLayersMap from '../components/map/OpenLayersMap';
import { IconCalendar, IconClock, IconDocument, IconMap, IconRoute, IconUser } from '../components/common/Icons';
import './GisAnalyticsPage.css';

const numberFormat = new Intl.NumberFormat('tr-TR');
const tabs = [
  { key: 'overview', label: 'Genel Özet' }, { key: 'gis', label: 'CBS İstatistikleri' },
  { key: 'usage', label: 'Kullanım Analizleri' }, { key: 'content', label: 'İçerik Performansı' },
];
const mapLayers = [
  { key: 'camii', label: 'Camiler' }, { key: 'kilise', label: 'Kiliseler' }, { key: 'muze', label: 'Müzeler' },
  { key: 'han', label: 'Hanlar' }, { key: 'kopru', label: 'Köprüler' }, { key: 'kale', label: 'Kaleler ve Surlar' },
  { key: 'doga', label: 'Doğal Güzellikler' }, { key: 'diger', label: 'Diğer Eserler' },
];

function formatMetric(metric) {
  if (metric.format === 'duration') return `${String(Math.floor(metric.value / 60)).padStart(2, '0')}:${String(metric.value % 60).padStart(2, '0')}`;
  return numberFormat.format(metric.value);
}

function MetricIcon({ type }) {
  if (type === 'visitors') return <IconUser size={19} />;
  if (type === 'sessions') return <IconClock size={19} />;
  if (type === 'participation') return <IconCalendar size={19} />;
  if (type === 'views') return <IconDocument size={19} />;
  return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>;
}

function TrendChart({ data }) {
  const width = 620; const height = 170; const padding = 24;
  const max = Math.max(...data.flatMap((item) => [item.total, item.unique]), 1);
  const points = (key) => data.map((item, index) => `${padding + index * ((width - padding * 2) / (data.length - 1))},${height - padding - (item[key] / max) * (height - padding * 2)}`).join(' ');
  return <div className="report-line-chart"><div className="report-chart-legend"><span><i />Toplam Ziyaret</span><span><i />Eşsiz Ziyaretçi</span></div><svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-label="Ziyaretçi trendi grafiği">{[0,1,2,3,4].map((line) => <line key={line} x1={padding} x2={width-padding} y1={padding+line*((height-padding*2)/4)} y2={padding+line*((height-padding*2)/4)} />)}<polyline className="total" points={points('total')} /><polyline className="unique" points={points('unique')} />{data.map((item,index) => <text key={item.label} x={padding+index*((width-padding*2)/(data.length-1))} y={height-4} textAnchor="middle">{item.label}</text>)}</svg></div>;
}

function DonutChart({ devices }) {
  let cursor = 0;
  const gradient = devices.map((item) => { const start = cursor; cursor += item.value; return `${item.color} ${start}% ${cursor}%`; }).join(',');
  return <div className="device-chart"><div className="device-donut" style={{ background: `conic-gradient(${gradient})` }}><span><strong>{numberFormat.format(devices.reduce((sum,item) => sum + item.count,0))}</strong><small>Oturum</small></span></div><ul>{devices.map((item) => <li key={item.label}><i style={{ background:item.color }} /><span>{item.label}</span><strong>%{item.value}</strong><small>({numberFormat.format(item.count)})</small></li>)}</ul></div>;
}

export default function GisAnalyticsPage() {
  const [statistics, setStatistics] = useState(null);
  const [charts, setCharts] = useState(null);
  const [geojson, setGeojson] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('30');
  const [comparison, setComparison] = useState(false);
  const [activeLayers, setActiveLayers] = useState(() => new Set(mapLayers.map((item) => item.key)));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([api.getStatistics(), api.getCharts(), api.getLocations()])
      .then(([stats, chartData, locations]) => { if (active) { setStatistics(stats); setCharts(chartData); setGeojson(locations); } })
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const report = charts?.reporting;
  const filteredGeojson = useMemo(() => geojson ? { ...geojson, features: geojson.features.filter((feature) => activeLayers.has(feature.properties?.category || 'diger')).map((feature,index) => ({ ...feature, properties: { ...feature.properties, weight: .45 + (index % 6) * .1 } })) } : null, [activeLayers, geojson]);

  const toggleLayer = (key) => setActiveLayers((current) => { const next = new Set(current); if (next.has(key)) next.delete(key); else next.add(key); return next; });
  const downloadReport = (reportType = 'genel') => {
    if (!report) return;
    const rows = [['Rapor','Değer','Değişim'], ...report.metrics.map((item) => [item.label, formatMetric(item), `%${item.change}`]), [], ['İlçe','Pay','Ziyaret'], ...report.districts.map((item) => [item.label, `%${item.value}`, item.count])];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? '').replaceAll('"','""')}"`).join(';')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['\ufeff', csv], { type:'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `tkmbs-${reportType}-raporu.csv`; link.click(); URL.revokeObjectURL(url);
  };

  if (loading) return <div className="analytics-state"><span /><strong>Analitik veriler hazırlanıyor…</strong></div>;
  if (error || !statistics || !report) return <div className="analytics-state error"><IconDocument size={36} /><strong>Raporlama verileri yüklenemedi</strong><p>Lütfen veri bağlantısını kontrol edin.</p></div>;

  const showGis = activeTab === 'overview' || activeTab === 'gis';
  const showUsage = activeTab === 'overview' || activeTab === 'usage';
  const showContent = activeTab === 'overview' || activeTab === 'content';

  return <div className="analytics-page">
    <header className="analytics-header"><div><h1>Raporlama & Analitik</h1><p>CBS istatistikleri, kullanım analizleri ve performans raporları</p></div><div className="analytics-actions"><label><IconCalendar size={14} /><select value={dateRange} onChange={(event) => setDateRange(event.target.value)}><option value="7">Son 7 gün</option><option value="30">Son 30 gün</option><option value="90">Son 90 gün</option></select></label><button type="button" className={comparison ? 'active' : ''} onClick={() => setComparison((value) => !value)}>↻ Karşılaştır</button><button type="button" className="create-report" onClick={() => downloadReport('genel')}><IconDocument size={14} /> Rapor Oluştur</button></div></header>
    <nav className="analytics-tabs" aria-label="Rapor bölümleri">{tabs.map((tab) => <button type="button" key={tab.key} className={activeTab === tab.key ? 'active' : ''} onClick={() => setActiveTab(tab.key)}>{tab.label}</button>)}</nav>

    <section className="analytics-metrics">{report.metrics.map((metric) => <article key={metric.key}><div><MetricIcon type={metric.key} /></div><span><small>{metric.label}</small><strong>{formatMetric(metric)}</strong><p>↑ %{comparison ? (metric.change - 3.2).toFixed(1) : metric.change}<b>Son {dateRange} gün</b></p></span></article>)}</section>

    <div className={`analytics-dashboard ${activeTab !== 'overview' ? 'focused' : ''}`}>
      {showGis && <section className="analytics-card spatial-card"><header><div><span>CBS</span><h2>Mekânsal ziyaret dağılımı</h2></div><small>{filteredGeojson?.features.length || 0} aktif konum</small></header><div className="spatial-map"><OpenLayersMap geojson={filteredGeojson} heatmap fitToData showControls height="100%" /><aside><strong>Katmanlar</strong>{mapLayers.map((item) => <label key={item.key}><input type="checkbox" checked={activeLayers.has(item.key)} onChange={() => toggleLayer(item.key)} />{item.label}</label>)}<div className="heat-legend"><span>Yoğunluk</span><i /><small>Düşük <b>Yüksek</b></small></div></aside></div></section>}

      {showUsage && <section className="analytics-card trend-card"><header><div><span>KULLANIM</span><h2>Ziyaretçi trendi</h2></div><select><option>Günlük</option><option>Haftalık</option></select></header><TrendChart data={report.trend} /></section>}
      {showContent && <section className="analytics-card top-content-card"><header><div><span>İÇERİK</span><h2>En çok ziyaret edilenler</h2></div><small>Görüntüleme</small></header><ol>{report.topContent.map((item,index) => <li key={item.title}><b>{index+1}</b><span>{item.title}</span><strong>{numberFormat.format(item.views)}</strong><em>↑ %{item.change}</em></li>)}</ol></section>}

      {showUsage && <section className="analytics-card device-card"><header><div><span>OTURUM</span><h2>Cihaz dağılımı</h2></div></header><DonutChart devices={report.devices} /></section>}
      {showUsage && <section className="analytics-card district-card"><header><div><span>COĞRAFİ</span><h2>İlçelere göre ziyaret</h2></div></header><div>{report.districts.map((item) => <p key={item.label}><span>{item.label}</span><i><b style={{ width:`${item.value/46*100}%` }} /></i><strong>%{item.value}</strong><small>({numberFormat.format(item.count)})</small></p>)}</div></section>}
      {showUsage && <section className="analytics-card hourly-card"><header><div><span>ZAMAN</span><h2>Saatlere göre ziyaret</h2></div></header><div className="hourly-labels">{['00','02','04','06','08','10','12','14','16','18','20','22'].map((hour) => <span key={hour}>{hour}</span>)}</div><div className="hourly-grid">{report.hourly.flatMap((row,rowIndex) => row.map((value,columnIndex) => <i key={`${rowIndex}-${columnIndex}`} style={{ '--heat':value/10 }} />))}</div><div className="hourly-scale"><span>Düşük</span><i /><span>Yüksek</span></div></section>}

      {showContent && <section className="analytics-card event-performance-card"><header><div><span>ETKİNLİK</span><h2>Etkinlik performansı</h2></div></header><div className="analytics-table"><div><b>Etkinlik</b><b>Katılımcı</b><b>Görüntüleme</b><b>Değişim</b></div>{report.eventPerformance.map((item) => <div key={item.title}><strong>{item.title}</strong><span>{numberFormat.format(item.participants)}</span><span>{numberFormat.format(item.views)}</span><em>↑ %{item.change}</em></div>)}</div></section>}
      {showContent && <section className="analytics-card reports-card"><header><div><span>DIŞA AKTAR</span><h2>Raporlama</h2></div></header><div>{report.reports.map((item) => <button type="button" key={item.id} onClick={() => downloadReport(item.id)}><IconDocument size={18} /><span><strong>{item.title}</strong><small>{item.description}</small></span><b>{item.format}</b></button>)}</div></section>}
    </div>
  </div>;
}
