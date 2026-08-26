/**
 * API Servisi - Tak-Çıkar Sistemi
 * 
 * USE_MOCK_DB = true  → Sahte veritabanından veri çeker (geliştirme)
 * USE_MOCK_DB = false → Gerçek backend API'den veri çeker (production)
 * 
 * Gerçek veritabanı geldiğinde sadece USE_MOCK_DB = false yapın.
 * Başka hiçbir şeyi değiştirmeye gerek yok.
 */

// ━━━ TAK-ÇIKAR ANAHTARI ━━━
const USE_MOCK_DB = true;
// ━━━━━━━━━━━━━━━━━━━━━━━━━━

import { authenticatedFetch } from './authClient';

// Default placeholder resim - fotoğraf yoksa bu gösterilir
export const DEFAULT_IMAGE = '/assets/default-placeholder.svg';

/**
 * Fotoğraf URL'sini kontrol eder.
 * Varsa URL'yi döndürür, yoksa default placeholder gösterir.
 */
export function getImageUrl(url) {
  if (url && url.trim() !== '') return url;
  return DEFAULT_IMAGE;
}

const weatherLabels = {
  0: 'Açık', 1: 'Çoğunlukla açık', 2: 'Parçalı bulutlu', 3: 'Kapalı',
  45: 'Sisli', 48: 'Kırağılı sis', 51: 'Hafif çisenti', 53: 'Çisenti',
  55: 'Yoğun çisenti', 61: 'Hafif yağmurlu', 63: 'Yağmurlu', 65: 'Kuvvetli yağmur',
  71: 'Hafif kar', 73: 'Karlı', 75: 'Yoğun kar', 80: 'Sağanak yağışlı',
  81: 'Sağanak yağışlı', 82: 'Kuvvetli sağanak', 95: 'Gök gürültülü',
  96: 'Dolu ihtimalli fırtına', 99: 'Dolu ve fırtına',
};

function normalizeFallbackWeather(weather = {}) {
  return {
    temp: weather.temp ?? weather.temperature ?? 24,
    temperature: weather.temperature ?? weather.temp ?? 24,
    desc: weather.desc ?? weather.condition ?? 'Bilgi alınamadı',
    condition: weather.condition ?? weather.desc ?? 'Bilgi alınamadı',
    location: weather.location || 'Antakya',
    forecast: weather.forecast || [],
    live: false,
  };
}

async function getLiveWeather(fallback = {}) {
  const safeFallback = normalizeFallbackWeather(fallback);
  try {
    const params = new URLSearchParams({
      latitude: '36.2021',
      longitude: '36.1605',
      current: 'temperature_2m,apparent_temperature,weather_code,wind_speed_10m,is_day',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min',
      timezone: 'Europe/Istanbul',
      forecast_days: '5',
    });
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
    if (!response.ok) throw new Error(`Hava durumu servisi: ${response.status}`);
    const payload = await response.json();
    const current = payload.current || {};
    const daily = payload.daily || {};
    const description = weatherLabels[current.weather_code] || 'Değişken hava';
    return {
      temp: Math.round(current.temperature_2m),
      temperature: Math.round(current.temperature_2m),
      desc: description,
      condition: description,
      feelsLike: Math.round(current.apparent_temperature),
      windSpeed: Math.round(current.wind_speed_10m),
      isDay: Boolean(current.is_day),
      location: 'Antakya',
      updatedAt: current.time,
      live: true,
      forecast: (daily.time || []).map((date, index) => ({
        date,
        day: new Intl.DateTimeFormat('tr-TR', { weekday: 'short' }).format(new Date(`${date}T12:00:00`)),
        tempMax: Math.round(daily.temperature_2m_max[index]),
        tempMin: Math.round(daily.temperature_2m_min[index]),
        code: daily.weather_code[index],
        desc: weatherLabels[daily.weather_code[index]] || 'Değişken',
      })),
    };
  } catch (error) {
    console.warn('Canlı hava durumu alınamadı, yedek veri kullanılıyor.', error);
    return safeFallback;
  }
}

function monumentsToGeoJSON(monuments = []) {
  return {
    type: 'FeatureCollection',
    features: monuments
      .filter((m) => Array.isArray(m.coordinates) && m.coordinates.length === 2)
      .map((m) => ({
        type: 'Feature',
        id: m.id,
        properties: {
          id: m.id,
          name: m.name,
          slug: m.slug,
          type: m.type,
          category: m.category,
          district: m.district,
          description: m.description,
          image: m.image,
        },
        geometry: {
          type: 'Point',
          coordinates: [m.coordinates[1], m.coordinates[0]],
        },
      })),
  };
}

// ──────────────────────────────────
// GERÇEK API FONKSİYONLARI
// ──────────────────────────────────
async function fetchAPI(endpoint) {
  const res = await authenticatedFetch(endpoint);
  if (!res.ok) throw new Error(`API hatası: ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Bilinmeyen hata');
  return json.data;
}

async function sendAPI(endpoint, payload) {
  const res = await authenticatedFetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`API hatası: ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Bilinmeyen hata');
  return json.data;
}

const realApi = {
  search: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchAPI(`/search${q ? `?${q}` : ''}`);
  },
  getMonuments: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchAPI(`/monuments${q ? `?${q}` : ''}`);
  },
  getMonumentsPage: (params = {}) => {
    const q = new URLSearchParams({ ...params, page: params.page || 1, pageSize: params.pageSize || 9 }).toString();
    return fetchAPI(`/monuments?${q}`);
  },
  getMonument: (id) => fetchAPI(`/monuments/${id}`),
  getRoutes: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchAPI(`/routes${q ? `?${q}` : ''}`);
  },
  getRoutesPage: (params = {}) => {
    const q = new URLSearchParams({ ...params, page: params.page || 1, pageSize: params.pageSize || 9 }).toString();
    return fetchAPI(`/routes?${q}`);
  },
  getRoute: (id) => fetchAPI(`/routes/${id}`),
  previewRoute: (payload) => sendAPI('/routes/preview', payload),
  getEvents: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchAPI(`/events${q ? `?${q}` : ''}`);
  },
  getEventsPage: (params = {}) => {
    const q = new URLSearchParams({ ...params, page: params.page || 1, pageSize: params.pageSize || 9 }).toString();
    return fetchAPI(`/events?${q}`);
  },
  getEventCalendar: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchAPI(`/events/calendar${q ? `?${q}` : ''}`);
  },
  getEvent: (id) => fetchAPI(`/events/${id}`),
  getNotificationCount: () => fetchAPI('/notifications/count'),
  getNotifications: () => fetchAPI('/notifications'),
  markNotificationRead: (id) => sendAPI(`/notifications/${id}/read`, {}),
  markAllNotificationsRead: () => sendAPI('/notifications/read-all', {}),
  getStatistics: () => fetchAPI('/statistics'),
  getWeather: () => fetchAPI('/weather'),
  getCategories: () => fetchAPI('/categories'),
  getEventCategoryCounts: () => fetchAPI('/events/categories/counts'),
  getLocations: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchAPI(`/locations${q ? `?${q}` : ''}`);
  },
  getLocation: (id) => fetchAPI(`/locations/${id}`),
  getCharts: () => fetchAPI('/charts'),
  getAboutContent: () => fetchAPI('/content/about'),
  getHomeContent: () => fetchAPI('/content/home'),
  getAdminDashboard: () => fetchAPI('/admin/dashboard'),
  reviewAdminItem: (id, decision) => sendAPI(`/admin/reviews/${id}/decision`, { decision }),
  getFavorites: () => fetchAPI('/user/favorites'),
  getProfileOverview: () => fetchAPI('/user/profile-overview'),
  updatePreferences: (payload) => sendAPI('/user/preferences', payload),
  toggleFavorite: (type, id) => sendAPI(`/user/favorites/${type}/${id}/toggle`, {}),
  getCustomRoutes: () => fetchAPI('/user/routes'),
  saveCustomRoute: (payload) => sendAPI('/user/routes', payload),
};

// ──────────────────────────────────
// SAHTE VERİTABANI FONKSİYONLARI
// ──────────────────────────────────
let mockDb = null;

async function getMockDb() {
  if (!mockDb) {
    mockDb = await import('../../backend/data/mockDb.js');
  }
  return mockDb;
}

// Mock API - gerçek API ile aynı arayüzü kullanır
const mockApi = {
  search: async (params = {}) => {
    const db = await getMockDb();
    return db.searchCatalog(params);
  },
  getMonuments: async (params = {}) => {
    const db = await getMockDb();
    return db.getMonuments(params);
  },
  getMonumentsPage: async (params = {}) => {
    const db = await getMockDb();
    return db.getMonumentsPage(params);
  },
  getMonument: async (id) => {
    const db = await getMockDb();
    return db.getMonument(id);
  },
  getRoutes: async (params = {}) => {
    const db = await getMockDb();
    return db.getRoutes(params);
  },
  getRoutesPage: async (params = {}) => {
    const db = await getMockDb();
    return db.getRoutesPage(params);
  },
  getRoute: async (id) => {
    const db = await getMockDb();
    return db.getRoute(id);
  },
  previewRoute: async (payload) => {
    const db = await getMockDb();
    return db.previewRoute(payload);
  },
  getEvents: async (params = {}) => {
    const db = await getMockDb();
    return db.getEvents(params);
  },
  getEventsPage: async (params = {}) => {
    const db = await getMockDb();
    return db.getEventsPage(params);
  },
  getEventCalendar: async (params = {}) => {
    const db = await getMockDb();
    return db.getEventCalendar(params);
  },
  getEvent: async (id) => {
    const db = await getMockDb();
    return db.getEvent(id);
  },
  getNotificationCount: async () => {
    const db = await getMockDb();
    return db.getNotificationCount();
  },
  getNotifications: async () => {
    const db = await getMockDb();
    return db.getNotifications();
  },
  markNotificationRead: async (id) => {
    const db = await getMockDb();
    return db.markNotificationRead(id);
  },
  markAllNotificationsRead: async () => {
    const db = await getMockDb();
    return db.markAllNotificationsRead();
  },
  getStatistics: async () => {
    const db = await getMockDb();
    return db.getStatistics();
  },
  getWeather: async () => {
    const db = await getMockDb();
    return getLiveWeather(db.getWeather());
  },
  getCategories: async () => {
    const db = await getMockDb();
    return db.categoryCounts;
  },
  getEventCategoryCounts: async () => {
    const db = await getMockDb();
    return db.eventCategoryCounts;
  },
  getLocations: async (params = {}) => {
    const db = await getMockDb();
    return monumentsToGeoJSON(db.getMonuments(params));
  },
  getLocation: async (id) => {
    const db = await getMockDb();
    return db.getMonument(id);
  },
  getCharts: async () => {
    const db = await getMockDb();
    return db.getCharts();
  },
  getAboutContent: async () => {
    const db = await getMockDb();
    return db.getAboutContent();
  },
  getHomeContent: async () => {
    const db = await getMockDb();
    return db.getHomeContent();
  },
  getAdminDashboard: async () => {
    try {
      return await realApi.getAdminDashboard();
    } catch {
      const db = await getMockDb();
      const dashboard = db.getAdminDashboard();
      return { ...dashboard, cms: { connected: false, source: 'Yerel örnek veri', adminUrl: 'http://localhost:3000/admin' } };
    }
  },
  reviewAdminItem: async (id, decision) => {
    const db = await getMockDb();
    return db.reviewAdminItem(id, decision);
  },
  getFavorites: async () => {
    const db = await getMockDb();
    return db.getFavorites();
  },
  getProfileOverview: async () => {
    const db = await getMockDb();
    return db.getProfileOverview();
  },
  updatePreferences: async (payload) => {
    const db = await getMockDb();
    return db.savePreferences(payload);
  },
  toggleFavorite: async (type, id) => {
    const db = await getMockDb();
    return db.toggleFavorite(type, id);
  },
  getCustomRoutes: async () => {
    const db = await getMockDb();
    return db.getCustomRoutes();
  },
  saveCustomRoute: async (payload) => {
    const db = await getMockDb();
    return db.saveCustomRoute(payload);
  },
};

// Kullanıcıya özel ve durum değiştiren bildirim işlemleri hiçbir zaman tarayıcıdaki
// örnek veri modülüne düşmez. Okundu bilgisi backend üzerinden PostgreSQL'de tutulur.
const persistentNotificationApi = {
  getNotificationCount: realApi.getNotificationCount,
  getNotifications: realApi.getNotifications,
  markNotificationRead: realApi.markNotificationRead,
  markAllNotificationsRead: realApi.markAllNotificationsRead,
};

// ──────────────────────────────────
// EXPORT - İçerik kaynağını seçer, kullanıcı durumunu daima gerçek API'de tutar
// ──────────────────────────────────
export const api = USE_MOCK_DB ? { ...mockApi, ...persistentNotificationApi } : realApi;
export default api;
