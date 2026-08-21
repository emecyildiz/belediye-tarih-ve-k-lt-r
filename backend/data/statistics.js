import { monuments as defaultMonuments } from './monuments.js';
import { culturalRoutes as defaultRoutes } from './routes.js';
import { events as defaultEvents } from './events.js';

/**
 * Mock analiz tabloları. Gerçek veritabanında bunlar ziyaret, oturum, içerik
 * görüntüleme ve katılım tablolarına karşılık gelir. İçerik adları burada
 * tutulmaz; sourceType + sourceId ile ana kayda bağlanır.
 */
export const analyticsFacts = {
  summary: {
    uniqueVisitors: 18532,
    averageSessionSeconds: 272,
    previousPeriodChange: { visits: 18.7, visitors: 21.4, views: 22.1, sessions: 11.2, participation: 15.8 },
  },
  trafficTrend: [
    { label: '24 Tem', visits: 29240, uniqueVisitors: 10420 },
    { label: '28 Tem', visits: 31810, uniqueVisitors: 11230 },
    { label: '1 Ağu', visits: 27890, uniqueVisitors: 9860 },
    { label: '5 Ağu', visits: 38125, uniqueVisitors: 13210 },
    { label: '9 Ağu', visits: 30644, uniqueVisitors: 10740 },
    { label: '13 Ağu', visits: 47310, uniqueVisitors: 15820 },
    { label: '17 Ağu', visits: 34512, uniqueVisitors: 11940 },
    { label: '21 Ağu', visits: 35760, uniqueVisitors: 12460 },
  ],
  deviceSessions: [
    { device: 'Mobil', count: 171806, color: '#173f9f' },
    { device: 'Masaüstü', count: 86187, color: '#3482e4' },
    { device: 'Tablet', count: 17298, color: '#ef4d3f' },
  ],
  districtVisits: [
    { district: 'Antakya', count: 125247 }, { district: 'Samandağ', count: 40956 },
    { district: 'İskenderun', count: 29297 }, { district: 'Reyhanlı', count: 24057 },
    { district: 'Dörtyol', count: 21174 }, { district: 'Kırıkhan', count: 14060 },
    { district: 'Hassa', count: 11620 }, { district: 'Diğer', count: 8880 },
  ],
  hourlyVisits: [
    [1,1,1,1,2,3,5,7,8,7,4,2], [1,1,1,1,2,4,6,8,9,8,5,2], [1,1,1,1,3,5,7,9,10,8,5,2],
    [1,1,1,1,2,4,7,9,9,7,4,2], [1,1,1,1,3,6,8,10,10,8,6,3], [1,1,1,2,4,6,8,9,8,6,4,2],
    [1,1,1,1,2,3,5,7,7,5,3,2],
  ],
  contentPerformance: [
    { sourceType: 'monument', sourceId: 1, views: 45231, change: 24.6 },
    { sourceType: 'monument', sourceId: 2, views: 34872, change: 18.9 },
    { sourceType: 'event', sourceId: 14, views: 28194, change: 31.7 },
    { sourceType: 'monument', sourceId: 4, views: 22105, change: 15 },
    { sourceType: 'monument', sourceId: 5, views: 19874, change: 13.2 },
    { sourceType: 'route', sourceId: 1, views: 18720, change: 12.4 },
    { sourceType: 'event', sourceId: 3, views: 17610, change: 19.3 },
    { sourceType: 'route', sourceId: 2, views: 16482, change: 10.8 },
  ],
  eventPerformance: [
    { eventId: 14, participants: 5621, views: 28794, change: 31.7 },
    { eventId: 3, participants: 3245, views: 19870, change: 20.3 },
    { eventId: 9, participants: 1842, views: 9112, change: 18.9 },
    { eventId: 18, participants: 1203, views: 6742, change: 15.1 },
    { eventId: 2, participants: 934, views: 4876, change: 12.7 },
  ],
  additionalPageViews: 447021,
};

export const weather = {
  temperature: 25,
  condition: 'Güneşli',
  location: 'Antakya',
  forecast: [
    { day: 'Pzt', time: '09:00', temp: 24, icon: 'sun' },
    { day: 'Sal', time: '12:00', temp: 27, icon: 'sun' },
    { day: 'Çar', time: '15:00', temp: 26, icon: 'cloud' },
    { day: 'Per', time: '18:00', temp: 23, icon: 'cloud' },
    { day: 'Cum', time: '21:00', temp: 21, icon: 'moon' },
  ],
};

const sum = (rows, field) => rows.reduce((total, row) => total + Number(row[field] || 0), 0);
const countBy = (rows, field, value) => rows.filter((row) => row[field] === value).length;
const percentage = (value, total) => Number((total ? value / total * 100 : 0).toFixed(1));

function resolveContent(fact, sources) {
  const collections = {
    monument: { rows: sources.monuments, titleKey: 'name', path: '/tarihi-eserler' },
    route: { rows: sources.routes, titleKey: 'title', path: '/kultur-rotalari' },
    event: { rows: sources.events, titleKey: 'title', path: '/etkinlikler' },
  };
  const collection = collections[fact.sourceType];
  const record = collection?.rows.find((item) => item.id === fact.sourceId);
  if (!record) return null;
  return { ...fact, title: record[collection.titleKey], slug: record.slug || String(record.id), href: `${collection.path}/${record.slug || record.id}` };
}

export function buildStatistics({ monuments = defaultMonuments, routes = defaultRoutes, events = defaultEvents } = {}) {
  const structural = countBy(monuments, 'type', 'yapi');
  const monumentCount = countBy(monuments, 'type', 'anit');
  const archaeological = monuments.filter((item) => item.category === 'muze' || item.type === 'anit').length;
  return {
    toplamEser: monuments.length,
    yapi: structural,
    anit: monumentCount,
    arkeolojik: archaeological,
    diger: monuments.length - structural - monumentCount,
    kulturRota: routes.length,
    etkinlik: events.length,
    qrNoktasi: 0,
    kullanici: analyticsFacts.summary.uniqueVisitors,
    harita: { toplamEser: monuments.length, kulturRota: routes.length, etkinlik: events.length, qrNoktasi: 0 },
    home: {
      kayitliEser: {
        cami: countBy(monuments, 'category', 'camii'),
        kilise: countBy(monuments, 'category', 'kilise'),
        muze: countBy(monuments, 'category', 'muze'),
      },
      rota: routes.length,
      qr: 0,
    },
    catalog: { kayitliEserler: monuments.length, kulturRotalar: routes.length, toplamFavori: 0, gecmisZiyaret: 0 },
  };
}

export function buildChartData({ monuments = defaultMonuments, routes = defaultRoutes, events = defaultEvents } = {}) {
  const sources = { monuments, routes, events };
  const visits = sum(analyticsFacts.trafficTrend, 'visits');
  const sessions = sum(analyticsFacts.deviceSessions, 'count');
  const resolvedContent = analyticsFacts.contentPerformance.map((fact) => resolveContent(fact, sources));
  const topContent = resolvedContent.filter(Boolean).sort((a, b) => b.views - a.views).slice(0, 5);
  const eventPerformance = analyticsFacts.eventPerformance.map((fact) => {
    const event = events.find((item) => item.id === fact.eventId);
    return event ? { ...fact, title: event.title, slug: event.slug || String(event.id), href: `/etkinlikler/${event.slug || event.id}` } : null;
  }).filter(Boolean);
  const totalParticipation = sum(eventPerformance, 'participants');
  const trackedViews = sum(analyticsFacts.contentPerformance, 'views') + analyticsFacts.additionalPageViews;
  const danglingReferences = resolvedContent.filter((row) => !row).length
    + analyticsFacts.eventPerformance.filter((fact) => !events.some((item) => item.id === fact.eventId)).length;

  return {
    eserler: [
      { label: 'Cami', value: countBy(monuments, 'category', 'camii'), color: '#1e3a5f' },
      { label: 'Kilise', value: countBy(monuments, 'category', 'kilise'), color: '#2563eb' },
      { label: 'Müze', value: countBy(monuments, 'category', 'muze'), color: '#60a5fa' },
    ],
    ziyaretci: analyticsFacts.trafficTrend.map((item) => ({ month: item.label, views: item.visits, visitors: item.uniqueVisitors })),
    reporting: {
      dateRange: { start: '2026-07-21', end: '2026-08-21', label: '21 Temmuz 2026 - 21 Ağustos 2026' },
      metrics: [
        { key: 'visits', label: 'Toplam Ziyaret', value: visits, change: analyticsFacts.summary.previousPeriodChange.visits, format: 'number' },
        { key: 'visitors', label: 'Eşsiz Ziyaretçi', value: analyticsFacts.summary.uniqueVisitors, change: analyticsFacts.summary.previousPeriodChange.visitors, format: 'number' },
        { key: 'views', label: 'Sayfa Görüntüleme', value: trackedViews, change: analyticsFacts.summary.previousPeriodChange.views, format: 'number' },
        { key: 'sessions', label: 'Ortalama Oturum', value: analyticsFacts.summary.averageSessionSeconds, change: analyticsFacts.summary.previousPeriodChange.sessions, format: 'duration' },
        { key: 'participation', label: 'Etkinlik Katılımı', value: totalParticipation, change: analyticsFacts.summary.previousPeriodChange.participation, format: 'number' },
      ],
      trend: analyticsFacts.trafficTrend.map((item) => ({ label: item.label, total: item.visits, unique: item.uniqueVisitors })),
      devices: analyticsFacts.deviceSessions.map((item) => ({ label: item.device, value: percentage(item.count, sessions), count: item.count, color: item.color })),
      districts: analyticsFacts.districtVisits.map((item) => ({ label: item.district, value: percentage(item.count, visits), count: item.count })),
      hourly: analyticsFacts.hourlyVisits.map((row) => [...row]),
      topContent,
      eventPerformance,
      reports: [
        { id: 'cbs', title: 'CBS Analiz Raporu', description: 'Mekânsal veriler ve yoğunluk analizleri', format: 'CSV' },
        { id: 'usage', title: 'Kullanım Analizi Raporu', description: 'Kullanıcı davranışları ve etkileşim raporu', format: 'CSV' },
        { id: 'content', title: 'İçerik Performans Raporu', description: 'İçerik görüntüleme ve etkileşim raporu', format: 'CSV' },
      ],
      integrity: {
        valid: danglingReferences === 0 && visits === sum(analyticsFacts.districtVisits, 'count') && visits === sessions,
        danglingReferences,
        sourceCounts: { monuments: monuments.length, routes: routes.length, events: events.length },
      },
    },
  };
}

// Geriye dönük kullanan bileşenler için aynı üreticiden alınan anlık görünüm.
export const statistics = buildStatistics();
export const chartData = buildChartData();
