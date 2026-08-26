import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { monuments, categoryCounts, monumentsToGeoJSON } from './backend/data/monuments.js';
import { culturalRoutes } from './backend/data/routes.js';
import { buildRoutePreview } from './backend/services/cbs/mockCbsProvider.js';
import { events, eventCategoryCounts } from './backend/data/events.js';
import { weather, buildStatistics, buildChartData } from './backend/data/statistics.js';
import {
  notifications,
  getMonuments as queryMonuments,
  getMonumentsPage,
  getRoutes as queryRoutes,
  getRoutesPage,
  getEvents as queryEvents,
  getEventsPage,
  getEventCalendar,
  searchCatalog,
} from './backend/data/mockDb.js';
import { buildAdminDashboard, reviewAdminRecord } from './backend/data/adminDashboard.js';
import { getUserFavorites, toggleUserFavorite, getUserProfileOverview, updateUserPreferences, getUserRoutes, saveUserRoute } from './backend/data/userData.js';
import { getAboutContent } from './backend/data/aboutContent.js';
import { getHomeContent } from './backend/data/homeContent.js';
import { getPayloadContentStatus, syncPayloadContent } from './backend/services/cms/payloadContentStore.js';
import { createAuthRepository } from './backend/auth/repository.js';
import { createAuthService, AuthenticationError } from './backend/auth/service.js';
import { DtoValidationError } from './backend/auth/dto.js';
import { REFRESH_COOKIE_NAME, USER_ROLES, refreshCookieOptions } from './backend/auth/config.js';
import { authenticateAccessToken, authorizeRoles, parseCookieHeader, serializeCookie } from './backend/auth/middleware.js';

dotenv.config({ path: ['.env', 'cms/.env'] });

const app = express();
app.use(cors({ origin: process.env.PORTAL_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(express.json());

const authRepository = await createAuthRepository();
const authService = createAuthService(authRepository);

const ok = (data, extra = {}) => ({ success: true, data, ...extra });
const fail = (res, msg, code = 500) => res.status(code).json({ success: false, error: msg });
const refreshCookie = (token, overrides = {}) => serializeCookie(REFRESH_COOKIE_NAME, token, { ...refreshCookieOptions(), ...overrides });
const authError = (res, error) => {
  if (error instanceof DtoValidationError) return res.status(400).json({ success: false, error: error.message, fields: error.fields });
  if (error instanceof AuthenticationError) return fail(res, error.message, 401);
  console.error('Kimlik doğrulama hatası:', error);
  return fail(res, 'Giriş işlemi tamamlanamadı.', 500);
};

// --- Kimlik Doğrulama ---
app.post('/api/auth/login', async (req, res) => {
  try {
    const result = await authService.login(req.body);
    res.setHeader('Set-Cookie', refreshCookie(result.refreshToken));
    return res.json(ok(result.response));
  } catch (error) {
    return authError(res, error);
  }
});

app.post('/api/auth/refresh', async (req, res) => {
  try {
    const token = parseCookieHeader(req.headers.cookie)[REFRESH_COOKIE_NAME];
    const result = await authService.refresh(token);
    res.setHeader('Set-Cookie', refreshCookie(result.refreshToken));
    return res.json(ok(result.response));
  } catch (error) {
    res.setHeader('Set-Cookie', refreshCookie('', { maxAge: 0 }));
    return authError(res, error);
  }
});

app.post('/api/auth/logout', async (req, res) => {
  const token = parseCookieHeader(req.headers.cookie)[REFRESH_COOKIE_NAME];
  await authService.logout(token);
  res.setHeader('Set-Cookie', refreshCookie('', { maxAge: 0 }));
  return res.json(ok({ loggedOut: true }));
});

app.get('/api/auth/me', authenticateAccessToken, (req, res) => res.json(ok(req.auth.user)));

// Halk portalındaki bütün içerik istekleri önce Payload/PostgreSQL önbelleğini yeniler.
// İlk bağlantı kurulamadığında kod içindeki örnek veriye sessizce dönülmez.
app.use('/api', async (req, res, next) => {
  if (req.path.startsWith('/auth/') || req.path === '/health' || req.path === '/weather') return next();
  try {
    await syncPayloadContent();
    return next();
  } catch (error) {
    console.error('Payload içerik bağlantısı kurulamadı:', error.message);
    return fail(res, 'İçerik yönetim sistemi şu anda kullanılamıyor. PostgreSQL ve Payload CMS bağlantısını kontrol edin.', 503);
  }
});

app.get('/api/search', (req, res) => {
  res.json(ok(searchCatalog(req.query)));
});

const weatherLabels = {
  0: 'Açık', 1: 'Çoğunlukla açık', 2: 'Parçalı bulutlu', 3: 'Kapalı',
  45: 'Sisli', 48: 'Kırağılı sis', 51: 'Hafif çisenti', 53: 'Çisenti',
  55: 'Yoğun çisenti', 61: 'Hafif yağmurlu', 63: 'Yağmurlu', 65: 'Kuvvetli yağmur',
  71: 'Hafif kar', 73: 'Karlı', 75: 'Yoğun kar', 80: 'Sağanak yağışlı',
  81: 'Sağanak yağışlı', 82: 'Kuvvetli sağanak', 95: 'Gök gürültülü',
  96: 'Dolu ihtimalli fırtına', 99: 'Dolu ve fırtına',
};

async function fetchAntakyaWeather() {
  if (typeof fetch !== 'function') return { ...weather, live: false };
  const params = new URLSearchParams({
    latitude: '36.2021', longitude: '36.1605',
    current: 'temperature_2m,apparent_temperature,weather_code,wind_speed_10m,is_day',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min',
    timezone: 'Europe/Istanbul', forecast_days: '5',
  });
  try {
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
    if (!response.ok) throw new Error(`Weather service ${response.status}`);
    const payload = await response.json();
    const current = payload.current || {};
    const daily = payload.daily || {};
    const condition = weatherLabels[current.weather_code] || 'Değişken hava';
    return {
      temp: Math.round(current.temperature_2m),
      temperature: Math.round(current.temperature_2m),
      desc: condition,
      condition,
      feelsLike: Math.round(current.apparent_temperature),
      windSpeed: Math.round(current.wind_speed_10m),
      isDay: Boolean(current.is_day),
      location: 'Antakya',
      updatedAt: current.time,
      live: true,
      forecast: (daily.time || []).map((date, index) => ({
        date,
        tempMax: Math.round(daily.temperature_2m_max[index]),
        tempMin: Math.round(daily.temperature_2m_min[index]),
        code: daily.weather_code[index],
      })),
    };
  } catch (error) {
    console.warn('Canlı hava durumu alınamadı:', error.message);
    return { ...weather, live: false };
  }
}

// --- GeoJSON / Harita ---
app.get('/api/locations', (req, res) => {
  const { category, district } = req.query;
  let filtered = [...monuments];
  if (category && category !== 'tumu') filtered = filtered.filter((m) => m.category === category);
  if (district) filtered = filtered.filter((m) => m.district === district);
  res.json(ok(monumentsToGeoJSON(filtered), { count: filtered.length }));
});

app.get('/api/locations/:id', (req, res) => {
  const item = monuments.find((m) => m.id === parseInt(req.params.id));
  if (!item) return fail(res, 'Konum bulunamadı', 404);
  res.json(ok(item));
});

app.get('/api/locations/slug/:slug', (req, res) => {
  const item = monuments.find((m) => m.slug === req.params.slug);
  if (!item) return fail(res, 'Konum bulunamadı', 404);
  res.json(ok(item));
});

// --- Tarihi Eserler ---
app.get('/api/monuments', (req, res) => {
  if (req.query.page || req.query.pageSize) return res.json(ok(getMonumentsPage(req.query)));
  const filtered = queryMonuments(req.query);
  res.json(ok(filtered, { count: filtered.length, total: monuments.length }));
});

app.get('/api/monuments/:id', (req, res) => {
  const item = monuments.find((m) => m.id === parseInt(req.params.id));
  if (!item) return fail(res, 'Eser bulunamadı', 404);
  const nearby = monuments
    .filter((m) => m.id !== item.id)
    .slice(0, 3)
    .map((m) => ({ id: m.id, name: m.name, slug: m.slug, distance: m.distance, image: m.image }));
  res.json(ok({ ...item, nearby }));
});

app.get('/api/categories', (_req, res) => {
  res.json(ok(categoryCounts));
});

// --- Kültürel Rotalar ---
app.get('/api/routes', (req, res) => {
  if (req.query.page || req.query.pageSize) return res.json(ok(getRoutesPage(req.query)));
  const filtered = queryRoutes(req.query);
  res.json(ok(filtered, { count: filtered.length }));
});

app.post('/api/routes/preview', (req, res) => {
  const preview = buildRoutePreview({
    monuments,
    stopIds: req.body?.stopIds,
    travelMode: req.body?.travelMode,
    visitMinutes: req.body?.visitMinutes,
    title: req.body?.title,
  });
  res.json(ok(preview));
});

app.get('/api/routes/:id', (req, res) => {
  const route = culturalRoutes.find(
    (r) => r.id === parseInt(req.params.id) || r.slug === req.params.id
  );
  if (!route) return fail(res, 'Rota bulunamadı', 404);
  const preview = buildRoutePreview({
    monuments,
    stopIds: route.monumentIds,
    travelMode: route.travelMode || 'walking',
    routeId: route.id,
    title: route.title,
  });
  res.json(ok({ ...route, ...preview }));
});

app.get('/api/routes/:id/geojson', (req, res) => {
  const route = culturalRoutes.find(
    (r) => r.id === parseInt(req.params.id) || r.slug === req.params.id
  );
  if (!route) return fail(res, 'Rota bulunamadı', 404);
  const preview = buildRoutePreview({
    monuments,
    stopIds: route.monumentIds,
    travelMode: route.travelMode || 'walking',
    routeId: route.id,
    title: route.title,
  });
  res.json(ok(preview.geojson));
});

// --- Etkinlikler ---
app.get('/api/events/calendar', (req, res) => {
  const filtered = getEventCalendar(req.query);
  res.json(ok(filtered, { count: filtered.length }));
});

app.get('/api/events', (req, res) => {
  if (req.query.page || req.query.pageSize) return res.json(ok(getEventsPage(req.query)));
  const filtered = queryEvents(req.query);
  res.json(ok(filtered, { count: filtered.length }));
});

app.get('/api/events/:id', (req, res) => {
  const item = events.find((e) => e.id === parseInt(req.params.id));
  if (!item) return fail(res, 'Etkinlik bulunamadı', 404);
  res.json(ok(item));
});

app.get('/api/events/categories/counts', (_req, res) => {
  res.json(ok(eventCategoryCounts));
});

// --- İstatistikler & Yardımcı ---
app.get('/api/statistics', (_req, res) => res.json(ok(buildStatistics({ monuments, routes: culturalRoutes, events }))));
app.get('/api/weather', async (_req, res) => res.json(ok(await fetchAntakyaWeather())));
app.get('/api/charts', (_req, res) => res.json(ok(buildChartData({ monuments, routes: culturalRoutes, events }))));
app.get('/api/content/about', (_req, res) => res.json(ok(getAboutContent())));
app.get('/api/content/home', (_req, res) => res.json(ok(getHomeContent())));

app.get('/api/admin/dashboard', authenticateAccessToken, authorizeRoles(USER_ROLES.ADMIN, USER_ROLES.EDITOR), async (_req, res) => {
  const cmsStatus = getPayloadContentStatus();
  const sources = { monuments, routes: culturalRoutes, events };
  const statisticsData = buildStatistics(sources);
  const chartsData = buildChartData(sources);
  const dashboard = buildAdminDashboard({ ...sources, statistics: statisticsData, charts: chartsData });
  dashboard.generatedAt = new Date().toISOString();
  dashboard.geojson = monumentsToGeoJSON(monuments);
  dashboard.cms = {
    connected: cmsStatus.ready && !cmsStatus.stale,
    source: 'Payload CMS / PostgreSQL',
    adminUrl: `${(process.env.PAYLOAD_CMS_URL || 'http://localhost:3000').replace(/\/$/, '')}/admin`,
  };
  dashboard.pendingReviews = [];
  dashboard.metrics = dashboard.metrics.map((metric) => metric.key === 'pending' ? { ...metric, value: 0, detail: 'Taslaklar Payload üzerinden yönetilir' } : metric);
  dashboard.systemStatus = dashboard.systemStatus.map((item) => item.key === 'database' ? { ...item, value: 'PostgreSQL' } : item);
  res.json(ok(dashboard));
});

app.post('/api/admin/reviews/:id/decision', authenticateAccessToken, authorizeRoles(USER_ROLES.ADMIN), (req, res) => {
  const reviewed = reviewAdminRecord(req.params.id, req.body?.decision);
  if (!reviewed) return fail(res, 'Onay kaydı veya karar geçersiz', 400);
  return res.json(ok(reviewed));
});

app.get('/api/user/favorites', authenticateAccessToken, authorizeRoles(USER_ROLES.CITIZEN), resUserFavorites);
function resUserFavorites(_req, res) { return res.json(ok(getUserFavorites())); }
app.get('/api/user/profile-overview', authenticateAccessToken, authorizeRoles(USER_ROLES.CITIZEN), (_req, res) => res.json(ok(getUserProfileOverview({ monuments, routes: culturalRoutes, events }))));
app.post('/api/user/preferences', authenticateAccessToken, authorizeRoles(USER_ROLES.CITIZEN), (req, res) => res.json(ok(updateUserPreferences(req.body))));
app.post('/api/user/favorites/:type/:id/toggle', authenticateAccessToken, authorizeRoles(USER_ROLES.CITIZEN), (req, res) => {
  const result = toggleUserFavorite(req.params.type, req.params.id, { monuments, routes: culturalRoutes, events });
  if (!result) return fail(res, 'Favori türü veya kayıt geçersiz', 400);
  return res.json(ok(result));
});
app.get('/api/user/routes', authenticateAccessToken, authorizeRoles(USER_ROLES.CITIZEN), (_req, res) => res.json(ok(getUserRoutes())));
app.post('/api/user/routes', authenticateAccessToken, authorizeRoles(USER_ROLES.CITIZEN), (req, res) => {
  const route = saveUserRoute(req.body || {}, monuments);
  if (!route) return fail(res, 'Rota adı ve en az bir geçerli durak gereklidir', 400);
  return res.status(201).json(ok(route));
});

app.get('/api/news', (_req, res) => {
  res.json(ok(events.slice(0, 3).map((e) => ({
    id: e.id,
    title: e.title,
    content: e.description,
    date: e.date,
    image: e.image
  })), { count: 3 }));
});

async function notificationsForUser(userId) {
  const readIds = new Set(await authRepository.listNotificationReadIds(userId));
  return notifications.map((item) => ({ ...item, read: item.read || readIds.has(item.id) }));
}

app.get('/api/notifications/count', authenticateAccessToken, authorizeRoles(USER_ROLES.CITIZEN), async (req, res) => {
  const items = await notificationsForUser(req.auth.user.id);
  res.json(ok(items.filter((item) => !item.read).length));
});

app.get('/api/notifications', authenticateAccessToken, authorizeRoles(USER_ROLES.CITIZEN), async (req, res) => {
  res.json(ok(await notificationsForUser(req.auth.user.id)));
});

app.post('/api/notifications/:id/read', authenticateAccessToken, authorizeRoles(USER_ROLES.CITIZEN), async (req, res) => {
  const notification = notifications.find((item) => item.id === Number(req.params.id));
  if (!notification) return fail(res, 'Bildirim bulunamadı', 404);
  await authRepository.markNotificationRead(req.auth.user.id, notification.id);
  return res.json(ok({ ...notification, read: true }));
});

app.post('/api/notifications/read-all', authenticateAccessToken, authorizeRoles(USER_ROLES.CITIZEN), async (req, res) => {
  await authRepository.markAllNotificationsRead(req.auth.user.id, notifications.map((item) => item.id));
  res.json(ok(notifications.map((item) => ({ ...item, read: true }))));
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString(), authRepository: authRepository.kind, contentRepository: getPayloadContentStatus() });
});

// CRUD placeholder - gerçek DB entegrasyonu için
app.post('/api/locations', (_req, res) => res.json(ok(null, { message: 'Konum eklendi' })));
app.put('/api/locations/:id', (req, res) => res.json(ok(null, { message: `Konum ${req.params.id} güncellendi` })));
app.delete('/api/locations/:id', (req, res) => res.json(ok(null, { message: `Konum ${req.params.id} silindi` })));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 TKMBS Backend: http://localhost:${PORT}`);
  console.log(`📍 GeoJSON: http://localhost:${PORT}/api/locations`);
  console.log(`🏛️  Eserler: http://localhost:${PORT}/api/monuments\n`);
});
