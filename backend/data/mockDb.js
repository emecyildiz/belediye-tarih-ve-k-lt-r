import { monuments, categoryCounts } from './monuments.js';
import { culturalRoutes } from './routes.js';
import { events, eventCategoryCounts } from './events.js';
import { statistics, weather, chartData } from './statistics.js';
import { buildRoutePreview } from '../services/cbs/mockCbsProvider.js';

export { monuments, events, categoryCounts, eventCategoryCounts, statistics, weather, chartData };
export const routes = culturalRoutes;

export const notifications = [
  { id: 1, title: 'Yeni etkinlik eklendi', message: 'Kültürel Mirası Koruma Paneli takvime eklendi.', date: '10 dakika önce', read: false },
  { id: 2, title: 'Restorasyon duyurusu', message: 'Habib-i Neccar Camii kayıt bilgileri güncellendi.', date: '2 saat önce', read: false },
  { id: 3, title: 'Yeni kültür rotası', message: 'İskenderun Sahil Kültür Turu kullanıma açıldı.', date: '1 gün önce', read: false },
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

export function getEvent(idOrSlug) {
  return events.find((item) => item.id === Number(idOrSlug) || item.slug === String(idOrSlug)) || null;
}

export function getNotificationCount() {
  return notifications.filter((item) => !item.read).length;
}

export function getNotifications() {
  return notifications.map((item) => ({ ...item }));
}

export function getWeather() {
  return { ...weather };
}

export function getStatistics() {
  return { ...statistics };
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
  getWeather,
  getStatistics,
};
