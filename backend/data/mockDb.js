import { monuments, categoryCounts } from './monuments.js';
import { culturalRoutes } from './routes.js';
import { events, eventCategoryCounts } from './events.js';
import { statistics, weather, chartData, buildStatistics, buildChartData } from './statistics.js';
import { buildRoutePreview } from '../services/cbs/mockCbsProvider.js';
import { buildAdminDashboard, reviewAdminRecord } from './adminDashboard.js';
import { getUserFavorites, toggleUserFavorite, getUserRoutes, saveUserRoute } from './userData.js';

export { monuments, events, categoryCounts, eventCategoryCounts, statistics, weather, chartData };
export const routes = culturalRoutes;

export const notifications = [
  { id: 1, type: 'event', title: 'Yeni etkinlik eklendi', message: 'Kültürel Mirası Koruma Paneli etkinlik takvimine eklendi.', date: '10 dakika önce', createdAt: '2026-08-21T14:20:00+03:00', link: '/etkinlikler/13', read: false },
  { id: 2, type: 'monument', title: 'Envanter kaydı güncellendi', message: 'Habib-i Neccar Camii koruma ve ziyaret bilgileri yenilendi.', date: '2 saat önce', createdAt: '2026-08-21T12:30:00+03:00', link: '/tarihi-eserler/habib-i-neccar-camii', read: false },
  { id: 3, type: 'route', title: 'Yeni kültür rotası', message: 'İskenderun Sahil Kültür Turu ziyaretçilerin kullanımına açıldı.', date: '1 gün önce', createdAt: '2026-08-20T16:00:00+03:00', link: '/kultur-rotalari/iskenderun-sahil-kordonu', read: false },
  { id: 4, type: 'event', title: 'Etkinlik programı açıklandı', message: 'Antakya Medeniyetler Korosu Konseri program ayrıntıları yayımlandı.', date: '3 gün önce', createdAt: '2026-08-18T10:15:00+03:00', link: '/etkinlikler/11', read: true },
  { id: 5, type: 'route', title: 'Rota süresi güncellendi', message: 'İnanç ve Medeniyet Rotası için tahmini gezi süresi yeniden hesaplandı.', date: '5 gün önce', createdAt: '2026-08-16T09:40:00+03:00', link: '/kultur-rotalari/inanc-ve-medeniyet-rotasi', read: true },
  { id: 6, type: 'system', title: 'Harita katmanları yenilendi', message: 'Tarihi eser ve doğal güzellik katmanlarının gösterim ayarları güncellendi.', date: '1 hafta önce', createdAt: '2026-08-14T11:00:00+03:00', link: '/harita', read: true },
  { id: 7, type: 'monument', title: 'Yeni fotoğraflar eklendi', message: 'Payas Kalesi envanter kaydına yeni saha fotoğrafları eklendi.', date: '2 hafta önce', createdAt: '2026-08-07T13:20:00+03:00', link: '/tarihi-eserler/payas-kalesi', read: true },
  { id: 8, type: 'system', title: 'Kültürel miras arşivi', message: 'Aylık veri doğrulama çalışması başarıyla tamamlandı.', date: '3 hafta önce', createdAt: '2026-07-31T15:00:00+03:00', link: '/tarihi-eserler', read: true },
];

function includesText(value, query) {
  return String(value || '').toLocaleLowerCase('tr-TR').includes(query);
}

export function getMonuments(params = {}) {
  const query = String(params.search || '').trim().toLocaleLowerCase('tr-TR');
  return monuments.filter((item) => (
    (!params.category || params.category === 'tumu' || item.category === params.category)
    && (!params.type || params.type === 'tumu' || item.type === params.type)
    && (!params.district || params.district === 'tumu' || item.district === params.district)
    && (!query || includesText(item.name, query) || includesText(item.description, query))
  ));
}

const architectureByCategory = {
  camii: 'Geleneksel taş işçiliği ve İslam mimarisi',
  kilise: 'Erken dönem Hristiyanlık ve kaya mimarisi',
  muze: 'Müze ve sergileme yapısı',
  han: 'Osmanlı dönemi ticaret yapısı',
  kopru: 'Taş kemerli ulaşım yapısı',
  kale: 'Savunma mimarisi ve taş sur sistemi',
  doga: 'Doğal ve kültürel peyzaj alanı',
  diger: 'Tarihi taş yapı ve arkeolojik miras',
};

function distanceInKm(first, second) {
  if (!Array.isArray(first) || !Array.isArray(second)) return Number.POSITIVE_INFINITY;
  const toRadians = (value) => value * Math.PI / 180;
  const [lat1, lon1] = first;
  const [lat2, lon2] = second;
  const latDelta = toRadians(lat2 - lat1);
  const lonDelta = toRadians(lon2 - lon1);
  const value = Math.sin(latDelta / 2) ** 2
    + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(lonDelta / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function enrichMonument(item) {
  if (!item) return null;
  const nearby = monuments
    .filter((candidate) => candidate.id !== item.id)
    .map((candidate) => ({ ...candidate, calculatedDistance: distanceInKm(item.coordinates, candidate.coordinates) }))
    .sort((a, b) => a.calculatedDistance - b.calculatedDistance)
    .slice(0, 3)
    .map((candidate) => ({
      id: candidate.id,
      slug: candidate.slug,
      name: candidate.name,
      image: candidate.image,
      category: candidate.category,
      distance: `${candidate.calculatedDistance.toFixed(1)} km`,
    }));

  return {
    ...item,
    typeLabel: item.typeLabel || (item.type === 'anit' ? 'Anıt' : item.type === 'doga' ? 'Doğal Alan' : 'Tarihi Yapı'),
    longDescription: item.longDescription || item.description || `${item.name}, Hatay'ın kültürel belleğini taşıyan önemli miras değerlerinden biridir.`,
    architecture: item.architecture || architectureByCategory[item.category] || architectureByCategory.diger,
    usage: item.usage || (item.category === 'camii' || item.category === 'kilise' ? 'Aktif ibadet yapısı' : 'Ziyarete açık'),
    workingHours: item.workingHours || 'Her gün 09:00 - 17:00',
    entryFee: item.entryFee || 'Bilgi alınız',
    protectionStatus: item.protectionStatus || 'Kayıtlı',
    registrationStatus: item.registrationStatus || 'Tescilli',
    registrationNo: item.registrationNo || `TKMBS-${String(item.id).padStart(5, '0')}`,
    images: item.images?.length ? item.images : [item.image].filter(Boolean),
    highlights: item.highlights?.length ? item.highlights : [
      `${item.district || 'Hatay'} kültürel mirasının önemli örneklerinden`,
      `${item.period || 'Tarihi dönem'} izlerini taşıyor`,
      'Koruma envanterinde kayıtlı kültür varlığı',
    ],
    timeline: item.timeline?.length ? item.timeline : [
      { year: item.century || item.period || 'Tarihi Dönem', text: `${item.name} yapısının oluştuğu ve geliştiği dönem.` },
      { year: 'Yakın Dönem', text: 'Koruma ve belgeleme çalışmalarıyla kültürel miras envanterine alındı.' },
      { year: 'Günümüz', text: 'Düzenli kontrollerle korunarak ziyaretçilere tanıtılıyor.' },
    ],
    restorations: item.restorations || [
      { year: '2024', title: 'Durum tespiti', description: 'Yapının güncel fiziksel durumu kayıt altına alındı.' },
      { year: '2022', title: 'Belgeleme çalışması', description: 'Fotoğraf ve envanter bilgileri güncellendi.' },
    ],
    documents: item.documents || [
      { id: `${item.id}-envanter`, title: 'Kültür Varlığı Envanter Kaydı', type: 'Envanter', status: 'Erişime açık' },
      { id: `${item.id}-koruma`, title: 'Koruma Durumu Raporu', type: 'Rapor', status: 'Erişime açık' },
    ],
    funFact: item.funFact || `${item.name}, bulunduğu çevrenin tarihsel kimliğini günümüze taşıyan önemli duraklardan biridir.`,
    nearby,
  };
}

export function getMonument(idOrSlug) {
  return enrichMonument(monuments.find((item) => item.id === Number(idOrSlug) || item.slug === String(idOrSlug)));
}

export function getRoutes(params = {}) {
  return culturalRoutes.filter((item) => (
    (!params.category || params.category === 'tumu' || item.category === params.category)
    && (!params.difficulty || params.difficulty === 'tumu' || item.difficulty === params.difficulty)
    && (!params.district || params.district === 'tumu' || item.district === params.district)
  ));
}

export function getRoute(idOrSlug) {
  const route = culturalRoutes.find((item) => item.id === Number(idOrSlug) || item.slug === String(idOrSlug));
  if (!route) return null;
  const preview = buildRoutePreview({
    monuments,
    stopIds: route.monumentIds,
    travelMode: route.travelMode || 'walking',
    routeId: route.id,
    title: route.title,
  });
  return { ...route, ...preview };
}

export function previewRoute(params = {}) {
  return buildRoutePreview({
    monuments,
    stopIds: params.stopIds || [],
    travelMode: params.travelMode || 'walking',
    visitMinutes: Number(params.visitMinutes) || 25,
    routeId: params.routeId || 'preview',
    title: params.title || 'Özel Rota Önizlemesi',
  });
}

export function getEvents(params = {}) {
  return events.filter((item) => (
    (!params.category || params.category === 'tumu' || item.category === params.category)
    && (!params.district || params.district === 'tumu' || item.district === params.district)
  ));
}

const eventCoordinates = {
  Antakya: [36.2021, 36.1605],
  Payas: [36.7563, 36.2146],
  Samandağ: [36.0847, 35.9771],
  Defne: [36.1735, 36.1386],
  Arsuz: [36.413, 35.8903],
  Reyhanlı: [36.2692, 36.5672],
  İskenderun: [36.5872, 36.1735],
};

function addHours(time = '10:00', hours = 2) {
  const [hour, minute] = time.split(':').map(Number);
  return `${String((hour + hours) % 24).padStart(2, '0')}:${String(minute || 0).padStart(2, '0')}`;
}

function enrichEvent(item) {
  if (!item) return null;
  const endTime = item.endTime || addHours(item.time, item.category === 'festival' ? 4 : 2);
  return {
    ...item,
    slug: item.slug || String(item.id),
    longDescription: item.longDescription || `${item.description} Hatay'ın kültürel yaşamını görünür kılan bu program; yerel mirası, sanat üretimini ve kent belleğini farklı yaş gruplarıyla buluşturmak amacıyla hazırlanmıştır.`,
    address: item.address || `${item.venue}, ${item.district} / Hatay`,
    coordinates: item.coordinates || eventCoordinates[item.district] || eventCoordinates.Antakya,
    endTime,
    organizer: item.organizer || 'Hatay Büyükşehir Belediyesi Kültür ve Sosyal İşler Dairesi',
    contactPhone: item.contactPhone || '444 12 06',
    contactEmail: item.contactEmail || 'kultur@hatay.bel.tr',
    entryFee: item.entryFee || 'Ücretsiz',
    registrationRequired: item.registrationRequired ?? false,
    capacity: item.capacity || (item.category === 'atolye' ? 30 : 250),
    accessibility: item.accessibility || 'Erişilebilir alan',
    audience: item.audience || 'Tüm yaş grupları',
    program: item.program || [
      { time: item.time, title: 'Karşılama ve etkinlik başlangıcı' },
      { time: addHours(item.time, 1), title: item.category === 'gezi' ? 'Rehberli rota ve anlatım' : 'Ana program' },
      { time: endTime, title: 'Program sonu' },
    ],
  };
}

export function getEvent(idOrSlug) {
  return enrichEvent(events.find((item) => item.id === Number(idOrSlug) || item.slug === String(idOrSlug)));
}

export function getNotificationCount() {
  return notifications.filter((item) => !item.read).length;
}

export function getNotifications() {
  return notifications.map((item) => ({ ...item }));
}

export function markNotificationRead(id) {
  const notification = notifications.find((item) => item.id === Number(id));
  if (notification) notification.read = true;
  return notification ? { ...notification } : null;
}

export function markAllNotificationsRead() {
  notifications.forEach((item) => { item.read = true; });
  return notifications.map((item) => ({ ...item }));
}

export function getWeather() {
  return { ...weather };
}

export function getStatistics() {
  return buildStatistics({ monuments, routes: culturalRoutes, events });
}

export function getCharts() {
  return buildChartData({ monuments, routes: culturalRoutes, events });
}

export function getAdminDashboard() {
  const statisticsData = getStatistics();
  const chartsData = getCharts();
  return buildAdminDashboard({ monuments, routes: culturalRoutes, events, statistics: statisticsData, charts: chartsData });
}

export function reviewAdminItem(id, decision) {
  return reviewAdminRecord(id, decision);
}

export function getFavorites() {
  return getUserFavorites();
}

export function toggleFavorite(type, id) {
  return toggleUserFavorite(type, id, { monuments, routes: culturalRoutes, events });
}

export function getCustomRoutes() {
  return getUserRoutes();
}

export function saveCustomRoute(payload) {
  return saveUserRoute(payload, monuments);
}

export default {
  monuments,
  routes,
  events,
  notifications,
  categoryCounts,
  eventCategoryCounts,
  statistics,
  weather,
  chartData,
  getMonuments,
  getMonument,
  getRoutes,
  getRoute,
  previewRoute,
  getEvents,
  getEvent,
  getNotificationCount,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getWeather,
  getStatistics,
  getCharts,
  getAdminDashboard,
  reviewAdminItem,
  getFavorites,
  toggleFavorite,
  getCustomRoutes,
  saveCustomRoute,
};
